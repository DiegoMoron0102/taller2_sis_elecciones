import { Request, Response } from "express";
import { VotanteService } from "../services/votanteService";

export class AuthController {
  static async verificarElegibilidad(req: Request, res: Response) {
    try {
      const { numeroPadron, nombre, ci } = req.body;
      const resultado = await VotanteService.emitirTokenAnonimo({ numeroPadron, nombre, ci });

      return res.status(200).json({
        mensaje: "Credencial verificada exitosamente",
        token: resultado.token,
        expiresIn: resultado.expiresIn,
        sessionId: resultado.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(400).json({
        error: "No se pudo verificar elegibilidad",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async validarToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      const result = await VotanteService.validarToken(token);
      return res.status(200).json({
        valido: result.valido,
        sessionId: result.sessionId,
        mensaje: result.motivo,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error validando token",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
