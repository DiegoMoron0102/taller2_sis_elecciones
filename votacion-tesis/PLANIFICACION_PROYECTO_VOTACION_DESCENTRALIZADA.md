# 🗳️ PLANIFICACIÓN COMPLETA DEL PROYECTO
## Sistema de Votación Electrónica Descentralizada Verificable
### Autor: Diego Morón Mejía — UCB San Pablo, La Paz, Bolivia

---

## 📌 CONTEXTO Y PROPÓSITO DE ESTE DOCUMENTO

Este documento es la planificación técnica de desarrollo del prototipo de grado titulado **"Sistema de votación electrónica descentralizada verificable para elecciones presidenciales"**. Está pensado para guiar la implementación sprint a sprint, con tareas concretas, decisiones de arquitectura y criterios de aceptación claros.

**Problema central:** Bolivia vivió una crisis de confianza electoral en 2019 (auditoría OEA reportó "manipulación dolosa"). El sistema actual (TREP + cómputo oficial del OEP) es centralizado, opaco y no ofrece verificabilidad ciudadana de extremo a extremo.

**Solución propuesta:** Un prototipo de votación electrónica que:
- Separa elegibilidad (identidad) de la emisión del voto (anonimato).
- Registra boletas cifradas en una blockchain local (EVM).
- Permite verificación individual (cada votante confirma su inclusión) y universal (cualquier tercero puede reproducir el conteo).
- Distribuye el control entre varios validadores (escrutinio cooperativo).

**Alcance del prototipo:**
- Entorno controlado universitario (UCB La Paz).
- Padrón simulado de 20–50 voluntarios.
- Elección presidencial simulada con candidatos ficticios.
- No incluye: voto remoto, integración con OEP real, biometría, certif. de seguridad.

---

## 🛠️ STACK TECNOLÓGICO DEFINITIVO (implementado)

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | **Next.js 15.2 + TypeScript + React 19** | UI de votación, verificación, panel admin, resultados |
| Estilos | **Tailwind 4 + daisyUI 5** | Diseño con branding VotoSeguro |
| Backend API | **Node.js + Express 4.21** | Lógica de negocio, autenticación JWT, integración blockchain |
| Contratos Inteligentes | **Solidity 0.8.x** | Reglas electorales, registro inmutable |
| Red Blockchain | **Hardhat 2.28 + red local (localhost:8545)** | Entorno EVM para prototipo |
| ZK Proofs | **Schnorr Fiat-Shamir** (Fiat-Shamir no interactivo, implementado) | Prueba de conocimiento del token |
| Identidad Digital | **W3C Verifiable Credentials 1.1 + ECDSA secp256k1** | Elegibilidad con firma real (no simulada) |
| Criptografía | **ElGamal homomórfico + Shamir SSS sobre secp256k1** (`@noble/curves`) | Cifrado de votos + custodia distribuida de clave |
| Base de datos off-chain | **SQLite** (via Prisma + archivo `.db`) | Administradores, configuración, logs, sesiones |
| ORM | **Prisma 5.22** | Gestión de base de datos y migraciones |
| Diseño UI | **Figma / pantallas stitch** (referencia en `/pantallas stitch/`) | Referencia visual adoptada |
| Control de versiones | **Git + GitHub** | Transparencia y auditoría de código |
| Package manager | **Yarn 4 workspaces** (monorepo Scaffold-ETH 2) | Gestión de dependencias y workspaces |
| Testing | **Vitest + Supertest + Hardhat Chai + Playwright** | Suite completa multicapa |

> **Nota:** PostgreSQL fue reemplazado por SQLite para simplificar el entorno de desarrollo universitario sin perder capacidades del ORM Prisma. npm/pnpm fueron reemplazados por Yarn 4 workspaces al adoptar Scaffold-ETH 2 como base.

---

## 🏗️ ARQUITECTURA DEL SISTEMA (3 CAPAS)

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: INTERFAZ WEB (Next.js)                             │
│  - Landing Page Pública                                      │
│  - Verificación de Elegibilidad (credencial → token)        │
│  - Emisión de Voto (boleta → cifrado → blockchain)          │
│  - Confirmación + Hash de verificación                      │
│  - Verificación individual del voto                         │
│  - Resultados electorales (read-only)                       │
│  - Panel Administrativo (abrir/cerrar/publicar)             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP / API REST
┌────────────────────▼────────────────────────────────────────┐
│  CAPA 2: LÓGICA (Node.js + Smart Contracts Solidity)        │
│  - AuthController: valida tokens, sesiones                  │
│  - VotanteService: verifica elegibilidad, emite token anón. │
│  - VotoService: cifra boleta, genera ZK proof               │
│  - ComprobantеService: consulta blockchain                  │
│  - EleccionService: abre/cierra jornada                     │
│  - ResultadosService: escrutinio cooperativo, umbral        │
│  - AuditoriaLogger: registra todos los eventos              │
│                                                              │
│  CONTRATOS INTELIGENTES (EVM local via Hardhat):            │
│  - AdminParamsContract: parámetros globales de la elección  │
│  - BulletinBoardContract: recibe/expone boletas cifradas    │
│  - NullifierSetContract: previene doble voto                │
│  - GestionTokensContract: ciclo de vida de tokens          │
│  - EscrutinioContract: conteo cooperativo (umbral)          │
└────────────────────┬────────────────────────────────────────┘
                     │ ethers.js / viem
