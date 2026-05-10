# Documentación de Sprints — VotoSeguro
**Sistema de Votación Electrónica Descentralizada Verificable**  
Diego Morón Mejía — UCB San Pablo, La Paz, Bolivia — Taller de Grado 2

---

## Sprint 0 — Setup y Fundamentos

### Objetivo
Configurar el monorepo, establecer la base de datos off-chain, conectar la cadena local y definir la arquitectura general.

### Entregables
- Monorepo Yarn 4 workspaces basado en Scaffold-ETH 2
- Cuatro paquetes: `@votacion/hardhat`, `@votacion/nextjs`, `@votacion/backend`, `@votacion/circuits`
- Base de datos SQLite con Prisma 5.22 en `packages/backend`
- Cadena local Hardhat en puerto 8545
- Backend Express en puerto 4000
- Frontend Next.js 15 en puerto 3000

### Arquitectura establecida
```
packages/
├── hardhat/    → contratos Solidity + Hardhat
├── nextjs/     → frontend App Router
├── backend/    → API Express + Prisma + SQLite
└── circuits/   → Noir (alcance futuro)
```

### Modelos Prisma iniciales
- `Administrador`: id, email, nombre, passwordHash
- `ConfiguracionEleccion`: id, nombre, estado (PENDIENTE/ABIERTA/CERRADA/...)
- `LogAuditoria`: id, accion, actor, detalle, timestamp

### Comandos principales
```bash
yarn chain                                         # cadena local
yarn deploy                                        # despliega contratos
yarn backend:dev                                   # backend en :4000
yarn start                                         # frontend en :3000
yarn workspace @votacion/backend prisma:migrate    # aplica migraciones
```

---

## Sprint 1 — Identidad y Autenticación

### Objetivo
Implementar el flujo de verificación de elegibilidad del votante y emisión de token anónimo de un solo uso.

### Nuevos modelos Prisma
- `SesionVotante`: tokenHash (SHA-256 del token), usado, creadoEn, usadoEn, **tokenPoint** (Sprint 6)
- `VotanteElegible`: numeroPadron, nombre, ci, registradoEn
- `CredencialEmitida`: credencialHash (= tokenHash), numeroPadron, emitidaEn

### Nuevos archivos
- `packages/backend/src/services/votanteService.ts`
  - `verificarFormatoCredencial(input)`: valida formato de padrón (`/^[A-Z]{2}\d{6,8}$/`), CI (`/^[0-9]{7,8}[A-Z]?$/i`) y nombre mínimo 5 chars
  - `emitirTokenAnonimo(input)`: verifica padrón en BD, genera token de 32 bytes, almacena tokenHash, crea sesión y credencial; registra log `TOKEN_EMITIDO`
  - `validarToken(token)`: busca tokenHash en SesionVotante, verifica que no esté usado
  - `marcarTokenUsado(tokenHash)`: marca sesión como usada

- `packages/backend/src/controllers/authController.ts`
  - `verificarElegibilidad`: acepta `{numeroPadron, nombre, ci}` o `{vc}` (Sprint 6)
  - `validarToken`: verifica token sin consumirlo

- `packages/backend/src/routes/authRoutes.ts`
  - `POST /api/auth/verificar-elegibilidad`
  - `POST /api/auth/validar-token`

### Reglas de privacidad críticas
- El token nunca se almacena en claro. Solo su SHA-256 (`tokenHash`) persiste en BD.
- No se vincula `tokenHash` con identidad del votante en ningún log.
- Si un votante solicita un nuevo token sin haber votado, se revoca la sesión anterior.

### Páginas frontend
- `/verificar`: formulario de autenticación (modo VC en Sprint 6, modo legacy compatible)

### Tests
- `votanteService.unit.test.ts`: 11 casos (PU-votante-*)
- `api.integration.test.ts`: PI-01..PI-04, PI-05, PI-08 relacionados

---

## Sprint 2 — Emisión de Voto y Contratos

### Objetivo
Implementar el flujo de votación: cifrado del voto, registro on-chain con nullifier anti-doble-voto.

### Contratos Solidity (`packages/hardhat/contracts/`)
- **`AdminParams.sol`**: candidatos y clave pública de elección; estados `finalized`/`open`
- **`NullifierSet.sol`**: registro de nullifiers elegibles + consumidos; anti-doble-voto
- **`BulletinBoard.sol`**: boletas `(votoCifrado, pruebaZK, nullifier)` on-chain; estados Setup/Open/Closed
- **`Escrutinio.sol`**: habilitar conteo y publicar resultados con hash de evidencias (Sprint 5)

