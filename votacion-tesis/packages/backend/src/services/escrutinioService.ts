import crypto from "crypto";
import path from "path";
import fs from "fs";
import { secp256k1 } from "@noble/curves/secp256k1";
import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";
import { sumarCifrados, descifrarSuma, secretoShamirAClaveElgamal, type ParCifrado } from "../lib/elgamal";
import { emitirVCCustodio, verificarVCCustodio, type CredencialCustodio } from "../lib/vcAuthority";

// ─── Shamir Secret Sharing sobre GF(p) ───────────────────────────────────────
// Prime: campo secp256k1 (256 bits, bien documentado en el estándar SEC2)
const PRIME = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");

export const SHARES_N = 5;
export const SHARES_UMBRAL = 3;

function modpow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

function modinv(a: bigint, m: bigint): bigint {
  return modpow(((a % m) + m) % m, m - 2n, m);
}

function evaluarPolinomio(coefs: bigint[], x: bigint): bigint {
  let r = 0n;
  for (let i = coefs.length - 1; i >= 0; i--) {
    r = (r * x + coefs[i]) % PRIME;
  }
  return r;
}

export function dividirSecreto(
  secreto: bigint,
  n: number,
  umbral: number,
): Array<{ x: number; y: string }> {
  const coefs: bigint[] = [secreto % PRIME];
  for (let i = 1; i < umbral; i++) {
    coefs.push(BigInt("0x" + crypto.randomBytes(31).toString("hex")) % PRIME);
  }
  return Array.from({ length: n }, (_, i) => {
    const x = i + 1;
    return { x, y: evaluarPolinomio(coefs, BigInt(x)).toString(16).padStart(64, "0") };
  });
}

export function reconstruirSecreto(shares: Array<{ x: number; y: string }>): bigint {
  const pts = shares.map(s => ({ x: BigInt(s.x), y: BigInt("0x" + s.y) }));
  let secreto = 0n;
  for (let i = 0; i < pts.length; i++) {
    let num = 1n;
    let den = 1n;
    for (let j = 0; j < pts.length; j++) {
      if (i !== j) {
        num = (num * ((PRIME - pts[j].x) % PRIME)) % PRIME;
        den = (den * (((pts[i].x - pts[j].x) % PRIME + PRIME) % PRIME)) % PRIME;
      }
    }
    const lagrange = (num * modinv(den, PRIME)) % PRIME;
    secreto = (secreto + (pts[i].y * lagrange) % PRIME) % PRIME;
  }
  return secreto;
}

// ─── Gestión de archivos de compartimentos ────────────────────────────────────

export interface Compartimento {
  indice: number;
  valor: string;
  fechaGeneracion: string;
}

export interface InfoCustodio {
  indice: number;
  nombre: string;
  partido: string;
}

export interface ConfigShaman {
  hashSecreto: string;
  n: number;
  umbral: number;
  fechaGeneracion: string;
  clavePublicaEleccion?: string;
  custodios?: InfoCustodio[]; // Sprint 7: custodios asignados a cada compartimento
}

// Buffer en memoria: compartimentos aportados por custodios durante el escrutinio
// Se limpia al resetear o al ejecutar el escrutinio
const sharesAportadas = new Map<number, { x: number; y: string }>();

export function obtenerSharesAportadas(): number[] {
  return Array.from(sharesAportadas.keys()).sort((a, b) => a - b);
}

export function limpiarSharesAportadas(): void {
  sharesAportadas.clear();
}

function sharesDir(): string {
  return process.env.SHAMIR_SHARES_DIR ?? path.join(process.cwd(), "shamir-shares");
}

