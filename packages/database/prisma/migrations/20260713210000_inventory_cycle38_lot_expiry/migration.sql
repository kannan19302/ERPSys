-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('ACTIVE', 'QUARANTINE', 'EXPIRED', 'DISPOSED', 'RECALLED');
CREATE TYPE "ExpiryAlertLevel" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "DisposalMethod" AS ENUM ('DESTROY', 'RETURN_TO_VENDOR', 'DONATE', 'REWORK', 'OTHER');

-- CreateTable: lot_expiry_records
CREATE TABLE "lot_expiry_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "lot_number" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "manufacture_date" TIMESTAMP(3),
  "expiry_date" TIMESTAMP(3) NOT NULL,
  "qty" DECIMAL(18,4) NOT NULL,
  "remaining_qty" DECIMAL(18,4) NOT NULL,
  "status" "LotStatus" NOT NULL DEFAULT 'ACTIVE',
  "supplier_id" TEXT,
  "receipt_ref" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lot_expiry_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lot_expiry_records_tenant_id_lot_number_product_id_warehouse_key" ON "lot_expiry_records"("tenant_id", "lot_number", "product_id", "warehouse_id");
CREATE INDEX "lot_expiry_records_tenant_id_idx" ON "lot_expiry_records"("tenant_id");
CREATE INDEX "lot_expiry_records_tenant_id_product_id_idx" ON "lot_expiry_records"("tenant_id", "product_id");
CREATE INDEX "lot_expiry_records_tenant_id_expiry_date_idx" ON "lot_expiry_records"("tenant_id", "expiry_date");
CREATE INDEX "lot_expiry_records_tenant_id_status_idx" ON "lot_expiry_records"("tenant_id", "status");

-- CreateTable: lot_expiry_alerts
CREATE TABLE "lot_expiry_alerts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "lot_id" TEXT NOT NULL,
  "alert_level" "ExpiryAlertLevel" NOT NULL,
  "days_to_expiry" INTEGER NOT NULL,
  "alerted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dismissed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "lot_expiry_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lot_expiry_alerts_tenant_id_idx" ON "lot_expiry_alerts"("tenant_id");
CREATE INDEX "lot_expiry_alerts_tenant_id_lot_id_idx" ON "lot_expiry_alerts"("tenant_id", "lot_id");
CREATE INDEX "lot_expiry_alerts_tenant_id_dismissed_idx" ON "lot_expiry_alerts"("tenant_id", "dismissed");
ALTER TABLE "lot_expiry_alerts" ADD CONSTRAINT "lot_expiry_alerts_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lot_expiry_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: lot_disposal_records
CREATE TABLE "lot_disposal_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "disposal_number" TEXT NOT NULL,
  "lot_id" TEXT NOT NULL,
  "disposal_method" "DisposalMethod" NOT NULL,
  "qty_disposed" DECIMAL(18,4) NOT NULL,
  "disposed_by_id" TEXT NOT NULL,
  "disposed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lot_disposal_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lot_disposal_records_tenant_id_disposal_number_key" ON "lot_disposal_records"("tenant_id", "disposal_number");
CREATE INDEX "lot_disposal_records_tenant_id_idx" ON "lot_disposal_records"("tenant_id");
CREATE INDEX "lot_disposal_records_tenant_id_lot_id_idx" ON "lot_disposal_records"("tenant_id", "lot_id");
ALTER TABLE "lot_disposal_records" ADD CONSTRAINT "lot_disposal_records_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lot_expiry_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
