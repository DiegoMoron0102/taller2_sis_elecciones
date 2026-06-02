# Votación Descentralizada Verificable (Tesis)

> **Proyecto de Grado — UCB San Pablo (La Paz, Bolivia)**
> **Autor:** Diego Morón Mejía
> **Carrera:** Ingeniería de Sistemas — Taller de Grado 2
> **Branding:** VotoSeguro

---

## ¿Qué es este proyecto?

Prototipo de votación electrónica descentralizada con:

- Verificación de elegibilidad mediante **Credenciales Verificables W3C** firmadas con ECDSA secp256k1.
- Prueba de conocimiento cero **Schnorr** del token anónimo (Fiat-Shamir no interactivo).
- **Cifrado ElGamal homomórfico** del voto (vector binario sobre secp256k1).
- Registro inmutable en blockchain local (Hardhat EVM).
- **Shamir Secret Sharing** (5 de 3) para custodia distribuida de la clave de elección.
- **CredencialCustodio** firmada por ECDSA para que cada delegado lleve su compartimento.
- Exploración pública de boletas cifradas y verificación individual por txHash.
- Panel administrativo completo con auditoría.

---

## Estado actual — Sprint 7 completado

### Sprints completados

| Sprint | Entregable | Estado |
|---|---|---|
| 0 — Setup | Monorepo Yarn 4, Prisma + SQLite, cadena local | ✅ |
| 1 — Identidad | `verificar-elegibilidad`, `validar-token`, sesión anónima | ✅ |
| 2 — Emisión | `emitir`, `estado-eleccion`, `boletas` + contratos on-chain | ✅ |
| 3 — Verificación | `comprobante` + página `/comprobar` | ✅ |
| 4 — Panel admin | Login JWT, candidatos, padrón, abrir/cerrar jornada, auditoría | ✅ |
| 5 — Escrutinio | Shamir Secret Sharing, publicación de resultados on-chain | ✅ |
| 6 — Cripto real | VC ECDSA, prueba Schnorr, cifrado ElGamal homomórfico | ✅ |
| 7 — Custodia distribuida | CredencialCustodio, bundles por custodio, buffer en memoria | ✅ |

### Suite de pruebas al cierre (commit `e3f7537`)

| Tipo | Herramienta | Resultado |
|---|---|---|
| Unitarias + integración backend | Vitest + Supertest | ✅ 122/122 |
| Contratos Solidity | Hardhat + Chai | ✅ 12/12 |
| Frontend componentes | Vitest + Testing Library | ✅ 27/27 |
| E2E Playwright | Playwright (Chromium) | ✅ 9/9 |
| Regresión formal | Matriz REG-001..REG-089 | ✅ 90/90 |

---

## Arquitectura del monorepo

```
votacion-tesis/
├─ packages/
│  ├─ hardhat/    # @votacion/hardhat   — Solidity 0.8.x + Hardhat
│  ├─ nextjs/     # @votacion/nextjs    — Next.js 15 + React 19 + Tailwind 4
│  ├─ backend/    # @votacion/backend   — Express 4 + Prisma 5 + SQLite
│  └─ circuits/   # @votacion/circuits  — (reservado para extensiones futuras)
├─ docs/
│  └─ testing/    # plan, matriz, protocolo usabilidad, resultados fechados
└─ scripts/
   └─ testing/    # run-all-tests.mjs → genera RESULTADO_<fecha>.md
```

---

## Contratos Solidity (`packages/hardhat/contracts/`)

| Contrato | Responsabilidad |
|---|---|
| `AdminParams.sol` | Candidatos y clave pública de elección; estados `finalized`/`open` |
| `NullifierSet.sol` | Nullifiers elegibles + consumidos; anti-doble-voto |
| `BulletinBoard.sol` | Boletas `(votoCifrado, pruebaZK, nullifier)` on-chain; estados Setup/Open/Closed |
| `Escrutinio.sol` | Habilitar conteo, publicar resultados con hash de evidencias, resetear jornada |

Script de despliegue: `packages/hardhat/deploy/00_deploy_votacion.ts`
Configuración inicial: `packages/hardhat/scripts/setupElection.ts`

---

## Modelo de datos (Prisma + SQLite)

