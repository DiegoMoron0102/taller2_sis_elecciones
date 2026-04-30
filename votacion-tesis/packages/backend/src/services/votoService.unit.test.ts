import { describe, it, expect, vi, beforeEach } from "vitest";
import { VotoService } from "./votoService";
import { VotanteService } from "./votanteService";
import { BlockchainService } from "./blockchainService";
import { prisma } from "../lib/prisma";

const tokenValido = "t".repeat(64);
const tokenHashValido = "hash-token-ok";

function mockTokenOk() {
  vi.spyOn(VotanteService, "validarToken").mockResolvedValue({
    valido: true,
    sessionId: "s1",
    tokenHash: tokenHashValido,
  });
}

function mockEleccionAbierta(abierta = true) {
  vi.spyOn(BlockchainService, "eleccionAbierta").mockResolvedValue(abierta);
}

function mockCandidatos(candidatos: string[]) {
  vi.spyOn(BlockchainService, "obtenerCandidatos").mockResolvedValue(candidatos);
}

function mockPrismaOk() {
  vi.spyOn(prisma.logAuditoria, "create").mockResolvedValue({} as any);
}

describe("VotoService — funciones puras", () => {
  it("PU-05: rechaza candidatoId negativo", async () => {
    await expect(VotoService.emitirVoto({ candidatoId: -1, token: tokenValido })).rejects.toThrow(
      "candidatoId inválido",
    );
  });

  it("genera nullifier determinista desde el mismo token", () => {
    const a = VotoService.generarNullifierDesdeToken("secreto-123");
    const b = VotoService.generarNullifierDesdeToken("secreto-123");
    expect(a).toBe(b);
    expect(a.startsWith("0x")).toBe(true);
    expect(a).toHaveLength(66);
  });

  it("cifrarVoto retorna hex prefixed y varía entre llamadas", () => {
    const a = VotoService.cifrarVoto(1);
    const b = VotoService.cifrarVoto(1);
    expect(a.startsWith("0x")).toBe(true);
    expect(b.startsWith("0x")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("generarPruebaZK es determinista para mismos inputs", () => {
    const a = VotoService.generarPruebaZK("0xabc", "0x123");
    const b = VotoService.generarPruebaZK("0xabc", "0x123");
    expect(a).toBe(b);
  });
});

describe("VotoService.emitirVoto — reglas de negocio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPrismaOk();
  });

  it("PU-06: rechaza si token no es válido", async () => {
    vi.spyOn(VotanteService, "validarToken").mockResolvedValue({
      valido: false,
      motivo: "Token no registrado",
    });

    await expect(VotoService.emitirVoto({ candidatoId: 0, token: tokenValido })).rejects.toThrow(
      "Token no registrado",
    );
  });

  it("PU-07: rechaza si elección está cerrada", async () => {
    mockTokenOk();
    mockEleccionAbierta(false);

    await expect(VotoService.emitirVoto({ candidatoId: 0, token: tokenValido })).rejects.toThrow(
      "La elección está cerrada",
    );
  });

  it("PU-08: rechaza si candidato está fuera de rango", async () => {
    mockTokenOk();
    mockEleccionAbierta(true);
    mockCandidatos(["A", "B"]);

    await expect(VotoService.emitirVoto({ candidatoId: 5, token: tokenValido })).rejects.toThrow(
      "Candidato fuera de rango",
    );
  });

  it("PU-09: rechaza si el nullifier ya fue usado (doble voto)", async () => {
    mockTokenOk();
    mockEleccionAbierta(true);
    mockCandidatos(["A", "B"]);
    vi.spyOn(BlockchainService, "esNullifierElegible").mockResolvedValue(true);
    vi.spyOn(BlockchainService, "fueNullifierUsado").mockResolvedValue(true);

    await expect(VotoService.emitirVoto({ candidatoId: 0, token: tokenValido })).rejects.toThrow(
      "doble voto",
    );
  });

  it("PU-10: emite voto correctamente cuando todo es válido", async () => {
    mockTokenOk();
    mockEleccionAbierta(true);
    mockCandidatos(["A", "B", "C"]);
    vi.spyOn(BlockchainService, "esNullifierElegible").mockResolvedValue(false);
    vi.spyOn(BlockchainService, "registrarNullifierElegible").mockResolvedValue(undefined);
    vi.spyOn(BlockchainService, "fueNullifierUsado").mockResolvedValue(false);
    vi.spyOn(BlockchainService, "registrarBoleta").mockResolvedValue({
      txHash: "0xabc123deadbeef",
      blockNumber: 42,
    });
    vi.spyOn(VotanteService, "marcarTokenUsado").mockResolvedValue(undefined);

    const res = await VotoService.emitirVoto({ candidatoId: 1, token: tokenValido });

    expect(res.mensaje).toBe("Voto emitido exitosamente");
    expect(res.transaccion.hash).toBe("0xabc123deadbeef");
    expect(res.transaccion.bloque).toBe(42);
    expect(res.boleta.nullifier.startsWith("0x")).toBe(true);
    expect(res.hashComprobante).toHaveLength(64);
  });
});

describe("VotoService.estadoEleccion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("PU-11: agrega estado, candidatos y total de boletas", async () => {
    mockEleccionAbierta(true);
    mockCandidatos(["A", "B"]);
    vi.spyOn(BlockchainService, "totalBoletas").mockResolvedValue(7);

    const estado = await VotoService.estadoEleccion();

    expect(estado.abierta).toBe(true);
    expect(estado.candidatos).toEqual(["A", "B"]);
    expect(estado.totalBoletas).toBe(7);
    expect(typeof estado.timestamp).toBe("string");
  });
});

describe("VotoService.verificarComprobante", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("PU-12: retorna datos de boleta cuando txHash es válido y existe", async () => {
    const mockData = {
      txHash: "0x" + "a".repeat(64),
      blockNumber: 5,
      boletaId: 0,
      nullifier: "0x" + "b".repeat(64),
      timestamp: 1700000000,
      estado: "registrado" as const,
    };
    vi.spyOn(BlockchainService, "verificarComprobante").mockResolvedValue(mockData);

    const res = await VotoService.verificarComprobante("0x" + "a".repeat(64));

    expect(res).not.toBeNull();
    expect(res?.estado).toBe("registrado");
    expect(res?.boletaId).toBe(0);
    expect(res?.blockNumber).toBe(5);
  });

  it("PU-13: retorna null cuando txHash no corresponde a una boleta", async () => {
    vi.spyOn(BlockchainService, "verificarComprobante").mockResolvedValue(null);

    const res = await VotoService.verificarComprobante("0x" + "c".repeat(64));

    expect(res).toBeNull();
  });
});
