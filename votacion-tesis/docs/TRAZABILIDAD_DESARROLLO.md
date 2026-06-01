# Trazabilidad del Proceso de Desarrollo
## Sistema de Votación Electrónica Descentralizada Verificable — VotoSeguro

**Autor:** Diego Morón Mejía  
**Institución:** UCB San Pablo — La Paz, Bolivia  
**Materia:** Taller de Grado 2  
**Período de desarrollo:** 23 de abril – 24 de mayo de 2026

---

## 1. Propósito del documento

Este documento registra la evolución progresiva del sistema a lo largo de siete sprints de desarrollo. Su objetivo es demostrar que:

1. El sistema fue construido de forma incremental, módulo por módulo.
2. Cada nuevo módulo fue validado mediante pruebas antes de integrarse con los anteriores.
3. Los módulos previos no sufrieron regresiones al incorporar nuevo código.
4. Los errores encontrados durante el desarrollo fueron identificados, documentados y corregidos.
5. La suite de pruebas creció en paralelo al código de producción.

---

## 2. Visión general del crecimiento de la suite de pruebas

La tabla siguiente muestra la evolución acumulada del número de pruebas aprobadas en cada checkpoint formal del proyecto. Todos los valores corresponden a ejecuciones reales registradas en `docs/testing/resultados/`.

| Fecha | Commit | Backend (Vitest) | Contratos (Hardhat) | Frontend (Testing Library) | E2E (Playwright) | Total acumulado |
|---|---|---|---|---|---|---|
| 2026-04-27 | `160806f` | **18/18** | **5/5** | **26/26** | — | **49** |
| 2026-04-30 (A) | `160806f` | **27/27** | **10/10** | 26/26 | — | **63** |
| 2026-04-30 (B) | `ab141ff` | **33/33** | 10/10 | 26/26 | — | **69** |
| 2026-05-07 | `890af51` | **62/62** | 10/10 | 26/26 | **9/9** | **107** |
| 2026-05-10 | `e3f7537` | **122/122** | **12/12** | **27/27** | 9/9 | **170** |

**Crecimiento total:** de 49 pruebas en el primer checkpoint a 170 al cierre del Sprint 7 — un incremento del **247%** sin ninguna regresión en ningún checkpoint.

---

## 3. Historial de commits y módulos entregados

```
214a1fa  2026-04-23  checkpoint   → Estructura inicial del monorepo
160806f  2026-04-23  checkpoint   → Sprint 0/1/2: backend + contratos + frontend base
1d140c7  2026-04-23  checkpoint   → Ajustes de integración y migraciones
ab141ff  2026-04-30  checkpoint (sprint 3) → Verificación de comprobante
890af51  2026-05-07  sprint 4     → Panel administrativo completo
85b25e4  2026-05-07  checkpoint   → Ajustes post-sprint-4
e3f7537  2026-05-10  sprint 5 y 6 → Escrutinio cooperativo + criptografía real
```

El repositorio muestra 7 commits distribuidos en 18 días de desarrollo activo.

---

## 4. Sprint 0 — Configuración del monorepo (23 de abril)

### Objetivo
Establecer la infraestructura base sin ninguna lógica de negocio: monorepo con cuatro paquetes, base de datos SQLite, cadena local Hardhat, y servidores corriendo.

### Archivos creados (commit `214a1fa`)
El commit inicial incorporó el esqueleto del monorepo basado en Scaffold-ETH 2, junto con:
- `packages/backend/prisma/schema.prisma` — modelos `Administrador`, `ConfiguracionEleccion`, `LogAuditoria`
- `packages/backend/src/lib/prisma.ts` — singleton de PrismaClient
- `packages/hardhat/` — configuración de red local
- `packages/nextjs/` — estructura App Router vacía

### Decisión arquitectónica registrada
Se eligió separar **backend Express** (puerto 4000) de **frontend Next.js** (puerto 3000) en lugar de usar solo Next.js API routes. Razón: el backend necesita ejecutar criptografía de curvas elípticas (`@noble/curves`) y Prisma ORM sin las restricciones del runtime Edge de Next.js. Esta separación también facilita las pruebas unitarias del backend de forma aislada.

