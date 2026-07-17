-- CreateTable
CREATE TABLE "crm_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_id" TEXT,
    "vendor_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SALES',
    "value" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "renewal_term_months" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "terms" TEXT,
    "owner_id" TEXT,
    "renewed_from_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_contracts_tenant_id_idx" ON "crm_contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contracts_tenant_id_status_idx" ON "crm_contracts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "crm_contracts_customer_id_idx" ON "crm_contracts"("customer_id");

-- CreateIndex
CREATE INDEX "crm_contracts_vendor_id_idx" ON "crm_contracts"("vendor_id");

-- CreateIndex
CREATE INDEX "crm_contracts_renewal_date_idx" ON "crm_contracts"("renewal_date");

-- CreateIndex
CREATE INDEX "crm_contracts_owner_id_idx" ON "crm_contracts"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_contracts_tenant_id_contract_number_key" ON "crm_contracts"("tenant_id", "contract_number");

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contracts" ADD CONSTRAINT "crm_contracts_renewed_from_id_fkey" FOREIGN KEY ("renewed_from_id") REFERENCES "crm_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

