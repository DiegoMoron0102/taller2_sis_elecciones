# Plan de Estudio para la Defensa — VotoSeguro
**Sistema de Votación Electrónica Descentralizada Verificable**
Diego Morón Mejía — UCB San Pablo, La Paz

> Este documento es tu guía de preparación. No te dice qué mostrar en la defensa,
> te dice qué entender profundamente para poder explicar cualquier decisión técnica
> en el momento que el tribunal pregunte.

---

## Cómo usar este documento

Cada sección tiene tres partes:
1. **Qué debes entender** — el concepto matemático o de diseño
2. **Cómo está en tu código** — la línea o función exacta donde vive
3. **Preguntas frecuentes del tribunal** — con la respuesta correcta

Estudia en el orden del documento. Las secciones iniciales son base para las siguientes.

---

## MÓDULO 1 — Fundamentos matemáticos usados en el sistema

### 1.1 La curva secp256k1

**Qué debes entender:**
Una curva elíptica es un conjunto de puntos `(x, y)` que satisfacen `y² = x³ + 7` sobre un campo finito enorme (primo de 256 bits). Lo que importa para tu sistema es esta propiedad:

- Dado un punto base `G`, calcular `k · G` es fácil (multiplicación escalar, O(log k))
- Dado el resultado `P = k · G`, recuperar `k` es computacionalmente imposible

Esto se llama **Problema del Logaritmo Discreto en Curvas Elípticas (ECDLP)** y es la base de seguridad de todo el sistema.

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/schnorr.ts — líneas 4-5
const G = secp256k1.ProjectivePoint.BASE;  // el punto base G
const ORDER = secp256k1.CURVE.n;           // el orden del grupo (~2^256)
```

**Preguntas frecuentes:**
- *¿Por qué secp256k1 y no otra curva?* — Es la misma curva que usa Ethereum y Bitcoin. Está ampliamente auditada, tiene implementaciones maduras (`@noble/curves`), y la eliges por coherencia con el ecosistema blockchain del sistema.
- *¿Qué significa "campo finito"?* — Que todas las operaciones se hacen módulo un número primo `p`. Los puntos no son números reales sino residuos.

---

### 1.2 El Problema del Logaritmo Discreto (tu garantía de seguridad)

**Qué debes entender:**
Toda la privacidad del sistema descansa en un solo supuesto: **dado `P = k·G`, nadie puede calcular `k` en tiempo razonable**.

- El token del votante es un escalar `t` (número de 256 bits)
- El `tokenPoint = t · G` se guarda en la base de datos
- Nadie que vea `tokenPoint` puede recuperar `t` — porque eso requeriría resolver ECDLP

**Cómo está en tu código:**
```typescript
// packages/backend/src/services/votanteService.ts
// Al emitir el token:
const tokenPoint = calcularTokenPoint(token);  // t·G, guardado en BD
// El token en sí NUNCA se guarda en BD, solo su hash SHA-256
```

**Preguntas frecuentes:**
- *¿Qué pasaría si alguien roba la base de datos?* — Ve `tokenPoint` (punto en la curva) y `tokenHash` (SHA-256 del token). De ninguno puede recuperar el token original. El logaritmo discreto lo hace imposible con hardware actual y previsible.

---

### 1.3 Aritmética modular

**Qué debes entender:**
Todas las operaciones criptográficas del sistema ocurren módulo el orden del grupo `n`. Esto garantiza que los resultados siempre sean escalares válidos.

Fórmula Schnorr: `s = (r + c · t) mod n`

Si no hubiera el módulo, `s` podría crecer indefinidamente. Con el módulo, siempre cabe en 256 bits y es un escalar válido de la curva.

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/schnorr.ts — línea 44
const s = ((r + c * tokenScalar) % ORDER + ORDER) % ORDER;
// El "+ ORDER) % ORDER" es para manejar resultados negativos en BigInt
```

---

## MÓDULO 2 — Prueba de Conocimiento Cero (Schnorr-Fiat-Shamir)

### 2.1 Qué es una ZK Proof formalmente

