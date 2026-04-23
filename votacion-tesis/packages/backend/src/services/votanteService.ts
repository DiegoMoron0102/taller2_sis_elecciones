import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { CredencialInput, EmisionTokenResult, ResultadoVerificacionCredencial } from "../types/auth";

export class VotanteService {
  static verificarFormatoCredencial(input: CredencialInput): ResultadoVerificacionCredencial {
    if (!input.numeroPadron || !input.nombre || !input.ci) {
      return { valida: false, motivo: "Todos los campos son obligatorios" };
    }

    const padronRegex = /^[A-Z]{2}\d{6}$/;
    if (!padronRegex.test(input.numeroPadron)) {
      return { valida: false, motivo: "Número de padrón inválido. Formato esperado: LP123456" };
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

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const sesion = await prisma.sesionVotante.create({
      data: { tokenHash, usado: false },
      select: { id: true },
    });

    const credencialSerializada = JSON.stringify({
      numeroPadron: input.numeroPadron,
      nombre: input.nombre,
      ci: input.ci,
    });
    const credencialHash = crypto.createHash("sha256").update(credencialSerializada).digest("hex");

    await prisma.credencialEmitida.upsert({
      where: { numeroPadron: input.numeroPadron },
      create: {
        numeroPadron: input.numeroPadron,
        credencialHash,
      },
      update: {
        credencialHash,
      },
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
