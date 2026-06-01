# Capítulo de Pruebas Funcionales

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable
**Autor:** Diego Morón Mejía — UCB San Pablo — Taller de Grado 2
**Etapa:** Pruebas con calificación — Sprint 7 completado

---

## 1. Introducción

El sistema propuesto es crítico en términos de confianza, privacidad y correctitud: una falla puede comprometer el secreto del voto, permitir doble votación o alterar el conteo. Por eso el capítulo de pruebas aplica un enfoque en capas que cubre los cuatro tipos obligatorios:

1. Pruebas unitarias
2. Pruebas de integración
3. Pruebas de regresión
4. Pruebas de usabilidad

Cada tipo se justifica, se implementa como evidencia ejecutable y se enlaza a los requisitos funcionales del sistema.

---

## 2. Objetivos

- Validar que cada componente del sistema cumple su contrato funcional.
- Validar que los módulos (backend, contratos, frontend) interoperan correctamente.
- Detectar regresiones al introducir cambios nuevos en sprints posteriores.
- Evaluar la experiencia de usuario del flujo de votación.
- Generar evidencia académica reproducible y versionada.

---

## 3. Alcance

El alcance cubre el sistema completo al cierre del Sprint 7:

- **Backend:** servicios `VotanteService`, `VotoService`, `AdminService`, `EscrutinioService`, `BlockchainService`; librerías `vcAuthority`, `elgamal`, `schnorr`; controladores y rutas Express.
- **Contratos:** `AdminParams`, `NullifierSet`, `BulletinBoard`, `Escrutinio` (incl. `resetearJornada`).
- **Frontend:** páginas `/`, `/verificar`, `/votar`, `/explorer`, `/comprobar`, `/admin` y componente `VotingShell`.
- **Flujo E2E:** landing → autenticación VC → generación Schnorr → emisión → verificación comprobante.
- **Criptografía:** VC ECDSA secp256k1, prueba Schnorr Fiat-Shamir, ElGamal homomórfico, Shamir Secret Sharing.
- **Custodia distribuida:** CredencialCustodio, bundles, aportarCompartimento con buffer en memoria.

Queda fuera de alcance el paquete `circuits` (reservado para extensiones futuras).

---

## 4. Tipos de prueba y su importancia

### 4.1 Pruebas Unitarias

**Importancia.** Garantizan que cada componente individual funcione correctamente desde el principio. Permiten detectar y corregir errores en las primeras etapas del desarrollo, reduciendo el costo de corrección y asegurando que la lógica de negocio aislada (validaciones, reglas, hashing, firmas, matemática criptográfica) sea confiable antes de integrarse.

**Aplicación al proyecto.**
- Validar formato de credencial (`VotanteService.verificarFormatoCredencial`).
- Validar generación y consumo de token anónimo.
- Validar reglas de negocio de `VotoService` (token válido, elección abierta, candidato en rango, anti doble voto).
- Validar `AdminService`: login, hash de contraseña, gestión de candidatos, votantes, jornada.
- Validar matemática Shamir: `dividirSecreto`, `reconstruirSecreto`, round-trip con archivos reales.
- Validar `vcAuthority`: emisión y verificación de VC Electoral y CredencialCustodio (ECDSA).
- Validar `elgamal`: cifrado, suma homomórfica, descifrado.
- Validar `schnorr`: prueba válida y fallos con mensaje diferente, s alterado, tokenPoint incorrecto.

### 4.2 Pruebas de Integración

**Importancia.** Verifican que los diferentes módulos del sistema interactúen correctamente entre sí, asegurando que el sistema funcione como un todo coherente. En este proyecto son clave porque la arquitectura está distribuida: frontend ⇄ backend ⇄ contratos on-chain ⇄ base de datos.

**Aplicación al proyecto.**
- API HTTP Express responde correctamente a todos los endpoints (auth, voto, admin, escrutinio).
- JWT middleware protege correctamente las rutas `/api/admin/*`.
- Backend invoca correctamente al `BlockchainService`.
- Backend persiste sesiones, candidatos, votantes y logs de auditoría en Prisma/SQLite.
- Flujo criptográfico integrado: VC real → token + tokenPoint → Schnorr → ElGamal → boleta on-chain.

### 4.3 Pruebas de Regresión

**Importancia.** Aseguran que los cambios realizados en el sistema no introduzcan errores en las partes previamente verificadas, manteniendo la estabilidad del sistema a lo largo de sprints sucesivos.

**Aplicación al proyecto.**
- Matriz formal REG-001..REG-089 que debe pasar en cada checkpoint.
- Registro histórico de ejecuciones con fecha, commit y resultado.
- Ejecución automatizable: `node scripts/testing/run-all-tests.mjs`.

