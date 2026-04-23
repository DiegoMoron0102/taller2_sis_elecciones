# 🗳️ Sistema de Votación Electrónica Descentralizada Verificable

Prototipo completo de sistema de votación electrónica basado en blockchain con zero-knowledge proofs.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma + SQLite
- **Blockchain**: Hardhat + Solidity ^0.8.x
- **ZK Proofs**: Noir + NoirJS
- **Testnet**: Sepolia

## 📁 Estructura del Proyecto

```
votacion-descentralizada/
├── frontend/          # Next.js app
├── backend/           # API + Prisma
├── contracts/         # Hardhat + Solidity
└── scripts/           # Utilidades ZK
```

## 🛠️ Instalación y Setup

### 1. Contratos Inteligentes
```bash
cd contracts
npm install
npx hardhat node  # Iniciar blockchain local
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Arquitectura

### Sprint 0: ✅ Setup Completo
- [x] Estructura de monorepo
- [x] Next.js + TypeScript configurado
- [x] Hardhat + Solidity configurado
- [x] Prisma + SQLite configurado

### Próximos Sprints
1. **Sprint 1**: Identidad y Elegibilidad
2. **Sprint 2**: Emisión del Voto
3. **Sprint 3**: Verificación Individual
4. **Sprint 4**: Panel Administrativo
5. **Sprint 5**: Escrutinio y Resultados
6. **Sprint 6**: Monitoreo y Auditoría
7. **Sprint 7**: Pruebas y Validación

## 🔗 Variables de Entorno

Crear `.env` en cada carpeta:

**contracts/.env**
```
PRIVATE_KEY=tu-private-key
SEPOLIA_URL=https://sepolia.infura.io/v3/your-project-id
```

**backend/.env**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET=secreto-largo-aleatorio
PORT=4000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CONTRACT_BULLETIN=
NEXT_PUBLIC_CONTRACT_NULLIFIER=
```

## 📄 Licencia

MIT License - Ver archivo LICENSE
