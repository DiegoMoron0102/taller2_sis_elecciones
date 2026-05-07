import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { CredencialInput, EmisionTokenResult, ResultadoVerificacionCredencial } from "../types/auth";

export class VotanteService {
  static verificarFormatoCredencial(input: CredencialInput): ResultadoVerificacionCredencial {
    if (!input.numeroPadron || !input.nombre || !input.ci) {
      return { valida: false, motivo: "Todos los campos son obligatorios" };
    }

    const padronRegex = /^[A-Z]{2}\d{6,8}$/;
    if (!padronRegex.test(input.numeroPadron)) {
      return { valida: false, motivo: "Número de padrón inválido. Formato esperado: 2 letras + 6 a 8 dígitos (ej: LP123456)" };
    }

    const ciRegex = /^[0-9]{7,8}[A-Z]?$/i;
    if (!ciRegex.test(input.ci)) {
      return { valida: false, motivo: "CI inválido. Formato esperado: 12345678L" };
    }

    if (input.nombre.trim().length < 5) {
      return { valida: false, motivo: "Nombre demasiado corto" };
    }

    return { valida: true };
  }

  static async emitirTokenAnonimo(input: CredencialInput): Promise<EmisionTokenResult> {
    const verificacion = this.verificarFormatoCredencial(input);
    if (!verificacion.valida) {
      throw new Error(verificacion.motivo ?? "Credencial inválida");
    }

    const elegible = await prisma.votanteElegible.findUnique({
      where: { numeroPadron: input.numeroPadron },
    });
    if (!elegible) {
      throw new Error("Número de padrón no encontrado en el registro electoral");
    }

    // credencialHash almacena el tokenHash para poder vincular con SesionVotante
    const credencialExistente = await prisma.credencialEmitida.findUnique({
      where: { numeroPadron: input.numeroPadron },
    });
    if (credencialExistente) {
      const sesionAnterior = await prisma.sesionVotante.findUnique({
        where: { tokenHash: credencialExistente.credencialHash },
      });
      if (sesionAnterior?.usado) {
        throw new Error("Este número de padrón ya emitió su voto");
      }
      // Token emitido pero no usado: revocar sesión anterior y permitir nueva emisión
      if (sesionAnterior) {
        await prisma.sesionVotante.delete({ where: { tokenHash: credencialExistente.credencialHash } });
      }
      await prisma.credencialEmitida.delete({ where: { numeroPadron: input.numeroPadron } });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const sesion = await prisma.sesionVotante.create({
      data: { tokenHash, usado: false },
      select: { id: true },
    });

    // Guardar tokenHash en credencialHash para vincularlo con SesionVotante
    await prisma.credencialEmitida.create({
      data: { numeroPadron: input.numeroPadron, credencialHash: tokenHash },
    });

    await prisma.logAuditoria.create({
      data: {
        accion: "TOKEN_EMITIDO",
        actor: "sistema",
        detalle: `tokenHash:${tokenHash.slice(0, 12)}...`,
      },
    });

    return {
      token,
      tokenHash,
      sessionId: sesion.id,
      expiresIn: 3600,
    };
  }

  static async validarToken(token: string): Promise<{ valido: boolean; sessionId?: string; tokenHash?: string; motivo?: string }> {
    if (!token || token.length < 32) {
      return { valido: false, motivo: "Token inválido" };
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const sesion = await prisma.sesionVotante.findUnique({ where: { tokenHash } });

    if (!sesion) {
      return { valido: false, motivo: "Token no registrado" };
    }

    if (sesion.usado) {
      return { valido: false, sessionId: sesion.id, tokenHash, motivo: "Token ya utilizado" };
    }

    return { valido: true, sessionId: sesion.id, tokenHash };
  }

  static async marcarTokenUsado(tokenHash: string) {
    await prisma.sesionVotante.update({
      where: { tokenHash },
      data: { usado: true, usadoEn: new Date() },
    });
  }
}
