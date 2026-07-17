-- CreateEnum
CREATE TYPE "TransferOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "transfer_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transfer_number" TEXT NOT NULL,
    "from_warehouse_id" TEXT NOT NULL,
    "to_warehouse_id" TEXT NOT NULL,
    "status" "TransferOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requested_date" TIMESTAMP(3),
    "expected_date" TIMESTAMP(3),
    "shipped_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "notes" TEXT,
    "internal_notes" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "shipped_by" TEXT,
    "received_by" TEXT,
    "carrier" TEXT,
    "tracking_number" TEXT,
    "estimated_cost" DECIMAL(15,2),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_order_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transfer_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "requested_qty" DECIMAL(15,4) NOT NULL,
    "shipped_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "received_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'UNIT',
    "unit_cost" DECIMAL(15,6),
    "lot_number" TEXT,
    "serial_numbers" TEXT[],
    "bin_location_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_order_receipts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transfer_order_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_order_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_order_receipt_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "transfer_line_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "received_qty" DECIMAL(15,4) NOT NULL,
    "accepted_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "rejected_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_order_receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_orders_tenant_id_transfer_number_key" ON "transfer_orders"("tenant_id", "transfer_number");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_order_receipts_tenant_id_receipt_number_key" ON "transfer_order_receipts"("tenant_id", "receipt_number");

-- AddForeignKey
ALTER TABLE "transfer_order_lines" ADD CONSTRAINT "transfer_order_lines_transfer_order_id_fkey" FOREIGN KEY ("transfer_order_id") REFERENCES "transfer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_receipts" ADD CONSTRAINT "transfer_order_receipts_transfer_order_id_fkey" FOREIGN KEY ("transfer_order_id") REFERENCES "transfer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_receipt_lines" ADD CONSTRAINT "transfer_order_receipt_lines_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "transfer_order_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