┌────────────────────▼────────────────────────────────────────┐
│  CAPA 3: DATOS                                               │
│  - Blockchain local Hardhat (boletas cifradas, eventos)     │
│  - PostgreSQL off-chain (admins, config, logs auditoría)    │
│  - Anclaje en testnet pública (opcional, sello temporal)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 METODOLOGÍA: SCRUM ADAPTADO

- **Sprints de 1–2 semanas**
- **Backlog priorizado** (las HU ya están definidas en el documento)
- **Definición de "Hecho":** Emite y registra boleta válida + mantiene secreto + deja evidencia auditable
- **Métricas:** velocidad del equipo, tasa de HU aceptadas, defectos detectados

---

## 🗓️ PLAN DE SPRINTS COMPLETO

---

### ⚙️ SPRINT 0 — Setup y Configuración del Entorno
**Duración:** 1 semana  
**Objetivo:** Tener el entorno de desarrollo completamente funcional antes de escribir lógica de negocio.

#### Tareas:

**1. Inicializar el monorepo**
```bash
mkdir votacion-descentralizada
cd votacion-descentralizada
git init
npx create-next-app@latest frontend --typescript --tailwind --app
mkdir backend contracts scripts
npm init -y  # en /backend
```

**2. Configurar Hardhat (blockchain local)**
```bash
cd contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init  # elegir "Create a TypeScript project"
```

**3. Configurar PostgreSQL + Prisma**
```bash
cd backend
npm install prisma @prisma/client
npx prisma init
# Editar .env con DATABASE_URL
```

**4. Estructura de carpetas esperada al final del sprint:**
```
/votacion-descentralizada
├── /frontend          (Next.js + TypeScript + Tailwind)
│   ├── /app
│   │   ├── /votante
│   │   ├── /admin
│   │   ├── /verificar
│   │   └── /resultados
│   └── /components
├── /backend           (Node.js + Express)
│   ├── /controllers
│   ├── /services
│   ├── /routes
│   └── /middleware
├── /contracts         (Hardhat + Solidity)
│   ├── /contracts
│   ├── /scripts
│   └── /test
├── /scripts           (utilidades ZK, publicación, anclaje)
└── README.md
```

**5. Variables de entorno (.env)**
```env
# blockchain
HARDHAT_NETWORK=localhost
PRIVATE_KEY=<clave del deployer>

# backend
DATABASE_URL=postgresql://user:password@localhost:5432/votacion
JWT_SECRET=<secreto largo y aleatorio>
PORT=4000

# frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CONTRACT_BULLETIN=<address desplegada>
NEXT_PUBLIC_CONTRACT_NULLIFIER=<address desplegada>
```

**6. Instalar dependencias clave**
```bash
# frontend
npm install ethers wagmi viem @tanstack/react-query

# backend
npm install express cors helmet dotenv jsonwebtoken bcrypt
npm install @prisma/client ethers

# contracts
npm install --save-dev @openzeppelin/contracts
```

**Criterio de aceptación del Sprint 0:** ✅ COMPLETADO
- [x] `yarn chain` levanta red local sin errores
- [x] `yarn start` (frontend) carga en localhost:3000
- [x] `yarn backend:dev` responde en localhost:4000
- [x] Prisma conecta con SQLite y las migraciones corren

---

### 🔐 SPRINT 1 — Identidad y Elegibilidad (HU1 + RF-01 + RF-04)
**Duración:** 1–2 semanas  
**Objetivo:** Implementar el sistema de credenciales verificables y emisión del token anónimo de voto.

#### Contexto técnico:
El votante presenta una credencial digital (VC simulada). El sistema la valida. Si es elegible y no ha votado antes, emite un **token anónimo de un solo uso** que desvincula identidad de voto.

#### Tareas:

**1. Modelo de datos (Prisma)**
```prisma
// schema.prisma
model Administrador {
  id       String @id @default(cuid())
  nombre   String
  email    String @unique
  password String  // bcrypt hash
  creadoEn DateTime @default(now())
}

model ConfiguracionEleccion {
  id          String @id @default(cuid())
  nombre      String
  descripcion String?
  fechaInicio DateTime?
  fechaFin    DateTime?
  estado      String @default("pendiente") // pendiente | abierta | cerrada
  creadoEn    DateTime @default(now())
}

model LogAuditoria {
  id        String @id @default(cuid())
  accion    String
  actor     String
  detalle   String?
  timestamp DateTime @default(now())
}

model SesionVotante {
  id           String @id @default(cuid())
  tokenHash    String @unique  // hash del token, no el token mismo
  usado        Boolean @default(false)
  creadoEn     DateTime @default(now())
  usadoEn      DateTime?
}
```

