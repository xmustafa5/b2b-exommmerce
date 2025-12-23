/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Category` table. All the data in the column will be lost.
  - Added the required column `companyId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'COMPANY_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'COMPANY_USER';

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "sortOrder",
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "zones" "Zone"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Company_nameEn_idx" ON "Company"("nameEn");

-- CreateIndex
CREATE INDEX "Company_nameAr_idx" ON "Company"("nameAr");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
