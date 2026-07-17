-- E-Commerce Storefront module (module #33) — initial data layer.
-- Adds 6 tenant-scoped tables per .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 4.
-- Purely additive (no drops, no column alters, no NOT NULL additions to existing
-- tables) — safe to run with `prisma migrate deploy` regardless of dev-DB drift
-- on unrelated tables.

-- CreateTable
CREATE TABLE IF NOT EXISTS "storefront_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_slug" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "contact_email" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "storefront_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category_id" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "description" TEXT,
    "price_override" DECIMAL(15,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "carts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_listing_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_snapshot" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "storefront_order_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sales_order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock_gateway',
    "provider_intent_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "storefront_configs_tenant_id_key" ON "storefront_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "storefront_configs_store_slug_key" ON "storefront_configs"("store_slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_configs_tenant_id_idx" ON "storefront_configs"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_categories_tenant_id_idx" ON "storefront_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "storefront_categories_tenant_id_slug_key" ON "storefront_categories"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_listings_tenant_id_is_published_idx" ON "product_listings"("tenant_id", "is_published");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_listings_tenant_id_category_id_idx" ON "product_listings"("tenant_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_listings_tenant_id_product_id_key" ON "product_listings"("tenant_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "carts_session_token_key" ON "carts"("session_token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "carts_tenant_id_idx" ON "carts"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "carts_tenant_id_status_idx" ON "carts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cart_items_tenant_id_idx" ON "cart_items"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_order_payments_tenant_id_idx" ON "storefront_order_payments"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_order_payments_tenant_id_sales_order_id_idx" ON "storefront_order_payments"("tenant_id", "sales_order_id");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "storefront_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_listing_id_fkey" FOREIGN KEY ("product_listing_id") REFERENCES "product_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "storefront_order_payments" ADD CONSTRAINT "storefront_order_payments_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
