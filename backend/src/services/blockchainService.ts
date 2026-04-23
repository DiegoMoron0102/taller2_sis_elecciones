import { ethers } from 'ethers';

// ABI de los contratos
const BULLETIN_BOARD_ABI = [
  "function registrarBoleta(bytes votoCifrado, bytes pruebaZK, bytes32 nullifier) external",
  "function totalBoletas() external view returns (uint256)",
  "function eleccionAbierta() external view returns (bool)",
  "function obtenerBoleta(uint256 id) external view returns (tuple(bytes votoCifrado, bytes pruebaZK, bytes32 nullifier, uint256 bloque))",
  "function obtenerTodasLasBoletas() external view returns (tuple(bytes votoCifrado, bytes pruebaZK, bytes32 nullifier, uint256 bloque)[])"
];

const NULLIFIER_SET_ABI = [
  "function registrarNullifiers(bytes32[] memory _nullifiers) external",
  "function marcarUsado(bytes32 nullifier) external",
  "function estaElegible(bytes32 nullifier) external view returns (bool)",
  "function estaUsado(bytes32 nullifier) external view returns (bool)",
  "function getStatus(bytes32 nullifier) external view returns (bool elegible, bool usado)",
  "function getEstadisticas() external view returns (uint256 elegiblesCount, uint256 usadosCount, uint256 disponibles)"
];

const ADMIN_PARAMS_ABI = [
  "function configurarCandidatos(string[] memory _candidatos) external",
  "function configurarClavePublica(bytes memory _clave) external",
  "function finalizarConfiguracion() external",
  "function getCandidatosCount() external view returns (uint256)",
  "function getCandidato(uint256 index) external view returns (string memory)"
];

export class BlockchainService {
  private static provider: ethers.JsonRpcProvider;
  private static bulletinBoardContract: ethers.Contract;
  private static nullifierSetContract: ethers.Contract;
  private static adminParamsContract: ethers.Contract;

  // Inicializar conexión con blockchain
  static initializeBlockchain() {
    const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(RPC_URL);

    // Direcciones de contratos desplegados
    const BULLETIN_BOARD_ADDRESS = process.env.BULLETIN_BOARD_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
    const NULLIFIER_SET_ADDRESS = process.env.NULLIFIER_SET_ADDRESS || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';
    const ADMIN_PARAMS_ADDRESS = process.env.ADMIN_PARAMS_ADDRESS || '0x0165878A594ca255338adfa4d48449f69242Eb8F';

    // Contratos con solo lectura (no necesitamos signer para leer)
    this.bulletinBoardContract = new ethers.Contract(
      BULLETIN_BOARD_ADDRESS,
      BULLETIN_BOARD_ABI,
      this.provider
    );

    this.nullifierSetContract = new ethers.Contract(
      NULLIFIER_SET_ADDRESS,
      NULLIFIER_SET_ABI,
      this.provider
    );

    this.adminParamsContract = new ethers.Contract(
      ADMIN_PARAMS_ADDRESS,
      ADMIN_PARAMS_ABI,
      this.provider
    );
  }

  // Obtener signer para transacciones
  static async getSigner(): Promise<ethers.JsonRpcSigner> {
    if (!this.provider) {
      this.initializeBlockchain();
    }
    // Usamos la primera cuenta del nodo Hardhat
    return await this.provider.getSigner(0);
  }