**Qué debes entender:**
Una Prueba de Conocimiento Cero (ZKP) es un protocolo entre un **Probador** y un **Verificador** donde el Probador convence al Verificador de que conoce un secreto, sin revelar el secreto. Para ser válida debe cumplir tres propiedades:

| Propiedad | Definición simple |
|---|---|
| **Completitud** | Si el probador es honesto, siempre convence al verificador |
| **Solidez** | Un probador deshonesto no puede convencer al verificador (salvo probabilidad negligible) |
| **Conocimiento-cero** | El verificador aprende exactamente cero información sobre el secreto |

**Tu sistema prueba exactamente esto:**
> "Conozco el escalar secreto `t` tal que `tokenPoint = t · G`"

---

### 2.2 El Protocolo de Schnorr paso a paso

**Qué debes entender:**
El protocolo interactivo tiene 3 pasos:

```
Probador (tiene t)                     Verificador (tiene tokenPoint = t·G)
─────────────────────────────────────────────────────────────────────────
1. Elige r aleatorio
   Calcula R = r·G
   ─────── R ────────────────────────>

2.                                      Elige reto c aleatorio
   <────── c ──────────────────────────

3. Calcula s = r + c·t (mod n)
   ─────── s ────────────────────────>

                                        Verifica: s·G == R + c·tokenPoint
```

**Por qué funciona:**
- Si el probador conoce `t`: `s·G = (r + c·t)·G = r·G + c·(t·G) = R + c·tokenPoint` ✓
- Si el probador NO conoce `t`: debe adivinar `s` tal que `s·G - R = c·tokenPoint`, lo que requiere resolver ECDLP

---

### 2.3 La transformación Fiat-Shamir (cómo se vuelve no-interactivo)

**Qué debes entender:**
El protocolo interactivo requiere que el verificador envíe el reto `c`. En la práctica, el probador **simula el reto** usando un hash:

```
c = SHA256(R || tokenPoint || mensaje) mod n
```

Esto funciona porque SHA-256 se comporta como un **oráculo aleatorio** — su salida es indistinguible de aleatoriedad. El probador no puede "predecir" el hash para hacer trampa.

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/schnorr.ts — líneas 13-18
export function computarReto(R: string, tokenPoint: string, mensaje: string): bigint {
  const hash = crypto.createHash("sha256")
    .update(R + tokenPoint + mensaje)
    .digest("hex");
  return BigInt("0x" + hash) % ORDER;
}
```

**El mensaje `"votoseguro:vote:{candidatoId}"`:**
Este detalle es crítico — el mensaje vincula la prueba a un candidato específico. Una prueba generada para votar por el candidato 0 no sirve para votar por el candidato 1, porque el hash `c` sería diferente.

**Preguntas frecuentes:**
- *¿Por qué SHA-256 y no otro hash?* — SHA-256 es el estándar NIST, está disponible en Node.js nativo sin dependencias, y cumple las propiedades de oráculo aleatorio requeridas por la demostración de seguridad de Fiat-Shamir [Bellare & Rogaway, 1993].
- *¿Es esta una "ZK proof real"?* — Sí. El protocolo de Schnorr con Fiat-Shamir es una **NIZKPoK (Non-Interactive Zero-Knowledge Proof of Knowledge)** formalmente demostrada en la literatura criptográfica. La diferencia con Noir/PLONK es que Schnorr es específica para el enunciado del logaritmo discreto, mientras que los SNARKs son de propósito general. Para el enunciado concreto del sistema ("conozco mi token"), Schnorr es igualmente rigurosa y más eficiente.
- *¿Dónde se verifica la prueba?* — En `packages/backend/src/services/votoService.ts`, dentro de `emitirVoto()`. El backend lee `tokenPoint` de la BD y ejecuta `verificarSchnorr()`.

---

### 2.4 Verificación línea por línea

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/schnorr.ts — líneas 50-65
export function verificarSchnorr(tokenPointHex, prueba, mensaje): boolean {
  const R = secp256k1.ProjectivePoint.fromHex(prueba.R);
  const tokenPoint = secp256k1.ProjectivePoint.fromHex(tokenPointHex);
  const s = BigInt("0x" + prueba.s) % ORDER;

  const c = computarReto(prueba.R, tokenPointHex, mensaje); // reto recomputado

  const lhs = G.multiply(s);              // s·G
  const rhs = R.add(tokenPoint.multiply(c)); // R + c·tokenPoint

  return lhs.equals(rhs);  // s·G == R + c·tokenPoint
}
```

