import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

vi.mock("../lib/prisma", () => ({
  prisma: {
    administrador: { findUnique: vi.fn() },
    logAuditoria: { create: vi.fn(), findMany: vi.fn() },
    candidato: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    votanteElegible: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    credencialEmitida: { deleteMany: vi.fn() },
    configuracionEleccion: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("./blockchainService", () => ({
  BlockchainService: {
    eleccionAbierta: vi.fn(),
    abrirEleccion: vi.fn(),
    cerrarEleccion: vi.fn(),
    habilitarConteo: vi.fn(),
    conteoHabilitado: vi.fn(),
    resultadosPublicados: vi.fn(),
    totalBoletas: vi.fn(),
  },
}));

import {
  loginAdmin,
  hashPassword,
  agregarCandidato,
  eliminarCandidato,
  agregarVotanteElegible,
  obtenerLogsAuditoria,
  obtenerCandidatos,
  obtenerVotantesElegibles,
  abrirJornada,
  cerrarJornada,
} from "./adminService";
import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";

// ─── loginAdmin ───────────────────────────────────────────────────────────────

describe("adminService.loginAdmin", () => {
  let passwordHashReal: string;

  beforeAll(async () => {
    passwordHashReal = await hashPassword("password123");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_ADMIN_SECRET = "clave-secreta-test";
    (prisma.logAuditoria.create as any).mockResolvedValue({});
  });

  it("retorna token, nombre y email con credenciales válidas", async () => {
    (prisma.administrador.findUnique as any).mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      nombre: "Admin Test",
      passwordHash: passwordHashReal,
    });

    const res = await loginAdmin("admin@test.com", "password123");

    expect(typeof res.token).toBe("string");
    expect(res.email).toBe("admin@test.com");
    expect(res.nombre).toBe("Admin Test");
    expect(res.expiresIn).toBe(7200);
    expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "ADMIN_LOGIN" }) }),
    );
  });

  it("lanza error si el admin no existe", async () => {
    (prisma.administrador.findUnique as any).mockResolvedValue(null);

    await expect(loginAdmin("noexiste@test.com", "password123")).rejects.toThrow("Credenciales inválidas");
    expect(prisma.logAuditoria.create).not.toHaveBeenCalled();
  });

  it("lanza error si la contraseña es incorrecta", async () => {
    (prisma.administrador.findUnique as any).mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      nombre: "Admin Test",
      passwordHash: passwordHashReal,
    });

    await expect(loginAdmin("admin@test.com", "wrong-pass")).rejects.toThrow("Credenciales inválidas");
    expect(prisma.logAuditoria.create).not.toHaveBeenCalled();
  });

  it("lanza error si JWT_ADMIN_SECRET no está configurado", async () => {
    delete process.env.JWT_ADMIN_SECRET;
    (prisma.administrador.findUnique as any).mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      nombre: "Admin Test",
      passwordHash: passwordHashReal,
    });

    await expect(loginAdmin("admin@test.com", "password123")).rejects.toThrow("Configuración de seguridad");
  });
});

// ─── agregarCandidato ─────────────────────────────────────────────────────────

describe("adminService.agregarCandidato", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asigna índice 0 cuando no hay candidatos previos", async () => {
    (prisma.candidato.findFirst as any).mockResolvedValue(null);
    (prisma.candidato.create as any).mockResolvedValue({ id: "c1", nombre: "Diego", descripcion: "PDC", indice: 0 });

    await agregarCandidato("Diego", "PDC");

    expect(prisma.candidato.create).toHaveBeenCalledWith({
      data: { nombre: "Diego", descripcion: "PDC", indice: 0 },
    });
  });

  it("asigna índice siguiente al último existente", async () => {
    (prisma.candidato.findFirst as any).mockResolvedValue({ indice: 2 });
    (prisma.candidato.create as any).mockResolvedValue({ id: "c2", nombre: "Ana", descripcion: null, indice: 3 });

    await agregarCandidato("Ana");

    expect(prisma.candidato.create).toHaveBeenCalledWith({
      data: { nombre: "Ana", descripcion: undefined, indice: 3 },
    });
  });
});

// ─── eliminarCandidato ────────────────────────────────────────────────────────

describe("adminService.eliminarCandidato", () => {
  it("invoca prisma.candidato.delete con el id correcto", async () => {
    (prisma.candidato.delete as any).mockResolvedValue({});

    await eliminarCandidato("candidato-99");

    expect(prisma.candidato.delete).toHaveBeenCalledWith({ where: { id: "candidato-99" } });
  });
});

