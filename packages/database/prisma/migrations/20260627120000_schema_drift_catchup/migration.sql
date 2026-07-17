-- AlterTable
ALTER TABLE "app_bundles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "app_packages" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "app_vendors" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "installed_apps" ADD COLUMN     "app_name" TEXT,
ADD COLUMN     "app_slug" TEXT,
ADD COLUMN     "config" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "installed_by" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "marketplace_apps" ALTER COLUMN "publisher" DROP DEFAULT,
ALTER COLUMN "version" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "sso_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT,
    "client_secret" TEXT,
    "issuer_url" TEXT,
    "authorization_url" TEXT,
    "token_url" TEXT,
    "user_info_url" TEXT,
    "saml_metadata_url" TEXT,
    "saml_metadata_xml" TEXT,
    "saml_entry_point" TEXT,
    "saml_issuer" TEXT,
    "saml_cert" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "browser" TEXT,
    "ip_address" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_members" (
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "ip_restrictions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ip_range" TEXT NOT NULL,
    "description" TEXT,
    "rule_type" TEXT NOT NULL DEFAULT 'ALLOW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "expression" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "last_result" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "level" TEXT NOT NULL DEFAULT 'ERROR',
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "user_id" TEXT,
    "request_id" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_changelogs" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_changelogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "cover_image" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "app_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_favorites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "submitter_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "long_description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "pricing" TEXT NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2),
    "features" JSONB NOT NULL DEFAULT '[]',
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "support_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "options" JSONB NOT NULL DEFAULT '[]',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT NOT NULL DEFAULT 'Custom Fields',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rule_executions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trigger_data" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB NOT NULL DEFAULT '{}',
    "duration_ms" INTEGER,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recycle_bin" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_name" TEXT,
    "entity_data" JSONB NOT NULL,
    "deleted_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "restored" BOOLEAN NOT NULL DEFAULT false,
    "restored_at" TIMESTAMP(3),
    "restored_by" TEXT,

    CONSTRAINT "recycle_bin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_thresholds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "cooldown_min" INTEGER NOT NULL DEFAULT 60,
    "last_fired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_operations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "changes" JSONB NOT NULL DEFAULT '{}',
    "error_log" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "delegator_id" TEXT NOT NULL,
    "delegate_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ALL',
    "workflow_id" TEXT,
    "reason" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_sets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "record_ids" JSONB NOT NULL,
    "match_score" DECIMAL(5,2) NOT NULL,
    "match_fields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "merged_into_id" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sso_configs_tenant_id_provider_type_key" ON "sso_configs"("tenant_id", "provider_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_tenant_id_name_key" ON "user_groups"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ip_restrictions_tenant_id_ip_range_key" ON "ip_restrictions"("tenant_id", "ip_range");

-- CreateIndex
CREATE INDEX "background_jobs_tenant_id_queue_name_idx" ON "background_jobs"("tenant_id", "queue_name");

-- CreateIndex
CREATE INDEX "background_jobs_status_idx" ON "background_jobs"("status");

-- CreateIndex
CREATE INDEX "scheduled_tasks_tenant_id_idx" ON "scheduled_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "error_logs_tenant_id_created_at_idx" ON "error_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "error_logs_level_idx" ON "error_logs"("level");

-- CreateIndex
CREATE INDEX "app_reviews_app_id_idx" ON "app_reviews"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_reviews_user_id_app_id_key" ON "app_reviews"("user_id", "app_id");

-- CreateIndex
CREATE INDEX "app_changelogs_app_id_idx" ON "app_changelogs"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_changelogs_app_id_version_key" ON "app_changelogs"("app_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "app_collections_slug_key" ON "app_collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "app_collection_items_collection_id_app_id_key" ON "app_collection_items"("collection_id", "app_id");

-- CreateIndex
CREATE INDEX "app_favorites_user_id_idx" ON "app_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_favorites_user_id_app_id_key" ON "app_favorites"("user_id", "app_id");

-- CreateIndex
CREATE INDEX "app_submissions_status_idx" ON "app_submissions"("status");

-- CreateIndex
CREATE INDEX "app_submissions_tenant_id_idx" ON "app_submissions"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_field_definitions_tenant_id_entity_type_idx" ON "custom_field_definitions"("tenant_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_tenant_id_entity_type_field_name_key" ON "custom_field_definitions"("tenant_id", "entity_type", "field_name");

-- CreateIndex
CREATE INDEX "custom_field_values_tenant_id_entity_type_entity_id_idx" ON "custom_field_values"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_field_id_entity_id_key" ON "custom_field_values"("field_id", "entity_id");

-- CreateIndex
CREATE INDEX "automation_rule_executions_tenant_id_rule_id_idx" ON "automation_rule_executions"("tenant_id", "rule_id");

-- CreateIndex
CREATE INDEX "automation_rule_executions_created_at_idx" ON "automation_rule_executions"("created_at");

-- CreateIndex
CREATE INDEX "recycle_bin_tenant_id_entity_type_idx" ON "recycle_bin"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "recycle_bin_expires_at_idx" ON "recycle_bin"("expires_at");

-- CreateIndex
CREATE INDEX "admin_alerts_tenant_id_is_read_idx" ON "admin_alerts"("tenant_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "alert_thresholds_tenant_id_metric_key" ON "alert_thresholds"("tenant_id", "metric");

-- CreateIndex
CREATE INDEX "bulk_operations_tenant_id_status_idx" ON "bulk_operations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "delegations_tenant_id_delegator_id_idx" ON "delegations"("tenant_id", "delegator_id");

-- CreateIndex
CREATE INDEX "delegations_tenant_id_delegate_id_idx" ON "delegations"("tenant_id", "delegate_id");

-- CreateIndex
CREATE INDEX "duplicate_sets_tenant_id_entity_type_status_idx" ON "duplicate_sets"("tenant_id", "entity_type", "status");

-- CreateIndex
CREATE INDEX "billing_events_tenant_id_created_at_idx" ON "billing_events"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "sso_configs" ADD CONSTRAINT "sso_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ip_restrictions" ADD CONSTRAINT "ip_restrictions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_reviews" ADD CONSTRAINT "app_reviews_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_changelogs" ADD CONSTRAINT "app_changelogs_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "app_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_collection_items" ADD CONSTRAINT "app_collection_items_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_favorites" ADD CONSTRAINT "app_favorites_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;