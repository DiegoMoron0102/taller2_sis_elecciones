import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma antes de importar el servicio
vi.mock("../lib/prisma", () => ({
  prisma: {
    sesionVotante: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    credencialEmitida: {
      upsert: vi.fn(),
    },
    logAuditoria: {
      create: vi.fn(),
    },
  },
}));

import { VotanteService } from "./votanteService";
import { prisma } from "../lib/prisma";

describe("VotanteService.verificarFormatoCredencial", () => {
  it("acepta una credencial con formato válido", () => {
    const res = VotanteService.verificarFormatoCredencial({
      numeroPadron: "LP123456",
      nombre: "Juan Perez",
      ci: "12345678L",
    });

    expect(res.valida).toBe(true);
    expect(res.motivo).toBeUndefined();
  });

  it("rechaza padrón inválido", () => {
    const res = VotanteService.verificarFormatoCredencial({
      numeroPadron: "L123456",
      nombre: "Juan Perez",
      ci: "12345678L",
    });

    expect(res.valida).toBe(false);
    expect(res.motivo).toContain("padrón");
  });

  it("rechaza CI inválido", () => {
    const res = VotanteService.verificarFormatoCredencial({
      numeroPadron: "LP123456",
      nombre: "Juan Perez",
      ci: "CI-XYZ",
    });

    expect(res.valida).toBe(false);
    expect(res.motivo).toContain("CI");
  });

  it("rechaza nombre corto", () => {
    const res = VotanteService.verificarFormatoCredencial({
      numeroPadron: "LP123456",
      nombre: "Ana",
      ci: "12345678",
    });

    expect(res.valida).toBe(false);
    expect(res.motivo).toContain("Nombre");
  });

  it("rechaza si faltan campos obligatorios", () => {
    const res = VotanteService.verificarFormatoCredencial({
      numeroPadron: "",
      nombre: "Juan Perez",
      ci: "12345678L",
    });

    expect(res.valida).toBe(false);
    expect(res.motivo).toContain("obligatorios");
  });
});

describe("VotanteService.emitirTokenAnonimo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.sesionVotante.create as any).mockResolvedValue({ id: "sess-001" });
    (prisma.credencialEmitida.upsert as any).mockResolvedValue({});
    (prisma.logAuditoria.create as any).mockResolvedValue({});
  });

  it("emite token de 64 chars hex con sessionId y expiresIn=3600", async () => {
    const res = await VotanteService.emitirTokenAnonimo({
      numeroPadron: "LP123456",
      nombre: "Juan Perez",
      ci: "12345678L",
    });

    expect(res.token).toMatch(/^[a-f0-9]{64}$/);
    expect(res.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(res.sessionId).toBe("sess-001");
    expect(res.expiresIn).toBe(3600);
  });

  it("persiste sesion, credencial y log de auditoría", async () => {
    await VotanteService.emitirTokenAnonimo({
      numeroPadron: "LP999999",
      nombre: "Maria Lopez",
      ci: "87654321A",
    });

    expect(prisma.sesionVotante.create).toHaveBeenCalledTimes(1);
    expect(prisma.credencialEmitida.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.logAuditoria.create).toHaveBeenCalledTimes(1);
    expect((prisma.logAuditoria.create as any).mock.calls[0][0].data.accion).toBe("TOKEN_EMITIDO");
  });

  it("lanza error si la credencial es inválida (no toca la BD)", async () => {
    await expect(
      VotanteService.emitirTokenAnonimo({
        numeroPadron: "BAD",
        nombre: "x",
        ci: "z",
      }),
    ).rejects.toThrow();

    expect(prisma.sesionVotante.create).not.toHaveBeenCalled();
  });
});

describe("VotanteService.validarToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza token vacío o corto (<32 chars)", async () => {
    const r1 = await VotanteService.validarToken("");
    const r2 = await VotanteService.validarToken("abc");

    expect(r1.valido).toBe(false);
    expect(r2.valido).toBe(false);
  });

  it("rechaza token no registrado en BD", async () => {
    (prisma.sesionVotante.findUnique as any).mockResolvedValue(null);

    const r = await VotanteService.validarToken("a".repeat(64));

    expect(r.valido).toBe(false);
    expect(r.motivo).toContain("no registrado");
  });

  it("rechaza token ya utilizado y devuelve sessionId", async () => {
    (prisma.sesionVotante.findUnique as any).mockResolvedValue({
      id: "s-1",
      usado: true,
    });

    const r = await VotanteService.validarToken("b".repeat(64));

    expect(r.valido).toBe(false);
    expect(r.motivo).toContain("ya utilizado");
    expect(r.sessionId).toBe("s-1");
  });

  it("acepta token registrado y no usado", async () => {
    (prisma.sesionVotante.findUnique as any).mockResolvedValue({
      id: "s-2",
      usado: false,
    });

    const r = await VotanteService.validarToken("c".repeat(64));

    expect(r.valido).toBe(true);
    expect(r.sessionId).toBe("s-2");
    expect(r.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("VotanteService.marcarTokenUsado", () => {
  it("invoca prisma.sesionVotante.update con usado=true", async () => {
    (prisma.sesionVotante.update as any).mockResolvedValue({});

    await VotanteService.marcarTokenUsado("hash-fake");

    expect(prisma.sesionVotante.update).toHaveBeenCalledWith({
      where: { tokenHash: "hash-fake" },
      data: expect.objectContaining({ usado: true }),
    });
  });
});
