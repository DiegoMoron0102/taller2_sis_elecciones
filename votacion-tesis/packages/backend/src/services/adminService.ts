import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { BlockchainService } from "./blockchainService";

// Deriva clave con scrypt y compara de forma segura para evitar timing attacks
async function verificarPassword(candidata: string, hashAlmacenado: string): Promise<boolean> {
  // Formato almacenado: "scrypt:salt:hash" (hex)
  const partes = hashAlmacenado.split(":");
  if (partes.length !== 3 || partes[0] !== "scrypt") return false;
  const [, saltHex, hashHex] = partes;
  const salt = Buffer.from(saltHex, "hex");
  const hashEsperado = Buffer.from(hashHex, "hex");
  const derivado = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(candidata, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
  return crypto.timingSafeEqual(derivado, hashEsperado);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.administrador.findUnique({ where: { email } });
  if (!admin) throw new Error("Credenciales inválidas");

  const valido = await verificarPassword(password, admin.passwordHash);
  if (!valido) throw new Error("Credenciales inválidas");

  const secret = process.env.JWT_ADMIN_SECRET;
  if (!secret) throw new Error("Configuración de seguridad incompleta");

  const token = jwt.sign({ adminId: admin.id, email: admin.email }, secret, { expiresIn: "2h" });

  await prisma.logAuditoria.create({
    data: {
      accion: "ADMIN_LOGIN",
      actor: `admin:${admin.id}`,
      detalle: `Login de ${admin.email}`,
      administradorId: admin.id,
    },
  });

  return { token, expiresIn: 7200, nombre: admin.nombre, email: admin.email };
}

export async function obtenerEstadoAdmin() {
  const [eleccionAbierta, conteoHabilitado, resultadosPublicados, totalBoletas] = await Promise.all([
    BlockchainService.eleccionAbierta(),
    BlockchainService.conteoHabilitado(),
    BlockchainService.resultadosPublicados(),
    BlockchainService.totalBoletas(),
  ]);

  const config = await prisma.configuracionEleccion.findFirst({ orderBy: { creadoEn: "desc" } });

  return {
    eleccionAbierta,
    conteoHabilitado,
    resultadosPublicados,
    totalBoletas,
    estadoDB: config?.estado ?? "PENDIENTE",
    nombreEleccion: config?.nombre ?? null,
  };
}

export async function abrirJornada(adminId: string) {
  const estado = await BlockchainService.eleccionAbierta();
  if (estado) throw new Error("La jornada ya está abierta");

  await BlockchainService.abrirEleccion();

  await prisma.configuracionEleccion.updateMany({
    where: { estado: { in: ["PENDIENTE", "CONFIGURADA"] } },
    data: { estado: "ABIERTA", fechaInicio: new Date() },
  });

  await prisma.logAuditoria.create({
    data: {
      accion: "ABRIR_JORNADA",
      actor: `admin:${adminId}`,
      detalle: "Jornada electoral abierta",
      administradorId: adminId,
    },
  });
}

export async function cerrarJornada(adminId: string) {
  const estado = await BlockchainService.eleccionAbierta();
  if (!estado) throw new Error("La jornada ya está cerrada");

  await BlockchainService.cerrarEleccion();

  await prisma.configuracionEleccion.updateMany({
    where: { estado: "ABIERTA" },
    data: { estado: "CERRADA", fechaFin: new Date() },
  });

  await prisma.logAuditoria.create({
    data: {
      accion: "CERRAR_JORNADA",
      actor: `admin:${adminId}`,
      detalle: "Jornada electoral cerrada",
      administradorId: adminId,
    },
  });
}

export async function habilitarEscrutinio(adminId: string) {
  const yaHabilitado = await BlockchainService.conteoHabilitado();
  if (yaHabilitado) throw new Error("El escrutinio ya está habilitado");

  const eleccionAbierta = await BlockchainService.eleccionAbierta();
  if (eleccionAbierta) throw new Error("Debe cerrar la jornada antes de habilitar el escrutinio");

  await BlockchainService.habilitarConteo();

  await prisma.configuracionEleccion.updateMany({
    where: { estado: "CERRADA" },
    data: { estado: "ESCRUTADA" },
  });

  await prisma.logAuditoria.create({
    data: {
      accion: "HABILITAR_ESCRUTINIO",
      actor: `admin:${adminId}`,
      detalle: "Escrutinio habilitado",
      administradorId: adminId,
    },
  });
}

export async function obtenerLogsAuditoria(limite = 50) {
  return prisma.logAuditoria.findMany({
    orderBy: { timestamp: "desc" },
    take: limite,
    select: {
      id: true,
      accion: true,
      actor: true,
      detalle: true,
      timestamp: true,
    },
  });
}

export async function obtenerCandidatos() {
  return prisma.candidato.findMany({
    orderBy: { indice: "asc" },
  });
}

export async function agregarCandidato(nombre: string, descripcion?: string) {
  const ultimoIndice = await prisma.candidato.findFirst({
    orderBy: { indice: "desc" },
    select: { indice: true },
  });
  const nuevoIndice = (ultimoIndice?.indice ?? -1) + 1;

  return prisma.candidato.create({
    data: { nombre, descripcion, indice: nuevoIndice },
  });
}

export async function eliminarCandidato(candidatoId: string) {
  return prisma.candidato.delete({
    where: { id: candidatoId },
  });
}

export async function obtenerVotantesElegibles() {
  return prisma.votanteElegible.findMany({
    orderBy: { registradoEn: "desc" },
    select: {
      id: true,
      numeroPadron: true,
      nombre: true,
      registradoEn: true,
    },
  });
}

export async function agregarVotanteElegible(numeroPadron: string, nombre?: string, ci?: string) {
  const existe = await prisma.votanteElegible.findUnique({
    where: { numeroPadron },
  });
  if (existe) throw new Error(`El padrón ${numeroPadron} ya está registrado`);

  // Limpiar credencial de sesiones anteriores para evitar bloqueo al re-inscribir
  await prisma.credencialEmitida.deleteMany({ where: { numeroPadron } });

  return prisma.votanteElegible.create({
    data: { numeroPadron, nombre, ci },
  });
}

export async function cargarPadronCSV(
  lineas: string[],
  adminId: string,
): Promise<{ exitosos: number; errores: Array<{ fila: number; error: string }> }> {
  const errores: Array<{ fila: number; error: string }> = [];
  let exitosos = 0;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea || linea.startsWith("#")) continue;

    try {
      const partes = linea.split(",").map(p => p.trim());
      const numeroPadron = partes[0];
      const nombre = partes[1];
      const ci = partes[2];

      if (!numeroPadron) {
        errores.push({ fila: i + 1, error: "Número de padrón vacío" });
        continue;
      }

      await agregarVotanteElegible(numeroPadron, nombre, ci);
      exitosos++;
    } catch (err) {
      errores.push({
        fila: i + 1,
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  if (exitosos > 0) {
    await prisma.logAuditoria.create({
      data: {
        accion: "CARGAR_PADRON",
        actor: `admin:${adminId}`,
        detalle: `${exitosos} votantes cargados, ${errores.length} errores`,
        administradorId: adminId,
      },
    });
  }

  return { exitosos, errores };
}
