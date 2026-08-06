-- CreateTable
CREATE TABLE "demand_forecast_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'MOVING_AVERAGE',
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "warehouse_id" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "demand_forecast_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecast_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "historical_avg_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "forecasted_quantity" DECIMAL(15,3) NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demand_forecast_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_suggestions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "reorder_point" DECIMAL(15,3) NOT NULL,
    "suggested_quantity" DECIMAL(15,3) NOT NULL,
    "current_stock_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "basis" TEXT NOT NULL DEFAULT 'FORECAST',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demand_forecast_runs_tenant_id_idx" ON "demand_forecast_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "demand_forecast_runs_tenant_id_status_idx" ON "demand_forecast_runs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "demand_forecast_runs_tenant_id_warehouse_id_idx" ON "demand_forecast_runs"("tenant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "demand_forecast_lines_tenant_id_idx" ON "demand_forecast_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "demand_forecast_lines_run_id_idx" ON "demand_forecast_lines"("run_id");

-- CreateIndex
CREATE INDEX "demand_forecast_lines_tenant_id_product_id_warehouse_id_idx" ON "demand_forecast_lines"("tenant_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "reorder_suggestions_tenant_id_idx" ON "reorder_suggestions"("tenant_id");

-- CreateIndex
CREATE INDEX "reorder_suggestions_tenant_id_status_idx" ON "reorder_suggestions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "reorder_suggestions_run_id_idx" ON "reorder_suggestions"("run_id");

-- CreateIndex
CREATE INDEX "reorder_suggestions_tenant_id_product_id_warehouse_id_idx" ON "reorder_suggestions"("tenant_id", "product_id", "warehouse_id");

-- AddForeignKey
ALTER TABLE "demand_forecast_runs" ADD CONSTRAINT "demand_forecast_runs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_runs" ADD CONSTRAINT "demand_forecast_runs_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_lines" ADD CONSTRAINT "demand_forecast_lines_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "demand_forecast_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_lines" ADD CONSTRAINT "demand_forecast_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecast_lines" ADD CONSTRAINT "demand_forecast_lines_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "demand_forecast_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_suggestions" ADD CONSTRAINT "reorder_suggestions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
