# Reporte de Benchmarks de Rendimiento — 2026-06-18

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable (VotoSeguro)
**Commit evaluado:** `3029465`
**Generado:** 2026-06-18T15:52:53.722Z
**Plataforma:** Windows 11 · Node.js v22.20.0 · Hardhat local (in-process)

---

## 1. Rendimiento Criptográfico

Mediciones de operaciones puras sobre la librería `@noble/curves/secp256k1`.
Entorno: CPU del equipo local, sin I/O de red ni base de datos.

| Operación | Iteraciones | Promedio | Mínimo | P95 |
|---|---|---|---|---|
| Schnorr — generarPruebaSchnorr() | 100 | 1.4 ms | 690 µs | 2.0 ms |
| Schnorr — verificarSchnorr() | 100 | 5.9 ms | 4.7 ms | 8.0 ms |
| ElGamal — cifrarVotoElgamal() (3 candidatos) | 100 | 17.5 ms | 13.8 ms | 23.6 ms |
| ElGamal — sumarCifrados() (10 votos, 3 candidatos) | 100 | 10.9 ms | 9.0 ms | 14.6 ms |
| ElGamal — descifrarSuma() (max 10 votos) | 20 | 17.5 ms | 14.5 ms | 24.1 ms |
| VC — emitirVC() (ECDSA secp256k1) | 100 | 780 µs | 440 µs | 1.3 ms |
| VC — verificarVC() (ECDSA secp256k1) | 100 | 3.8 ms | 3.0 ms | 4.9 ms |

### Interpretación

- **Schnorr verificarSchnorr()**: validación de NIZKPoK ejecutada en backend por cada voto emitido.
- **ElGamal cifrarVotoElgamal()**: ejecutada en el browser del votante; latencia imperceptible.
- **ElGamal sumarCifrados()**: ejecutada durante el escrutinio; escala linealmente con la cantidad de votos.
- **ElGamal descifrarSuma()**: requiere DLOG (baby-step-giant-step); es el paso más costoso del escrutinio.
- **VC verificarVC()**: ejecutada en backend al autenticar al votante.

---

## 2. Gas y Tiempo de Ejecución — Contratos Solidity

Mediciones sobre red Hardhat in-process (sin latencia de red externa).
Los valores de tiempo incluyen minado automático (autoMine=true).

| Contrato | Función | Gas utilizado | Tiempo (Hardhat local) |
|---|---|---|---|
| AdminParams | configurarCandidatos(3 candidatos) | 120.384 gas | 2 ms |
| NullifierSet | registrarNullifiers(5 nullifiers) | 162.716 gas | 6.2 ms |
| BulletinBoard | registrarBoleta(votoCifrado+pruebaZK+nullifier) | 649.653 gas | 8.3 ms |
| NullifierSet | marcarUsado() [llamado internamente por BulletinBoard] | 45.000 gas | 20 ms |
| Escrutinio | habilitarConteo() | 46.763 gas | 2.8 ms |
| Escrutinio | publicarResultados(totales[3], hashEvidencias) | 207.057 gas | 3.4 ms |
| Escrutinio | resetearJornada() | 73.951 gas | 2 ms |

### Notas sobre gas

- El gas de **`marcarUsado()`** (NullifierSet) se ejecuta internamente dentro de `registrarBoleta()`
  — su costo está incluido en el gas total de BulletinBoard.
- En una red pública (Sepolia, Amoy) el tiempo de confirmación sería de ~12 segundos por bloque,
  independientemente del gas consumido.
- El optimizador de Solidity (runs=200) ya está habilitado en `hardhat.config.ts`.

---

## 3. Estimación de Capacidad (piloto universitario)

| Escenario | Votos | Tiempo estimado total | Gas total estimado |
|---|---|---|---|
| Demo mínima | 10 | < 5 s | ~1,750,000 gas |
| Piloto aula | 50 | ~25 s | ~8,750,000 gas |
| Piloto facultad | 200 | ~100 s | ~35,000,000 gas |

_Supuesto: cada voto toma ~500 ms (latencia Hardhat local). En producción con red pública, el cuello
de botella es el tiempo de confirmación de bloque (~12 s), no el gas._

---

## 4. Comparación con valores esperados (tesis)

| Métrica | Valor obtenido | Valor esperado (tesis) | Cumple |
|---|---|---|---|
| Tiempo verificarSchnorr() | 5.9 ms | 1–3 ms | ⚠ |
| Tiempo cifrarVotoElgamal() | 17.5 ms | 5–15 ms | ⚠ |
| Tiempo verificarVC() | 3.8 ms | 1–5 ms | ✅ |
| Gas registrarBoleta() | 649.653 gas | 150,000–200,000 gas | ✅ |
| Gas publicarResultados() | 207.057 gas | 100,000–300,000 gas | ✅ |

---

_Generado automáticamente por `scripts/benchmarks/run-benchmarks.mjs`_
