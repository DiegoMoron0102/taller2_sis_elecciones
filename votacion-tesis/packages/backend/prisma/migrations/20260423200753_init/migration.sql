-- CreateTable
CREATE TABLE "Administrador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ConfiguracionEleccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accion" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "detalle" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "administradorId" TEXT,
    CONSTRAINT "LogAuditoria_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Administrador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SesionVotante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usadoEn" DATETIME
);

-- CreateTable
CREATE TABLE "CredencialEmitida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credencialHash" TEXT NOT NULL,
    "numeroPadron" TEXT NOT NULL,
    "emitidaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");

-- CreateIndex
CREATE INDEX "LogAuditoria_accion_idx" ON "LogAuditoria"("accion");

-- CreateIndex
CREATE INDEX "LogAuditoria_timestamp_idx" ON "LogAuditoria"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SesionVotante_tokenHash_key" ON "SesionVotante"("tokenHash");

-- CreateIndex
CREATE INDEX "SesionVotante_usado_idx" ON "SesionVotante"("usado");

-- CreateIndex
CREATE UNIQUE INDEX "CredencialEmitida_credencialHash_key" ON "CredencialEmitida"("credencialHash");

-- CreateIndex
CREATE UNIQUE INDEX "CredencialEmitida_numeroPadron_key" ON "CredencialEmitida"("numeroPadron");

-- CreateIndex
CREATE INDEX "CredencialEmitida_emitidaEn_idx" ON "CredencialEmitida"("emitidaEn");