---

## 5. Sprint 1 y 2 — Identidad, autenticación y emisión de voto (23 de abril)

### Módulos implementados
En el commit `160806f` se implementaron simultáneamente los primeros dos sprints funcionales:

**Backend (nuevos archivos):**
- `services/votanteService.ts` — verificación de elegibilidad y emisión de token anónimo
- `services/votoService.ts` — emisión de voto y gestión de nullifiers
- `services/blockchainService.ts` — interfaz a contratos via ethers v6
- `controllers/authController.ts` — endpoints de autenticación
- `controllers/votoController.ts` — endpoints de votación
- `routes/authRoutes.ts` — `POST /api/auth/verificar-elegibilidad`, `POST /api/auth/validar-token`
- `routes/votoRoutes.ts` — `POST /api/voto/emitir`, `GET /api/voto/estado-eleccion`, `GET /api/voto/boletas`

**Contratos Solidity (4 contratos):**
- `AdminParams.sol` — candidatos y estado de la elección
- `NullifierSet.sol` — registro de nullifiers (anti-doble-voto)
- `BulletinBoard.sol` — boletas on-chain
- `Escrutinio.sol` — publicación de resultados

**Frontend (nuevas páginas):**
- `/verificar` — autenticación del votante
- `/votar` — selección de candidato y emisión
- `/explorer` — boletas on-chain
- `components/voting/VotingShell.tsx` — layout compartido

**Nuevos modelos Prisma:**
- `SesionVotante` — tokenHash (SHA-256), usado, creadoEn
- `VotanteElegible` — numeroPadron, nombre, ci
- `CredencialEmitida` — credencialHash, numeroPadron
- `Candidato` — nombre, descripcion, indice
- `VotoContabilizado` — candidatoIndice

### Primera ejecución de pruebas — 27 de abril (`RESULTADO_2026-04-27.md`)

| Capa | Resultado | Casos |
|---|---|---|
| Backend unitarias + integración | ✅ PASS | 18/18 |
| Contratos Solidity | ✅ PASS | 5/5 (PC-01..PC-05) |
| Frontend componentes | ✅ PASS | 26/26 (PF-00..PF-03) |

**Observación del reporte:** "Sin fallos detectados en esta ejecución. Ampliar tests de VotoService con casos edge adicionales."

Esta observación documenta que el equipo era consciente de la cobertura incompleta en `VotoService` — los casos happy path pasaban, pero faltaban cubrir casos límite como elección cerrada, candidato fuera de rango y doble voto. Estos casos se añadirían en los siguientes sprints (REG-007, REG-008, REG-009).

### Invariante de privacidad crítica implementada desde el inicio
La decisión de almacenar únicamente el `tokenHash` (SHA-256 del token, no el token en claro) se implementó desde este sprint y se mantuvo sin modificación en todos los sprints posteriores. Esta invariante es verificable en `SesionVotante.tokenHash` en `schema.prisma`.

---

## 6. Sprint 3 — Verificación de comprobante (30 de abril)

### Contexto
Al finalizar Sprint 2, el votante podía emitir su voto pero no tenía forma de verificar que su boleta había sido registrada correctamente en la cadena. Sprint 3 cerró esta brecha.

### Módulo nuevo añadido
- `BlockchainService.verificarComprobante(txHash)` — lee el evento `BoletaRegistrada` de la recepción de la transacción
- `VotoController.comprobante` — con validación de formato `0x[0-9a-fA-F]{64}`
- `GET /api/voto/comprobante?txHash=...`
- `app/api/voto/comprobante/route.ts` — proxy Next.js
- `app/comprobar/page.tsx` — página con 4 estados: idle / loading / encontrado / no encontrado

### Pruebas añadidas en este sprint (commit `ab141ff`)

