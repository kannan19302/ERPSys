-- DropForeignKey
ALTER TABLE "AppInstallation" DROP CONSTRAINT "AppInstallation_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "AppSettings" DROP CONSTRAINT "AppSettings_roleId_fkey";

-- DropForeignKey
ALTER TABLE "AppSettings" DROP CONSTRAINT "AppSettings_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "compensation_grades" DROP CONSTRAINT "compensation_grades_department_id_fkey";

-- DropForeignKey
ALTER TABLE "compensation_recommendations" DROP CONSTRAINT "compensation_recommendations_cycle_id_fkey";

-- DropForeignKey
ALTER TABLE "compensation_recommendations" DROP CONSTRAINT "compensation_recommendations_grade_id_fkey";

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
DROP INDEX "pos_orders_tenant_id_client_txn_id_key";

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
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "line_items" JSONB;

-- AlterTable
ALTER TABLE "currencies" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "customer_statements" DROP COLUMN "template_id",
DROP COLUMN "updated_at",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "include_paid_invoices" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "opening_balance" DROP DEFAULT,
ALTER COLUMN "closing_balance" DROP DEFAULT,
ALTER COLUMN "total_charged" DROP DEFAULT,
ALTER COLUMN "total_paid" DROP DEFAULT,
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "debit_notes" DROP COLUMN "updated_at",
ADD COLUMN     "bill_id" TEXT,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "line_items" JSONB;

-- AlterTable
ALTER TABLE "dunning_levels" DROP COLUMN "email_template_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_template" TEXT,
ADD COLUMN     "fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "level_number" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "max_overdue_days" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "org_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "dunning_runs" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customer_ids" JSONB NOT NULL,
ADD COLUMN     "level_ids" JSONB NOT NULL,
ADD COLUMN     "min_overdue_days" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "results" JSONB NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_letters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "org_id" DROP NOT NULL,
ALTER COLUMN "total_invoices" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "expense_category_policies" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "expense_reports" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "receipt_url" TEXT;

-- AlterTable
ALTER TABLE "generated_invoices" DROP COLUMN "period_end",
DROP COLUMN "period_start",
ADD COLUMN     "invoice_number" TEXT NOT NULL,
ADD COLUMN     "total_amount" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'SALE';

-- AlterTable
ALTER TABLE "pos_orders" DROP COLUMN "client_txn_id",
DROP COLUMN "synced_at";

-- AlterTable
ALTER TABLE "recurring_invoice_templates" DROP COLUMN "currency",
DROP COLUMN "cycles_run",
DROP COLUMN "description",
DROP COLUMN "total_amount",
DROP COLUMN "total_cycles",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "line_items" DROP DEFAULT;

-- AlterTable
ALTER TABLE "statement_templates" DROP COLUMN "description",
DROP COLUMN "due_date_offset",
DROP COLUMN "email_body",
DROP COLUMN "email_subject",
DROP COLUMN "include_charges",
DROP COLUMN "include_details",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "footer_text" TEXT,
ADD COLUMN     "header_text" TEXT,
ADD COLUMN     "include_aging_breakdown" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "include_payment_history" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_due_amount" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "org_id" DROP NOT NULL;

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

-- DropTable
DROP TABLE "AppInstallation";

-- DropTable
DROP TABLE "AppSettings";

-- DropTable
DROP TABLE "compensation_cycles";

-- DropTable
DROP TABLE "compensation_grades";

-- DropTable
DROP TABLE "compensation_recommendations";

-- DropEnum
DROP TYPE "AppInstallStatus";

