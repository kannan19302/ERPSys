-- CreateEnum
CREATE TYPE "CostingMethod" AS ENUM ('FIFO', 'LIFO', 'WAC', 'STANDARD', 'SPECIFIC');
CREATE TYPE "CostLayerStatus" AS ENUM ('OPEN', 'PARTIALLY_CONSUMED', 'FULLY_CONSUMED');
CREATE TYPE "CostAdjustmentType" AS ENUM ('PURCHASE_PRICE_VARIANCE', 'FREIGHT_ABSORPTION', 'OVERHEAD_ABSORPTION', 'WRITE_DOWN', 'MANUAL');

-- CreateTable: inventory_cost_profiles
CREATE TABLE "inventory_cost_profiles" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "method" "CostingMethod" NOT NULL DEFAULT 'WAC',
  "standard_cost" DECIMAL(18,4),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "active_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_cost_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_cost_profiles_tenant_id_product_id_warehouse_id_key" ON "inventory_cost_profiles"("tenant_id", "product_id", "warehouse_id");
CREATE INDEX "inventory_cost_profiles_tenant_id_idx" ON "inventory_cost_profiles"("tenant_id");
CREATE INDEX "inventory_cost_profiles_tenant_id_product_id_idx" ON "inventory_cost_profiles"("tenant_id", "product_id");

-- CreateTable: inventory_cost_layers
CREATE TABLE "inventory_cost_layers" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "receipt_date" TIMESTAMP(3) NOT NULL,
  "receipt_ref" TEXT,
  "unit_cost" DECIMAL(18,4) NOT NULL,
  "qty_received" DECIMAL(18,4) NOT NULL,
  "qty_remaining" DECIMAL(18,4) NOT NULL,
  "status" "CostLayerStatus" NOT NULL DEFAULT 'OPEN',
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "inventory_cost_layers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inventory_cost_layers_tenant_id_idx" ON "inventory_cost_layers"("tenant_id");
CREATE INDEX "inventory_cost_layers_tenant_id_profile_id_idx" ON "inventory_cost_layers"("tenant_id", "profile_id");
CREATE INDEX "inventory_cost_layers_tenant_id_profile_id_status_idx" ON "inventory_cost_layers"("tenant_id", "profile_id", "status");
ALTER TABLE "inventory_cost_layers" ADD CONSTRAINT "inventory_cost_layers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "inventory_cost_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: inventory_cost_adjustments
CREATE TABLE "inventory_cost_adjustments" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "adjustment_number" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "adjustment_type" "CostAdjustmentType" NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "reason" TEXT NOT NULL,
  "adjusted_by_id" TEXT NOT NULL,
  "adjusted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_cost_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_cost_adjustments_tenant_id_adjustment_number_key" ON "inventory_cost_adjustments"("tenant_id", "adjustment_number");
CREATE INDEX "inventory_cost_adjustments_tenant_id_idx" ON "inventory_cost_adjustments"("tenant_id");
CREATE INDEX "inventory_cost_adjustments_tenant_id_profile_id_idx" ON "inventory_cost_adjustments"("tenant_id", "profile_id");