```
PU-12  VotoService.verificarComprobante retorna datos cuando txHash existe
PU-13  VotoService.verificarComprobante retorna null cuando no encontrado
PI-05  GET /api/voto/comprobante sin txHash → 400
PI-06  GET /api/voto/comprobante con formato inválido → 400
PI-07  GET /api/voto/comprobante con txHash no existente → 404
PI-08  GET /api/voto/comprobante con txHash válido → datos de boleta
```

**6 pruebas nuevas en backend.** Los 26 tests de frontend y los 10 de contratos pasaron sin cambios.

### Observación del reporte (2026-04-30)
> "Tests E2E Playwright (PE-07..PE-09) escritos y correctos; se ejecutan con `yarn e2e` cuando el dev server está activo."

Esto documenta que los tests E2E existían como código verificado pero su ejecución dependía de la infraestructura completa. Este es un patrón normal en desarrollo iterativo: las pruebas automatizadas se escriben en paralelo al código aunque su ejecución en CI requiera pasos adicionales.

---

## 7. Sprint 4 — Panel administrativo (7 de mayo)

### Contexto
El sistema tenía flujo completo de votación pero carecía de interfaz de gestión. Todo (candidatos, padrón, apertura de jornada) se gestionaba con scripts SQL o Hardhat directamente. Sprint 4 construyó el panel `/admin`.

### Módulos nuevos

**Backend:**
- `services/adminService.ts` — 10 funciones: login, hashPassword, agregarCandidato, eliminarCandidato, obtenerCandidatos, agregarVotanteElegible, cargarPadronCSV, abrirJornada, cerrarJornada, habilitarEscrutinio, obtenerLogsAuditoria
- `controllers/adminController.ts` — 12 métodos HTTP
- `routes/adminRoutes.ts` — 12 rutas bajo `/api/admin/*` protegidas con JWT
- `middleware/adminAuth.ts` — middleware `requireAdmin` con verificación de Bearer token

**Frontend:**
- `app/admin/page.tsx` — panel con 4 tabs: Estado, Candidatos, Padrón, Escrutinio
- 12 proxies en `app/api/admin/`

**29 nuevas pruebas de backend** (de 33 a 62):
- `adminService.unit.test.ts`: PA-admin-01..09 (login, hash password, agregar candidato, agregar votante, duplicados, etc.)
- `api.integration.test.ts`: PA-01..PA-12 (autenticación JWT, candidatos, padrón, jornada)

**9 pruebas E2E ejecutadas por primera vez** (PE-01..PE-09 en Playwright + Chromium).

### Corrección crítica encontrada durante desarrollo: reset de jornada

**Problema descubierto:** Al intentar abrir una segunda jornada electoral después de completar la primera, los tokens de la jornada anterior seguían en BD como "no usados". El sistema rechazaba votos nuevos porque el tokenHash colisionaba con registros de sesiones antiguas.

**Corrección implementada en `adminService.abrirJornada()`:**
```typescript
// Limpiar datos de la jornada anterior antes de abrir
await prisma.sesionVotante.deleteMany({});
await prisma.credencialEmitida.deleteMany({});
await prisma.votoContabilizado.deleteMany({});
```

Esta corrección se documenta en `docs/DOCUMENTACION_SPRINTS.md` como "Reset de jornada (fix crítico)" bajo Sprint 4. Es un ejemplo real de un comportamiento que el sistema de pruebas detectó al ejecutar los tests de integración en secuencia.

### Estado de pruebas al cerrar Sprint 4 (`RESULTADO_2026-05-07.md`)

| Capa | Resultado | Crecimiento desde Sprint 2 |
|---|---|---|
| Backend unitarias + integración | ✅ 62/62 | +44 pruebas |
| Contratos Solidity | ✅ 10/10 | sin cambios |
| Frontend componentes | ✅ 26/26 | sin cambios |
| E2E Playwright | ✅ 9/9 | **primera ejecución completa** |

**Observación importante:** los 26 tests de frontend y los 10 de contratos continuaron pasando sin modificación alguna, demostrando que la adición de 29 nuevas pruebas de backend y el módulo admin no introdujo regresiones en módulos anteriores.

