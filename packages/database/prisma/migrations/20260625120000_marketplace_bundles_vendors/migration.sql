-- Real marketplace: third-party Vendor → AppPackage → AppBundle pipeline,
-- bundle-backed installs (per-tenant extracted dirs) and core/vendor listing linkage.
-- Written idempotently so it is safe on the drifted dev database.

-- ── marketplace_apps: create table if not exists, then add new columns ──
CREATE TABLE IF NOT EXISTS "marketplace_apps" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "long_description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "publisher" TEXT NOT NULL DEFAULT '',
    "publisher_logo" TEXT,
    "publisher_website" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "pricing" TEXT NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "installs" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requires_apps" JSONB NOT NULL DEFAULT '[]',
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "support_url" TEXT,
    "documentation_url" TEXT,
    "privacy_policy_url" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "vendor_id" TEXT,
    "bundle_id" TEXT,
    "package_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_apps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_apps_slug_key" ON "marketplace_apps"("slug");
CREATE INDEX IF NOT EXISTS "marketplace_apps_category_idx" ON "marketplace_apps"("category");
CREATE INDEX IF NOT EXISTS "marketplace_apps_featured_idx" ON "marketplace_apps"("featured");
CREATE INDEX IF NOT EXISTS "marketplace_apps_vendor_id_idx" ON "marketplace_apps"("vendor_id");

-- ── installed_apps: track bundle + on-disk install path for real-time teardown ──
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "bundle_id" TEXT;
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "install_path" TEXT;

-- ── Columns that may already exist on dev (idempotent) ──
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "is_core" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "vendor_id" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "bundle_id" TEXT;
ALTER TABLE "marketplace_apps" ADD COLUMN IF NOT EXISTS "package_id" TEXT;

-- ── app_vendors ──
CREATE TABLE IF NOT EXISTS "app_vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contact_email" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "owner_user_id" TEXT,
    "owner_tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_vendors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_vendors_slug_key" ON "app_vendors"("slug");

-- ── app_packages ──
CREATE TABLE IF NOT EXISTS "app_packages" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "long_description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "pricing" TEXT NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_packages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_packages_slug_key" ON "app_packages"("slug");
CREATE INDEX IF NOT EXISTS "app_packages_vendor_id_idx" ON "app_packages"("vendor_id");
CREATE INDEX IF NOT EXISTS "app_packages_status_idx" ON "app_packages"("status");

-- ── app_bundles ──
CREATE TABLE IF NOT EXISTS "app_bundles" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'STABLE',
    "manifest" JSONB NOT NULL DEFAULT '{}',
    "blob_key" TEXT NOT NULL,
    "checksum" TEXT,
    "size_bytes" INTEGER NOT NULL DEFAULT 0,
    "changelog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "review_notes" TEXT,
    "reviewed_by" TEXT,
    "published_by" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_bundles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_bundles_package_id_version_key" ON "app_bundles"("package_id", "version");
CREATE INDEX IF NOT EXISTS "app_bundles_package_id_idx" ON "app_bundles"("package_id");
CREATE INDEX IF NOT EXISTS "app_bundles_status_idx" ON "app_bundles"("status");

-- ── FKs ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'app_packages_vendor_id_fkey') THEN
    ALTER TABLE "app_packages" ADD CONSTRAINT "app_packages_vendor_id_fkey"
      FOREIGN KEY ("vendor_id") REFERENCES "app_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'app_bundles_package_id_fkey') THEN
    ALTER TABLE "app_bundles" ADD CONSTRAINT "app_bundles_package_id_fkey"
      FOREIGN KEY ("package_id") REFERENCES "app_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