Cada variable tiene un rol preciso que debes poder explicar de memoria.

---

## MÓDULO 3 — Credenciales Verificables (ECDSA)

### 3.1 Qué es una Credencial Verificable W3C

**Qué debes entender:**
Una VC es un documento JSON firmado digitalmente que prueba una afirmación. La estructura básica es:

```json
{
  "credentialSubject": {
    "numeroPadron": "LP123456",
    "nombre": "Juan Pérez",
    "elegible": true
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "proofValue": "3a4f..."  // firma ECDSA de 64 bytes
  }
}
```

La autoridad emisora firma el payload con su clave privada. Cualquiera puede verificar la firma con la clave pública, sin necesidad de consultar a la autoridad.

**Por qué es útil aquí:**
Sin VC, el sistema tendría que consultar una base de datos central para saber si el votante es elegible. Con VC, la elegibilidad está "comprimida" en un documento que el votante carga y el backend verifica localmente.

---

### 3.2 Cómo funciona la firma ECDSA en tu sistema

**Qué debes entender:**
ECDSA (Elliptic Curve Digital Signature Algorithm):

1. **Emisión:** La autoridad calcula `msgHash = SHA256(payload)` y firma con su clave privada: `sig = sign(msgHash, privateKey)`. La firma son 64 bytes.
2. **Verificación:** El backend recalcula `msgHash` y verifica `verify(sig, msgHash, publicKey)` — si la firma no coincide, la VC fue alterada o es falsa.

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/vcAuthority.ts
// Emisión:
const msgHash = crypto.createHash("sha256").update(payload).digest();
const sig = secp256k1.sign(msgHash, VC_AUTHORITY_PRIVATE_KEY);
proofValue = sig.toCompactRawBytes().toString("hex"); // 128 hex chars

