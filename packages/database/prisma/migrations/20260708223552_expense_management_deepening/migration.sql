-- Expense Management Deepening: policies, mileage, per diem, corporate cards, OCR/violation fields

ALTER TABLE "expense_reports" ADD COLUMN IF NOT EXISTS "has_policy_violation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expense_reports" ADD COLUMN IF NOT EXISTS "requires_second_approval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expense_reports" ADD COLUMN IF NOT EXISTS "second_approved_by" TEXT;
ALTER TABLE "expense_reports" ADD COLUMN IF NOT EXISTS "second_approved_at" TIMESTAMP(3);
ALTER TABLE "expense_reports" ADD COLUMN IF NOT EXISTS "gl_journal_id" TEXT;

ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "merchant" TEXT;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "is_mileage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "mileage_distance" DECIMAL(10,2);
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "mileage_rate_applied" DECIMAL(10,4);
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "is_per_diem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "per_diem_days" DECIMAL(6,2);
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "per_diem_rate_applied" DECIMAL(10,2);
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "ocr_raw" JSONB;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "ocr_confidence" DOUBLE PRECISION;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "policy_violation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "policy_violation_reason" TEXT;
ALTER TABLE "expense_report_items" ADD COLUMN IF NOT EXISTS "corporate_card_transaction_id" TEXT;

CREATE TABLE IF NOT EXISTS "expense_category_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "max_amount_per_item" DECIMAL(15,2),
    "receipt_required_above" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expense_category_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "expense_category_policies_tenant_id_idx" ON "expense_category_policies"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "expense_category_policies_tenant_id_category_key" ON "expense_category_policies"("tenant_id", "category");

CREATE TABLE IF NOT EXISTS "mileage_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rate_per_mile" DECIMAL(10,4) NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mileage_rates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "mileage_rates_tenant_id_idx" ON "mileage_rates"("tenant_id");

CREATE TABLE IF NOT EXISTS "per_diem_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "daily_rate" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "per_diem_rates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "per_diem_rates_tenant_id_idx" ON "per_diem_rates"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "per_diem_rates_tenant_id_location_key" ON "per_diem_rates"("tenant_id", "location");

CREATE TABLE IF NOT EXISTS "corporate_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "nickname" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corporate_cards_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "corporate_cards_tenant_id_idx" ON "corporate_cards"("tenant_id");
CREATE INDEX IF NOT EXISTS "corporate_cards_tenant_id_employee_id_idx" ON "corporate_cards"("tenant_id", "employee_id");

CREATE TABLE IF NOT EXISTS "corporate_card_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "merchant" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "corporate_card_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "corporate_card_transactions_tenant_id_idx" ON "corporate_card_transactions"("tenant_id");
CREATE INDEX IF NOT EXISTS "corporate_card_transactions_tenant_id_status_idx" ON "corporate_card_transactions"("tenant_id", "status");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expense_report_items_corporate_card_transaction_id_key') THEN
    ALTER TABLE "expense_report_items" ADD CONSTRAINT "expense_report_items_corporate_card_transaction_id_key" UNIQUE ("corporate_card_transaction_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expense_report_items_corporate_card_transaction_id_fkey') THEN
    ALTER TABLE "expense_report_items" ADD CONSTRAINT "expense_report_items_corporate_card_transaction_id_fkey" FOREIGN KEY ("corporate_card_transaction_id") REFERENCES "corporate_card_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'corporate_card_transactions_card_id_fkey') THEN
    ALTER TABLE "corporate_card_transactions" ADD CONSTRAINT "corporate_card_transactions_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "corporate_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