### 4.4 Pruebas de Usabilidad

**Importancia.** Son esenciales porque el proyecto tiene una interfaz de usuario crítica para ciudadanía. Un sistema técnicamente sólido pero difícil de usar puede fracasar incluso si cumple sus requisitos funcionales.

**Aplicación al proyecto.**
- Protocolo estructurado con tareas, métricas y criterios de aceptación.
- Guión del moderador para asegurar reproducibilidad.
- Registro cuantitativo por participante (éxito, tiempo, errores, satisfacción).

---

## 5. Matriz de trazabilidad requisito → prueba

| Req. Funcional | Descripción | Tipo de prueba | Caso/ID |
|---|---|---|---|
| RF-01 | Validar credencial antes de emitir token | Unitaria | PU-01, PU-02, PU-03, PU-04 |
| RF-02 | Emitir token anónimo de un solo uso | Unitaria + Integración | PU-05, PI-01, PI-02 |
| RF-03 | Verificar que elección esté abierta | Unitaria | PU-06 |
| RF-04 | Impedir doble voto por nullifier | Unitaria + Contrato | PU-07, PC-03 |
| RF-05 | Registrar boleta en blockchain | Integración + Contrato | PI-02, PC-02 |
| RF-06 | Consultar boletas registradas | Integración | PI-03 |
| RF-07 | UI de autenticación renderiza y envía datos | Frontend | PF-01 |
| RF-08 | UI de boleta permite seleccionar y emitir voto | Frontend | PF-02 |
| RF-09 | Explorador muestra boletas on-chain | Frontend + Integración | PF-03, PI-03 |
| RF-10 | Usuario completa el flujo en tiempo razonable | Usabilidad | UX-01..UX-04 |
| RF-11 | Verificar comprobante on-chain por txHash | Unitaria + Integración + E2E | PU-12, PU-13, PI-05..PI-08, PE-07..PE-09 |
| RF-12 | Admin autenticado puede gestionar candidatos y padrón | Unitaria + Integración | PA-admin-01..09, PA-01..PA-12 |
| RF-13 | Admin puede abrir/cerrar jornada electoral | Integración + E2E | PA-01, PA-04, PE-01..PE-09 |
| RF-14 | Escrutinio con Shamir Secret Sharing (5/3) | Unitaria + Integración | REG-049..REG-065 |
| RF-15 | VC firmada con ECDSA secp256k1 (W3C) | Unitaria + Integración | REG-066..069, REG-077, REG-080 |
| RF-16 | Prueba Schnorr no interactiva del token | Unitaria + Integración | REG-073..076, REG-079 |
| RF-17 | Cifrado ElGamal homomórfico del voto | Unitaria + Integración | REG-070..072 |
| RF-18 | Custodia distribuida: CredencialCustodio por delegado | Unitaria | REG-086..089 |
| RF-19 | Reset de jornada para múltiples elecciones | Contrato + Integración | REG-081, REG-082, REG-083..085 |
| RF-20 | Publicación de resultados verificables on-chain | Contrato + Integración | REG-026..029, REG-064, REG-065 |

---

## 6. Casos de prueba

### 6.1 Pruebas unitarias (backend)

#### Sprints 1–3: VotanteService y VotoService

| ID | Descripción | Resultado esperado |
|---|---|---|
| PU-01 | Credencial válida pasa verificación | `valida=true` |
| PU-02 | Padrón con formato incorrecto | `valida=false`, motivo padrón |
| PU-03 | CI con formato incorrecto | `valida=false`, motivo CI |
| PU-04 | Nombre demasiado corto | `valida=false`, motivo nombre |
| PU-05 | `validarToken` rechaza token < 32 chars | `valido=false` |
| PU-06 | `VotoService.emitirVoto` rechaza si elección cerrada | lanza error "elección está cerrada" |
| PU-07 | `VotoService.emitirVoto` rechaza candidato fuera de rango | lanza error "fuera de rango" |
| PU-08 | `VotoService.emitirVoto` rechaza nullifier ya usado | lanza error "doble voto" |
| PU-12 | `VotoService.verificarComprobante` retorna datos cuando txHash existe | objeto con `estado: "registrado"` |
| PU-13 | `VotoService.verificarComprobante` retorna null cuando no encontrado | `null` |

#### Sprint 4: AdminService

