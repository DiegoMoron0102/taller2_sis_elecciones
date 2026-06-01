# CLAUDE.md

> Archivo de contexto para Claude Code. Léelo completo antes de cualquier acción.
> Si una instrucción de este archivo entra en conflicto con la petición del usuario,
> **pregúntale antes de actuar**.

---

## 1. Identidad del proyecto

- **Nombre:** Sistema de Votación Electrónica Descentralizada Verificable
- **Tipo:** Proyecto de Grado (Taller de Grado 2)
- **Universidad:** UCB San Pablo — La Paz, Bolivia
- **Carrera:** Ingeniería de Sistemas
- **Autor:** Diego Morón Mejía
- **Repo:** `github.com/DiegoMoron0102/taller2_sis_elecciones`
- **Branding del producto:** "VotoSeguro"
- **Idioma de código y documentación:** español (variables, comentarios, mensajes UI).
  El idioma técnico (nombres de funciones públicas estándar, palabras clave) se mantiene en inglés.

---

## 2. Objetivo académico

Construir un prototipo funcional, demostrable y reproducible que combine:

- Verificación de elegibilidad mediante Credenciales Verificables W3C firmadas (ECDSA, no mocks).
- Voto anónimo cifrado con ElGamal real sobre BN254 (homomórfico, no hash simulado).
- Pruebas de conocimiento cero reales en Noir (commitment / nullifier / Merkle), inspiradas en Semaphore.
- Registro inmutable on-chain con anti doble voto vía nullifier set.
- Escrutinio cooperativo simulado con Shamir Secret Sharing entre archivos locales.
- Paquete de evidencias reproducible por un tercero (capítulo de pruebas).

**Principio rector:** todo lo cripto debe ser real (no simulado con `keccak256` o strings random)
porque la tesis se defiende como sistema verificable, no como demo visual.

---

## 3. Stack y arquitectura

### 3.1 Monorepo (Yarn 4 workspaces, basado en Scaffold-ETH 2)

```
votacion-tesis/
├─ packages/
│  ├─ hardhat/    # @votacion/hardhat   — Solidity 0.8.x + Hardhat
│  ├─ nextjs/     # @votacion/nextjs    — Next.js 15 + React 19 + TS + Tailwind 4
│  ├─ backend/    # @votacion/backend   — Express + Prisma + SQLite
│  └─ circuits/   # @votacion/circuits  — Noir + NoirJS + Barretenberg
├─ docs/
│  └─ testing/    # plan, matriz regresión, protocolo usabilidad, resultados
└─ scripts/
   └─ testing/    # run-all-tests.mjs (genera RESULTADO_<fecha>.md)
```

### 3.2 Tecnologías por paquete

| Paquete | Stack principal | Propósito |
|---|---|---|
| `@votacion/hardhat` | Solidity 0.8.x, Hardhat 2.28, ethers v6, Chai | Contratos y despliegue |
| `@votacion/nextjs` | Next.js 15.2 (App Router), React 19, Tailwind 4, daisyUI 5, wagmi 2, viem 2, RainbowKit 2 | Frontend votante y explorador |
| `@votacion/backend` | Express 4.21, Prisma 5.22, SQLite, Zod, ethers v6, `@noble/curves` | API REST, sesiones, auditoría, integración blockchain |
| `@votacion/circuits` | Noir, `nargo`, Barretenberg `bb` | Circuitos ZK |

### 3.3 Contratos (en `packages/hardhat/contracts/`)

- **`AdminParams.sol`** — candidatos, clave pública de elección, configuración finalizada/no.
- **`NullifierSet.sol`** — registro de nullifiers elegibles + consumidos. Anti doble voto.
- **`BulletinBoard.sol`** — boletas (votoCifrado + pruebaZK + nullifier). Estados Setup/Open/Closed.
- **`Escrutinio.sol`** — habilitar conteo y publicar resultados con hash de evidencias.

Despliegue: `packages/hardhat/deploy/00_deploy_votacion.ts`.
Configuración inicial: `packages/hardhat/scripts/setupElection.ts` (candidatos + apertura).

### 3.4 Backend (en `packages/backend/src/`)

```
src/
├─ index.ts                    # Express app + middleware (helmet, cors, json)
├─ routes/
│  ├─ authRoutes.ts             # /api/auth/*
│  └─ votoRoutes.ts             # /api/voto/*
├─ controllers/
│  ├─ authController.ts
│  └─ votoController.ts
├─ services/
│  ├─ votanteService.ts         # verificarFormatoCredencial, emitirTokenAnonimo, validarToken
│  ├─ votoService.ts            # emitirVoto, estadoEleccion, verificarComprobante
│  └─ blockchainService.ts      # interfaz a contratos (ethers v6)
├─ lib/prisma.ts                # singleton de PrismaClient
├─ integration/
│  └─ api.integration.test.ts   # Supertest sobre la app real
└─ types/
```