// Verificación:
const isValid = secp256k1.verify(sig, msgHash, publicKey);
```

**Preguntas frecuentes:**
- *¿Qué es `VC_AUTHORITY_PRIVATE_KEY`?* — Una clave privada secp256k1 de 32 bytes almacenada como variable de entorno en `.env.local`. En producción nunca debería estar en disco sin hardware security module (HSM).
- *¿Por qué la firma es "determinista con la misma `issuanceDate`"?* — Porque el payload incluye la fecha. El mismo padrón + misma fecha → mismo msgHash → misma firma. Esto permite reproducir evidencias para auditoría.

---

## MÓDULO 4 — Cifrado ElGamal Homomórfico

### 4.1 Qué es el cifrado homomórfico

**Qué debes entender:**
Un cifrado homomórfico permite operar sobre datos cifrados sin descifrarlos. En el contexto de votación:

```
Cifrado(1) + Cifrado(1) + Cifrado(0) = Cifrado(2)
```

Nadie ve los votos individuales. Solo al final se descifra el **total**, no cada voto.

Esto preserva la privacidad: incluso el administrador que ejecuta el escrutinio solo ve el resultado agregado, no quién votó qué.

---

### 4.2 ElGamal en curvas elípticas

**Qué debes entender:**
La clave de elección es un par `(sk, pk)` donde `pk = sk · G`.

Para cifrar un bit `b` (0 o 1):
1. Elige `r` aleatorio
2. `C1 = r · G`
3. `C2 = r · pk + b · G`

Para descifrar:
1. `count·G = C2 - sk·C1 = r·pk + b·G - sk·r·G = b·G`
2. Busca `k` tal que `k·G = count·G` (fuerza bruta, válida para conteos pequeños)

**Por qué vector binario:**
Tu sistema cifra **un vector de bits**, uno por candidato. Si hay 3 candidatos y el votante elige el candidato 1:
```
voto = [Cifrado(0), Cifrado(1), Cifrado(0)]
```
La suma homomórfica acumula votos por posición. Al final se descifra cada posición y se obtiene el conteo de cada candidato.

**Cómo está en tu código:**
```typescript
// packages/backend/src/lib/elgamal.ts — líneas 25-34
function cifrarBit(bit: 0 | 1, H: Point): ParCifrado {
  const r = random();
  const C1 = G.multiply(r);
  const C2 = bit === 1 ? H.multiply(r).add(G) : H.multiply(r);
  //          ↑ r·pk + G si bit=1      ↑ r·pk si bit=0
  return { c1: C1.toHex(), c2: C2.toHex() };
}
```

**La suma homomórfica:**
```typescript
// packages/backend/src/lib/elgamal.ts — líneas 49-62
// Para cada posición i:
sumC1 = Σ(C1 de cada voto)   // suma de puntos
sumC2 = Σ(C2 de cada voto)   // suma de puntos
// La propiedad: Σ(r·G) = (Σr)·G, Σ(b·G) = (Σb)·G
// → sumC2 - sk·sumC1 = (Σb)·G = conteo·G
```

**Preguntas frecuentes:**
- *¿Por qué fuerza bruta para descifrar?* — Porque el resultado del descifrado es `conteo·G`, y para obtener `conteo` (un número pequeño) hay que buscar `k` tal que `k·G == conteo·G`. Con conteos de hasta 10,000 votantes esto tarda milisegundos. Es la limitación conocida del cifrado ElGamal aditivo en curvas, documentada en la literatura.
- *¿Dónde se guarda el ciphertext completo?* — En `VotoContabilizado.votoCifradoElgamal` (SQLite, off-chain). En blockchain solo va `SHA256(ciphertext)` como bytes32. Esto protege la privacidad: nadie puede descifrar desde la cadena sin la clave privada.

---

## MÓDULO 5 — Shamir Secret Sharing

### 5.1 El concepto: umbral criptográfico

**Qué debes entender:**
Shamir Secret Sharing (SSS) divide un secreto `S` en `n` compartimentos, de forma que:
- Cualquier subconjunto de `t` (umbral) compartimentos puede reconstruir `S`
- Cualquier subconjunto de `t-1` compartimentos no revela **ninguna información** sobre `S`

En tu sistema: `n=5, t=3`. La clave privada ElGamal se divide en 5 partes, distribuidas a 5 custodios. Ningún custodio individual puede descifrar nada. Se necesitan al menos 3.

---

### 5.2 La matemática: interpolación de Lagrange

**Qué debes entender:**
El secreto es el término independiente de un polinomio de grado `t-1`. Para `t=3` es un polinomio cuadrático:

```
f(x) = S + a₁·x + a₂·x²  (mod PRIME)
```

Los compartimentos son evaluaciones: `(1, f(1)), (2, f(2)), ..., (5, f(5))`.

Con 3 puntos de una parábola, puedes reconstruir exactamente la parábola y leer `f(0) = S`. Con 2 puntos hay infinitas parábolas posibles — el secreto está perfectamente oculto.

La reconstrucción usa la **Fórmula de Lagrange**:
```
S = Σᵢ yᵢ · Πⱼ≠ᵢ (0-xⱼ)/(xᵢ-xⱼ)   (mod PRIME)
```

**Cómo está en tu código:**
```typescript
// packages/backend/src/services/escrutinioService.ts — líneas 32-53
function evaluarPolinomio(coefs, x) {
  // Evalúa f(x) = coefs[0] + coefs[1]·x + coefs[2]·x² usando Horner
}

export function dividirSecreto(secreto, n, umbral) {
  const coefs = [secreto % PRIME];  // coefs[0] = el secreto
  for (let i = 1; i < umbral; i++) coefs.push(random());  // coefs aleatorios
  return Array.from({length: n}, (_, i) => ({x: i+1, y: evaluarPolinomio(coefs, i+1)}));
}

