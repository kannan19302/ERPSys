-- Inventory Cycle 18: Warehouse Operations
-- Warehouse task queue, bin transfers, GRN workflow, packing sessions

CREATE TABLE "warehouse_tasks" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "task_number" TEXT NOT NULL,
  "task_type" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 50,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "warehouse_id" TEXT NOT NULL,
  "zone_id" TEXT,
  "source_location" TEXT,
  "dest_location" TEXT,
  "product_id" TEXT,
  "qty" DECIMAL(15,4),
  "uom" TEXT,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "assigned_to" TEXT,
  "assigned_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "warehouse_tasks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "warehouse_tasks_tenant_id_task_number_key" ON "warehouse_tasks"("tenant_id", "task_number");
CREATE INDEX "warehouse_tasks_tenant_id_idx" ON "warehouse_tasks"("tenant_id");
CREATE INDEX "warehouse_tasks_tenant_id_status_idx" ON "warehouse_tasks"("tenant_id", "status");
CREATE INDEX "warehouse_tasks_tenant_id_assigned_to_idx" ON "warehouse_tasks"("tenant_id", "assigned_to");
CREATE INDEX "warehouse_tasks_tenant_id_task_type_status_idx" ON "warehouse_tasks"("tenant_id", "task_type", "status");

CREATE TABLE "bin_transfer_requests" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "transfer_number" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "from_bin" TEXT NOT NULL,
  "to_bin" TEXT NOT NULL,
  "qty" DECIMAL(15,4) NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'EA',
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "requested_by" TEXT,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejected_reason" TEXT,
  "completed_at" TIMESTAMP(3),
  "warehouse_task_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bin_transfer_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "bin_transfer_requests_tenant_id_transfer_number_key" ON "bin_transfer_requests"("tenant_id", "transfer_number");
CREATE INDEX "bin_transfer_requests_tenant_id_idx" ON "bin_transfer_requests"("tenant_id");
CREATE INDEX "bin_transfer_requests_tenant_id_status_idx" ON "bin_transfer_requests"("tenant_id", "status");

CREATE TABLE "goods_receipt_notes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "grn_number" TEXT NOT NULL,
  "purchase_order_id" TEXT,
  "asn_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "supplier_id" TEXT,
  "received_date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "vehicle_number" TEXT,
  "driver_name" TEXT,
  "total_cartons" INTEGER,
  "total_weight" DECIMAL(15,3),
  "notes" TEXT,
  "rejected_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "goods_receipt_notes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "goods_receipt_notes_tenant_id_grn_number_key" ON "goods_receipt_notes"("tenant_id", "grn_number");
CREATE INDEX "goods_receipt_notes_tenant_id_idx" ON "goods_receipt_notes"("tenant_id");
CREATE INDEX "goods_receipt_notes_tenant_id_status_idx" ON "goods_receipt_notes"("tenant_id", "status");
CREATE INDEX "goods_receipt_notes_tenant_id_po_idx" ON "goods_receipt_notes"("tenant_id", "purchase_order_id");

CREATE TABLE "grn_line_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "grn_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "ordered_qty" DECIMAL(15,4) NOT NULL,
  "received_qty" DECIMAL(15,4) NOT NULL,
  "accepted_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "rejected_qty" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "uom" TEXT NOT NULL DEFAULT 'EA',
  "lot_number" TEXT,
  "expiry_date" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "grn_line_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "grn_line_items_tenant_id_idx" ON "grn_line_items"("tenant_id");
CREATE INDEX "grn_line_items_grn_id_idx" ON "grn_line_items"("grn_id");

ALTER TABLE "grn_line_items" ADD CONSTRAINT "grn_line_items_grn_id_fkey"
  FOREIGN KEY ("grn_id") REFERENCES "goods_receipt_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "packing_sessions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_number" TEXT NOT NULL,
  "outbound_shipment_id" TEXT,
  "pick_wave_id" TEXT,
  "worker_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "total_cartons" INTEGER NOT NULL DEFAULT 0,
  "total_weight" DECIMAL(15,3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "packing_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "packing_sessions_tenant_id_session_number_key" ON "packing_sessions"("tenant_id", "session_number");
CREATE INDEX "packing_sessions_tenant_id_idx" ON "packing_sessions"("tenant_id");
CREATE INDEX "packing_sessions_tenant_id_status_idx" ON "packing_sessions"("tenant_id", "status");

CREATE TABLE "packing_cartons" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "carton_number" TEXT NOT NULL,
  "weight" DECIMAL(10,3),
  "length" DECIMAL(10,2),
  "width" DECIMAL(10,2),
  "height" DECIMAL(10,2),
  "label_url" TEXT,
  "sealed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "packing_cartons_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "packing_cartons_tenant_id_idx" ON "packing_cartons"("tenant_id");
CREATE INDEX "packing_cartons_session_id_idx" ON "packing_cartons"("session_id");

ALTER TABLE "packing_cartons" ADD CONSTRAINT "packing_cartons_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "packing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
