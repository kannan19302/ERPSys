-- CreateTable
CREATE TABLE "batch_quarantine_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_quarantine_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "released_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_quarantine_logs_tenant_id_idx" ON "batch_quarantine_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "batch_quarantine_logs_batch_id_idx" ON "batch_quarantine_logs"("batch_id");

-- CreateIndex
CREATE INDEX "stock_reservations_tenant_id_idx" ON "stock_reservations"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_reservations_tenant_id_status_idx" ON "stock_reservations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "stock_reservations_product_id_idx" ON "stock_reservations"("product_id");

-- CreateIndex
CREATE INDEX "stock_reservations_warehouse_id_idx" ON "stock_reservations"("warehouse_id");

-- AddForeignKey
ALTER TABLE "batch_quarantine_logs" ADD CONSTRAINT "batch_quarantine_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