export function reconstruirSecreto(shares) {
  // Interpolación de Lagrange sobre GF(PRIME)
  // PRIME = campo secp256k1 (el número primo de la curva)
}
```

**Preguntas frecuentes:**
- *¿Por qué ese PRIME específico?* — Es el primo de campo de secp256k1 (`p = 2²⁵⁶ - 2³² - 977`). Usar el mismo campo que la curva garantiza que los valores de los compartimentos sean escalares válidos y que la reducción `secreto mod ORDER` para obtener la clave ElGamal sea coherente.
- *¿Qué pasa si un custodio pierde su compartimento?* — Con `n=5, t=3` el sistema tolera la pérdida de hasta 2 compartimentos. Si se pierden 3 o más, el secreto es irrecuperable — la elección no puede escrutarse.
- *¿Por qué los custodios tienen VC propias?* — Para autenticar que el compartimento fue aportado por el custodio legítimo y no por un atacante que interceptó el valor.

---

## MÓDULO 6 — Anti-doble-voto on-chain (Nullifier)

### 6.1 El problema que resuelve

**Qué debes entender:**
El sistema necesita garantizar que un votante no vote dos veces, sin vincular la identidad del votante con su voto. Un enfoque simple sería guardar el token en blockchain — pero eso revela la identidad. La solución es el **nullifier**.

---

### 6.2 Cómo funciona el nullifier

```
nullifier = SHA256("nullifier:" + token)
```

- El nullifier es público y se registra on-chain
- Nadie puede recuperar el token desde el nullifier (pre-imagen de SHA-256)
- Si alguien intenta votar dos veces con el mismo token → mismo nullifier → contrato rechaza

**Por qué no se puede forjar:**
SHA-256 es una función de un solo sentido. Dado `nullifier`, encontrar `token` que lo produzca requiere `2²⁵⁶` intentos en promedio.

**Cómo está en el contrato:**
```solidity
// packages/hardhat/contracts/NullifierSet.sol
function marcarUsado(bytes32 nullifier) external {
    require(elegible[nullifier], "NullifierNoElegible");
    require(!usado[nullifier], "NullifierYaUsado");  // ← el anti-doble-voto
    usado[nullifier] = true;
}
```

**Preguntas frecuentes:**
- *¿Puede el backend hacer trampa y registrar el mismo nullifier dos veces?* — No, el contrato rechaza el segundo intento con `NullifierYaUsado` (error custom de Solidity). La lógica está en blockchain, inmutable.
- *¿Por qué `"nullifier:" + token` y no solo `SHA256(token)`?* — El prefijo es un dominio de separación (domain separation). Previene que el mismo valor se use en contextos distintos. Es práctica estándar en protocolos criptográficos.

---

## MÓDULO 7 — Arquitectura del sistema

### 7.1 Por qué cuatro contratos separados

**Qué debes entender:**
El principio de responsabilidad única aplicado a Solidity:

| Contrato | Única responsabilidad |
|---|---|
| `AdminParams.sol` | Guarda candidatos y clave pública ElGamal |
| `NullifierSet.sol` | Mantiene el conjunto de nullifiers (elegibles + usados) |
| `BulletinBoard.sol` | Acepta y almacena boletas con validación de estado |
| `Escrutinio.sol` | Recibe y publica los resultados finales |

Si estuviera todo en un contrato: un bug en el escrutinio podría comprometer el tablón de boletas. La separación limita el radio de impacto de cualquier vulnerabilidad.

---

### 7.2 Por qué la clave privada ElGamal nunca toca blockchain

**Qué debes entender:**
La clave pública (`pk = sk · G`) está en blockchain (en `AdminParams`). La clave privada `sk` existe únicamente dividida en 5 compartimentos Shamir, distribuidos físicamente a 5 custodios. En ningún momento existe completa en ningún sistema.

Flujo:
```
Generación: sk → [sh1, sh2, sh3, sh4, sh5] → 5 custodios físicos
                sk se descarta de memoria

Escrutinio: sh_i + sh_j + sh_k → Lagrange → sk reconstruida en RAM
                               → descifrar → sk descartada de RAM