**2. Servicio de identidad / elegibilidad (VotanteService)**
```typescript
// backend/services/votanteService.ts

// Simula validación de credencial VC
async function verificarCredencial(credencial: VCSimulada): Promise<boolean> {
  // Verificar firma digital de la credencial
  // Verificar que no haya expirado
  // Verificar que el DID del emisor sea el padrón simulado
  // Retornar true/false
}

// Genera token anónimo de un solo uso
async function emitirTokenAnonimo(credencialValida: boolean): Promise<string> {
  if (!credencialValida) throw new Error("Credencial inválida");
  const token = generateSecureRandom(); // crypto.randomBytes
  const tokenHash = sha256(token);
  await prisma.sesionVotante.create({ data: { tokenHash } });
  return token; // solo se entrega al votante, no se guarda en claro
}
```

**3. Contrato NullifierSet (Solidity)**
```solidity
// contracts/NullifierSet.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NullifierSet {
    mapping(bytes32 => bool) private usados;
    address public admin;

    constructor() { admin = msg.sender; }

    function marcarUsado(bytes32 nullifier) external {
        require(msg.sender == admin, "Solo admin");
        require(!usados[nullifier], "Ya utilizado");
        usados[nullifier] = true;
    }

    function estaUsado(bytes32 nullifier) external view returns (bool) {
        return usados[nullifier];
    }
}
```

**4. Endpoint REST**
```
POST /api/auth/verificar-elegibilidad
Body: { credencial: VCSimulada }
Response: { token: string, expiresIn: number }

POST /api/auth/validar-token
Body: { token: string }
Response: { valido: boolean, sesionId: string }
```

**5. Frontend — Pantalla de verificación de elegibilidad**
- Formulario para ingresar credencial (simulada: número de padrón + nombre)
- Botón "Verificar y obtener acceso"
- Mostrar token/código de acceso al usuario
- Referencia visual: Figura 45 del documento

**Criterio de aceptación del Sprint 1:** ✅ COMPLETADO
- [x] Credencial válida → token generado y almacenado (solo hash SHA-256)
- [x] Credencial inválida → mensaje de error claro
- [x] Token ya usado → rechazo con mensaje
- [x] Todos los intentos (exitosos y fallidos) se registran en LogAuditoria
- [x] El sistema no almacena IPs ni vínculo identidad↔voto

---

### 🗳️ SPRINT 2 — Emisión del Voto (HU2 + RF-02 + RF-03 + RNF-01 + RNF-02)
**Duración:** 1–2 semanas  
**Objetivo:** Implementar la emisión de boleta cifrada y su registro en la blockchain.

#### Contexto técnico:
El votante usa su token anónimo para acceder a la boleta. Selecciona un candidato. El sistema cifra la selección con la clave pública del sistema (ElGamal/RSA). La boleta cifrada se registra como transacción en la blockchain. Se invalida el token para prevenir doble voto.

#### Tareas:

**1. Contrato BulletinBoard (Solidity)**
```solidity
// contracts/BulletinBoard.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BulletinBoard {
    struct Boleta {
        bytes votoCifrado;     // ElGamal ciphertext
        bytes pruebaZK;        // ZK proof de validez
        bytes32 nullifier;     // para anti-doble-voto
        uint256 bloque;        // número de bloque de registro
    }

    Boleta[] public boletas;
    address public admin;
    bool public eleccionAbierta = false;

    event BolетаRegistrada(uint256 indexed id, bytes32 nullifier);

    constructor() { admin = msg.sender; }

    modifier soloAdmin() { require(msg.sender == admin, "Solo admin"); _; }
    modifier eleccionActiva() { require(eleccionAbierta, "Eleccion cerrada"); _; }

    function abrirEleccion() external soloAdmin { eleccionAbierta = true; }
    function cerrarEleccion() external soloAdmin { eleccionAbierta = false; }

    function registrarBoleta(
        bytes calldata votoCifrado,
        bytes calldata pruebaZK,
        bytes32 nullifier
    ) external eleccionActiva {
        boletas.push(Boleta({
            votoCifrado: votoCifrado,
            pruebaZK: pruebaZK,
            nullifier: nullifier,
            bloque: block.number
        }));
        emit BolетаRegistrada(boletas.length - 1, nullifier);
    }

    function totalBoletas() external view returns (uint256) {
        return boletas.length;
    }

    function obtenerBoleta(uint256 id) external view returns (Boleta memory) {
        return boletas[id];
    }
}
```

