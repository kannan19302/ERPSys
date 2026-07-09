-- CreateTable: Close Tasks (continuous close automation)
CREATE TABLE "close_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "financial_period_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'RECONCILIATION',
    "assignee_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "close_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Variance Flags (period-over-period variance detection)
CREATE TABLE "variance_flags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "financial_period_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "current_amount" DECIMAL(15,2) NOT NULL,
    "prior_amount" DECIMAL(15,2) NOT NULL,
    "variance_amount" DECIMAL(15,2) NOT NULL,
    "variance_percent" DECIMAL(7,2) NOT NULL,
    "threshold_percent" DECIMAL(5,2) NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variance_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Budget Scenarios (FP&A driver-based budgeting)
CREATE TABLE "budget_scenarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASE',
    "fiscal_year" INTEGER NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "cloned_from_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "budget_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Budget Scenario Lines (monthly budget lines with driver support)
CREATE TABLE "budget_scenario_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "driver_type" TEXT,
    "driver_value" DECIMAL(15,4),
    "driver_rate" DECIMAL(15,4),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_scenario_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "close_tasks_tenant_id_financial_period_id_status_idx" ON "close_tasks"("tenant_id", "financial_period_id", "status");
CREATE INDEX "close_tasks_tenant_id_assignee_id_idx" ON "close_tasks"("tenant_id", "assignee_id");

CREATE INDEX "variance_flags_tenant_id_financial_period_id_status_idx" ON "variance_flags"("tenant_id", "financial_period_id", "status");
CREATE INDEX "variance_flags_tenant_id_account_id_idx" ON "variance_flags"("tenant_id", "account_id");

CREATE INDEX "budget_scenarios_tenant_id_org_id_fiscal_year_idx" ON "budget_scenarios"("tenant_id", "org_id", "fiscal_year");

CREATE UNIQUE INDEX "budget_scenario_lines_tenant_id_scenario_id_account_id_month_key" ON "budget_scenario_lines"("tenant_id", "scenario_id", "account_id", "month");
CREATE INDEX "budget_scenario_lines_tenant_id_scenario_id_idx" ON "budget_scenario_lines"("tenant_id", "scenario_id");

-- AddForeignKey
ALTER TABLE "budget_scenarios" ADD CONSTRAINT "budget_scenarios_cloned_from_id_fkey" FOREIGN KEY ("cloned_from_id") REFERENCES "budget_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "budget_scenario_lines" ADD CONSTRAINT "budget_scenario_lines_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "budget_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