```

**Preguntas frecuentes:**
- *¿Quién genera la clave?* — El backend la genera en RAM al inicializar Shamir, calcula los compartimentos, publica `pk` en blockchain, y descarta `sk`. Los compartimentos se entregan a los custodios y el backend no los retiene.
- *¿Podría el administrador reconstruir la clave él solo?* — No, porque no tiene acceso a los 3 compartimentos necesarios. Eso es el punto: la custodia es distribuida.

---

### 7.3 Por qué SQLite off-chain para el ciphertext

**Qué debes entender:**
En blockchain solo va `SHA256(ciphertext)` (32 bytes). El ciphertext completo (varios puntos de curva en JSON) va en SQLite. Razones:

1. **Costo**: Guardar arrays de puntos de curva en Ethereum sería extremadamente caro en gas
2. **Privacidad**: El ciphertext en blockchain sería público. Aunque cifrado, expone metadatos (número de candidatos, momento exacto del voto)
3. **Auditabilidad**: El hash on-chain permite a cualquiera verificar que el ciphertext off-chain no fue alterado

---

### 7.4 El flujo completo de un voto (para explicar de corrido)

```
1. ELEGIBILIDAD
   Votante presenta VC firmada
   Backend: verifica firma ECDSA → padrón en BD → emite token t (random)
   Backend: calcula tokenPoint = t·G → guarda (tokenHash, tokenPoint) en BD
   Backend: retorna token al votante (único momento que existe en claro)

2. VOTACIÓN
   Frontend: recibe token, elige candidato i
   Frontend: genera prueba Schnorr(token, "votoseguro:vote:i") = {R, s}
   Frontend: POST /api/voto/emitir { candidatoId: i, token, schnorrProof: {R,s} }

3. BACKEND verifica:
   a. schnorrProof: verifica s·G == R + c·tokenPoint (ZK proof)
   b. elección abierta: consulta BulletinBoard.sol
   c. candidatoId en rango válido
   d. cifra voto: [Cifrado(0), Cifrado(1), Cifrado(0)] con clave pública ElGamal
   e. nullifier = SHA256("nullifier:" + token)
   f. registra boleta on-chain: BulletinBoard.registrarBoleta(hash_cipher, {}, nullifier)
   g. NullifierSet.marcarUsado(nullifier) ← anti-doble-voto irreversible
   h. guarda VotoContabilizado con ciphertext completo en SQLite
   i. retorna txHash al votante

4. ESCRUTINIO
   3 custodios aportan compartimentos Shamir (autenticados con VC custodio)
   Backend: reconstruye sk = Lagrange(sh_i, sh_j, sh_k)
   Backend: verifica SHA256(sk_bytes) == config.hashSecreto
   Backend: sumarCifrados() → suma homomórfica de todos los votos
   Backend: descifrarSuma() → [2, 1, 0] = conteos por candidato
   Backend: Escrutinio.publicarResultados([2,1,0], hashEvidencias) on-chain
   sk se descarta de memoria
