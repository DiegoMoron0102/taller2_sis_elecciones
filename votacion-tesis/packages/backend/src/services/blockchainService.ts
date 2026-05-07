import { ethers } from "ethers";

const NULLIFIER_SET_ABI = [
  "function registrarNullifiers(bytes32[] calldata nullifiers) external",
  "function elegible(bytes32) external view returns (bool)",
  "function usado(bytes32) external view returns (bool)",
  "function disponibles() external view returns (uint256)",
] as const;

const BULLETIN_BOARD_ABI = [
  "function registrarBoleta(bytes votoCifrado, bytes pruebaZK, bytes32 nullifier) external",
  "function abrirEleccion() external",
  "function cerrarEleccion() external",
  "function eleccionAbierta() external view returns (bool)",
  "function totalBoletas() external view returns (uint256)",
  "function obtenerBoleta(uint256 id) external view returns (tuple(bytes votoCifrado, bytes pruebaZK, bytes32 nullifier, uint256 bloque, uint256 timestamp))",
] as const;

const ESCRUTINIO_ABI = [
  "function habilitarConteo() external",
  "function conteoHabilitado() external view returns (bool)",
  "function estaPublicado() external view returns (bool)",
] as const;

const ADMIN_PARAMS_ABI = [
  "function totalCandidatos() external view returns (uint256)",
  "function candidato(uint256 indice) external view returns (string)",
] as const;

export class BlockchainService {
  private static provider: ethers.JsonRpcProvider;

  private static getProvider() {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL ?? "http://127.0.0.1:8545");
    }
    return this.provider;
  }

  private static async getSigner() {
    const provider = this.getProvider();
    return await provider.getSigner(0);
  }

  private static async nullifierSetWriteContract() {
    const signer = await this.getSigner();
    const address = process.env.NULLIFIER_SET_ADDRESS;
    if (!address) throw new Error("NULLIFIER_SET_ADDRESS no configurado");
    return new ethers.Contract(address, NULLIFIER_SET_ABI, signer);
  }

  private static nullifierSetReadContract() {
    const address = process.env.NULLIFIER_SET_ADDRESS;
    if (!address) throw new Error("NULLIFIER_SET_ADDRESS no configurado");
    return new ethers.Contract(address, NULLIFIER_SET_ABI, this.getProvider());
  }

  private static async bulletinBoardWriteContract() {
    const signer = await this.getSigner();
    const address = process.env.BULLETIN_BOARD_ADDRESS;
    if (!address) throw new Error("BULLETIN_BOARD_ADDRESS no configurado");
    return new ethers.Contract(address, BULLETIN_BOARD_ABI, signer);
  }

  private static bulletinBoardReadContract() {
    const address = process.env.BULLETIN_BOARD_ADDRESS;
    if (!address) throw new Error("BULLETIN_BOARD_ADDRESS no configurado");
    return new ethers.Contract(address, BULLETIN_BOARD_ABI, this.getProvider());
  }

  private static adminParamsReadContract() {
    const address = process.env.ADMIN_PARAMS_ADDRESS;
    if (!address) throw new Error("ADMIN_PARAMS_ADDRESS no configurado");
    return new ethers.Contract(address, ADMIN_PARAMS_ABI, this.getProvider());
  }

  private static async escrutinioWriteContract() {
    const signer = await this.getSigner();
    const address = process.env.ESCRUTINIO_ADDRESS;
    if (!address) throw new Error("ESCRUTINIO_ADDRESS no configurado");
    return new ethers.Contract(address, ESCRUTINIO_ABI, signer);
  }

  private static escrutinioReadContract() {
    const address = process.env.ESCRUTINIO_ADDRESS;
    if (!address) throw new Error("ESCRUTINIO_ADDRESS no configurado");
    return new ethers.Contract(address, ESCRUTINIO_ABI, this.getProvider());
  }

  static async registrarNullifierElegible(nullifier: string) {
    const contract = await this.nullifierSetWriteContract();
    const tx = await contract.registrarNullifiers([nullifier]);
    await tx.wait();
  }

  static async esNullifierElegible(nullifier: string): Promise<boolean> {
    const contract = this.nullifierSetReadContract();
    return Boolean(await contract.elegible(nullifier));
  }

  static async fueNullifierUsado(nullifier: string): Promise<boolean> {
    const contract = this.nullifierSetReadContract();
    return Boolean(await contract.usado(nullifier));
  }

  static async eleccionAbierta(): Promise<boolean> {
    const contract = this.bulletinBoardReadContract();
    return Boolean(await contract.eleccionAbierta());
  }

  static async registrarBoleta(votoCifrado: string, pruebaZK: string, nullifier: string) {
    const contract = await this.bulletinBoardWriteContract();
    const tx = await contract.registrarBoleta(votoCifrado, pruebaZK, nullifier);
    const receipt = await tx.wait();
    return { txHash: tx.hash, blockNumber: Number(receipt?.blockNumber ?? 0) };
  }

  static async totalBoletas(): Promise<number> {
    const contract = this.bulletinBoardReadContract();
    const total = await contract.totalBoletas();
    return Number(total);
  }

  static async obtenerBoleta(id: number) {
    const contract = this.bulletinBoardReadContract();
    const boleta = await contract.obtenerBoleta(id);
    return {
      votoCifrado: boleta.votoCifrado as string,
      pruebaZK: boleta.pruebaZK as string,
      nullifier: boleta.nullifier as string,
      bloque: Number(boleta.bloque),
      timestamp: Number(boleta.timestamp),
    };
  }

  static async obtenerCandidatos(): Promise<string[]> {
    const contract = this.adminParamsReadContract();
    const total = Number(await contract.totalCandidatos());
    const candidatos: string[] = [];
    for (let i = 0; i < total; i++) {
      candidatos.push(await contract.candidato(i));
    }
    return candidatos;
  }

  static async abrirEleccion() {
    const contract = await this.bulletinBoardWriteContract();
    const tx = await contract.abrirEleccion();
    await tx.wait();
  }

  static async cerrarEleccion() {
    const contract = await this.bulletinBoardWriteContract();
    const tx = await contract.cerrarEleccion();
    await tx.wait();
  }

  static async habilitarConteo() {
    const contract = await this.escrutinioWriteContract();
    const tx = await contract.habilitarConteo();
    await tx.wait();
  }

  static async conteoHabilitado(): Promise<boolean> {
    const contract = this.escrutinioReadContract();
    return Boolean(await contract.conteoHabilitado());
  }

  static async resultadosPublicados(): Promise<boolean> {
    const contract = this.escrutinioReadContract();
    return Boolean(await contract.estaPublicado());
  }

  static async verificarComprobante(txHash: string) {
    const provider = this.getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return null;

    const bulletinAddress = process.env.BULLETIN_BOARD_ADDRESS;
    if (!bulletinAddress) throw new Error("BULLETIN_BOARD_ADDRESS no configurado");

    const iface = new ethers.Interface([
      "event BoletaRegistrada(uint256 indexed id, bytes32 indexed nullifier, uint256 bloque)",
    ]);
    const topicHash = iface.getEvent("BoletaRegistrada")!.topicHash;

    const log = receipt.logs.find(
      l => l.address.toLowerCase() === bulletinAddress.toLowerCase() && l.topics[0] === topicHash,
    );
    if (!log) return null;

    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
    const boletaId = Number(parsed!.args.id);
    const boleta = await this.obtenerBoleta(boletaId);

    return {
      txHash,
      blockNumber: receipt.blockNumber,
      boletaId,
      nullifier: boleta.nullifier,
      timestamp: boleta.timestamp,
      estado: "registrado" as const,
    };
  }
}
