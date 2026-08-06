-- CreateEnum
CREATE TYPE "ReplenishmentMethod" AS ENUM ('PURCHASE_ORDER', 'TRANSFER', 'PRODUCTION');
CREATE TYPE "ReplenSuggestionStatus" AS ENUM ('OPEN', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateTable: min_max_levels
CREATE TABLE "min_max_levels" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "min_qty" DECIMAL(18,4) NOT NULL,
  "max_qty" DECIMAL(18,4) NOT NULL,
  "reorder_qty" DECIMAL(18,4),
  "method" "ReplenishmentMethod" NOT NULL DEFAULT 'PURCHASE_ORDER',
  "preferred_vendor_id" TEXT,
  "lead_time_days" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "updated_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "min_max_levels_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "min_max_levels_tenant_id_product_id_warehouse_id_key" ON "min_max_levels"("tenant_id", "product_id", "warehouse_id");
CREATE INDEX "min_max_levels_tenant_id_idx" ON "min_max_levels"("tenant_id");
CREATE INDEX "min_max_levels_tenant_id_warehouse_id_idx" ON "min_max_levels"("tenant_id", "warehouse_id");
CREATE INDEX "min_max_levels_tenant_id_product_id_idx" ON "min_max_levels"("tenant_id", "product_id");

-- CreateTable: replen_suggestions
CREATE TABLE "replen_suggestions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "suggestion_number" TEXT NOT NULL,
  "level_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "current_stock" DECIMAL(18,4) NOT NULL,
  "suggested_qty" DECIMAL(18,4) NOT NULL,
  "method" "ReplenishmentMethod" NOT NULL,
  "vendor_id" TEXT,
  "source_warehouse_id" TEXT,
  "needed_by_date" TIMESTAMP(3),
  "status" "ReplenSuggestionStatus" NOT NULL DEFAULT 'OPEN',
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "ordered_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3),
  "cancelled_by_id" TEXT,
  "cancellation_reason" TEXT,
  "notes" TEXT,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "replen_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "replen_suggestions_tenant_id_suggestion_number_key" ON "replen_suggestions"("tenant_id", "suggestion_number");
CREATE INDEX "replen_suggestions_tenant_id_idx" ON "replen_suggestions"("tenant_id");
CREATE INDEX "replen_suggestions_tenant_id_status_idx" ON "replen_suggestions"("tenant_id", "status");
CREATE INDEX "replen_suggestions_tenant_id_product_id_idx" ON "replen_suggestions"("tenant_id", "product_id");
CREATE INDEX "replen_suggestions_tenant_id_warehouse_id_idx" ON "replen_suggestions"("tenant_id", "warehouse_id");
ALTER TABLE "replen_suggestions" ADD CONSTRAINT "replen_suggestions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "min_max_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: replen_run_logs
CREATE TABLE "replen_run_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "run_number" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "levels_scanned" INTEGER NOT NULL DEFAULT 0,
  "suggestions_created" INTEGER NOT NULL DEFAULT 0,
  "triggered_by_id" TEXT NOT NULL,
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "replen_run_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "replen_run_logs_tenant_id_run_number_key" ON "replen_run_logs"("tenant_id", "run_number");
CREATE INDEX "replen_run_logs_tenant_id_idx" ON "replen_run_logs"("tenant_id");
