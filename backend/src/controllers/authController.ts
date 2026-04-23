import { Request, Response } from 'express';
import { VotanteService, CredencialSimulada } from '../services/votanteService';

export class AuthController {
  // Verificar elegibilidad y emitir token
  static async verificarElegibilidad(req: Request, res: Response) {
    try {
      const credencial: CredencialSimulada = req.body;

      // Validar datos de entrada
      if (!credencial.numeroPadron || !credencial.nombre || !credencial.ci) {
        return res.status(400).json({
          error: 'Datos de credencial incompletos',
          mensaje: 'Se requiere número de padrón, nombre y CI'
        });
      }

      // Emitir token anónimo
      const tokenResponse = await VotanteService.emitirTokenAnonimo(credencial);

      res.status(200).json({
        mensaje: 'Credencial verificada exitosamente',
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn,
        sessionId: tokenResponse.sessionId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en verificarElegibilidad:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('inválida')) {
          return res.status(401).json({
            error: 'Credencial inválida',
            mensaje: 'La credencial proporcionada no es válida o ya ha sido utilizada'
          });
        }
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo procesar la credencial'
      });
    }
  }

  // Validar token existente
  static async validarToken(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token requerido',
          mensaje: 'Se debe proporcionar un token para validar'
        });
      }

      const resultado = await VotanteService.validarToken(token);

      res.status(200).json({
        valido: resultado.valido,
        sessionId: resultado.sesionId || null,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en validarToken:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo validar el token'
      });
    }
  }

  // Cerrar sesión (marcar token como usado)
  static async cerrarSesion(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'No autorizado',
          mensaje: 'Se requiere token de autenticación'
        });
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      await VotanteService.marcarTokenComoUsado(token);

      res.status(200).json({
        mensaje: 'Sesión cerrada correctamente',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error en cerrarSesion:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo cerrar la sesión'
      });
    }
  }

  // Obtener estadísticas de tokens (solo admin)
  static async obtenerEstadisticas(req: Request, res: Response) {
    try {
      const estadisticas = await VotanteService.obtenerEstadisticasTokens();

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
}
