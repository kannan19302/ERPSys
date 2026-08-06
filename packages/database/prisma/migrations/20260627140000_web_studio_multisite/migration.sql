-- Web Studio multi-site builder. Idempotent; safe against the drifted dev DB.

-- ── Multi-site scoping columns ──
ALTER TABLE "web_collections" ADD COLUMN IF NOT EXISTS "site_id" TEXT;
ALTER TABLE "web_form_submissions" ADD COLUMN IF NOT EXISTS "site_id" TEXT;
ALTER TABLE "web_orders" ADD COLUMN IF NOT EXISTS "site_id" TEXT;

-- ── web_sites ──
CREATE TABLE IF NOT EXISTS "web_sites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "theme" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_sites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_sites_tenant_id_slug_key" ON "web_sites"("tenant_id", "slug");
CREATE INDEX IF NOT EXISTS "web_sites_tenant_id_idx" ON "web_sites"("tenant_id");

-- ── web_domains ──
CREATE TABLE IF NOT EXISTS "web_domains" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_domains_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_domains_host_key" ON "web_domains"("host");
CREATE INDEX IF NOT EXISTS "web_domains_site_id_idx" ON "web_domains"("site_id");

-- ── web_site_pages ──
CREATE TABLE IF NOT EXISTS "web_site_pages" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PAGE',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "seo" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_site_pages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_site_pages_site_id_path_key" ON "web_site_pages"("site_id", "path");
CREATE INDEX IF NOT EXISTS "web_site_pages_site_id_status_idx" ON "web_site_pages"("site_id", "status");
CREATE INDEX IF NOT EXISTS "web_site_pages_tenant_id_idx" ON "web_site_pages"("tenant_id");

-- ── web_chatbots ──
CREATE TABLE IF NOT EXISTS "web_chatbots" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Assistant',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "knowledge" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_chatbots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "web_chatbots_site_id_idx" ON "web_chatbots"("site_id");

-- ── Foreign keys (idempotent) ──
DO $$ BEGIN
  ALTER TABLE "web_domains" ADD CONSTRAINT "web_domains_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "web_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "web_site_pages" ADD CONSTRAINT "web_site_pages_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "web_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "web_chatbots" ADD CONSTRAINT "web_chatbots_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "web_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Backfill: one default site per tenant that already has web content ──
INSERT INTO "web_sites" ("id", "tenant_id", "name", "slug", "status", "updated_at")
SELECT DISTINCT 'site_default_' || t.tenant_id, t.tenant_id, 'Default Site', 'default', 'ACTIVE', CURRENT_TIMESTAMP
FROM (
  SELECT "tenant_id" FROM "web_collections"
  UNION
  SELECT "tenant_id" FROM "web_pages"
) t
ON CONFLICT ("tenant_id", "slug") DO NOTHING;

-- Migrate legacy per-slug pages into site pages
INSERT INTO "web_site_pages" ("id", "site_id", "tenant_id", "path", "title", "type", "blocks", "seo", "status", "sort_order", "updated_at")
SELECT 'wsp_' || wp."id",
       'site_default_' || wp."tenant_id",
       wp."tenant_id",
       CASE WHEN wp."slug" IN ('home', 'index', '') THEN '/' ELSE '/' || wp."slug" END,
       wp."name",
       'PAGE',
       wp."sections",
       jsonb_build_object('metaTitle', wp."meta_title", 'metaDesc', wp."meta_desc", 'ogImage', wp."og_image"),
       wp."status",
       wp."sort_order",
       CURRENT_TIMESTAMP
FROM "web_pages" wp
WHERE EXISTS (SELECT 1 FROM "web_sites" ws WHERE ws."id" = 'site_default_' || wp."tenant_id")
ON CONFLICT ("site_id", "path") DO NOTHING;

-- Scope existing collections/submissions/orders to the default site
UPDATE "web_collections" SET "site_id" = 'site_default_' || "tenant_id"
  WHERE "site_id" IS NULL AND EXISTS (SELECT 1 FROM "web_sites" ws WHERE ws."id" = 'site_default_' || "web_collections"."tenant_id");
UPDATE "web_form_submissions" SET "site_id" = 'site_default_' || "tenant_id"
  WHERE "site_id" IS NULL AND EXISTS (SELECT 1 FROM "web_sites" ws WHERE ws."id" = 'site_default_' || "web_form_submissions"."tenant_id");
UPDATE "web_orders" SET "site_id" = 'site_default_' || "tenant_id"
  WHERE "site_id" IS NULL AND EXISTS (SELECT 1 FROM "web_sites" ws WHERE ws."id" = 'site_default_' || "web_orders"."tenant_id");
