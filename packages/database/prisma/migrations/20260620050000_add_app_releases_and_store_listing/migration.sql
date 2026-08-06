-- App Store listing metadata + release management for Custom App Builder.
-- Written idempotently (IF NOT EXISTS) so it is safe to apply on dev databases
-- that previously received the surrounding builder_modules columns via `db push`.

-- ── builder_modules: store-listing + release pointer ──
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "long_description" TEXT;
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "publisher" TEXT;
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "screenshots" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "install_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "builder_modules" ADD COLUMN IF NOT EXISTS "current_release_id" TEXT;

CREATE INDEX IF NOT EXISTS "builder_modules_scope_status_idx" ON "builder_modules"("scope", "status");

-- ── installed_apps: track builder-app installs for pinning + teardown ──
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'CATALOG';
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "source_module_id" TEXT;
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "release_id" TEXT;
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "installed_version" TEXT;
ALTER TABLE "installed_apps" ADD COLUMN IF NOT EXISTS "provisioned" JSONB NOT NULL DEFAULT '{}';

-- ── app_releases: immutable publish snapshots ──
CREATE TABLE IF NOT EXISTS "app_releases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "changelog" TEXT,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "test_score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "published_by" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_releases_module_id_version_key" ON "app_releases"("module_id", "version");
CREATE INDEX IF NOT EXISTS "app_releases_tenant_id_idx" ON "app_releases"("tenant_id");
CREATE INDEX IF NOT EXISTS "app_releases_channel_status_idx" ON "app_releases"("channel", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'app_releases_module_id_fkey'
  ) THEN
    ALTER TABLE "app_releases"
      ADD CONSTRAINT "app_releases_module_id_fkey"
      FOREIGN KEY ("module_id") REFERENCES "builder_modules"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
