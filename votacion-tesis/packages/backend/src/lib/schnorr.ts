import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1";

const G = secp256k1.ProjectivePoint.BASE;
const ORDER = secp256k1.CURVE.n;

export interface PruebaSchnorr {
  R: string; // punto comprimido hex
  s: string; // escalar hex 64 chars
}

// Reto Fiat-Shamir: H(R || tokenPoint || mensaje) mod ORDER
export function computarReto(R: string, tokenPoint: string, mensaje: string): bigint {
  const hash = crypto
    .createHash("sha256")
    .update(R + tokenPoint + mensaje)
    .digest("hex");
  return BigInt("0x" + hash) % ORDER;
}

// Token hex → escalar secp256k1
export function tokenAEscalar(token: string): bigint {
  const raw = BigInt("0x" + token) % ORDER;
  return raw === 0n ? 1n : raw;
}

// tokenPoint = tokenScalar · G (almacenado al emitir el token)
export function calcularTokenPoint(token: string): string {
  const scalar = tokenAEscalar(token);
  return G.multiply(scalar).toHex(true);
}

// Genera una prueba Schnorr (backend, para tests)
export function generarPruebaSchnorr(token: string, mensaje: string): PruebaSchnorr {
  const tokenScalar = tokenAEscalar(token);
  const tokenPointHex = G.multiply(tokenScalar).toHex(true);

  const rBytes = secp256k1.utils.randomPrivateKey();
  const r = BigInt("0x" + Buffer.from(rBytes).toString("hex")) % ORDER || 1n;
  const R = G.multiply(r);
  const RHex = R.toHex(true);

  const c = computarReto(RHex, tokenPointHex, mensaje);
  const s = ((r + c * tokenScalar) % ORDER + ORDER) % ORDER;

  return { R: RHex, s: s.toString(16).padStart(64, "0") };
}

// Verifica una prueba Schnorr: s·G == R + c·tokenPoint
export function verificarSchnorr(tokenPointHex: string, prueba: PruebaSchnorr, mensaje: string): boolean {
  try {
    const R = secp256k1.ProjectivePoint.fromHex(prueba.R);
    const tokenPoint = secp256k1.ProjectivePoint.fromHex(tokenPointHex);
    const s = BigInt("0x" + prueba.s) % ORDER;

    const c = computarReto(prueba.R, tokenPointHex, mensaje);

    const lhs = G.multiply(s);
    const rhs = R.add(tokenPoint.multiply(c));

    return lhs.equals(rhs);
  } catch {
    return false;
  }
}

export const MENSAJE_SCHNORR_PREFIX = "votoseguro:vote";