| ID | Descripción | Resultado esperado |
|---|---|---|
| PA-admin-01 | Login válido retorna JWT | token + nombre + email |
| PA-admin-02 | Login inválido rechaza | lanza "Credenciales inválidas" |
| PA-admin-07 | `agregarCandidato` asigna índice correcto | índice = 0 o último+1 |
| PA-admin-08 | `agregarVotanteElegible` limpia credencial previa | deleteMany ejecutado antes de create |
| PA-admin-09 | `agregarVotanteElegible` rechaza duplicado | lanza "ya está registrado" |

#### Sprint 5: EscrutinioService (Shamir)

| ID | Descripción | Resultado esperado |
|---|---|---|
| REG-049 | Reconstrucción con N shares completa | secreto == original |
| REG-050 | Reconstrucción con exactamente umbral=3 | secreto == original |
| REG-051 | Compartimentos incorrectos NO reconstruyen | resultado ≠ original |
| REG-052 | `inicializarShares` crea N archivos + config.json | archivos presentes en disco |
| REG-053 | `inicializarShares` lanza si ya inicializado | error "ya fueron inicializados" |
| REG-054 | Round-trip Shamir + archivos reales | hash verificación == hashSecreto |
| REG-055 | `ejecutarEscrutinio` rechaza sin conteo habilitado | lanza "no está habilitado" |
| REG-056 | `ejecutarEscrutinio` rechaza si ya publicado | lanza "ya fueron publicados" |
| REG-057 | `ejecutarEscrutinio` rechaza con < umbral shares | lanza "al menos 3 compartimentos" |

#### Sprint 6: vcAuthority, ElGamal, Schnorr

| ID | Descripción | Resultado esperado |
|---|---|---|
| REG-066 | `emitirVC` genera VC con firma ECDSA válida | proofValue 128 hex, `verificarVC=true` |
| REG-067 | `verificarVC` rechaza VC con proof alterado | `false` |
| REG-068 | `verificarVC` rechaza si nombre o padrón modificados | `false` |
| REG-069 | `emitirVC` es determinista con misma `issuanceDate` | proofValues idénticos |
| REG-070 | ElGamal: cifra voto candidato 0 de 3, descifra `[1,0,0]` | conteos == `[1,0,0]` |
| REG-071 | ElGamal: suma homomórfica 2+1 votos candidatos 0 y 1 | conteos == `[2,1]` |
| REG-072 | ElGamal con clave incorrecta no descifra | excepción al descifrar |
| REG-073 | Schnorr: prueba generada verifica correctamente | `verificarSchnorr=true` |
| REG-074 | Schnorr: falla con mensaje diferente | `false` |
| REG-075 | Schnorr: falla con s alterado | `false` |
| REG-076 | Schnorr: falla con tokenPoint incorrecto | `false` |

#### Sprint 7: CredencialCustodio

| ID | Descripción | Resultado esperado |
|---|---|---|
| REG-086 | `emitirVCCustodio` genera VC con tipo y firma ECDSA | type=`CredencialCustodio`, proofValue 128 hex |
| REG-087 | `verificarVCCustodio` acepta válida y rechaza alterada | `true` / `false` |
| REG-088 | `verificarVCCustodio` rechaza si nombre o índice alterado | `false` |
| REG-089 | `emitirVCCustodio` es determinista con misma `issuanceDate` | proofValue idéntico |

---

### 6.2 Pruebas de integración

#### Sprints 1–3: Auth y Voto

| ID | Descripción | Resultado esperado |
|---|---|---|
| PI-01 | `GET /health` retorna estado ok | 200, `status=ok` |
| PI-02 | `POST /api/auth/verificar-elegibilidad` (mock) emite token | 200, token 64 chars |
| PI-03 | `POST /api/auth/verificar-elegibilidad` con error de negocio | 400, mensaje explícito |
| PI-04 | `GET` a ruta inexistente | 404, "Ruta no encontrada" |
| PI-05 | `GET /api/voto/comprobante` sin txHash | 400, "txHash requerido" |
| PI-06 | `GET /api/voto/comprobante` con formato inválido | 400, "Formato de txHash inválido" |
| PI-07 | `GET /api/voto/comprobante` con txHash no existente | 404 |
| PI-08 | `GET /api/voto/comprobante` con txHash válido | 200, objeto con estado y blockNumber |

#### Sprint 4: Admin

| ID | Descripción | Resultado esperado |
|---|---|---|
| PA-01 | `POST /api/admin/login` con credenciales válidas (mock) | 200 con JWT |
| PA-04 | JWT middleware rechaza sin Authorization | 401 |
| PA-05 | JWT inválido → 401 | `requireAdmin` rechaza |
| PA-07 | `GET /api/admin/candidatos` con JWT válido | 200 con lista |
| PA-11 | `POST /api/admin/padron` retorna VC en respuesta | vc.type contiene `CredencialElectoral` |
| PA-12 | `POST /api/admin/jornada/abrir` + `cerrar` | 200 en ambas operaciones |

