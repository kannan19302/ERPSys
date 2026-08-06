-- CreateEnum
CREATE TYPE "LandedCostStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ALLOCATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllocationMethod" AS ENUM ('QTY', 'VALUE', 'WEIGHT', 'VOLUME', 'EQUAL');

-- CreateEnum
CREATE TYPE "LandedChargeType" AS ENUM ('FREIGHT', 'DUTY', 'INSURANCE', 'BROKERAGE', 'OTHER');

-- CreateTable
CREATE TABLE "landed_cost_vouchers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "description" TEXT,
    "status" "LandedCostStatus" NOT NULL DEFAULT 'DRAFT',
    "allocationMethod" "AllocationMethod" NOT NULL DEFAULT 'VALUE',
    "totalAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "vendorId" TEXT,
    "invoiceRef" TEXT,
    "notes" TEXT,
    "allocatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landed_cost_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landed_cost_charge_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "chargeType" "LandedChargeType" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "accountCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landed_cost_charge_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landed_cost_receipt_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "stockEntryId" TEXT NOT NULL,
    "totalQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalWeight" DECIMAL(18,4),
    "totalVolume" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landed_cost_receipt_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landed_cost_allocations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "chargeType" "LandedChargeType" NOT NULL,
    "stockEntryId" TEXT NOT NULL,
    "stockEntryItemId" TEXT,
    "productId" TEXT NOT NULL,
    "allocationBasis" DECIMAL(18,4) NOT NULL,
    "allocationPct" DECIMAL(10,6) NOT NULL,
    "allocatedAmount" DECIMAL(18,4) NOT NULL,
    "addedToItemCost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landed_cost_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landed_cost_vouchers_tenantId_voucherNumber_key" ON "landed_cost_vouchers"("tenantId", "voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "landed_cost_receipt_links_voucherId_stockEntryId_key" ON "landed_cost_receipt_links"("voucherId", "stockEntryId");

-- AddForeignKey
ALTER TABLE "landed_cost_charge_lines" ADD CONSTRAINT "landed_cost_charge_lines_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_receipt_links" ADD CONSTRAINT "landed_cost_receipt_links_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_allocations" ADD CONSTRAINT "landed_cost_allocations_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "landed_cost_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
