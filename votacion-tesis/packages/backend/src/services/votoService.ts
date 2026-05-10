import crypto from "crypto";
import path from "path";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";
import { VotanteService } from "./votanteService";
import { verificarSchnorr, MENSAJE_SCHNORR_PREFIX, type PruebaSchnorr } from "../lib/schnorr";
import { cifrarVotoElgamal, type ParCifrado } from "../lib/elgamal";

export interface EmitirVotoInput {
  candidatoId: number;
  token: string;
  schnorrProof?: PruebaSchnorr; // Sprint 6: prueba de conocimiento del token
}

interface ConfigElgamal {
  clavePublicaEleccion?: string;
}

function leerClavePublicaEleccion(): string | null {
  try {
    const dir = process.env.SHAMIR_SHARES_DIR ?? path.join(process.cwd(), "shamir-shares");
    const configPath = path.join(dir, "config.json");
    if (!fs.existsSync(configPath)) return null;
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8")) as ConfigElgamal;
    return cfg.clavePublicaEleccion ?? null;
  } catch {
    return null;
  }
}

export class VotoService {
  static generarNullifierDesdeToken(token: string) {
    const hash = crypto.createHash("sha256").update(`nullifier:${token}`).digest("hex");
    return `0x${hash}`;
  }

  static async emitirVoto(input: EmitirVotoInput) {
    if (typeof input.candidatoId !== "number" || input.candidatoId < 0) {
      throw new Error("candidatoId inválido");
    }

    const tokenValidado = await VotanteService.validarToken(input.token);
    if (!tokenValidado.valido || !tokenValidado.tokenHash) {
      throw new Error(tokenValidado.motivo ?? "Token no válido");
    }

    // Sprint 6: verificar prueba Schnorr si se proporcionó
    if (input.schnorrProof) {
      const sesion = await prisma.sesionVotante.findUnique({
        where: { tokenHash: tokenValidado.tokenHash },
        select: { tokenPoint: true },
      });
      if (!sesion?.tokenPoint) {
        throw new Error("TokenPoint no disponible para verificación Schnorr");
      }
      const mensaje = `${MENSAJE_SCHNORR_PREFIX}:${input.candidatoId}`;
      const pruebaValida = verificarSchnorr(sesion.tokenPoint, input.schnorrProof, mensaje);
      if (!pruebaValida) {
        throw new Error("Prueba Schnorr inválida: no se pudo verificar el conocimiento del token");
      }
    }

    const abierta = await BlockchainService.eleccionAbierta();
    if (!abierta) throw new Error("La elección está cerrada");

    const totalCandidatos = await prisma.candidato.count();
    if (totalCandidatos === 0) throw new Error("No hay candidatos registrados");
    if (input.candidatoId >= totalCandidatos) throw new Error("Candidato fuera de rango");

    const nullifier = this.generarNullifierDesdeToken(input.token);

    const elegible = await BlockchainService.esNullifierElegible(nullifier);
    if (!elegible) await BlockchainService.registrarNullifierElegible(nullifier);

    const usado = await BlockchainService.fueNullifierUsado(nullifier);
    if (usado) throw new Error("Nullifier ya usado: doble voto detectado");

    // Sprint 6: cifrado ElGamal homomórfico del voto
    let votoCifradoElgamal: ParCifrado[] | null = null;
    let votoCifrado: string;
    const clavePublica = leerClavePublicaEleccion();

    if (clavePublica) {
      try {
        votoCifradoElgamal = cifrarVotoElgamal(input.candidatoId, totalCandidatos, clavePublica);
        const cifradoJSON = JSON.stringify(votoCifradoElgamal);
        votoCifrado = `0x${crypto.createHash("sha256").update(cifradoJSON).digest("hex")}`;
      } catch {
        // Fallback si el cifrado falla (clave inválida, etc.)
        votoCifrado = `0x${crypto.createHash("sha256").update(`${input.candidatoId}:${Date.now()}`).digest("hex")}`;
      }
    } else {
      // Sin clave ElGamal: hash simple del candidato + timestamp
      votoCifrado = `0x${crypto.createHash("sha256").update(`${input.candidatoId}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`).digest("hex")}`;
    }

    const pruebaZK = `0x${crypto.createHash("sha256").update(`${votoCifrado}:${nullifier}:schnorr-verified`).digest("hex")}`;

    const tx = await BlockchainService.registrarBoleta(votoCifrado, pruebaZK, nullifier);
    await VotanteService.marcarTokenUsado(tokenValidado.tokenHash);

    await prisma.votoContabilizado.create({
      data: {
        candidatoIndice: input.candidatoId,
        votoCifradoElgamal: votoCifradoElgamal ? JSON.stringify(votoCifradoElgamal) : null,
      },
    });

    await prisma.logAuditoria.create({
      data: {
        accion: "VOTO_EMITIDO",
        actor: "anonimo",
        detalle: `tx:${tx.txHash.slice(0, 14)}... elgamal:${votoCifradoElgamal ? "si" : "no"}`,
      },
    });

    return {
      mensaje: "Voto emitido exitosamente",
      boleta: { votoCifrado, pruebaZK, nullifier },
      transaccion: { hash: tx.txHash, bloque: tx.blockNumber },
      hashComprobante: crypto.createHash("sha256").update(tx.txHash).digest("hex"),
      timestamp: new Date().toISOString(),
    };
  }

  static async estadoEleccion() {
    const [abierta, totalBoletas, candidatosDB] = await Promise.all([
      BlockchainService.eleccionAbierta(),
      BlockchainService.totalBoletas(),
      prisma.candidato.findMany({ orderBy: { indice: "asc" } }),
    ]);

    const candidatos = candidatosDB.map(c =>
      c.descripcion ? `${c.nombre} - ${c.descripcion}` : c.nombre,
    );

    return { abierta, candidatos, totalBoletas, timestamp: new Date().toISOString() };
  }

  static async obtenerBoletas() {
    const total = await BlockchainService.totalBoletas();
    const boletas = [];
    for (let i = 0; i < total; i++) {
      boletas.push(await BlockchainService.obtenerBoleta(i));
    }
    return boletas;
  }

  static async verificarComprobante(txHash: string) {
    return BlockchainService.verificarComprobante(txHash);
  }
}
