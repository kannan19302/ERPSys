-- CreateTable: AP Match Rules
CREATE TABLE "ap_match_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "quantity_tolerance_percent" DECIMAL(5,2) NOT NULL,
    "price_tolerance_percent" DECIMAL(5,2) NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "ap_match_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AP Match Exceptions
CREATE TABLE "ap_match_exceptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "po_line_id" TEXT NOT NULL,
    "variance_type" TEXT NOT NULL,
    "variance_amount" DECIMAL(15,2) NOT NULL,
    "variance_percent" DECIMAL(5,2) NOT NULL,
    "expected_value" TEXT,
    "actual_value" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "resolved_by" TEXT,

    CONSTRAINT "ap_match_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Payment Batches
CREATE TABLE "payment_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "submitted_by" TEXT,
    "exported_at" TIMESTAMP(3),
    "settlement_date" TIMESTAMP(3),
    "total_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "bank_account_id" TEXT,
    "payment_method" TEXT NOT NULL,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "payment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Payment Batch Lines
CREATE TABLE "payment_batch_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "scheduled_payment_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INCLUDED',
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_batch_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ap_match_rules_tenant_id_vendor_id_effective_date_key" ON "ap_match_rules"("tenant_id", "vendor_id", "effective_date");
CREATE INDEX "ap_match_rules_tenant_id_vendor_id_status_idx" ON "ap_match_rules"("tenant_id", "vendor_id", "status");

CREATE UNIQUE INDEX "ap_match_exceptions_tenant_id_invoice_id_po_line_id_key" ON "ap_match_exceptions"("tenant_id", "invoice_id", "po_line_id");
CREATE INDEX "ap_match_exceptions_tenant_id_status_created_at_idx" ON "ap_match_exceptions"("tenant_id", "status", "created_at");

CREATE UNIQUE INDEX "payment_batches_tenant_id_batch_number_key" ON "payment_batches"("tenant_id", "batch_number");
CREATE INDEX "payment_batches_tenant_id_status_created_at_idx" ON "payment_batches"("tenant_id", "status", "created_at");

CREATE INDEX "payment_batch_lines_tenant_id_batch_id_status_idx" ON "payment_batch_lines"("tenant_id", "batch_id", "status");

-- AddForeignKey
ALTER TABLE "payment_batches" ADD CONSTRAINT "payment_batches_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_batch_lines" ADD CONSTRAINT "payment_batch_lines_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payment_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