| Modelo | Campos clave |
|---|---|
| `Administrador` | email, nombre, passwordHash (scrypt) |
| `ConfiguracionEleccion` | nombre, estado (PENDIENTE/ABIERTA/CERRADA/ESCRUTINIO) |
| `LogAuditoria` | accion, actor, detalle, timestamp |
| `SesionVotante` | tokenHash (SHA-256), tokenPoint (secp256k1), usado |
| `VotanteElegible` | numeroPadron, nombre, ci |
| `CredencialEmitida` | credencialHash, numeroPadron |
| `Candidato` | nombre, descripcion, indice |
| `VotoContabilizado` | candidatoIndice, votoCifradoElgamal (JSON ElGamal) |

```bash
yarn workspace @votacion/backend prisma:generate
yarn workspace @votacion/backend prisma:migrate dev --name <nombre>
yarn workspace @votacion/backend prisma:studio
```

---

## Endpoints del backend

### Públicos — Auth
```
POST /api/auth/verificar-elegibilidad   # acepta {vc} o {numeroPadron, nombre, ci}
POST /api/auth/validar-token
```

### Públicos — Voto
```
POST /api/voto/emitir
GET  /api/voto/estado-eleccion
GET  /api/voto/boletas
GET  /api/voto/comprobante?txHash=...
GET  /api/voto/resultados
```

### Admin (requieren JWT `requireAdmin`)
```
POST   /api/admin/login
GET    /api/admin/estado
POST   /api/admin/jornada/abrir
POST   /api/admin/jornada/cerrar
GET    /api/admin/candidatos
POST   /api/admin/candidatos
DELETE /api/admin/candidatos/:id
GET    /api/admin/padron
POST   /api/admin/padron               # retorna {votante, vc}
POST   /api/admin/padron/csv
GET    /api/admin/logs
GET    /api/admin/escrutinio/estado
POST   /api/admin/escrutinio/inicializar
POST   /api/admin/escrutinio/aportar-compartimento
POST   /api/admin/escrutinio/ejecutar
POST   /api/admin/escrutinio/resetear
```

### Infra
```
GET  /health
```

---

## Páginas del frontend

| Ruta | Descripción |
|---|---|
| `/` | Landing con branding VotoSeguro |
| `/verificar` | Autenticación con VC ECDSA (modo legado compatible) |
| `/votar` | Selección de candidato + generación Schnorr proof en browser |
| `/explorer` | Boletas registradas on-chain |
| `/comprobar` | Verificación individual por txHash |
| `/admin` | Panel administrativo (4 tabs: Estado, Candidatos, Padrón, Escrutinio) |

---

## Flujo criptográfico completo (Sprint 6 + 7)

```
SETUP (admin)
  ├── Crea candidatos en /admin → tab Candidatos
  ├── Registra votantes → Backend firma VC ECDSA → admin descarga VC.json
  ├── Inicializa Shamir → 5 custodios → bundles {custodio, compartimento, vc}
  │   └── Servidor NO conserva compartimentos; solo config.json con hashSecreto
  └── Abre jornada → BulletinBoard.open()

VOTACIÓN
  Votante va a /verificar → pega VC.json → Backend verifica ECDSA → emite token
  └── tokenPoint = tokenScalar·G guardado en SesionVotante
  Votante va a /votar → selecciona candidato
  └── Browser genera Schnorr: R=r·G, s=r+c·tokenScalar
  Backend:
  ├── Verifica Schnorr: s·G == R + c·tokenPoint ✓
  ├── Cifra voto ElGamal: vector binario con H = clavePublicaEleccion
  ├── Registra boleta on-chain (hash del ciphertext)
  └── Marca token como usado (un solo uso)

ESCRUTINIO (admin, tras cerrar jornada)
  Cada custodio aporta su bundle → Backend verifica VC + compartimento
  Con 3 de 5 compartimentos:
  ├── Reconstruye sk = Lagrange(shares) mod PRIME
  ├── Descifra: count·G = ΣC2 - sk·ΣC1 → fuerza bruta → count
  └── Publica resultados en Escrutinio.sol + hash de evidencias

VERIFICACIÓN PÚBLICA
  /resultados → ganador, votos por candidato, hash de evidencias on-chain
```

---

## Mini manual de usuario (dev/local)

### Requisitos

- Node.js 20+
- Yarn 4+
- Git

**Instalar Yarn 4** (si no está disponible):

```bash
npm install -g yarn
yarn set version stable
```

