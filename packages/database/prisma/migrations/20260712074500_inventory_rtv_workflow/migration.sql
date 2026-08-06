-- CreateTable
CREATE TABLE "return_reason_codes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_reason_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_rma_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "rma_number" TEXT NOT NULL,
    "purchase_return_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "reason_code_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "vendor_rma_ref" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "authorized_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_rma_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_return_shipments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rma_request_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "shipment_number" TEXT NOT NULL,
    "carrier" TEXT,
    "tracking_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "packed_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "credit_memo_ref" TEXT,
    "credit_amount" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_return_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_reason_codes_tenant_id_code_key" ON "return_reason_codes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "return_reason_codes_tenant_id_idx" ON "return_reason_codes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_rma_requests_tenant_id_rma_number_key" ON "vendor_rma_requests"("tenant_id", "rma_number");

-- CreateIndex
CREATE INDEX "vendor_rma_requests_tenant_id_idx" ON "vendor_rma_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_rma_requests_tenant_id_purchase_return_id_idx" ON "vendor_rma_requests"("tenant_id", "purchase_return_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_return_shipments_tenant_id_shipment_number_key" ON "vendor_return_shipments"("tenant_id", "shipment_number");

-- CreateIndex
CREATE INDEX "vendor_return_shipments_tenant_id_idx" ON "vendor_return_shipments"("tenant_id");

-- AddForeignKey
ALTER TABLE "vendor_rma_requests" ADD CONSTRAINT "vendor_rma_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rma_requests" ADD CONSTRAINT "vendor_rma_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_rma_requests" ADD CONSTRAINT "vendor_rma_requests_reason_code_id_fkey" FOREIGN KEY ("reason_code_id") REFERENCES "return_reason_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_return_shipments" ADD CONSTRAINT "vendor_return_shipments_rma_request_id_fkey" FOREIGN KEY ("rma_request_id") REFERENCES "vendor_rma_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_return_shipments" ADD CONSTRAINT "vendor_return_shipments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
