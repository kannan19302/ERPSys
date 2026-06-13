-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "rfq_id" TEXT,
ADD COLUMN     "supplier_quotation_id" TEXT;

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "rfq_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expected_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quotations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "rfq_id" TEXT,
    "vendor_id" TEXT NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "valid_until" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_quotation_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_quotation_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "supplier_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rfqs_tenant_id_idx" ON "rfqs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfqs_tenant_id_org_id_rfq_number_key" ON "rfqs"("tenant_id", "org_id", "rfq_number");

-- CreateIndex
CREATE INDEX "rfq_items_tenant_id_idx" ON "rfq_items"("tenant_id");

-- CreateIndex
CREATE INDEX "rfq_items_rfq_id_idx" ON "rfq_items"("rfq_id");

-- CreateIndex
CREATE INDEX "supplier_quotations_tenant_id_idx" ON "supplier_quotations"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_quotations_rfq_id_idx" ON "supplier_quotations"("rfq_id");

-- CreateIndex
CREATE INDEX "supplier_quotations_vendor_id_idx" ON "supplier_quotations"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_quotations_tenant_id_org_id_quotation_number_key" ON "supplier_quotations"("tenant_id", "org_id", "quotation_number");

-- CreateIndex
CREATE INDEX "supplier_quotation_items_tenant_id_idx" ON "supplier_quotation_items"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_quotation_items_supplier_quotation_id_idx" ON "supplier_quotation_items"("supplier_quotation_id");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "supplier_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotations" ADD CONSTRAINT "supplier_quotations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_supplier_quotation_id_fkey" FOREIGN KEY ("supplier_quotation_id") REFERENCES "supplier_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_quotation_items" ADD CONSTRAINT "supplier_quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
