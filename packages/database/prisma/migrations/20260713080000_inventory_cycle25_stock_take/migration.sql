-- Cycle 25: Physical Inventory / Stock Take

CREATE TYPE "StockTakeStatus" AS ENUM ('DRAFT','IN_PROGRESS','COUNTING','VARIANCE_REVIEW','APPROVED','POSTED','CANCELLED');
CREATE TYPE "CountSheetStatus" AS ENUM ('PENDING','COUNTING','RECOUNTED','APPROVED','REJECTED');
CREATE TYPE "StockTakeVarianceStatus" AS ENUM ('PENDING','APPROVED','REJECTED');

CREATE TABLE "stock_takes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "stock_take_number" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "status" "StockTakeStatus" NOT NULL DEFAULT 'DRAFT',
  "count_type" TEXT NOT NULL DEFAULT 'FULL',
  "count_date" TIMESTAMP(3) NOT NULL,
  "frozen_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "posted_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "posted_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_takes_tenant_number_key" UNIQUE("tenant_id","stock_take_number")
);
CREATE INDEX "stock_takes_tenant_id_idx" ON "stock_takes"("tenant_id");
CREATE INDEX "stock_takes_warehouse_id_idx" ON "stock_takes"("warehouse_id");
CREATE INDEX "stock_takes_status_idx" ON "stock_takes"("status");

CREATE TABLE "count_sheets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "stock_take_id" TEXT NOT NULL,
  "sheet_number" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "zone" TEXT,
  "assigned_to" TEXT,
  "status" "CountSheetStatus" NOT NULL DEFAULT 'PENDING',
  "counted_at" TIMESTAMP(3),
  "recounted_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "count_sheets_tenant_stock_take_sheet_key" UNIQUE("tenant_id","stock_take_id","sheet_number"),
  CONSTRAINT "count_sheets_stock_take_fk" FOREIGN KEY("stock_take_id") REFERENCES "stock_takes"("id") ON DELETE CASCADE
);
CREATE INDEX "count_sheets_tenant_id_idx" ON "count_sheets"("tenant_id");
CREATE INDEX "count_sheets_stock_take_id_idx" ON "count_sheets"("stock_take_id");

CREATE TABLE "count_sheet_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "sheet_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "bin_location_id" TEXT,
  "lot_number" TEXT,
  "uom" TEXT NOT NULL DEFAULT 'UNIT',
  "system_qty" DECIMAL(15,4) NOT NULL,
  "counted_qty" DECIMAL(15,4),
  "recounted_qty" DECIMAL(15,4),
  "variance_qty" DECIMAL(15,4),
  "variance_pct" DECIMAL(8,4),
  "unit_cost" DECIMAL(15,4),
  "variance_value" DECIMAL(15,4),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "count_sheet_items_sheet_fk" FOREIGN KEY("sheet_id") REFERENCES "count_sheets"("id") ON DELETE CASCADE
);
CREATE INDEX "count_sheet_items_tenant_id_idx" ON "count_sheet_items"("tenant_id");
CREATE INDEX "count_sheet_items_sheet_id_idx" ON "count_sheet_items"("sheet_id");

CREATE TABLE "stock_take_variances" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "stock_take_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "bin_location_id" TEXT,
  "system_qty" DECIMAL(15,4) NOT NULL,
  "counted_qty" DECIMAL(15,4) NOT NULL,
  "variance_qty" DECIMAL(15,4) NOT NULL,
  "variance_pct" DECIMAL(8,4) NOT NULL,
  "unit_cost" DECIMAL(15,4),
  "variance_value" DECIMAL(15,4),
  "status" "StockTakeVarianceStatus" NOT NULL DEFAULT 'PENDING',
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_reason" TEXT,
  "posted_ledger_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_take_variances_stock_take_fk" FOREIGN KEY("stock_take_id") REFERENCES "stock_takes"("id") ON DELETE CASCADE
);
CREATE INDEX "stock_take_variances_tenant_id_idx" ON "stock_take_variances"("tenant_id");
CREATE INDEX "stock_take_variances_stock_take_id_idx" ON "stock_take_variances"("stock_take_id");
CREATE INDEX "stock_take_variances_status_idx" ON "stock_take_variances"("status");
