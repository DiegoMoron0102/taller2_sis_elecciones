# 🗳️ eVote3 - Sistema de Votación con Nullifiers Anónimos

Prototipo demostrable de un sistema de votación electrónica basado en blockchain que implementa:

- ✅ **Elegibilidad anónima** mediante nullifiers
- ✅ **Prevención de doble voto** on-chain
- ✅ **Conteo verificable** y auditable
- ✅ **Deploy en testnet** (Sepolia / Base Sepolia)

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación y Setup](#instalación-y-setup)
4. [Despliegue en Sepolia/Base Sepolia](#despliegue-en-sepoliabase-sepolia)
5. [Guía de Uso Paso a Paso](#guía-de-uso-paso-a-paso)
6. [Demostración para el Tribunal](#demostración-para-el-tribunal)
7. [Verificación de Resultados](#verificación-de-resultados)

---

## 🏗️ Arquitectura del Sistema

### Conceptos Clave

El contrato `DemoVoteNullifier` implementa tres pilares fundamentales:

#### 1. **Nullifiers (Identificadores Anónimos)**
```
Token Secreto (off-chain) → keccak256() → Nullifier Hash (on-chain)
"voter-secret-123"         →  hash       → 0x1a2b3c...
```

- Cada votante recibe un **token secreto** único generado off-chain
- El contrato solo registra el **hash** (nullifier), nunca la identidad
- El votante usa el nullifier para ejercer su voto de forma anónima

#### 2. **Prevención de Doble Voto**
```solidity
mapping(bytes32 => bool) public isUsedNullifier;
```

- Cada nullifier solo puede usarse **una vez**
- El contrato verifica y marca el nullifier como "usado" al votar
- Intentos de doble voto son rechazados automáticamente

#### 3. **Conteo Verificable**
```solidity
struct Candidate {
    string name;
    uint256 votes;
}
```

- Los votos se cuentan on-chain en tiempo real
- Cualquiera puede auditar los resultados leyendo el estado del contrato
- Eventos `VoteCast` permiten rastrear cada voto en la blockchain

### Estados de la Elección

```
Setup → Open → Closed
  |       |       |
  |       |       └─→ Solo lectura de resultados
  |       └─→ Se pueden emitir votos
  └─→ Configuración inicial (candidatos, nullifiers)
```

---

## ⚙️ Requisitos Previos

### 1. MetaMask
- Instalar la extensión de [MetaMask](https://metamask.io/)
- Configurar la red **Sepolia** o **Base Sepolia**

### 2. Test ETH
Conseguir ETH de prueba de un faucet:

**Para Sepolia:**
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

**Para Base Sepolia:**
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### 3. Herramientas
- Navegador web moderno (Chrome, Firefox, Brave)
- [Remix IDE](https://remix.ethereum.org) (no requiere instalación)

---

## 🚀 Instalación y Setup

### Opción 1: Clonar el Repositorio

```powershell
git clone https://github.com/tu-usuario/eVote3.git
cd eVote3
```

### Opción 2: Descargar Archivos Manualmente

1. Descarga el archivo `DemoVoteNullifier.sol` desde la carpeta `contracts/`
2. Descarga el generador de nullifiers desde `scripts/generateNullifiers.html`

---

## 🌐 Despliegue en Sepolia/Base Sepolia

### Paso 1: Configurar MetaMask

1. Abre MetaMask
2. Selecciona la red **Sepolia** (o Base Sepolia)
3. Verifica que tienes test ETH (al menos 0.01 ETH)

### Paso 2: Abrir Remix

1. Ve a [https://remix.ethereum.org](https://remix.ethereum.org)
2. Crea un nuevo archivo: `DemoVoteNullifier.sol`
3. Copia y pega el contenido del contrato desde `contracts/DemoVoteNullifier.sol`

### Paso 3: Compilar el Contrato

1. En Remix, ve a la pestaña **"Solidity Compiler"** (icono de S)
2. Selecciona versión del compilador: **0.8.20** o superior
3. Haz clic en **"Compile DemoVoteNullifier.sol"**
4. Verifica que no haya errores (debe aparecer un check verde ✓)

### Paso 4: Desplegar el Contrato

1. Ve a la pestaña **"Deploy & Run Transactions"** (icono de Ethereum)
2. En **"Environment"**, selecciona **"Injected Provider - MetaMask"**
3. Confirma que MetaMask se conectó y muestra la red correcta
4. En el campo del constructor, ingresa los candidatos:
   ```
   ["Candidato A", "Candidato B", "Voto en Blanco"]
   ```
5. Haz clic en **"Deploy"**
6. Confirma la transacción en MetaMask
7. Espera a que se confirme (aparecerá el contrato en "Deployed Contracts")

**🎉 ¡Contrato desplegado!** Copia la dirección del contrato para futuras referencias.

---

## 📖 Guía de Uso Paso a Paso

### Fase 1: Generar Nullifiers

#### Opción A: Usando la Herramienta Web

1. Abre `scripts/generateNullifiers.html` en tu navegador
2. Ingresa el número de votantes (ej: 5)
3. Haz clic en **"Generar Nullifiers"**
4. Copia el array de nullifiers que aparece

#### Opción B: Usando Node.js

```powershell
cd scripts
node generateNullifiers.js 5
```

Ejemplo de salida:
```
Votante 1:
  Token secreto: voter-secret-1701234567890-abc123
  Nullifier (hash): 0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890

...

ARRAY PARA REGISTRAR:
["0x1a2b...", "0x2b3c...", "0x3c4d..."]
```

**⚠️ IMPORTANTE:** Guarda los tokens secretos en un lugar seguro. Los necesitarás para simular votos.

### Fase 2: Registrar Nullifiers en el Contrato

1. En Remix, bajo "Deployed Contracts", expande tu contrato
2. Busca la función **`registerNullifiers`**
3. Pega el array de nullifiers (con comillas y corchetes)
4. Haz clic en **"transact"**
5. Confirma en MetaMask
6. Verifica el evento `NullifiersRegistered` en la consola de Remix

### Fase 3: Abrir la Elección

1. Busca la función **`openElection`**
2. Haz clic en **"transact"**
3. Confirma en MetaMask
4. Verifica que el estado cambió a `Open`:
   - Llama a `state()` → debe devolver `1` (Open)

### Fase 4: Emitir Votos

Para cada votante:

1. Busca la función **`castVote`**
2. Ingresa los parámetros:
   ```
   nullifier: 0x1a2b3c4d... (el hash del votante)
   candidateIndex: 0         (índice del candidato: 0, 1, 2...)
   ```
3. Haz clic en **"transact"**
4. Confirma en MetaMask

**Prueba la prevención de doble voto:**
- Intenta votar de nuevo con el mismo nullifier
- Debe fallar con error: "Nullifier ya utilizado (doble voto)"

### Fase 5: Verificar Resultados

1. Llama a **`getCandidate`** con el índice de cada candidato:
   ```
   getCandidate(0) → ("Candidato A", 3)
   getCandidate(1) → ("Candidato B", 2)
   ```

2. Verifica el estado de un nullifier:
   ```
   getNullifierStatus(0x1a2b...) → (true, true)
   // (elegible=true, usado=true)
   ```

3. Revisa los eventos en la consola de Remix:
   - `VoteCast` muestra cada voto emitido

### Fase 6: Cerrar la Elección

1. Llama a **`closeElection`**
2. Confirma en MetaMask
3. Intenta votar de nuevo → debe fallar: "La eleccion no esta en el estado esperado"

---

## 🎓 Demostración para el Tribunal

### Guión de Demostración (3-5 minutos)

#### 1. **Introducción** (30 seg)
> "Hemos implementado un sistema de votación electrónica en blockchain que garantiza anonimato, previene el doble voto y permite auditoría pública. El contrato está desplegado en Sepolia testnet."

#### 2. **Mostrar el Contrato Desplegado** (45 seg)
- Abrir Remix con el contrato desplegado
- Mostrar la dirección del contrato en Sepolia Etherscan
- Explicar: "Este contrato es inmutable y público. Cualquiera puede verificar su código y su estado."

#### 3. **Demostrar Nullifiers Anónimos** (60 seg)
```
Off-chain:  Token secreto → keccak256() → Nullifier
On-chain:   Solo se registra el hash, nunca la identidad
```

- Mostrar generador de nullifiers
- Mostrar función `registerNullifiers` con hashes
- Explicar: "El contrato solo ve hashes. La identidad del votante queda off-chain."

#### 4. **Demostrar Votación y Prevención de Doble Voto** (90 seg)
- Llamar a `castVote` con un nullifier → **exitoso**
- Mostrar que el contador del candidato aumentó
- Intentar votar de nuevo con el mismo nullifier → **falla**
- Explicar: "El contrato marca el nullifier como usado. Imposible votar dos veces."

#### 5. **Mostrar Auditoría y Resultados** (45 seg)
- Llamar a `getCandidate(0)`, `getCandidate(1)`, etc.
- Mostrar eventos `VoteCast` en Remix
- Abrir Sepolia Etherscan y mostrar transacciones
- Explicar: "Los resultados son públicos y verificables por cualquiera en tiempo real."

#### 6. **Cierre** (30 seg)
> "Este prototipo demuestra los principios clave: anonimato mediante nullifiers, prevención de doble voto on-chain, y transparencia total en el conteo. En producción, los nullifiers vendrían acompañados de pruebas zero-knowledge para mayor seguridad."

### Posibles Preguntas del Tribunal

**P: ¿Cómo se garantiza que solo votantes elegibles participen?**
> R: Off-chain se generan nullifiers únicos por votante elegible. Solo esos hashes son registrados en el contrato. Sin el token secreto correcto, no se puede generar un nullifier válido.

**P: ¿Qué pasa si alguien roba un token secreto?**
> R: En esta demo, el token es simple. En producción, se usarían credenciales criptográficas (ZK-SNARKs) que demuestran elegibilidad sin revelar identidad ni permitir transferencia.

**P: ¿Por qué usar blockchain en lugar de una base de datos?**
> R: Tres razones clave:
> 1. **Inmutabilidad**: Los votos no pueden alterarse una vez registrados
> 2. **Transparencia**: Cualquiera puede auditar sin depender de autoridades
> 3. **Descentralización**: No hay un punto único de falla o control

**P: ¿Esto es escalable para elecciones reales?**
> R: Esta demo está en testnet. Para producción, se usarían soluciones L2 (rollups) como Base, Optimism o Arbitrum, que procesan miles de transacciones por segundo con costos mínimos.

---

## 🔍 Verificación de Resultados

### En Remix

```javascript
// Consultar número total de candidatos
getCandidatesCount()  // → 3

// Consultar votos de cada candidato
getCandidate(0)  // → ("Candidato A", 5)
getCandidate(1)  // → ("Candidato B", 3)
getCandidate(2)  // → ("Voto en Blanco", 1)

// Verificar estado de un nullifier
getNullifierStatus(0x1a2b...)  // → (true, true)
```

### En Sepolia Etherscan

1. Ve a [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
2. Pega la dirección de tu contrato
3. Revisa:
   - **Transactions**: Todas las llamadas a `castVote`, `registerNullifiers`, etc.
   - **Events**: Log completo de eventos `VoteCast`, `ElectionOpened`, etc.
   - **Read Contract**: Consultar `candidates`, `state`, etc. directamente

### En Base Sepolia

Si desplegaste en Base Sepolia:
1. Ve a [https://sepolia.basescan.org](https://sepolia.basescan.org)
2. Mismo proceso que Etherscan

---

## 📊 Estructura del Proyecto

```
eVote3/
│
├── contracts/
│   └── DemoVoteNullifier.sol      # Smart contract principal
│
├── scripts/
│   ├── generateNullifiers.js      # Generador CLI (Node.js)
│   └── generateNullifiers.html    # Generador web (navegador)
│
├── docs/
│   └── PRESENTATION.md            # Guía de presentación
│
└── README.md                      # Este archivo
```

---

## 🛠️ Funciones del Contrato

### Administración (solo admin)

| Función | Descripción |
|---------|-------------|
| `registerNullifiers(bytes32[] nullifiers)` | Registra un lote de nullifiers elegibles |
| `openElection()` | Abre la elección para votación |
| `closeElection()` | Cierra la elección |
| `addCandidate(string name)` | Añade un candidato (solo en fase Setup) |

### Votación (cualquier usuario)

| Función | Descripción |
|---------|-------------|
| `castVote(bytes32 nullifier, uint256 candidateIndex)` | Emite un voto anónimo |

### Consultas (cualquier usuario)

| Función | Descripción |
|---------|-------------|
| `getCandidatesCount()` | Retorna el número de candidatos |
| `getCandidate(uint256 index)` | Retorna nombre y votos de un candidato |
| `getNullifierStatus(bytes32 nullifier)` | Verifica si un nullifier es elegible/usado |
| `state()` | Retorna el estado actual de la elección |

---

## 🔐 Consideraciones de Seguridad

### En esta Demo

✅ **Implementado:**
- Prevención de doble voto mediante nullifiers
- Control de estados de elección
- Validación de candidatos
- Eventos auditables

⚠️ **Simplificado para demo (no usar en producción):**
- Nullifiers son hashes simples sin pruebas ZK
- No hay verificación criptográfica de elegibilidad
- Admin centralizado (única wallet)

### Para Producción

📚 **Mejoras necesarias:**
- **ZK-SNARKs**: Pruebas zero-knowledge para anonimato criptográfico
- **MPC o Threshold Crypto**: Administración descentralizada
- **Cifrado homomórfico**: Opcionalmente, para votos encriptados
- **Optimistic Rollups o ZK-Rollups**: Para escalabilidad
- **Registro de votantes fuera de blockchain**: Sistema de identidad digital

---

## 🎯 Casos de Uso de la Demo

### 1. Demo Académica ✓
- Explicar conceptos de blockchain aplicados a votación
- Mostrar inmutabilidad y transparencia
- Demostrar prevención de fraude

### 2. Prototipo Técnico ✓
- Validar arquitectura de nullifiers
- Probar flujo de votación end-to-end
- Medir gas costs y performance

### 3. Piloto en Organización Pequeña ✓
- Elección de representantes estudiantiles
- Votación interna de asociación
- Decisiones comunitarias con ~100-1000 votantes

### 4. Elecciones Gubernamentales ✗
- **No recomendado** sin las mejoras de producción listadas arriba

---

## 📞 Soporte y Contacto

- **GitHub Issues**: [Reportar problemas](https://github.com/tu-usuario/eVote3/issues)
- **Documentación adicional**: Ver carpeta `docs/`

---

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- **Ethereum Foundation**: Por la infraestructura de Sepolia
- **Base / Optimism**: Por Base Sepolia testnet
- **Remix Team**: Por el IDE en navegador
- **OpenZeppelin**: Por estándares de seguridad en Solidity

---

## 🚀 Próximos Pasos

1. [ ] Integrar ZK-SNARKs usando Circom + SnarkJS
2. [ ] Implementar frontend web con React + ethers.js
3. [ ] Deploy en mainnet L2 (Base, Optimism, Arbitrum)
4. [ ] Integrar con sistema de identidad digital (DID)
5. [ ] Auditoría de seguridad profesional

---

**¡Buena suerte con tu presentación! 🎓**
