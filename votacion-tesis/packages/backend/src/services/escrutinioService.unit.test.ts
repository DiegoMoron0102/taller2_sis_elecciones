import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import fs from "fs";
import crypto from "crypto";

vi.mock("../lib/prisma", () => ({
  prisma: {
    votoContabilizado: { groupBy: vi.fn(), count: vi.fn() },
    candidato: { findMany: vi.fn() },
    logAuditoria: { create: vi.fn() },
    configuracionEleccion: { updateMany: vi.fn() },
  },
}));

vi.mock("./blockchainService", () => ({
  BlockchainService: {
    conteoHabilitado: vi.fn(),
    resultadosPublicados: vi.fn(),
    totalBoletas: vi.fn(),
    publicarResultados: vi.fn(),
    obtenerResultados: vi.fn(),
  },
}));

import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";
import {
  dividirSecreto,
  reconstruirSecreto,
  SHARES_N,
  SHARES_UMBRAL,
  sharesExisten,
  inicializarShares,
  obtenerEstadoEscrutinio,
  ejecutarEscrutinio,
} from "./escrutinioService";

// ─── Shamir matemático ────────────────────────────────────────────────────────

describe("escrutinioService: Shamir Secret Sharing", () => {
  it("reconstructed secret matches original with all N shares", () => {
    const secreto = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
    const shares = dividirSecreto(secreto, SHARES_N, SHARES_UMBRAL);
    const reconstruido = reconstruirSecreto(shares);
    expect(reconstruido).toBe(secreto);
  });

  it("reconstructed secret matches original with exactly umbral shares", () => {
    const secreto = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
    const shares = dividirSecreto(secreto, SHARES_N, SHARES_UMBRAL);
    const parciales = shares.slice(0, SHARES_UMBRAL);
    const reconstruido = reconstruirSecreto(parciales);
    expect(reconstruido).toBe(secreto);
  });

  it("reconstructed secret matches original with any M-of-N subset", () => {
    const secreto = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
    const shares = dividirSecreto(secreto, SHARES_N, SHARES_UMBRAL);
    const subset = [shares[1], shares[3], shares[4]];
    const reconstruido = reconstruirSecreto(subset);
    expect(reconstruido).toBe(secreto);
  });

  it("reconstruction with wrong shares does NOT match original", () => {
    const secreto1 = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
    const secreto2 = BigInt("0x" + crypto.randomBytes(20).toString("hex"));
    const shares1 = dividirSecreto(secreto1, SHARES_N, SHARES_UMBRAL);
    const shares2 = dividirSecreto(secreto2, SHARES_N, SHARES_UMBRAL);
    const mezcladas = [shares1[0], shares2[1], shares1[2]];
    const reconstruido = reconstruirSecreto(mezcladas);
    expect(reconstruido).not.toBe(secreto1);
  });

  it("dividirSecreto genera N compartimentos con índices 1..N", () => {
    const secreto = 12345n;
    const shares = dividirSecreto(secreto, SHARES_N, SHARES_UMBRAL);
    expect(shares).toHaveLength(SHARES_N);
    shares.forEach((s, i) => {
      expect(s.x).toBe(i + 1);
      expect(s.y).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  it("umbral definido es 3 de 5", () => {
    expect(SHARES_N).toBe(5);
    expect(SHARES_UMBRAL).toBe(3);
  });
});

// ─── sharesExisten ────────────────────────────────────────────────────────────

describe("escrutinioService.sharesExisten", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shamir-test-"));
    process.env.SHAMIR_SHARES_DIR = tmpDir;
  });

  afterEach(() => {
    delete process.env.SHAMIR_SHARES_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("retorna true cuando config.json existe", () => {
    fs.writeFileSync(path.join(tmpDir, "config.json"), "{}");
    expect(sharesExisten()).toBe(true);
  });

  it("retorna false cuando config.json no existe", () => {
    expect(sharesExisten()).toBe(false);
  });
});

// ─── inicializarShares ────────────────────────────────────────────────────────

describe("escrutinioService.inicializarShares", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shamir-test-"));
    process.env.SHAMIR_SHARES_DIR = tmpDir;
  });

  afterEach(() => {
    delete process.env.SHAMIR_SHARES_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("lanza error si ya están inicializados", () => {
    fs.writeFileSync(path.join(tmpDir, "config.json"), "{}");
    expect(() => inicializarShares()).toThrow("ya fueron inicializados");
  });

  it("crea config y N compartimentos en el directorio", () => {
    const resultado = inicializarShares();

    expect(resultado.compartimentos).toHaveLength(SHARES_N);
    expect(resultado.config.n).toBe(SHARES_N);
    expect(resultado.config.umbral).toBe(SHARES_UMBRAL);
    expect(resultado.config.hashSecreto).toMatch(/^[0-9a-f]{64}$/);

    expect(fs.existsSync(path.join(tmpDir, "config.json"))).toBe(true);
    for (let i = 1; i <= SHARES_N; i++) {
      expect(fs.existsSync(path.join(tmpDir, `compartimento-${i}.json`))).toBe(true);
    }
  });

  it("el secreto reconstruido coincide con el original (round-trip con archivos)", () => {
    const { compartimentos, config } = inicializarShares();

    const sharesLeidas = compartimentos.slice(0, SHARES_UMBRAL).map(c => ({ x: c.indice, y: c.valor }));
    const secretoReconstruido = reconstruirSecreto(sharesLeidas);
    const hexSecreto = secretoReconstruido.toString(16).padStart(62, "0");
    const secretoBytes = Buffer.from(hexSecreto, "hex");
    const hashVerificacion = crypto.createHash("sha256").update(secretoBytes).digest("hex");

    expect(hashVerificacion).toBe(config.hashSecreto);
  });
});

// ─── obtenerEstadoEscrutinio ──────────────────────────────────────────────────

describe("escrutinioService.obtenerEstadoEscrutinio", () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.resetAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "shamir-test-"));
    process.env.SHAMIR_SHARES_DIR = tmpDir;
  });

  afterEach(() => {
    delete process.env.SHAMIR_SHARES_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("retorna estado completo cuando escrutinio no está inicializado", async () => {
    (BlockchainService.conteoHabilitado as any).mockResolvedValue(false);
    (BlockchainService.resultadosPublicados as any).mockResolvedValue(false);
    (BlockchainService.totalBoletas as any).mockResolvedValue(3);
    (prisma.votoContabilizado.count as any).mockResolvedValue(3);

    const estado = await obtenerEstadoEscrutinio();

    expect(estado.inicializado).toBe(false);
    expect(estado.conteoHabilitado).toBe(false);
    expect(estado.resultadosPublicados).toBe(false);
    expect(estado.totalBoletas).toBe(3);
    expect(estado.votosContabilizados).toBe(3);
    expect(estado.shamir).toBeNull();
  });

  it("incluye datos shamir cuando está inicializado", async () => {
    const config = {
      hashSecreto: "abc123",
      n: SHARES_N,
      umbral: SHARES_UMBRAL,
      fechaGeneracion: "2026-01-01T00:00:00.000Z",
    };
    fs.writeFileSync(path.join(tmpDir, "config.json"), JSON.stringify(config));

    (BlockchainService.conteoHabilitado as any).mockResolvedValue(true);
    (BlockchainService.resultadosPublicados as any).mockResolvedValue(false);
    (BlockchainService.totalBoletas as any).mockResolvedValue(5);
    (prisma.votoContabilizado.count as any).mockResolvedValue(5);

    const estado = await obtenerEstadoEscrutinio();

    expect(estado.inicializado).toBe(true);
    expect(estado.conteoHabilitado).toBe(true);
    expect(estado.shamir?.n).toBe(SHARES_N);
    expect(estado.shamir?.umbral).toBe(SHARES_UMBRAL);
  });
});

