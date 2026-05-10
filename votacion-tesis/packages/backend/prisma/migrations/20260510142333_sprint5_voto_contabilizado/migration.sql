-- CreateTable
CREATE TABLE "VotoContabilizado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidatoIndice" INTEGER NOT NULL,
    "emitidoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VotoContabilizado_candidatoIndice_idx" ON "VotoContabilizado"("candidatoIndice");