function asegurarDirectorio(): string {
  const dir = sharesDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function sharesExisten(): boolean {
  return fs.existsSync(path.join(sharesDir(), "config.json"));
}

export function leerCompartimento(indice: number): Compartimento {
  const filePath = path.join(sharesDir(), `compartimento-${indice}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Compartimento ${indice} no encontrado`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Compartimento;
}

export function leerConfig(): ConfigShaman {
  const filePath = path.join(sharesDir(), "config.json");
  if (!fs.existsSync(filePath)) throw new Error("Escrutinio no inicializado: ejecute primero inicializarShares");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ConfigShaman;
}

// ─── Operaciones principales ──────────────────────────────────────────────────

export async function resetearEscrutinio(adminId: string): Promise<{ txHash: string; numeroJornada: number }> {
  const dir = sharesDir();
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const { txHash, numeroJornada } = await BlockchainService.resetearJornada();

  await prisma.logAuditoria.create({
    data: {
      accion: "ESCRUTINIO_REINICIADO",
      actor: `admin:${adminId}`,
      detalle: `jornada=${numeroJornada}, tx=${txHash.slice(0, 14)}...`,
      administradorId: adminId,
    },
  });

  return { txHash, numeroJornada };
}

export function inicializarShares(): { compartimentos: Compartimento[]; config: ConfigShaman } {
  if (sharesExisten()) throw new Error("Los compartimentos ya fueron inicializados");

  const dir = asegurarDirectorio();
  const secretoBytes = crypto.randomBytes(31);
  const secretoBig = BigInt("0x" + secretoBytes.toString("hex"));

  const shares = dividirSecreto(secretoBig, SHARES_N, SHARES_UMBRAL);
  const hashSecreto = crypto.createHash("sha256").update(secretoBytes).digest("hex");
  const fechaGeneracion = new Date().toISOString();

  const compartimentos: Compartimento[] = shares.map(s => ({
    indice: s.x,
    valor: s.y,
    fechaGeneracion,
  }));

  compartimentos.forEach(c => {
    fs.writeFileSync(
      path.join(dir, `compartimento-${c.indice}.json`),
      JSON.stringify(c, null, 2),
    );
  });

  // Sprint 6: calcular clave pública ElGamal H = (secreto mod ORDER_secp256k1) · G
  const ORDER_N = secp256k1.CURVE.n;
  const skElgamal = ((secretoBig % ORDER_N) + ORDER_N) % ORDER_N;
  const clavePublicaEleccion = skElgamal !== 0n
    ? secp256k1.ProjectivePoint.BASE.multiply(skElgamal).toHex(true)
    : undefined;

  const config: ConfigShaman = {
    hashSecreto,
    n: SHARES_N,
    umbral: SHARES_UMBRAL,
    fechaGeneracion,
    clavePublicaEleccion,
  };
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(config, null, 2));

  return { compartimentos, config };
}

export async function ejecutarEscrutinio(
  indicesShares: number[],
  adminId: string,
): Promise<{
  totalesPorCandidato: number[];
  totalVotos: number;
  txHash: string;
  blockNumber: number;
  hashEvidencias: string;
}> {
  const conteoHabilitado = await BlockchainService.conteoHabilitado();
  if (!conteoHabilitado) throw new Error("El conteo no está habilitado: habilite el escrutinio primero");

  const yaPublicado = await BlockchainService.resultadosPublicados();
  if (yaPublicado) throw new Error("Los resultados ya fueron publicados");

  const config = leerConfig();

  if (indicesShares.length < config.umbral) {
    throw new Error(
      `Se necesitan al menos ${config.umbral} compartimentos (se proporcionaron ${indicesShares.length})`,
    );
  }

  const sharesLeidas = indicesShares.map(i => {
    const c = leerCompartimento(i);
    return { x: c.indice, y: c.valor };
  });

  const secretoReconstruido = reconstruirSecreto(sharesLeidas);
  const hexSecreto = secretoReconstruido.toString(16).padStart(62, "0");
  const secretoBytes = Buffer.from(hexSecreto, "hex");
  const hashVerificacion = crypto.createHash("sha256").update(secretoBytes).digest("hex");

  if (hashVerificacion !== config.hashSecreto) {
    throw new Error(
      "Verificación fallida: los compartimentos no reproducen el secreto original. Compruebe los índices.",
    );
  }

  const candidatos = await prisma.candidato.findMany({ orderBy: { indice: "asc" } });

  // Sprint 6: descifrado homomórfico ElGamal si hay cifrados disponibles
  const skElgamal = secretoShamirAClaveElgamal(secretoReconstruido);
  const votosConCifrado = await prisma.votoContabilizado.findMany({
    where: { votoCifradoElgamal: { not: null } },
    select: { votoCifradoElgamal: true },
  });

  let totalesPorCandidato: number[];
  let metodoEscrutinio: "elgamal" | "candidatoIndice";

  if (votosConCifrado.length > 0 && config.clavePublicaEleccion) {
    try {
      const vectoresCifrados: ParCifrado[][] = votosConCifrado.map(v =>
        JSON.parse(v.votoCifradoElgamal!) as ParCifrado[],
      );
      const sumaHomomorficas = sumarCifrados(vectoresCifrados);
      totalesPorCandidato = sumaHomomorficas.map(par => descifrarSuma(par, skElgamal));
      metodoEscrutinio = "elgamal";
    } catch {
      // Fallback a conteo directo si el descifrado falla
      const conteoRaw = await prisma.votoContabilizado.groupBy({
        by: ["candidatoIndice"],
        _count: { candidatoIndice: true },
        orderBy: { candidatoIndice: "asc" },
      });
      totalesPorCandidato = candidatos.map(c => {
        const fila = conteoRaw.find(r => r.candidatoIndice === c.indice);
        return fila?._count.candidatoIndice ?? 0;
      });
      metodoEscrutinio = "candidatoIndice";
    }
  } else {
    const conteoRaw = await prisma.votoContabilizado.groupBy({
      by: ["candidatoIndice"],
      _count: { candidatoIndice: true },
      orderBy: { candidatoIndice: "asc" },
    });
    totalesPorCandidato = candidatos.map(c => {
      const fila = conteoRaw.find(r => r.candidatoIndice === c.indice);
      return fila?._count.candidatoIndice ?? 0;
    });
    metodoEscrutinio = "candidatoIndice";
  }

  const totalVotos = totalesPorCandidato.reduce((a, b) => a + b, 0);
  const totalOnChain = await BlockchainService.totalBoletas();

  const evidencias = {
    sistema: "VotoSeguro — Sistema de Votación Electrónica Descentralizada Verificable",
    version: "Sprint 6",
    metodoEscrutinio,
    timestamp: new Date().toISOString(),
    candidatos: candidatos.map((c, i) => ({
      indice: c.indice,
      nombre: c.nombre,
      descripcion: c.descripcion,
      votos: totalesPorCandidato[i],
    })),
    totalVotos,
    totalBoletasOnChain: totalOnChain,
    shamir: {
      sharesUsadas: indicesShares,
      hashSecreto: config.hashSecreto,
      n: config.n,
      umbral: config.umbral,
    },
  };

  const evidenciasJSON = JSON.stringify(evidencias, null, 2);
  const hashEvidencias = crypto.createHash("sha256").update(evidenciasJSON).digest("hex");

  const dir = asegurarDirectorio();
  fs.writeFileSync(path.join(dir, "evidencias.json"), evidenciasJSON);

  const hashBytes32 = `0x${hashEvidencias}`;
  const { txHash, blockNumber } = await BlockchainService.publicarResultados(
    totalesPorCandidato,
    hashBytes32,
  );

  await prisma.logAuditoria.create({
    data: {
      accion: "ESCRUTINIO_EJECUTADO",
      actor: `admin:${adminId}`,
      detalle: `totalVotos=${totalVotos}, tx=${txHash.slice(0, 14)}...`,
      administradorId: adminId,
    },
  });

  await prisma.configuracionEleccion.updateMany({
    where: { estado: "ESCRUTADA" },
    data: { estado: "FINALIZADA" },
  });

  return { totalesPorCandidato, totalVotos, txHash, blockNumber, hashEvidencias };
}

export async function obtenerResultadosPublicos() {
  const publicado = await BlockchainService.resultadosPublicados();
  if (!publicado) return null;

  const [resultado, candidatos] = await Promise.all([
    BlockchainService.obtenerResultados(),
    prisma.candidato.findMany({ orderBy: { indice: "asc" } }),
  ]);

  return {
    publicado: true,
    totalVotos: resultado.totalVotos,
    hashPaqueteEvidencias: resultado.hashPaqueteEvidencias,
    timestamp: resultado.timestamp,
    candidatos: candidatos.map((c, i) => ({
      indice: c.indice,
      nombre: c.nombre,
      descripcion: c.descripcion,
      votos: resultado.totalesPorCandidato[i] ?? 0,
    })),
  };
}

export async function obtenerEstadoEscrutinio() {
  const inicializado = sharesExisten();
  const [conteoHabilitado, publicado, totalBoletas, votosContabilizados] = await Promise.all([
    BlockchainService.conteoHabilitado(),
    BlockchainService.resultadosPublicados(),
    BlockchainService.totalBoletas(),
    prisma.votoContabilizado.count(),
  ]);

  const config = inicializado ? leerConfig() : null;

  return {
    inicializado,
    conteoHabilitado,
    resultadosPublicados: publicado,
    totalBoletas,
    votosContabilizados,
    shamir: config
      ? { n: config.n, umbral: config.umbral, fechaGeneracion: config.fechaGeneracion }
      : null,
  };
}
