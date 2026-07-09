-- CreateTable: ap_invoice_captures
CREATE TABLE "ap_invoice_captures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "vendor_name" TEXT,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "total_amount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "confidence_score" DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "raw_text" TEXT,
    "matching_purchase_order_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "ap_invoice_captures_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ap_invoice_capture_lines
CREATE TABLE "ap_invoice_capture_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capture_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "suggested_account_id" TEXT,
    "suggested_cost_center_id" TEXT,
    "matching_po_line_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ap_invoice_capture_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ap_invoice_captures_tenant_id_status_idx" ON "ap_invoice_captures"("tenant_id", "status");
CREATE INDEX "ap_invoice_captures_tenant_id_matching_purchase_order_id_idx" ON "ap_invoice_captures"("tenant_id", "matching_purchase_order_id");

-- CreateIndex
CREATE INDEX "ap_invoice_capture_lines_tenant_id_capture_id_idx" ON "ap_invoice_capture_lines"("tenant_id", "capture_id");

-- AddForeignKey
ALTER TABLE "ap_invoice_capture_lines" ADD CONSTRAINT "ap_invoice_capture_lines_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "ap_invoice_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
