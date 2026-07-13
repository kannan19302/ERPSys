-- Inventory Cycle 19: Lot/Serial Number Tracking Enhancements
-- Lot movement ledger, FEFO/FIFO pick suggestions, expiry alerts, quarantine orders

CREATE TABLE "lot_movements" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "batch_id" TEXT NOT NULL,
  "movement_type" TEXT NOT NULL,
  "qty" DECIMAL(15,4) NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'EA',
  "reference_type" TEXT,
  "reference_id" TEXT,
  "performed_by" TEXT,
  "from_bin" TEXT,
  "to_bin" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lot_movements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "lot_movements_tenant_id_idx" ON "lot_movements"("tenant_id");
CREATE INDEX "lot_movements_batch_id_idx" ON "lot_movements"("batch_id");
CREATE INDEX "lot_movements_tenant_id_movement_type_idx" ON "lot_movements"("tenant_id", "movement_type");

CREATE TABLE "pick_suggestions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "strategy" TEXT NOT NULL DEFAULT 'FEFO',
  "reference_type" TEXT,
  "reference_id" TEXT,
  "batch_id" TEXT,
  "serial_id" TEXT,
  "suggested_qty" DECIMAL(15,4) NOT NULL,
  "picked_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pick_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pick_suggestions_tenant_id_idx" ON "pick_suggestions"("tenant_id");
CREATE INDEX "pick_suggestions_tenant_id_product_id_idx" ON "pick_suggestions"("tenant_id", "product_id");
CREATE INDEX "pick_suggestions_tenant_id_reference_id_idx" ON "pick_suggestions"("tenant_id", "reference_id");

CREATE TABLE "expiry_alerts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "batch_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "expiry_date" TIMESTAMP(3) NOT NULL,
  "days_until_expiry" INTEGER NOT NULL,
  "qty" DECIMAL(15,4) NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'WARNING',
  "acknowledged" BOOLEAN NOT NULL DEFAULT false,
  "acknowledged_by" TEXT,
  "acknowledged_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expiry_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expiry_alerts_tenant_id_idx" ON "expiry_alerts"("tenant_id");
CREATE INDEX "expiry_alerts_tenant_id_severity_idx" ON "expiry_alerts"("tenant_id", "severity");
CREATE INDEX "expiry_alerts_tenant_id_acknowledged_idx" ON "expiry_alerts"("tenant_id", "acknowledged");

CREATE TABLE "quarantine_orders" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "order_number" TEXT NOT NULL,
  "batch_id" TEXT,
  "serial_id" TEXT,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "qty" DECIMAL(15,4) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "quarantined_by" TEXT,
  "released_by" TEXT,
  "released_at" TIMESTAMP(3),
  "release_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "quarantine_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "quarantine_orders_tenant_id_order_number_key" ON "quarantine_orders"("tenant_id", "order_number");
CREATE INDEX "quarantine_orders_tenant_id_idx" ON "quarantine_orders"("tenant_id");
CREATE INDEX "quarantine_orders_tenant_id_status_idx" ON "quarantine_orders"("tenant_id", "status");
