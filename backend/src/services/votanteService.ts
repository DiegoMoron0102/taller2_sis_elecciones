import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

// Usar el mismo Prisma Client global que en index.ts
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma || new PrismaClient();

export interface CredencialSimulada {
  numeroPadron: string;
  nombre: string;
  ci: string;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
  sessionId: string;
}

export class VotanteService {
  // Simula validación de credencial VC
  static async verificarCredencial(credencial: CredencialSimulada): Promise<boolean> {
    try {
      // Simulación: validar formato básico
      if (!credencial.numeroPadron || !credencial.nombre || !credencial.ci) {
        return false;
      }

      // Simulación: verificar que el número de padrón tenga formato válido
      const padronRegex = /^[A-Z]{2}\d{6}$/;
      if (!padronRegex.test(credencial.numeroPadron)) {
        return false;
      }

      // Simulación: verificar CI boliviano (formato básico)
      const ciRegex = /^\d{7,8}[A-Z]?$/;
      if (!ciRegex.test(credencial.ci)) {
        return false;
      }

      // Simulación: verificar que no haya votado antes
      const tokenHash = crypto.createHash('sha256').update(credencial.numeroPadron).digest('hex');
      const sesionExistente = await prisma.sesionVotante.findUnique({
        where: { tokenHash }
      });

      if (sesionExistente) {
        return false; // Ya tiene una sesión
      }

      return true;
    } catch (error) {
      console.error('Error verificando credencial:', error);
      return false;
    }
  }

  // Genera token anónimo de un solo uso
  static async emitirTokenAnonimo(credencial: CredencialSimulada): Promise<TokenResponse> {
    try {
      // Verificar credencial primero
      const esValida = await this.verificarCredencial(credencial);
      if (!esValida) {
        throw new Error("Credencial inválida o ya utilizada");
      }

      // Generar token seguro
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Guardar solo el hash en la base de datos
      const sesion = await prisma.sesionVotante.create({
        data: {
          tokenHash,
          usado: false
        }
      });

      // Registrar en auditoría
      await prisma.logAuditoria.create({
        data: {
          accion: 'TOKEN_EMITIDO',
          actor: 'sistema',
          detalle: `Token emitido para credencial: ${credencial.numeroPadron}`
        }
      });

      return {
        token,
        expiresIn: 3600, // 1 hora en segundos
        sessionId: sesion.id
      };
    } catch (error) {
      console.error('Error emitiendo token:', error);
      throw error;
    }
  }

  // Valida un token existente
  static async validarToken(token: string): Promise<{ valido: boolean; sesionId?: string }> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      const sesion = await prisma.sesionVotante.findUnique({
        where: { tokenHash }
      });

      if (!sesion) {
        return { valido: false };
      }

      if (sesion.usado) {
        return { valido: false };
      }

      return { 
        valido: true, 
        sesionId: sesion.id 
      };
    } catch (error) {
      console.error('Error validando token:', error);
      return { valido: false };
    }
  }

  // Marca un token como usado
  static async marcarTokenComoUsado(token: string): Promise<void> {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      
      await prisma.sesionVotante.update({
        where: { tokenHash },
        data: { 
          usado: true,
          usadoEn: new Date()
        }
      });

      // Registrar en auditoría
      await prisma.logAuditoria.create({
        data: {
          accion: 'TOKEN_UTILIZADO',
          actor: 'sistema',
          detalle: `Token marcado como usado: ${tokenHash.substring(0, 8)}...`
        }
      });
    } catch (error) {
      console.error('Error marcando token como usado:', error);
      throw error;
    }
  }

  // Obtiene estadísticas de tokens
  static async obtenerEstadisticasTokens(): Promise<{
    totalTokens: number;
    tokensUsados: number;
    tokensDisponibles: number;
  }> {
    try {
      const totalTokens = await prisma.sesionVotante.count();
      const tokensUsados = await prisma.sesionVotante.count({
        where: { usado: true }
      });
      
      return {
        totalTokens,
        tokensUsados,
        tokensDisponibles: totalTokens - tokensUsados
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}
