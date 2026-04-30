import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../index";
import { VotanteService } from "../services/votanteService";
import { VotoService } from "../services/votoService";

process.env.NODE_ENV = "test";

describe("API backend integración", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET /health responde estado ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("votacion-backend");
  });

  it("POST /api/auth/verificar-elegibilidad emite token cuando servicio responde", async () => {
    vi.spyOn(VotanteService, "emitirTokenAnonimo").mockResolvedValue({
      token: "a".repeat(64),
      tokenHash: "b".repeat(64),
      sessionId: "sesion-test",
      expiresIn: 3600,
    });

    const res = await request(app).post("/api/auth/verificar-elegibilidad").send({
      numeroPadron: "LP123456",
      nombre: "Juan Perez",
      ci: "12345678L",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toHaveLength(64);
    expect(res.body.sessionId).toBe("sesion-test");
  });

  it("POST /api/auth/verificar-elegibilidad devuelve 400 en error de negocio", async () => {
    vi.spyOn(VotanteService, "emitirTokenAnonimo").mockRejectedValue(new Error("Credencial inválida"));

    const res = await request(app).post("/api/auth/verificar-elegibilidad").send({
      numeroPadron: "BAD",
      nombre: "Ana",
      ci: "XX",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No se pudo verificar elegibilidad");
  });

  it("GET /ruta-inexistente devuelve 404", async () => {
    const res = await request(app).get("/inexistente");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Ruta no encontrada");
  });

  it("PI-05: GET /api/voto/comprobante sin txHash retorna 400", async () => {
    const res = await request(app).get("/api/voto/comprobante");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("txHash requerido");
  });

  it("PI-06: GET /api/voto/comprobante con formato inválido retorna 400", async () => {
    const res = await request(app).get("/api/voto/comprobante?txHash=no-es-un-hash-valido");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Formato de txHash inválido");
  });

  it("PI-07: GET /api/voto/comprobante con txHash no existente retorna 404", async () => {
    vi.spyOn(VotoService, "verificarComprobante").mockResolvedValue(null);

    const res = await request(app).get("/api/voto/comprobante?txHash=" + "0x" + "f".repeat(64));

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada/i);
  });

  it("PI-08: GET /api/voto/comprobante con txHash válido retorna datos de boleta", async () => {
    const txHash = "0x" + "a".repeat(64);
    vi.spyOn(VotoService, "verificarComprobante").mockResolvedValue({
      txHash,
      blockNumber: 10,
      boletaId: 2,
      nullifier: "0x" + "b".repeat(64),
      timestamp: 1700000000,
      estado: "registrado",
    });

    const res = await request(app).get(`/api/voto/comprobante?txHash=${txHash}`);

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("registrado");
    expect(res.body.boletaId).toBe(2);
    expect(res.body.blockNumber).toBe(10);
  });
});
