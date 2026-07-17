-- App Studio: safe core-app customization (nav overlays + submodule grouping).
-- Written idempotently so it is safe to apply against a drifted dev database.

-- AlterTable: PageRegistry gains submodule grouping for App Studio extensions
ALTER TABLE "page_registries" ADD COLUMN IF NOT EXISTS "submodule" TEXT;
ALTER TABLE "page_registries" ADD COLUMN IF NOT EXISTS "nav_icon" TEXT;
ALTER TABLE "page_registries" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: per-tenant non-destructive nav overlay for existing apps
CREATE TABLE IF NOT EXISTS "app_nav_overlays" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_nav_overlays_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_nav_overlays_tenant_id_module_id_key" ON "app_nav_overlays"("tenant_id", "module_id");
CREATE INDEX IF NOT EXISTS "app_nav_overlays_tenant_id_idx" ON "app_nav_overlays"("tenant_id");