Script de deployment: `packages/hardhat/deploy/00_deploy_votacion.ts` (wiring entre contratos)

### Nuevos modelos Prisma
- `Candidato`: nombre, descripcion, indice (posición en la boleta), creadoEn
- `VotoContabilizado`: candidatoIndice, **votoCifradoElgamal** (Sprint 6), emitidoEn

### Nuevos archivos — backend
- `packages/backend/src/services/blockchainService.ts`
  - Interfaz a contratos via ethers v6
  - `eleccionAbierta()`, `totalBoletas()`, `obtenerBoleta(i)`
  - `esNullifierElegible()`, `registrarNullifierElegible()`, `fueNullifierUsado()`
  - `registrarBoleta(votoCifrado, pruebaZK, nullifier)`
  - `publicarResultados()`, `obtenerResultados()` (Sprint 5)

- `packages/backend/src/services/votoService.ts`
  - `generarNullifierDesdeToken(token)`: `keccak256("nullifier:" + token)` → `0x...`
  - `emitirVoto(input)`: valida token → verifica Schnorr (Sprint 6) → cifra ElGamal (Sprint 6) → registra on-chain → marca token usado → guarda VotoContabilizado
  - `estadoEleccion()`: estado de elección + lista de candidatos desde Prisma
  - `obtenerBoletas()`, `verificarComprobante(txHash)`

- `packages/backend/src/controllers/votoController.ts`
  - `emitir`, `estadoEleccion`, `boletas`, `comprobante`, `resultados` (Sprint 5)

- `packages/backend/src/routes/votoRoutes.ts`
  - `POST /api/voto/emitir`
  - `GET /api/voto/estado-eleccion`
  - `GET /api/voto/boletas`
  - `GET /api/voto/comprobante?txHash=...`
  - `GET /api/voto/resultados` (Sprint 5)

### Páginas frontend
- `/votar`: selección de candidato → generación Schnorr proof (Sprint 6) → emisión
- `/explorer`: tabla de boletas on-chain

### Nullifier
```
nullifier = 0x + SHA256("nullifier:" + token)
```
El nullifier es público (va on-chain) pero no revela el token ni la identidad.

### Tests (Sprint 2)
- `votoService.unit.test.ts`: PU-05..PU-13 + PU-schnorr-ok/fail (Sprint 6)
- `Votacion.test.ts` (contratos): PC-01..PC-05

---

## Sprint 3 — Verificación de Comprobante

### Objetivo
Permitir que el votante verifique su voto on-chain usando el txHash de la transacción.

### Páginas frontend
- `/comprobar?txHash=...`: muestra estado de la boleta, bloque, nullifier
- `/explorer`: tabla completa de boletas registradas on-chain

### Backend (extensión)
- `VotoService.verificarComprobante(txHash)`: busca la transacción on-chain y retorna datos de la boleta

### Tests
- Playwright E2E: PE-08 "txHash no existente → estado no encontrado"
- Integración: PI-06, PI-07, PI-08 (comprobante válido/inválido)

---

## Sprint 4 — Panel Administrativo

### Objetivo
Crear el panel de administración con login seguro, gestión de candidatos, padrón electoral, control de jornada (abrir/cerrar) y auditoría.

### Autenticación admin
- Hash de contraseña: `scrypt` (sal aleatoria 16 bytes, clave derivada 64 bytes)
  Formato almacenado: `scrypt:saltHex:hashHex`
- JWT firmado con `JWT_ADMIN_SECRET` (duración 2h)
- Middleware `requireAdmin` verifica el Bearer token en todas las rutas `/api/admin/*` protegidas

### Funciones en `adminService.ts`
- `hashPassword(password)`, `loginAdmin(email, password)` → `{token, expiresIn, nombre, email}`
- `agregarCandidato(nombre, descripcion?)` → asigna índice auto-incremental
- `eliminarCandidato(candidatoId)`
- `obtenerCandidatos()`, `obtenerVotantesElegibles()`
- `agregarVotanteElegible(numeroPadron, nombre?, ci?)` → **retorna VC firmada** (Sprint 6)
- `cargarPadronCSV(lineas, adminId)` → carga masiva con reporte de errores
- `abrirJornada(adminId)`: verifica estado blockchain, resetea SesionVotante + CredencialEmitida + VotoContabilizado, actualiza ConfiguracionEleccion → `ABIERTA`
- `cerrarJornada(adminId)`, `habilitarEscrutinio(adminId)`
- `obtenerLogsAuditoria(limite?)`
- `obtenerEstadoAdmin()`

