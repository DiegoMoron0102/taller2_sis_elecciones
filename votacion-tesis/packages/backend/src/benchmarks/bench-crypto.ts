/**
 * bench-crypto.ts
 * Benchmarks de funciones criptográficas del backend.
 * Ejecutar con: tsx src/benchmarks/bench-crypto.ts
 * Salida: JSON en stdout, logs de progreso en stderr.
 */
import "dotenv/config";
import crypto from "crypto";
import {
  verificarSchnorr,
  generarPruebaSchnorr,
  calcularTokenPoint,
  MENSAJE_SCHNORR_PREFIX,
} from "../lib/schnorr.js";
import { cifrarVotoElgamal, sumarCifrados, descifrarSuma } from "../lib/elgamal.js";
import { emitirVC, verificarVC } from "../lib/vcAuthority.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenAleatorio(): string {
  return crypto.randomBytes(32).toString("hex");
}

interface ResultadoBench {
  nombre: string;
  iteraciones: number;
  promedioMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
}

function estadisticas(nombre: string, muestras: number[]): ResultadoBench {
  const sorted = [...muestras].sort((a, b) => a - b);
  const suma = muestras.reduce((a, b) => a + b, 0);
  return {
    nombre,
    iteraciones: muestras.length,
    promedioMs: Math.round((suma / muestras.length) * 100) / 100,
    minMs: Math.round(sorted[0] * 100) / 100,
    maxMs: Math.round(sorted[sorted.length - 1] * 100) / 100,
    p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
  };
}

async function bench(nombre: string, fn: () => void | Promise<void>, n: number): Promise<ResultadoBench> {
  process.stderr.write(`  ▶ ${nombre} (${n} iteraciones)... `);
  const muestras: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    await fn();
    muestras.push(performance.now() - t0);
  }
  const r = estadisticas(nombre, muestras);
  process.stderr.write(`✓ avg=${r.promedioMs}ms\n`);
  return r;
}

// ── Benchmarks ────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("\n=== Benchmarks Criptográficos — VotoSeguro ===\n\n");
  const resultados: ResultadoBench[] = [];
  const N_CRYPTO = 100;

  // 1. Generación de prueba Schnorr
  const token = tokenAleatorio();
  const mensaje = `${MENSAJE_SCHNORR_PREFIX}:0`;
  resultados.push(await bench(
    "Schnorr — generarPruebaSchnorr()",
    () => generarPruebaSchnorr(token, mensaje),
    N_CRYPTO,
  ));

  // 2. Verificación de prueba Schnorr
  const tokenPoint = calcularTokenPoint(token);
  const prueba = generarPruebaSchnorr(token, mensaje);
  resultados.push(await bench(
    "Schnorr — verificarSchnorr()",
    () => verificarSchnorr(tokenPoint, prueba, mensaje),
    N_CRYPTO,
  ));

  // 3. Cifrado ElGamal de una boleta (3 candidatos)
  const clavePrivada = BigInt("0x" + crypto.randomBytes(32).toString("hex")) % (2n ** 256n - 1n) || 1n;
  const { secp256k1 } = await import("@noble/curves/secp256k1");
  const G = secp256k1.ProjectivePoint.BASE;
  const clavePublica = G.multiply(clavePrivada).toHex(true);
  resultados.push(await bench(
    "ElGamal — cifrarVotoElgamal() (3 candidatos)",
    () => cifrarVotoElgamal(0, 3, clavePublica),
    N_CRYPTO,
  ));

  // 4. Suma homomórfica de 10 cifrados
  const cifrados = Array.from({ length: 10 }, (_, i) => cifrarVotoElgamal(i % 3, 3, clavePublica));
  resultados.push(await bench(
    "ElGamal — sumarCifrados() (10 votos, 3 candidatos)",
    () => sumarCifrados(cifrados),
    N_CRYPTO,
  ));

  // 5. Descifrado de suma (DLOG baby-step-giant-step)
  const suma = sumarCifrados(cifrados);
  resultados.push(await bench(
    "ElGamal — descifrarSuma() (max 10 votos)",
    () => { for (const par of suma) descifrarSuma(par, clavePrivada); },
    Math.min(N_CRYPTO, 20), // DLOG es más lento
  ));

  // 6. Emisión de VC ECDSA
  if (!process.env.VC_AUTHORITY_PRIVATE_KEY) {
    process.stderr.write("  ⚠ VC_AUTHORITY_PRIVATE_KEY no configurada — saltando benchmarks VC\n");
  } else {
    resultados.push(await bench(
      "VC — emitirVC() (ECDSA secp256k1)",
      () => emitirVC("LP001001", "Votante Bench", new Date().toISOString()),
      N_CRYPTO,
    ));

    // 7. Verificación de VC ECDSA
    const vcEjemplo = emitirVC("LP001001", "Votante Bench", new Date().toISOString());
    resultados.push(await bench(
      "VC — verificarVC() (ECDSA secp256k1)",
      () => verificarVC(vcEjemplo),
      N_CRYPTO,
    ));
  }

  process.stderr.write("\n");
  process.stdout.write(JSON.stringify(resultados, null, 2));
}

main().catch(e => { process.stderr.write(`ERROR: ${e}\n`); process.exit(1); });