  // Obtener contrato con signer para transacciones
  static async getBulletinBoardWithSigner(): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return new ethers.Contract(
      process.env.BULLETIN_BOARD_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      BULLETIN_BOARD_ABI,
      signer
    );
  }

  static async getNullifierSetWithSigner(): Promise<ethers.Contract> {
    const signer = await this.getSigner();
    return new ethers.Contract(
      process.env.NULLIFIER_SET_ADDRESS || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      NULLIFIER_SET_ABI,
      signer
    );
  }

  // Verificar si la elección está abierta
  static async verificarEleccionAbierta(): Promise<boolean> {
    try {
      if (!this.bulletinBoardContract) {
        this.initializeBlockchain();
      }
      
      return await this.bulletinBoardContract.eleccionAbierta();
    } catch (error) {
      console.error('Error verificando estado de elección:', error);
      return false;
    }
  }

  // Verificar elegibilidad del nullifier
  static async verificarElegibilidad(nullifier: string): Promise<boolean> {
    try {
      if (!this.nullifierSetContract) {
        this.initializeBlockchain();
      }
      
      return await this.nullifierSetContract.estaElegible(nullifier);
    } catch (error) {
      console.error('Error verificando elegibilidad:', error);
      return false;
    }
  }

  // Verificar que el nullifier no haya sido usado
  static async verificarNoUsado(nullifier: string): Promise<boolean> {
    try {
      if (!this.nullifierSetContract) {
        this.initializeBlockchain();
      }
      
      const usado = await this.nullifierSetContract.estaUsado(nullifier);
      return !usado;
    } catch (error) {
      console.error('Error verificando uso de nullifier:', error);
      return false;
    }
  }

  // Registrar nullifier como elegible
  static async registrarNullifier(nullifier: string): Promise<void> {
    try {
      const contract = await this.getNullifierSetWithSigner();
      const tx = await contract.registrarNullifiers([nullifier]);
      await tx.wait();
      console.log(`Nullifier registrado: ${nullifier}`);
    } catch (error) {
      console.error('Error registrando nullifier:', error);
      throw error;
    }
  }

  // Marcar nullifier como usado
  static async marcarNullifierUsado(nullifier: string): Promise<void> {
    try {
      const contract = await this.getNullifierSetWithSigner();
      const tx = await contract.marcarUsado(nullifier);
      await tx.wait();
      console.log(`Nullifier marcado como usado: ${nullifier}`);
    } catch (error) {
      console.error('Error marcando nullifier como usado:', error);
      throw error;
    }
  }

  // Emitir voto en blockchain
  static async emitirVotoBlockchain(
    votoCifrado: string,
    pruebaZK: string,
    nullifier: string
  ): Promise<{ txHash: string; bloque: number; boletaId: number }> {
    try {
      // 1. Registrar nullifier como elegible
      await this.registrarNullifier(nullifier);

      // 2. Emitir voto en BulletinBoard
      const bulletinBoard = await this.getBulletinBoardWithSigner();
      const tx = await bulletinBoard.registrarBoleta(votoCifrado, pruebaZK, nullifier);
      const receipt = await tx.wait();

      // 3. Marcar nullifier como usado
      await this.marcarNullifierUsado(nullifier);

      // Obtener ID de la boleta
      const totalBoletas = await this.bulletinBoardContract.totalBoletas();
      const boletaId = Number(totalBoletas) - 1;

      return {
        txHash: tx.hash,
        bloque: receipt.blockNumber,
        boletaId
      };

    } catch (error) {
      console.error('Error emitiendo voto en blockchain:', error);
      throw error;
    }
  }

  // Obtener estadísticas de la blockchain
  static async obtenerEstadisticasBlockchain(): Promise<{
    totalVotos: number;
    elegiblesCount: number;
    usadosCount: number;
    disponibles: number;
    eleccionAbierta: boolean;
  }> {
    try {
      if (!this.bulletinBoardContract || !this.nullifierSetContract) {
        this.initializeBlockchain();
      }

      const [totalVotos, estadisticas, eleccionAbierta] = await Promise.all([
        this.bulletinBoardContract.totalBoletas(),
        this.nullifierSetContract.getEstadisticas(),
        this.bulletinBoardContract.eleccionAbierta()
      ]);

      return {
        totalVotos: Number(totalVotos),
        elegiblesCount: Number(estadisticas[0]),
        usadosCount: Number(estadisticas[1]),
        disponibles: Number(estadisticas[2]),
        eleccionAbierta: Boolean(eleccionAbierta)
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
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
      if (!this.bulletinBoardContract) {
        this.initializeBlockchain();
      }

      const boletas = await this.bulletinBoardContract.obtenerTodasLasBoletas();
      
      return boletas.map((boleta: any, index: number) => ({
        id: index,
        votoCifrado: boleta.votoCifrado,
        pruebaZK: boleta.pruebaZK,
        nullifier: boleta.nullifier,
        bloque: Number(boleta.bloque)
      }));
    } catch (error) {
      console.error('Error obteniendo boletas:', error);
      throw error;
    }
  }

  // Obtener candidatos configurados
  static async obtenerCandidatos(): Promise<string[]> {
    try {
      if (!this.adminParamsContract) {
        this.initializeBlockchain();
      }

      const count = await this.adminParamsContract.getCandidatosCount();
      const candidatos = [];

      for (let i = 0; i < Number(count); i++) {
        const candidato = await this.adminParamsContract.getCandidato(i);
        candidatos.push(candidato);
      }

      return candidatos;
    } catch (error) {
      console.error('Error obteniendo candidatos:', error);
      throw error;
    }
  }
}