```

---

## MÓDULO 8 — Privacidad y lo que el sistema garantiza (y lo que no)

### 8.1 Propiedades de privacidad formales

| Propiedad | ¿La cumple el sistema? | Mecanismo |
|---|---|---|
| **Anonimato del voto** | ✅ | Token ↔ voto nunca vinculados en BD |
| **Privacidad del voto** | ✅ | Cifrado ElGamal, clave privada distribuida |
| **No coercibilidad** | ⚠️ Parcial | Sin receipt de voto verificable por terceros |
| **Verificabilidad individual** | ✅ | Votante puede verificar su boleta con txHash |
| **Verificabilidad universal** | ✅ | Resultados y boletas públicos en blockchain |
| **Elegibilidad única** | ✅ | Un token por padrón, un voto por token |

### 8.2 Lo que el sistema NO oculta (honestidad académica)

- **Metadatos temporales**: El timestamp de la boleta es público on-chain. Si un votante es el único que vota en cierto minuto, podría correlacionarse con su horario de conexión.
- **Número de votos por candidato**: El resultado final es público, como debe ser en una elección.
- **El administrador sabe cuántos votaron**: Puede ver `totalBoletas()` en tiempo real.

Estos son trade-offs conocidos y documentados en la literatura de votación electrónica (Helios, Belenios). Tu sistema los acepta explícitamente.

---

## MÓDULO 9 — Testing (cómo explicar la suite de pruebas)

### 9.1 Por qué cada tipo de test

| Tipo | Por qué existe |
|---|---|
| **Unitarios** | Verifica la lógica criptográfica aislada (Schnorr, ElGamal, Shamir). Si falla, sabes exactamente qué función está rota. |
| **Integración** | Verifica que los endpoints HTTP funcionan de punta a punta con BD real y blockchain real. Detecta problemas de "las partes funcionan solas pero no juntas". |
| **Contratos** | Verifica las garantías on-chain (anti-doble-voto, estados de elección). No se puede mockear la blockchain para estas pruebas. |
| **Frontend** | Verifica que los componentes renderizan correctamente y el flujo de UI funciona. |
| **E2E** | Simula un usuario real con Playwright. La única forma de saber que el flujo completo funciona en un navegador real. |

### 9.2 Cómo responder "¿qué cubren sus tests?"

Respuesta estructurada:

> "El sistema tiene 5 niveles de testing. Las pruebas unitarias verifican cada función criptográfica de forma aislada — la generación y verificación Schnorr, el cifrado y descifrado ElGamal, la división y reconstrucción Shamir, y la emisión y verificación de VC. Las pruebas de integración ejecutan los 22 endpoints de la API con base de datos SQLite real. Las pruebas de contratos verifican los invariantes on-chain, en particular que el NullifierSet rechaza un segundo voto con el mismo nullifier. Las pruebas E2E con Playwright validan el flujo completo del votante desde la verificación hasta el comprobante. En total son más de 200 casos automatizados con cobertura sobre el 90% en los servicios críticos."

---

## MÓDULO 10 — Preguntas duras del tribunal

### "¿Por qué no usaron Noir/ZK-SNARKs?"

> "El sistema implementa una NIZKPoK mediante el protocolo de Schnorr con la transformación de Fiat-Shamir [Schnorr 1991, Fiat & Shamir 1986]. Esta es una prueba de conocimiento cero formalmente demostrada, específica para la relación de logaritmo discreto que necesitamos probar. Los ZK-SNARKs como los de Noir son adecuados para computaciones arbitrarias expresadas como circuitos, pero para el enunciado concreto de 'conozco el token cuyo punto es tokenPoint', la construcción de Schnorr es igualmente rigurosa, más eficiente, y con fundamento teórico sólido. El paquete de circuitos Noir está estructurado en el monorepo para una extensión futura que incorpore pruebas de membresía Merkle."

### "¿Cómo garantizan que la clave privada ElGamal no fue vista por el administrador?"

> "La clave privada se genera en RAM, se divide inmediatamente en 5 compartimentos Shamir, y se descarta. Los compartimentos se entregan a 5 custodios físicamente distintos. El backend nunca persiste la clave privada en disco ni en base de datos. Durante el escrutinio, la clave se reconstruye en RAM únicamente cuando los 3 custodios aportan sus compartimentos, se usa para descifrar los totales, y se descarta. La corrección de la reconstrucción se verifica comparando SHA256(sk_bytes) contra un hash almacenado en la configuración al momento de la generación."

### "¿Por qué SQLite y no una base de datos más robusta?"

> "SQLite es apropiado para el prototipo de tesis porque garantiza reproducibilidad — cualquier evaluador puede clonar el repo y ejecutar el sistema sin infraestructura adicional. La arquitectura separa claramente la lógica de negocio de la capa de persistencia vía Prisma ORM, lo que permite migrar a PostgreSQL para un deployment en producción cambiando únicamente la variable de entorno `DATABASE_URL`. El dato más sensible — el ciphertext ElGamal — ya está fuera de la cadena por diseño y protegido por la clave Shamir, independientemente del motor de base de datos."

### "¿Qué impide que el administrador vote múltiples veces él mismo?"

> "Dos mecanismos independientes. Primero, el token es de un solo uso: al registrarse el voto, el campo `usado` de `SesionVotante` se marca true en SQLite. Segundo, el nullifier derivado del token se registra en el contrato `NullifierSet.sol`. Si se intenta un segundo voto con el mismo token, `NullifierSet.marcarUsado()` revierte con el error custom `NullifierYaUsado`. El segundo mecanismo es on-chain e inmutable — ni el administrador puede modificarlo sin comprometer la cadena entera."

### "¿Cómo se verifica un resultado? ¿Es auditable por un tercero?"

> "Sí. Cualquier tercero con acceso al nodo Ethereum puede leer los resultados desde `Escrutinio.obtenerResultados()`, que incluye los totales por candidato, el total de votos, el timestamp, y el hash del paquete de evidencias. El archivo `evidencias.json` generado post-escrutinio contiene los votos cifrados individuales y la suma homomórfica. Dado el archivo de evidencias y la clave pública de la elección, cualquier auditor puede verificar que la suma cifrada es consistente con los votos registrados on-chain, sin necesidad de la clave privada."

### "¿Qué pasa si el backend cae durante la votación?"

> "El estado crítico está en dos lugares: la boleta on-chain en `BulletinBoard.sol` (inmutable) y el `nullifier` en `NullifierSet.sol` (inmutable). Si el backend cae después de registrar la boleta pero antes de guardar en SQLite, la boleta existe en blockchain. Si cae antes de registrar la boleta, el token no fue marcado como usado y el votante puede reintentar. El único caso problemático es si el backend cae entre `BulletinBoard.registrarBoleta()` y `marcarTokenUsado()` — el voto existe on-chain pero el token aparece disponible. Esta condición de carrera es mitigable con transacciones atómicas en el servicio, y está documentada como limitación del prototipo."

---

## MÓDULO 11 — Qué ejecutar en la demo en vivo

### Secuencia recomendada para la demo

```
1. Mostrar la landing en localhost:3000
2. Abrir admin (/admin), hacer login
3. Agregar 3 candidatos desde la pestaña Candidatos
4. Agregar un votante al padrón y descargar la VC generada
5. Inicializar Shamir con 5 custodios y descargar los bundles
6. Abrir la jornada
7. En otra pestaña: ir a /verificar, pegar la VC, obtener token
8. Ir a /votar, seleccionar candidato, emitir voto
9. Mostrar el txHash del comprobante
10. Ir a /comprobar, pegar el txHash → mostrar boleta verificada on-chain
11. Ir a /admin, pestaña Escrutinio:
    - Aportar 3 compartimentos (de los 5 descargados)
    - Ejecutar escrutinio