#### Sprint 5: Escrutinio

| ID | Descripción | Resultado esperado |
|---|---|---|
| PE-01 (admin) | `GET /api/admin/escrutinio/estado` con token | 200 con campos estado |
| PE-02 (admin) | `GET /api/admin/escrutinio/estado` sin token | 401 |
| PE-03 (admin) | `POST /api/admin/escrutinio/inicializar` mock OK | 200 con `indicesDisponibles[5]` |
| PE-04 (admin) | `POST /api/admin/escrutinio/inicializar` ya existe | 400 |
| PE-05 (admin) | `POST /api/admin/escrutinio/ejecutar` < umbral | 400 validación Zod |
| PE-06 (admin) | `POST /api/admin/escrutinio/ejecutar` error servicio | 400 con mensaje |
| PE-07 (voto) | `GET /api/voto/resultados` no publicado | 200 con `publicado=false` |
| PE-07b (voto) | `GET /api/voto/resultados` publicado | 200 con totalVotos y candidatos[] |

#### Sprint 5: Reset de jornada

| ID | Descripción | Resultado esperado |
|---|---|---|
| REG-083 | `POST /api/admin/escrutinio/resetear` → 200 | numeroJornada y txHash en respuesta |
| REG-084 | `POST /api/admin/escrutinio/resetear` sin token | 401 |
| REG-085 | `POST /api/admin/escrutinio/resetear` si falla | 400 con mensaje |

#### Sprint 6: Criptografía integrada

| ID | Descripción | Resultado esperado |
|---|---|---|
| PS6-01 | `POST /api/auth/verificar-elegibilidad` con VC ECDSA real | 200 con token |
| PS6-02 | `POST /api/auth/verificar-elegibilidad` formato legado | 200 con token |
| PS6-03 | `POST /api/voto/emitir` con schnorrProof en body | 200 emite voto |

---

### 6.3 Pruebas de contratos (Hardhat + Chai)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PC-01 | `AdminParams` guarda candidatos y cierra configuración | lectura == escritura |
| PC-02 | `BulletinBoard.registrarBoleta` almacena boleta | total incrementa |
| PC-03 | `NullifierSet` impide reusar nullifier | revierte con `NullifierYaUsado` |
| PC-04 | `BulletinBoard.eleccionAbierta` refleja estado | lectura consistente |
| PC-05 | `BulletinBoard` rechaza boleta sin nullifier elegible | revierte con `NullifierNoElegible` |
| PC-06 | `Escrutinio.habilitarConteo` + evento | `conteoHabilitado=true` |
| PC-07 | `Escrutinio` rechaza doble habilitación | revierte con `ConteoYaHabilitado` |
| PC-08 | `Escrutinio.publicarResultados` guarda totales | suma correcta + hash evidencias |
| PC-09 | `Escrutinio` impide doble publicación | revierte con `ResultadosYaPublicados` |
| PC-10 | `Escrutinio.resetearJornada` permite nueva jornada | `conteoHabilitado=false` |
| PC-11 | `Escrutinio.resetearJornada` incrementa contador | `numeroJornada` sube en 1 |

---

### 6.4 Pruebas de frontend (Vitest + Testing Library)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PF-00 | `VotingShell` muestra marca "VotoSeguro" en header | texto visible |
| PF-00b | `ProgressStepper` muestra paso correcto | "Paso X de Y" visible |
| PF-01 | `/verificar` renderiza textarea VC + botón habilitado (modo vc) | campos visibles |
| PF-01b | `/verificar` muestra error si API falla | mensaje de error visible |
| PF-01c | `/verificar` redirige a `/votar` en éxito | `router.push` llamado |
| PF-02 | `/votar` muestra candidatos y permite selección | un item activo a la vez |
| PF-02b | `/votar` botón deshabilitado si elección cerrada | botón disabled |
| PF-02c | `/votar` muestra confirmación en éxito | panel de confirmación visible |
| PF-03 | `/explorer` renderiza tabla con filas | filas == N boletas |
| PF-03b | `/explorer` muestra texto vacío sin boletas | "no hay boletas" visible |
| PF-04 | `/comprobar` renderiza formulario + tarjetas en estado idle | formulario y 3 tarjetas visibles |

---

