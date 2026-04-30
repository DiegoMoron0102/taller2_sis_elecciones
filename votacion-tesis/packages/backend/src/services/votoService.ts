import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";
import { VotanteService } from "./votanteService";

export interface EmitirVotoInput {
  candidatoId: number;
  token: string;
}

export class VotoService {
  static generarNullifierDesdeToken(token: string) {
    const hash = crypto.createHash("sha256").update(`nullifier:${token}`).digest("hex");
    return `0x${hash}`;
  }

  static cifrarVoto(candidatoId: number) {
    const payload = `${candidatoId}:${Date.now()}:${crypto.randomBytes(8).toString("hex")}`;
    return `0x${crypto.createHash("sha256").update(payload).digest("hex")}`;
  }

  static generarPruebaZK(votoCifrado: string, nullifier: string) {
    const payload = `${votoCifrado}:${nullifier}:proof`;
    return `0x${crypto.createHash("sha256").update(payload).digest("hex")}`;
  }

  static async emitirVoto(input: EmitirVotoInput) {
    if (typeof input.candidatoId !== "number" || input.candidatoId < 0) {
      throw new Error("candidatoId inválido");
    }

    const tokenValidado = await VotanteService.validarToken(input.token);
    if (!tokenValidado.valido || !tokenValidado.tokenHash) {
      throw new Error(tokenValidado.motivo ?? "Token no válido");
    }

    const abierta = await BlockchainService.eleccionAbierta();
    if (!abierta) {
      throw new Error("La elección está cerrada");
    }

    const candidatos = await BlockchainService.obtenerCandidatos();
    if (input.candidatoId >= candidatos.length) {
      throw new Error("Candidato fuera de rango");
    }

    const nullifier = this.generarNullifierDesdeToken(input.token);

    const elegible = await BlockchainService.esNullifierElegible(nullifier);
    if (!elegible) {
      await BlockchainService.registrarNullifierElegible(nullifier);
    }

    const usado = await BlockchainService.fueNullifierUsado(nullifier);
    if (usado) {
      throw new Error("Nullifier ya usado: doble voto detectado");
    }

    const votoCifrado = this.cifrarVoto(input.candidatoId);
    const pruebaZK = this.generarPruebaZK(votoCifrado, nullifier);

    const tx = await BlockchainService.registrarBoleta(votoCifrado, pruebaZK, nullifier);
    await VotanteService.marcarTokenUsado(tokenValidado.tokenHash);

    await prisma.logAuditoria.create({
      data: {
        accion: "VOTO_EMITIDO",
        actor: "anonimo",
        detalle: `tx:${tx.txHash.slice(0, 14)}...`,
      },
    });

    return {
      mensaje: "Voto emitido exitosamente",
      boleta: { votoCifrado, pruebaZK, nullifier },
      transaccion: {
        hash: tx.txHash,
        bloque: tx.blockNumber,
      },
      hashComprobante: crypto.createHash("sha256").update(tx.txHash).digest("hex"),
      timestamp: new Date().toISOString(),
    };
  }

  static async estadoEleccion() {
    const [abierta, candidatos, totalBoletas] = await Promise.all([
      BlockchainService.eleccionAbierta(),
      BlockchainService.obtenerCandidatos(),
      BlockchainService.totalBoletas(),
    ]);

    return {
      abierta,
      candidatos,
      totalBoletas,
      timestamp: new Date().toISOString(),
    };
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
