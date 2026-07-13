-- CreateEnum
CREATE TYPE "AbcClass" AS ENUM ('A', 'B', 'C');
CREATE TYPE "XyzClass" AS ENUM ('X', 'Y', 'Z');
CREATE TYPE "VelocityClassificationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED');

-- CreateTable: velocity_classification_runs
CREATE TABLE "velocity_classification_runs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "run_number" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "status" "VelocityClassificationStatus" NOT NULL DEFAULT 'DRAFT',
  "total_products" INTEGER NOT NULL DEFAULT 0,
  "class_a_count" INTEGER NOT NULL DEFAULT 0,
  "class_b_count" INTEGER NOT NULL DEFAULT 0,
  "class_c_count" INTEGER NOT NULL DEFAULT 0,
  "class_x_count" INTEGER NOT NULL DEFAULT 0,
  "class_y_count" INTEGER NOT NULL DEFAULT 0,
  "class_z_count" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "run_by_user_id" TEXT NOT NULL,
  "activated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "velocity_classification_runs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "velocity_classification_runs_tenant_id_run_number_key" ON "velocity_classification_runs"("tenant_id", "run_number");
CREATE INDEX "velocity_classification_runs_tenant_id_idx" ON "velocity_classification_runs"("tenant_id");
CREATE INDEX "velocity_classification_runs_tenant_id_status_idx" ON "velocity_classification_runs"("tenant_id", "status");

-- CreateTable: velocity_classification_items
CREATE TABLE "velocity_classification_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "total_revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "total_quantity_sold" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "revenue_share" DECIMAL(8,6) NOT NULL DEFAULT 0,
  "cumulative_share" DECIMAL(8,6) NOT NULL DEFAULT 0,
  "demand_cv" DECIMAL(8,4),
  "avg_monthly_demand" DECIMAL(18,4),
  "std_dev_demand" DECIMAL(18,4),
  "abc_class" "AbcClass" NOT NULL,
  "xyz_class" "XyzClass" NOT NULL,
  "combined_class" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "velocity_classification_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "velocity_classification_items_run_id_product_id_warehouse_id_key" ON "velocity_classification_items"("run_id", "product_id", "warehouse_id");
CREATE INDEX "velocity_classification_items_tenant_id_idx" ON "velocity_classification_items"("tenant_id");
CREATE INDEX "velocity_classification_items_tenant_id_run_id_idx" ON "velocity_classification_items"("tenant_id", "run_id");
CREATE INDEX "velocity_classification_items_tenant_id_product_id_idx" ON "velocity_classification_items"("tenant_id", "product_id");
CREATE INDEX "velocity_classification_items_tenant_id_abc_class_idx" ON "velocity_classification_items"("tenant_id", "abc_class");
CREATE INDEX "velocity_classification_items_tenant_id_combined_class_idx" ON "velocity_classification_items"("tenant_id", "combined_class");
ALTER TABLE "velocity_classification_items" ADD CONSTRAINT "velocity_classification_items_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "velocity_classification_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: velocity_slotting_policies
CREATE TABLE "velocity_slotting_policies" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "combined_class" TEXT NOT NULL,
  "description" TEXT,
  "review_frequency" TEXT NOT NULL,
  "reorder_method" TEXT NOT NULL,
  "safety_stock_multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
  "preferred_zone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "velocity_slotting_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "velocity_slotting_policies_tenant_id_combined_class_key" ON "velocity_slotting_policies"("tenant_id", "combined_class");
CREATE INDEX "velocity_slotting_policies_tenant_id_idx" ON "velocity_slotting_policies"("tenant_id");

-- CreateTable: product_velocity_snapshots
CREATE TABLE "product_velocity_snapshots" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "snapshot_month" TIMESTAMP(3) NOT NULL,
  "quantity_sold" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "transaction_count" INTEGER NOT NULL DEFAULT 0,
  "avg_selling_price" DECIMAL(18,4),
  "abc_class" "AbcClass",
  "xyz_class" "XyzClass",
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_velocity_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_velocity_snapshots_tenant_product_warehouse_month_key" ON "product_velocity_snapshots"("tenant_id", "product_id", "warehouse_id", "snapshot_month");
CREATE INDEX "product_velocity_snapshots_tenant_id_idx" ON "product_velocity_snapshots"("tenant_id");
CREATE INDEX "product_velocity_snapshots_tenant_id_product_id_idx" ON "product_velocity_snapshots"("tenant_id", "product_id");
CREATE INDEX "product_velocity_snapshots_tenant_id_snapshot_month_idx" ON "product_velocity_snapshots"("tenant_id", "snapshot_month");
