-- CreateTable
CREATE TABLE "stock_ledger_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "valuation_rate" DECIMAL(15,2) NOT NULL,
    "voucher_type" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "batch_number" TEXT,
    "serial_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'MATERIAL_TRANSFER',
    "posting_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "from_warehouse_id" TEXT,
    "to_warehouse_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_entry_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "stock_entry_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" DECIMAL(15,3) NOT NULL,
    "valuation_rate" DECIMAL(15,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "batch_number" TEXT,
    "serial_number" TEXT,

    CONSTRAINT "stock_entry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "inspection_number" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inspected_qty" DECIMAL(15,3) NOT NULL,
    "passed_qty" DECIMAL(15,3) NOT NULL,
    "rejected_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "inspected_by" TEXT NOT NULL,
    "inspected_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_ledger_entries_tenant_id_idx" ON "stock_ledger_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_ledger_entries_product_id_idx" ON "stock_ledger_entries"("product_id");

-- CreateIndex
CREATE INDEX "stock_ledger_entries_warehouse_id_idx" ON "stock_ledger_entries"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_entries_tenant_id_idx" ON "stock_entries"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_entries_tenant_id_org_id_entry_number_key" ON "stock_entries"("tenant_id", "org_id", "entry_number");

-- CreateIndex
CREATE INDEX "stock_entry_items_tenant_id_idx" ON "stock_entry_items"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_entry_items_stock_entry_id_idx" ON "stock_entry_items"("stock_entry_id");

-- CreateIndex
CREATE INDEX "quality_inspections_tenant_id_idx" ON "quality_inspections"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_tenant_id_org_id_inspection_number_key" ON "quality_inspections"("tenant_id", "org_id", "inspection_number");

-- AddForeignKey
ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger_entries" ADD CONSTRAINT "stock_ledger_entries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
