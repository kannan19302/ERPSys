-- CreateTable
CREATE TABLE "transfer_approval_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "threshold_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "stock_entry_id" TEXT NOT NULL,
    "thresholdValue" DECIMAL(15,2) NOT NULL,
    "entry_value" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_transfer_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_approval_rules_tenant_id_idx" ON "transfer_approval_rules"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_approvals_stock_entry_id_key" ON "stock_transfer_approvals"("stock_entry_id");

-- CreateIndex
CREATE INDEX "stock_transfer_approvals_tenant_id_idx" ON "stock_transfer_approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_transfer_approvals_tenant_id_status_idx" ON "stock_transfer_approvals"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "transfer_approval_rules" ADD CONSTRAINT "transfer_approval_rules_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_approvals" ADD CONSTRAINT "stock_transfer_approvals_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
