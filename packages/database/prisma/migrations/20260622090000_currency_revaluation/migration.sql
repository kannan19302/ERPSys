-- Foreign-currency revaluation runs (unrealized FX gain/loss on open monetary balances)
CREATE TABLE IF NOT EXISTS "currency_revaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "run_number" TEXT NOT NULL,
    "as_of_date" TIMESTAMP(3) NOT NULL,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "total_gain" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_loss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_adjustment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "journal_id" TEXT,
    "lines" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "currency_revaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "currency_revaluations_tenant_id_org_id_run_number_key" ON "currency_revaluations"("tenant_id", "org_id", "run_number");
CREATE INDEX IF NOT EXISTS "currency_revaluations_tenant_id_idx" ON "currency_revaluations"("tenant_id");
CREATE INDEX IF NOT EXISTS "currency_revaluations_tenant_id_as_of_date_idx" ON "currency_revaluations"("tenant_id", "as_of_date");