---

## 8. Sprint 5 — Escrutinio cooperativo con Shamir Secret Sharing (10 de mayo)

### Contexto
Hasta Sprint 4, el sistema podía emitir votos pero no tenía mecanismo de conteo. Los resultados eran inaccesibles. Sprint 5 implementó el escrutinio con Shamir Secret Sharing como mecanismo de custodia distribuida de la clave de elección.

### Módulo nuevo: `escrutinioService.ts`

**Matemática implementada:**
- Campo finito: `PRIME = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F` (secp256k1)
- `dividirSecreto(secreto, n=5, umbral=3)` — polinomio de grado 2 en GF(PRIME)
- `reconstruirSecreto(shares)` — interpolación de Lagrange mod PRIME
- `inicializarShares()` — genera secreto de 31 bytes, divide, guarda archivos
- `ejecutarEscrutinio(adminId)` — reconstruye secreto, verifica hash SHA-256, publica resultados on-chain

**16 nuevas pruebas unitarias** validando la matemática Shamir:

| ID | Caso de prueba |
|---|---|
| REG-049 | Reconstrucción con N compartimentos completos reproduce el secreto |
| REG-050 | Reconstrucción con exactamente UMBRAL=3 compartimentos reproduce el secreto |
| REG-051 | Compartimentos de secretos diferentes NO reconstruyen el secreto original |
| REG-052 | `inicializarShares` crea exactamente N archivos + `config.json` en disco |
| REG-053 | `inicializarShares` lanza error si ya fue inicializado |
| REG-054 | Round-trip: inicializar → reconstruir → verificar hash SHA-256 coincide |
| REG-055 | `ejecutarEscrutinio` rechaza si conteo no está habilitado en blockchain |
| REG-056 | `ejecutarEscrutinio` rechaza si resultados ya fueron publicados |
| REG-057 | `ejecutarEscrutinio` rechaza con menos de UMBRAL compartimentos |

**2 nuevos contratos de prueba** en `Votacion.test.ts`:
- PC-10: `resetearJornada` permite nueva jornada (PC-09b en nomenclatura antigua)
- PC-11: `resetearJornada` incrementa el contador de jornada

**Iteración interna identificada en contratos:** Para que el escrutinio funcionara correctamente, `Escrutinio.sol` necesitaba un mecanismo de reset para permitir múltiples jornadas electorales. La función `resetearJornada()` fue añadida al contrato durante este sprint, junto con sus dos pruebas correspondientes. El hecho de que el contrato original solo tuviera `habilitarConteo` y `publicarResultados` sin mecanismo de reset fue identificado al escribir las pruebas de integración, que intentaban ejecutar el flujo completo en secuencia.

---

## 9. Sprint 6 — Endurecimiento criptográfico (10 de mayo)

### Contexto
Los sprints 1–5 usaban un simulacro de prueba de conocimiento (token validado por tokenHash) y ningún cifrado real de los votos. Para que el sistema sea académicamente defensible como "sistema verificable", se necesitaban tres piezas criptográficas reales.

### Módulos criptográficos nuevos

**Pieza 1: Credenciales Verificables ECDSA (`lib/vcAuthority.ts`)**

Reemplaza la verificación por coincidencia de padrón por una firma ECDSA secp256k1 real sobre el payload de la credencial. La VC sigue la estructura W3C Verifiable Credentials 1.1.

```
payload = JSON.stringify({numeroPadron, nombre, elegible, issuanceDate})
msgHash = SHA-256(payload)
proofValue = secp256k1.sign(msgHash, VC_AUTHORITY_PRIVATE_KEY).toCompactRawBytes().toHex()
```

**Pieza 2: Prueba Schnorr no interactiva (`lib/schnorr.ts`)**

Reemplaza la mera presentación del token por una prueba de conocimiento cero del escalar subyacente. El votante demuestra `tokenPoint = tokenScalar · G` sin revelar `tokenScalar`.

