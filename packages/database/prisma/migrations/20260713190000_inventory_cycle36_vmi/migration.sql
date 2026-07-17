-- CreateEnum
CREATE TYPE "VmiAgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED');
CREATE TYPE "VmiReplenTrigger" AS ENUM ('BELOW_MIN', 'SCHEDULE', 'MANUAL');
CREATE TYPE "VmiOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED');

-- CreateTable: vmi_agreements
CREATE TABLE "vmi_agreements" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "agreement_number" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "status" "VmiAgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "replen_trigger" "VmiReplenTrigger" NOT NULL DEFAULT 'BELOW_MIN',
  "min_qty" DECIMAL(18,4) NOT NULL,
  "max_qty" DECIMAL(18,4) NOT NULL,
  "target_qty" DECIMAL(18,4) NOT NULL,
  "review_cycle_days" INTEGER NOT NULL DEFAULT 7,
  "vendor_lead_days" INTEGER NOT NULL DEFAULT 3,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "activated_at" TIMESTAMP(3),
  "terminated_at" TIMESTAMP(3),
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vmi_agreements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vmi_agreements_tenant_id_agreement_number_key" ON "vmi_agreements"("tenant_id", "agreement_number");
CREATE INDEX "vmi_agreements_tenant_id_idx" ON "vmi_agreements"("tenant_id");
CREATE INDEX "vmi_agreements_tenant_id_vendor_id_idx" ON "vmi_agreements"("tenant_id", "vendor_id");
CREATE INDEX "vmi_agreements_tenant_id_status_idx" ON "vmi_agreements"("tenant_id", "status");

-- CreateTable: vmi_stock_snapshots
CREATE TABLE "vmi_stock_snapshots" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "agreement_id" TEXT NOT NULL,
  "snapshot_date" TIMESTAMP(3) NOT NULL,
  "on_hand_qty" DECIMAL(18,4) NOT NULL,
  "on_order_qty" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "recorded_by_id" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vmi_stock_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vmi_stock_snapshots_tenant_id_idx" ON "vmi_stock_snapshots"("tenant_id");
CREATE INDEX "vmi_stock_snapshots_tenant_id_agreement_id_idx" ON "vmi_stock_snapshots"("tenant_id", "agreement_id");
CREATE INDEX "vmi_stock_snapshots_tenant_id_snapshot_date_idx" ON "vmi_stock_snapshots"("tenant_id", "snapshot_date");
ALTER TABLE "vmi_stock_snapshots" ADD CONSTRAINT "vmi_stock_snapshots_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "vmi_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: vmi_orders
CREATE TABLE "vmi_orders" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "agreement_id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "status" "VmiOrderStatus" NOT NULL DEFAULT 'PENDING',
  "ordered_qty" DECIMAL(18,4) NOT NULL,
  "received_qty" DECIMAL(18,4),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "triggered_by" "VmiReplenTrigger" NOT NULL,
  "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmed_at" TIMESTAMP(3),
  "shipped_at" TIMESTAMP(3),
  "received_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "cancel_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vmi_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vmi_orders_tenant_id_order_number_key" ON "vmi_orders"("tenant_id", "order_number");
CREATE INDEX "vmi_orders_tenant_id_idx" ON "vmi_orders"("tenant_id");
CREATE INDEX "vmi_orders_tenant_id_agreement_id_idx" ON "vmi_orders"("tenant_id", "agreement_id");
CREATE INDEX "vmi_orders_tenant_id_status_idx" ON "vmi_orders"("tenant_id", "status");
CREATE INDEX "vmi_orders_tenant_id_vendor_id_idx" ON "vmi_orders"("tenant_id", "vendor_id");
ALTER TABLE "vmi_orders" ADD CONSTRAINT "vmi_orders_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "vmi_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