**2. Módulo criptográfico — VotoService**
```typescript
// backend/services/votoService.ts

// Cifrado ElGamal simplificado (o RSA con clave pública del sistema)
async function cifrarBoleta(candidatoId: number, clavePublica: string): Promise<{
  votoCifrado: Uint8Array;
  pruebaZK: Uint8Array;
  nullifier: string;
}> {
  // 1. Cifrar candidatoId con clave pública del sistema
  // 2. Generar ZK proof de que candidatoId está en el rango [0, numCandidatos)
  // 3. Calcular nullifier desde token anónimo
  // 4. Retornar los tres valores
}

// Registrar boleta en blockchain
async function registrarEnBlockchain(
  votoCifrado: Uint8Array,
  pruebaZK: Uint8Array,
  nullifier: string
): Promise<string> { // retorna txHash
  const contract = new ethers.Contract(BULLETIN_ADDRESS, BulletinBoard.abi, signer);
  const tx = await contract.registrarBoleta(votoCifrado, pruebaZK, nullifier);
  const receipt = await tx.wait();
  return receipt.hash;
}
```

**3. Endpoints REST**
```
POST /api/voto/emitir
Headers: Authorization: Bearer <token-anonimo>
Body: { candidatoId: number }
Response: { txHash: string, nullifier: string, hashComprobante: string }

GET /api/voto/estado-eleccion
Response: { abierta: boolean, candidatos: Candidato[] }
```

**5. Frontend — Pantalla de emisión de voto**
- Lista de candidatos (ficticios) con foto/nombre
- Botón "Seleccionar" por candidato
- Paso de confirmación: "¿Confirmas tu voto por X?"
- Botón "Votar" → llama al backend → muestra hash de verificación
- Referencia visual: Figuras 46 y 47 del documento

**No almacenar:**
- IP del votante
- Timestamp exacto de emisión
- Relación token ↔ candidato

**Criterio de aceptación del Sprint 2:** ✅ COMPLETADO
- [x] Boleta cifrada registrada como transacción inmutable en blockchain local
- [x] Hash de verificación (txHash) entregado al votante
- [x] Intento de doble voto con mismo token → rechazado por NullifierSet
- [x] El voto cifrado NO revela el candidato elegido (ElGamal homomórfico)
- [x] El contrato BulletinBoard emite evento BoletaRegistrada
- [x] Tiempo de proceso < 10 segundos en entorno local

---

### ✅ SPRINT 3 — Verificación Individual y Sesión (HU3 + HU6 + RF-06 + CU-03 + CU-04 + CU-05)
**Duración:** 1 semana  
**Objetivo:** El votante puede confirmar que su voto fue registrado usando su hash. Puede cerrar sesión de forma segura.

#### Tareas:

**1. ComprobantеService**
```typescript
// backend/services/comprobanteService.ts

async function verificarInclusion(txHash: string): Promise<{
  incluido: boolean;
  bloque?: number;
  confirmaciones?: number;
}> {
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { incluido: false };
  return {
    incluido: true,
    bloque: receipt.blockNumber,
    confirmaciones: await provider.getBlockNumber() - receipt.blockNumber
  };
}
```

**2. Endpoints REST**
```
GET /api/voto/verificar/:txHash
Response: { incluido: boolean, bloque: number, confirmaciones: number }

POST /api/auth/cerrar-sesion
Headers: Authorization: Bearer <token-anonimo>
Response: { mensaje: "Sesión cerrada correctamente" }
```

**3. Frontend — Pantalla de verificación**
- Campo para ingresar hash/txHash
- Botón "Verificar"
- Muestra: ✅ Voto incluido en bloque #XXX / ❌ No encontrado
- Referencia visual: Figura 48 del documento

**4. Frontend — Cierre de sesión**
- Botón "Finalizar votación" con confirmación modal
- Invalida el token localmente (limpia localStorage / cookie)
- Redirige a pantalla de inicio
- Referencia visual: Figura 51 del documento

**Criterio de aceptación del Sprint 3:** ✅ COMPLETADO
- [x] Hash válido → confirmación con número de bloque (página `/comprobar`)
- [x] Hash inválido o inexistente → mensaje claro de error (estado "no encontrado")
- [x] La verificación no revela el contenido del voto
- [x] El proceso queda registrado en LogAuditoria

---

### 🏛️ SPRINT 4 — Panel Administrativo (HU8 + CU-06 + CU-07 + RF-08)
**Duración:** 1 semana  
**Objetivo:** Implementar el panel del administrador electoral para abrir/cerrar la jornada.

#### Tareas:

**1. Autenticación de administrador**
```typescript
// backend/controllers/authController.ts
// Login con email + contraseña (bcrypt)
// JWT de corta duración (2 horas)
// Middleware de autorización para rutas /admin/*
```

**2. Contrato AdminParams (Solidity)**
```solidity
// contracts/AdminParams.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AdminParams {
    address public admin;
    string public nombreEleccion;
    address[] public candidatos;
    bytes public clavePublicaEleccion;  // para cifrado ElGamal
    bool public eleccionConfigurada = false;

    constructor(string memory _nombre) {
        admin = msg.sender;
        nombreEleccion = _nombre;
    }

    function configurarCandidatos(address[] calldata _candidatos) external {
        require(msg.sender == admin);
        candidatos = _candidatos;
        eleccionConfigurada = true;
    }
}
```