### Rutas admin (`/api/admin/*`)
```
POST   /api/admin/login
GET    /api/admin/estado          [requireAdmin]
POST   /api/admin/jornada/abrir   [requireAdmin]
POST   /api/admin/jornada/cerrar  [requireAdmin]
POST   /api/admin/escrutinio/habilitar [requireAdmin]
GET    /api/admin/candidatos      [requireAdmin]
POST   /api/admin/candidatos      [requireAdmin]
DELETE /api/admin/candidatos/:id  [requireAdmin]
GET    /api/admin/padron          [requireAdmin]
POST   /api/admin/padron          [requireAdmin] → retorna {votante, vc}
POST   /api/admin/padron/csv      [requireAdmin]
GET    /api/admin/logs            [requireAdmin]
GET    /api/admin/escrutinio/estado     [requireAdmin]
POST   /api/admin/escrutinio/inicializar [requireAdmin]
POST   /api/admin/escrutinio/ejecutar   [requireAdmin]
```

### Página admin `/admin`
- Login con email/contraseña → JWT almacenado en estado React
- Dashboard con 4 tabs: **Estado**, **Candidatos**, **Padrón**, **Escrutinio**
- Tab Estado: tarjetas de estado (elección abierta, conteo habilitado, resultados publicados, boletas)
- Tab Candidatos: lista + formulario agregar + botón eliminar
- Tab Padrón: lista + formulario individual + carga CSV + **botón descargar VC** (Sprint 6)
- Tab Escrutinio: estado Shamir, botón inicializar, selector de compartimentos, ejecutar escrutinio

### Reset de jornada (fix crítico)
Al abrir una nueva jornada, se limpian:
- `SesionVotante.deleteMany({})` — sesiones anteriores
- `CredencialEmitida.deleteMany({})` — tokens emitidos previos
- `VotoContabilizado.deleteMany({})` — conteos del período anterior

### Tests (Sprint 4)
- `adminService.unit.test.ts`: PA-admin-01..09 + agregarVotanteElegible retorna vc
- `api.integration.test.ts`: PA-01..PA-12, PE-01..PE-08

---

## Sprint 5 — Escrutinio Cooperativo con Shamir Secret Sharing

### Objetivo
Implementar el escrutinio con Shamir Secret Sharing (5 de 3) sobre GF(p) secp256k1. La clave privada de la elección es el secreto compartido entre 5 custodios. Se necesitan al menos 3 para revelarla y publicar resultados.

### Shamir Secret Sharing (`escrutinioService.ts`)

**Parámetros:**
- `PRIME = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F` (campo secp256k1)
- `SHARES_N = 5` (número total de compartimentos)
- `SHARES_UMBRAL = 3` (mínimo requerido para reconstruir)

**Funciones matemáticas:**
- `dividirSecreto(secreto, n, umbral)`: genera polinomio de grado (umbral-1) con término independiente = secreto; evalúa en x = 1..n mod PRIME
- `reconstruirSecreto(shares)`: interpolación de Lagrange mod PRIME

**Archivos generados en `shamir-shares/`:**
```
config.json              → {hashSecreto, n, umbral, fechaGeneracion, clavePublicaEleccion}
compartimento-1.json     → {indice, valor, fechaGeneracion}
compartimento-2.json
...
compartimento-5.json
evidencias.json          → paquete de evidencias post-escrutinio
```

**`clavePublicaEleccion`** (Sprint 6): `H = (secreto mod ORDER_secp256k1) · G` almacenada en `config.json`.

### Flujo de escrutinio
1. Admin inicializa shares → genera secreto aleatorio de 31 bytes → divide en 5 compartimentos → guarda en disco → calcula `H` (clave pública de elección)
2. Se abre la elección → los votos se cifran con `H` (ElGamal)
3. Admin habilita escrutinio en blockchain
4. Admin selecciona 3+ compartimentos → `ejecutarEscrutinio()`:
   - Lee compartimentos del disco
   - Reconstruye secreto → verifica SHA-256
   - **Sprint 6**: Descifra votos ElGamal homomórficamente usando `sk = secreto mod ORDER`
   - Publica resultados en `Escrutinio.sol` con hash de evidencias

### Tests (Sprint 5)
- `escrutinioService.unit.test.ts`: REG-049..065 (Shamir math, archivos reales, ejecutarEscrutinio)
- `api.integration.test.ts`: PE-01..PE-08

