/*
  Warnings:

  - You are about to drop the column `loteId` on the `Modem` table. All the data in the column will be lost.
  - You are about to drop the column `loteId` on the `Registro` table. All the data in the column will be lost.
  - You are about to drop the `Lote` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `loteSkuId` to the `Modem` table without a default value. This is not possible if the table is not empty.
  - Made the column `skuId` on table `Modem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `loteSkuId` to the `Registro` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Lote" DROP CONSTRAINT "Lote_responsableId_fkey";

-- DropForeignKey
ALTER TABLE "Lote" DROP CONSTRAINT "Lote_skuId_fkey";

-- DropForeignKey
ALTER TABLE "Modem" DROP CONSTRAINT "Modem_loteId_fkey";

-- DropForeignKey
ALTER TABLE "Modem" DROP CONSTRAINT "Modem_skuId_fkey";

-- DropForeignKey
ALTER TABLE "Registro" DROP CONSTRAINT "Registro_loteId_fkey";

-- DropIndex
DROP INDEX "Registro_loteId_idx";

-- AlterTable
ALTER TABLE "Modem" DROP COLUMN "loteId",
ADD COLUMN     "loteEmpaqueId" INTEGER,
ADD COLUMN     "loteSkuId" INTEGER NOT NULL,
ALTER COLUMN "skuId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Registro" DROP COLUMN "loteId",
ADD COLUMN     "loteSkuId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Lote";

-- CreateTable
CREATE TABLE "Carga" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,

    CONSTRAINT "Carga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoteSku" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "cargaId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "registroAbierto" BOOLEAN NOT NULL DEFAULT true,
    "responsableId" INTEGER NOT NULL,
    "estado" "EstadoLote" NOT NULL DEFAULT 'EN_PROCESO',
    "prioridad" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LoteSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoteEmpaque" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "skuId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoteEmpaque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoteSku_numero_key" ON "LoteSku"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "LoteEmpaque_numero_key" ON "LoteEmpaque"("numero");

-- CreateIndex
CREATE INDEX "Registro_loteSkuId_idx" ON "Registro"("loteSkuId");

-- AddForeignKey
ALTER TABLE "Modem" ADD CONSTRAINT "Modem_loteSkuId_fkey" FOREIGN KEY ("loteSkuId") REFERENCES "LoteSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modem" ADD CONSTRAINT "Modem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "CatalogoSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modem" ADD CONSTRAINT "Modem_loteEmpaqueId_fkey" FOREIGN KEY ("loteEmpaqueId") REFERENCES "LoteEmpaque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_loteSkuId_fkey" FOREIGN KEY ("loteSkuId") REFERENCES "LoteSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteSku" ADD CONSTRAINT "LoteSku_cargaId_fkey" FOREIGN KEY ("cargaId") REFERENCES "Carga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteSku" ADD CONSTRAINT "LoteSku_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "CatalogoSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteSku" ADD CONSTRAINT "LoteSku_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteEmpaque" ADD CONSTRAINT "LoteEmpaque_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "CatalogoSKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