**3. EleccionService**
```typescript
// backend/services/eleccionService.ts

async function abrirJornada(adminId: string): Promise<void> {
  // 1. Verificar parámetros configurados
  // 2. Llamar BulletinBoard.abrirEleccion()
  // 3. Cambiar estado en DB a "abierta"
  // 4. Registrar en LogAuditoria
}

async function cerrarJornada(adminId: string): Promise<void> {
  // 1. Verificar que esté abierta
  // 2. Llamar BulletinBoard.cerrarEleccion()
  // 3. Cambiar estado en DB a "cerrada"
  // 4. Registrar en LogAuditoria
}
```

**4. Endpoints REST (solo admin)**
```
POST /api/admin/login
POST /api/admin/abrir-jornada
POST /api/admin/cerrar-jornada
GET  /api/admin/estado
GET  /api/admin/logs-auditoria
```

**5. Frontend — Panel Administrativo**
- Login seguro del administrador
- Dashboard: estado de la elección, total de votos registrados
- Botones: "Abrir Jornada" / "Cerrar Jornada" (con confirmación)
- Tabla de logs de auditoría
- Referencia visual: Figura 50 del documento

**Criterio de aceptación del Sprint 4:** ✅ COMPLETADO
- [x] Solo admin autenticado (JWT scrypt) puede abrir/cerrar
- [x] Apertura con parámetros inválidos → error claro
- [x] Doble cierre → mensaje "ya cerrada"
- [x] Cada acción admin queda en LogAuditoria con timestamp
- [x] Panel muestra estado, boletas, candidatos, padrón y logs en tiempo real

---

### 📊 SPRINT 5 — Escrutinio y Publicación de Resultados (HU5 + HU7 + RF-05 + RF-07 + CU-08)
**Duración:** 1–2 semanas  
**Objetivo:** Implementar el conteo cooperativo (con claves parciales) y publicar resultados verificables.

#### Contexto técnico:
Al cerrar la jornada, los validadores (simulados por el equipo) aportan sus claves parciales. El conteo se hace sobre los votos cifrados (homomórfico). Los totales se publican junto con pruebas criptográficas del procedimiento.

#### Tareas:

**1. Contrato EscrutinioContract (Solidity)**
```solidity
// contracts/Escrutinio.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrutinio {
    address public admin;
    uint256 public totalVotos;
    mapping(uint256 => uint256) public votosPorCandidato;
    bool public resultadosPublicados = false;
    bytes public paqueteEvidencias;

    event ResultadosPublicados(uint256 timestamp, bytes evidencias);

    constructor() { admin = msg.sender; }

    function publicarResultados(
        uint256[] calldata totalesPorCandidato,
        bytes calldata evidencias
    ) external {
        require(msg.sender == admin, "Solo admin");
        require(!resultadosPublicados, "Ya publicados");
        for (uint i = 0; i < totalesPorCandidato.length; i++) {
            votosPorCandidato[i] = totalesPorCandidato[i];
            totalVotos += totalesPorCandidato[i];
        }
        paqueteEvidencias = evidencias;
        resultadosPublicados = true;
        emit ResultadosPublicados(block.timestamp, evidencias);
    }
}
```

**2. ResultadosService (escrutinio cooperativo simulado)**
```typescript
// backend/services/resultadosService.ts

// Simulación de desencriptación por umbral (t de n validadores)
async function descifrarVotos(clavesParcialesValidadores: string[]): Promise<{
  [candidatoId: number]: number;
}> {
  // 1. Verificar que se tiene el umbral mínimo de claves
  // 2. Reconstruir clave privada con Shamir's Secret Sharing
  // 3. Descifrar cada boleta del BulletinBoard
  // 4. Contar votos válidos por candidato
  // 5. Generar paquete de evidencias (hashes + parámetros del conteo)
  // 6. Publicar en EscrutinioContract
}

// Generar paquete de evidencias para terceros
async function generarPaqueteAuditoria(): Promise<AuditPackage> {
  return {
    boletas: await obtenerTodasLasBoletas(),    // del BulletinBoard
    parametros: await obtenerParametros(),       // del AdminParams
    totales: await obtenerTotales(),             // del Escrutinio
    guiaVerificacion: "INSTRUCCIONES_CONTEO.md" // para terceros
  };
}
```

**3. Frontend — Pantalla de Resultados**
- Barras/gráficas con votos por candidato
- Total de votos registrados
- Link al paquete de evidencias descargable
- Visor de transacciones en blockchain (read-only)
- Referencia visual: Figura 49 del documento

**Criterio de aceptación del Sprint 5:** ✅ COMPLETADO
- [x] Conteo correcto mediante Shamir SSS (5 custodios, umbral 3) + ElGamal homomórfico
- [x] Resultados publicados en `Escrutinio.sol` (inmutables) con hash de evidencias
- [x] Paquete `evidencias.json` generado por el backend al ejecutar el escrutinio
- [x] Resetear jornada permite múltiples elecciones (`PC-10`, `PC-11`)
- [x] Pantalla `/resultados` es de solo lectura