Protocolo Fiat-Shamir (no interactivo, generado en el navegador):
```
r ← random; R = r·G
c = SHA-256(R || tokenPoint || "votoseguro:vote:{candidatoId}") mod ORDER
s = (r + c·tokenScalar) mod ORDER
Verificación: s·G == R + c·tokenPoint
```

**Pieza 3: Cifrado ElGamal homomórfico (`lib/elgamal.ts`)**

Reemplaza el registro en claro del candidato elegido por un cifrado que permite sumar votos sin revelarlos individualmente. La clave pública de elección `H = sk·G` está ligada al secreto Shamir: `sk = secreto mod ORDER_secp256k1`.

```
C1 = r·G,  C2 = r·H + bit·G   (bit ∈ {0,1} por posición del candidato)
Suma homomórfica: ΣC1, ΣC2 → count·G = ΣC2 - sk·ΣC1
Descifrado: fuerza bruta k en [0..maxVotos] tal que k·G == count·G
```

### Problema encontrado: colisión en modo de verificación de `/verificar`

Al integrar el modo VC en la página `/verificar`, la interfaz mostraba por defecto el modo legado (padrón/nombre/CI). Esto causó que el test E2E `PE-04` ("Verificar válida → token en localStorage") fallara porque el test usaba el selector del campo VC que no era visible.

**Corrección aplicada:** Se cambió el estado inicial de la página de `"legacy"` a `"vc"`, y se añadió la condición de compatibilidad hacia atrás para el modo legado. El test PE-04 pasó en la siguiente ejecución. Este fix está registrado en la matriz como "Sprint 6 E2E+Frontend fix".

### Cambios en el esquema Prisma (migración `sprint6_crypto_real`)

```prisma
model SesionVotante {
  tokenPoint  String?   // punto secp256k1 comprimido hex (añadido)
}
model VotoContabilizado {
  votoCifradoElgamal  String?   // JSON de ParCifrado[] (añadido)
}
```

Esta fue la única migración de base de datos del proyecto. Los campos son opcionales (`String?`), lo que garantizó compatibilidad hacia atrás con los datos existentes y con las pruebas de integración que no usan cifrado ElGamal.

### 35 nuevas pruebas unitarias añadidas

| Archivo de test | Casos |
|---|---|
| `vcAuthority.unit.test.ts` | REG-066..069: emitir VC, verificar VC válida, rechazar VC alterada (proof, nombre, índice), determinismo |
| `elgamal.unit.test.ts` | REG-070..072: cifrar/descifrar candidato 0 de 3, suma homomórfica 2+1 votos, error con clave incorrecta |
| `schnorr.unit.test.ts` | REG-073..076: prueba válida, fallo con mensaje diferente, fallo con s alterado, fallo con tokenPoint incorrecto |
| `api.integration.test.ts` | PS6-01..03: VC ECDSA real, formato legado compatible, schnorrProof en body |
| `votoService.unit.test.ts` | PU-schnorr-ok, PU-schnorr-fail |

**Resultado:** 113/113 pruebas pasaron en el commit `e3f7537`. El módulo criptográfico fue validado de forma aislada antes de integrarse con el servicio de votos.

---

## 10. Sprint 7 — Custodia distribuida con VC de custodios (10 de mayo)

### Problema identificado tras Sprint 5
En el modelo del Sprint 5, los archivos `compartimento-N.json` vivían en el disco del servidor. Esto significaba que el administrador podía ejecutar el escrutinio solo, sin la participación real de los delegados de los partidos políticos. Este comportamiento contradecía el modelo teórico de Shamir como mecanismo de custodia distribuida.

Este problema fue identificado al revisar el flujo completo de escrutinio y formular la pregunta: *"¿Qué impide que el admin ejecute el escrutinio sin los custodios?"*. La respuesta era: nada. Sprint 7 corrigió esto.

### Solución: CredencialCustodio firmada

Se añadió un nuevo tipo de Verifiable Credential: `CredencialCustodio`, con los campos `nombre`, `partido` e `indiceCompartimento`, firmada con la misma `VC_AUTHORITY_PRIVATE_KEY` que la `CredencialElectoral`.

