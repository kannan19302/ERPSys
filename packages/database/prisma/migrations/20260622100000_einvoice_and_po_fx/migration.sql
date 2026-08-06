-- AP foreign-currency support on purchase orders (booking rate + paid amount for revaluation)
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "purchase_orders" ADD COLUMN IF NOT EXISTS "exchange_rate" DECIMAL(15,6) NOT NULL DEFAULT 1;

-- Structured legal e-invoices (UBL 2.1 / PEPPOL BIS / India GST IRN)
CREATE TABLE IF NOT EXISTS "e_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "irn" TEXT,
    "qr_payload" TEXT,
    "document_xml" TEXT NOT NULL,
    "ack_number" TEXT,
    "ack_date" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "e_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "e_invoices_tenant_id_invoice_id_format_key" ON "e_invoices"("tenant_id", "invoice_id", "format");
CREATE INDEX IF NOT EXISTS "e_invoices_tenant_id_idx" ON "e_invoices"("tenant_id");
CREATE INDEX IF NOT EXISTS "e_invoices_tenant_id_invoice_id_idx" ON "e_invoices"("tenant_id", "invoice_id");