12. Ir a /resultados → mostrar resultados publicados on-chain
```

### Qué preparar antes de la demo

- Terminal con `yarn chain` corriendo
- Terminal con `yarn deploy` ejecutado
- Terminal con `yarn backend:dev` corriendo
- Terminal con `yarn start` corriendo
- Credenciales de admin guardadas (email: `admin@votacion.local`, contraseña: `password123`)
- Los 5 archivos de bundles Shamir descargados y accesibles

---

## Referencias bibliográficas clave

1. **Schnorr, C.P.** (1991). *Efficient Signature Generation by Smart Cards*. Journal of Cryptology, 4(3), 161–174.
2. **Fiat, A. & Shamir, A.** (1986). *How to Prove Yourself: Practical Solutions to Identification and Signature Problems*. CRYPTO '86, LNCS 263, 186–194.
3. **Bellare, M. & Rogaway, P.** (1993). *Random Oracles are Practical: A Paradigm for Designing Efficient Protocols*. CCS '93.
4. **Shamir, A.** (1979). *How to Share a Secret*. Communications of the ACM, 22(11), 612–613.
5. **ElGamal, T.** (1985). *A Public Key Cryptosystem and a Signature Scheme Based on Discrete Logarithms*. IEEE Transactions on Information Theory, 31(4), 469–472.
6. **W3C Verifiable Credentials Data Model 1.1** (2022). https://www.w3.org/TR/vc-data-model/
7. **Standards for Efficient Cryptography — SEC 2: Recommended Elliptic Curve Domain Parameters** (2010). SECG.

---

*Última actualización: mayo 2026 — checkpoint Sprint 6*