### Variables de entorno

Crear el archivo `packages/backend/.env` con el siguiente contenido:

```env
JWT_ADMIN_SECRET=<secreto largo aleatorio>
VC_AUTHORITY_PRIVATE_KEY=<32 bytes hex — clave ECDSA para firmar VCs>
```

Para generar los valores, ejecutar estos comandos y copiar la salida de cada uno:

```bash
# JWT_ADMIN_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# VC_AUTHORITY_PRIVATE_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Instalación

```bash
# Desde votacion-tesis/
yarn install
yarn workspace @votacion/backend prisma:generate
yarn workspace @votacion/backend prisma:migrate dev --name init
```

### Crear el primer administrador

Antes de levantar el servidor, crear la cuenta de administrador en la base de datos:

```bash
yarn workspace @votacion/backend crear-admin admin@votoseguro.local "Admin Principal" contraseña123
```

Reemplazar el email, nombre y contraseña con los valores deseados. Este comando solo es necesario la primera vez.

### Levantar entorno completo (4 terminales, en orden)

```bash
# Terminal 1 — Blockchain local (levantar primero)
yarn chain

# Terminal 2 — Despliegue de contratos (esperar a que la Terminal 1 esté lista)
yarn deploy

# Terminal 3 — Backend (puerto 4000)
yarn backend:dev

# Terminal 4 — Frontend (puerto 3000)
yarn start
```

> **Importante:** los contratos deben estar desplegados (Terminal 2 completada) antes de iniciar el backend. Si el backend arranca sin contratos en la cadena, los endpoints de blockchain fallarán.

URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Hardhat RPC: `http://127.0.0.1:8545`

### (Opcional) Configurar elección inicial con candidatos de ejemplo

```bash
yarn workspace @votacion/hardhat hardhat run scripts/setupElection.ts --network localhost
```

---

## Tests

```bash
# Backend (unitarias + integración)
yarn workspace @votacion/backend test

# Contratos
yarn workspace @votacion/hardhat test

# Frontend componentes
yarn workspace @votacion/nextjs test

# E2E Playwright (requiere dev server activo)
yarn workspace @votacion/nextjs test:e2e

# Cobertura
yarn workspace @votacion/backend test:coverage

# Suite completa + reporte fechado
node scripts/testing/run-all-tests.mjs
```

El script genera `docs/testing/resultados/RESULTADO_<YYYY-MM-DD>.md`.

---

## Branding visual

| Atributo | Valor |
|---|---|
| Nombre del producto | VotoSeguro |
| Color primario | `#197fe6` |
| Tipografía | Public Sans |
| Iconos | Material Symbols Outlined |
| Layout | `max-w-[800px]`, cards `rounded-xl shadow-sm` |
| Progreso | Stepper "Paso X de Y" |
| Tema | Dual claro/oscuro (`next-themes`) |

---

## Notas de seguridad

**No se almacena nunca:**
- IP del votante
- Vínculo identidad ↔ voto
- Datos personales en blockchain
- Token en claro (solo `tokenHash` = SHA-256)

**Se garantiza:**
- Elegibilidad mediante VC ECDSA firmada
- Anti-doble-voto por nullifier on-chain
- Secreto del voto por cifrado ElGamal
- Verificabilidad individual por txHash
- Escrutinio cooperativo con umbral (3 de 5 custodios)
- Evidencia auditable hash-anclada on-chain

---

## Módulos criptográficos

| Módulo | Archivo | Algoritmo |
|---|---|---|
| VC Electoral | `backend/src/lib/vcAuthority.ts` | ECDSA secp256k1, W3C VC 1.1 |
| VC Custodio | `backend/src/lib/vcAuthority.ts` | ECDSA secp256k1, tipo `CredencialCustodio` |
| Prueba Schnorr | `backend/src/lib/schnorr.ts` + `nextjs/lib/schnorr.ts` | Fiat-Shamir no interactivo |
| Cifrado ElGamal | `backend/src/lib/elgamal.ts` | ElGamal aditivo homomórfico secp256k1 |
| Shamir Secret Sharing | `backend/src/services/escrutinioService.ts` | GF(secp256k1 prime), n=5, umbral=3 |

Librería criptográfica: `@noble/curves/secp256k1` (auditada, sin dependencias nativas).

---

**UCB San Pablo — 2026**
