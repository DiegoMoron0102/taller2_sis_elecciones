import { Request, Response } from "express";
import { VotanteService } from "../services/votanteService";
import type { CredencialInput } from "../types/auth";

export class AuthController {
  static async verificarElegibilidad(req: Request, res: Response) {
    try {
      let input: CredencialInput;

      if (req.body.vc) {
        // Sprint 6: modo VC — los campos base se extraen de la VC en el servicio
        input = {
          numeroPadron: req.body.vc.credentialSubject?.numeroPadron ?? "",
          nombre: req.body.vc.credentialSubject?.nombre ?? "",
          ci: req.body.ci ?? "",
          vc: req.body.vc,
        };
      } else {
        // Modo legado: campos individuales
        input = {
          numeroPadron: req.body.numeroPadron ?? "",
          nombre: req.body.nombre ?? "",
          ci: req.body.ci ?? "",
        };
      }

      const resultado = await VotanteService.emitirTokenAnonimo(input);

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