-- DropEnum
DROP TYPE "SettingScope";

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_slug" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "role_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_credentials" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_base_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_article_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "change_log" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_article_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_price_lists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_price_list_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "price_list_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "min_quantity" DECIMAL(15,3) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_price_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_price_overrides" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "floor_price" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_price_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bundle_price" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "savings_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundle_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_sell_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "recommended_product_id" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cross_sell_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upsell_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "upgrade_product_id" TEXT NOT NULL,
    "description" TEXT,
    "price_delta" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upsell_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_splits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "split_type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_split_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "split_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "share" DECIMAL(5,2) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_split_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_territory_forecasts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "pipeline_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expected_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "forecast_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "confidence" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_territory_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_territory_realignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "previous_manager_id" TEXT,
    "new_manager_id" TEXT,
    "previous_parent_id" TEXT,
    "new_parent_id" TEXT,
    "reason" TEXT,
    "changed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_territory_realignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_enrichment_sources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_url" TEXT,
    "api_key_enc" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "rate_limit" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(3),
    "last_test_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_enrichment_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_enrichment_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_enrichment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_enrichment_field_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "source_field" TEXT NOT NULL,
    "target_field" TEXT NOT NULL,
    "target_entity" TEXT NOT NULL,
    "transform" TEXT,
    "custom_script" TEXT,
    "overwrite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_enrichment_field_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_enrichment_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "object_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fields_enriched" INTEGER DEFAULT 0,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "enriched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enriched_by" TEXT,

    CONSTRAINT "crm_enrichment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_lead_enrichment_data" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "enrichedData" JSONB NOT NULL DEFAULT '{}',
    "raw_response" JSONB,
    "confidence" DOUBLE PRECISION,
    "matched_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_lead_enrichment_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_enrichment_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "day_of_month" INTEGER,
    "time" TEXT,
    "object_type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_enrichment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_next_best_action_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objectType" TEXT NOT NULL,
    "stage_id" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "actionType" TEXT NOT NULL,
    "action_label" TEXT NOT NULL,
    "action_description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_next_best_action_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_action_suggestions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "config_id" TEXT,
    "action_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT,
    "expected_impact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "accepted_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "dismissed_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_action_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_guided_selling_playbooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objectType" TEXT NOT NULL,
    "stage_from" TEXT,
    "stage_to" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_guided_selling_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deal_readiness_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "factors" JSONB NOT NULL DEFAULT '[]',
    "recommendation" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_deal_readiness_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_amendments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "amendment_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amendment_type" TEXT NOT NULL,
    "changeSummary" JSONB NOT NULL DEFAULT '{}',
    "previous_value" DECIMAL(15,2),
    "new_value" DECIMAL(15,2),
    "effective_date" TIMESTAMP(3) NOT NULL,
    "signed_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contract_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_price_escalation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "name" TEXT NOT NULL,
    "escalation_type" TEXT NOT NULL,
    "escalation_value" DECIMAL(15,4) NOT NULL,
    "frequency" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "next_escalation_date" TIMESTAMP(3),
    "max_cap" DECIMAL(15,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_applied_at" TIMESTAMP(3),
    "applied_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contract_price_escalation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_auto_renewal_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "renewal_number" INTEGER NOT NULL,
    "previous_end_date" TIMESTAMP(3) NOT NULL,
    "new_end_date" TIMESTAMP(3) NOT NULL,
    "previous_value" DECIMAL(15,2) NOT NULL,
    "new_value" DECIMAL(15,2) NOT NULL,
    "escalation_applied" DECIMAL(15,2) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "notes" TEXT,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_contract_auto_renewal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_expiration_pipeline_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "days_to_expiry" INTEGER NOT NULL,
    "action_required" TEXT,
    "assigned_to" TEXT,
    "notes" TEXT,
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by" TEXT,
    "renewed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_contract_expiration_pipeline_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contract_type" TEXT NOT NULL,
    "template" JSONB NOT NULL DEFAULT '{}',
    "clauses" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contract_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_contract_clauses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_standard" BOOLEAN NOT NULL DEFAULT true,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contract_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_obligations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "contract_ref" TEXT,
    "description" TEXT NOT NULL,
    "transaction_price" DECIMAL(18,4) NOT NULL,
    "allocated_amount" DECIMAL(18,4) NOT NULL,
    "ssp" DECIMAL(18,4),
    "obligation_type" TEXT NOT NULL,
    "satisfaction_timing" TEXT NOT NULL,
    "satisfaction_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "satisfied_date" TIMESTAMP(3),
    "revenue_recognized" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "revenue_deferred" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "revenue_schedule_id" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asc606_contract_modifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "contract_ref" TEXT NOT NULL,
    "mod_number" TEXT NOT NULL,
    "modification_date" TIMESTAMP(3) NOT NULL,
    "mod_type" TEXT NOT NULL,
    "original_consideration" DECIMAL(18,4) NOT NULL,
    "modified_consideration" DECIMAL(18,4) NOT NULL,
    "cumulative_catch_up" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "accounting_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asc606_contract_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asc606_deferred_revenue_roll_forwards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "opening_balance" DECIMAL(18,4) NOT NULL,
    "additions" DECIMAL(18,4) NOT NULL,
    "recognized" DECIMAL(18,4) NOT NULL,
    "write_offs" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(18,4) NOT NULL,
    "current_portion" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "non_current_portion" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asc606_deferred_revenue_roll_forwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_pricing_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "policy_name" TEXT NOT NULL,
    "policy_type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "description" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "markup_percentage" DECIMAL(7,4),
    "documentation_url" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_pricing_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_pricing_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "adjustment_date" TIMESTAMP(3) NOT NULL,
    "fiscal_year" TEXT NOT NULL,
    "related_party_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "original_amount" DECIMAL(18,4) NOT NULL,
    "adjusted_amount" DECIMAL(18,4) NOT NULL,
    "adjustment_amount" DECIMAL(18,4) NOT NULL,
    "adjustment_direction" TEXT NOT NULL,
    "reason" TEXT,
    "arm_length_range" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "journal_id" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_pricing_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apportionment_factors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "fiscal_year" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "factor_type" TEXT NOT NULL,
    "numerator" DECIMAL(18,4) NOT NULL,
    "denominator" DECIMAL(18,4) NOT NULL,
    "factor_pct" DECIMAL(9,6) NOT NULL,
    "effective_pct" DECIMAL(9,6),
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "source_ref" TEXT,
    "notes" TEXT,
    "filed_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apportionment_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fair_value_measurements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "instrument_type" TEXT NOT NULL,
    "instrument_id" TEXT NOT NULL,
    "measurement_date" TIMESTAMP(3) NOT NULL,
    "fair_value" DECIMAL(18,4) NOT NULL,
    "cost_basis" DECIMAL(18,4) NOT NULL,
    "unrealized_gl" DECIMAL(18,4) NOT NULL,
    "hierarchy_level" TEXT NOT NULL,
    "valuation_technique" TEXT,
    "significant_inputs" JSONB,
    "valuation_date" TIMESTAMP(3),
    "performed_by" TEXT,
    "approved_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fair_value_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expected_credit_loss_provisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provision_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "portfolio" TEXT,
    "stage" TEXT NOT NULL,
    "gross_carrying_amount" DECIMAL(18,4) NOT NULL,
    "loss_rate" DECIMAL(9,6) NOT NULL,
    "expected_loss" DECIMAL(18,4) NOT NULL,
    "allowance_balance" DECIMAL(18,4) NOT NULL,
    "previous_allowance" DECIMAL(18,4) NOT NULL,
    "charge_to_pl" DECIMAL(18,4) NOT NULL,
    "methodology" TEXT NOT NULL,
    "probability_default" DECIMAL(9,6),
    "loss_given_default" DECIMAL(9,6),
    "exposure_at_default" DECIMAL(18,4),
    "days_past_due" INTEGER,
    "credit_risk_rating" TEXT,
    "macroeconomic_factors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "journal_id" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expected_credit_loss_provisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fiscal_year" TEXT NOT NULL,
    "basedOn" TEXT NOT NULL DEFAULT 'PREVIOUS_YEAR',
    "adjustment_pct" DECIMAL(7,4),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lines" JSONB DEFAULT '[]',
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_commitments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "commitment_ref" TEXT NOT NULL,
    "commitment_type" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,4) NOT NULL,
    "outstanding_amount" DECIMAL(18,4) NOT NULL,
    "liquidated_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "commitment_date" TIMESTAMP(3) NOT NULL,
    "expected_liquidation_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source_doc_type" TEXT,
    "source_doc_id" TEXT,
    "account_id" TEXT,
    "cost_center_id" TEXT,
    "project_id" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_carry_forward_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_type" TEXT,
    "carry_forward_pct" DECIMAL(7,4) NOT NULL,
    "max_carry_amount" DECIMAL(18,4),
    "expiration_months" INTEGER,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_carry_forward_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "revision_number" TEXT NOT NULL,
    "revision_type" TEXT NOT NULL,
    "previous_amount" DECIMAL(18,4) NOT NULL,
    "revised_amount" DECIMAL(18,4) NOT NULL,
    "change_amount" DECIMAL(18,4) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netting_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "netting_method" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "netting_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netting_group_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "participant_type" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "netting_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netting_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "run_number" TEXT NOT NULL,
    "netting_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT,
    "total_receivables" DECIMAL(18,4) NOT NULL,
    "total_payables" DECIMAL(18,4) NOT NULL,
    "net_settlement_amount" DECIMAL(18,4) NOT NULL,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "journal_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "netting_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "netting_run_details" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "netting_run_id" TEXT NOT NULL,
    "from_org_id" TEXT NOT NULL,
    "to_org_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "original_amount" DECIMAL(18,4) NOT NULL,
    "netted_amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "base_amount" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "netting_run_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_instructions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "netting_run_id" TEXT NOT NULL,
    "from_org_id" TEXT NOT NULL,
    "to_org_id" TEXT NOT NULL,
    "settlement_amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "settlement_method" TEXT NOT NULL,
    "expected_settlement_date" TIMESTAMP(3),
    "actual_settlement_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "bank_account_id" TEXT,
    "confirmation_ref" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "journal_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_portal_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portal_user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_portal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_document_access" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portal_user_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "grantType" TEXT NOT NULL DEFAULT 'MANUAL',
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_document_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_activity_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portal_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_workflow_steps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "condition_config" JSONB,
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_workflow_stats" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "total_entered" INTEGER NOT NULL DEFAULT 0,
    "total_exited" INTEGER NOT NULL DEFAULT 0,
    "converted" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_workflow_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variant_a" JSONB NOT NULL,
    "variant_b" JSONB NOT NULL,
    "winner" TEXT,
    "sample_size" INTEGER NOT NULL DEFAULT 1000,
    "confidence_threshold" DECIMAL(5,2) NOT NULL DEFAULT 95,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "campaign_id" TEXT,

    CONSTRAINT "ab_test_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "bounce_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_rois" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "total_spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "leads_generated" INTEGER NOT NULL DEFAULT 0,
    "opportunities_won" INTEGER NOT NULL DEFAULT 0,
    "roi" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cac" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_rois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_score_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'DEFAULT',
    "weight_nps" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "weight_engagement" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "weight_product" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "weight_support" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "weight_renewal" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "green_threshold" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "yellow_threshold" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_score_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewal_risk_predictions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "risk_score" DECIMAL(5,2) NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'LOW',
    "predicted_date" TIMESTAMP(3),
    "confidence_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "top_factors" JSONB,
    "recommended_action" TEXT,
    "model_version" TEXT NOT NULL DEFAULT '1.0',
    "predicted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewal_risk_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_analyses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "churn_score" DECIMAL(5,2) NOT NULL,
    "churn_reason" TEXT,
    "churn_date" TIMESTAMP(3),
    "segment" TEXT,
    "signals" JSONB DEFAULT '[]',
    "prevented" BOOLEAN NOT NULL DEFAULT false,
    "prevented_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churn_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expansion_revenues" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'UPSELL',
    "amount" DECIMAL(15,2) NOT NULL,
    "product_id" TEXT,
    "description" TEXT,
    "source" TEXT,
    "recognized_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expansion_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "question" TEXT NOT NULL DEFAULT 'How likely are you to recommend us?',
    "min_rating" INTEGER NOT NULL DEFAULT 0,
    "max_rating" INTEGER NOT NULL DEFAULT 10,
    "target_segment" TEXT,
    "target_ids" JSONB DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "send_automatically" BOOLEAN NOT NULL DEFAULT false,
    "trigger_event" TEXT,
    "delay_days" INTEGER DEFAULT 7,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nps_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "contact_id" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PASSIVE',
    "comment" TEXT,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_responses" INTEGER NOT NULL DEFAULT 0,
    "detractors" INTEGER NOT NULL DEFAULT 0,
    "passives" INTEGER NOT NULL DEFAULT 0,
    "promoters" INTEGER NOT NULL DEFAULT 0,
    "nps_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "response_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sales_routes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_location" JSONB,
    "end_location" JSONB,
    "total_distance" DECIMAL(10,2),
    "distance_unit" TEXT NOT NULL DEFAULT 'KM',
    "estimated_duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "optimized" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_sales_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sales_route_stops" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "contact_id" TEXT,
    "name" TEXT NOT NULL,
    "address" JSONB,
    "location" JSONB DEFAULT '{}',
    "visit_order" INTEGER NOT NULL,
    "planned_duration" INTEGER NOT NULL DEFAULT 30,
    "actual_duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "visited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_sales_route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sales_checkins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "route_id" TEXT,
    "stop_id" TEXT,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'VISIT',
    "location" JSONB NOT NULL DEFAULT '{}',
    "address" TEXT,
    "notes" TEXT,
    "checkin_at" TIMESTAMP(3) NOT NULL,
    "checkout_at" TIMESTAMP(3),
    "duration_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_sales_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sales_expenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "route_id" TEXT,
    "category" TEXT NOT NULL DEFAULT 'TRAVEL',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_sales_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_sales_meeting_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "attendees" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "actionItems" JSONB DEFAULT '[]',
    "nextSteps" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'NO_DECISION',
    "follow_up_date" TIMESTAMP(3),
    "opportunity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_sales_meeting_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictive_lead_score_models" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'DEFAULT',
    "weights" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "model_version" TEXT NOT NULL DEFAULT '1.0',
    "last_trained_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictive_lead_score_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_velocities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT,
    "stage" TEXT NOT NULL,
    "avg_days_in_stage" DECIMAL(10,2) NOT NULL,
    "median_days" DECIMAL(10,2) NOT NULL,
    "min_days" INTEGER NOT NULL,
    "max_days" INTEGER NOT NULL,
    "deal_count" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_velocities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_cycle_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "segment" TEXT,
    "segment_value" TEXT,
    "avg_cycle_days" DECIMAL(10,2) NOT NULL,
    "median_cycle_days" DECIMAL(10,2) NOT NULL,
    "win_rate" DECIMAL(5,2) NOT NULL,
    "avg_deal_size" DECIMAL(15,2) NOT NULL,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "won_deals" INTEGER NOT NULL DEFAULT 0,
    "lost_deals" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_cycle_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_accuracy_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "forecast_id" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "predicted_value" DECIMAL(15,2) NOT NULL,
    "actual_value" DECIMAL(15,2) NOT NULL,
    "variance" DECIMAL(15,2) NOT NULL,
    "variance_pct" DECIMAL(5,2) NOT NULL,
    "accuracy_score" DECIMAL(5,2) NOT NULL,
    "model_version" TEXT NOT NULL DEFAULT '1.0',
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_accuracy_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebate_agreements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer_id" TEXT,
    "product_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'VOLUME',
    "basis" TEXT NOT NULL DEFAULT 'PURCHASE_VALUE',
    "calculation_method" TEXT NOT NULL,
    "rate" DECIMAL(15,6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "min_threshold" DECIMAL(15,2),
    "max_cap" DECIMAL(15,2),
    "tiers" JSONB DEFAULT '[]',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebate_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebate_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "qualified_value" DECIMAL(15,2) NOT NULL,
    "rebate_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoice_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "submitted_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebate_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebate_accruals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "period_name" TEXT NOT NULL,
    "accrued_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "accrued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebate_accruals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_config_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "constraint_type" TEXT NOT NULL,
    "target_product_id" TEXT,
    "config_value" JSONB NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_config_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_comparisons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "quote_ids" JSONB NOT NULL DEFAULT '[]',
    "winner_id" TEXT,
    "criteria" JSONB DEFAULT '[]',
    "total_score" DECIMAL(10,2),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_markup_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "markup_amount" DECIMAL(15,2) NOT NULL,
    "markup_pct" DECIMAL(5,2) NOT NULL,
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "requested_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_markup_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "template_id" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "generated_at" TIMESTAMP(3),
    "generated_by" TEXT,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_teams" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_team_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_desk_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "description" TEXT,
    "discount_request" DECIMAL(5,2),
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "assigned_by_id" TEXT,
    "decision_at" TIMESTAMP(3),
    "decision_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_desk_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'TEAM',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_intelligence" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "competitor" TEXT NOT NULL,
    "product" TEXT,
    "strength" TEXT,
    "weakness" TEXT,
    "positioning" TEXT,
    "win_rate" DECIMAL(5,2),
    "source" TEXT,
    "submitted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "message" TEXT NOT NULL,
    "details" JSONB DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_deal_registrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "registration_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "description" TEXT,
    "estimated_value" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expected_close_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approval_notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_deal_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdf_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget" DECIMAL(15,2) NOT NULL,
    "spent_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'CAMPAIGN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdf_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mdf_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "receipt_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mdf_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_performance_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "total_deals" INTEGER NOT NULL DEFAULT 0,
    "won_deals" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "mdf_used" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "leads_generated" INTEGER NOT NULL DEFAULT 0,
    "avg_deal_size" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "win_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "score" DECIMAL(5,2),
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_catalogs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_catalog_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "custom_price" DECIMAL(15,2),
    "custom_min_qty" DECIMAL(15,3),
    "custom_max_qty" DECIMAL(15,3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_order_uploads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "total_lines" INTEGER NOT NULL DEFAULT 0,
    "processed_lines" INTEGER NOT NULL DEFAULT 0,
    "error_lines" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sales_order_id" TEXT,
    "errors" JSONB DEFAULT '[]',
    "uploaded_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_order_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_order_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "interval_count" INTEGER NOT NULL DEFAULT 1,
    "next_run_date" TIMESTAMP(3) NOT NULL,
    "last_run_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "max_runs" INTEGER DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingMethod" TEXT NOT NULL DEFAULT 'INVOICE',
    "shipping_address" JSONB,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_order_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_order_template_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recurring_order_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_approval_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerCriteria" JSONB NOT NULL DEFAULT '{}',
    "approvalOrder" TEXT NOT NULL DEFAULT 'SEQUENTIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_approval_workflow_steps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_role" TEXT NOT NULL,
    "min_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_approval_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_approval_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "workflow_id" TEXT,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "total_steps" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT,
    "notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_approval_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_id" TEXT,
    "action" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actioned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_approval_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_merchandise_authorizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rma_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "source" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "vendor_id" TEXT,
    "vendor_name" TEXT,
    "sales_order_id" TEXT,
    "sales_order_number" TEXT,
    "purchase_order_id" TEXT,
    "purchase_order_number" TEXT,
    "return_reason" TEXT,
    "returnType" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "warehouse_id" TEXT,
    "warehouse_name" TEXT,
    "total_qty" DECIMAL(65,30),
    "total_value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "inspected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "return_tracking_number" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_merchandise_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rma_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "expected_qty" DECIMAL(65,30) NOT NULL,
    "received_qty" DECIMAL(65,30),
    "inspected_qty" DECIMAL(65,30),
    "accepted_qty" DECIMAL(65,30),
    "rejected_qty" DECIMAL(65,30),
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "lot_number" TEXT,
    "serial_numbers" TEXT,
    "unit_value" DECIMAL(65,30),
    "total_value" DECIMAL(65,30),
    "disposition" TEXT,
    "condition" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rma_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rma_inspections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rma_id" TEXT NOT NULL,
    "inspector_id" TEXT,
    "inspection_date" TIMESTAMP(3),
    "result" TEXT,
    "overall_condition" TEXT,
    "defects" JSONB,
    "images" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rma_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wave_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_number" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'PICK',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "optimization_strategy" TEXT NOT NULL DEFAULT 'BATCH',
    "total_orders" INTEGER,
    "total_lines" INTEGER,
    "total_items" DECIMAL(65,30),
    "total_pickers" INTEGER,
    "estimated_duration_min" INTEGER,
    "actual_duration_min" INTEGER,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "sort_method" TEXT DEFAULT 'ORDER',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wave_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wave_plan_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wave_plan_id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignee" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "source_location" TEXT,
    "dest_location" TEXT,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "picked_qty" DECIMAL(65,30),
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "order_ref" TEXT,
    "source_ref" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wave_plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_kpis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "kpi_date" TIMESTAMP(3) NOT NULL,
    "lines_picked" INTEGER,
    "lines_putaway" INTEGER,
    "orders_shipped" INTEGER,
    "orders_received" INTEGER,
    "picks_per_hour" DECIMAL(65,30),
    "putaway_per_hour" DECIMAL(65,30),
    "order_accuracy_pct" DECIMAL(65,30),
    "cycle_count_accuracy_pct" DECIMAL(65,30),
    "dock_to_stock_min" DECIMAL(65,30),
    "order_to_ship_min" DECIMAL(65,30),
    "labor_utilization_pct" DECIMAL(65,30),
    "labor_cost_per_order" DECIMAL(65,30),
    "storage_utilization_pct" DECIMAL(65,30),
    "slot_utilization_pct" DECIMAL(65,30),
    "damage_pct" DECIMAL(65,30),
    "total_labor_hours" DECIMAL(65,30),
    "active_workers" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_stock_optimizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT,
    "product_name" TEXT,
    "warehouse_id" TEXT,
    "current_safety_stock" DECIMAL(65,30),
    "recommended_safety_stock" DECIMAL(65,30),
    "lead_time_days" INTEGER,
    "lead_time_variance" DECIMAL(65,30),
    "demand_mean" DECIMAL(65,30),
    "demand_std_dev" DECIMAL(65,30),
    "service_level" DECIMAL(65,30) DEFAULT 0.95,
    "z_score" DECIMAL(65,30),
    "reorder_point" DECIMAL(65,30),
    "economic_order_qty" DECIMAL(65,30),
    "holding_cost_pct" DECIMAL(65,30) DEFAULT 0.25,
    "carrying_cost" DECIMAL(65,30),
    "stockout_cost" DECIMAL(65,30),
    "total_cost_current" DECIMAL(65,30),
    "total_cost_optimized" DECIMAL(65,30),
    "potential_savings" DECIMAL(65,30),
    "last_calculated" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_stock_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_inventory_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT,
    "product_name" TEXT,
    "total_on_hand" DECIMAL(65,30),
    "total_reserved" DECIMAL(65,30),
    "total_available" DECIMAL(65,30),
    "total_in_transit" DECIMAL(65,30),
    "total_on_order" DECIMAL(65,30),
    "total_allocated" DECIMAL(65,30),
    "total_damaged" DECIMAL(65,30),
    "total_quarantine" DECIMAL(65,30),
    "warehouse_count" INTEGER,
    "stock_value_total" DECIMAL(65,30),
    "stock_value_currency" TEXT DEFAULT 'USD',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_inventory_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_inventory_details" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "global_view_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "warehouse_name" TEXT,
    "on_hand" DECIMAL(65,30),
    "reserved" DECIMAL(65,30),
    "available" DECIMAL(65,30),
    "in_transit" DECIMAL(65,30),
    "on_order" DECIMAL(65,30),
    "allocated" DECIMAL(65,30),
    "damaged" DECIMAL(65,30),
    "quarantine" DECIMAL(65,30),
    "stock_value" DECIMAL(65,30),
    "last_counted" TIMESTAMP(3),
    "reorder_point" DECIMAL(65,30),
    "max_level" DECIMAL(65,30),
    "location_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_inventory_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_number" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectType" TEXT,
    "category" TEXT,
    "estimated_value" DECIMAL(65,30),
    "actual_value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "buyer_id" TEXT,
    "buyer_name" TEXT,
    "expected_savings" DECIMAL(65,30),
    "actual_savings" DECIMAL(65,30),
    "savings_currency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_participants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "invited_date" TIMESTAMP(3),
    "responded_date" TIMESTAMP(3),
    "score" DECIMAL(65,30),
    "rank" INTEGER,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_evaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "evaluator_id" TEXT,
    "evaluation_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "overall_score" DECIMAL(65,30),
    "total_weight" DECIMAL(65,30),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_evaluation_criteria" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "criterion_name" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "score" DECIMAL(65,30),
    "weighted_score" DECIMAL(65,30),
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_analyses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "analysis_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_bids" INTEGER,
    "lowest_bid" DECIMAL(65,30),
    "highest_bid" DECIMAL(65,30),
    "average_bid" DECIMAL(65,30),
    "median_bid" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "savings_vs_estimate" DECIMAL(65,30),
    "award_recommendation" TEXT,
    "award_vendor_id" TEXT,
    "award_vendor_name" TEXT,
    "award_amount" DECIMAL(65,30),
    "award_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_awards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "award_number" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "award_amount" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "award_date" TIMESTAMP(3),
    "acceptance_date" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "terms_summary" TEXT,
    "contract_id" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "contract_name" TEXT NOT NULL,
    "contractType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "buyer_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "auto_renew_notice_days" INTEGER,
    "renewal_count" INTEGER DEFAULT 0,
    "contract_value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "maximum_value" DECIMAL(65,30),
    "estimated_annual_value" DECIMAL(65,30),
    "payment_terms" TEXT,
    "delivery_terms" TEXT,
    "governing_law" TEXT,
    "jurisdiction" TEXT,
    "signatory" TEXT,
    "vendor_signatory" TEXT,
    "signed_date" TIMESTAMP(3),
    "executed_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "termination_reason" TEXT,
    "attachment_url" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_contract_price_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "negotiated_price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "priceType" TEXT NOT NULL DEFAULT 'UNIT',
    "min_qty" DECIMAL(65,30),
    "max_qty" DECIMAL(65,30),
    "tier_level" INTEGER,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_contract_price_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_contract_volume_commitments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "committed_qty" DECIMAL(65,30) NOT NULL,
    "fulfilled_qty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "remaining_qty" DECIMAL(65,30),
    "commitmentPeriod" TEXT NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "compliance_rate" DECIMAL(65,30),
    "rebate_rate" DECIMAL(65,30),
    "rebate_earned" DECIMAL(65,30),
    "penalty_rate" DECIMAL(65,30),
    "penalty_incurred" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_contract_volume_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_contract_sla_clauses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "slaType" TEXT NOT NULL,
    "target_value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "threshold" DECIMAL(65,30),
    "penalty_per_unit" DECIMAL(65,30),
    "max_penalty" DECIMAL(65,30),
    "rebate_per_unit" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_contract_sla_clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_intelligence" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_period" TEXT NOT NULL,
    "report_data" JSONB,
    "total_spend" DECIMAL(65,30),
    "total_savings" DECIMAL(65,30),
    "savings_target" DECIMAL(65,30),
    "savings_pct" DECIMAL(65,30),
    "supplier_count" INTEGER,
    "po_count" INTEGER,
    "avg_lead_time" DECIMAL(65,30),
    "spend_by_category" JSONB,
    "spend_by_vendor" JSONB,
    "top_spend_vendors" JSONB,
    "risks" JSONB,
    "recommendations" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_onboarding_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "step" TEXT NOT NULL DEFAULT 'APPLICATION',
    "steps" JSONB,
    "documents" JSONB,
    "tax_id" TEXT,
    "bank_info" JSONB,
    "insurance_info" JSONB,
    "compliance_check" JSONB,
    "notes" TEXT,
    "assigned_to" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_onboarding_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hs_codes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "chapter" TEXT,
    "section" TEXT,
    "duty_rate" DECIMAL(65,30),
    "duty_unit" TEXT,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "license_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hs_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries_of_origin" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "country_name" TEXT NOT NULL,
    "region" TEXT,
    "trade_agreement" TEXT,
    "preferential_rate" DECIMAL(65,30),
    "risk_level" TEXT,
    "sanctions" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_of_origin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_declarations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "declaration_number" TEXT NOT NULL,
    "entry_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "port_of_entry" TEXT,
    "port_of_lading" TEXT,
    "vessel" TEXT,
    "voyage_number" TEXT,
    "container_number" TEXT,
    "supplier_id" TEXT,
    "supplier_name" TEXT,
    "hs_code_id" TEXT,
    "hs_code" TEXT,
    "country_of_origin" TEXT,
    "invoice_value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "duty_amount" DECIMAL(65,30),
    "duty_currency" TEXT,
    "tax_amount" DECIMAL(65,30),
    "freight_cost" DECIMAL(65,30),
    "insurance_cost" DECIMAL(65,30),
    "total_landed_cost" DECIMAL(65,30),
    "broker_name" TEXT,
    "broker_ref" TEXT,
    "filed_date" TIMESTAMP(3),
    "clearance_date" TIMESTAMP(3),
    "release_date" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_declaration_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "import_declaration_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "hs_code_id" TEXT,
    "hs_code" TEXT,
    "country_of_origin" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "unit_value" DECIMAL(65,30),
    "total_value" DECIMAL(65,30),
    "duty_rate" DECIMAL(65,30),
    "duty_amount" DECIMAL(65,30),
    "duty_percent" DECIMAL(65,30),
    "tax_rate" DECIMAL(65,30),
    "tax_amount" DECIMAL(65,30),
    "preferential_code" TEXT,
    "spf_indicator" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_declaration_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_declarations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "declaration_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "port_of_export" TEXT,
    "destination_country" TEXT,
    "shipment_id" TEXT,
    "carrier_name" TEXT,
    "vessel_flight" TEXT,
    "container_number" TEXT,
    "hs_code_id" TEXT,
    "hs_code" TEXT,
    "invoice_value" DECIMAL(65,30),
    "currency" TEXT DEFAULT 'USD',
    "export_license" TEXT,
    "eccn" TEXT,
    "license_required" BOOLEAN NOT NULL DEFAULT false,
    "license_obtained" BOOLEAN NOT NULL DEFAULT false,
    "destination_control" BOOLEAN NOT NULL DEFAULT false,
    "filing_date" TIMESTAMP(3),
    "clearance_date" TIMESTAMP(3),
    "shipped_date" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_declaration_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "export_declaration_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "hs_code_id" TEXT,
    "hs_code" TEXT,
    "country_of_origin" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "unit_value" DECIMAL(65,30),
    "total_value" DECIMAL(65,30),
    "export_reason" TEXT,
    "schedule_b" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_declaration_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_compliance_screenings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "screen_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "entity_name" TEXT,
    "screen_list" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "match_score" DECIMAL(65,30),
    "match_details" JSONB,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "resolution" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_compliance_screenings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_sense_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "runType" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "horizon_months" INTEGER NOT NULL DEFAULT 12,
    "algorithm" TEXT NOT NULL DEFAULT 'MOVING_AVERAGE',
    "confidence_level" DECIMAL(65,30) DEFAULT 0.95,
    "mape" DECIMAL(65,30),
    "result_summary" JSONB,
    "error_message" TEXT,
    "triggered_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_sense_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_sense_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_sku" TEXT,
    "product_name" TEXT,
    "forecast_period" TEXT NOT NULL,
    "forecast_qty" DECIMAL(65,30),
    "lower_bound" DECIMAL(65,30),
    "upper_bound" DECIMAL(65,30),
    "confidence_score" DECIMAL(65,30),
    "historical_avg" DECIMAL(65,30),
    "seasonality_factor" DECIMAL(65,30),
    "trend_factor" DECIMAL(65,30),
    "actual_qty" DECIMAL(65,30),
    "variance" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_sense_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "planType" TEXT NOT NULL DEFAULT 'TACTICAL',
    "planning_horizon" INTEGER NOT NULL DEFAULT 12,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "demand_source" TEXT,
    "total_supply" DECIMAL(65,30),
    "total_demand" DECIMAL(65,30),
    "total_shortfall" DECIMAL(65,30),
    "total_excess" DECIMAL(65,30),
    "constraints" JSONB,
    "assumptions" JSONB,
    "risk_factors" JSONB,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_plan_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "period" TEXT NOT NULL,
    "forecasted_qty" DECIMAL(65,30),
    "demand_qty" DECIMAL(65,30),
    "supply_qty" DECIMAL(65,30),
    "on_hand_qty" DECIMAL(65,30),
    "in_transit_qty" DECIMAL(65,30),
    "on_order_qty" DECIMAL(65,30),
    "safety_stock_qty" DECIMAL(65,30),
    "reorder_point" DECIMAL(65,30),
    "net_requirement" DECIMAL(65,30),
    "planned_order_qty" DECIMAL(65,30),
    "planned_receipts" DECIMAL(65,30),
    "available_to_promise" DECIMAL(65,30),
    "constrained_qty" DECIMAL(65,30),
    "unconstrained_qty" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_plan_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_plan_scenarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scenarioType" TEXT NOT NULL DEFAULT 'WHAT_IF',
    "assumptions" JSONB,
    "total_supply" DECIMAL(65,30),
    "total_demand" DECIMAL(65,30),
    "total_shortfall" DECIMAL(65,30),
    "total_cost" DECIMAL(65,30),
    "risk_score" INTEGER,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_plan_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_plan_scenario_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "period" TEXT NOT NULL,
    "base_demand" DECIMAL(65,30),
    "adjusted_demand" DECIMAL(65,30),
    "base_supply" DECIMAL(65,30),
    "adjusted_supply" DECIMAL(65,30),
    "delta" DECIMAL(65,30),
    "impact_cost" DECIMAL(65,30),
    "risk_impact" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_plan_scenario_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "description" TEXT,
    "fiscal_year" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "planType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "demand_plan_id" TEXT,
    "supply_plan_id" TEXT,
    "revenue_target" DECIMAL(65,30),
    "cost_budget" DECIMAL(65,30),
    "gross_margin" DECIMAL(65,30),
    "inventory_target" DECIMAL(65,30),
    "service_level" DECIMAL(65,30),
    "assumptions" JSONB,
    "risks" JSONB,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_plan_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sop_plan_id" TEXT NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL,
    "reviewer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "decisions" JSONB,
    "notes" TEXT,
    "attachments" JSONB,
    "next_review" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_plan_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_plan_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sop_plan_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "target_value" DECIMAL(65,30),
    "actual_value" DECIMAL(65,30),
    "variance" DECIMAL(65,30),
    "variance_pct" DECIMAL(65,30),
    "period" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_plan_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_modes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "transit_lead_time_days" INTEGER,
    "cost_factor" DECIMAL(65,30),
    "carbon_factor" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "service_level_id" TEXT,
    "origin_zip" TEXT,
    "dest_zip" TEXT,
    "origin_region" TEXT,
    "dest_region" TEXT,
    "weight_min" DECIMAL(65,30),
    "weight_max" DECIMAL(65,30),
    "rateType" TEXT NOT NULL DEFAULT 'PER_UNIT',
    "base_rate" DECIMAL(65,30) NOT NULL,
    "per_unit_rate" DECIMAL(65,30),
    "per_weight_rate" DECIMAL(65,30),
    "per_distance_rate" DECIMAL(65,30),
    "fuel_surcharge" DECIMAL(65,30) DEFAULT 0,
    "minimum_charge" DECIMAL(65,30),
    "maximum_charge" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "transit_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carrier_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_builds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "build_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "loadType" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "transport_mode" TEXT,
    "carrier_id" TEXT,
    "carrier_name" TEXT,
    "vehicle_id" TEXT,
    "vehicle_number" TEXT,
    "driver_name" TEXT,
    "driver_contact" TEXT,
    "origin_id" TEXT,
    "origin_name" TEXT,
    "dest_id" TEXT,
    "dest_name" TEXT,
    "scheduled_pickup" TIMESTAMP(3),
    "scheduled_delivery" TIMESTAMP(3),
    "actual_pickup" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "total_weight" DECIMAL(65,30),
    "weight_unit" TEXT DEFAULT 'KG',
    "total_volume" DECIMAL(65,30),
    "volume_unit" TEXT DEFAULT 'CUBIC_M',
    "total_pallets" INTEGER,
    "total_cartons" INTEGER,
    "total_stops" INTEGER,
    "total_distance" DECIMAL(65,30),
    "distance_unit" TEXT DEFAULT 'KM',
    "estimated_cost" DECIMAL(65,30),
    "actual_cost" DECIMAL(65,30),
    "cost_currency" TEXT DEFAULT 'USD',
    "bol_number" TEXT,
    "seal_number" TEXT,
    "temperature_req" TEXT,
    "hazmat" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_build_stops" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "stop_sequence" INTEGER NOT NULL,
    "stopType" TEXT NOT NULL DEFAULT 'PICKUP',
    "location_id" TEXT,
    "location_name" TEXT,
    "address" TEXT,
    "scheduled_arrival" TIMESTAMP(3),
    "scheduled_departure" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "actual_departure" TIMESTAMP(3),
    "contact_person" TEXT,
    "contact_phone" TEXT,
    "dock_door" TEXT,
    "notes" TEXT,
    "arrived" BOOLEAN NOT NULL DEFAULT false,
    "departed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_build_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_build_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "weight" DECIMAL(65,30),
    "volume" DECIMAL(65,30),
    "pallet_count" INTEGER,
    "carton_count" INTEGER,
    "hazmat_class" TEXT,
    "temperature_req" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_build_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_tender_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "load_id" TEXT NOT NULL,
    "tender_number" TEXT NOT NULL,
    "carrier_id" TEXT,
    "carrier_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_rate" DECIMAL(65,30),
    "negotiated_rate" DECIMAL(65,30),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "response_date" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_tender_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "appointment_number" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "carrier_id" TEXT,
    "carrier_name" TEXT,
    "carrier_contact" TEXT,
    "vehicle_number" TEXT,
    "warehouse_id" TEXT,
    "warehouse_name" TEXT,
    "dock_door" TEXT,
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3),
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "po_numbers" TEXT,
    "load_id" TEXT,
    "reference_number" TEXT,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "total_weight" DECIMAL(65,30),
    "total_pallets" INTEGER,
    "total_cartons" INTEGER,
    "notes" TEXT,
    "cancelled_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_confirmations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "confirmation_number" TEXT NOT NULL,
    "shipment_id" TEXT,
    "shipment_type" TEXT,
    "appointment_id" TEXT,
    "pod_number" TEXT,
    "received_by" TEXT,
    "received_at" TIMESTAMP(3),
    "signature" TEXT,
    "signature_name" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "damage_notes" TEXT,
    "carrier_name" TEXT,
    "driver_name" TEXT,
    "photos" JSONB,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "location_name" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_confirmation_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "confirmation_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "expected_qty" DECIMAL(65,30) NOT NULL,
    "delivered_qty" DECIMAL(65,30) NOT NULL,
    "damaged_qty" DECIMAL(65,30),
    "rejected_qty" DECIMAL(65,30),
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "lot_number" TEXT,
    "serial_numbers" TEXT,
    "condition" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_confirmation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_risk_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "vendor_name" TEXT,
    "overall_risk_score" DECIMAL(65,30),
    "risk_category" TEXT DEFAULT 'MEDIUM',
    "financial_health" DECIMAL(65,30),
    "geopolitical_risk" DECIMAL(65,30),
    "operational_risk" DECIMAL(65,30),
    "compliance_risk" DECIMAL(65,30),
    "quality_risk" DECIMAL(65,30),
    "concentration_risk" DECIMAL(65,30),
    "last_assessment" TIMESTAMP(3),
    "next_assessment" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_risk_factors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "factorType" TEXT NOT NULL,
    "factor_name" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "weight" DECIMAL(65,30) DEFAULT 1.0,
    "description" TEXT,
    "source" TEXT,
    "last_updated" TIMESTAMP(3),
    "trend" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_risk_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source" TEXT,
    "source_url" TEXT,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_diversity_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "diversity_type" TEXT NOT NULL,
    "certification_body" TEXT,
    "certification_number" TEXT,
    "certification_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "spend_amount" DECIMAL(65,30),
    "spend_currency" TEXT DEFAULT 'USD',
    "fiscal_year" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_diversity_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternative_sourcing" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_sku" TEXT,
    "product_name" TEXT,
    "current_vendor_id" TEXT,
    "current_vendor_name" TEXT,
    "alt_vendor_id" TEXT NOT NULL,
    "alt_vendor_name" TEXT NOT NULL,
    "recommendation_type" TEXT NOT NULL,
    "current_price" DECIMAL(65,30),
    "alt_price" DECIMAL(65,30),
    "potential_savings" DECIMAL(65,30),
    "lead_time_days" INTEGER,
    "quality_score" DECIMAL(65,30),
    "risk_reduction_score" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alternative_sourcing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tower_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_number" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "source_module" TEXT,
    "source_id" TEXT,
    "source_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "impact_score" DECIMAL(65,30),
    "resolution" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "auto_resolved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_tower_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tower_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "executed_by" TEXT,
    "executed_at" TIMESTAMP(3),
    "result" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_tower_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tower_kpis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_code" TEXT NOT NULL,
    "kpi_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "unit" TEXT NOT NULL,
    "current_value" DECIMAL(65,30),
    "target_value" DECIMAL(65,30),
    "threshold_green" DECIMAL(65,30),
    "threshold_yellow" DECIMAL(65,30),
    "threshold_red" DECIMAL(65,30),
    "trend" TEXT,
    "period" TEXT NOT NULL,
    "source_query" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_tower_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tower_alert_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "alert_name" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT,
    "kpi_code" TEXT,
    "condition" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notification_channels" JSONB,
    "recipients" JSONB,
    "auto_resolve" BOOLEAN NOT NULL DEFAULT false,
    "auto_resolve_after_min" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_tower_alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_students" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "enrollment_number" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "parent_contact" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_courses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_fee_structures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_books" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "author" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CHECKOUT',
    "due_date" TIMESTAMP(3),
    "returned_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_attendance_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_timetables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "instructor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_grades" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_patients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT NOT NULL DEFAULT 'MALE',
    "email" TEXT,
    "phone" TEXT,
    "allergies" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_practitioners" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_prescriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_encounters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT,
    "diagnosis" TEXT NOT NULL,
    "treatment_code" TEXT,
    "billing_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_drugs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_vitals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "heart_rate" INTEGER,
    "temperature" DECIMAL(65,30),
    "spo2" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_fhir_resources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_fhir_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_properties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "portfolio" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_leases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "rent_amount" DECIMAL(65,30) NOT NULL,
    "security_deposit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "billing_frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_tenants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "lease_end" TIMESTAMP(3),
    "rent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_maintenance_work_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vendor_id" TEXT,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_maintenance_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_commissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "split_ratio" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "general_ledger_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "sla_deadline" TIMESTAMP(3),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_dispatches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "scheduled_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_technicians" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill" TEXT,
    "workload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_preventive_maintenances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interval_days" INTEGER NOT NULL,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_preventive_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_service_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_shift_cash_drawers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_shift_cash_drawers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_shift_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_shift_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_registers_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "starting_cash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ending_cash" DECIMAL(65,30),
    "actual_cash" DECIMAL(65,30),
    "cash_variance" DECIMAL(65,30),
    "total_sales" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_returns" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "total_discounts" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_registers_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_payment_methods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "requires_reference" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_refunds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "refund_number" TEXT NOT NULL,
    "original_order_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'REFUND',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "refund_method" TEXT,
    "refundAmount" DECIMAL(65,30) NOT NULL,
    "tax_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "exchange_order_id" TEXT,
    "processed_by" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_refund_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "refund_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "refund_amount" DECIMAL(65,30) NOT NULL,
    "restock" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,

    CONSTRAINT "pos_refund_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_gift_cards_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initial_balance" DECIMAL(65,30) NOT NULL,
    "current_balance" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issued_to" TEXT,
    "issued_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_gift_cards_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_gift_card_transactions_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gift_card_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_gift_card_transactions_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_customer_displays" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT NOT NULL DEFAULT 'default',
    "show_cart" BOOLEAN NOT NULL DEFAULT true,
    "show_total" BOOLEAN NOT NULL DEFAULT true,
    "show_promo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_customer_displays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_order_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_order_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_discount_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT 'ORDER',
    "category_id" TEXT,
    "product_id" TEXT,
    "customer_group_id" TEXT,
    "min_purchase" DECIMAL(65,30),
    "max_discount" DECIMAL(65,30),
    "min_qty" INTEGER,
    "max_qty" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_tax_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INCLUSIVE',
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "category_id" TEXT,
    "product_id" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_kitchen_displays" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "terminal_ids" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_kitchen_displays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_kitchen_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kitchen_display_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "terminal_name" TEXT,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "prepared_by" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_kitchen_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_split_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference" TEXT,
    "card_last4" TEXT,
    "auth_code" TEXT,
    "gift_card_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_split_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_stores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "banner" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "tax_calculation" TEXT NOT NULL DEFAULT 'EXCLUSIVE',
    "default_weight_unit" TEXT NOT NULL DEFAULT 'kg',
    "max_cart_items" INTEGER NOT NULL DEFAULT 100,
    "min_order_amount" DECIMAL(65,30),
    "max_order_amount" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "media" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "price" DECIMAL(65,30) NOT NULL,
    "compare_at_price" DECIMAL(65,30),
    "cost_price" DECIMAL(65,30),
    "weight" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_inventory" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_carts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "coupon_code" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shipping_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_cart_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "line_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_email" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billing_address" JSONB,
    "shipping_address" JSONB,
    "shipping_method" TEXT,
    "shipping_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "change_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "coupon_code" TEXT,
    "notes" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "product_name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "gateway_transaction_id" TEXT,
    "card_last4" TEXT,
    "auth_code" TEXT,
    "refunded_amount" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_shipments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tracking_number" TEXT,
    "carrier" TEXT,
    "method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shipped_at" TIMESTAMP(3),
    "estimated_delivery" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "items" JSONB NOT NULL DEFAULT '[]',
    "weight" DECIMAL(65,30),
    "cost" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_returns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "return_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "resolution" TEXT,
    "refund_amount" DECIMAL(65,30),
    "refund_method" TEXT,
    "refunded_at" TIMESTAMP(3),
    "items" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "order_id" TEXT,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_review_media" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_review_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_coupons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "min_order_amount" DECIMAL(65,30),
    "max_discount" DECIMAL(65,30),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "per_customer_limit" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_coupon_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_coupon_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_shipping_zones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "zip_codes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_shipping_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "base_rate" DECIMAL(65,30) NOT NULL,
    "per_unit_rate" DECIMAL(65,30),
    "min_weight" DECIMAL(65,30),
    "max_weight" DECIMAL(65,30),
    "min_order_amount" DECIMAL(65,30),
    "max_order_amount" DECIMAL(65,30),
    "estimated_days_min" INTEGER,
    "estimated_days_max" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_tax_classes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_tax_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_tax_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,30) NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "zip_code" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "compound" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_store_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_store_themes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_store_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_abandoned_carts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "email" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "coupon_code" TEXT,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent_at" TIMESTAMP(3),
    "recovered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_abandoned_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_wishlists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Wishlist',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_wishlist_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_apps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "short_description" TEXT,
    "icon" TEXT,
    "banner" TEXT,
    "category" TEXT,
    "publisher" TEXT,
    "website" TEXT,
    "docs_url" TEXT,
    "support_url" TEXT,
    "pricing_url" TEXT,
    "privacy_url" TEXT,
    "terms_url" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "setup_fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "billingMode" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "install_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_app_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "min_api_version" TEXT,
    "max_api_version" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "release_date" TIMESTAMP(3),
    "download_url" TEXT,
    "file_size" INTEGER,
    "checksum" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_app_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_app_installations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "installing_tenant_id" TEXT NOT NULL,
    "version_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INSTALLING',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "installed_by" TEXT NOT NULL,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_app_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_app_permissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_app_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_subscription_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "billingInterval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "max_users" INTEGER,
    "max_storage" INTEGER,
    "max_api_calls" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscribing_tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingInterval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "activated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_subscription_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_subscription_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_usage_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "usage" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_usage_meters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "aggregationType" TEXT NOT NULL DEFAULT 'SUM',
    "resetPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_usage_meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_invoices_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "billing_tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_invoices_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_invoice_line_items_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_invoice_line_items_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_payments_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL DEFAULT 'CARD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "gateway_transaction_id" TEXT,
    "refunded_amount" DECIMAL(65,30),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_payments_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_payment_methods_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tenant_user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last4" TEXT,
    "brand" TEXT,
    "expiry_month" INTEGER,
    "expiry_year" INTEGER,
    "billingAddress" JSONB,
    "gateway_id" TEXT,
    "gateway_customer_id" TEXT,
    "gateway_payment_method_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_payment_methods_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_coupons_v2" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "max_redemptions" INTEGER,
    "current_redemptions" INTEGER NOT NULL DEFAULT 0,
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_coupons_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_coupon_redemptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_feature_flags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_tenant_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_tenant_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verified_at" TIMESTAMP(3),
    "ssl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ssl_issued_at" TIMESTAMP(3),
    "ssl_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'USER',
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "timeout_ms" INTEGER NOT NULL DEFAULT 5000,
    "last_triggered_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB,
    "response_status" INTEGER,
    "response_body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_attempt_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_api_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "last_chars" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_api_key_scopes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,

    CONSTRAINT "saas_api_key_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_support_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "closed_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_support_ticket_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "authorType" TEXT NOT NULL DEFAULT 'USER',
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_support_ticket_attachments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_support_ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "severity" TEXT NOT NULL DEFAULT 'NORMAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_maintenance_windows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "affected_services" TEXT[],
    "notify_tenants" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_maintenance_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_portfolio_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_portfolio_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risk_mitigations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "risk_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "owner_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_risk_mitigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_resource_allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "allocated_hours" DECIMAL(8,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_resource_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_budgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "allocated" DECIMAL(15,2) NOT NULL,
    "spent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "committed" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fiscal_year" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FILE',
    "file_url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_center_capacities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available_hours" DECIMAL(8,2) NOT NULL,
    "utilized_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_center_capacities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_routes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_lead_time_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_route_operations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "workstation_code" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "setup_minutes" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_route_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_quality_check_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'INSPECTION',
    "checks" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_quality_check_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_quality_checks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "product_id" TEXT NOT NULL,
    "inspector_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checked_qty" DECIMAL(10,2) NOT NULL,
    "passed_qty" DECIMAL(10,2) NOT NULL,
    "failed_qty" DECIMAL(10,2) NOT NULL,
    "result_json" JSONB,
    "notes" TEXT,
    "checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_scrap_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "scrapped_qty" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_detail" TEXT,
    "cost_impact" DECIMAL(15,2),
    "reported_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_scrap_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_time_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "operation_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_min" INTEGER,
    "activityType" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturing_time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_report_filters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_report_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "widget_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL DEFAULT '{}',
    "width" INTEGER NOT NULL DEFAULT 4,
    "height" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_kpi_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_kpi_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_scheduled_exports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataset" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'CSV',
    "schedule" TEXT NOT NULL DEFAULT 'DAILY',
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_scheduled_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "defaultValue" JSONB,
    "options" JSONB,
    "validation" JSONB,
    "uiConfig" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_submissions" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION,
    "avg_time_to_complete" INTEGER,
    "field_stats" JSONB,
    "daily_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'FULL_WIDTH',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "theme_overrides" JSONB,
    "seo_settings" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "content" JSONB,
    "settings" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'MANUAL',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definition_steps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TASK',
    "config" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definition_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "trigger" TEXT,
    "input" JSONB,
    "output" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ollama',
    "model_id" TEXT NOT NULL,
    "version" TEXT,
    "description" TEXT,
    "capabilities" JSONB DEFAULT '[]',
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_deployments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "endpoint" TEXT,
    "api_key" TEXT,
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "prompt" TEXT NOT NULL,
    "variables" JSONB,
    "config" JSONB,
    "tags" TEXT[],
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "context" JSONB,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversation_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "latency" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "token_count" INTEGER,
    "chunk_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_document_chunks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "token_count" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_embeddings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "chunk_id" TEXT,
    "vector" vector(1536) NOT NULL,
    "model" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "system_prompt" TEXT,
    "model_id" TEXT,
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_tools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FUNCTION',
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_training_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model_id" TEXT,
    "dataset" JSONB,
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_training_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_training_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "epoch" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB,
    "loss" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_training_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GROUP',
    "description" TEXT,
    "topic" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_room_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_room_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" TEXT NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message_reactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_receipts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_call_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ONE_TO_ONE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "created_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_call_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_call_participants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "status" TEXT NOT NULL DEFAULT 'JOINED',
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_call_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_file_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_id" TEXT,
    "message_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT,
    "thumbnail" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_file_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'ALL',
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_folders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "path" TEXT,
    "size" BIGINT NOT NULL DEFAULT 0,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_folder_permissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_folder_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_files" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT,
    "size" BIGINT NOT NULL DEFAULT 0,
    "storage_path" TEXT NOT NULL,
    "checksum" TEXT,
    "owner_id" TEXT NOT NULL,
    "description" TEXT,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_file_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "storage_path" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB,
    "uploaded_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_file_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_file_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_share_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "password" TEXT,
    "expires_at" TIMESTAMP(3),
    "max_downloads" INTEGER,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_storage_quotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    "storage_limit" BIGINT NOT NULL DEFAULT 1073741824,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "folder_count" INTEGER NOT NULL DEFAULT 0,
    "trashed_size" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drive_storage_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drive_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "entity_name" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecurringOrderTemplateToSalesOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecurringOrderTemplateToSalesOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "app_settings_tenant_id_app_slug_idx" ON "app_settings"("tenant_id", "app_slug");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_tenant_id_app_slug_key_scope_role_id_key" ON "app_settings"("tenant_id", "app_slug", "key", "scope", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_credentials_provider_key_key" ON "platform_credentials"("provider", "key");

-- CreateIndex
CREATE INDEX "knowledge_base_categories_tenant_id_idx" ON "knowledge_base_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "knowledge_base_categories_tenant_id_parent_id_idx" ON "knowledge_base_categories"("tenant_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_categories_tenant_id_slug_key" ON "knowledge_base_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_tenant_id_idx" ON "knowledge_base_articles"("tenant_id");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_tenant_id_category_id_idx" ON "knowledge_base_articles"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_tenant_id_status_idx" ON "knowledge_base_articles"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_articles_tenant_id_slug_key" ON "knowledge_base_articles"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "knowledge_base_article_versions_tenant_id_idx" ON "knowledge_base_article_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "knowledge_base_article_versions_article_id_idx" ON "knowledge_base_article_versions"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_article_versions_article_id_version_key" ON "knowledge_base_article_versions"("article_id", "version");

-- CreateIndex
CREATE INDEX "customer_price_lists_tenant_id_idx" ON "customer_price_lists"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_price_lists_tenant_id_customer_id_name_key" ON "customer_price_lists"("tenant_id", "customer_id", "name");

-- CreateIndex
CREATE INDEX "customer_price_list_items_tenant_id_idx" ON "customer_price_list_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_price_list_items_price_list_id_product_id_min_quan_key" ON "customer_price_list_items"("price_list_id", "product_id", "min_quantity");

-- CreateIndex
CREATE INDEX "floor_price_overrides_tenant_id_idx" ON "floor_price_overrides"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_price_overrides_tenant_id_product_id_customer_id_key" ON "floor_price_overrides"("tenant_id", "product_id", "customer_id");

-- CreateIndex
CREATE INDEX "product_bundles_tenant_id_idx" ON "product_bundles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundles_tenant_id_name_key" ON "product_bundles"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "product_bundle_items_tenant_id_idx" ON "product_bundle_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundle_items_bundle_id_product_id_key" ON "product_bundle_items"("bundle_id", "product_id");

-- CreateIndex
CREATE INDEX "cross_sell_rules_tenant_id_idx" ON "cross_sell_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "cross_sell_rules_product_id_idx" ON "cross_sell_rules"("product_id");

-- CreateIndex
CREATE INDEX "upsell_rules_tenant_id_idx" ON "upsell_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "upsell_rules_product_id_idx" ON "upsell_rules"("product_id");

-- CreateIndex
CREATE INDEX "team_splits_tenant_id_idx" ON "team_splits"("tenant_id");

-- CreateIndex
CREATE INDEX "team_split_members_tenant_id_idx" ON "team_split_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_split_members_split_id_user_id_key" ON "team_split_members"("split_id", "user_id");

-- CreateIndex
CREATE INDEX "sales_territory_forecasts_tenant_id_idx" ON "sales_territory_forecasts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_territory_forecasts_tenant_id_territory_id_period_key" ON "sales_territory_forecasts"("tenant_id", "territory_id", "period");

-- CreateIndex
CREATE INDEX "sales_territory_realignments_tenant_id_idx" ON "sales_territory_realignments"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_territory_realignments_territory_id_idx" ON "sales_territory_realignments"("territory_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_sources_tenant_id_idx" ON "crm_enrichment_sources"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_rules_tenant_id_idx" ON "crm_enrichment_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_field_mappings_tenant_id_idx" ON "crm_enrichment_field_mappings"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_logs_tenant_id_idx" ON "crm_enrichment_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_logs_object_id_idx" ON "crm_enrichment_logs"("object_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_logs_source_id_idx" ON "crm_enrichment_logs"("source_id");

-- CreateIndex
CREATE INDEX "crm_lead_enrichment_data_tenant_id_idx" ON "crm_lead_enrichment_data"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_lead_enrichment_data_lead_id_idx" ON "crm_lead_enrichment_data"("lead_id");

-- CreateIndex
CREATE INDEX "crm_enrichment_schedules_tenant_id_idx" ON "crm_enrichment_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_next_best_action_configs_tenant_id_idx" ON "crm_next_best_action_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_next_best_action_configs_stage_id_idx" ON "crm_next_best_action_configs"("stage_id");

-- CreateIndex
CREATE INDEX "crm_action_suggestions_tenant_id_idx" ON "crm_action_suggestions"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_action_suggestions_object_id_idx" ON "crm_action_suggestions"("object_id");

-- CreateIndex
CREATE INDEX "crm_action_suggestions_status_idx" ON "crm_action_suggestions"("status");

-- CreateIndex
CREATE INDEX "crm_guided_selling_playbooks_tenant_id_idx" ON "crm_guided_selling_playbooks"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_deal_readiness_scores_tenant_id_idx" ON "crm_deal_readiness_scores"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_deal_readiness_scores_opportunity_id_idx" ON "crm_deal_readiness_scores"("opportunity_id");

-- CreateIndex
CREATE INDEX "crm_contract_amendments_tenant_id_idx" ON "crm_contract_amendments"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_amendments_contract_id_idx" ON "crm_contract_amendments"("contract_id");

-- CreateIndex
CREATE INDEX "crm_contract_price_escalation_rules_tenant_id_idx" ON "crm_contract_price_escalation_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_price_escalation_rules_contract_id_idx" ON "crm_contract_price_escalation_rules"("contract_id");

-- CreateIndex
CREATE INDEX "crm_contract_auto_renewal_logs_tenant_id_idx" ON "crm_contract_auto_renewal_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_auto_renewal_logs_contract_id_idx" ON "crm_contract_auto_renewal_logs"("contract_id");

-- CreateIndex
CREATE INDEX "crm_contract_expiration_pipeline_items_tenant_id_idx" ON "crm_contract_expiration_pipeline_items"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_expiration_pipeline_items_contract_id_idx" ON "crm_contract_expiration_pipeline_items"("contract_id");

-- CreateIndex
CREATE INDEX "crm_contract_expiration_pipeline_items_stage_idx" ON "crm_contract_expiration_pipeline_items"("stage");

-- CreateIndex
CREATE INDEX "crm_contract_templates_tenant_id_idx" ON "crm_contract_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contract_clauses_tenant_id_idx" ON "crm_contract_clauses"("tenant_id");

-- CreateIndex
CREATE INDEX "performance_obligations_tenant_id_idx" ON "performance_obligations"("tenant_id");

-- CreateIndex
CREATE INDEX "performance_obligations_tenant_id_status_idx" ON "performance_obligations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "asc606_contract_modifications_tenant_id_idx" ON "asc606_contract_modifications"("tenant_id");

-- CreateIndex
CREATE INDEX "asc606_contract_modifications_tenant_id_contract_ref_idx" ON "asc606_contract_modifications"("tenant_id", "contract_ref");

-- CreateIndex
CREATE INDEX "asc606_deferred_revenue_roll_forwards_tenant_id_idx" ON "asc606_deferred_revenue_roll_forwards"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "asc606_deferred_revenue_roll_forwards_tenant_id_org_id_peri_key" ON "asc606_deferred_revenue_roll_forwards"("tenant_id", "org_id", "period");

-- CreateIndex
CREATE INDEX "transfer_pricing_policies_tenant_id_idx" ON "transfer_pricing_policies"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_pricing_policies_tenant_id_is_active_idx" ON "transfer_pricing_policies"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "transfer_pricing_adjustments_tenant_id_idx" ON "transfer_pricing_adjustments"("tenant_id");

-- CreateIndex
CREATE INDEX "transfer_pricing_adjustments_tenant_id_fiscal_year_idx" ON "transfer_pricing_adjustments"("tenant_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "transfer_pricing_adjustments_policy_id_idx" ON "transfer_pricing_adjustments"("policy_id");

-- CreateIndex
CREATE INDEX "apportionment_factors_tenant_id_idx" ON "apportionment_factors"("tenant_id");

-- CreateIndex
CREATE INDEX "apportionment_factors_tenant_id_fiscal_year_idx" ON "apportionment_factors"("tenant_id", "fiscal_year");

-- CreateIndex
CREATE UNIQUE INDEX "apportionment_factors_tenant_id_org_id_fiscal_year_jurisdic_key" ON "apportionment_factors"("tenant_id", "org_id", "fiscal_year", "jurisdiction", "factor_type");

-- CreateIndex
CREATE INDEX "fair_value_measurements_tenant_id_idx" ON "fair_value_measurements"("tenant_id");

-- CreateIndex
CREATE INDEX "fair_value_measurements_tenant_id_instrument_type_instrumen_idx" ON "fair_value_measurements"("tenant_id", "instrument_type", "instrument_id");

-- CreateIndex
CREATE INDEX "fair_value_measurements_tenant_id_measurement_date_idx" ON "fair_value_measurements"("tenant_id", "measurement_date");

-- CreateIndex
CREATE INDEX "expected_credit_loss_provisions_tenant_id_idx" ON "expected_credit_loss_provisions"("tenant_id");

-- CreateIndex
CREATE INDEX "expected_credit_loss_provisions_tenant_id_period_idx" ON "expected_credit_loss_provisions"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "expected_credit_loss_provisions_tenant_id_stage_idx" ON "expected_credit_loss_provisions"("tenant_id", "stage");

-- CreateIndex
CREATE INDEX "budget_templates_tenant_id_idx" ON "budget_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_templates_tenant_id_fiscal_year_idx" ON "budget_templates"("tenant_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "budget_commitments_tenant_id_idx" ON "budget_commitments"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_commitments_tenant_id_budget_id_idx" ON "budget_commitments"("tenant_id", "budget_id");

-- CreateIndex
CREATE INDEX "budget_commitments_tenant_id_status_idx" ON "budget_commitments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "budget_carry_forward_rules_tenant_id_idx" ON "budget_carry_forward_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_revisions_tenant_id_idx" ON "budget_revisions"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_revisions_tenant_id_budget_id_idx" ON "budget_revisions"("tenant_id", "budget_id");

-- CreateIndex
CREATE INDEX "netting_groups_tenant_id_idx" ON "netting_groups"("tenant_id");

-- CreateIndex
CREATE INDEX "netting_group_members_tenant_id_idx" ON "netting_group_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "netting_group_members_tenant_id_group_id_org_id_key" ON "netting_group_members"("tenant_id", "group_id", "org_id");

-- CreateIndex
CREATE INDEX "netting_runs_tenant_id_idx" ON "netting_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "netting_runs_tenant_id_group_id_idx" ON "netting_runs"("tenant_id", "group_id");

-- CreateIndex
CREATE INDEX "netting_run_details_netting_run_id_idx" ON "netting_run_details"("netting_run_id");

-- CreateIndex
CREATE INDEX "settlement_instructions_tenant_id_idx" ON "settlement_instructions"("tenant_id");

-- CreateIndex
CREATE INDEX "settlement_instructions_netting_run_id_idx" ON "settlement_instructions"("netting_run_id");

-- CreateIndex
CREATE INDEX "settlement_instructions_tenant_id_status_idx" ON "settlement_instructions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "customer_portal_messages_tenant_id_idx" ON "customer_portal_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_portal_messages_portal_user_id_idx" ON "customer_portal_messages"("portal_user_id");

-- CreateIndex
CREATE INDEX "portal_document_access_tenant_id_idx" ON "portal_document_access"("tenant_id");

-- CreateIndex
CREATE INDEX "portal_document_access_portal_user_id_idx" ON "portal_document_access"("portal_user_id");

-- CreateIndex
CREATE INDEX "portal_activity_logs_tenant_id_idx" ON "portal_activity_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "portal_activity_logs_portal_user_id_idx" ON "portal_activity_logs"("portal_user_id");

-- CreateIndex
CREATE INDEX "campaign_workflows_tenant_id_idx" ON "campaign_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "campaign_workflow_steps_tenant_id_idx" ON "campaign_workflow_steps"("tenant_id");

-- CreateIndex
CREATE INDEX "campaign_workflow_steps_workflow_id_idx" ON "campaign_workflow_steps"("workflow_id");

-- CreateIndex
CREATE INDEX "campaign_workflow_stats_tenant_id_idx" ON "campaign_workflow_stats"("tenant_id");

-- CreateIndex
CREATE INDEX "ab_test_campaigns_tenant_id_idx" ON "ab_test_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "ab_test_results_tenant_id_idx" ON "ab_test_results"("tenant_id");

-- CreateIndex
CREATE INDEX "ab_test_results_test_id_idx" ON "ab_test_results"("test_id");

-- CreateIndex
CREATE INDEX "campaign_rois_tenant_id_idx" ON "campaign_rois"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_rois_tenant_id_campaign_id_period_start_period_end_key" ON "campaign_rois"("tenant_id", "campaign_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "health_score_configs_tenant_id_idx" ON "health_score_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_score_configs_tenant_id_name_key" ON "health_score_configs"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "renewal_risk_predictions_tenant_id_idx" ON "renewal_risk_predictions"("tenant_id");

-- CreateIndex
CREATE INDEX "renewal_risk_predictions_customer_id_idx" ON "renewal_risk_predictions"("customer_id");

-- CreateIndex
CREATE INDEX "churn_analyses_tenant_id_idx" ON "churn_analyses"("tenant_id");

-- CreateIndex
CREATE INDEX "churn_analyses_customer_id_idx" ON "churn_analyses"("customer_id");

-- CreateIndex
CREATE INDEX "expansion_revenues_tenant_id_idx" ON "expansion_revenues"("tenant_id");

-- CreateIndex
CREATE INDEX "expansion_revenues_customer_id_idx" ON "expansion_revenues"("customer_id");

-- CreateIndex
CREATE INDEX "nps_surveys_tenant_id_idx" ON "nps_surveys"("tenant_id");

-- CreateIndex
CREATE INDEX "nps_responses_tenant_id_idx" ON "nps_responses"("tenant_id");

-- CreateIndex
CREATE INDEX "nps_responses_survey_id_idx" ON "nps_responses"("survey_id");

-- CreateIndex
CREATE INDEX "nps_analytics_tenant_id_idx" ON "nps_analytics"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "nps_analytics_tenant_id_survey_id_key" ON "nps_analytics"("tenant_id", "survey_id");

-- CreateIndex
CREATE INDEX "field_sales_routes_tenant_id_idx" ON "field_sales_routes"("tenant_id");

-- CreateIndex
CREATE INDEX "field_sales_routes_assigned_to_id_idx" ON "field_sales_routes"("assigned_to_id");

-- CreateIndex
CREATE INDEX "field_sales_route_stops_tenant_id_idx" ON "field_sales_route_stops"("tenant_id");

-- CreateIndex
CREATE INDEX "field_sales_route_stops_route_id_idx" ON "field_sales_route_stops"("route_id");

-- CreateIndex
CREATE INDEX "field_sales_checkins_tenant_id_idx" ON "field_sales_checkins"("tenant_id");

-- CreateIndex
CREATE INDEX "field_sales_checkins_user_id_idx" ON "field_sales_checkins"("user_id");

-- CreateIndex
CREATE INDEX "field_sales_expenses_tenant_id_idx" ON "field_sales_expenses"("tenant_id");

-- CreateIndex
CREATE INDEX "field_sales_expenses_user_id_idx" ON "field_sales_expenses"("user_id");

-- CreateIndex
CREATE INDEX "field_sales_meeting_reports_tenant_id_idx" ON "field_sales_meeting_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "field_sales_meeting_reports_customer_id_idx" ON "field_sales_meeting_reports"("customer_id");

-- CreateIndex
CREATE INDEX "field_sales_meeting_reports_user_id_idx" ON "field_sales_meeting_reports"("user_id");

-- CreateIndex
CREATE INDEX "predictive_lead_score_models_tenant_id_idx" ON "predictive_lead_score_models"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "predictive_lead_score_models_tenant_id_name_key" ON "predictive_lead_score_models"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "pipeline_velocities_tenant_id_idx" ON "pipeline_velocities"("tenant_id");

-- CreateIndex
CREATE INDEX "pipeline_velocities_pipeline_id_idx" ON "pipeline_velocities"("pipeline_id");

-- CreateIndex
CREATE INDEX "sales_cycle_analytics_tenant_id_idx" ON "sales_cycle_analytics"("tenant_id");

-- CreateIndex
CREATE INDEX "forecast_accuracy_audits_tenant_id_idx" ON "forecast_accuracy_audits"("tenant_id");

-- CreateIndex
CREATE INDEX "rebate_agreements_tenant_id_idx" ON "rebate_agreements"("tenant_id");

-- CreateIndex
CREATE INDEX "rebate_agreements_customer_id_idx" ON "rebate_agreements"("customer_id");

-- CreateIndex
CREATE INDEX "rebate_claims_tenant_id_idx" ON "rebate_claims"("tenant_id");

-- CreateIndex
CREATE INDEX "rebate_claims_agreement_id_idx" ON "rebate_claims"("agreement_id");

-- CreateIndex
CREATE INDEX "rebate_accruals_tenant_id_idx" ON "rebate_accruals"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rebate_accruals_tenant_id_agreement_id_period_name_key" ON "rebate_accruals"("tenant_id", "agreement_id", "period_name");

-- CreateIndex
CREATE INDEX "product_config_rules_tenant_id_idx" ON "product_config_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "product_config_rules_product_id_idx" ON "product_config_rules"("product_id");

-- CreateIndex
CREATE INDEX "quote_comparisons_tenant_id_idx" ON "quote_comparisons"("tenant_id");

-- CreateIndex
CREATE INDEX "quote_comparisons_opportunity_id_idx" ON "quote_comparisons"("opportunity_id");

-- CreateIndex
CREATE INDEX "quote_markup_approvals_tenant_id_idx" ON "quote_markup_approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "quote_markup_approvals_quotation_id_idx" ON "quote_markup_approvals"("quotation_id");

-- CreateIndex
CREATE INDEX "proposal_documents_tenant_id_idx" ON "proposal_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "proposal_documents_quotation_id_idx" ON "proposal_documents"("quotation_id");

-- CreateIndex
CREATE INDEX "account_teams_tenant_id_idx" ON "account_teams"("tenant_id");

-- CreateIndex
CREATE INDEX "account_teams_customer_id_idx" ON "account_teams"("customer_id");

-- CreateIndex
CREATE INDEX "account_team_members_tenant_id_idx" ON "account_team_members"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_team_members_tenant_id_team_id_user_id_key" ON "account_team_members"("tenant_id", "team_id", "user_id");

-- CreateIndex
CREATE INDEX "deal_desk_requests_tenant_id_idx" ON "deal_desk_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_desk_requests_opportunity_id_idx" ON "deal_desk_requests"("opportunity_id");

-- CreateIndex
CREATE INDEX "sales_notes_tenant_id_idx" ON "sales_notes"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_notes_entity_type_entity_id_idx" ON "sales_notes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "competitive_intelligence_tenant_id_idx" ON "competitive_intelligence"("tenant_id");

-- CreateIndex
CREATE INDEX "competitive_intelligence_competitor_idx" ON "competitive_intelligence"("competitor");

-- CreateIndex
CREATE INDEX "deal_alerts_tenant_id_idx" ON "deal_alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_alerts_opportunity_id_idx" ON "deal_alerts"("opportunity_id");

-- CreateIndex
CREATE INDEX "partner_deal_registrations_tenant_id_idx" ON "partner_deal_registrations"("tenant_id");

-- CreateIndex
CREATE INDEX "partner_deal_registrations_partner_id_idx" ON "partner_deal_registrations"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_deal_registrations_tenant_id_registration_number_key" ON "partner_deal_registrations"("tenant_id", "registration_number");

-- CreateIndex
CREATE INDEX "mdf_programs_tenant_id_idx" ON "mdf_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "mdf_claims_tenant_id_idx" ON "mdf_claims"("tenant_id");

-- CreateIndex
CREATE INDEX "mdf_claims_program_id_idx" ON "mdf_claims"("program_id");

-- CreateIndex
CREATE INDEX "partner_performance_metrics_tenant_id_idx" ON "partner_performance_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "partner_performance_metrics_partner_id_idx" ON "partner_performance_metrics"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_performance_metrics_tenant_id_partner_id_period_key" ON "partner_performance_metrics"("tenant_id", "partner_id", "period");

-- CreateIndex
CREATE INDEX "customer_catalogs_tenant_id_idx" ON "customer_catalogs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_catalogs_tenant_id_customer_id_name_key" ON "customer_catalogs"("tenant_id", "customer_id", "name");

-- CreateIndex
CREATE INDEX "customer_catalog_items_tenant_id_idx" ON "customer_catalog_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_catalog_items_tenant_id_catalog_id_product_id_key" ON "customer_catalog_items"("tenant_id", "catalog_id", "product_id");

-- CreateIndex
CREATE INDEX "bulk_order_uploads_tenant_id_idx" ON "bulk_order_uploads"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_order_templates_tenant_id_idx" ON "recurring_order_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_order_templates_customer_id_idx" ON "recurring_order_templates"("customer_id");

-- CreateIndex
CREATE INDEX "recurring_order_template_items_tenant_id_idx" ON "recurring_order_template_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_approval_workflows_tenant_id_idx" ON "order_approval_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "order_approval_workflow_steps_tenant_id_idx" ON "order_approval_workflow_steps"("tenant_id");

-- CreateIndex
CREATE INDEX "order_approval_requests_tenant_id_idx" ON "order_approval_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "order_approval_requests_order_id_idx" ON "order_approval_requests"("order_id");

-- CreateIndex
CREATE INDEX "order_approval_actions_tenant_id_idx" ON "order_approval_actions"("tenant_id");

-- CreateIndex
CREATE INDEX "return_merchandise_authorizations_tenant_id_idx" ON "return_merchandise_authorizations"("tenant_id");

-- CreateIndex
CREATE INDEX "return_merchandise_authorizations_rma_number_idx" ON "return_merchandise_authorizations"("rma_number");

-- CreateIndex
CREATE INDEX "return_merchandise_authorizations_tenant_id_status_idx" ON "return_merchandise_authorizations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "rma_lines_tenant_id_idx" ON "rma_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "rma_lines_rma_id_idx" ON "rma_lines"("rma_id");

-- CreateIndex
CREATE INDEX "rma_inspections_tenant_id_idx" ON "rma_inspections"("tenant_id");

-- CreateIndex
CREATE INDEX "rma_inspections_rma_id_idx" ON "rma_inspections"("rma_id");

-- CreateIndex
CREATE UNIQUE INDEX "rma_inspections_rma_id_key" ON "rma_inspections"("rma_id");

-- CreateIndex
CREATE INDEX "wave_plans_tenant_id_idx" ON "wave_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "wave_plans_plan_number_idx" ON "wave_plans"("plan_number");

-- CreateIndex
CREATE INDEX "wave_plans_warehouse_id_idx" ON "wave_plans"("warehouse_id");

-- CreateIndex
CREATE INDEX "wave_plans_tenant_id_status_idx" ON "wave_plans"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "wave_plan_tasks_tenant_id_idx" ON "wave_plan_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "wave_plan_tasks_wave_plan_id_idx" ON "wave_plan_tasks"("wave_plan_id");

-- CreateIndex
CREATE INDEX "wave_plan_tasks_assignee_idx" ON "wave_plan_tasks"("assignee");

-- CreateIndex
CREATE INDEX "wave_plan_tasks_tenant_id_status_idx" ON "wave_plan_tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "warehouse_kpis_tenant_id_idx" ON "warehouse_kpis"("tenant_id");

-- CreateIndex
CREATE INDEX "warehouse_kpis_warehouse_id_idx" ON "warehouse_kpis"("warehouse_id");

-- CreateIndex
CREATE INDEX "warehouse_kpis_tenant_id_kpi_date_idx" ON "warehouse_kpis"("tenant_id", "kpi_date");

-- CreateIndex
CREATE INDEX "warehouse_kpis_warehouse_id_kpi_date_idx" ON "warehouse_kpis"("warehouse_id", "kpi_date");

-- CreateIndex
CREATE INDEX "safety_stock_optimizations_tenant_id_idx" ON "safety_stock_optimizations"("tenant_id");

-- CreateIndex
CREATE INDEX "safety_stock_optimizations_product_id_idx" ON "safety_stock_optimizations"("product_id");

-- CreateIndex
CREATE INDEX "safety_stock_optimizations_warehouse_id_idx" ON "safety_stock_optimizations"("warehouse_id");

-- CreateIndex
CREATE INDEX "safety_stock_optimizations_tenant_id_product_id_warehouse_i_idx" ON "safety_stock_optimizations"("tenant_id", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "global_inventory_views_tenant_id_idx" ON "global_inventory_views"("tenant_id");

-- CreateIndex
CREATE INDEX "global_inventory_views_product_id_idx" ON "global_inventory_views"("product_id");

-- CreateIndex
CREATE INDEX "global_inventory_views_tenant_id_product_id_idx" ON "global_inventory_views"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "global_inventory_details_tenant_id_idx" ON "global_inventory_details"("tenant_id");

-- CreateIndex
CREATE INDEX "global_inventory_details_global_view_id_idx" ON "global_inventory_details"("global_view_id");

-- CreateIndex
CREATE INDEX "global_inventory_details_warehouse_id_idx" ON "global_inventory_details"("warehouse_id");

-- CreateIndex
CREATE INDEX "sourcing_projects_tenant_id_idx" ON "sourcing_projects"("tenant_id");

-- CreateIndex
CREATE INDEX "sourcing_projects_project_number_idx" ON "sourcing_projects"("project_number");

-- CreateIndex
CREATE INDEX "sourcing_projects_tenant_id_status_idx" ON "sourcing_projects"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sourcing_participants_tenant_id_idx" ON "sourcing_participants"("tenant_id");

-- CreateIndex
CREATE INDEX "sourcing_participants_project_id_idx" ON "sourcing_participants"("project_id");

-- CreateIndex
CREATE INDEX "supplier_evaluations_tenant_id_idx" ON "supplier_evaluations"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_evaluations_project_id_idx" ON "supplier_evaluations"("project_id");

-- CreateIndex
CREATE INDEX "supplier_evaluations_vendor_id_idx" ON "supplier_evaluations"("vendor_id");

-- CreateIndex
CREATE INDEX "supplier_evaluation_criteria_tenant_id_idx" ON "supplier_evaluation_criteria"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_evaluation_criteria_evaluation_id_idx" ON "supplier_evaluation_criteria"("evaluation_id");

-- CreateIndex
CREATE INDEX "bid_analyses_tenant_id_idx" ON "bid_analyses"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_analyses_project_id_idx" ON "bid_analyses"("project_id");

-- CreateIndex
CREATE INDEX "contract_awards_tenant_id_idx" ON "contract_awards"("tenant_id");

-- CreateIndex
CREATE INDEX "contract_awards_award_number_idx" ON "contract_awards"("award_number");

-- CreateIndex
CREATE INDEX "contract_awards_project_id_idx" ON "contract_awards"("project_id");

-- CreateIndex
CREATE INDEX "procurement_contracts_tenant_id_idx" ON "procurement_contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "procurement_contracts_contract_number_idx" ON "procurement_contracts"("contract_number");

-- CreateIndex
CREATE INDEX "procurement_contracts_vendor_id_idx" ON "procurement_contracts"("vendor_id");

-- CreateIndex
CREATE INDEX "procurement_contracts_tenant_id_status_idx" ON "procurement_contracts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "procurement_contract_price_schedules_tenant_id_idx" ON "procurement_contract_price_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "procurement_contract_price_schedules_contract_id_idx" ON "procurement_contract_price_schedules"("contract_id");

-- CreateIndex
CREATE INDEX "procurement_contract_price_schedules_product_id_idx" ON "procurement_contract_price_schedules"("product_id");

-- CreateIndex
CREATE INDEX "procurement_contract_volume_commitments_tenant_id_idx" ON "procurement_contract_volume_commitments"("tenant_id");

-- CreateIndex
CREATE INDEX "procurement_contract_volume_commitments_contract_id_idx" ON "procurement_contract_volume_commitments"("contract_id");

-- CreateIndex
CREATE INDEX "procurement_contract_sla_clauses_tenant_id_idx" ON "procurement_contract_sla_clauses"("tenant_id");

-- CreateIndex
CREATE INDEX "procurement_contract_sla_clauses_contract_id_idx" ON "procurement_contract_sla_clauses"("contract_id");

-- CreateIndex
CREATE INDEX "procurement_intelligence_tenant_id_idx" ON "procurement_intelligence"("tenant_id");

-- CreateIndex
CREATE INDEX "procurement_intelligence_tenant_id_category_idx" ON "procurement_intelligence"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "procurement_intelligence_tenant_id_report_period_idx" ON "procurement_intelligence"("tenant_id", "report_period");

-- CreateIndex
CREATE INDEX "supplier_onboarding_workflows_tenant_id_idx" ON "supplier_onboarding_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_onboarding_workflows_vendor_id_idx" ON "supplier_onboarding_workflows"("vendor_id");

-- CreateIndex
CREATE INDEX "supplier_onboarding_workflows_tenant_id_status_idx" ON "supplier_onboarding_workflows"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "hs_codes_tenant_id_idx" ON "hs_codes"("tenant_id");

-- CreateIndex
CREATE INDEX "hs_codes_code_idx" ON "hs_codes"("code");

-- CreateIndex
CREATE INDEX "hs_codes_tenant_id_code_idx" ON "hs_codes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "countries_of_origin_tenant_id_idx" ON "countries_of_origin"("tenant_id");

-- CreateIndex
CREATE INDEX "countries_of_origin_country_code_idx" ON "countries_of_origin"("country_code");

-- CreateIndex
CREATE INDEX "import_declarations_tenant_id_idx" ON "import_declarations"("tenant_id");

-- CreateIndex
CREATE INDEX "import_declarations_declaration_number_idx" ON "import_declarations"("declaration_number");

-- CreateIndex
CREATE INDEX "import_declarations_tenant_id_status_idx" ON "import_declarations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "import_declarations_hs_code_id_idx" ON "import_declarations"("hs_code_id");

-- CreateIndex
CREATE INDEX "import_declaration_lines_tenant_id_idx" ON "import_declaration_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "import_declaration_lines_import_declaration_id_idx" ON "import_declaration_lines"("import_declaration_id");

-- CreateIndex
CREATE INDEX "export_declarations_tenant_id_idx" ON "export_declarations"("tenant_id");

-- CreateIndex
CREATE INDEX "export_declarations_declaration_number_idx" ON "export_declarations"("declaration_number");

-- CreateIndex
CREATE INDEX "export_declarations_tenant_id_status_idx" ON "export_declarations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "export_declarations_hs_code_id_idx" ON "export_declarations"("hs_code_id");

-- CreateIndex
CREATE INDEX "export_declaration_lines_tenant_id_idx" ON "export_declaration_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "export_declaration_lines_export_declaration_id_idx" ON "export_declaration_lines"("export_declaration_id");

-- CreateIndex
CREATE INDEX "trade_compliance_screenings_tenant_id_idx" ON "trade_compliance_screenings"("tenant_id");

-- CreateIndex
CREATE INDEX "trade_compliance_screenings_screen_type_idx" ON "trade_compliance_screenings"("screen_type");

-- CreateIndex
CREATE INDEX "trade_compliance_screenings_tenant_id_status_idx" ON "trade_compliance_screenings"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "demand_sense_runs_tenant_id_idx" ON "demand_sense_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "demand_sense_runs_tenant_id_status_idx" ON "demand_sense_runs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "demand_sense_results_tenant_id_idx" ON "demand_sense_results"("tenant_id");

-- CreateIndex
CREATE INDEX "demand_sense_results_run_id_idx" ON "demand_sense_results"("run_id");

-- CreateIndex
CREATE INDEX "demand_sense_results_product_id_idx" ON "demand_sense_results"("product_id");

-- CreateIndex
CREATE INDEX "demand_sense_results_tenant_id_forecast_period_idx" ON "demand_sense_results"("tenant_id", "forecast_period");

-- CreateIndex
CREATE INDEX "supply_plans_tenant_id_idx" ON "supply_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "supply_plans_tenant_id_status_idx" ON "supply_plans"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "supply_plan_lines_tenant_id_idx" ON "supply_plan_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "supply_plan_lines_plan_id_idx" ON "supply_plan_lines"("plan_id");

-- CreateIndex
CREATE INDEX "supply_plan_lines_product_id_idx" ON "supply_plan_lines"("product_id");

-- CreateIndex
CREATE INDEX "supply_plan_lines_tenant_id_period_idx" ON "supply_plan_lines"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "supply_plan_scenarios_tenant_id_idx" ON "supply_plan_scenarios"("tenant_id");

-- CreateIndex
CREATE INDEX "supply_plan_scenarios_plan_id_idx" ON "supply_plan_scenarios"("plan_id");

-- CreateIndex
CREATE INDEX "supply_plan_scenario_lines_tenant_id_idx" ON "supply_plan_scenario_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "supply_plan_scenario_lines_scenario_id_idx" ON "supply_plan_scenario_lines"("scenario_id");

-- CreateIndex
CREATE INDEX "sop_plans_tenant_id_idx" ON "sop_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "sop_plans_tenant_id_fiscal_year_idx" ON "sop_plans"("tenant_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "sop_plans_tenant_id_status_idx" ON "sop_plans"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sop_plan_reviews_tenant_id_idx" ON "sop_plan_reviews"("tenant_id");

-- CreateIndex
CREATE INDEX "sop_plan_reviews_sop_plan_id_idx" ON "sop_plan_reviews"("sop_plan_id");

-- CreateIndex
CREATE INDEX "sop_plan_metrics_tenant_id_idx" ON "sop_plan_metrics"("tenant_id");

-- CreateIndex
CREATE INDEX "sop_plan_metrics_sop_plan_id_idx" ON "sop_plan_metrics"("sop_plan_id");

-- CreateIndex
CREATE INDEX "transport_modes_tenant_id_idx" ON "transport_modes"("tenant_id");

-- CreateIndex
CREATE INDEX "transport_modes_code_idx" ON "transport_modes"("code");

-- CreateIndex
CREATE INDEX "carrier_rates_tenant_id_idx" ON "carrier_rates"("tenant_id");

-- CreateIndex
CREATE INDEX "carrier_rates_carrier_id_idx" ON "carrier_rates"("carrier_id");

-- CreateIndex
CREATE INDEX "carrier_rates_tenant_id_origin_zip_dest_zip_idx" ON "carrier_rates"("tenant_id", "origin_zip", "dest_zip");

-- CreateIndex
CREATE INDEX "load_builds_tenant_id_idx" ON "load_builds"("tenant_id");

-- CreateIndex
CREATE INDEX "load_builds_build_number_idx" ON "load_builds"("build_number");

-- CreateIndex
CREATE INDEX "load_builds_tenant_id_status_idx" ON "load_builds"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "load_build_stops_tenant_id_idx" ON "load_build_stops"("tenant_id");

-- CreateIndex
CREATE INDEX "load_build_stops_load_id_idx" ON "load_build_stops"("load_id");

-- CreateIndex
CREATE INDEX "load_build_items_tenant_id_idx" ON "load_build_items"("tenant_id");

-- CreateIndex
CREATE INDEX "load_build_items_load_id_idx" ON "load_build_items"("load_id");

-- CreateIndex
CREATE INDEX "load_tender_requests_tenant_id_idx" ON "load_tender_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "load_tender_requests_load_id_idx" ON "load_tender_requests"("load_id");

-- CreateIndex
CREATE INDEX "load_tender_requests_tenant_id_status_idx" ON "load_tender_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "appointment_schedules_tenant_id_idx" ON "appointment_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "appointment_schedules_appointment_number_idx" ON "appointment_schedules"("appointment_number");

-- CreateIndex
CREATE INDEX "appointment_schedules_warehouse_id_idx" ON "appointment_schedules"("warehouse_id");

-- CreateIndex
CREATE INDEX "appointment_schedules_tenant_id_status_idx" ON "appointment_schedules"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "appointment_schedules_tenant_id_scheduled_start_idx" ON "appointment_schedules"("tenant_id", "scheduled_start");

-- CreateIndex
CREATE INDEX "delivery_confirmations_tenant_id_idx" ON "delivery_confirmations"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_confirmations_confirmation_number_idx" ON "delivery_confirmations"("confirmation_number");

-- CreateIndex
CREATE INDEX "delivery_confirmations_shipment_id_idx" ON "delivery_confirmations"("shipment_id");

-- CreateIndex
CREATE INDEX "delivery_confirmations_appointment_id_idx" ON "delivery_confirmations"("appointment_id");

-- CreateIndex
CREATE INDEX "delivery_confirmation_lines_tenant_id_idx" ON "delivery_confirmation_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "delivery_confirmation_lines_confirmation_id_idx" ON "delivery_confirmation_lines"("confirmation_id");

-- CreateIndex
CREATE INDEX "supplier_risk_profiles_tenant_id_idx" ON "supplier_risk_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_risk_profiles_vendor_id_idx" ON "supplier_risk_profiles"("vendor_id");

-- CreateIndex
CREATE INDEX "supplier_risk_profiles_tenant_id_risk_category_idx" ON "supplier_risk_profiles"("tenant_id", "risk_category");

-- CreateIndex
CREATE INDEX "supplier_risk_factors_tenant_id_idx" ON "supplier_risk_factors"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_risk_factors_profile_id_idx" ON "supplier_risk_factors"("profile_id");

-- CreateIndex
CREATE INDEX "supplier_risk_factors_factorType_idx" ON "supplier_risk_factors"("factorType");

-- CreateIndex
CREATE INDEX "supplier_risk_alerts_tenant_id_idx" ON "supplier_risk_alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_risk_alerts_profile_id_idx" ON "supplier_risk_alerts"("profile_id");

-- CreateIndex
CREATE INDEX "supplier_risk_alerts_tenant_id_status_idx" ON "supplier_risk_alerts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "supplier_risk_alerts_tenant_id_severity_idx" ON "supplier_risk_alerts"("tenant_id", "severity");

-- CreateIndex
CREATE INDEX "supplier_diversity_records_tenant_id_idx" ON "supplier_diversity_records"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_diversity_records_profile_id_idx" ON "supplier_diversity_records"("profile_id");

-- CreateIndex
CREATE INDEX "supplier_diversity_records_diversity_type_idx" ON "supplier_diversity_records"("diversity_type");

-- CreateIndex
CREATE INDEX "alternative_sourcing_tenant_id_idx" ON "alternative_sourcing"("tenant_id");

-- CreateIndex
CREATE INDEX "alternative_sourcing_product_id_idx" ON "alternative_sourcing"("product_id");

-- CreateIndex
CREATE INDEX "alternative_sourcing_tenant_id_status_idx" ON "alternative_sourcing"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "control_tower_events_tenant_id_idx" ON "control_tower_events"("tenant_id");

-- CreateIndex
CREATE INDEX "control_tower_events_event_number_idx" ON "control_tower_events"("event_number");

-- CreateIndex
CREATE INDEX "control_tower_events_tenant_id_status_idx" ON "control_tower_events"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "control_tower_events_tenant_id_severity_idx" ON "control_tower_events"("tenant_id", "severity");

-- CreateIndex
CREATE INDEX "control_tower_events_eventType_idx" ON "control_tower_events"("eventType");

-- CreateIndex
CREATE INDEX "control_tower_events_tenant_id_created_at_idx" ON "control_tower_events"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "control_tower_actions_tenant_id_idx" ON "control_tower_actions"("tenant_id");

-- CreateIndex
CREATE INDEX "control_tower_actions_event_id_idx" ON "control_tower_actions"("event_id");

-- CreateIndex
CREATE INDEX "control_tower_kpis_tenant_id_idx" ON "control_tower_kpis"("tenant_id");

-- CreateIndex
CREATE INDEX "control_tower_kpis_kpi_code_idx" ON "control_tower_kpis"("kpi_code");

-- CreateIndex
CREATE INDEX "control_tower_kpis_tenant_id_category_idx" ON "control_tower_kpis"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "control_tower_kpis_tenant_id_period_idx" ON "control_tower_kpis"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "control_tower_alert_configs_tenant_id_idx" ON "control_tower_alert_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "control_tower_alert_configs_event_type_idx" ON "control_tower_alert_configs"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "education_students_enrollment_number_key" ON "education_students"("enrollment_number");

-- CreateIndex
CREATE INDEX "education_students_tenant_id_idx" ON "education_students"("tenant_id");

-- CreateIndex
CREATE INDEX "education_students_tenant_id_status_idx" ON "education_students"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "education_students_enrollment_number_idx" ON "education_students"("enrollment_number");

-- CreateIndex
CREATE UNIQUE INDEX "education_courses_code_key" ON "education_courses"("code");

-- CreateIndex
CREATE INDEX "education_courses_tenant_id_idx" ON "education_courses"("tenant_id");

-- CreateIndex
CREATE INDEX "education_courses_code_idx" ON "education_courses"("code");

-- CreateIndex
CREATE INDEX "education_fee_structures_tenant_id_idx" ON "education_fee_structures"("tenant_id");

-- CreateIndex
CREATE INDEX "student_fees_tenant_id_idx" ON "student_fees"("tenant_id");

-- CreateIndex
CREATE INDEX "student_fees_student_id_idx" ON "student_fees"("student_id");

-- CreateIndex
CREATE INDEX "student_fees_fee_structure_id_idx" ON "student_fees"("fee_structure_id");

-- CreateIndex
CREATE INDEX "student_fees_tenant_id_status_idx" ON "student_fees"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "education_books_tenant_id_idx" ON "education_books"("tenant_id");

-- CreateIndex
CREATE INDEX "education_books_isbn_idx" ON "education_books"("isbn");

-- CreateIndex
CREATE INDEX "book_transactions_tenant_id_idx" ON "book_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "book_transactions_student_id_idx" ON "book_transactions"("student_id");

-- CreateIndex
CREATE INDEX "book_transactions_book_id_idx" ON "book_transactions"("book_id");

-- CreateIndex
CREATE INDEX "education_attendance_records_tenant_id_idx" ON "education_attendance_records"("tenant_id");

-- CreateIndex
CREATE INDEX "education_attendance_records_student_id_idx" ON "education_attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "education_attendance_records_course_id_idx" ON "education_attendance_records"("course_id");

-- CreateIndex
CREATE INDEX "education_attendance_records_date_idx" ON "education_attendance_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "education_attendance_records_tenant_id_student_id_course_id_key" ON "education_attendance_records"("tenant_id", "student_id", "course_id", "date");

-- CreateIndex
CREATE INDEX "education_timetables_tenant_id_idx" ON "education_timetables"("tenant_id");

-- CreateIndex
CREATE INDEX "education_timetables_course_id_idx" ON "education_timetables"("course_id");

-- CreateIndex
CREATE INDEX "education_timetables_weekday_idx" ON "education_timetables"("weekday");

-- CreateIndex
CREATE INDEX "education_grades_tenant_id_idx" ON "education_grades"("tenant_id");

-- CreateIndex
CREATE INDEX "education_grades_student_id_idx" ON "education_grades"("student_id");

-- CreateIndex
CREATE INDEX "education_grades_course_id_idx" ON "education_grades"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "education_grades_tenant_id_student_id_course_id_assessment_key" ON "education_grades"("tenant_id", "student_id", "course_id", "assessment");

-- CreateIndex
CREATE INDEX "healthcare_patients_tenant_id_idx" ON "healthcare_patients"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_practitioners_tenant_id_idx" ON "healthcare_practitioners"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_practitioners_employee_id_idx" ON "healthcare_practitioners"("employee_id");

-- CreateIndex
CREATE INDEX "healthcare_appointments_tenant_id_idx" ON "healthcare_appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_appointments_patient_id_idx" ON "healthcare_appointments"("patient_id");

-- CreateIndex
CREATE INDEX "healthcare_appointments_practitioner_id_idx" ON "healthcare_appointments"("practitioner_id");

-- CreateIndex
CREATE INDEX "healthcare_appointments_start_time_idx" ON "healthcare_appointments"("start_time");

-- CreateIndex
CREATE INDEX "healthcare_appointments_tenant_id_status_idx" ON "healthcare_appointments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "healthcare_prescriptions_tenant_id_idx" ON "healthcare_prescriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_prescriptions_patient_id_idx" ON "healthcare_prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "healthcare_prescriptions_practitioner_id_idx" ON "healthcare_prescriptions"("practitioner_id");

-- CreateIndex
CREATE INDEX "healthcare_encounters_tenant_id_idx" ON "healthcare_encounters"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_encounters_patient_id_idx" ON "healthcare_encounters"("patient_id");

-- CreateIndex
CREATE INDEX "healthcare_encounters_practitioner_id_idx" ON "healthcare_encounters"("practitioner_id");

-- CreateIndex
CREATE INDEX "healthcare_drugs_tenant_id_idx" ON "healthcare_drugs"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_drugs_batch_number_idx" ON "healthcare_drugs"("batch_number");

-- CreateIndex
CREATE INDEX "healthcare_drugs_expiry_date_idx" ON "healthcare_drugs"("expiry_date");

-- CreateIndex
CREATE INDEX "healthcare_vitals_tenant_id_idx" ON "healthcare_vitals"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_vitals_patient_id_idx" ON "healthcare_vitals"("patient_id");

-- CreateIndex
CREATE INDEX "healthcare_vitals_recorded_at_idx" ON "healthcare_vitals"("recorded_at");

-- CreateIndex
CREATE INDEX "healthcare_fhir_resources_tenant_id_idx" ON "healthcare_fhir_resources"("tenant_id");

-- CreateIndex
CREATE INDEX "healthcare_fhir_resources_resource_type_idx" ON "healthcare_fhir_resources"("resource_type");

-- CreateIndex
CREATE UNIQUE INDEX "healthcare_fhir_resources_tenant_id_resource_type_resource__key" ON "healthcare_fhir_resources"("tenant_id", "resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "real_estate_properties_tenant_id_idx" ON "real_estate_properties"("tenant_id");

-- CreateIndex
CREATE INDEX "real_estate_properties_parent_id_idx" ON "real_estate_properties"("parent_id");

-- CreateIndex
CREATE INDEX "real_estate_properties_tenant_id_type_idx" ON "real_estate_properties"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "real_estate_properties_tenant_id_status_idx" ON "real_estate_properties"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "real_estate_leases_tenant_id_idx" ON "real_estate_leases"("tenant_id");

-- CreateIndex
CREATE INDEX "real_estate_leases_property_id_idx" ON "real_estate_leases"("property_id");

-- CreateIndex
CREATE INDEX "real_estate_leases_tenant_id_status_idx" ON "real_estate_leases"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "real_estate_tenants_tenant_id_idx" ON "real_estate_tenants"("tenant_id");

-- CreateIndex
CREATE INDEX "real_estate_tenants_property_id_idx" ON "real_estate_tenants"("property_id");

-- CreateIndex
CREATE INDEX "real_estate_maintenance_work_orders_tenant_id_idx" ON "real_estate_maintenance_work_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "real_estate_maintenance_work_orders_property_id_idx" ON "real_estate_maintenance_work_orders"("property_id");

-- CreateIndex
CREATE INDEX "real_estate_maintenance_work_orders_tenant_id_status_idx" ON "real_estate_maintenance_work_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "real_estate_commissions_tenant_id_idx" ON "real_estate_commissions"("tenant_id");

-- CreateIndex
CREATE INDEX "real_estate_commissions_agent_id_idx" ON "real_estate_commissions"("agent_id");

-- CreateIndex
CREATE INDEX "real_estate_commissions_tenant_id_status_idx" ON "real_estate_commissions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "field_service_tickets_tenant_id_idx" ON "field_service_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "field_service_tickets_tenant_id_status_idx" ON "field_service_tickets"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "field_service_tickets_tenant_id_priority_idx" ON "field_service_tickets"("tenant_id", "priority");

-- CreateIndex
CREATE INDEX "field_service_dispatches_tenant_id_idx" ON "field_service_dispatches"("tenant_id");

-- CreateIndex
CREATE INDEX "field_service_dispatches_ticket_id_idx" ON "field_service_dispatches"("ticket_id");

-- CreateIndex
CREATE INDEX "field_service_dispatches_technician_id_idx" ON "field_service_dispatches"("technician_id");

-- CreateIndex
CREATE INDEX "field_service_dispatches_scheduled_time_idx" ON "field_service_dispatches"("scheduled_time");

-- CreateIndex
CREATE INDEX "field_service_technicians_tenant_id_idx" ON "field_service_technicians"("tenant_id");

-- CreateIndex
CREATE INDEX "field_service_technicians_employee_id_idx" ON "field_service_technicians"("employee_id");

-- CreateIndex
CREATE INDEX "field_service_preventive_maintenances_tenant_id_idx" ON "field_service_preventive_maintenances"("tenant_id");

-- CreateIndex
CREATE INDEX "field_service_checklists_tenant_id_idx" ON "field_service_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_shift_cash_drawers_tenant_id_idx" ON "pos_shift_cash_drawers"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_shift_cash_drawers_shift_id_idx" ON "pos_shift_cash_drawers"("shift_id");

-- CreateIndex
CREATE INDEX "pos_shift_transactions_tenant_id_idx" ON "pos_shift_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_shift_transactions_shift_id_idx" ON "pos_shift_transactions"("shift_id");

-- CreateIndex
CREATE INDEX "pos_registers_v2_tenant_id_idx" ON "pos_registers_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_registers_v2_terminal_id_idx" ON "pos_registers_v2"("terminal_id");

-- CreateIndex
CREATE INDEX "pos_registers_v2_tenant_id_status_idx" ON "pos_registers_v2"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_payment_methods_tenant_id_idx" ON "pos_payment_methods"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_refunds_refund_number_key" ON "pos_refunds"("refund_number");

-- CreateIndex
CREATE INDEX "pos_refunds_tenant_id_idx" ON "pos_refunds"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_refunds_original_order_id_idx" ON "pos_refunds"("original_order_id");

-- CreateIndex
CREATE INDEX "pos_refunds_refund_number_idx" ON "pos_refunds"("refund_number");

-- CreateIndex
CREATE INDEX "pos_refund_items_tenant_id_idx" ON "pos_refund_items"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_refund_items_refund_id_idx" ON "pos_refund_items"("refund_id");

-- CreateIndex
CREATE INDEX "pos_gift_cards_v2_tenant_id_idx" ON "pos_gift_cards_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_gift_cards_v2_code_idx" ON "pos_gift_cards_v2"("code");

-- CreateIndex
CREATE INDEX "pos_gift_card_transactions_v2_tenant_id_idx" ON "pos_gift_card_transactions_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_gift_card_transactions_v2_gift_card_id_idx" ON "pos_gift_card_transactions_v2"("gift_card_id");

-- CreateIndex
CREATE INDEX "pos_customer_displays_tenant_id_idx" ON "pos_customer_displays"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_customer_displays_terminal_id_idx" ON "pos_customer_displays"("terminal_id");

-- CreateIndex
CREATE INDEX "pos_order_types_tenant_id_idx" ON "pos_order_types"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_discount_rules_tenant_id_idx" ON "pos_discount_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_discount_rules_tenant_id_status_idx" ON "pos_discount_rules"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_tax_rules_tenant_id_idx" ON "pos_tax_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_kitchen_displays_tenant_id_idx" ON "pos_kitchen_displays"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_kitchen_orders_tenant_id_idx" ON "pos_kitchen_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_kitchen_orders_kitchen_display_id_idx" ON "pos_kitchen_orders"("kitchen_display_id");

-- CreateIndex
CREATE INDEX "pos_kitchen_orders_order_id_idx" ON "pos_kitchen_orders"("order_id");

-- CreateIndex
CREATE INDEX "pos_kitchen_orders_tenant_id_status_idx" ON "pos_kitchen_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_split_payments_tenant_id_idx" ON "pos_split_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_split_payments_order_id_idx" ON "pos_split_payments"("order_id");

-- CreateIndex
CREATE INDEX "ecommerce_stores_tenant_id_idx" ON "ecommerce_stores"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_stores_slug_idx" ON "ecommerce_stores"("slug");

-- CreateIndex
CREATE INDEX "ecommerce_categories_tenant_id_idx" ON "ecommerce_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_categories_store_id_idx" ON "ecommerce_categories"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_categories_slug_idx" ON "ecommerce_categories"("slug");

-- CreateIndex
CREATE INDEX "ecommerce_categories_parent_id_idx" ON "ecommerce_categories"("parent_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_listings_tenant_id_idx" ON "ecommerce_product_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_listings_store_id_idx" ON "ecommerce_product_listings"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_listings_product_id_idx" ON "ecommerce_product_listings"("product_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_listings_category_id_idx" ON "ecommerce_product_listings"("category_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_listings_slug_idx" ON "ecommerce_product_listings"("slug");

-- CreateIndex
CREATE INDEX "ecommerce_product_variants_tenant_id_idx" ON "ecommerce_product_variants"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_variants_listing_id_idx" ON "ecommerce_product_variants"("listing_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_variants_sku_idx" ON "ecommerce_product_variants"("sku");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_tenant_id_idx" ON "ecommerce_inventory"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_inventory_variant_id_idx" ON "ecommerce_inventory"("variant_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_tenant_id_idx" ON "ecommerce_carts"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_store_id_idx" ON "ecommerce_carts"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_session_id_idx" ON "ecommerce_carts"("session_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_customer_id_idx" ON "ecommerce_carts"("customer_id");

-- CreateIndex
CREATE INDEX "ecommerce_cart_items_tenant_id_idx" ON "ecommerce_cart_items"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_cart_items_cart_id_idx" ON "ecommerce_cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_orders_order_number_key" ON "ecommerce_orders"("order_number");

-- CreateIndex
CREATE INDEX "ecommerce_orders_tenant_id_idx" ON "ecommerce_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_orders_store_id_idx" ON "ecommerce_orders"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_orders_customer_id_idx" ON "ecommerce_orders"("customer_id");

-- CreateIndex
CREATE INDEX "ecommerce_orders_status_idx" ON "ecommerce_orders"("status");

-- CreateIndex
CREATE INDEX "ecommerce_orders_order_number_idx" ON "ecommerce_orders"("order_number");

-- CreateIndex
CREATE INDEX "ecommerce_order_items_tenant_id_idx" ON "ecommerce_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_order_items_order_id_idx" ON "ecommerce_order_items"("order_id");

-- CreateIndex
CREATE INDEX "ecommerce_payments_tenant_id_idx" ON "ecommerce_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_payments_order_id_idx" ON "ecommerce_payments"("order_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipments_tenant_id_idx" ON "ecommerce_shipments"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipments_order_id_idx" ON "ecommerce_shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_returns_return_number_key" ON "ecommerce_returns"("return_number");

-- CreateIndex
CREATE INDEX "ecommerce_returns_tenant_id_idx" ON "ecommerce_returns"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_returns_order_id_idx" ON "ecommerce_returns"("order_id");

-- CreateIndex
CREATE INDEX "ecommerce_reviews_tenant_id_idx" ON "ecommerce_reviews"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_reviews_listing_id_idx" ON "ecommerce_reviews"("listing_id");

-- CreateIndex
CREATE INDEX "ecommerce_review_media_tenant_id_idx" ON "ecommerce_review_media"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_review_media_review_id_idx" ON "ecommerce_review_media"("review_id");

-- CreateIndex
CREATE INDEX "ecommerce_coupons_tenant_id_idx" ON "ecommerce_coupons"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_coupons_store_id_idx" ON "ecommerce_coupons"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_coupons_code_idx" ON "ecommerce_coupons"("code");

-- CreateIndex
CREATE INDEX "ecommerce_coupon_usage_tenant_id_idx" ON "ecommerce_coupon_usage"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_coupon_usage_coupon_id_idx" ON "ecommerce_coupon_usage"("coupon_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipping_zones_tenant_id_idx" ON "ecommerce_shipping_zones"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipping_zones_store_id_idx" ON "ecommerce_shipping_zones"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipping_rates_tenant_id_idx" ON "ecommerce_shipping_rates"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_shipping_rates_zone_id_idx" ON "ecommerce_shipping_rates"("zone_id");

-- CreateIndex
CREATE INDEX "ecommerce_tax_classes_tenant_id_idx" ON "ecommerce_tax_classes"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_tax_classes_store_id_idx" ON "ecommerce_tax_classes"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_tax_rates_tenant_id_idx" ON "ecommerce_tax_rates"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_tax_rates_class_id_idx" ON "ecommerce_tax_rates"("class_id");

-- CreateIndex
CREATE INDEX "ecommerce_store_settings_tenant_id_idx" ON "ecommerce_store_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_store_settings_store_id_key_key" ON "ecommerce_store_settings"("store_id", "key");

-- CreateIndex
CREATE INDEX "ecommerce_store_themes_tenant_id_idx" ON "ecommerce_store_themes"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_store_themes_store_id_idx" ON "ecommerce_store_themes"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_abandoned_carts_tenant_id_idx" ON "ecommerce_abandoned_carts"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_abandoned_carts_store_id_idx" ON "ecommerce_abandoned_carts"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_abandoned_carts_session_id_idx" ON "ecommerce_abandoned_carts"("session_id");

-- CreateIndex
CREATE INDEX "ecommerce_wishlists_tenant_id_idx" ON "ecommerce_wishlists"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_wishlists_store_id_idx" ON "ecommerce_wishlists"("store_id");

-- CreateIndex
CREATE INDEX "ecommerce_wishlists_customer_id_idx" ON "ecommerce_wishlists"("customer_id");

-- CreateIndex
CREATE INDEX "ecommerce_wishlist_items_tenant_id_idx" ON "ecommerce_wishlist_items"("tenant_id");

-- CreateIndex
CREATE INDEX "ecommerce_wishlist_items_wishlist_id_idx" ON "ecommerce_wishlist_items"("wishlist_id");

-- CreateIndex
CREATE INDEX "saas_apps_tenant_id_idx" ON "saas_apps"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_apps_slug_idx" ON "saas_apps"("slug");

-- CreateIndex
CREATE INDEX "saas_apps_is_published_idx" ON "saas_apps"("is_published");

-- CreateIndex
CREATE INDEX "saas_app_versions_tenant_id_idx" ON "saas_app_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_app_versions_app_id_idx" ON "saas_app_versions"("app_id");

-- CreateIndex
CREATE INDEX "saas_app_installations_tenant_id_idx" ON "saas_app_installations"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_app_installations_app_id_idx" ON "saas_app_installations"("app_id");

-- CreateIndex
CREATE INDEX "saas_app_installations_installing_tenant_id_idx" ON "saas_app_installations"("installing_tenant_id");

-- CreateIndex
CREATE INDEX "saas_app_permissions_tenant_id_idx" ON "saas_app_permissions"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_app_permissions_app_id_idx" ON "saas_app_permissions"("app_id");

-- CreateIndex
CREATE INDEX "saas_subscription_plans_tenant_id_idx" ON "saas_subscription_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_subscription_plans_slug_idx" ON "saas_subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "saas_subscriptions_tenant_id_idx" ON "saas_subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_subscriptions_subscribing_tenant_id_idx" ON "saas_subscriptions"("subscribing_tenant_id");

-- CreateIndex
CREATE INDEX "saas_subscriptions_plan_id_idx" ON "saas_subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "saas_subscriptions_status_idx" ON "saas_subscriptions"("status");

-- CreateIndex
CREATE INDEX "saas_subscription_line_items_tenant_id_idx" ON "saas_subscription_line_items"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_subscription_line_items_subscription_id_idx" ON "saas_subscription_line_items"("subscription_id");

-- CreateIndex
CREATE INDEX "saas_usage_records_tenant_id_idx" ON "saas_usage_records"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_usage_records_subscription_id_idx" ON "saas_usage_records"("subscription_id");

-- CreateIndex
CREATE INDEX "saas_usage_records_meter_id_idx" ON "saas_usage_records"("meter_id");

-- CreateIndex
CREATE INDEX "saas_usage_meters_tenant_id_idx" ON "saas_usage_meters"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_usage_meters_slug_idx" ON "saas_usage_meters"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "saas_invoices_v2_invoice_number_key" ON "saas_invoices_v2"("invoice_number");

-- CreateIndex
CREATE INDEX "saas_invoices_v2_tenant_id_idx" ON "saas_invoices_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_invoices_v2_subscription_id_idx" ON "saas_invoices_v2"("subscription_id");

-- CreateIndex
CREATE INDEX "saas_invoices_v2_billing_tenant_id_idx" ON "saas_invoices_v2"("billing_tenant_id");

-- CreateIndex
CREATE INDEX "saas_invoices_v2_status_idx" ON "saas_invoices_v2"("status");

-- CreateIndex
CREATE INDEX "saas_invoice_line_items_v2_tenant_id_idx" ON "saas_invoice_line_items_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_invoice_line_items_v2_invoice_id_idx" ON "saas_invoice_line_items_v2"("invoice_id");

-- CreateIndex
CREATE INDEX "saas_payments_v2_tenant_id_idx" ON "saas_payments_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_payments_v2_invoice_id_idx" ON "saas_payments_v2"("invoice_id");

-- CreateIndex
CREATE INDEX "saas_payments_v2_subscription_id_idx" ON "saas_payments_v2"("subscription_id");

-- CreateIndex
CREATE INDEX "saas_payment_methods_v2_tenant_id_idx" ON "saas_payment_methods_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_payment_methods_v2_tenant_user_id_idx" ON "saas_payment_methods_v2"("tenant_user_id");

-- CreateIndex
CREATE INDEX "saas_coupons_v2_tenant_id_idx" ON "saas_coupons_v2"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_coupons_v2_code_idx" ON "saas_coupons_v2"("code");

-- CreateIndex
CREATE INDEX "saas_coupon_redemptions_tenant_id_idx" ON "saas_coupon_redemptions"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_coupon_redemptions_coupon_id_idx" ON "saas_coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "saas_feature_flags_tenant_id_idx" ON "saas_feature_flags"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_feature_flags_slug_idx" ON "saas_feature_flags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "saas_tenant_settings_tenant_id_category_key_key" ON "saas_tenant_settings"("tenant_id", "category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "saas_tenant_domains_domain_key" ON "saas_tenant_domains"("domain");

-- CreateIndex
CREATE INDEX "saas_tenant_domains_tenant_id_idx" ON "saas_tenant_domains"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_tenant_domains_domain_idx" ON "saas_tenant_domains"("domain");

-- CreateIndex
CREATE INDEX "saas_audit_logs_tenant_id_idx" ON "saas_audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_audit_logs_actor_id_idx" ON "saas_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "saas_audit_logs_action_idx" ON "saas_audit_logs"("action");

-- CreateIndex
CREATE INDEX "saas_audit_logs_resource_resource_id_idx" ON "saas_audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "saas_audit_logs_created_at_idx" ON "saas_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "saas_webhook_endpoints_tenant_id_idx" ON "saas_webhook_endpoints"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_webhook_deliveries_tenant_id_idx" ON "saas_webhook_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_webhook_deliveries_endpoint_id_idx" ON "saas_webhook_deliveries"("endpoint_id");

-- CreateIndex
CREATE INDEX "saas_webhook_deliveries_status_idx" ON "saas_webhook_deliveries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "saas_api_keys_key_key" ON "saas_api_keys"("key");

-- CreateIndex
CREATE INDEX "saas_api_keys_tenant_id_idx" ON "saas_api_keys"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_api_keys_key_idx" ON "saas_api_keys"("key");

-- CreateIndex
CREATE INDEX "saas_api_key_scopes_tenant_id_idx" ON "saas_api_key_scopes"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_api_key_scopes_api_key_id_idx" ON "saas_api_key_scopes"("api_key_id");

-- CreateIndex
CREATE INDEX "saas_support_tickets_tenant_id_idx" ON "saas_support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_support_tickets_status_idx" ON "saas_support_tickets"("status");

-- CreateIndex
CREATE INDEX "saas_support_tickets_assigned_to_idx" ON "saas_support_tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "saas_support_tickets_priority_idx" ON "saas_support_tickets"("priority");

-- CreateIndex
CREATE INDEX "saas_support_ticket_messages_tenant_id_idx" ON "saas_support_ticket_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_support_ticket_messages_ticket_id_idx" ON "saas_support_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "saas_support_ticket_attachments_tenant_id_idx" ON "saas_support_ticket_attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_support_ticket_attachments_message_id_idx" ON "saas_support_ticket_attachments"("message_id");

-- CreateIndex
CREATE INDEX "saas_announcements_tenant_id_idx" ON "saas_announcements"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_announcements_starts_at_expires_at_idx" ON "saas_announcements"("starts_at", "expires_at");

-- CreateIndex
CREATE INDEX "saas_maintenance_windows_tenant_id_idx" ON "saas_maintenance_windows"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_maintenance_windows_status_idx" ON "saas_maintenance_windows"("status");

-- CreateIndex
CREATE INDEX "project_portfolio_members_tenant_id_idx" ON "project_portfolio_members"("tenant_id");

-- CreateIndex
CREATE INDEX "project_portfolio_members_portfolio_id_idx" ON "project_portfolio_members"("portfolio_id");

-- CreateIndex
CREATE INDEX "project_risk_mitigations_tenant_id_idx" ON "project_risk_mitigations"("tenant_id");

-- CreateIndex
CREATE INDEX "project_risk_mitigations_risk_id_idx" ON "project_risk_mitigations"("risk_id");

-- CreateIndex
CREATE INDEX "project_resource_allocations_tenant_id_idx" ON "project_resource_allocations"("tenant_id");

-- CreateIndex
CREATE INDEX "project_resource_allocations_project_id_idx" ON "project_resource_allocations"("project_id");

-- CreateIndex
CREATE INDEX "project_budgets_tenant_id_idx" ON "project_budgets"("tenant_id");

-- CreateIndex
CREATE INDEX "project_budgets_project_id_idx" ON "project_budgets"("project_id");

-- CreateIndex
CREATE INDEX "project_documents_tenant_id_idx" ON "project_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "project_documents_project_id_idx" ON "project_documents"("project_id");

-- CreateIndex
CREATE INDEX "project_activities_tenant_id_idx" ON "project_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "project_activities_project_id_idx" ON "project_activities"("project_id");

-- CreateIndex
CREATE INDEX "work_center_capacities_tenant_id_idx" ON "work_center_capacities"("tenant_id");

-- CreateIndex
CREATE INDEX "work_center_capacities_workstation_id_idx" ON "work_center_capacities"("workstation_id");

-- CreateIndex
CREATE INDEX "manufacturing_routes_tenant_id_idx" ON "manufacturing_routes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_routes_tenant_id_code_key" ON "manufacturing_routes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "manufacturing_route_operations_tenant_id_idx" ON "manufacturing_route_operations"("tenant_id");

-- CreateIndex
CREATE INDEX "manufacturing_route_operations_route_id_idx" ON "manufacturing_route_operations"("route_id");

-- CreateIndex
CREATE INDEX "manufacturing_quality_check_templates_tenant_id_idx" ON "manufacturing_quality_check_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_quality_check_templates_tenant_id_code_key" ON "manufacturing_quality_check_templates"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "manufacturing_quality_checks_tenant_id_idx" ON "manufacturing_quality_checks"("tenant_id");

-- CreateIndex
CREATE INDEX "manufacturing_quality_checks_template_id_idx" ON "manufacturing_quality_checks"("template_id");

-- CreateIndex
CREATE INDEX "manufacturing_quality_checks_work_order_id_idx" ON "manufacturing_quality_checks"("work_order_id");

-- CreateIndex
CREATE INDEX "manufacturing_scrap_records_tenant_id_idx" ON "manufacturing_scrap_records"("tenant_id");

-- CreateIndex
CREATE INDEX "manufacturing_scrap_records_work_order_id_idx" ON "manufacturing_scrap_records"("work_order_id");

-- CreateIndex
CREATE INDEX "manufacturing_scrap_records_product_id_idx" ON "manufacturing_scrap_records"("product_id");

-- CreateIndex
CREATE INDEX "manufacturing_time_entries_tenant_id_idx" ON "manufacturing_time_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "manufacturing_time_entries_work_order_id_idx" ON "manufacturing_time_entries"("work_order_id");

-- CreateIndex
CREATE INDEX "manufacturing_time_entries_employee_id_idx" ON "manufacturing_time_entries"("employee_id");

-- CreateIndex
CREATE INDEX "analytics_report_filters_tenant_id_idx" ON "analytics_report_filters"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_report_filters_report_id_idx" ON "analytics_report_filters"("report_id");

-- CreateIndex
CREATE INDEX "analytics_dashboard_widgets_tenant_id_idx" ON "analytics_dashboard_widgets"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_dashboard_widgets_dashboard_id_idx" ON "analytics_dashboard_widgets"("dashboard_id");

-- CreateIndex
CREATE INDEX "analytics_kpi_values_tenant_id_idx" ON "analytics_kpi_values"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_kpi_values_kpi_id_idx" ON "analytics_kpi_values"("kpi_id");

-- CreateIndex
CREATE INDEX "analytics_kpi_values_period_start_period_end_idx" ON "analytics_kpi_values"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "analytics_scheduled_exports_tenant_id_idx" ON "analytics_scheduled_exports"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_scheduled_exports_is_active_next_run_at_idx" ON "analytics_scheduled_exports"("is_active", "next_run_at");

-- CreateIndex
CREATE INDEX "form_templates_tenant_id_idx" ON "form_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "form_templates_tenant_id_slug_idx" ON "form_templates"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "form_fields_tenant_id_idx" ON "form_fields"("tenant_id");

-- CreateIndex
CREATE INDEX "form_fields_template_id_idx" ON "form_fields"("template_id");

-- CreateIndex
CREATE INDEX "form_submissions_tenant_id_idx" ON "form_submissions"("tenant_id");

-- CreateIndex
CREATE INDEX "form_submissions_template_id_idx" ON "form_submissions"("template_id");

-- CreateIndex
CREATE INDEX "form_analytics_tenant_id_idx" ON "form_analytics"("tenant_id");

-- CreateIndex
CREATE INDEX "form_analytics_template_id_idx" ON "form_analytics"("template_id");

-- CreateIndex
CREATE INDEX "page_templates_tenant_id_idx" ON "page_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "page_templates_tenant_id_slug_idx" ON "page_templates"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "page_sections_tenant_id_idx" ON "page_sections"("tenant_id");

-- CreateIndex
CREATE INDEX "page_sections_template_id_idx" ON "page_sections"("template_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_idx" ON "workflow_definitions"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_slug_idx" ON "workflow_definitions"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "workflow_definition_steps_tenant_id_idx" ON "workflow_definition_steps"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_definition_steps_definition_id_idx" ON "workflow_definition_steps"("definition_id");

-- CreateIndex
CREATE INDEX "workflow_executions_tenant_id_idx" ON "workflow_executions"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_executions_definition_id_idx" ON "workflow_executions"("definition_id");

-- CreateIndex
CREATE INDEX "ai_models_tenant_id_idx" ON "ai_models"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_models_tenant_id_provider_idx" ON "ai_models"("tenant_id", "provider");

-- CreateIndex
CREATE INDEX "ai_model_deployments_tenant_id_idx" ON "ai_model_deployments"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_model_deployments_model_id_idx" ON "ai_model_deployments"("model_id");

-- CreateIndex
CREATE INDEX "ai_prompts_tenant_id_idx" ON "ai_prompts"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_prompts_tenant_id_category_idx" ON "ai_prompts"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_idx" ON "ai_conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_user_id_idx" ON "ai_conversations"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_conversation_messages_tenant_id_idx" ON "ai_conversation_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversation_messages_conversation_id_idx" ON "ai_conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_documents_tenant_id_idx" ON "ai_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_document_chunks_tenant_id_idx" ON "ai_document_chunks"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_document_chunks_document_id_idx" ON "ai_document_chunks"("document_id");

-- CreateIndex
CREATE INDEX "ai_embeddings_tenant_id_idx" ON "ai_embeddings"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_embeddings_chunk_id_idx" ON "ai_embeddings"("chunk_id");

-- CreateIndex
CREATE INDEX "ai_agents_tenant_id_idx" ON "ai_agents"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_agents_tenant_id_slug_idx" ON "ai_agents"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "ai_agent_tools_tenant_id_idx" ON "ai_agent_tools"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_agent_tools_agent_id_idx" ON "ai_agent_tools"("agent_id");

-- CreateIndex
CREATE INDEX "ai_training_jobs_tenant_id_idx" ON "ai_training_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_training_runs_tenant_id_idx" ON "ai_training_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_training_runs_job_id_idx" ON "ai_training_runs"("job_id");

-- CreateIndex
CREATE INDEX "chat_rooms_tenant_id_idx" ON "chat_rooms"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_rooms_tenant_id_type_idx" ON "chat_rooms"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "chat_room_members_tenant_id_idx" ON "chat_room_members"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_room_members_room_id_idx" ON "chat_room_members"("room_id");

-- CreateIndex
CREATE INDEX "chat_room_members_user_id_idx" ON "chat_room_members"("user_id");

-- CreateIndex
CREATE INDEX "chat_messages_tenant_id_idx" ON "chat_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages"("room_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "chat_message_reactions_tenant_id_idx" ON "chat_message_reactions"("tenant_id");

-- CreateIndex
CREATE INDEX "chat_message_reactions_message_id_idx" ON "chat_message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "message_read_receipts_tenant_id_idx" ON "message_read_receipts"("tenant_id");

-- CreateIndex
CREATE INDEX "message_read_receipts_message_id_idx" ON "message_read_receipts"("message_id");

-- CreateIndex
CREATE INDEX "message_read_receipts_user_id_idx" ON "message_read_receipts"("user_id");

-- CreateIndex
CREATE INDEX "video_call_rooms_tenant_id_idx" ON "video_call_rooms"("tenant_id");

-- CreateIndex
CREATE INDEX "video_call_participants_tenant_id_idx" ON "video_call_participants"("tenant_id");

-- CreateIndex
CREATE INDEX "video_call_participants_call_id_idx" ON "video_call_participants"("call_id");

-- CreateIndex
CREATE INDEX "communication_file_shares_tenant_id_idx" ON "communication_file_shares"("tenant_id");

-- CreateIndex
CREATE INDEX "communication_file_shares_room_id_idx" ON "communication_file_shares"("room_id");

-- CreateIndex
CREATE INDEX "announcements_tenant_id_idx" ON "announcements"("tenant_id");

-- CreateIndex
CREATE INDEX "announcement_targets_tenant_id_idx" ON "announcement_targets"("tenant_id");

-- CreateIndex
CREATE INDEX "announcement_targets_announcement_id_idx" ON "announcement_targets"("announcement_id");

-- CreateIndex
CREATE INDEX "drive_folders_tenant_id_idx" ON "drive_folders"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_folders_parent_id_idx" ON "drive_folders"("parent_id");

-- CreateIndex
CREATE INDEX "drive_folders_tenant_id_is_deleted_idx" ON "drive_folders"("tenant_id", "is_deleted");

-- CreateIndex
CREATE INDEX "drive_folders_tenant_id_is_starred_idx" ON "drive_folders"("tenant_id", "is_starred");

-- CreateIndex
CREATE INDEX "drive_folder_permissions_tenant_id_idx" ON "drive_folder_permissions"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_folder_permissions_folder_id_idx" ON "drive_folder_permissions"("folder_id");

-- CreateIndex
CREATE INDEX "drive_folder_permissions_user_id_idx" ON "drive_folder_permissions"("user_id");

-- CreateIndex
CREATE INDEX "drive_files_tenant_id_idx" ON "drive_files"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_files_folder_id_idx" ON "drive_files"("folder_id");

-- CreateIndex
CREATE INDEX "drive_files_tenant_id_is_deleted_idx" ON "drive_files"("tenant_id", "is_deleted");

-- CreateIndex
CREATE INDEX "drive_files_tenant_id_is_starred_idx" ON "drive_files"("tenant_id", "is_starred");

-- CreateIndex
CREATE INDEX "drive_file_versions_tenant_id_idx" ON "drive_file_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_file_versions_file_id_idx" ON "drive_file_versions"("file_id");

-- CreateIndex
CREATE INDEX "drive_file_comments_tenant_id_idx" ON "drive_file_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_file_comments_file_id_idx" ON "drive_file_comments"("file_id");

-- CreateIndex
CREATE INDEX "drive_file_comments_parent_id_idx" ON "drive_file_comments"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "drive_share_links_token_key" ON "drive_share_links"("token");

-- CreateIndex
CREATE INDEX "drive_share_links_tenant_id_idx" ON "drive_share_links"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_share_links_file_id_idx" ON "drive_share_links"("file_id");

-- CreateIndex
CREATE INDEX "drive_share_links_token_idx" ON "drive_share_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "drive_storage_quotas_tenant_id_key" ON "drive_storage_quotas"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_activities_tenant_id_idx" ON "drive_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "drive_activities_user_id_idx" ON "drive_activities"("user_id");

-- CreateIndex
CREATE INDEX "drive_activities_tenant_id_created_at_idx" ON "drive_activities"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "_RecurringOrderTemplateToSalesOrder_B_index" ON "_RecurringOrderTemplateToSalesOrder"("B");

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

-- AddForeignKey
ALTER TABLE "knowledge_base_categories" ADD CONSTRAINT "knowledge_base_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "knowledge_base_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_base_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_article_versions" ADD CONSTRAINT "knowledge_base_article_versions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_base_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_price_list_items" ADD CONSTRAINT "customer_price_list_items_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "customer_price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundle_items" ADD CONSTRAINT "product_bundle_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_split_members" ADD CONSTRAINT "team_split_members_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "team_splits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_territory_forecasts" ADD CONSTRAINT "sales_territory_forecasts_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_territory_realignments" ADD CONSTRAINT "sales_territory_realignments_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_enrichment_rules" ADD CONSTRAINT "crm_enrichment_rules_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crm_enrichment_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_enrichment_field_mappings" ADD CONSTRAINT "crm_enrichment_field_mappings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crm_enrichment_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_enrichment_logs" ADD CONSTRAINT "crm_enrichment_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crm_enrichment_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_lead_enrichment_data" ADD CONSTRAINT "crm_lead_enrichment_data_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "crm_enrichment_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_enrichment_schedules" ADD CONSTRAINT "crm_enrichment_schedules_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "crm_enrichment_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_amendments" ADD CONSTRAINT "crm_contract_amendments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_price_escalation_rules" ADD CONSTRAINT "crm_contract_price_escalation_rules_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_auto_renewal_logs" ADD CONSTRAINT "crm_contract_auto_renewal_logs_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contract_expiration_pipeline_items" ADD CONSTRAINT "crm_contract_expiration_pipeline_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_obligations" ADD CONSTRAINT "performance_obligations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "performance_obligations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_pricing_adjustments" ADD CONSTRAINT "transfer_pricing_adjustments_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "transfer_pricing_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_commitments" ADD CONSTRAINT "budget_commitments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_revisions" ADD CONSTRAINT "budget_revisions_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_group_members" ADD CONSTRAINT "netting_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "netting_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_runs" ADD CONSTRAINT "netting_runs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "netting_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "netting_run_details" ADD CONSTRAINT "netting_run_details_netting_run_id_fkey" FOREIGN KEY ("netting_run_id") REFERENCES "netting_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_instructions" ADD CONSTRAINT "settlement_instructions_netting_run_id_fkey" FOREIGN KEY ("netting_run_id") REFERENCES "netting_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_messages" ADD CONSTRAINT "customer_portal_messages_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "customer_portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_document_access" ADD CONSTRAINT "portal_document_access_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "customer_portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_activity_logs" ADD CONSTRAINT "portal_activity_logs_portal_user_id_fkey" FOREIGN KEY ("portal_user_id") REFERENCES "customer_portal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_workflow_steps" ADD CONSTRAINT "campaign_workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "campaign_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_workflow_stats" ADD CONSTRAINT "campaign_workflow_stats_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "campaign_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "ab_test_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_risk_predictions" ADD CONSTRAINT "renewal_risk_predictions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churn_analyses" ADD CONSTRAINT "churn_analyses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_revenues" ADD CONSTRAINT "expansion_revenues_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "nps_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_analytics" ADD CONSTRAINT "nps_analytics_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "nps_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_sales_route_stops" ADD CONSTRAINT "field_sales_route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "field_sales_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_sales_checkins" ADD CONSTRAINT "field_sales_checkins_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_sales_checkins" ADD CONSTRAINT "field_sales_checkins_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "field_sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_sales_meeting_reports" ADD CONSTRAINT "field_sales_meeting_reports_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rebate_claims" ADD CONSTRAINT "rebate_claims_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "rebate_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rebate_accruals" ADD CONSTRAINT "rebate_accruals_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "rebate_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_teams" ADD CONSTRAINT "account_teams_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_team_members" ADD CONSTRAINT "account_team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "account_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_desk_requests" ADD CONSTRAINT "deal_desk_requests_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_alerts" ADD CONSTRAINT "deal_alerts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_deal_registrations" ADD CONSTRAINT "partner_deal_registrations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "sales_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mdf_claims" ADD CONSTRAINT "mdf_claims_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "mdf_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_catalogs" ADD CONSTRAINT "customer_catalogs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_catalog_items" ADD CONSTRAINT "customer_catalog_items_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "customer_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_catalog_items" ADD CONSTRAINT "customer_catalog_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_order_templates" ADD CONSTRAINT "recurring_order_templates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_order_template_items" ADD CONSTRAINT "recurring_order_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "recurring_order_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_approval_workflow_steps" ADD CONSTRAINT "order_approval_workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "order_approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_approval_actions" ADD CONSTRAINT "order_approval_actions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "order_approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_lines" ADD CONSTRAINT "rma_lines_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "return_merchandise_authorizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rma_inspections" ADD CONSTRAINT "rma_inspections_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "return_merchandise_authorizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wave_plan_tasks" ADD CONSTRAINT "wave_plan_tasks_wave_plan_id_fkey" FOREIGN KEY ("wave_plan_id") REFERENCES "wave_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_inventory_details" ADD CONSTRAINT "global_inventory_details_global_view_id_fkey" FOREIGN KEY ("global_view_id") REFERENCES "global_inventory_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_participants" ADD CONSTRAINT "sourcing_participants_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sourcing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sourcing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_evaluation_criteria" ADD CONSTRAINT "supplier_evaluation_criteria_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "supplier_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_analyses" ADD CONSTRAINT "bid_analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sourcing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_awards" ADD CONSTRAINT "contract_awards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "sourcing_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contract_price_schedules" ADD CONSTRAINT "procurement_contract_price_schedules_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "procurement_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contract_volume_commitments" ADD CONSTRAINT "procurement_contract_volume_commitments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "procurement_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_contract_sla_clauses" ADD CONSTRAINT "procurement_contract_sla_clauses_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "procurement_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_declarations" ADD CONSTRAINT "import_declarations_hs_code_id_fkey" FOREIGN KEY ("hs_code_id") REFERENCES "hs_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_declaration_lines" ADD CONSTRAINT "import_declaration_lines_import_declaration_id_fkey" FOREIGN KEY ("import_declaration_id") REFERENCES "import_declarations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_declarations" ADD CONSTRAINT "export_declarations_hs_code_id_fkey" FOREIGN KEY ("hs_code_id") REFERENCES "hs_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_declaration_lines" ADD CONSTRAINT "export_declaration_lines_export_declaration_id_fkey" FOREIGN KEY ("export_declaration_id") REFERENCES "export_declarations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_sense_results" ADD CONSTRAINT "demand_sense_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "demand_sense_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_plan_lines" ADD CONSTRAINT "supply_plan_lines_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "supply_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_plan_scenarios" ADD CONSTRAINT "supply_plan_scenarios_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "supply_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_plan_scenario_lines" ADD CONSTRAINT "supply_plan_scenario_lines_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "supply_plan_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_plan_reviews" ADD CONSTRAINT "sop_plan_reviews_sop_plan_id_fkey" FOREIGN KEY ("sop_plan_id") REFERENCES "sop_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_plan_metrics" ADD CONSTRAINT "sop_plan_metrics_sop_plan_id_fkey" FOREIGN KEY ("sop_plan_id") REFERENCES "sop_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_build_stops" ADD CONSTRAINT "load_build_stops_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "load_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_build_items" ADD CONSTRAINT "load_build_items_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "load_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_tender_requests" ADD CONSTRAINT "load_tender_requests_load_id_fkey" FOREIGN KEY ("load_id") REFERENCES "load_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_confirmations" ADD CONSTRAINT "delivery_confirmations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_confirmation_lines" ADD CONSTRAINT "delivery_confirmation_lines_confirmation_id_fkey" FOREIGN KEY ("confirmation_id") REFERENCES "delivery_confirmations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_risk_factors" ADD CONSTRAINT "supplier_risk_factors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "supplier_risk_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_risk_alerts" ADD CONSTRAINT "supplier_risk_alerts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "supplier_risk_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_diversity_records" ADD CONSTRAINT "supplier_diversity_records_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "supplier_risk_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_tower_actions" ADD CONSTRAINT "control_tower_actions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "control_tower_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "education_fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_transactions" ADD CONSTRAINT "book_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_transactions" ADD CONSTRAINT "book_transactions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "education_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_attendance_records" ADD CONSTRAINT "education_attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_attendance_records" ADD CONSTRAINT "education_attendance_records_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_timetables" ADD CONSTRAINT "education_timetables_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_grades" ADD CONSTRAINT "education_grades_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_appointments" ADD CONSTRAINT "healthcare_appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_appointments" ADD CONSTRAINT "healthcare_appointments_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_prescriptions" ADD CONSTRAINT "healthcare_prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_prescriptions" ADD CONSTRAINT "healthcare_prescriptions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_encounters" ADD CONSTRAINT "healthcare_encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_encounters" ADD CONSTRAINT "healthcare_encounters_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_vitals" ADD CONSTRAINT "healthcare_vitals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_properties" ADD CONSTRAINT "real_estate_properties_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "real_estate_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_leases" ADD CONSTRAINT "real_estate_leases_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_tenants" ADD CONSTRAINT "real_estate_tenants_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_maintenance_work_orders" ADD CONSTRAINT "real_estate_maintenance_work_orders_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_service_dispatches" ADD CONSTRAINT "field_service_dispatches_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "field_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_shift_cash_drawers" ADD CONSTRAINT "pos_shift_cash_drawers_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "pos_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_shift_transactions" ADD CONSTRAINT "pos_shift_transactions_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "pos_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_refund_items" ADD CONSTRAINT "pos_refund_items_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "pos_refunds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_gift_card_transactions_v2" ADD CONSTRAINT "pos_gift_card_transactions_v2_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "pos_gift_cards_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_categories" ADD CONSTRAINT "ecommerce_categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_categories" ADD CONSTRAINT "ecommerce_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "ecommerce_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_listings" ADD CONSTRAINT "ecommerce_product_listings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_listings" ADD CONSTRAINT "ecommerce_product_listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ecommerce_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_variants" ADD CONSTRAINT "ecommerce_product_variants_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "ecommerce_product_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_inventory" ADD CONSTRAINT "ecommerce_inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ecommerce_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_carts" ADD CONSTRAINT "ecommerce_carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "ecommerce_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ecommerce_product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_orders" ADD CONSTRAINT "ecommerce_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_items" ADD CONSTRAINT "ecommerce_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_items" ADD CONSTRAINT "ecommerce_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ecommerce_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_payments" ADD CONSTRAINT "ecommerce_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_shipments" ADD CONSTRAINT "ecommerce_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_returns" ADD CONSTRAINT "ecommerce_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_reviews" ADD CONSTRAINT "ecommerce_reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "ecommerce_product_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_reviews" ADD CONSTRAINT "ecommerce_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_review_media" ADD CONSTRAINT "ecommerce_review_media_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "ecommerce_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_coupons" ADD CONSTRAINT "ecommerce_coupons_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_coupon_usage" ADD CONSTRAINT "ecommerce_coupon_usage_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "ecommerce_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_shipping_zones" ADD CONSTRAINT "ecommerce_shipping_zones_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_shipping_rates" ADD CONSTRAINT "ecommerce_shipping_rates_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "ecommerce_shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_tax_classes" ADD CONSTRAINT "ecommerce_tax_classes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_tax_rates" ADD CONSTRAINT "ecommerce_tax_rates_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "ecommerce_tax_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_store_settings" ADD CONSTRAINT "ecommerce_store_settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_store_themes" ADD CONSTRAINT "ecommerce_store_themes_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_abandoned_carts" ADD CONSTRAINT "ecommerce_abandoned_carts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_wishlists" ADD CONSTRAINT "ecommerce_wishlists_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "ecommerce_stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_wishlist_items" ADD CONSTRAINT "ecommerce_wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "ecommerce_wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_wishlist_items" ADD CONSTRAINT "ecommerce_wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ecommerce_product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_app_versions" ADD CONSTRAINT "saas_app_versions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "saas_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_app_installations" ADD CONSTRAINT "saas_app_installations_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "saas_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_app_installations" ADD CONSTRAINT "saas_app_installations_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "saas_app_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_app_permissions" ADD CONSTRAINT "saas_app_permissions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "saas_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_subscriptions" ADD CONSTRAINT "saas_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "saas_subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_subscription_line_items" ADD CONSTRAINT "saas_subscription_line_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "saas_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_usage_records" ADD CONSTRAINT "saas_usage_records_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "saas_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_usage_records" ADD CONSTRAINT "saas_usage_records_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "saas_usage_meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_invoices_v2" ADD CONSTRAINT "saas_invoices_v2_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "saas_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_invoice_line_items_v2" ADD CONSTRAINT "saas_invoice_line_items_v2_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "saas_invoices_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_payments_v2" ADD CONSTRAINT "saas_payments_v2_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "saas_invoices_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_coupon_redemptions" ADD CONSTRAINT "saas_coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "saas_coupons_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_coupon_redemptions" ADD CONSTRAINT "saas_coupon_redemptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "saas_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_webhook_deliveries" ADD CONSTRAINT "saas_webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "saas_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_api_key_scopes" ADD CONSTRAINT "saas_api_key_scopes_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "saas_api_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_support_ticket_messages" ADD CONSTRAINT "saas_support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "saas_support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_support_ticket_attachments" ADD CONSTRAINT "saas_support_ticket_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "saas_support_ticket_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_portfolio_members" ADD CONSTRAINT "project_portfolio_members_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "project_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risk_mitigations" ADD CONSTRAINT "project_risk_mitigations_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "project_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resource_allocations" ADD CONSTRAINT "project_resource_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_budgets" ADD CONSTRAINT "project_budgets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_center_capacities" ADD CONSTRAINT "work_center_capacities_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_route_operations" ADD CONSTRAINT "manufacturing_route_operations_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "manufacturing_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_quality_checks" ADD CONSTRAINT "manufacturing_quality_checks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "manufacturing_quality_check_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_report_filters" ADD CONSTRAINT "analytics_report_filters_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboard_widgets" ADD CONSTRAINT "analytics_dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_kpi_values" ADD CONSTRAINT "analytics_kpi_values_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "kpis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_templates" ADD CONSTRAINT "page_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "page_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definition_steps" ADD CONSTRAINT "workflow_definition_steps_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_deployments" ADD CONSTRAINT "ai_model_deployments_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_deployments" ADD CONSTRAINT "ai_model_deployments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation_messages" ADD CONSTRAINT "ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_documents" ADD CONSTRAINT "ai_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_document_chunks" ADD CONSTRAINT "ai_document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "ai_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_tools" ADD CONSTRAINT "ai_agent_tools_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_training_jobs" ADD CONSTRAINT "ai_training_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_training_runs" ADD CONSTRAINT "ai_training_runs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ai_training_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message_reactions" ADD CONSTRAINT "chat_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_call_rooms" ADD CONSTRAINT "video_call_rooms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_call_participants" ADD CONSTRAINT "video_call_participants_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "video_call_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_file_shares" ADD CONSTRAINT "communication_file_shares_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "drive_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folders" ADD CONSTRAINT "drive_folders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_folder_permissions" ADD CONSTRAINT "drive_folder_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_files" ADD CONSTRAINT "drive_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_versions" ADD CONSTRAINT "drive_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_comments" ADD CONSTRAINT "drive_file_comments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_file_comments" ADD CONSTRAINT "drive_file_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "drive_file_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_share_links" ADD CONSTRAINT "drive_share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_activities" ADD CONSTRAINT "drive_activities_folder_fkey" FOREIGN KEY ("entity_id") REFERENCES "drive_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drive_activities" ADD CONSTRAINT "drive_activities_file_fkey" FOREIGN KEY ("entity_id") REFERENCES "drive_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecurringOrderTemplateToSalesOrder" ADD CONSTRAINT "_RecurringOrderTemplateToSalesOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "recurring_order_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecurringOrderTemplateToSalesOrder" ADD CONSTRAINT "_RecurringOrderTemplateToSalesOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

