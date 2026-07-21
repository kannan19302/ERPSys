-- DropForeignKey
ALTER TABLE "dunning_levels" DROP CONSTRAINT "dunning_levels_org_id_fkey";

-- DropForeignKey
ALTER TABLE "dunning_runs" DROP CONSTRAINT "dunning_runs_org_id_fkey";

-- DropIndex
DROP INDEX "customer_statements_org_id_idx";

-- DropIndex
DROP INDEX "customer_statements_tenant_id_customer_id_idx";

-- DropIndex
DROP INDEX "dunning_levels_tenant_id_org_id_days_overdue_key";

-- DropIndex
DROP INDEX "recurring_invoice_templates_org_id_idx";

-- DropIndex
DROP INDEX "recurring_invoice_templates_tenant_id_org_id_template_name_key";

-- DropIndex
DROP INDEX "statement_templates_org_id_idx";

-- DropIndex
DROP INDEX "statement_templates_tenant_id_org_id_template_name_key";

-- DropIndex
DROP INDEX "vendor_bills_org_id_idx";

-- DropIndex
DROP INDEX "vendor_bills_purchase_order_id_idx";

-- DropIndex
DROP INDEX "vendor_bills_vendor_id_idx";

-- AlterTable
ALTER TABLE "credit_notes" DROP COLUMN "updated_at",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "line_items" DROP NOT NULL,
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "currencies" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "customer_statements" DROP COLUMN "template_id",
DROP COLUMN "updated_at",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "opening_balance" DROP DEFAULT,
ALTER COLUMN "closing_balance" DROP DEFAULT,
ALTER COLUMN "total_charged" DROP DEFAULT,
ALTER COLUMN "total_paid" DROP DEFAULT,
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "debit_notes" DROP COLUMN "updated_at",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "line_items" DROP NOT NULL,
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "dunning_levels" DROP COLUMN "email_template_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dunning_runs" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "level_ids" DROP DEFAULT,
ALTER COLUMN "customer_ids" DROP DEFAULT,
ALTER COLUMN "results" DROP DEFAULT;

-- AlterTable
ALTER TABLE "expense_reports" ALTER COLUMN "expense_date" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "generated_invoices" DROP COLUMN "period_end",
DROP COLUMN "period_start",
ALTER COLUMN "total_amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SALE';

-- AlterTable
ALTER TABLE "recurring_invoice_templates" DROP COLUMN "currency",
DROP COLUMN "cycles_run",
DROP COLUMN "description",
DROP COLUMN "total_amount",
DROP COLUMN "total_cycles",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "statement_templates" DROP COLUMN "description",
DROP COLUMN "due_date_offset",
DROP COLUMN "email_body",
DROP COLUMN "email_subject",
DROP COLUMN "include_charges",
DROP COLUMN "include_details",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_bill_line_items" DROP COLUMN "created_at",
DROP COLUMN "expense_account_id",
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(15,3),
ALTER COLUMN "unit_price" DROP DEFAULT,
ALTER COLUMN "total_amount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vendor_bills" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "dunning_levels_tenant_id_org_id_level_number_key" ON "dunning_levels"("tenant_id", "org_id", "level_number");

-- CreateIndex
CREATE INDEX "generated_invoices_invoice_id_idx" ON "generated_invoices"("invoice_id");

-- CreateIndex
CREATE INDEX "recurring_invoice_templates_status_idx" ON "recurring_invoice_templates"("status");

-- CreateIndex
CREATE INDEX "vendor_bills_tenant_id_vendor_id_idx" ON "vendor_bills"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "vendor_bills_tenant_id_status_idx" ON "vendor_bills"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "vendor_bill_line_items" ADD CONSTRAINT "vendor_bill_line_items_vendor_bill_id_fkey" FOREIGN KEY ("vendor_bill_id") REFERENCES "vendor_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