---

## Sprint 6 — Endurecimiento Criptográfico

### Objetivo
Reemplazar los simulacros criptográficos (hashes simples) con criptografía real verificable:
1. **Credenciales Verificables con firma ECDSA** (W3C-compatible, secp256k1)
2. **Prueba de conocimiento cero Schnorr** (Fiat-Shamir no interactivo) del token
3. **Cifrado ElGamal homomórfico** del voto (vector binario, secp256k1)

Todo usando `@noble/curves/secp256k1` (librería de criptografía auditada, sin dependencias nativas).

---

### Pieza 1: Credenciales Verificables ECDSA

**Archivo:** `packages/backend/src/lib/vcAuthority.ts`

**Estructura de la VC:**
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "CredencialElectoral"],
  "issuer": "did:votoseguro:authority",
  "issuanceDate": "2026-05-10T12:00:00.000Z",
  "credentialSubject": {
    "id": "did:padron:LP123456",
    "numeroPadron": "LP123456",
    "nombre": "Juan Pérez",
    "elegible": true
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2026-05-10T12:00:00.000Z",
    "verificationMethod": "did:votoseguro:authority#key-1",
    "proofValue": "3a4f..." // ECDSA compacto r||s, 128 hex chars
  }
}
```

**Proceso de firma:**
```
payload = JSON.stringify({numeroPadron, nombre, elegible, issuanceDate})
msgHash = SHA-256(payload)
signature = secp256k1.sign(msgHash, VC_AUTHORITY_PRIVATE_KEY)
proofValue = sig.toCompactRawBytes().toHex()
```

**Variable de entorno:** `VC_AUTHORITY_PRIVATE_KEY` (32 bytes hex = clave privada secp256k1)

**Determinismo:** La firma es determinista para la misma `issuanceDate` → se puede re-emitir la misma VC usando `registradoEn` del votante.

**Funciones exportadas:**
- `emitirVC(numeroPadron, nombre, issuanceDate?)` → `CredencialVerificable`
- `verificarVC(vc)` → `boolean`
- `obtenerClavePublicaVC()` → hex del punto comprimido secp256k1

**Integración en el flujo:**
- `adminService.agregarVotanteElegible()` → llama a `emitirVC()` → retorna `{votante, vc}` al admin
- Admin descarga la VC como JSON y la entrega al votante
- `votanteService.emitirTokenAnonimo()` → si `input.vc` presente → llama `verificarVC()` → rechaza si firma inválida

---

### Pieza 2: Prueba Schnorr (ZK de conocimiento del token)

**Archivos:**
- `packages/backend/src/lib/schnorr.ts` (verificador backend)
- `packages/nextjs/lib/schnorr.ts` (generador browser)

**Motivación:** El votante demuestra que conoce el token `t` tal que `tokenPoint = tokenScalar · G` sin revelar `t`. Esto previene que alguien use un token robado sin conocer el valor original.

**Derivación del escalar:**
```
tokenScalar = BigInt("0x" + token) % secp256k1.ORDER   [≥ 1]
tokenPoint  = tokenScalar · G  (punto comprimido, 33 bytes hex)
```

`tokenPoint` se calcula al emitir el token y se almacena en `SesionVotante.tokenPoint`.

**Protocolo Schnorr no interactivo (Fiat-Shamir):**
```
Prover (navegador):
  r  ← random escalar
  R  = r · G
  c  = SHA-256(R || tokenPoint || mensaje) mod ORDER
  s  = (r + c · tokenScalar) mod ORDER
  → envía {R, s}

Verifier (backend):
  c  = SHA-256(R || tokenPoint || mensaje) mod ORDER
  LHS = s · G
  RHS = R + c · tokenPoint
  válido ⟺ LHS == RHS
