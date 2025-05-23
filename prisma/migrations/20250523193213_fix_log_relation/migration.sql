/*
  Warnings:

  - Changed the type of `estado` on the `Registro` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('SN', 'SCRAP_COSMETICO', 'SCRAP_ELECTRONICO', 'SCRAP_INFESTACION', 'REPARACION');

-- AlterTable
ALTER TABLE "Registro" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoRegistro" NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "detalle" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Registro_usuarioId_idx" ON "Registro"("usuarioId");

-- CreateIndex
CREATE INDEX "Registro_loteId_idx" ON "Registro"("loteId");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
