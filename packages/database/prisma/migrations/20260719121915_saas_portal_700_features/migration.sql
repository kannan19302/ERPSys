-- AlterTable
ALTER TABLE "saas_plans" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_api_calls" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "tenant_addons" ADD COLUMN     "subscription_id" TEXT;

-- AlterTable
ALTER TABLE "tenant_subscriptions" ADD COLUMN     "auto_renew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "pause_end" TIMESTAMP(3),
ADD COLUMN     "pause_start" TIMESTAMP(3),
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "app_storage_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_slug" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "estimated_bytes" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_storage_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_plan_prices" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "region" TEXT NOT NULL DEFAULT 'US',
    "monthly" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "yearly" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_plan_features" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BOOLEAN',
    "limit_value" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "payment_method_id" TEXT,
    "provider" TEXT NOT NULL,
    "provider_tx_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fee_amount" DECIMAL(15,2) DEFAULT 0,
    "net_amount" DECIMAL(15,2) DEFAULT 0,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_alert_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "threshold_pct" INTEGER NOT NULL DEFAULT 80,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "notify_webhook" BOOLEAN NOT NULL DEFAULT false,
    "notify_in_app" BOOLEAN NOT NULL DEFAULT true,
    "webhook_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_alert_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "metric" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "current_value" DECIMAL(15,2),
    "limit_value" DECIMAL(15,2),
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "sent_webhook" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_api_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "ip_whitelist" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "details" JSONB DEFAULT '{}',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_support_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "tenant_support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT,
    "message" TEXT NOT NULL,
    "attachments" JSONB DEFAULT '[]',
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verification_key" TEXT,
    "verified_at" TIMESTAMP(3),
    "sslStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ssl_expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_sso_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'OIDC',
    "issuer_url" TEXT,
    "client_id" TEXT,
    "client_secret" TEXT,
    "authorization_url" TEXT,
    "token_url" TEXT,
    "user_info_url" TEXT,
    "jwks_url" TEXT,
    "attributeMapping" JSONB DEFAULT '{}',
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "require_mfa" BOOLEAN NOT NULL DEFAULT false,
    "domains" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_sso_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_branding" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT DEFAULT '#2563EB',
    "accent_color" TEXT DEFAULT '#7C3AED',
    "company_name" TEXT,
    "support_email" TEXT,
    "support_url" TEXT,
    "custom_css" TEXT,
    "custom_domain_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_export_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "file_size" INTEGER,
    "error_message" TEXT,
    "record_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "data_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "http_status" INTEGER,
    "response_body" TEXT,
    "duration_ms" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "is_dismissible" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_storage_usage_tenant_id_idx" ON "app_storage_usage"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_storage_usage_tenant_id_app_slug_key" ON "app_storage_usage"("tenant_id", "app_slug");

-- CreateIndex
CREATE UNIQUE INDEX "saas_plan_prices_plan_id_currency_region_key" ON "saas_plan_prices"("plan_id", "currency", "region");

-- CreateIndex
CREATE UNIQUE INDEX "saas_plan_features_plan_id_feature_key_key" ON "saas_plan_features"("plan_id", "feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "saas_invoices_invoice_number_key" ON "saas_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "saas_invoices_tenant_id_idx" ON "saas_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "saas_invoices_status_idx" ON "saas_invoices"("status");

-- CreateIndex
CREATE INDEX "payment_transactions_tenant_id_idx" ON "payment_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "usage_alert_rules_tenant_id_metric_key" ON "usage_alert_rules"("tenant_id", "metric");

-- CreateIndex
CREATE INDEX "usage_alert_logs_tenant_id_idx" ON "usage_alert_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_api_keys_key_hash_idx" ON "tenant_api_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_api_keys_tenant_id_name_key" ON "tenant_api_keys"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "tenant_audit_logs_tenant_id_created_at_idx" ON "tenant_audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "tenant_audit_logs_tenant_id_action_idx" ON "tenant_audit_logs"("tenant_id", "action");

-- CreateIndex
CREATE INDEX "tenant_support_tickets_tenant_id_idx" ON "tenant_support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_support_tickets_status_idx" ON "tenant_support_tickets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_domain_key" ON "tenant_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_tenant_id_domain_key" ON "tenant_domains"("tenant_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_sso_configs_tenant_id_key" ON "tenant_sso_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_branding_tenant_id_key" ON "tenant_branding"("tenant_id");

-- CreateIndex
CREATE INDEX "data_export_jobs_tenant_id_idx" ON "data_export_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_webhook_endpoints_tenant_id_idx" ON "tenant_webhook_endpoints"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_webhook_deliveries_endpoint_id_created_at_idx" ON "tenant_webhook_deliveries"("endpoint_id", "created_at");

-- CreateIndex
CREATE INDEX "tenant_announcements_tenant_id_starts_at_expires_at_idx" ON "tenant_announcements"("tenant_id", "starts_at", "expires_at");

-- AddForeignKey
ALTER TABLE "tenant_addons" ADD CONSTRAINT "tenant_addons_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_plan_prices" ADD CONSTRAINT "saas_plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "saas_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_plan_features" ADD CONSTRAINT "saas_plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "saas_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_invoices" ADD CONSTRAINT "saas_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_invoices" ADD CONSTRAINT "saas_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saas_invoice_line_items" ADD CONSTRAINT "saas_invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "saas_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "saas_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_alert_rules" ADD CONSTRAINT "usage_alert_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_alert_logs" ADD CONSTRAINT "usage_alert_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_alert_logs" ADD CONSTRAINT "usage_alert_logs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "usage_alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_api_keys" ADD CONSTRAINT "tenant_api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_audit_logs" ADD CONSTRAINT "tenant_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_support_tickets" ADD CONSTRAINT "tenant_support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tenant_support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_sso_configs" ADD CONSTRAINT "tenant_sso_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_custom_domain_id_fkey" FOREIGN KEY ("custom_domain_id") REFERENCES "tenant_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_export_jobs" ADD CONSTRAINT "data_export_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_webhook_endpoints" ADD CONSTRAINT "tenant_webhook_endpoints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_webhook_deliveries" ADD CONSTRAINT "tenant_webhook_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_webhook_deliveries" ADD CONSTRAINT "tenant_webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "tenant_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_announcements" ADD CONSTRAINT "tenant_announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