```

El mensaje es `"votoseguro:vote:{candidatoId}"`, vinculando la prueba al candidato elegido.

**Seguridad:**
- El nonce `r` es aleatorio → pruebas distintas cada vez (no deterministas)
- `c` mezcla R, tokenPoint y mensaje → no reutilizable en otro contexto
- No revela `tokenScalar` (problema del logaritmo discreto)

**Integración en el flujo:**
- Frontend `/votar` genera prueba con `generarSchnorr(token, mensaje)` (Web Crypto API)
- Backend `votoService.emitirVoto()` → si `schnorrProof` presente → busca `tokenPoint` en BD → llama `verificarSchnorr(tokenPoint, proof, mensaje)`

---

### Pieza 3: Cifrado ElGamal Homomórfico

**Archivo:** `packages/backend/src/lib/elgamal.ts`

**Clave de elección:**
- Privada: `sk = secretoShamir mod ORDER_secp256k1`
- Pública: `H = sk · G` (punto comprimido secp256k1)
- `H` se almacena en `shamir-shares/config.json` como `clavePublicaEleccion`

**Vector binario:** Para N candidatos, un voto al candidato i es el vector `[0,..,1,..,0]` con 1 en posición i.

**Cifrado de un bit (ElGamal aditivo):**
```
r ← random escalar
C1 = r · G
C2 = r · H + bit · G   (bit ∈ {0, 1})
```

**Suma homomórfica de K votos por candidato:**
```
ΣC1 = sum(C1_j)     (suma de puntos EC)
ΣC2 = sum(C2_j)
count · G = ΣC2 - sk · ΣC1
```

**Descifrado por fuerza bruta (válido para prototipos):**
Se busca `k` en `[0, maxVotos]` tal que `k · G == count · G`. Para N ≤ 10,000 es inmediato.

**Integración en el flujo:**
- `votoService.emitirVoto()`: si `config.json` tiene `clavePublicaEleccion` → cifra el voto → almacena JSON de `ParCifrado[]` en `VotoContabilizado.votoCifradoElgamal`; el hash del cifrado es el `votoCifrado` on-chain
- `escrutinioService.ejecutarEscrutinio()`: carga cifrados de BD → `sumarCifrados()` → `descifrarSuma()` por candidato; fallback a `candidatoIndice` si no hay cifrados

**Seguridad del cifrado on-chain:**
- On-chain: solo el hash SHA-256 del ciphertext (`bytes32`)
- Off-chain (SQLite): el ciphertext completo (array de puntos EC comprimidos)
- Sin la clave privada `sk` (dividida en 5 compartimentos Shamir), el ciphertext off-chain tampoco es descifrable

---

### Cambios en el esquema Prisma (Sprint 6)

```prisma
model SesionVotante {
  // campos anteriores...
  tokenPoint  String?   // punto secp256k1 comprimido hex
}

model VotoContabilizado {
  // campos anteriores...
  votoCifradoElgamal  String?   // JSON de ParCifrado[]
}
```

**Migración requerida** (ejecutar con backend detenido):
```bash
yarn workspace @votacion/backend prisma:migrate dev --name sprint6_crypto_real
```

### Variables de entorno nuevas

```env
VC_AUTHORITY_PRIVATE_KEY=<32 bytes hex>   # clave privada ECDSA para firmar VCs
```

`ELECTION_PRIVATE_KEY` ya no es necesaria: la clave de elección ES el secreto Shamir.

### Tests nuevos (Sprint 6)

| Archivo | Tests |
|---|---|
| `src/lib/vcAuthority.unit.test.ts` | REG-066..069 (7 casos) |
| `src/lib/elgamal.unit.test.ts` | REG-070..072 (7 casos) |
| `src/lib/schnorr.unit.test.ts` | REG-073..076 (8 casos) |
| `api.integration.test.ts` | REG-077..080 (PS6-01..03, PA-11 actualizado) |
| `votoService.unit.test.ts` | PU-schnorr-ok, PU-schnorr-fail |

---

## Resumen de archivos por Sprint

### Sprint 6 — Archivos creados/modificados

**Creados:**
- `packages/backend/src/lib/vcAuthority.ts`
- `packages/backend/src/lib/elgamal.ts`
- `packages/backend/src/lib/schnorr.ts`
- `packages/nextjs/lib/schnorr.ts`
- `packages/backend/src/lib/vcAuthority.unit.test.ts`
- `packages/backend/src/lib/elgamal.unit.test.ts`
- `packages/backend/src/lib/schnorr.unit.test.ts`

**Modificados:**
- `packages/backend/prisma/schema.prisma` (tokenPoint, votoCifradoElgamal)
- `packages/backend/src/types/auth.ts` (CredencialVerificable, vc opcional)
- `packages/backend/src/services/votanteService.ts` (verificarVC + tokenPoint)
- `packages/backend/src/services/votoService.ts` (Schnorr + ElGamal)
- `packages/backend/src/services/adminService.ts` (emitirVC en agregarVotanteElegible)
- `packages/backend/src/services/escrutinioService.ts` (clavePublicaEleccion + descifrado ElGamal)
- `packages/backend/src/controllers/authController.ts` (acepta vc o campos individuales)
- `packages/backend/src/controllers/adminController.ts` (retorna vc en respuesta)
- `packages/backend/src/controllers/votoController.ts` (pasa schnorrProof al servicio)
- `packages/nextjs/package.json` (@noble/curves añadido)
- `packages/nextjs/app/verificar/page.tsx` (modo VC + modo legacy)
- `packages/nextjs/app/votar/page.tsx` (generación Schnorr en browser)
- `packages/nextjs/app/admin/page.tsx` (botón descargar VC)
- `packages/backend/src/integration/api.integration.test.ts` (PS6-01..03, PA-11)
- `packages/backend/src/services/votoService.unit.test.ts` (PU-schnorr-ok/fail)
- `packages/backend/src/services/adminService.unit.test.ts` (mock vcAuthority)
- `docs/testing/MATRIZ_REGRESION.md` (REG-066..080)

---

## Estado de la suite de tests — Sprint 6

| Tipo | Herramienta | Tests | Estado |
|---|---|---|---|
| Unitarias backend | Vitest | 113 casos | ✅ 113/113 |
| Contratos | Hardhat+Chai | 10 casos | ✅ 10/10 |
| Frontend componentes | Vitest+Testing Library | 26 casos | ✅ 26/26 |
| E2E Playwright | Playwright | 9 casos | ✅ 9/9 |
| Regresión | Matriz formal | 80 filas | REG-001..REG-080 |

---

## Flujo completo integrado (Sprint 6)

```
1. SETUP (admin, antes de apertura)
   ├── Admin crea candidatos en /admin (tab Candidatos)
   ├── Admin registra votantes en /admin (tab Padrón)
   │   └── Backend firma VC ECDSA → admin descarga VC.json → entrega al votante
   ├── Admin inicializa Shamir en /admin (tab Escrutinio)
   │   └── Genera secreto → 5 compartimentos → clavePublicaEleccion H = sk·G en config.json
   └── Admin abre jornada → BulletinBoard.open()

