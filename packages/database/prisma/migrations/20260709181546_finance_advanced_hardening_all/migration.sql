-- CreateTable
CREATE TABLE "intercompany_loans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lender_org_id" TEXT NOT NULL,
    "borrower_org_id" TEXT NOT NULL,
    "loan_number" TEXT NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "interest_type" TEXT NOT NULL DEFAULT 'SIMPLE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intercompany_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_drawdowns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "drawdown_date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_drawdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_repayments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "repayment_date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_revaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "revaluation_date" TIMESTAMP(3) NOT NULL,
    "carrying_value_before" DECIMAL(15,2) NOT NULL,
    "revalued_value" DECIMAL(15,2) NOT NULL,
    "gain_loss" DECIMAL(15,2) NOT NULL,
    "gl_journal_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_revaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_disposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "disposal_type" TEXT NOT NULL,
    "sale_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gain_loss" DECIMAL(15,2) NOT NULL,
    "gl_journal_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_disposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_pools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pool_type" TEXT NOT NULL DEFAULT 'PHYSICAL',
    "header_account_id" TEXT NOT NULL,
    "participant_account_ids" JSONB NOT NULL DEFAULT '[]',
    "target_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_pool_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cash_pool_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "run_type" TEXT NOT NULL,
    "total_swept" DECIMAL(15,2) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '[]',
    "gl_journal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_pool_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variance_alert_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "threshold_pct" DECIMAL(5,2) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variance_alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "average_rate" DECIMAL(15,6) NOT NULL,
    "closing_rate" DECIMAL(15,6) NOT NULL,
    "historical_rate" DECIMAL(15,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "intercompany_loans_tenant_id_idx" ON "intercompany_loans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "intercompany_loans_tenant_id_loan_number_key" ON "intercompany_loans"("tenant_id", "loan_number");

-- CreateIndex
CREATE INDEX "loan_drawdowns_tenant_id_idx" ON "loan_drawdowns"("tenant_id");

-- CreateIndex
CREATE INDEX "loan_drawdowns_loan_id_idx" ON "loan_drawdowns"("loan_id");

-- CreateIndex
CREATE INDEX "loan_repayments_tenant_id_idx" ON "loan_repayments"("tenant_id");

-- CreateIndex
CREATE INDEX "loan_repayments_loan_id_idx" ON "loan_repayments"("loan_id");

-- CreateIndex
CREATE INDEX "asset_revaluations_tenant_id_idx" ON "asset_revaluations"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_revaluations_asset_id_idx" ON "asset_revaluations"("asset_id");

-- CreateIndex
CREATE INDEX "asset_disposals_tenant_id_idx" ON "asset_disposals"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_disposals_asset_id_idx" ON "asset_disposals"("asset_id");

-- CreateIndex
CREATE INDEX "cash_pools_tenant_id_idx" ON "cash_pools"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_pool_runs_tenant_id_idx" ON "cash_pool_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_pool_runs_cash_pool_id_idx" ON "cash_pool_runs"("cash_pool_id");

-- CreateIndex
CREATE INDEX "variance_alert_configs_tenant_id_idx" ON "variance_alert_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variance_alert_configs_tenant_id_account_id_key" ON "variance_alert_configs"("tenant_id", "account_id");

-- CreateIndex
CREATE INDEX "consolidation_rates_tenant_id_idx" ON "consolidation_rates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "consolidation_rates_tenant_id_period_from_currency_to_curre_key" ON "consolidation_rates"("tenant_id", "period", "from_currency", "to_currency");

-- AddForeignKey
ALTER TABLE "loan_drawdowns" ADD CONSTRAINT "loan_drawdowns_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "intercompany_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "intercompany_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_pool_runs" ADD CONSTRAINT "cash_pool_runs_cash_pool_id_fkey" FOREIGN KEY ("cash_pool_id") REFERENCES "cash_pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
