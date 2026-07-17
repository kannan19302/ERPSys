-- CreateEnum
CREATE TYPE "AsnStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AsnDiscrepancyType" AS ENUM ('OVERAGE', 'SHORTAGE', 'WRONG_ITEM', 'DAMAGED');

-- CreateTable
CREATE TABLE "asn_discrepancies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "asnId" TEXT NOT NULL,
    "lineItemId" TEXT,
    "discrepancyType" "AsnDiscrepancyType" NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedQty" DECIMAL(15,4) NOT NULL,
    "actualQty" DECIMAL(15,4) NOT NULL,
    "notes" TEXT,
    "reportedBy" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "asn_discrepancies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asn_discrepancies_tenantId_idx" ON "asn_discrepancies"("tenantId");
CREATE INDEX "asn_discrepancies_tenantId_asnId_idx" ON "asn_discrepancies"("tenantId", "asnId");
CREATE INDEX "asn_discrepancies_tenantId_discrepancyType_idx" ON "asn_discrepancies"("tenantId", "discrepancyType");
