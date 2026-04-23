import { Request, Response } from "express";
import { VotoService } from "../services/votoService";

export class VotoController {
  static async emitir(req: Request, res: Response) {
    try {
      const { candidatoId, token } = req.body;
      const result = await VotoService.emitirVoto({ candidatoId, token });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        error: "No se pudo emitir voto",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async estadoEleccion(_req: Request, res: Response) {
    try {
      const estado = await VotoService.estadoEleccion();
      return res.status(200).json(estado);
    } catch (error) {
      return res.status(500).json({
        error: "No se pudo obtener estado de elección",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async boletas(_req: Request, res: Response) {
    try {
      const boletas = await VotoService.obtenerBoletas();
      return res.status(200).json({ boletas, total: boletas.length });
    } catch (error) {
      return res.status(500).json({
        error: "No se pudieron obtener boletas",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