Modelos Prisma: `Administrador`, `ConfiguracionEleccion`, `LogAuditoria`, `SesionVotante`, `CredencialEmitida`.

**Regla crítica de privacidad:** ningún modelo guarda IP, vínculo identidad↔voto ni datos personales en blockchain.

### 3.5 Frontend (en `packages/nextjs/app/`)

Páginas:

- `/` — landing con branding VotoSeguro (3 tarjetas de valor + CTAs).
- `/verificar` — autenticación con SSI/VC.
- `/votar` — selección de candidato y emisión.
- `/explorer` — boletas registradas on-chain.
- `/comprobar` — verificación de comprobante por txHash.
- `/blockexplorer` — explorador genérico (de Scaffold-ETH 2, intacto).
- `/debug` — debug de contratos (de Scaffold-ETH 2, intacto).

Componente shell: `components/voting/VotingShell.tsx` (header, footer, `ProgressStepper`).

Proxies API en `app/api/`: `auth/verificar-elegibilidad`, `voto/emitir`, `voto/estado-eleccion`, `voto/boletas`, `voto/comprobante` → reenvían a `http://localhost:4000`.

---

## 4. Branding visual (debe respetarse en cualquier UI nueva)

- **Nombre del producto:** VotoSeguro.
- **Tipografía:** Public Sans (Google Fonts).
- **Color primario:** `#197fe6` (azul).
- **Iconos:** Material Symbols Outlined.
- **Layout:** contenedor `max-w-[800px]`, cards `rounded-xl shadow-sm`.
- **Progreso:** stepper con texto "Paso X de Y".
- **Tema:** dual claro/oscuro vía `next-themes`.

Si creas una vista nueva, **úsalo dentro de `<VotingShell>`** y respeta el stepper.

---

## 5. Comandos esenciales

> **Todos los comandos se ejecutan desde `votacion-tesis/`** (la raíz del monorepo).
> No uses `cd` en scripts ni en sugerencias; usa `yarn workspace <nombre> <script>`.

### 5.1 Setup

```bash
yarn install
yarn workspace @votacion/backend prisma:generate
yarn workspace @votacion/backend prisma:migrate
```

### 5.2 Levantar entorno completo (4 terminales)

```bash
# Terminal 1 — Cadena local Hardhat
yarn chain

# Terminal 2 — Despliegue de contratos (una sola vez por sesión de chain)
yarn deploy

# (Opcional) Configurar elección con candidatos y abrirla
yarn workspace @votacion/hardhat hardhat run scripts/setupElection.ts --network localhost

# Terminal 3 — Backend Express (puerto 4000)
yarn backend:dev

# Terminal 4 — Frontend Next.js (puerto 3000)
yarn start
```

URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Hardhat RPC: `http://127.0.0.1:8545`

### 5.3 Tests (orden recomendado al cerrar un cambio)

```bash
yarn workspace @votacion/backend test            # 33 casos (Vitest + Supertest)
yarn workspace @votacion/hardhat test            # 10 casos (Hardhat + Chai)
yarn workspace @votacion/nextjs test             # 26 casos (Vitest + Testing Library)
yarn workspace @votacion/nextjs test:e2e         # 9 casos Playwright (requiere dev server)
yarn workspace @votacion/backend test:coverage   # cobertura backend

# Full suite + reporte fechado
node scripts/testing/run-all-tests.mjs
```

El script genera `docs/testing/resultados/RESULTADO_<YYYY-MM-DD>.md`.

### 5.4 Lint y formato

```bash
yarn lint                       # next + hardhat
yarn format                     # prettier en ambos
yarn workspace @votacion/nextjs check-types
yarn workspace @votacion/hardhat check-types
```

### 5.5 Circuitos (cuando entren al alcance)

```bash
yarn circuits:compile           # nargo compile
yarn workspace @votacion/circuits vk         # write_vk con --oracle_hash keccak
yarn workspace @votacion/circuits verifier   # genera Verifier.sol en hardhat/contracts
```

---

## 6. Convenciones de código

### 6.1 General

- TypeScript estricto en backend y frontend. **Sin `any` salvo en mocks de tests.**
- Solidity 0.8.x con custom errors (no strings en `revert`). Ya hay precedente: `NullifierYaUsado`, `NullifierNoElegible`, `ConteoYaHabilitado`, `ResultadosYaPublicados`, `ConteoNoHabilitado`.
- Imports siempre al tope del archivo.
- Comentarios y mensajes de error: en español.
- Identificadores: en español cuando es lógica de dominio (`emitirVoto`, `nullifier`, `boleta`, `padron`); inglés cuando es estándar técnico (`tokenHash`, `txHash`, `blockNumber`).