---

### 🔍 SPRINT 6 — Monitoreo, Auditoría y Anclaje (CU-09 + RNF-05 + RNF-06)
**Duración:** 1 semana  
**Objetivo:** Panel de monitoreo de nodos, visor web de solo lectura, anclaje de evidencias.

#### Tareas:

**1. Panel de monitoreo (para operador)**
```typescript
// Métricas a mostrar:
// - Estado de nodos Hardhat (conectado/desconectado)
// - Altura de bloque actual
// - Total de transacciones procesadas
// - Tiempo promedio por transacción
// - Alertas si algún nodo falla
```

**2. Visor web de auditoría (read-only)**
```
GET /api/auditoria/boletas           → lista de boletas cifradas (sin descifrar)
GET /api/auditoria/eventos           → log de eventos del contrato
GET /api/auditoria/paquete           → descarga paquete completo de evidencias
GET /api/auditoria/guia              → instrucciones para reproducir conteo
```

**3. Anclaje en testnet pública (opcional - Sepolia/Goerli)**
```typescript
// scripts/anclarEvidencias.ts
// Calcular hash SHA-256 del paquete de evidencias
// Publicar hash en testnet pública como transacción
// Guardar txHash del anclaje para referencia pública
```

**Criterio de aceptación del Sprint 6 (reorientado a endurecimiento criptográfico):** ✅ COMPLETADO
- [x] VC ECDSA secp256k1 real firmada y verificada (no simulada con hash)
- [x] Prueba Schnorr Fiat-Shamir no interactiva generada en browser y verificada en backend
- [x] Cifrado ElGamal homomórfico del voto (vector binario sobre secp256k1)
- [x] Clave de elección ligada al secreto Shamir: `H = sk·G`
- [x] On-chain: solo hash SHA-256 del ciphertext; off-chain: ciphertext completo en SQLite

---

### 🔐 SPRINT 7 — Custodia Distribuida con VC de Custodios ✅ COMPLETADO

> El sprint original era de "Pruebas y Validación". En la implementación real, el Sprint 7 se reorientó a resolver la brecha de confianza en el escrutinio cooperativo (los compartimentos Shamir vivían en disco del servidor, el admin podía ejecutar solo) mediante CredencialCustodio firmada.

#### Entregables implementados:
- [x] Nuevo tipo de VC: `CredencialCustodio` firmada con ECDSA por la Autoridad Electoral
- [x] `inicializarShares` retorna 5 bundles `{custodio, compartimento, vc}` que se descargan automáticamente
- [x] El servidor NO conserva archivos de compartimento — solo `config.json` con `hashSecreto`
- [x] Endpoint `POST /api/admin/escrutinio/aportar-compartimento` con verificación completa
- [x] Buffer en memoria para compartimentos aportados (se limpia al ejecutar o resetear)
- [x] UI en tab Escrutinio: lista de custodios con estado de aporte + formulario de aportación
- [x] Tests: REG-086..089 + REG-083..085 (reset de escrutinio)

---

### 🧪 SPRINT 7 ORIGINAL — Pruebas y Validación del Prototipo (pendiente de defensa)
**Duración:** 1–2 semanas  
**Objetivo:** Ejecutar el piloto con voluntarios y validar todos los criterios del proyecto.

#### Pruebas a ejecutar:

**Pruebas unitarias (Hardhat + Jest)**
```bash
# Contratos
npx hardhat test

# Backend
npm test
```

**Pruebas de integración**
- Flujo completo: credencial → token → voto → verificación → resultados
- Intento de doble voto
- Intento de votar con token inválido
- Apertura/cierre por admin
- Reproducción del conteo por tercero externo

**Pruebas de usabilidad**
- 20–50 voluntarios completan el flujo de votación
- Medir: ¿el proceso toma menos de 60 segundos? (RNF-04)
- Recoger feedback: ¿la interfaz es clara?

**Criterios de éxito del piloto (según documento)**
- [ ] Cada votante verifica la inclusión de su boleta
- [ ] Tercero reproduce el conteo sin acceso especial
- [ ] El sistema continúa ante fallas simples de nodo
- [ ] Tiempo de atención por voto dentro del objetivo
- [ ] La documentación permite repetir el proceso completo

---

## 📐 MODELOS DE DATOS COMPLETOS

### On-Chain (Blockchain)

**Transaccion_Voto_Anonimo (BulletinBoard)**
```
- votoCifrado: bytes          // ElGamal ciphertext del candidato
- pruebaZK: bytes             // prueba Schnorr (bytes vacíos en el prototipo actual)
- nullifier: bytes32          // hash derivado del token anónimo
- bloque: uint256             // número de bloque de registro
```

**Contexto_Eleccion (AdminParams)**
```
- nombreEleccion: string
- candidatos: address[]
- clavePublicaEleccion: bytes
- eleccionConfigurada: bool
```