### 6.5 Pruebas E2E (Playwright)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PE-01 | Landing muestra branding, hero y CTA | "VotoSeguro" visible, 3 tarjetas |
| PE-02 | Botones de landing apuntan a rutas correctas | href `/verificar` y `/explorer` |
| PE-03 | Verificar — credencial inválida muestra error | error visible, permanece en `/verificar` |
| PE-04 | Verificar — credencial válida persiste token en localStorage | token y sessionId guardados |
| PE-05 | Votar — selecciona candidato y emite voto | "Voto emitido exitosamente" visible |
| PE-06 | Explorer — muestra boletas registradas | tabla con filas de boleta |
| PE-07 | /comprobar — renderiza formulario e info cards | heading, input y tarjetas visibles |
| PE-08 | /comprobar — txHash no encontrado → 404 | "Boleta no encontrada" visible |
| PE-09 | /comprobar — txHash válido → comprobante | "Voto verificado", boletaId y blockNumber |

---

### 6.6 Pruebas de regresión

Definidas en `MATRIZ_REGRESION.md` (REG-001..REG-089). Se ejecutan antes de cada checkpoint con:

```bash
node scripts/testing/run-all-tests.mjs
```

---

### 6.7 Pruebas de usabilidad

Definidas en `PROTOCOLO_USABILIDAD.md`. Mínimo 3 participantes reales antes de defensa. Ver también `DATOS_USABILIDAD.csv` y `usabilidad/GUION_MODERADOR.md`.

---

## 7. Criterios de aceptación

| Dimensión | Objetivo mínimo |
|---|---|
| Cobertura unitaria (`VotanteService`) | ≥ 70% |
| Cobertura unitaria (`VotoService`) | ≥ 70% |
| Tests de integración | 100% del endpoint público cubierto |
| Tests de contratos | 1 test funcional por función externa |
| Regresión por checkpoint | 100% de casos críticos verdes |
| Usabilidad | ≥ 80% de éxito en flujo, tiempo medio ≤ 3 min, satisfacción ≥ 4/5 |

---

## 8. Herramientas utilizadas

| Capa | Herramienta |
|---|---|
| Backend unitarias + integración | Vitest + Supertest |
| Contratos | Hardhat + Chai + hardhat-chai-matchers |
| Frontend | Vitest + @testing-library/react |
| Cobertura | `@vitest/coverage-v8` |
| E2E | Playwright (pruebas PE-01..PE-09) |
| Usabilidad | Protocolo presencial + CSV |

---

## 9. Ejecución local de pruebas

Desde `votacion-tesis/`:

```bash
yarn install

# Backend (unitarias + integración)
yarn workspace @votacion/backend test

# Cobertura backend
yarn workspace @votacion/backend test:coverage

# Contratos
yarn workspace @votacion/hardhat test

# Frontend componentes
yarn workspace @votacion/nextjs test

# E2E (requiere dev server activo)
yarn workspace @votacion/nextjs test:e2e

# Suite completa + reporte fechado
node scripts/testing/run-all-tests.mjs
```

---

## 10. Reporte de resultados

Cada ejecución completa produce un archivo fechado bajo:

```
docs/testing/resultados/RESULTADO_<YYYY-MM-DD>.md
```

Ese archivo contiene:

- Commit evaluado.
- Resumen de tests pasados/fallidos por capa.
- Cobertura total y por módulo.
- Observaciones y acciones correctivas.

---

## 11. Criterio de avance por checkpoint

No se cerrará un checkpoint sin:

- Pruebas unitarias backend en verde.
- Pruebas de integración API en verde.
- Pruebas de contratos en verde.
- Pruebas de frontend en verde (al menos smoke por página).
- Matriz de regresión actualizada.
- Protocolo de usabilidad ejecutado al menos 1 vez antes de la defensa final.

---

## 12. Resumen de resultados históricos

| Checkpoint | Commit | Backend | Contratos | Frontend | E2E | Casos REG |
|---|---|---|---|---|---|---|
| 2026-04-27 | `160806f` | 18/18 | 5/5 | 26/26 | — | 25/25 |
| 2026-04-30 | `ab141ff` | 33/33 | 10/10 | 26/26 | — | 29/29 |
| 2026-05-07 | `890af51` | 62/62 | 10/10 | 26/26 | 9/9 | 48/48 |
| 2026-05-10 Sprint 5 | `e3f7537` | 86/86 | 10/10 | 26/26 | — | 65/65 |
| 2026-05-10 Sprint 6 | `e3f7537` | 113/113 | 10/10 | 27/27 | — | 80/80 |
| 2026-05-10 Sprint 7 | `e3f7537` | 122/122 | 12/12 | 27/27 | 9/9 | 90/90 |

**Crecimiento total:** de 49 pruebas (primer checkpoint) a 170 al cierre del Sprint 7 — incremento del 247% sin regresiones.
