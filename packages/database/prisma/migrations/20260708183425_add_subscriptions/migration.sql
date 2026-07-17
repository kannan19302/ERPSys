-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "buying_role" TEXT NOT NULL DEFAULT 'INFLUENCER',
ADD COLUMN     "engagement_score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interaction_velocity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_contacted_at" TIMESTAMP(3),
ADD COLUMN     "lifecycle_status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "preferred_contact_method" TEXT,
ADD COLUMN     "secondary_email" TEXT,
ADD COLUMN     "social_profiles" JSONB;

-- AlterTable
ALTER TABLE "crm_contracts" ADD COLUMN     "approval_status" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "approver_id" TEXT,
ADD COLUMN     "billing_address" TEXT,
ADD COLUMN     "contract_type" TEXT NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "delivery_notes" TEXT,
ADD COLUMN     "price_adjustment" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "revised_from_id" TEXT,
ADD COLUMN     "shipping_address" TEXT,
ADD COLUMN     "shipping_carrier" TEXT,
ADD COLUMN     "shipping_handling_charges" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "signature_status" TEXT NOT NULL DEFAULT 'UNSIGNED',
ADD COLUMN     "signed_at" TIMESTAMP(3),
ADD COLUMN     "signer_email" TEXT,
ADD COLUMN     "signer_name" TEXT,
ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tracking_number" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "credit_hold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "credit_hold_reason" TEXT,
ADD COLUMN     "customer_type" TEXT NOT NULL DEFAULT 'RECURRING',
ADD COLUMN     "risk_rating" TEXT NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "forecast_scenarios" ADD COLUMN     "inflow_factor" DECIMAL(5,2) DEFAULT 1.0,
ADD COLUMN     "outflow_factor" DECIMAL(5,2) DEFAULT 1.0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discontinued_at" TIMESTAMP(3),
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "contract_id" TEXT;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "contract_id" TEXT,
ADD COLUMN     "price_adjustment" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_handling_charges" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "average_lead_time_days" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "checklist_bank_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checklist_nda_signed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checklist_tax_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "quality_score" DOUBLE PRECISION NOT NULL DEFAULT 100.0;

-- CreateTable
CREATE TABLE "forecast_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "quota_amount" DECIMAL(15,2) NOT NULL,
    "pipeline_amount" DECIMAL(15,2) NOT NULL,
    "won_amount" DECIMAL(15,2) NOT NULL,
    "forecast_amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_team_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'READ',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objectives" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_health_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "logged_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_leases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "lease_ref" TEXT,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "lease_type" TEXT NOT NULL DEFAULT 'OPERATING',
    "initial_recognition" DECIMAL(18,4),
    "carrying_amount" DECIMAL(18,4),
    "present_value" DECIMAL(18,4),
    "interest_rate" DECIMAL(6,4),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "finance_lease_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "payment_amount" DECIMAL(18,4) NOT NULL,
    "interest_expense" DECIMAL(18,4),
    "principal_repayment" DECIMAL(18,4),
    "rou_amortization" DECIMAL(18,4),
    "journal_posted" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lease_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" TEXT,
    "product_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unit_amount" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "billing_period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "billing_cycles" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "trial_end_date" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "paused_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "unit_amount" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL,
    "metric_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_amount" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_dunning_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "dunning_level_id" TEXT NOT NULL,
    "dunning_run_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fee_applied" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "email_sent_to" TEXT,

    CONSTRAINT "invoice_dunning_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_billing_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoice_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contract_billing_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contract_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_term_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "due_days" INTEGER NOT NULL,
    "discount_days" INTEGER NOT NULL DEFAULT 0,
    "discount_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_term_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "credentials_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bank_account_id" TEXT NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matched_entity_id" TEXT,
    "matched_entity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_weeks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "projected_inflow" DECIMAL(15,2) NOT NULL,
    "projected_outflow" DECIMAL(15,2) NOT NULL,
    "adjustments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(15,2) NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intercompany_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_org_id" TEXT NOT NULL,
    "to_org_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "from_invoice_id" TEXT,
    "to_invoice_id" TEXT,
    "elimination_journal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intercompany_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_revaluation_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL,
    "target_currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "journal_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fx_revaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_revaluation_details" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "balance_in_foreign" DECIMAL(15,2) NOT NULL,
    "original_amount_base" DECIMAL(15,2) NOT NULL,
    "revalued_amount_base" DECIMAL(15,2) NOT NULL,
    "unrealized_gain_loss" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_revaluation_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forecast_snapshots_tenant_id_idx" ON "forecast_snapshots"("tenant_id");

-- CreateIndex
CREATE INDEX "quotas_tenant_id_idx" ON "quotas"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotas_tenant_id_user_id_period_key" ON "quotas"("tenant_id", "user_id", "period");

-- CreateIndex
CREATE INDEX "deal_tags_tenant_id_idx" ON "deal_tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_tags_tenant_id_opportunity_id_tag_key" ON "deal_tags"("tenant_id", "opportunity_id", "tag");

