# Ejemplos de Uso - eVote3

## Ejemplo 1: Elección Simple (3 Candidatos)

### Paso 1: Desplegar el contrato

En Remix, usa estos parámetros para el constructor:

```javascript
["Candidato A", "Candidato B", "Voto en Blanco"]
```

### Paso 2: Generar nullifiers

Abre `generateNullifiers.html` y genera 5 votantes. Obtendrás algo como:

```javascript
[
  "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  "0x2b3c4d5e6f7890a1bcdef1234567890abcdef1234567890abcdef1234567891",
  "0x3c4d5e6f7890a1b2cdef1234567890abcdef1234567890abcdef1234567892",
  "0x4d5e6f7890a1b2c3def1234567890abcdef1234567890abcdef1234567893",
  "0x5e6f7890a1b2c3d4ef1234567890abcdef1234567890abcdef1234567894"
]
```

### Paso 3: Registrar nullifiers

En Remix, llama a:

```javascript
registerNullifiers([
  "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  "0x2b3c4d5e6f7890a1bcdef1234567890abcdef1234567890abcdef1234567891",
  "0x3c4d5e6f7890a1b2cdef1234567890abcdef1234567890abcdef1234567892",
  "0x4d5e6f7890a1b2c3def1234567890abcdef1234567890abcdef1234567893",
  "0x5e6f7890a1b2c3d4ef1234567890abcdef1234567890abcdef1234567894"
])
```

### Paso 4: Abrir elección

```javascript
openElection()
```

### Paso 5: Emitir votos

```javascript
// Votante 1 vota por Candidato A (índice 0)
castVote("0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890", 0)

// Votante 2 vota por Candidato A
castVote("0x2b3c4d5e6f7890a1bcdef1234567890abcdef1234567890abcdef1234567891", 0)

// Votante 3 vota por Candidato B (índice 1)
castVote("0x3c4d5e6f7890a1b2cdef1234567890abcdef1234567890abcdef1234567892", 1)

// Votante 4 vota por Candidato B
castVote("0x4d5e6f7890a1b2c3def1234567890abcdef1234567890abcdef1234567893", 1)

// Votante 5 vota por Voto en Blanco (índice 2)
castVote("0x5e6f7890a1b2c3d4ef1234567890abcdef1234567890abcdef1234567894", 2)
```

### Paso 6: Ver resultados

```javascript
getCandidate(0)  // → ("Candidato A", 2)
getCandidate(1)  // → ("Candidato B", 2)
getCandidate(2)  // → ("Voto en Blanco", 1)
```

### Paso 7: Cerrar elección

```javascript
closeElection()
```

---

## Ejemplo 2: Referéndum (Sí/No)

### Constructor:

```javascript
["Sí", "No"]
```

### Votos de ejemplo:

```javascript
castVote("0xabc...", 0)  // Vota Sí
castVote("0xdef...", 1)  // Vota No
castVote("0x123...", 0)  // Vota Sí
```

### Resultados:

```javascript
getCandidate(0)  // → ("Sí", 2)
getCandidate(1)  // → ("No", 1)
```

---

## Ejemplo 3: Elección con Múltiples Candidatos

### Constructor:

```javascript
[
  "Partido A - Candidato 1",
  "Partido B - Candidato 2", 
  "Partido C - Candidato 3",
  "Partido D - Candidato 4",
  "Independiente - Candidato 5",
  "Voto en Blanco"
]
```

### Distribución de votos de ejemplo:

```javascript
castVote("0x001...", 0)  // Partido A
castVote("0x002...", 0)  // Partido A
castVote("0x003...", 0)  // Partido A
castVote("0x004...", 1)  // Partido B
castVote("0x005...", 1)  // Partido B
castVote("0x006...", 2)  // Partido C
castVote("0x007...", 4)  // Independiente
castVote("0x008...", 5)  // Voto en Blanco
```

### Resultados:

```javascript
getCandidate(0)  // → ("Partido A - Candidato 1", 3)
getCandidate(1)  // → ("Partido B - Candidato 2", 2)
getCandidate(2)  // → ("Partido C - Candidato 3", 1)
getCandidate(3)  // → ("Partido D - Candidato 4", 0)
getCandidate(4)  // → ("Independiente - Candidato 5", 1)
getCandidate(5)  // → ("Voto en Blanco", 1)
```

---

## Ejemplo 4: Añadir Candidato Durante Setup

Si olvidaste un candidato, puedes añadirlo antes de abrir la elección:

```javascript
// Estado debe ser Setup (0)
state()  // → 0

// Añadir nuevo candidato
addCandidate("Candidato Adicional")

// Verificar que se añadió
getCandidatesCount()  // → 4 (si antes tenías 3)
getCandidate(3)  // → ("Candidato Adicional", 0)

// Ahora sí, abrir la elección
openElection()
```

---

## Ejemplo 5: Verificar Estado de Nullifiers

Útil para debugging y demos:

```javascript
// Verificar si un nullifier está registrado y si ya se usó
getNullifierStatus("0x1a2b...")  // → (true, false) - Elegible, no usado
                                  // → (true, true) - Elegible, ya usado
                                  // → (false, false) - No elegible
```

---

## Ejemplo 6: Manejo de Errores Comunes

### Error: "Solo el admin puede ejecutar esta funcion"

```javascript
// Causa: Intentas llamar registerNullifiers, openElection, etc. desde una wallet que no es la que desplegó el contrato

// Solución: Cambia a la wallet del admin en MetaMask
```

### Error: "La eleccion no esta en el estado esperado"

```javascript
// Causa: Intentas votar cuando la elección está en Setup o Closed

// Verificar estado:
state()  // 0 = Setup, 1 = Open, 2 = Closed

// Solución: 
// Si está en Setup (0), llama a openElection()
// Si está en Closed (2), la elección ya terminó
```

### Error: "Nullifier no registrado (no elegible)"

```javascript
// Causa: El nullifier que usaste no fue registrado previamente

// Verificar:
getNullifierStatus("0xabc...")  // Debe devolver (true, ?)

// Solución: Asegúrate de que el nullifier está en el array que pasaste a registerNullifiers
```

### Error: "Nullifier ya utilizado (doble voto)"

```javascript
// Causa: Ya votaste con ese nullifier

// Verificar:
getNullifierStatus("0xabc...")  // → (true, true)

// Esto es el comportamiento esperado: previene doble voto
// No es un error, es la protección funcionando
```

### Error: "Indice de candidato invalido"

```javascript
// Causa: El índice del candidato no existe

// Verificar cuántos candidatos hay:
getCandidatesCount()  // → 3

// Los índices válidos son: 0, 1, 2
// Si intentas castVote(..., 3), fallará
```

---

## Ejemplo 7: Script Completo para Testing

Copia este script en la consola de Remix después de desplegar:

```javascript
// 1. Preparar datos
const nullifiers = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333333333333333333333333333"
];

// 2. Registrar nullifiers
await contract.methods.registerNullifiers(nullifiers).send({ from: accounts[0] });
console.log("✓ Nullifiers registrados");

// 3. Abrir elección
await contract.methods.openElection().send({ from: accounts[0] });
console.log("✓ Elección abierta");

// 4. Emitir votos
await contract.methods.castVote(nullifiers[0], 0).send({ from: accounts[0] });
console.log("✓ Voto 1 emitido");

await contract.methods.castVote(nullifiers[1], 1).send({ from: accounts[0] });
console.log("✓ Voto 2 emitido");

await contract.methods.castVote(nullifiers[2], 0).send({ from: accounts[0] });
console.log("✓ Voto 3 emitido");

// 5. Ver resultados
const c0 = await contract.methods.getCandidate(0).call();
const c1 = await contract.methods.getCandidate(1).call();
console.log(`Candidato 0: ${c0.name} - ${c0.votes} votos`);
console.log(`Candidato 1: ${c1.name} - ${c1.votes} votos`);

// 6. Cerrar elección
await contract.methods.closeElection().send({ from: accounts[0] });
console.log("✓ Elección cerrada");
```

---

## Ejemplo 8: Integración con Web3.js (Frontend)

Si quieres crear un frontend web:

```javascript
// Conectar con MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();

// Conectar con el contrato
const contractAddress = "0xTU_DIRECCION_AQUI";
const contractABI = [...]; // ABI del contrato
const contract = new ethers.Contract(contractAddress, contractABI, signer);

// Votar
const nullifier = "0xabc..."; // Obtener del usuario
const candidateIndex = 0;     // Obtener del usuario

const tx = await contract.castVote(nullifier, candidateIndex);
await tx.wait();
console.log("Voto registrado!");

// Leer resultados
const candidate = await contract.getCandidate(0);
console.log(`${candidate.name}: ${candidate.votes} votos`);
```

---

## Ejemplo 9: Verificación en Etherscan

1. Ve a Sepolia Etherscan: https://sepolia.etherscan.io
2. Pega la dirección de tu contrato
3. Ve a la pestaña "Events"
4. Busca eventos `VoteCast`:

```
VoteCast (
  nullifier: 0x1a2b3c4d...,
  candidateIndex: 0
)
```

5. Haz clic en la transacción para ver detalles completos

---

## Ejemplo 10: Exportar Resultados (Off-chain)

Puedes leer todos los eventos y crear un reporte:

```javascript
// Obtener todos los eventos VoteCast
const filter = contract.filters.VoteCast();
const events = await contract.queryFilter(filter);

// Procesar resultados
const results = {};
events.forEach(event => {
  const candidateIndex = event.args.candidateIndex.toNumber();
  results[candidateIndex] = (results[candidateIndex] || 0) + 1;
});

console.log("Resultados finales:", results);
// → { 0: 5, 1: 3, 2: 1 }

// Exportar a JSON
const json = JSON.stringify(results, null, 2);
console.log(json);
```

---

¡Estos ejemplos cubren los casos de uso más comunes! 🎉
