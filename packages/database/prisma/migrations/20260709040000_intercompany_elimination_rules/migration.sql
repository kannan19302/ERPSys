-- CreateTable
CREATE TABLE "elimination_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_org_id" TEXT,
    "destination_org_id" TEXT,
    "matching_criteria" TEXT NOT NULL,
    "tolerance_days" INTEGER NOT NULL DEFAULT 10,
    "source_account_id" TEXT NOT NULL,
    "destination_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "elimination_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elimination_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_eliminated" DECIMAL(15,2) NOT NULL,
    "rules_applied_count" INTEGER NOT NULL DEFAULT 0,
    "journal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "elimination_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elimination_run_details" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elimination_run_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "elimination_rules_tenant_id_idx" ON "elimination_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "elimination_runs_tenant_id_idx" ON "elimination_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "elimination_run_details_run_id_idx" ON "elimination_run_details"("run_id");

-- CreateIndex
CREATE INDEX "elimination_run_details_rule_id_idx" ON "elimination_run_details"("rule_id");

-- CreateIndex
CREATE INDEX "elimination_run_details_transaction_id_idx" ON "elimination_run_details"("transaction_id");

-- AddForeignKey
ALTER TABLE "elimination_rules" ADD CONSTRAINT "elimination_rules_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elimination_rules" ADD CONSTRAINT "elimination_rules_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elimination_runs" ADD CONSTRAINT "elimination_runs_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elimination_run_details" ADD CONSTRAINT "elimination_run_details_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "elimination_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elimination_run_details" ADD CONSTRAINT "elimination_run_details_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "elimination_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elimination_run_details" ADD CONSTRAINT "elimination_run_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "intercompany_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