### 6.2 Backend (Express)

- Capas: `route → controller → service → (prisma | blockchainService)`.
- Validación de entrada con Zod en el controller.
- Errores de negocio: lanzar `Error` con mensaje claro en español; el controller lo traduce a HTTP 400.
- Logs de auditoría: cada acción crítica (`TOKEN_EMITIDO`, `VOTO_EMITIDO`, etc.) escribe en `LogAuditoria`.
- **Nunca** loguear el token en claro, solo `tokenHash`.

### 6.3 Frontend (Next.js)

- App Router (no Pages Router).
- Componentes cliente solo cuando hace falta (`"use client"`).
- Llamadas a backend siempre vía proxies en `app/api/*` (no fetch directo desde el cliente al puerto 4000).
- Estilo: Tailwind 4 + daisyUI 5. Color primario `#197fe6`.
- Persistencia de sesión: `localStorage` con claves `votingToken` y `votingSessionId`.

### 6.4 Contratos

- Cada contrato tiene un único responsable (`AdminParams` configura, `NullifierSet` valida, `BulletinBoard` registra, `Escrutinio` cuenta).
- Wiring entre contratos vía setters (`setNullifierSet`, `setEmisorDeBoletas`).
- Eventos legibles: `BoletaRegistrada`, `ConteoHabilitado`, `ResultadosPublicados`.
- Nunca exponer claves privadas o seeds reales en código.

---

## 7. Testing — disciplina obligatoria

El proyecto tiene un capítulo de pruebas **calificado**. Las cuatro categorías obligatorias son:

| Tipo | Herramienta | Ubicación |
|---|---|---|
| Unitarias | Vitest | `packages/backend/src/**/*.unit.test.ts` |
| Integración | Vitest + Supertest | `packages/backend/src/integration/*.test.ts` |
| Contratos | Hardhat + Chai | `packages/hardhat/test/*.test.ts` |
| Frontend componentes | Vitest + Testing Library | `packages/nextjs/tests/*.test.tsx` |
| E2E | Playwright | `packages/nextjs/e2e/*.spec.ts` |
| Regresión | Matriz formal | `docs/testing/MATRIZ_REGRESION.md` (REG-001..REG-029) |
| Usabilidad | Protocolo presencial | `docs/testing/PROTOCOLO_USABILIDAD.md` |

### Reglas de oro

1. **Nunca borres ni debilites tests existentes** sin pedir permiso explícito.
2. Antes de cualquier cambio funcional, ejecuta la suite afectada. Después del cambio, ejecútala de nuevo.
3. Toda nueva ruta backend debe tener su test de integración en `api.integration.test.ts`.
4. Toda nueva regla de negocio en un service debe tener su unit test.
5. Todo nuevo contrato o función externa debe tener al menos un test PC en `Votacion.test.ts`.
6. Antes de cerrar un sprint o checkpoint:
   - `node scripts/testing/run-all-tests.mjs`
   - Actualiza `docs/testing/MATRIZ_REGRESION.md` con la fila de fecha/commit.
   - El reporte fechado queda en `docs/testing/resultados/`.

### Estado actual de la suite

- Backend: **33/33** (`votanteService 100%`, `votoService 91.56%`).
- Contratos: **10/10** (PC-01..PC-09 + PC-09b).
- Frontend componentes: **26/26**.
- E2E Playwright: **9/9** escritos (PE-01..PE-09).
- Regresión: **29/29**.

---

## 8. Sprints (roadmap)

| Sprint | Estado | Entregable |
|---|---|---|
| 0 — Setup | ✅ | Monorepo + Prisma + chain local |
| 1 — Identidad | ✅ | `verificar-elegibilidad`, `validar-token`, sesión anónima |
| 2 — Emisión | ✅ | `emitir`, `estado-eleccion`, `boletas` + contratos en cadena |
| 3 — Verificación | ✅ | `comprobante` + página `/comprobar` |
| 4 — Panel admin | ⏳ | abrir/cerrar jornada, habilitar escrutinio |
| 5 — Escrutinio cooperativo | ⏳ | Shamir + publicación de resultados |
| 6 — Endurecimiento cripto | ⏳ | Noir real + ElGamal real + VC firmadas |
| 7 — Piloto y defensa | ⏳ | usabilidad presencial + paquete de evidencias |

---

## 9. Reglas de comportamiento para Claude Code

### 9.1 Permisos del usuario

- **No hacer `git push` jamás sin autorización explícita** del usuario en el mensaje actual.
  El usuario lo dijo de forma directa: "no hagas push por ahora".
