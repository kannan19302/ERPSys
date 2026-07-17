-- DropIndex
DROP INDEX "idx_messages_content_trgm";

-- AlterTable
ALTER TABLE "app_nav_overlays" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "asset_depreciations" ADD COLUMN     "accumulated_depreciation" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "book_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "period_name" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'POSTED';

-- AlterTable
ALTER TABLE "fixed_assets" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "created_by" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "custodian_id" TEXT,
ADD COLUMN     "depreciation_rate" DECIMAL(5,2),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "location_id" TEXT,
ADD COLUMN     "updated_by" TEXT NOT NULL DEFAULT 'system';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfa_secret" TEXT;

-- AlterTable
ALTER TABLE "web_chatbots" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "web_site_pages" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "web_sites" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "passkeys" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "transports" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_model" TEXT NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "style_config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logic_scripts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logic_scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "env_variables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "env_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "env_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack_trace" TEXT,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_permissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "module_slug" TEXT NOT NULL,
    "can_read" BOOLEAN NOT NULL DEFAULT false,
    "can_write" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "third_party_connectors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "third_party_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "manifest" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_git_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "repo_url" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "access_token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_git_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_native_builds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "download_url" TEXT,
    "log_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_native_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_asset_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "expected_life_months" INTEGER NOT NULL,
    "depreciation_rate" DECIMAL(5,2),
    "asset_account_id" TEXT,
    "depreciation_account_id" TEXT,
    "expense_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_transfer_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "transfer_date" TIMESTAMP(3) NOT NULL,
    "from_location_id" TEXT,
    "to_location_id" TEXT,
    "from_custodian_id" TEXT,
    "to_custodian_id" TEXT,
    "reason" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_transfer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PREVENTIVE',
    "description" TEXT NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "performed_by" TEXT NOT NULL,
    "next_maintenance_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_credential_id_key" ON "passkeys"("credential_id");

-- CreateIndex
CREATE INDEX "custom_workflows_tenant_id_idx" ON "custom_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "custom_dashboards_tenant_id_idx" ON "custom_dashboards"("tenant_id");

-- CreateIndex
CREATE INDEX "logic_scripts_tenant_id_idx" ON "logic_scripts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "env_variables_tenant_id_env_name_key_key" ON "env_variables"("tenant_id", "env_name", "key");

-- CreateIndex
CREATE INDEX "run_logs_tenant_id_level_idx" ON "run_logs"("tenant_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "studio_permissions_tenant_id_role_id_module_slug_key" ON "studio_permissions"("tenant_id", "role_id", "module_slug");

-- CreateIndex
CREATE INDEX "third_party_connectors_tenant_id_idx" ON "third_party_connectors"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_widgets_tag_key" ON "custom_widgets"("tag");

-- CreateIndex
CREATE INDEX "custom_widgets_tenant_id_idx" ON "custom_widgets"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "builder_git_configs_tenant_id_key" ON "builder_git_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "builder_native_builds_tenant_id_idx" ON "builder_native_builds"("tenant_id");

-- CreateIndex
CREATE INDEX "fixed_asset_categories_tenant_id_idx" ON "fixed_asset_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_asset_categories_tenant_id_name_key" ON "fixed_asset_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "asset_transfer_logs_tenant_id_idx" ON "asset_transfer_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_transfer_logs_asset_id_idx" ON "asset_transfer_logs"("asset_id");

-- CreateIndex
CREATE INDEX "asset_maintenance_logs_tenant_id_idx" ON "asset_maintenance_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_maintenance_logs_asset_id_idx" ON "asset_maintenance_logs"("asset_id");

-- CreateIndex
CREATE INDEX "fixed_assets_category_id_idx" ON "fixed_assets"("category_id");

-- CreateIndex
CREATE INDEX "fixed_assets_location_id_idx" ON "fixed_assets"("location_id");

-- CreateIndex
CREATE INDEX "fixed_assets_custodian_id_idx" ON "fixed_assets"("custodian_id");

-- AddForeignKey
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "fixed_asset_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_custodian_id_fkey" FOREIGN KEY ("custodian_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_asset_categories" ADD CONSTRAINT "fixed_asset_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_logs" ADD CONSTRAINT "asset_transfer_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfer_logs" ADD CONSTRAINT "asset_transfer_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_logs" ADD CONSTRAINT "asset_maintenance_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance_logs" ADD CONSTRAINT "asset_maintenance_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