// ─── obtenerCandidatos ────────────────────────────────────────────────────────

describe("adminService.obtenerCandidatos", () => {
  it("retorna candidatos ordenados por índice", async () => {
    const filas = [
      { id: "c1", nombre: "Diego", descripcion: "PDC", indice: 0, creadoEn: new Date() },
      { id: "c2", nombre: "Ana", descripcion: "Libre", indice: 1, creadoEn: new Date() },
    ];
    (prisma.candidato.findMany as any).mockResolvedValue(filas);

    const res = await obtenerCandidatos();

    expect(res).toHaveLength(2);
    expect(res[0].nombre).toBe("Diego");
  });
});

// ─── agregarVotanteElegible ───────────────────────────────────────────────────

describe("adminService.agregarVotanteElegible", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crea votante y limpia credencialEmitida previa", async () => {
    (prisma.votanteElegible.findUnique as any).mockResolvedValue(null);
    (prisma.credencialEmitida.deleteMany as any).mockResolvedValue({});
    (prisma.votanteElegible.create as any).mockResolvedValue({ id: "v1", numeroPadron: "LP123456" });

    await agregarVotanteElegible("LP123456", "Juan Pérez", "12345678L");

    expect(prisma.credencialEmitida.deleteMany).toHaveBeenCalledWith({ where: { numeroPadron: "LP123456" } });
    expect(prisma.votanteElegible.create).toHaveBeenCalledTimes(1);
  });

  it("lanza error si el padrón ya está registrado", async () => {
    (prisma.votanteElegible.findUnique as any).mockResolvedValue({ id: "v1", numeroPadron: "LP123456" });

    await expect(agregarVotanteElegible("LP123456")).rejects.toThrow("ya está registrado");
    expect(prisma.votanteElegible.create).not.toHaveBeenCalled();
  });
});

// ─── obtenerVotantesElegibles ─────────────────────────────────────────────────

describe("adminService.obtenerVotantesElegibles", () => {
  it("retorna la lista de votantes sin datos sensibles", async () => {
    (prisma.votanteElegible.findMany as any).mockResolvedValue([
      { id: "v1", numeroPadron: "LP123456", nombre: "Juan", registradoEn: new Date() },
    ]);

    const res = await obtenerVotantesElegibles();

    expect(res).toHaveLength(1);
    expect(res[0].numeroPadron).toBe("LP123456");
  });
});

// ─── obtenerLogsAuditoria ─────────────────────────────────────────────────────

describe("adminService.obtenerLogsAuditoria", () => {
  it("retorna logs ordenados por timestamp descendente", async () => {
    const logs = [
      { id: "l1", accion: "ADMIN_LOGIN", actor: "admin:admin-1", detalle: null, timestamp: new Date() },
    ];
    (prisma.logAuditoria.findMany as any).mockResolvedValue(logs);

    const res = await obtenerLogsAuditoria(10);

    expect(res).toHaveLength(1);
    expect(res[0].accion).toBe("ADMIN_LOGIN");
    expect(prisma.logAuditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { timestamp: "desc" }, take: 10 }),
    );
  });
});

// ─── abrirJornada / cerrarJornada ─────────────────────────────────────────────

describe("adminService.abrirJornada", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lanza error si la jornada ya está abierta", async () => {
    (BlockchainService.eleccionAbierta as any).mockResolvedValue(true);

    await expect(abrirJornada("admin-1")).rejects.toThrow("ya está abierta");
  });

  it("abre jornada y actualiza BD cuando estaba cerrada", async () => {
    (BlockchainService.eleccionAbierta as any).mockResolvedValue(false);
    (BlockchainService.abrirEleccion as any).mockResolvedValue(undefined);
    (prisma.configuracionEleccion.updateMany as any).mockResolvedValue({});
    (prisma.logAuditoria.create as any).mockResolvedValue({});

    await abrirJornada("admin-1");

    expect(BlockchainService.abrirEleccion).toHaveBeenCalledTimes(1);
    expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ accion: "ABRIR_JORNADA" }) }),
    );
  });
});

describe("adminService.cerrarJornada", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lanza error si la jornada ya está cerrada", async () => {
    (BlockchainService.eleccionAbierta as any).mockResolvedValue(false);

    await expect(cerrarJornada("admin-1")).rejects.toThrow("ya está cerrada");
  });
});