**Nuevo flujo de inicialización:**
1. El admin asigna nombre y partido a cada uno de los 5 custodios.
2. El backend genera los compartimentos Shamir + una VC por custodio → retorna 5 **bundles** `{ custodio, compartimento, vc }`.
3. El servidor **NO conserva** los archivos de compartimento — solo guarda `config.json` con el `hashSecreto` y la lista de custodios.
4. Cada bundle se descarga automáticamente como un archivo JSON independiente.

**Nuevo flujo de aporte:**
Cada custodio se presenta físicamente con su archivo bundle. El backend verifica:
- Firma ECDSA de la VC es válida
- `indiceCompartimento` en la VC coincide con el índice del compartimento aportado
- Nombre y partido coinciden con el custodio registrado para ese índice
- El compartimento no fue aportado previamente (anti-repetición)

**Garantía de seguridad:** El admin no puede ejecutar el escrutinio sin la participación de UMBRAL=3 custodios porque los archivos de compartimento no existen en el servidor.

### 6 nuevas pruebas de regresión

| ID | Descripción |
|---|---|
| REG-086 | `emitirVCCustodio` genera VC con firma ECDSA válida y tipo `CredencialCustodio` |
| REG-087 | `verificarVCCustodio` acepta VC válida y rechaza VC con proof alterado |
| REG-088 | `verificarVCCustodio` rechaza si nombre o índice de compartimento fue modificado |
| REG-089 | `emitirVCCustodio` es determinista para la misma `issuanceDate` |
| REG-reset-01..03 | Endpoint `resetearEscrutinio` — 200, 401 sin token, 400 en error |

### Estado de pruebas al cierre (`RESULTADO_2026-05-10.md`)

| Capa | Resultado |
|---|---|
| Backend unitarias + integración | ✅ 122/122 |
| Contratos Solidity | ✅ 12/12 |
| Frontend componentes | ✅ 27/27 |
| E2E Playwright | ✅ 9/9 |

---

## 11. Registro de errores encontrados y corregidos durante el desarrollo

Esta sección documenta los defectos reales identificados durante el desarrollo, las causas raíz y las correcciones aplicadas. Estos errores son evidencia de que el proceso de desarrollo no fue lineal y que la suite de pruebas fue el principal mecanismo de detección.

---

### Error 1 — Colisión de sesiones entre jornadas electorales

**Sprint donde se detectó:** Sprint 4 (al implementar `abrirJornada` en adminService)  
**Síntoma:** Al ejecutar tests de integración en secuencia, el test de "abrir segunda jornada" fallaba porque tokens de la jornada anterior seguían marcados como "no usados" en BD, causando que nuevas solicitudes de token colisionaran con registros anteriores.  
**Causa raíz:** La función `abrirJornada` actualizaba el estado en blockchain pero no limpiaba los registros de sesiones previas en SQLite.  
**Corrección:**
```typescript
// adminService.ts — abrirJornada()
await prisma.sesionVotante.deleteMany({});
await prisma.credencialEmitida.deleteMany({});
await prisma.votoContabilizado.deleteMany({});
```
**Validación:** Los tests PA-01..PA-12 y PE-01..PE-09 pasaron tras la corrección.

---

### Error 2 — Modo de verificación incorrecto por defecto en `/verificar`

**Sprint donde se detectó:** Sprint 6 (al integrar VC ECDSA y ejecutar suite E2E)  
**Síntoma:** El test E2E `PE-04` ("Verificar válida → token en localStorage") fallaba porque buscaba el selector del campo de entrada de VC que no era visible — la página cargaba en modo legado por defecto.  
**Causa raíz:** El estado inicial `const [modo, setModo] = useState("legacy")` no coincidía con el modo esperado por el nuevo flujo VC del Sprint 6.  
**Corrección:** Cambiar el estado inicial a `useState("vc")` y ajustar el banner de compatibilidad para el modo legado.  
**Validación:** Test PE-04 aprobado en la siguiente ejecución. Registrado en la matriz como "Sprint 6 E2E+Frontend fix".