2. VOTACIÓN
   Votante:
   ├── Va a /verificar → pega VC.json → Backend verifica firma ECDSA → emite token
   │   └── Backend calcula tokenPoint = tokenScalar·G, almacena en SesionVotante
   ├── Va a /votar → selecciona candidato
   │   ├── Browser genera Schnorr proof: r·G, s = r + c·tokenScalar (Web Crypto)
   │   └── Envía {candidatoId, token, schnorrProof}
   └── Backend:
       ├── Verifica Schnorr: s·G == R + c·tokenPoint ✓
       ├── Cifra voto ElGamal: vector binario cifrado con H
       ├── Hash ciphertext → votoCifrado (bytes32 on-chain)
       ├── Registra boleta en BulletinBoard.sol
       ├── Guarda VotoContabilizado con votoCifradoElgamal
       └── Marca token como usado (un solo uso)

3. ESCRUTINIO (admin, después de cerrar jornada)
   Admin:
   ├── Habilita conteo en blockchain
   ├── Selecciona 3 de 5 compartimentos Shamir
   └── Backend:
       ├── Reconstruye sk = Lagrange(shares) mod PRIME
       ├── Verifica SHA-256(sk_bytes) == config.hashSecreto ✓
       ├── Carga cifrados ElGamal de BD
       ├── ΣC1 y ΣC2 por candidato (suma homomórfica)
       ├── count·G = ΣC2 - sk·ΣC1 → fuerza bruta → count
       └── Publica resultados en Escrutinio.sol + hash de evidencias

4. VERIFICACIÓN PÚBLICA
   └── /resultados → muestra ganador, votos por candidato, hash de evidencias on-chain
       Cualquiera puede verificar: evidencias.json contiene el hash publicado
```

---

## Invariantes de privacidad (verificables en código)

| Invariante | Dónde verificar |
|---|---|
| Token nunca en BD en claro | `SesionVotante.tokenHash` = SHA-256(token) |
| tokenPoint no revela token | Problema del logaritmo discreto |
| Nullifier no revela token | `0x` + SHA-256("nullifier:" + token) |
| On-chain: solo hash del ciphertext | `votoCifrado` = SHA-256(ElGamal JSON) |
| No vinculación identidad↔voto | No hay FK entre CredencialEmitida y SesionVotante con nullifier |
| Escrutinio no revela votos individuales | Solo suma homomórfica + descifrado del total |
| IP del votante: nunca almacenada | Ningún campo en ningún modelo |

---

*Última actualización: 2026-05-10, Sprint 6 completado.*
