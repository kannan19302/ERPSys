-- ============================================
-- CRM: Customer Tags & Segmentation (mirrors contact_tags/contact_tag_links)
-- ============================================

CREATE TABLE IF NOT EXISTS "customer_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_tag_links" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "customer_tag_links_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "customer_tags_tenant_id_idx" ON "customer_tags"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_tags_tenant_id_name_key" ON "customer_tags"("tenant_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "customer_tag_links_customer_id_tag_id_key" ON "customer_tag_links"("customer_id", "tag_id");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customer_tag_links_customer_id_fkey'
    ) THEN
        ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'customer_tag_links_tag_id_fkey'
    ) THEN
        ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "customer_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