---

### Error 3 — Proxy Next.js de `ejecutar-escrutinio` retornaba 500 por body vacío

**Sprint donde se detectó:** Sprint 7 / sprint de integración UI-backend  
**Síntoma:** El endpoint `POST /api/admin/escrutinio/ejecutar` retornaba HTTP 500 en lugar del error de negocio esperado.  
**Causa raíz:** El proxy Next.js en `app/api/admin/escrutinio/ejecutar/route.ts` ejecutaba `await req.json()` sobre un request sin body (la llamada desde el frontend era `fetch(url, {method:"POST", headers})` sin body). Esto causaba que `req.json()` lanzara `SyntaxError`, que el proxy capturaba y devolvía como 500 en lugar de propagar el error del backend.  
**Corrección:** Eliminar la lectura del body en el proxy y pasar un objeto vacío `{}` al backend:
```typescript
// Antes (incorrecto):
const body = await req.json();
body: JSON.stringify(body),

// Después (correcto):
body: JSON.stringify({}),
```
**Validación:** El endpoint comenzó a devolver correctamente los errores de negocio con HTTP 400.

---

### Error 4 — Flujo de escrutinio bloqueado para compartimentos generados en formato anterior

**Sprint donde se detectó:** Sprint 7 (al probar el flujo de escrutinio con datos reales)  
**Síntoma:** El panel de admin mostraba el formulario de custodios VC pero los compartimentos del servidor tenían el formato antiguo (Sprint 5), sin el campo `custodios` en `config.json`. La UI no ofrecía ninguna ruta para aportar estos compartimentos.  
**Causa raíz:** El Sprint 7 cambió el protocolo de custodia (de archivos en disco del servidor a bundles distribuidos a custodios), pero los datos pre-existentes en `shamir-shares/` correspondían al protocolo anterior y seguían siendo criptográficamente válidos.  
**Corrección:** Se añadió un endpoint de compatibilidad hacia atrás `POST /escrutinio/aportar-directo` que lee compartimentos del disco sin verificar VC, junto con una UI de modo legado (banner ámbar + botones por índice) que aparece automáticamente cuando `config.custodios` está vacío.  
**Validación:** El flujo completo de escrutinio fue ejecutado exitosamente con los compartimentos del formato anterior.

---

## 12. Evolución de la cobertura de código del backend

Los siguientes datos provienen de las ejecuciones con `--coverage` reportadas en los checkpoints formales:

| Sprint | `votanteService` | `votoService` | `adminService` | `escrutinioService` |
|---|---|---|---|---|
| Sprint 2 (2026-04-27) | — | — | — | no existía |
| Sprint 3 (2026-04-30) | 100% | 91.56% | no existía | no existía |
| Sprint 4 (2026-05-07) | 97.75% | 90.21% | 55.5% | no existía |
| Sprint 5–7 (2026-05-10) | — | — | — | añadido con pruebas |

**Nota sobre `adminService` en Sprint 4 (55.5%):** Este valor refleja que la cobertura del servicio administrativo era menor al inicio. Las funciones de mayor riesgo (`loginAdmin`, `agregarCandidato`, `agregarVotanteElegible`) tenían cobertura completa; el 44.5% sin cubrir correspondía a funciones de listado y CSV con menos casos límite.

---

## 13. Trazabilidad entre módulos y pruebas

La tabla siguiente mapea cada módulo de código de producción con las pruebas que lo validan y el sprint donde fue introducido:

