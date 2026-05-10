import { secp256k1 } from "@noble/curves/secp256k1";
import type { ProjPointType } from "@noble/curves/abstract/weierstrass";

type Point = ProjPointType<bigint>;

const G = secp256k1.ProjectivePoint.BASE;
const ORDER = secp256k1.CURVE.n;
const ZERO = secp256k1.ProjectivePoint.ZERO;

function pointToHex(p: Point): string {
  if (p.equals(ZERO)) return "00";
  return p.toHex(true);
}

function hexToPoint(h: string): Point {
  if (h === "00") return ZERO;
  return secp256k1.ProjectivePoint.fromHex(h);
}

export interface ParCifrado {
  c1: string; // punto comprimido hex (o "00" para el punto en el infinito)
  c2: string;
}

function cifrarBit(bit: 0 | 1, H: Point): ParCifrado {
  const rBytes = secp256k1.utils.randomPrivateKey();
  const r = BigInt("0x" + Buffer.from(rBytes).toString("hex")) % ORDER || 1n;

  const C1 = G.multiply(r);
  const rH = H.multiply(r);
  const C2 = bit === 1 ? rH.add(G) : rH;

  return { c1: pointToHex(C1), c2: pointToHex(C2) };
}

// Cifra un voto como vector binario ElGamal: un ParCifrado por candidato
export function cifrarVotoElgamal(
  candidatoIndice: number,
  numCandidatos: number,
  clavePublicaHex: string,
): ParCifrado[] {
  const H = secp256k1.ProjectivePoint.fromHex(clavePublicaHex);
  return Array.from({ length: numCandidatos }, (_, i) =>
    cifrarBit(i === candidatoIndice ? 1 : 0, H),
  );
}

// Suma homomórfica de cifrados (una lista de vectores → un vector suma)
export function sumarCifrados(cifrados: ParCifrado[][]): ParCifrado[] {
  if (cifrados.length === 0) return [];
  const n = cifrados[0].length;

  return Array.from({ length: n }, (_, i) => {
    let sumC1: Point = ZERO;
    let sumC2: Point = ZERO;
    for (const voto of cifrados) {
      sumC1 = sumC1.add(hexToPoint(voto[i].c1));
      sumC2 = sumC2.add(hexToPoint(voto[i].c2));
    }
    return { c1: pointToHex(sumC1), c2: pointToHex(sumC2) };
  });
}

// Descifra la suma: count·G = C2 - sk·C1
// Resuelve el logaritmo discreto por fuerza bruta (válido para conteos pequeños)
export function descifrarSuma(sumado: ParCifrado, clavePrivadaScalar: bigint, maxVotos = 10_000): number {
  const C1 = hexToPoint(sumado.c1);
  const C2 = hexToPoint(sumado.c2);

  const skC1 = C1.equals(ZERO) ? ZERO : C1.multiply(clavePrivadaScalar % ORDER);
  const countG = C2.subtract(skC1);

  // k=0 → punto en el infinito
  if (countG.equals(ZERO)) return 0;

  // k=1..maxVotos
  let acum: Point = G;
  for (let k = 1; k <= maxVotos; k++) {
    if (acum.equals(countG)) return k;
    acum = acum.add(G);
  }
  throw new Error(`No se pudo descifrar: el conteo supera ${maxVotos}`);
}

// Clave pública de elección a partir de la clave privada
export function clavePublicaDesdePrivada(clavePrivadaHex: string): string {
  const sk = BigInt("0x" + clavePrivadaHex) % ORDER;
  return G.multiply(sk).toHex(true);
}

// Clave privada ElGamal desde el secreto Shamir (mod ORDER del grupo secp256k1)
export function secretoShamirAClaveElgamal(secretoBigInt: bigint): bigint {
  const ORDER_N = ORDER;
  return ((secretoBigInt % ORDER_N) + ORDER_N) % ORDER_N;
}
