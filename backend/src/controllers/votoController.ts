import { Request, Response } from 'express';
import { VotoService, VotoData } from '../services/votoService';

export class VotoController {
  // Emitir voto
  static async emitirVoto(req: Request, res: Response) {
    try {
      const votoData: VotoData = req.body;

      // Validar datos de entrada
      if (!votoData.candidatoId || !votoData.token) {
        return res.status(400).json({
          error: 'Datos de voto incompletos',
          mensaje: 'Se requiere candidatoId y token'
        });
      }

      // Validar formato de candidatoId
      if (typeof votoData.candidatoId !== 'number' || votoData.candidatoId < 0) {
        return res.status(400).json({
          error: 'ID de candidato inválido',
          mensaje: 'El ID de candidato debe ser un número positivo'
        });
      }

      // Validar formato de token
      if (typeof votoData.token !== 'string' || votoData.token.length < 32) {
        return res.status(400).json({
          error: 'Token inválido',
          mensaje: 'El token debe ser una cadena de al menos 32 caracteres'
        });
      }

      // Emitir voto
      const resultado = await VotoService.emitirVoto(votoData);

      res.status(200).json({
        mensaje: 'Voto emitido exitosamente',
        boleta: resultado.boleta,
        transaccion: {
          hash: resultado.txHash,
          bloque: resultado.bloque
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en emitirVoto:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('no está abierta')) {
          return res.status(403).json({
            error: 'Elección cerrada',
            mensaje: 'La elección no está abierta para votar'
          });
        }
        
        if (error.message.includes('elegible') || error.message.includes('emitido')) {
          return res.status(401).json({
            error: 'Voto no permitido',
            mensaje: error.message
          });
        }
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo emitir el voto'
      });
    }
  }

  // Obtener estadísticas de votación
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const estadisticas = await VotoService.obtenerEstadisticas();

      res.status(200).json({
        estadisticas,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudieron obtener las estadísticas'
      });
    }
  }

  // Verificar estado de la elección
  static async verificarEstadoEleccion(req: Request, res: Response) {
    try {
      const eleccionAbierta = await VotoService.verificarEleccionAbierta();

      res.status(200).json({
        eleccionAbierta,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en verificarEstadoEleccion:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo verificar el estado de la elección'
      });
    }
  }

  // Verificar elegibilidad de nullifier
  static async verificarElegibilidadNullifier(req: Request, res: Response) {
    try {
      const { nullifier } = req.body;

      if (!nullifier) {
        return res.status(400).json({
          error: 'Nullifier requerido',
          mensaje: 'Se debe proporcionar un nullifier para verificar'
        });
      }

      // Validar formato de nullifier
      if (typeof nullifier !== 'string' || !nullifier.startsWith('0x') || nullifier.length !== 66) {
        return res.status(400).json({
          error: 'Formato de nullifier inválido',
          mensaje: 'El nullifier debe ser una cadena hexadecimal de 32 bytes (0x...)'
        });
      }

      const esElegible = await VotoService.verificarElegibilidad(nullifier);
      const noUsado = await VotoService.verificarNoUsado(nullifier);

      res.status(200).json({
        nullifier,
        elegible: esElegible,
        disponible: noUsado,
        puedeVotar: esElegible && noUsado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en verificarElegibilidadNullifier:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo verificar la elegibilidad del nullifier'
      });
    }
  }

  // Preparar voto (generar nullifier para preview)
  static async prepararVoto(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token requerido',
          mensaje: 'Se debe proporcionar un token para preparar el voto'
        });
      }

      // Generar nullifier
      const nullifier = VotoService.generarNullifier(token);

      // Verificar elegibilidad
      const esElegible = await VotoService.verificarElegibilidad(nullifier);
      const noUsado = await VotoService.verificarNoUsado(nullifier);

      res.status(200).json({
        nullifier,
        elegible: esElegible,
        disponible: noUsado,
        puedeVotar: esElegible && noUsado,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en prepararVoto:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo preparar el voto'
      });
    }
  }

  // Obtener todas las boletas de blockchain
  static async obtenerBoletas(req: Request, res: Response) {
    try {
      const boletas = await VotoService.obtenerTodasLasBoletas();

      res.status(200).json({
        boletas,
        total: boletas.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en obtenerBoletas:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudieron obtener las boletas'
      });
    }
  }
}
