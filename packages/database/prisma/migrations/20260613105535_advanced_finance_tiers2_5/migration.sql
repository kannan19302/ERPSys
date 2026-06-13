-- CreateTable
CREATE TABLE "expense_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_report_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "expense_report_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "receipt_url" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "expense_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "description" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "deferred_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recognized_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "recognition_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_assets" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_liabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_equity" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_expenses" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_eliminations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "consolidation_id" TEXT NOT NULL,
    "from_org_id" TEXT NOT NULL,
    "to_org_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "account_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_eliminations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "user_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_reports_tenant_id_idx" ON "expense_reports"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_reports_tenant_id_org_id_report_number_key" ON "expense_reports"("tenant_id", "org_id", "report_number");

-- CreateIndex
CREATE INDEX "expense_report_items_tenant_id_idx" ON "expense_report_items"("tenant_id");

-- CreateIndex
CREATE INDEX "revenue_schedules_tenant_id_idx" ON "revenue_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "consolidation_runs_tenant_id_idx" ON "consolidation_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "consolidation_eliminations_tenant_id_idx" ON "consolidation_eliminations"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_audit_logs_tenant_id_entity_type_entity_id_idx" ON "finance_audit_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "finance_audit_logs_tenant_id_created_at_idx" ON "finance_audit_logs"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "expense_report_items" ADD CONSTRAINT "expense_report_items_expense_report_id_fkey" FOREIGN KEY ("expense_report_id") REFERENCES "expense_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_eliminations" ADD CONSTRAINT "consolidation_eliminations_consolidation_id_fkey" FOREIGN KEY ("consolidation_id") REFERENCES "consolidation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
