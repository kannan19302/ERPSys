-- CreateTable
CREATE TABLE "storefront_checkout_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "storefront_slug" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CHECKOUT_INITIATED',
    "sales_order_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_checkout_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_checkout_states_tenant_id_cart_id_idx" ON "storefront_checkout_states"("tenant_id", "cart_id");

-- CreateIndex
CREATE INDEX "storefront_checkout_states_tenant_id_status_idx" ON "storefront_checkout_states"("tenant_id", "status");
