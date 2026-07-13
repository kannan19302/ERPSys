-- CreateEnum
CREATE TYPE "ValuationMethod" AS ENUM ('FIFO', 'LIFO', 'WEIGHTED_AVG', 'STANDARD_COST', 'ACTUAL_COST');

-- CreateEnum
CREATE TYPE "ValuationStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'REVALUED');

-- CreateTable
CREATE TABLE "stock_valuation_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT,
    "warehouse_id" TEXT,
    "method" "ValuationMethod" NOT NULL,
    "standard_cost" DECIMAL(18,6),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_valuation_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_valuation_ledger" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "method" "ValuationMethod" NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "transaction_ref" TEXT NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "unit_cost" DECIMAL(18,6) NOT NULL,
    "total_cost" DECIMAL(18,4) NOT NULL,
    "running_qty" DECIMAL(18,4) NOT NULL,
    "running_value" DECIMAL(18,4) NOT NULL,
    "running_avg_cost" DECIMAL(18,6),
    "status" "ValuationStatus" NOT NULL DEFAULT 'ACTIVE',
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_valuation_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "adjustment_number" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "old_unit_cost" DECIMAL(18,6) NOT NULL,
    "new_unit_cost" DECIMAL(18,6) NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "impact_amount" DECIMAL(18,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "posted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_revaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "revaluation_number" TEXT NOT NULL,
    "description" TEXT,
    "revaluation_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_impact" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_revaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_revaluation_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "revaluation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "current_qty" DECIMAL(18,4) NOT NULL,
    "current_unit_cost" DECIMAL(18,6) NOT NULL,
    "new_unit_cost" DECIMAL(18,6) NOT NULL,
    "impact_amount" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_revaluation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_valuation_policies_tenant_id_product_id_warehouse_id_key" ON "stock_valuation_policies"("tenant_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_adjustments_tenant_id_adjustment_number_key" ON "cost_adjustments"("tenant_id", "adjustment_number");

-- CreateIndex
CREATE UNIQUE INDEX "stock_revaluations_tenant_id_revaluation_number_key" ON "stock_revaluations"("tenant_id", "revaluation_number");

-- AddForeignKey
ALTER TABLE "stock_revaluation_lines" ADD CONSTRAINT "stock_revaluation_lines_revaluation_id_fkey" FOREIGN KEY ("revaluation_id") REFERENCES "stock_revaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
