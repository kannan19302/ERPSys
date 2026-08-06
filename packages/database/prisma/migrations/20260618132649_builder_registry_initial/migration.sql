-- CreateTable
CREATE TABLE "schema_registries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT true,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schema_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_registries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schema_id" TEXT,
    "module" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FORM',
    "layout" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_custom" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schema_id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schema_registries_tenant_id_module_idx" ON "schema_registries"("tenant_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "schema_registries_tenant_id_slug_key" ON "schema_registries"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "page_registries_tenant_id_idx" ON "page_registries"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "page_registries_tenant_id_module_slug_key" ON "page_registries"("tenant_id", "module", "slug");

-- CreateIndex
CREATE INDEX "custom_records_tenant_id_schema_id_idx" ON "custom_records"("tenant_id", "schema_id");

-- CreateIndex
CREATE INDEX "custom_records_tenant_id_created_at_idx" ON "custom_records"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "page_registries" ADD CONSTRAINT "page_registries_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schema_registries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_records" ADD CONSTRAINT "custom_records_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "schema_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