**Gestion_Tokens (NullifierSet)**
```
- usados: mapping(bytes32 => bool)
```

### Off-Chain (PostgreSQL)

**Administradores**
```sql
id_admin     CUID PRIMARY KEY
nombre       VARCHAR(100)
email        VARCHAR(150) UNIQUE
password     VARCHAR(255)  -- bcrypt
creado_en    TIMESTAMP DEFAULT NOW()
```

**Configuracion_Eleccion**
```sql
id           CUID PRIMARY KEY
nombre       VARCHAR(200)
descripcion  TEXT
fecha_inicio TIMESTAMP
fecha_fin    TIMESTAMP
estado       VARCHAR(20) DEFAULT 'pendiente'  -- pendiente|abierta|cerrada
creado_en    TIMESTAMP DEFAULT NOW()
```

**Log_Auditoria**
```sql
id           CUID PRIMARY KEY
accion       VARCHAR(100)   -- ABRIR_JORNADA, CERRAR_JORNADA, VOTO_EMITIDO, etc.
actor        VARCHAR(100)   -- "admin:xxx" o "sistema"
detalle      TEXT
timestamp    TIMESTAMP DEFAULT NOW()
```

**Sesion_Votante**
```sql
id           CUID PRIMARY KEY
token_hash   VARCHAR(64) UNIQUE  -- SHA-256 del token, nunca el token en claro
usado        BOOLEAN DEFAULT FALSE
creado_en    TIMESTAMP DEFAULT NOW()
usado_en     TIMESTAMP
```

---

## 🔒 PRINCIPIOS DE SEGURIDAD Y PRIVACIDAD

### Lo que el sistema NUNCA debe guardar:
- ❌ IP del votante
- ❌ Timestamp exacto de emisión de voto
- ❌ Relación token ↔ candidato
- ❌ Nombre/identificación junto con voto
- ❌ Datos personales del padrón en blockchain

### Lo que el sistema SÍ debe garantizar:
- ✅ Solo personas elegibles emiten voto (verificación por credencial)
- ✅ Cada persona vota exactamente una vez (NullifierSet)
- ✅ El contenido del voto permanece cifrado hasta el escrutinio final
- ✅ Cualquier votante puede verificar su inclusión (por hash)
- ✅ Cualquier tercero puede reproducir el conteo (paquete de evidencias)
- ✅ Todos los eventos administrativos quedan registrados (LogAuditoria)

---

## 🎯 CRITERIOS DE ACEPTACIÓN GLOBALES DEL PROYECTO

Basados en el documento de grado y los requerimientos definidos:

| ID | Criterio | Sprint | Estado |
|----|---------|--------|--------|
| CA-01 | Credencial válida → token emitido sin exponer identidad | Sprint 1 | ✅ |
| CA-02 | Token inválido/usado → acceso bloqueado | Sprint 1 | ✅ |
| CA-03 | Boleta cifrada registrada en blockchain local | Sprint 2 | ✅ |
| CA-04 | Doble voto con mismo token → rechazado on-chain | Sprint 2 | ✅ |
| CA-05 | Votante recibe hash de verificación tras emitir | Sprint 2 | ✅ |
| CA-06 | Votante puede verificar inclusión sin revelar voto | Sprint 3 | ✅ |
| CA-07 | Cierre de sesión invalida token | Sprint 3 | ✅ |
| CA-08 | Solo admin autenticado puede abrir/cerrar jornada | Sprint 4 | ✅ |
| CA-09 | Conteo correcto y verificable por terceros | Sprint 5 | ✅ |
| CA-10 | Paquete de evidencias descargable y reproducible | Sprint 5 | ✅ |
| CA-11 | Proceso completo < 60 segundos por votante | Defensa | ⏳ pendiente piloto |
| CA-12 | Sistema sigue operativo ante falla de un nodo | — | — (alcance reducido en prototipo) |
| CA-13 | VC firmada con ECDSA real (no simulada) | Sprint 6 | ✅ |
| CA-14 | Prueba ZK del token (Schnorr Fiat-Shamir) | Sprint 6 | ✅ |
| CA-15 | Voto cifrado homomórficamente (ElGamal) | Sprint 6 | ✅ |
| CA-16 | Custodia distribuida: admin no puede ejecutar solo | Sprint 7 | ✅ |

---

## 📁 ESTRUCTURA DE ARCHIVOS CLAVE

