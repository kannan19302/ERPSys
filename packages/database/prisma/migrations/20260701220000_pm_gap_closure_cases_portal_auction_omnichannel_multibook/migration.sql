-- AlterTable
ALTER TABLE "rfqs" ADD COLUMN     "auction_ends_at" TIMESTAMP(3),
ADD COLUMN     "is_auction" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "journals" ADD COLUMN     "book_id" TEXT;

-- CreateTable
CREATE TABLE "crm_cases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "case_number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "customer_id" TEXT,
    "contact_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "sla_deadline" TIMESTAMP(3),
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "assigned_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_case_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_case_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_portal_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_auction_bids" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "bid_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_auction_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'POS',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_inventory" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "allocated_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_books" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standard" TEXT NOT NULL DEFAULT 'LOCAL_GAAP',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_cases_tenant_id_idx" ON "crm_cases"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_cases_customer_id_idx" ON "crm_cases"("customer_id");

-- CreateIndex
CREATE INDEX "crm_cases_status_idx" ON "crm_cases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "crm_cases_tenant_id_case_number_key" ON "crm_cases"("tenant_id", "case_number");

-- CreateIndex
CREATE INDEX "crm_case_comments_tenant_id_idx" ON "crm_case_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_case_comments_case_id_idx" ON "crm_case_comments"("case_id");

-- CreateIndex
CREATE INDEX "vendor_portal_users_tenant_id_idx" ON "vendor_portal_users"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_portal_users_vendor_id_idx" ON "vendor_portal_users"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_portal_users_tenant_id_email_key" ON "vendor_portal_users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "rfq_auction_bids_tenant_id_idx" ON "rfq_auction_bids"("tenant_id");

-- CreateIndex
CREATE INDEX "rfq_auction_bids_rfq_id_idx" ON "rfq_auction_bids"("rfq_id");

-- CreateIndex
CREATE INDEX "sales_channels_tenant_id_idx" ON "sales_channels"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_channels_tenant_id_org_id_name_key" ON "sales_channels"("tenant_id", "org_id", "name");

-- CreateIndex
CREATE INDEX "channel_inventory_tenant_id_idx" ON "channel_inventory"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "channel_inventory_tenant_id_channel_id_product_id_key" ON "channel_inventory"("tenant_id", "channel_id", "product_id");

-- CreateIndex
CREATE INDEX "accounting_books_tenant_id_idx" ON "accounting_books"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_books_tenant_id_org_id_name_key" ON "accounting_books"("tenant_id", "org_id", "name");

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "accounting_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_case_comments" ADD CONSTRAINT "crm_case_comments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "crm_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_portal_users" ADD CONSTRAINT "vendor_portal_users_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_auction_bids" ADD CONSTRAINT "rfq_auction_bids_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_auction_bids" ADD CONSTRAINT "rfq_auction_bids_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_channels" ADD CONSTRAINT "sales_channels_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_inventory" ADD CONSTRAINT "channel_inventory_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "sales_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_inventory" ADD CONSTRAINT "channel_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_books" ADD CONSTRAINT "accounting_books_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

