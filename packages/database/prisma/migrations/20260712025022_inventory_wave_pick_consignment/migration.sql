-- CreateTable
CREATE TABLE "pick_waves" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "wave_number" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pick_waves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pick_wave_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pick_wave_id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pick_wave_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pick_wave_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pick_wave_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "bin_location_id" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL,
    "picked_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pick_wave_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_stocks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "quantity_on_hand" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consignment_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consignment_consumptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "consignment_stock_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "billed_at" TIMESTAMP(3),
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consignment_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pick_waves_tenant_id_idx" ON "pick_waves"("tenant_id");

-- CreateIndex
CREATE INDEX "pick_waves_tenant_id_status_idx" ON "pick_waves"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pick_waves_tenant_id_org_id_wave_number_key" ON "pick_waves"("tenant_id", "org_id", "wave_number");

-- CreateIndex
CREATE INDEX "pick_wave_orders_tenant_id_idx" ON "pick_wave_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "pick_wave_orders_pick_wave_id_idx" ON "pick_wave_orders"("pick_wave_id");

-- CreateIndex
CREATE UNIQUE INDEX "pick_wave_orders_tenant_id_pick_wave_id_sales_order_id_key" ON "pick_wave_orders"("tenant_id", "pick_wave_id", "sales_order_id");

-- CreateIndex
CREATE INDEX "pick_wave_items_tenant_id_idx" ON "pick_wave_items"("tenant_id");

-- CreateIndex
CREATE INDEX "pick_wave_items_pick_wave_id_idx" ON "pick_wave_items"("pick_wave_id");

-- CreateIndex
CREATE INDEX "consignment_stocks_tenant_id_idx" ON "consignment_stocks"("tenant_id");

-- CreateIndex
CREATE INDEX "consignment_stocks_product_id_idx" ON "consignment_stocks"("product_id");

-- CreateIndex
CREATE INDEX "consignment_stocks_warehouse_id_idx" ON "consignment_stocks"("warehouse_id");

-- CreateIndex
CREATE INDEX "consignment_consumptions_tenant_id_idx" ON "consignment_consumptions"("tenant_id");

-- CreateIndex
CREATE INDEX "consignment_consumptions_consignment_stock_id_idx" ON "consignment_consumptions"("consignment_stock_id");

-- AddForeignKey
ALTER TABLE "pick_waves" ADD CONSTRAINT "pick_waves_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_wave_orders" ADD CONSTRAINT "pick_wave_orders_pick_wave_id_fkey" FOREIGN KEY ("pick_wave_id") REFERENCES "pick_waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_wave_items" ADD CONSTRAINT "pick_wave_items_pick_wave_id_fkey" FOREIGN KEY ("pick_wave_id") REFERENCES "pick_waves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_wave_items" ADD CONSTRAINT "pick_wave_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pick_wave_items" ADD CONSTRAINT "pick_wave_items_bin_location_id_fkey" FOREIGN KEY ("bin_location_id") REFERENCES "bin_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_stocks" ADD CONSTRAINT "consignment_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_stocks" ADD CONSTRAINT "consignment_stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignment_consumptions" ADD CONSTRAINT "consignment_consumptions_consignment_stock_id_fkey" FOREIGN KEY ("consignment_stock_id") REFERENCES "consignment_stocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