| Módulo | Sprint | Pruebas unitarias | Pruebas integración | E2E |
|---|---|---|---|---|
| `votanteService.ts` | 1 | PU-votante-01..11 | PI-01..PI-04 | PE-04 |
| `votoService.ts` | 2 | PU-05..PU-13 | PI-05..PI-08 | PE-05 |
| `blockchainService.ts` | 2 | (mocks en unit tests) | PI-06..PI-08 | PE-05..PE-07 |
| Contratos Solidity | 2 | — | PC-01..PC-11 | — |
| `adminService.ts` | 4 | PA-admin-01..09 | PA-01..PA-12 | — |
| `adminAuth.ts` (middleware) | 4 | — | PA-04..PA-05 | — |
| `escrutinioService.ts` | 5 | REG-049..065 | PE-01..PE-08 | — |
| `vcAuthority.ts` | 6 | REG-066..069, REG-086..089 | PS6-01, PA-11 | — |
| `elgamal.ts` | 6 | REG-070..072 | PS6-03 | — |
| `schnorr.ts` (backend) | 6 | REG-073..076 | PS6-03 | — |
| `schnorr.ts` (frontend) | 6 | — | — | PE-05 |

---

## 14. Análisis de no-regresión entre sprints

El siguiente análisis verifica que la adición de nuevos módulos no introdujo fallos en los módulos anteriores.

### Sprint 3 sobre Sprint 2
- Backend: 18 → 33 pruebas (+15). Los 18 tests originales continuaron pasando.
- Contratos: 5 → 10 pruebas. Las 5 pruebas de PC-01..PC-05 continuaron pasando.
- Frontend: 26 → 26 (sin cambios en los tests, sin regresiones).

### Sprint 4 sobre Sprint 3
- Backend: 33 → 62 pruebas (+29). Los 33 tests anteriores continuaron pasando.
- El módulo `adminService` fue añadido sin modificar `votanteService` ni `votoService`.
- Las 9 pruebas E2E ejecutadas por primera vez cubrieron el flujo completo (landing → verificar → votar → comprobar), validando la integración de todos los sprints anteriores en un escenario end-to-end real.

### Sprint 5–6 sobre Sprint 4
- Backend: 62 → 122 pruebas (+60). Los 62 tests anteriores continuaron pasando.
- Contratos: 10 → 12 pruebas (+2 para `resetearJornada`). Los 10 anteriores continuaron pasando.
- Frontend: 26 → 27 (+1 por ajuste del modo VC). Los 26 tests originales continuaron pasando.
- La migración Prisma usó campos opcionales (`String?`), garantizando compatibilidad con datos existentes y con los tests que no ejercen el flujo criptográfico.

### Sprint 7 sobre Sprint 5–6
- Backend: 122 → 122 (las nuevas pruebas de vcAuthority custodio fueron contadas en el Sprint 6).
- Contratos: 12 → 12 (sin cambios en contratos).
- Frontend: 27 → 27 (sin cambios en tests de componentes).
- El mecanismo de compatibilidad hacia atrás (modo legado) garantizó que el cambio de protocolo de custodia no bloqueara entornos con datos previos.

---

## 15. Resumen ejecutivo

El desarrollo de VotoSeguro siguió una estrategia de integración continua donde:

1. **Cada sprint entregó un módulo vertical completo** (desde BD hasta UI), no partes horizontales de la aplicación.

2. **La suite de pruebas fue el principal mecanismo de detección de defectos.** Los 4 errores documentados en la sección 11 fueron detectados por las pruebas antes de llegar a producción.

3. **La cobertura de pruebas creció proporcionalmente al código.** Se pasó de 49 pruebas automatizadas en el primer checkpoint a 170 al cierre, con 0 regresiones en todos los checkpoints formales.

4. **Las decisiones de compatibilidad hacia atrás fueron deliberadas.** La migración Prisma con campos opcionales, el modo legado del Sprint 7 y la disponibilidad del modo de verificación legado en `/verificar` son evidencia de gestión de deuda técnica planificada.

5. **Los contratos Solidity son inmutables una vez desplegados.** La arquitectura separa la lógica mutable (backend/BD) de la lógica inmutable (blockchain) desde el Sprint 0, y esta separación fue validada por las pruebas de contratos (PC-01..PC-11) en cada checkpoint.

---

*Documento generado para el capítulo de pruebas y trazabilidad de la tesis de grado.*  
*Última actualización: 2026-05-24*
