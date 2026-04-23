import * as crypto from 'crypto';
import { BlockchainService } from './blockchainService';

export interface VotoData {
  candidatoId: number;
  token: string;
}

export interface BoletaCifrada {
  votoCifrado: string;  // ElGamal ciphertext simulado
  pruebaZK: string;    // Prueba ZK simulada
  nullifier: string;   // Hash para prevenir doble voto
}

export class VotoService {
  // Generar nullifier a partir del token
  static generarNullifier(token: string): string {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return '0x' + hash;
  }

  // Simular cifrado ElGamal del voto
  static cifrarVoto(candidatoId: number): string {
    // Simulación: generar ciphertext representando el voto cifrado
    const randomValue = crypto.randomBytes(16).toString('hex');
    const voteData = `${candidatoId}:${randomValue}:${Date.now()}`;
    const ciphertext = crypto.createHash('sha256').update(voteData).digest('hex');
    return '0x' + ciphertext;
  }

  // Simular prueba ZK de validez
  static generarPruebaZK(votoCifrado: string, nullifier: string): string {
    // Simulación: generar prueba ZK que demuestra validez del voto
    const proofData = `${votoCifrado}:${nullifier}:valid`;
    const proof = crypto.createHash('sha256').update(proofData).digest('hex');
    return '0x' + proof;
  }

  // Verificar si la elección está abierta
  static async verificarEleccionAbierta(): Promise<boolean> {
    try {
      return await BlockchainService.verificarEleccionAbierta();
    } catch (error) {
      console.error('Error verificando estado de elección:', error);
      return true;
    }
  }

  // Verificar elegibilidad del nullifier
  static async verificarElegibilidad(nullifier: string): Promise<boolean> {
    try {
      return await BlockchainService.verificarElegibilidad(nullifier);
    } catch (error) {
      console.error('Error verificando elegibilidad:', error);
      return true;
    }
  }

  // Verificar que el nullifier no haya sido usado
  static async verificarNoUsado(nullifier: string): Promise<boolean> {
    try {
      return await BlockchainService.verificarNoUsado(nullifier);
    } catch (error) {
      console.error('Error verificando uso de nullifier:', error);
      return true;
    }
  }

  // Emitir voto completo con blockchain real
  static async emitirVoto(votoData: VotoData): Promise<{
    boleta: BoletaCifrada;
    txHash: string;
    bloque: number;
    boletaId: number;
  }> {
    try {
      // Validar datos de entrada
      if (!votoData.candidatoId || !votoData.token) {
        throw new Error('Datos de voto incompletos');
      }

      // Verificar que la elección esté abierta
      const eleccionAbierta = await this.verificarEleccionAbierta();
      if (!eleccionAbierta) {
        throw new Error('La elección no está abierta');
      }

      // Generar nullifier
      const nullifier = this.generarNullifier(votoData.token);

      // Verificar elegibilidad
      const esElegible = await this.verificarElegibilidad(nullifier);
      if (!esElegible) {
        throw new Error('Nullifier no es elegible');
      }

      // Verificar que no haya sido usado
      const noUsado = await this.verificarNoUsado(nullifier);
      if (!noUsado) {
        throw new Error('Este voto ya ha sido emitido');
      }

      // Cifrar voto
      const votoCifrado = this.cifrarVoto(votoData.candidatoId);

      // Generar prueba ZK
      const pruebaZK = this.generarPruebaZK(votoCifrado, nullifier);

      // Emitir voto en blockchain real
      const resultado = await BlockchainService.emitirVotoBlockchain(
        votoCifrado,
        pruebaZK,
        nullifier
      );

      // Crear boleta
      const boleta: BoletaCifrada = {
        votoCifrado,
        pruebaZK,
        nullifier
      };

      console.log(`Voto emitido exitosamente en blockchain - TX: ${resultado.txHash}, Bloque: ${resultado.bloque}`);

      return {
        boleta,
        txHash: resultado.txHash,
        bloque: resultado.bloque,
        boletaId: resultado.boletaId
      };

    } catch (error) {
      console.error('Error emitiendo voto:', error);
      throw error;
    }
  }

  // Obtener estadísticas de votación desde blockchain
  static async obtenerEstadisticas(): Promise<{
    totalVotos: number;
    elegiblesCount: number;
    usadosCount: number;
    disponibles: number;
    eleccionAbierta: boolean;
  }> {
    try {
      return await BlockchainService.obtenerEstadisticasBlockchain();
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalVotos: 0,
        elegiblesCount: 0,
        usadosCount: 0,
        disponibles: 0,
        eleccionAbierta: true
      };
    }
  }

  // Obtener todas las boletas de la blockchain
  static async obtenerTodasLasBoletas(): Promise<Array<{
    id: number;
    votoCifrado: string;
    pruebaZK: string;
    nullifier: string;
    bloque: number;
  }>> {
    try {
      return await BlockchainService.obtenerTodasLasBoletas();
    } catch (error) {
      console.error('Error obteniendo boletas:', error);
      return [];
    }
  }

  // Obtener candidatos configurados
  static async obtenerCandidatos(): Promise<string[]> {
    try {
      return await BlockchainService.obtenerCandidatos();
    } catch (error) {
      console.error('Error obteniendo candidatos:', error);
      return [];
    }
  }
}