```
/contracts
├── contracts/
│   ├── AdminParams.sol        ← parámetros globales
│   ├── BulletinBoard.sol      ← recibe boletas cifradas
│   ├── NullifierSet.sol       ← previene doble voto
│   ├── GestionTokens.sol      ← ciclo de vida de tokens
│   └── Escrutinio.sol         ← conteo cooperativo
├── scripts/
│   ├── deploy.ts              ← despliega todos los contratos
│   └── anclar-evidencias.ts   ← anclaje en testnet
├── test/
│   ├── bulletinBoard.test.ts
│   ├── nullifierSet.test.ts
│   └── escrutinio.test.ts
└── hardhat.config.ts

/backend
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── votoController.ts
│   │   ├── adminController.ts
│   │   └── auditoriaController.ts
│   ├── services/
│   │   ├── votanteService.ts
│   │   ├── votoService.ts
│   │   ├── comprobanteService.ts
│   │   ├── eleccionService.ts
│   │   ├── resultadosService.ts
│   │   └── auditoriaLogger.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── adminAuth.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── voto.routes.ts
│   │   ├── admin.routes.ts
│   │   └── auditoria.routes.ts
│   └── index.ts
└── prisma/
    ├── schema.prisma
    └── migrations/

/frontend/app
├── page.tsx                   ← Landing Page Pública
├── votante/
│   ├── elegibilidad/page.tsx  ← Verificación de Elegibilidad
│   ├── voto/page.tsx          ← Emisión de Voto
│   ├── confirmacion/page.tsx  ← Confirmación + Hash
│   ├── verificar/page.tsx     ← Verificación individual
│   └── fin/page.tsx           ← Cierre de sesión
├── admin/
│   ├── login/page.tsx
│   ├── dashboard/page.tsx     ← Panel Administrativo
│   └── auditoria/page.tsx     ← Logs
└── resultados/
    └── page.tsx               ← Resultados electorales (read-only)

/scripts (utilidades ZK y criptografía)
└── generarPaqueteAuditoria.ts ← empaqueta evidencias
```

---

## 🚀 COMANDOS FRECUENTES DE DESARROLLO

> Todos los comandos se ejecutan desde `votacion-tesis/` (raíz del monorepo).

```bash
# Instalación
yarn install

# Levantar red blockchain local
yarn chain

# Desplegar contratos
yarn deploy

# (Opcional) Configurar elección inicial con candidatos y apertura
yarn workspace @votacion/hardhat hardhat run scripts/setupElection.ts --network localhost

# Levantar backend (puerto 4000)
yarn backend:dev

# Levantar frontend (puerto 3000)
yarn start

# Ejecutar tests de contratos
yarn workspace @votacion/hardhat test

# Ejecutar tests de backend
yarn workspace @votacion/backend test

# Ejecutar tests de frontend
yarn workspace @votacion/nextjs test

# Ejecutar E2E (requiere dev server activo)
yarn workspace @votacion/nextjs test:e2e

# Ejecutar migración de Prisma
yarn workspace @votacion/backend prisma:migrate dev --name <nombre>

# Suite completa con reporte fechado
node scripts/testing/run-all-tests.mjs
```

---

## 📚 REFERENCIAS TÉCNICAS CLAVE

- Contratos Solidity: https://docs.soliditylang.org/en/v0.8.30/
- Hardhat: https://hardhat.org/docs
- Next.js: https://nextjs.org/docs
- Verifiable Credentials W3C: https://www.w3.org/TR/vc-data-model-2.0/
- @noble/curves (secp256k1): https://github.com/paulmillr/noble-curves
- ethers.js: https://docs.ethers.org/v6/
- Prisma ORM: https://www.prisma.io/docs
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Desencriptación por umbral difícil de implementar | Media | Alto | Shamir SSS sobre GF(secp256k1 prime) con umbral 3/5 — implementado en Sprint 5 |
| Voluntarios no entienden la interfaz | Media | Medio | Pruebas de usabilidad presenciales antes de la defensa |
| Red blockchain local se cae durante piloto | Baja | Alto | Scripts de restart de Hardhat; la BD SQLite persiste el estado off-chain |
| Criptografía secp256k1 en browser sin dependencias nativas | Media | Medio | Mitigado con `@noble/curves` (auditada, pure JS, sin WebAssembly requerido) |

---

## 📝 NOTAS FINALES PARA EL DESARROLLO

1. **Empezar siempre por los contratos** — son el núcleo inmutable del sistema. Una vez desplegados en producción (o en el piloto), no se pueden modificar sin redeployar.

2. **Priorizar los Sprints 1, 2 y 5** — son los que implementan el ciclo completo: elegibilidad → voto → conteo. Los demás son importantes pero secundarios.

3. **Documentar cada decisión de diseño** — el proyecto de grado requiere justificación técnica de cada elección. Mantener un archivo `DECISIONES.md`.

4. **El paquete de evidencias es fundamental** — es la demostración práctica de verificabilidad universal. Asegurarse de que sea reproducible por alguien externo.

5. **No olvidar el GLOSARIO** — el documento ya tiene uno completo. Usarlo como referencia cuando el tutor o el relator pregunten por términos técnicos.

6. **El cronograma del documento original** tiene un Diagrama de Gantt (página 149) — usarlo como guía de fechas reales.

---

*Planificación generada para el proyecto de grado de Diego Morón Mejía — UCB San Pablo, La Paz, Bolivia.*
*Última actualización: junio 2026 — Sprint 7 completado. Sprints 0–7 implementados. Pendiente: piloto de usabilidad presencial y defensa.*
