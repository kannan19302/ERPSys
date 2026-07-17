-- CreateTable
CREATE TABLE "web_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'IMAGE',
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html_content" TEXT,
    "css_content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "author" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_menus" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'HEADER',
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_seo" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "og_image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_seo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "web_assets_tenant_id_idx" ON "web_assets"("tenant_id");

-- CreateIndex
CREATE INDEX "web_templates_tenant_id_idx" ON "web_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "web_menus_tenant_id_idx" ON "web_menus"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "web_seo_tenant_id_path_key" ON "web_seo"("tenant_id", "path");
