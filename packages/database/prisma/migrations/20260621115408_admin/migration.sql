-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "demo_data_loaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "demo_loaded_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "change_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field_changes" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_data_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_data_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'endpoint',
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_packages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "field_access" JSONB NOT NULL DEFAULT '{}',
    "record_filter" JSONB NOT NULL DEFAULT '{}',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_access_packages" (
    "role_id" TEXT NOT NULL,
    "access_package_id" TEXT NOT NULL,

    CONSTRAINT "role_access_packages_pkey" PRIMARY KEY ("role_id","access_package_id")
);

-- CreateIndex
CREATE INDEX "change_history_tenant_id_entity_type_entity_id_idx" ON "change_history"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "change_history_tenant_id_created_at_idx" ON "change_history"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "change_history_tenant_id_user_id_idx" ON "change_history"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "demo_data_records_tenant_id_module_idx" ON "demo_data_records"("tenant_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "demo_data_records_tenant_id_entity_type_entity_id_key" ON "demo_data_records"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "access_packages_tenant_id_idx" ON "access_packages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_packages_tenant_id_name_key" ON "access_packages"("tenant_id", "name");

-- AddForeignKey
ALTER TABLE "demo_data_records" ADD CONSTRAINT "demo_data_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_packages" ADD CONSTRAINT "access_packages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_access_packages" ADD CONSTRAINT "role_access_packages_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_access_packages" ADD CONSTRAINT "role_access_packages_access_package_id_fkey" FOREIGN KEY ("access_package_id") REFERENCES "access_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