- `git commit` solo si el usuario lo pide explícitamente. Por defecto deja los cambios sin commitear.
- No abrir Pull Requests automáticamente.
- No borrar archivos del workspace salvo que el usuario lo pida.

### 9.2 Disciplina de cambios

- Prefiere **edits mínimos y enfocados**. Un bug se arregla con un cambio de una línea cuando es posible.
- No hagas refactors masivos no solicitados.
- No agregues comentarios ni documentación a archivos existentes salvo que el usuario lo pida.
- No introduzcas dependencias nuevas sin justificarlo y avisar al usuario.
- Al usar `tools` que modifiquen archivos, **lee el archivo primero**.

### 9.3 Cuando hay ambigüedad

- Si la petición admite varias interpretaciones razonables, **pregunta antes de actuar**.
- Si el usuario pide algo que rompería tests existentes, advierte y pide confirmación.
- Si una solución requiere romper la regla de privacidad (guardar IP, vincular identidad↔voto), **rehúsate y explica por qué**.

### 9.4 Comunicación

- Idioma de respuesta: **español**, salvo que el usuario escriba en otro idioma.
- Sé conciso y directo. Sin frases de validación tipo "¡Excelente pregunta!".
- Cita archivos con paths absolutos cuando sea relevante.
- No repitas información que ya está en este archivo si no aporta.

### 9.5 Generación de evidencias para tesis

Mientras se desarrolla, el usuario quiere que se generen evidencias para el capítulo de pruebas:

- Pruebas unitarias, integración, regresión, usabilidad.
- Cada nuevo feature debe quedar trazado en `MATRIZ_REGRESION.md` con un ID nuevo.
- Reportes fechados van en `docs/testing/resultados/`.

---

## 10. Cosas que NO se deben hacer

| ❌ No | Por qué |
|---|---|
| Usar `keccak256` para "cifrar" votos | El cifrado real es ElGamal sobre BN254 (homomórfico). Hash no es cifrado. |
| Almacenar la IP del votante | Viola la privacidad declarada en la tesis. |
| Guardar el token en claro en BD | Solo `tokenHash` (SHA-256). |
| Vincular `tokenHash` con `nullifier` en la misma fila | Rompe el anonimato del voto. |
| Mockear firmas de VC sin firma real | La tesis se defiende como criptografía real. Usa ECDSA con `@noble/curves`. |
| Cambiar de Yarn a npm/pnpm | Rompe Scaffold-ETH 2 y los workspaces. |
| Agregar test que solo "haga pasar el código" | Los tests deben validar la regla, no la implementación. |
| `git push` sin permiso | Política explícita del usuario. |
| Tocar `/blockexplorer` o `/debug` | Son de Scaffold-ETH 2 y deben quedar intactos como referencia. |

---

## 11. Archivos clave para abrir primero al iniciar contexto

Si te incorporas a una sesión nueva, lee estos archivos en orden:

1. `README.md` — visión general y mini-manual.
2. `docs/testing/PLAN_PRUEBAS.md` — capítulo de pruebas completo.
3. `docs/testing/MATRIZ_REGRESION.md` — casos críticos.
4. `packages/backend/src/index.ts` — entrypoint de la API.
5. `packages/backend/prisma/schema.prisma` — modelo de datos.
6. `packages/hardhat/contracts/*.sol` — los 4 contratos.
7. `packages/nextjs/app/page.tsx` — landing.
8. `packages/nextjs/components/voting/VotingShell.tsx` — shell común.

---

## 12. Convenciones de commit (cuando el usuario pida commit)

Formato sugerido (en español):

```
feat(backend): agrega endpoint /api/voto/comprobante
fix(contracts): corrige revert de NullifierYaUsado en doble registro
test(frontend): cubre estado loading en /verificar
docs(testing): actualiza MATRIZ_REGRESION con REG-030
chore(deps): actualiza ethers a 6.13.4
```

Scopes válidos: `backend`, `frontend`, `contracts`, `circuits`, `testing`, `docs`, `deps`, `infra`.

---

## 13. Glosario rápido del dominio

- **Padrón** — número de inscripción del votante (ej: `LP123456`).
- **VC (Verifiable Credential)** — credencial firmada W3C que prueba elegibilidad.
- **Token anónimo** — string hex de 64 chars que el votante usa una sola vez.
- **`tokenHash`** — SHA-256 del token; lo único que persiste el backend.
- **Nullifier** — `keccak256(token)`; público, evita doble voto sin revelar identidad.
- **Boleta** — `(votoCifrado, pruebaZK, nullifier)` registrada on-chain.
- **Escrutinio** — fase de conteo cooperativo con Shamir.
- **Comprobante** — txHash que el votante guarda para auditar su voto.

---

**Última actualización:** mayo 2026, checkpoint Sprint 3 cerrado.
