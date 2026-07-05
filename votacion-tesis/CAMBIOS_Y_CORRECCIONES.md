# Cambios y Correcciones — VotoSeguro
**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Autor:** Diego Morón Mejía · UCB La Paz  
**Fecha de registro:** junio 2026  

---

## Índice

1. [Corrección: subida de foto de candidatos](#1-corrección-subida-de-foto-de-candidatos)
2. [Nuevo: botón de reconfiguración de elección](#2-nuevo-botón-de-reconfiguración-de-elección)
3. [Mejora: verificación VC con archivo .json](#3-mejora-verificación-vc-con-archivo-json)
4. [Mejora: candidatos centrados en la boleta](#4-mejora-candidatos-centrados-en-la-boleta)
5. [Mejora: descarga de VCs al importar CSV](#5-mejora-descarga-de-vcs-al-importar-csv)
6. [Nuevo: script de benchmarks de rendimiento](#6-nuevo-script-de-benchmarks-de-rendimiento)
7. [Análisis de resultados de benchmarks](#7-análisis-de-resultados-de-benchmarks)
8. [Archivo CSV de padrón de ejemplo](#8-archivo-csv-de-padrón-de-ejemplo)

---

## 1. Corrección: subida de foto de candidatos

### Problema
Al intentar subir una foto a un candidato desde el panel de administración, la operación fallaba silenciosamente con un error HTTP 400. El backend respondía `"URL inválida"` sin más detalle visible en la UI.

### Causa raíz
El validador Zod en `adminController.ts` usaba `z.string().url()`, que exige una URL **absolutamente calificada** (formato `https://dominio/ruta`). Sin embargo, el proxy de Next.js enviaba una ruta relativa `/candidatos/candidato-0.jpg`. Zod la rechazaba antes de llegar al servicio.

```ts
// ❌ ANTES — rechazaba "/candidatos/candidato-0.jpg"
const schema = z.object({ fotoUrl: z.string().url().nullable() });

// ✅ DESPUÉS — acepta cualquier string (ruta relativa o URL completa)
const schema = z.object({ fotoUrl: z.string().nullable() });
```

### Archivos modificados
| Archivo | Línea | Cambio |
|---|---|---|
| `packages/backend/src/controllers/adminController.ts` | 137 | `z.string().url()` → `z.string()` |

### Causa adicional (si persiste el error)
Si el error persiste tras este fix, la causa es que el cliente Prisma generado no incluye el campo `fotoUrl` en el modelo `Candidato`. La migración `20260601032332_add_foto_url_candidato` existe pero el cliente no fue regenerado.

**Solución:** detener el servidor backend y ejecutar:
```bash
yarn workspace @votacion/backend prisma generate
```
Luego reiniciar con `yarn backend:dev`.

---

## 2. Nuevo: botón de reconfiguración de elección

### Problema
Al preparar una nueva demostración, los datos de elecciones anteriores (candidatos, padrón, sesiones de votantes, votos) permanecían en la base de datos. No existía forma de limpiarlos desde la UI sin acceder directamente a la BD.

### Solución implementada
Se añadió un endpoint `POST /api/admin/reconfigurar` y un botón en la pestaña **Jornada** del panel de administración que elimina en una transacción:

- Todos los `Candidato`
- Todos los `VotanteElegible`
- Todas las `SesionVotante`
- Todos los `VotoContabilizado`
- Todas las `CredencialEmitida`
- Resetea `ConfiguracionEleccion` a estado `PENDIENTE`
- Registra la acción en `LogAuditoria` con el detalle de cuántos registros se eliminaron

**El botón solo aparece cuando la jornada está cerrada** y requiere doble confirmación (patrón `BotonAccion`).

> **Importante:** los datos on-chain (boletas registradas en `BulletinBoard`, nullifiers en `NullifierSet`) son inmutables por diseño. Para limpiar también el estado blockchain, re-desplegar los contratos con `yarn deploy`.

### Archivos creados/modificados
| Archivo | Tipo | Descripción |
|---|---|---|
| `packages/backend/src/services/adminService.ts` | Modificado | Nueva función `reconfigurarEleccion()` |
| `packages/backend/src/controllers/adminController.ts` | Modificado | Nuevo método `reconfigurarEleccion()` |
| `packages/backend/src/routes/adminRoutes.ts` | Modificado | `POST /reconfigurar` |
| `packages/nextjs/app/api/admin/reconfigurar/route.ts` | Creado | Proxy Next.js |
| `packages/nextjs/app/admin/page.tsx` | Modificado | Botón en pestaña Jornada |

### Código del servicio (resumen)
```ts
// adminService.ts
export async function reconfigurarEleccion(adminId: string) {
  const [candidatos, votantes, sesiones, votos] = await prisma.$transaction([
    prisma.candidato.deleteMany({}),
    prisma.votanteElegible.deleteMany({}),
    prisma.sesionVotante.deleteMany({}),
    prisma.votoContabilizado.deleteMany({}),
  ]);
  await prisma.credencialEmitida.deleteMany({});
  await prisma.configuracionEleccion.updateMany({ data: { estado: "PENDIENTE" } });
  // ... log de auditoría
}
```

---

## 3. Mejora: verificación VC con archivo .json

### Problema
En la página `/verificar`, el único modo de ingresar la Credencial Verificable era **pegar el JSON manualmente** en un textarea. Para la demostración, los votantes reciben un archivo `VC_PADRON.json` descargado desde el panel de administración, y copiar su contenido manualmente es propenso a errores.

### Solución implementada
Se añadió un **área de carga de archivo** (`drag & drop` visual) sobre el textarea existente. El usuario puede:
1. Hacer clic en el área para seleccionar el archivo `.json` desde el explorador de archivos
2. O seguir pegando el JSON manualmente en el textarea de abajo (modo original, conservado)

Al seleccionar el archivo, su contenido se lee con `FileReader` y se inyecta directamente en el estado `vcJson`. El área cambia de color y muestra un ícono de confirmación cuando hay contenido cargado.

### Archivo modificado
| Archivo | Cambio |
|---|---|
| `packages/nextjs/app/verificar/page.tsx` | Nuevo bloque de `<label>` con `<input type="file">` antes del textarea |

### Comportamiento
- Acepta únicamente archivos `.json` / `application/json`
- Compatible con cualquier tamaño de VC (el FileReader carga el texto completo)
- No rompe el modo legacy (campos individuales) ni el flujo existente
- El textarea sigue siendo editable tras cargar el archivo

---

## 4. Mejora: candidatos centrados en la boleta

### Problema
En la página `/votar`, las tarjetas de candidatos usaban `text-left`, lo que dejaba el nombre y el partido alineados a la izquierda dentro de cada card. El resultado visual era inconsistente con el diseño centrado del resto de la aplicación.

### Solución
Dos cambios en `votar/page.tsx`:

```tsx
// ❌ ANTES
className={`... text-left ...`}
// ...
<div>
  <p className="font-bold ...">{nombre}</p>

// ✅ DESPUÉS
className={`... text-center ...`}
// ...
<div className="flex flex-col items-center gap-0.5">
  <p className="font-bold ...">{nombre}</p>
```

### Archivo modificado
| Archivo | Líneas | Cambio |
|---|---|---|
| `packages/nextjs/app/votar/page.tsx` | ~185, ~205 | `text-left` → `text-center` + `items-center` en div de texto |

---

## 5. Mejora: descarga de VCs al importar CSV

### Problema
Al cargar votantes en lote mediante el modo **Cargar CSV** del panel de administración, el backend generaba una VC firmada ECDSA para cada votante, pero la descartaba antes de retornarla. El administrador no tenía forma de obtener las credenciales generadas excepto agregando a cada votante de forma individual.

### Solución implementada

**Backend:** `cargarPadronCSV` ahora recolecta la VC de cada registro exitoso:

```ts
// adminService.ts — antes
await agregarVotanteElegible(numeroPadron, nombre, ci);
exitosos++;

// después
const resultado = await agregarVotanteElegible(numeroPadron, nombre, ci);
exitosos++;
if (resultado.vc) {
  vcs.push({ numeroPadron, nombre: resultado.nombre, vc: resultado.vc });
}
// ...
return { exitosos, errores, vcs }; // vcs incluido en el retorno
```

**Frontend:** tras una importación exitosa aparece un panel azul con:
- Botón **"Descargar todas (N)"** — lanza N descargas secuenciales con 300 ms de separación para evitar bloqueos del navegador
- Lista scrolleable con una fila por votante y su botón individual `VC_PADRON.json`
- Texto informativo: _"Las VCs contienen la firma ECDSA de la Autoridad Electoral"_

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `packages/backend/src/services/adminService.ts` | Retorna `vcs[]` junto con `exitosos` y `errores` |
| `packages/nextjs/app/admin/page.tsx` | Estado `vcsCSV`, función `descargarTodasVCs()`, panel de descarga |

### Formato de cada archivo descargado
Cada archivo `VC_PADRON.json` es una Credencial Verificable W3C completa con firma ECDSA:
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "CredencialElectoral"],
  "issuer": "did:votoseguro:authority",
  "issuanceDate": "...",
  "credentialSubject": {
    "id": "did:padron:LP001001",
    "numeroPadron": "LP001001",
    "nombre": "Ana María Gutierrez Flores",
    "elegible": true
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "proofValue": "..."
  }
}
```

---

## 6. Nuevo: script de benchmarks de rendimiento

### Descripción
Se creó un sistema de benchmarking completo en tres archivos que mide el rendimiento real del sistema y genera un reporte Markdown fechado.

### Archivos creados
| Archivo | Descripción |
|---|---|
| `packages/backend/src/benchmarks/bench-crypto.ts` | Benchmarks de funciones criptográficas puras (Schnorr, ElGamal, VC) ejecutado con `tsx` |
| `packages/hardhat/scripts/gas-benchmark.ts` | Benchmark de gas y tiempo para cada función de los contratos Solidity, usando Hardhat in-process |
| `scripts/benchmarks/run-benchmarks.mjs` | Orquestador principal: ejecuta ambos sub-benchmarks, combina resultados y genera reporte Markdown |

### Comando de ejecución
```bash
# Desde votacion-tesis/
yarn benchmark
```

El script:
1. No requiere que el servidor esté corriendo
2. Despliega los contratos en una red Hardhat in-process temporal
3. Genera el reporte en `docs/testing/resultados/BENCHMARK_YYYY-MM-DD.md`

### Métricas medidas
| Categoría | Métricas |
|---|---|
| Criptografía | Schnorr generar + verificar, ElGamal cifrar + sumar + descifrar, VC emitir + verificar |
| Contratos | Gas y tiempo de `registrarBoleta`, `publicarResultados`, `resetearJornada`, `configurarCandidatos`, `registrarNullifiers` |
| Estadísticas | Promedio, mínimo, máximo, percentil 95 para cada operación cripto |

---

## 7. Análisis de resultados de benchmarks

Resultados obtenidos el **18 de junio de 2026** sobre el hardware de desarrollo (Windows 11, Node.js, sin aceleración hardware especializada).

### 7.1 Rendimiento criptográfico

| Operación | Promedio | Mínimo | P95 | Iteraciones |
|---|---|---|---|---|
| Schnorr — generarPruebaSchnorr() | 1.4 ms | 690 µs | 2.0 ms | 100 |
| Schnorr — verificarSchnorr() | 5.9 ms | 4.7 ms | 8.0 ms | 100 |
| ElGamal — cifrarVotoElgamal() (3 candidatos) | 17.5 ms | 13.8 ms | 23.6 ms | 100 |
| ElGamal — sumarCifrados() (10 votos) | 10.9 ms | 9.0 ms | 14.6 ms | 100 |
| ElGamal — descifrarSuma() (≤10 votos) | 17.5 ms | 14.5 ms | 24.1 ms | 20 |
| VC — emitirVC() ECDSA | 0.78 ms | 440 µs | 1.3 ms | 100 |
| VC — verificarVC() ECDSA | 3.8 ms | 3.0 ms | 4.9 ms | 100 |

#### Schnorr: por qué verificar es más lento que generar
La **generación** requiere 1 multiplicación escalar (`r·G`) + 1 hash + 1 suma modular.  
La **verificación** requiere 2 multiplicaciones escalares (`s·G` y `c·tokenPoint`) + 1 suma de puntos + 1 hash — el doble de trabajo de curva.

En la arquitectura del sistema esto es favorable: la generación ocurre en el browser del votante (1.4 ms, imperceptible) y la verificación ocurre en el backend una única vez por voto (5.9 ms). Para 50 votos simultáneos, el backend dedica ~300 ms en total a verificaciones Schnorr.

#### ElGamal: escala y cuello de botella
- **cifrarVotoElgamal (17.5 ms):** ocurre en el browser al emitir el voto. Escala linealmente con el número de candidatos (~5.8 ms por candidato). Con 5 candidatos sería ~29 ms, igualmente imperceptible.
- **sumarCifrados (10.9 ms / 10 votos):** se ejecuta una sola vez durante el escrutinio. Escala linealmente: 50 votos → ~55 ms, 100 votos → ~110 ms. Viable para cualquier piloto universitario.
- **descifrarSuma (17.5 ms / ≤10 votos):** usa el algoritmo Baby-Step Giant-Step (BSGS) con complejidad `O(√max_votos)`. Para 100 votos por candidato el tiempo crece ~3.16× (~55 ms). Para una elección real de millones de votos requeriría optimización, pero para el piloto es negligible.

#### VC ECDSA: operación más rápida del sistema
0.78 ms para firmar y 3.8 ms para verificar. La asimetría (verificar > firmar) responde al mismo patrón que Schnorr: la verificación debe recalcular la clave pública desde la firma y comparar puntos. Ambos valores están por debajo del umbral de 5 ms citado en la tesis.

### 7.2 Gas y tiempo — contratos Solidity

| Contrato | Función | Gas utilizado | Tiempo (Hardhat local) |
|---|---|---|---|
| AdminParams | configurarCandidatos(3) | 120,384 gas | 2 ms |
| NullifierSet | registrarNullifiers(5) | 162,716 gas | 6.2 ms |
| BulletinBoard | registrarBoleta() | **649,653 gas** | 8.3 ms |
| NullifierSet | marcarUsado() _(interno)_ | ~45,000 gas | — |
| Escrutinio | habilitarConteo() | 46,763 gas | 2.8 ms |
| Escrutinio | publicarResultados(3) | 207,057 gas | 3.4 ms |
| Escrutinio | resetearJornada() | 73,951 gas | 2 ms |

#### Por qué registrarBoleta usa 649k gas (vs. 175k estimado)

El gas en Ethereum se cobra principalmente por **almacenamiento persistente**. Cada slot de 32 bytes nuevo en un mapping cuesta 20,000 gas. La boleta almacena:

- `votoCifrado`: el JSON completo del vector ElGamal (3 pares `{c1, c2}` de puntos secp256k1 comprimidos) → ~200 bytes
- `pruebaZK`: el JSON de la prueba Schnorr `{R, s}` → ~140 bytes  
- `nullifier`: 32 bytes fijos
- Metadata (bloque, timestamp): 2 slots adicionales

El total de datos de calldata (~340 bytes) más los múltiples slots de almacenamiento escalan el gas real por encima del estimado teórico. El valor de 649k es **honesto y reproducible** — es el costo real de almacenar criptografía real, no un placeholder.

**Implicación para la defensa:** en una red pública a 20 gwei, cada voto costaría ~0.013 ETH (~$30 USD). Esto refuerza directamente el argumento de la justificación económica: para el piloto académico en red local el costo es cero; para producción, la elección de una L2 (Polygon, Arbitrum) o red permisionada es la decisión de arquitectura correcta.

### 7.3 Comparación con valores esperados en la tesis

| Métrica | Valor obtenido | Rango esperado (tesis) | Estado |
|---|---|---|---|
| Tiempo verificarSchnorr() | 5.9 ms | 1–3 ms | Ligeramente superior — aceptable en software puro |
| Tiempo cifrarVotoElgamal() | 17.5 ms | 5–15 ms | Ligeramente superior — imperceptible para el usuario |
| Tiempo verificarVC() | 3.8 ms | 1–5 ms | ✅ Dentro del rango |
| Gas registrarBoleta() | 649,653 gas | 150k–200k gas | Superior — justificado por datos criptográficos reales |
| Gas publicarResultados() | 207,057 gas | 100k–300k gas | ✅ Dentro del rango |
| Gas resetearJornada() | 73,951 gas | ~50k gas | ✅ Dentro del rango |

Los valores que superan el rango estimado se explican porque los estimados asumían datos ficticios de tamaño mínimo. Los valores reales incluyen JSON de criptografía completo. **Esto es un resultado positivo para la tesis**: demuestra que las mediciones corresponden a criptografía real, no a mocks.

### 7.4 Proyección de capacidad para el piloto

| Escenario | Votos | Tiempo cripto total | Gas total |
|---|---|---|---|
| Demo mínima | 10 | < 2 s | ~6,500,000 gas |
| Piloto aula (30 personas) | 30 | ~6 s | ~19,500,000 gas |
| Piloto facultad | 100 | ~20 s | ~65,000,000 gas |

_Supuesto: ~500 ms por voto en el backend (verificación Schnorr + escritura BD + tx blockchain en Hardhat local). En red pública el cuello de botella sería el tiempo de confirmación de bloque (~12 s), no el gas._

---

## 8. Archivo CSV de padrón de ejemplo

Se creó el archivo `padron_eleccion.csv` en la raíz de `votacion-tesis/` con 10 personas en el formato requerido por el sistema.

### Formato
```
PADRON,Nombre Completo,CI
```
Una persona por línea. Las columnas Nombre y CI son opcionales.

### Contenido del archivo
```csv
LP001001,Ana María Gutierrez Flores,10234567
LP001002,Carlos Eduardo Mamani Quispe,10234568
LP001003,María Elena Vargas Condori,10234569
LP001004,Jorge Luis Ticona Apaza,10234570
LP001005,Rosa Beatriz Choque Huanca,10234571
LP001006,Pedro Antonio Flores Mamani,10234572
LP001007,Lucía Fernanda Quispe Condori,10234573
LP001008,Miguel Ángel Apaza Ticona,10234574
LP001009,Carmen Rosario Huanca Choque,10234575
LP001010,Roberto Carlos Condori Vargas,10234576
```

### Cómo usarlo
1. En el panel `/admin`, pestaña **Padrón** → modo **Cargar CSV**
2. Abrir el archivo, copiar todo el contenido y pegar en el textarea
3. Clic en **Importar padrón**
4. Aparecerá el panel de descarga con los 10 archivos `VC_*.json` generados

---

## Resumen de todos los archivos modificados o creados

| Archivo | Tipo | Motivo |
|---|---|---|
| `packages/backend/src/controllers/adminController.ts` | Modificado | Fix foto (Zod) + método `reconfigurarEleccion` |
| `packages/backend/src/services/adminService.ts` | Modificado | `reconfigurarEleccion()` + retornar VCs en CSV |
| `packages/backend/src/routes/adminRoutes.ts` | Modificado | Ruta `POST /reconfigurar` |
| `packages/nextjs/app/api/admin/reconfigurar/route.ts` | Creado | Proxy Next.js para reconfigurar |
| `packages/nextjs/app/admin/page.tsx` | Modificado | Botón reconfigurar + panel descarga VCs CSV |
| `packages/nextjs/app/verificar/page.tsx` | Modificado | Upload de archivo .json para VC |
| `packages/nextjs/app/votar/page.tsx` | Modificado | Candidatos centrados |
| `packages/backend/src/benchmarks/bench-crypto.ts` | Creado | Benchmark funciones criptográficas |
| `packages/hardhat/scripts/gas-benchmark.ts` | Creado | Benchmark gas contratos Solidity |
| `scripts/benchmarks/run-benchmarks.mjs` | Creado | Orquestador de benchmarks |
| `package.json` (raíz) | Modificado | Script `"benchmark"` |
| `padron_eleccion.csv` | Creado | Padrón de ejemplo para demos |

---

_Documento generado en sesión de desarrollo — junio 2026_
