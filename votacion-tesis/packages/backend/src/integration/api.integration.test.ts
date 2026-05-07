import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import app from "../index";
import { VotanteService } from "../services/votanteService";
import { VotoService } from "../services/votoService";
import * as AdminService from "../services/adminService";

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

// ─── Admin — autenticación ────────────────────────────────────────────────────

describe("API admin — autenticación y middleware", () => {
  const JWT_SECRET = "clave-secreta-test";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_ADMIN_SECRET = JWT_SECRET;
  });

  function tokenValido(payload = { adminId: "admin-1", email: "admin@test.com" }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  }

  it("PA-01: POST /api/admin/login retorna 200 con token cuando credenciales son válidas", async () => {
    vi.spyOn(AdminService, "loginAdmin").mockResolvedValue({
      token: "jwt-token-fake",
      expiresIn: 7200,
      nombre: "Admin Test",
      email: "admin@test.com",
    });

    const res = await request(app).post("/api/admin/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("jwt-token-fake");
    expect(res.body.email).toBe("admin@test.com");
  });

  it("PA-02: POST /api/admin/login retorna 401 con credenciales inválidas", async () => {
    vi.spyOn(AdminService, "loginAdmin").mockRejectedValue(new Error("Credenciales inválidas"));

    const res = await request(app).post("/api/admin/login").send({
      email: "admin@test.com",
      password: "wrong",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No autorizado");
  });

  it("PA-03: POST /api/admin/login retorna 400 si faltan campos", async () => {
    const res = await request(app).post("/api/admin/login").send({ email: "no-es-email" });

    expect(res.status).toBe(400);
  });

  it("PA-04: rutas protegidas retornan 401 sin Authorization header", async () => {
    const res = await request(app).get("/api/admin/estado");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token de administrador requerido");
  });

  it("PA-05: rutas protegidas retornan 401 con token inválido", async () => {
    const res = await request(app)
      .get("/api/admin/estado")
      .set("Authorization", "Bearer token-basura");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token inválido o expirado");
  });

  it("PA-06: GET /api/admin/estado retorna 200 con token válido", async () => {
    vi.spyOn(AdminService, "obtenerEstadoAdmin").mockResolvedValue({
      eleccionAbierta: true,
      conteoHabilitado: false,
      resultadosPublicados: false,
      totalBoletas: 3,
      estadoDB: "ABIERTA",
      nombreEleccion: "Elección Test",
    });

    const res = await request(app)
      .get("/api/admin/estado")
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.eleccionAbierta).toBe(true);
  });
});

// ─── Admin — candidatos ───────────────────────────────────────────────────────

describe("API admin — candidatos", () => {
  const JWT_SECRET = "clave-secreta-test";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_ADMIN_SECRET = JWT_SECRET;
  });

  function tokenValido() {
    return jwt.sign({ adminId: "admin-1", email: "admin@test.com" }, JWT_SECRET, { expiresIn: "1h" });
  }

  it("PA-07: GET /api/admin/candidatos retorna lista", async () => {
    vi.spyOn(AdminService, "obtenerCandidatos").mockResolvedValue([
      { id: "c1", nombre: "Diego", descripcion: "PDC", indice: 0, creadoEn: new Date() },
    ] as any);

    const res = await request(app)
      .get("/api/admin/candidatos")
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.candidatos).toHaveLength(1);
    expect(res.body.candidatos[0].nombre).toBe("Diego");
  });

  it("PA-08: POST /api/admin/candidatos agrega candidato", async () => {
    vi.spyOn(AdminService, "agregarCandidato").mockResolvedValue({
      id: "c2", nombre: "Ana", descripcion: "Libre", indice: 1, creadoEn: new Date(),
    } as any);

    const res = await request(app)
      .post("/api/admin/candidatos")
      .set("Authorization", `Bearer ${tokenValido()}`)
      .send({ nombre: "Ana", descripcion: "Libre" });

    expect(res.status).toBe(201);
    expect(res.body.candidato.nombre).toBe("Ana");
  });

  it("PA-09: POST /api/admin/candidatos retorna 400 si falta nombre", async () => {
    const res = await request(app)
      .post("/api/admin/candidatos")
      .set("Authorization", `Bearer ${tokenValido()}`)
      .send({ descripcion: "Solo descripcion" });

    expect(res.status).toBe(400);
  });
});

// ─── Admin — padrón ───────────────────────────────────────────────────────────

describe("API admin — padrón de votantes", () => {
  const JWT_SECRET = "clave-secreta-test";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.JWT_ADMIN_SECRET = JWT_SECRET;
  });

  function tokenValido() {
    return jwt.sign({ adminId: "admin-1", email: "admin@test.com" }, JWT_SECRET, { expiresIn: "1h" });
  }

  it("PA-10: GET /api/admin/padron retorna lista de votantes", async () => {
    vi.spyOn(AdminService, "obtenerVotantesElegibles").mockResolvedValue([
      { id: "v1", numeroPadron: "LP123456", nombre: "Juan", registradoEn: new Date() },
    ] as any);

    const res = await request(app)
      .get("/api/admin/padron")
      .set("Authorization", `Bearer ${tokenValido()}`);

    expect(res.status).toBe(200);
    expect(res.body.votantes).toHaveLength(1);
    expect(res.body.votantes[0].numeroPadron).toBe("LP123456");
  });

  it("PA-11: POST /api/admin/padron agrega votante elegible", async () => {
    vi.spyOn(AdminService, "agregarVotanteElegible").mockResolvedValue({
      id: "v2", numeroPadron: "CB789012", nombre: "María", registradoEn: new Date(),
    } as any);

    const res = await request(app)
      .post("/api/admin/padron")
      .set("Authorization", `Bearer ${tokenValido()}`)
      .send({ numeroPadron: "CB789012", nombre: "María" });

    expect(res.status).toBe(201);
    expect(res.body.votante.numeroPadron).toBe("CB789012");
  });

  it("PA-12: POST /api/admin/padron retorna 400 si padrón ya existe", async () => {
    vi.spyOn(AdminService, "agregarVotanteElegible").mockRejectedValue(
      new Error("El padrón CB789012 ya está registrado"),
    );

    const res = await request(app)
      .post("/api/admin/padron")
      .set("Authorization", `Bearer ${tokenValido()}`)
      .send({ numeroPadron: "CB789012" });

    expect(res.status).toBe(400);
    expect(res.body.mensaje).toContain("ya está registrado");
  });
});
