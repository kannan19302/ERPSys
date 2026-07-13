-- CreateEnum
CREATE TYPE "RmaStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'CLOSED');
CREATE TYPE "ReturnDisposition" AS ENUM ('RESTOCK', 'REFURBISH', 'SCRAP', 'RETURN_TO_VENDOR', 'QUARANTINE');
CREATE TYPE "ReturnCreditStatus" AS ENUM ('PENDING', 'ISSUED', 'VOIDED');

-- CreateTable: customer_rmas
CREATE TABLE "customer_rmas" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "rma_number" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "sales_order_id" TEXT,
  "status" "RmaStatus" NOT NULL DEFAULT 'REQUESTED',
  "return_reason" TEXT NOT NULL,
  "customer_notes" TEXT,
  "requested_by_id" TEXT NOT NULL,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejected_by_id" TEXT,
  "rejection_reason" TEXT,
  "received_at" TIMESTAMP(3),
  "warehouse_id" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_rmas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_rmas_tenant_id_rma_number_key" ON "customer_rmas"("tenant_id", "rma_number");
CREATE INDEX "customer_rmas_tenant_id_idx" ON "customer_rmas"("tenant_id");
CREATE INDEX "customer_rmas_tenant_id_status_idx" ON "customer_rmas"("tenant_id", "status");
CREATE INDEX "customer_rmas_tenant_id_customer_id_idx" ON "customer_rmas"("tenant_id", "customer_id");

-- CreateTable: customer_rma_lines
CREATE TABLE "customer_rma_lines" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "rma_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "lot_number" TEXT,
  "serial_number" TEXT,
  "quantity_requested" DECIMAL(18,4) NOT NULL,
  "quantity_received" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "unit_cost" DECIMAL(18,4),
  "disposition" "ReturnDisposition",
  "inspection_notes" TEXT,
  "inspected_by_id" TEXT,
  "inspected_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_rma_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "customer_rma_lines_tenant_id_idx" ON "customer_rma_lines"("tenant_id");
CREATE INDEX "customer_rma_lines_tenant_id_rma_id_idx" ON "customer_rma_lines"("tenant_id", "rma_id");
CREATE INDEX "customer_rma_lines_tenant_id_product_id_idx" ON "customer_rma_lines"("tenant_id", "product_id");
ALTER TABLE "customer_rma_lines" ADD CONSTRAINT "customer_rma_lines_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "customer_rmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: return_credits
CREATE TABLE "return_credits" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "credit_number" TEXT NOT NULL,
  "rma_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "credit_amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "ReturnCreditStatus" NOT NULL DEFAULT 'PENDING',
  "issued_by_id" TEXT,
  "issued_at" TIMESTAMP(3),
  "voided_by_id" TEXT,
  "void_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "return_credits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "return_credits_rma_id_key" ON "return_credits"("rma_id");
CREATE UNIQUE INDEX "return_credits_tenant_id_credit_number_key" ON "return_credits"("tenant_id", "credit_number");
CREATE INDEX "return_credits_tenant_id_idx" ON "return_credits"("tenant_id");
CREATE INDEX "return_credits_tenant_id_customer_id_idx" ON "return_credits"("tenant_id", "customer_id");
CREATE INDEX "return_credits_tenant_id_status_idx" ON "return_credits"("tenant_id", "status");
ALTER TABLE "return_credits" ADD CONSTRAINT "return_credits_rma_id_fkey" FOREIGN KEY ("rma_id") REFERENCES "customer_rmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: return_restocks
CREATE TABLE "return_restocks" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "rma_line_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "bin_location_id" TEXT,
  "quantity_restocked" DECIMAL(18,4) NOT NULL,
  "restocked_by_id" TEXT NOT NULL,
  "restocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "return_restocks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "return_restocks_tenant_id_idx" ON "return_restocks"("tenant_id");
CREATE INDEX "return_restocks_tenant_id_rma_line_id_idx" ON "return_restocks"("tenant_id", "rma_line_id");
CREATE INDEX "return_restocks_tenant_id_product_id_idx" ON "return_restocks"("tenant_id", "product_id");
