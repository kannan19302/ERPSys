-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "origin_stock_entry_id" TEXT;

-- AlterTable
ALTER TABLE "cycle_count_items" ADD COLUMN     "reason_code" TEXT;

-- AlterTable
ALTER TABLE "stock_entries" ADD COLUMN     "source_cycle_count_id" TEXT;

-- CreateTable
CREATE TABLE "cycle_count_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "zone" TEXT,
    "bin_scope" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "blind_count" BOOLEAN NOT NULL DEFAULT false,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_count_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_plates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "bin_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_plates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_plate_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "license_plate_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "lot_batch_id" TEXT,
    "serial_number_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_plate_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "putaway_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "stock_entry_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "suggested_bin_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "putaway_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cycle_count_schedules_tenant_id_idx" ON "cycle_count_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "cycle_count_schedules_warehouse_id_idx" ON "cycle_count_schedules"("warehouse_id");

-- CreateIndex
CREATE INDEX "license_plates_tenant_id_idx" ON "license_plates"("tenant_id");

-- CreateIndex
CREATE INDEX "license_plates_warehouse_id_idx" ON "license_plates"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "license_plates_tenant_id_code_key" ON "license_plates"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "license_plate_items_tenant_id_idx" ON "license_plate_items"("tenant_id");

-- CreateIndex
CREATE INDEX "license_plate_items_license_plate_id_idx" ON "license_plate_items"("license_plate_id");

-- CreateIndex
CREATE INDEX "license_plate_items_inventory_item_id_idx" ON "license_plate_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "putaway_tasks_tenant_id_idx" ON "putaway_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "putaway_tasks_stock_entry_id_idx" ON "putaway_tasks"("stock_entry_id");

-- CreateIndex
CREATE INDEX "putaway_tasks_inventory_item_id_idx" ON "putaway_tasks"("inventory_item_id");

-- CreateIndex
CREATE INDEX "batches_origin_stock_entry_id_idx" ON "batches"("origin_stock_entry_id");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_origin_stock_entry_id_fkey" FOREIGN KEY ("origin_stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycle_count_schedules" ADD CONSTRAINT "cycle_count_schedules_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plates" ADD CONSTRAINT "license_plates_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plates" ADD CONSTRAINT "license_plates_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bin_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plate_items" ADD CONSTRAINT "license_plate_items_license_plate_id_fkey" FOREIGN KEY ("license_plate_id") REFERENCES "license_plates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plate_items" ADD CONSTRAINT "license_plate_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plate_items" ADD CONSTRAINT "license_plate_items_lot_batch_id_fkey" FOREIGN KEY ("lot_batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_plate_items" ADD CONSTRAINT "license_plate_items_serial_number_id_fkey" FOREIGN KEY ("serial_number_id") REFERENCES "serial_numbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "putaway_tasks" ADD CONSTRAINT "putaway_tasks_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "putaway_tasks" ADD CONSTRAINT "putaway_tasks_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "putaway_tasks" ADD CONSTRAINT "putaway_tasks_suggested_bin_id_fkey" FOREIGN KEY ("suggested_bin_id") REFERENCES "bin_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