-- CreateIndex
CREATE INDEX "deal_team_members_tenant_id_idx" ON "deal_team_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "deal_team_members_tenant_id_opportunity_id_user_id_key" ON "deal_team_members"("tenant_id", "opportunity_id", "user_id");

-- CreateIndex
CREATE INDEX "account_plans_tenant_id_idx" ON "account_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "contact_roles_tenant_id_idx" ON "contact_roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_roles_tenant_id_opportunity_id_contact_id_key" ON "contact_roles"("tenant_id", "opportunity_id", "contact_id");

-- CreateIndex
CREATE INDEX "customer_health_logs_tenant_id_idx" ON "customer_health_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_leases_tenant_id_idx" ON "finance_leases"("tenant_id");

-- CreateIndex
CREATE INDEX "lease_schedules_tenant_id_idx" ON "lease_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "lease_schedules_finance_lease_id_idx" ON "lease_schedules"("finance_lease_id");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_customer_id_idx" ON "subscriptions"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "subscription_lines_tenant_id_idx" ON "subscription_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "subscription_lines_subscription_id_idx" ON "subscription_lines"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_invoices_tenant_id_idx" ON "subscription_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "subscription_invoices_subscription_id_idx" ON "subscription_invoices"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_invoices_tenant_id_status_idx" ON "subscription_invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscription_usage_tenant_id_idx" ON "subscription_usage"("tenant_id");

-- CreateIndex
CREATE INDEX "subscription_usage_subscription_id_idx" ON "subscription_usage"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_usage_tenant_id_subscription_id_metric_name_idx" ON "subscription_usage"("tenant_id", "subscription_id", "metric_name");

-- CreateIndex
CREATE INDEX "invoice_dunning_logs_tenant_id_idx" ON "invoice_dunning_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "invoice_dunning_logs_invoice_id_idx" ON "invoice_dunning_logs"("invoice_id");

-- CreateIndex
CREATE INDEX "crm_contract_billing_milestones_tenant_id_idx" ON "crm_contract_billing_milestones"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_billing_milestones_contract_id_idx" ON "crm_contract_billing_milestones"("contract_id");

-- CreateIndex
CREATE INDEX "crm_contract_line_items_tenant_id_idx" ON "crm_contract_line_items"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_line_items_contract_id_idx" ON "crm_contract_line_items"("contract_id");

-- CreateIndex
CREATE INDEX "payment_term_templates_tenant_id_idx" ON "payment_term_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_connections_tenant_id_idx" ON "bank_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_transactions_tenant_id_idx" ON "bank_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "forecast_weeks_tenant_id_idx" ON "forecast_weeks"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_weeks_tenant_id_week_start_key" ON "forecast_weeks"("tenant_id", "week_start");

-- CreateIndex
CREATE INDEX "intercompany_transactions_tenant_id_idx" ON "intercompany_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "fx_revaluation_runs_tenant_id_idx" ON "fx_revaluation_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "fx_revaluation_details_run_id_idx" ON "fx_revaluation_details"("run_id");

-- CreateIndex
CREATE INDEX "purchase_orders_contract_id_idx" ON "purchase_orders"("contract_id");

-- CreateIndex
CREATE INDEX "sales_orders_contract_id_idx" ON "sales_orders"("contract_id");

-- AddForeignKey
ALTER TABLE "deal_tags" ADD CONSTRAINT "deal_tags_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_team_members" ADD CONSTRAINT "deal_team_members_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_plans" ADD CONSTRAINT "account_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_roles" ADD CONSTRAINT "contact_roles_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_roles" ADD CONSTRAINT "contact_roles_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_health_logs" ADD CONSTRAINT "customer_health_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_leases" ADD CONSTRAINT "finance_leases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_schedules" ADD CONSTRAINT "lease_schedules_finance_lease_id_fkey" FOREIGN KEY ("finance_lease_id") REFERENCES "finance_leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_lines" ADD CONSTRAINT "subscription_lines_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_dunning_logs" ADD CONSTRAINT "invoice_dunning_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_dunning_logs" ADD CONSTRAINT "invoice_dunning_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_dunning_logs" ADD CONSTRAINT "invoice_dunning_logs_dunning_level_id_fkey" FOREIGN KEY ("dunning_level_id") REFERENCES "dunning_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_dunning_logs" ADD CONSTRAINT "invoice_dunning_logs_dunning_run_id_fkey" FOREIGN KEY ("dunning_run_id") REFERENCES "dunning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_revised_from_id_fkey" FOREIGN KEY ("revised_from_id") REFERENCES "crm_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_billing_milestones" ADD CONSTRAINT "crm_contract_billing_milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_line_items" ADD CONSTRAINT "crm_contract_line_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_line_items" ADD CONSTRAINT "crm_contract_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "bank_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_revaluation_details" ADD CONSTRAINT "fx_revaluation_details_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "fx_revaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_revaluation_details" ADD CONSTRAINT "fx_revaluation_details_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
