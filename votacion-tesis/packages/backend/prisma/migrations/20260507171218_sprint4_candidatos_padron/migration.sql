-- CreateTable
CREATE TABLE "VotanteElegible" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroPadron" TEXT NOT NULL,
    "nombre" TEXT,
    "ci" TEXT,
    "registradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Candidato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "indice" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "VotanteElegible_numeroPadron_key" ON "VotanteElegible"("numeroPadron");

-- CreateIndex
CREATE INDEX "VotanteElegible_numeroPadron_idx" ON "VotanteElegible"("numeroPadron");

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_indice_key" ON "Candidato"("indice");

-- CreateIndex
CREATE INDEX "Candidato_indice_idx" ON "Candidato"("indice");
