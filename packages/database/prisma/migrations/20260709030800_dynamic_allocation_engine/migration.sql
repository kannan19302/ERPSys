-- CreateTable
CREATE TABLE "allocation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "allocation_type" TEXT NOT NULL,
    "basis_type" TEXT,
    "source_account_id" TEXT NOT NULL,
    "targetAllocations" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "allocation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "allocated_amount" DECIMAL(15,2) NOT NULL,
    "journal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allocation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "allocation_rules_tenant_id_idx" ON "allocation_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "allocation_runs_tenant_id_idx" ON "allocation_runs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_assets_tenant_id_asset_code_key" ON "fixed_assets"("tenant_id", "asset_code");

-- AddForeignKey
ALTER TABLE "allocation_rules" ADD CONSTRAINT "allocation_rules_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_runs" ADD CONSTRAINT "allocation_runs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "allocation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_runs" ADD CONSTRAINT "allocation_runs_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "budget_scenario_lines_tenant_id_scenario_id_account_id_month_ke" RENAME TO "budget_scenario_lines_tenant_id_scenario_id_account_id_mont_key";
