-- Web Studio CMS: dynamic content collections + items + public form submissions.
-- Idempotent (safe to apply on dev DBs with prior db-push drift).

-- ── web_collections ──
CREATE TABLE IF NOT EXISTS "web_collections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "singular" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'GENERIC',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "web_collections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_collections_tenant_id_slug_key" ON "web_collections"("tenant_id", "slug");
CREATE INDEX IF NOT EXISTS "web_collections_tenant_id_idx" ON "web_collections"("tenant_id");

-- ── web_collection_items ──
CREATE TABLE IF NOT EXISTS "web_collection_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "web_collection_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "web_collection_items_collection_id_slug_key" ON "web_collection_items"("collection_id", "slug");
CREATE INDEX IF NOT EXISTS "web_collection_items_tenant_id_collection_id_idx" ON "web_collection_items"("tenant_id", "collection_id");
CREATE INDEX IF NOT EXISTS "web_collection_items_tenant_id_status_idx" ON "web_collection_items"("tenant_id", "status");

-- ── web_form_submissions ──
CREATE TABLE IF NOT EXISTS "web_form_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "form_name" TEXT NOT NULL,
    "page_slug" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_form_submissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "web_form_submissions_tenant_id_form_name_idx" ON "web_form_submissions"("tenant_id", "form_name");
CREATE INDEX IF NOT EXISTS "web_form_submissions_tenant_id_status_idx" ON "web_form_submissions"("tenant_id", "status");

-- ── FK: items → collections (cascade delete) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'web_collection_items_collection_id_fkey'
  ) THEN
    ALTER TABLE "web_collection_items"
      ADD CONSTRAINT "web_collection_items_collection_id_fkey"
      FOREIGN KEY ("collection_id") REFERENCES "web_collections"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
