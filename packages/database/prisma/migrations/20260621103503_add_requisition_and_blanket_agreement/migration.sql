-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "blanket_agreement_id" TEXT,
ADD COLUMN     "requisition_id" TEXT;

-- CreateTable
CREATE TABLE "purchase_requisitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "requisition_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requested_by_id" TEXT NOT NULL,
    "department_id" TEXT,
    "required_date" TIMESTAMP(3),
    "estimated_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requisition_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requisition_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "estimated_price" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blanket_purchase_agreements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "agreement_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "agreement_limit" DECIMAL(15,2) NOT NULL,
    "released_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "blanket_purchase_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blanket_purchase_agreement_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "released_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "blanket_purchase_agreement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_requisitions_tenant_id_idx" ON "purchase_requisitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requisitions_tenant_id_org_id_requisition_number_key" ON "purchase_requisitions"("tenant_id", "org_id", "requisition_number");

-- CreateIndex
CREATE INDEX "purchase_requisition_items_tenant_id_idx" ON "purchase_requisition_items"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_requisition_items_requisition_id_idx" ON "purchase_requisition_items"("requisition_id");

-- CreateIndex
CREATE INDEX "blanket_purchase_agreements_tenant_id_idx" ON "blanket_purchase_agreements"("tenant_id");

-- CreateIndex
CREATE INDEX "blanket_purchase_agreements_vendor_id_idx" ON "blanket_purchase_agreements"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "blanket_purchase_agreements_tenant_id_org_id_agreement_numb_key" ON "blanket_purchase_agreements"("tenant_id", "org_id", "agreement_number");

-- CreateIndex
CREATE INDEX "blanket_purchase_agreement_items_tenant_id_idx" ON "blanket_purchase_agreement_items"("tenant_id");

-- CreateIndex
CREATE INDEX "blanket_purchase_agreement_items_agreement_id_idx" ON "blanket_purchase_agreement_items"("agreement_id");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "purchase_requisitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_blanket_agreement_id_fkey" FOREIGN KEY ("blanket_agreement_id") REFERENCES "blanket_purchase_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisition_items" ADD CONSTRAINT "purchase_requisition_items_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "purchase_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisition_items" ADD CONSTRAINT "purchase_requisition_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blanket_purchase_agreements" ADD CONSTRAINT "blanket_purchase_agreements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blanket_purchase_agreements" ADD CONSTRAINT "blanket_purchase_agreements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blanket_purchase_agreement_items" ADD CONSTRAINT "blanket_purchase_agreement_items_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "blanket_purchase_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blanket_purchase_agreement_items" ADD CONSTRAINT "blanket_purchase_agreement_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
