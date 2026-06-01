import { Request, Response } from "express";
import { z } from "zod";
import { VotoService } from "../services/votoService";
import * as EscrutinioService from "../services/escrutinioService";

const emitirVotoSchema = z.object({
  candidatoId: z.number().int().min(0),
  token: z.string().min(32),
  schnorrProof: z.object({
    R: z.string().length(66),  // punto secp256k1 comprimido: 33 bytes = 66 hex chars
    s: z.string().length(64),  // escalar: 32 bytes = 64 hex chars
  }),
});

export class VotoController {
  static async emitir(req: Request, res: Response) {
    const parseado = emitirVotoSchema.safeParse(req.body);
    if (!parseado.success) {
      return res.status(400).json({
        error: "Datos de voto inválidos",
        mensaje: "Se requiere candidatoId, token y schnorrProof (con campos R y s) para emitir el voto",
      });
    }
    try {
      const result = await VotoService.emitirVoto(parseado.data);
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

  static async resultados(_req: Request, res: Response) {
    try {
      const resultado = await EscrutinioService.obtenerResultadosPublicos();
      if (!resultado) {
        return res.status(200).json({ publicado: false, mensaje: "Los resultados aún no han sido publicados" });
      }
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: "No se pudieron obtener los resultados",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  static async comprobante(req: Request, res: Response) {
    try {
      const { txHash } = req.query;
      if (!txHash || typeof txHash !== "string") {
        return res.status(400).json({ error: "txHash requerido" });
      }
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Formato de txHash inválido" });
      }
      const resultado = await VotoService.verificarComprobante(txHash);
      if (!resultado) {
        return res.status(404).json({ error: "Transacción no encontrada o no corresponde a una boleta" });
      }
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({
        error: "No se pudo verificar el comprobante",
        mensaje: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
