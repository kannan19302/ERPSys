-- AlterTable
ALTER TABLE "crm_case_comments" ADD COLUMN     "author_type" TEXT NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE "customer_portal_users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_portal_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_portal_users_tenant_id_idx" ON "customer_portal_users"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_portal_users_customer_id_idx" ON "customer_portal_users"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_portal_users_tenant_id_email_key" ON "customer_portal_users"("tenant_id", "email");

-- AddForeignKey
ALTER TABLE "customer_portal_users" ADD CONSTRAINT "customer_portal_users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_users" ADD CONSTRAINT "customer_portal_users_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
