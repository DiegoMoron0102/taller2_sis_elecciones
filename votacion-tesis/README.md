# 🗳️ Votación Descentralizada Verificable (Tesis)

> **Proyecto de Grado — UCB San Pablo (La Paz, Bolivia)**  
> **Autor:** Diego Morón Mejía  
> **Carrera:** Ingeniería de Sistemas — Taller de Grado 2

---

## ✨ ¿Qué es este proyecto?

Este repositorio contiene un prototipo de votación electrónica descentralizada con:

- verificación de elegibilidad,
- emisión de voto anónimo,
- registro inmutable en blockchain local,
- exploración pública de boletas cifradas.

El objetivo académico es evolucionar desde esta base hacia:

- ZK real en Noir,
- cifrado ElGamal real,
- VC firmadas,
- escrutinio cooperativo y auditoría universal.

---

## 🧱 Estado actual (checkpoint)

### ✅ Implementado

- **Sprint 0 (setup):** monorepo funcionando, dependencias instaladas, Prisma + SQLite operativo.
- **Sprint 1 (identidad/elegibilidad):**
  - `POST /api/auth/verificar-elegibilidad`
  - `POST /api/auth/validar-token`
  - sesión anónima con hash de token en DB
- **Sprint 2 (emisión):**
  - `POST /api/voto/emitir`
  - `GET /api/voto/estado-eleccion`
  - `GET /api/voto/boletas`
  - contratos desplegados y boletas registradas on-chain

- **Sprint 3 (verificación):**
  - `GET /api/voto/comprobante?txHash=...`
  - Página `/comprobar`: verificación on-chain por txHash
  - Parseo de evento `BoletaRegistrada` desde `ethers.TransactionReceipt`

### ⚠️ Pendiente (siguientes sprints)

- Panel administrativo completo (Sprint 4)
- Escrutinio cooperativo y resultados (Sprint 5)
- Monitoreo/auditoría avanzada (Sprint 6)
- Piloto y validación final (Sprint 7)

---

## � Arquitectura del monorepo

```txt
votacion-tesis/
├─ packages/
│  ├─ hardhat/   # Contratos y despliegue
│  ├─ backend/   # API Express + Prisma
│  ├─ nextjs/    # Frontend
│  └─ circuits/  # Noir (base de circuitos)
└─ README.md
```

---

## 🧩 Contratos actuales

- `AdminParams.sol`
- `NullifierSet.sol`
- `BulletinBoard.sol`
- `Escrutinio.sol`

Script principal de despliegue:

- `packages/hardhat/deploy/00_deploy_votacion.ts`

Script de configuración de elección (candidatos + apertura):

- `packages/hardhat/scripts/setupElection.ts`

---

## �️ Mini manual de usuario (dev/local)

## 1) Requisitos

- Node.js 20+
- Yarn 4+
- Git

Opcional (para ZK en próximos pasos):

- `nargo`
- `bb` (Barretenberg)

## 2) Instalación

Desde la raíz `votacion-tesis`:

```bash
yarn install
```

## 3) Levantar entorno completo

En terminales separadas (orden recomendado):

```bash
# 1. Blockchain local
yarn chain

# 2. Despliegue de contratos
yarn deploy

# 3. Configurar elección inicial (candidatos + abrir jornada)
cd packages/hardhat
npx hardhat run scripts/setupElection.ts --network localhost

# 4. Backend
cd ../../packages/backend
yarn dev

# 5. Frontend
cd ../nextjs
yarn dev
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Hardhat RPC: `http://127.0.0.1:8545`

## 4) Flujo funcional actual

1. Ir a `http://localhost:3000/verificar`
2. Ingresar credenciales de prueba (ejemplo):
   - `numeroPadron`: `LP123456`
   - `nombre`: `Juan Perez`
   - `ci`: `12345678L`
3. El sistema genera token y redirige a `/votar`
4. Seleccionar candidato y emitir voto
5. Ver boleta en `/explorer`

---

## 🔌 Endpoints backend

### Auth

- `POST /api/auth/verificar-elegibilidad`
- `POST /api/auth/validar-token`

### Voto

- `POST /api/voto/emitir`
- `GET /api/voto/estado-eleccion`
- `GET /api/voto/boletas`
- `GET /api/voto/comprobante?txHash=...`

### Infra

- `GET /health`

---

## 🗄️ Base de datos (Prisma + SQLite)

Comandos útiles:

```bash
yarn prisma:generate
yarn prisma:migrate --name init
yarn prisma:studio
```

Modelos principales:

- `Administrador`
- `ConfiguracionEleccion`
- `LogAuditoria`
- `SesionVotante`
- `CredencialEmitida`

---

## 🎨 UI / UX

La UI se va alineando a los mockups de `pantallas stitch` (estilo `VotoSeguro`):

- paleta azul `#197fe6`,
- tarjetas `rounded-xl`,
- progreso por pasos,
- modo claro/oscuro.

---

## 🔐 Notas de seguridad (objetivo)

No almacenar:

- IP del votante,
- vínculo identidad ↔ voto,
- datos personales en blockchain.

Sí garantizar:

- elegibilidad,
- anti doble voto,
- verificabilidad on-chain,
- evidencia auditable.

---

## 📝 Registro de trabajo (checkpoint actual)

Este checkpoint deja el sistema en estado **ejecutable y demostrable** para Sprint 0/1/2.  
Siguiente hito recomendado: pulido UI con mockups + endurecimiento criptográfico real (Noir/ElGamal/VC firmadas).

---

**UCB San Pablo — 2026**