// ─── ejecutarEscrutinio ───────────────────────────────────────────────────────

describe("escrutinioService.ejecutarEscrutinio", () => {
  beforeEach(() => vi.resetAllMocks());

  it("lanza error si el conteo no está habilitado", async () => {
    (BlockchainService.conteoHabilitado as any).mockResolvedValue(false);
    (BlockchainService.resultadosPublicados as any).mockResolvedValue(false);

    await expect(ejecutarEscrutinio([1, 2, 3], "admin-1")).rejects.toThrow("no está habilitado");
  });

  it("lanza error si los resultados ya fueron publicados", async () => {
    (BlockchainService.conteoHabilitado as any).mockResolvedValue(true);
    (BlockchainService.resultadosPublicados as any).mockResolvedValue(true);

    await expect(ejecutarEscrutinio([1, 2, 3], "admin-1")).rejects.toThrow("ya fueron publicados");
  });

  it("lanza error si se proveen menos shares que el umbral", async () => {
    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), "shamir-test-"));
    process.env.SHAMIR_SHARES_DIR = tmpDir2;
    try {
      const config = { hashSecreto: "abc", n: SHARES_N, umbral: SHARES_UMBRAL, fechaGeneracion: "2026-01-01" };
      fs.writeFileSync(path.join(tmpDir2, "config.json"), JSON.stringify(config));

      (BlockchainService.conteoHabilitado as any).mockResolvedValue(true);
      (BlockchainService.resultadosPublicados as any).mockResolvedValue(false);

      await expect(ejecutarEscrutinio([1, 2], "admin-1")).rejects.toThrow("al menos 3 compartimentos");
    } finally {
      delete process.env.SHAMIR_SHARES_DIR;
      fs.rmSync(tmpDir2, { recursive: true, force: true });
    }
  });
});
