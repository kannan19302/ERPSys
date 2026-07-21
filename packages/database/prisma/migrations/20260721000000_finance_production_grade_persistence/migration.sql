-- AlterTable
ALTER TABLE "credit_notes" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "debit_notes" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_invoice_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" TEXT NOT NULL,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "frequency" TEXT NOT NULL,
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "next_run_date" TIMESTAMP(3) NOT NULL,
    "last_run_date" TIMESTAMP(3),
    "total_cycles" INTEGER,
    "cycles_run" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_invoice_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),

    CONSTRAINT "generated_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "description" TEXT,
    "include_details" BOOLEAN NOT NULL DEFAULT true,
    "include_charges" BOOLEAN NOT NULL DEFAULT false,
    "due_date_offset" INTEGER NOT NULL DEFAULT 0,
    "email_subject" TEXT,
    "email_body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statement_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_statements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "template_id" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_charged" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "purchase_order_id" TEXT,
    "bill_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bill_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_bill_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expense_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bill_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "currencies_tenant_id_idx" ON "currencies"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_tenant_id_code_key" ON "currencies"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "recurring_invoice_templates_org_id_idx" ON "recurring_invoice_templates"("org_id");

-- CreateIndex
CREATE INDEX "recurring_invoice_templates_customer_id_idx" ON "recurring_invoice_templates"("customer_id");

-- CreateIndex
CREATE INDEX "recurring_invoice_templates_tenant_id_idx" ON "recurring_invoice_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_invoice_templates_tenant_id_org_id_template_name_key" ON "recurring_invoice_templates"("tenant_id", "org_id", "template_name");

-- CreateIndex
CREATE INDEX "generated_invoices_tenant_id_idx" ON "generated_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "generated_invoices_template_id_idx" ON "generated_invoices"("template_id");

-- CreateIndex
CREATE INDEX "statement_templates_org_id_idx" ON "statement_templates"("org_id");

-- CreateIndex
CREATE INDEX "statement_templates_tenant_id_idx" ON "statement_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "statement_templates_tenant_id_org_id_template_name_key" ON "statement_templates"("tenant_id", "org_id", "template_name");

-- CreateIndex
CREATE INDEX "customer_statements_org_id_idx" ON "customer_statements"("org_id");

-- CreateIndex
CREATE INDEX "customer_statements_customer_id_idx" ON "customer_statements"("customer_id");

-- CreateIndex
CREATE INDEX "customer_statements_tenant_id_idx" ON "customer_statements"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_statements_tenant_id_customer_id_idx" ON "customer_statements"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "vendor_bills_org_id_idx" ON "vendor_bills"("org_id");

-- CreateIndex
CREATE INDEX "vendor_bills_vendor_id_idx" ON "vendor_bills"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_bills_purchase_order_id_idx" ON "vendor_bills"("purchase_order_id");

-- CreateIndex
CREATE INDEX "vendor_bills_tenant_id_idx" ON "vendor_bills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bills_tenant_id_org_id_bill_number_key" ON "vendor_bills"("tenant_id", "org_id", "bill_number");

-- CreateIndex
CREATE INDEX "vendor_bill_line_items_tenant_id_idx" ON "vendor_bill_line_items"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_bill_line_items_vendor_bill_id_idx" ON "vendor_bill_line_items"("vendor_bill_id");

