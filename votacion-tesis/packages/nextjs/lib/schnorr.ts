"use client";
// Generación de prueba Schnorr en el navegador (Fiat-Shamir no interactivo)
// Complemento del backend: packages/backend/src/lib/schnorr.ts

import { secp256k1 } from "@noble/curves/secp256k1";

const G = secp256k1.ProjectivePoint.BASE;
const ORDER = secp256k1.CURVE.n;

export interface PruebaSchnorr {
  R: string;
  s: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const buf = await window.crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(buf));
}

export function tokenAEscalar(token: string): bigint {
  const raw = BigInt("0x" + token) % ORDER;
  return raw === 0n ? 1n : raw;
}

export function calcularTokenPoint(token: string): string {
  return G.multiply(tokenAEscalar(token)).toHex(true);
}

async function computarReto(R: string, tokenPoint: string, mensaje: string): Promise<bigint> {
  const hash = await sha256Hex(R + tokenPoint + mensaje);
  return BigInt("0x" + hash) % ORDER;
}

export async function generarSchnorr(token: string, mensaje: string): Promise<PruebaSchnorr> {
  const tokenScalar = tokenAEscalar(token);
  const tokenPointHex = G.multiply(tokenScalar).toHex(true);

  const rBytes = secp256k1.utils.randomPrivateKey();
  const r = BigInt("0x" + bytesToHex(rBytes)) % ORDER || 1n;
  const RHex = G.multiply(r).toHex(true);

  const c = await computarReto(RHex, tokenPointHex, mensaje);
  const s = ((r + c * tokenScalar) % ORDER + ORDER) % ORDER;

  return { R: RHex, s: s.toString(16).padStart(64, "0") };
}

export const MENSAJE_SCHNORR_PREFIX = "votoseguro:vote";
