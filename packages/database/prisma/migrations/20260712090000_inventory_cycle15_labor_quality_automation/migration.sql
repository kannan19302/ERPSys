-- Migration: inventory cycle 15 — labor management, supplier quality, automation rules

-- Labor Standards
CREATE TABLE "labor_standards" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "tenant_id"      TEXT NOT NULL,
  "task_type"      TEXT NOT NULL,
  "description"    TEXT,
  "standard_mins"  DECIMAL(8,2) NOT NULL,
  "warehouse_id"   TEXT,
  "is_active"      BOOLEAN NOT NULL DEFAULT true,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "labor_standards_tenant_id_task_type_warehouse_id_key" ON "labor_standards"("tenant_id","task_type","warehouse_id");
CREATE INDEX "labor_standards_tenant_id_idx" ON "labor_standards"("tenant_id");

-- Worker Task Logs
CREATE TABLE "worker_task_logs" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "tenant_id"       TEXT NOT NULL,
  "worker_id"       TEXT NOT NULL,
  "worker_name"     TEXT NOT NULL,
  "warehouse_id"    TEXT NOT NULL,
  "task_type"       TEXT NOT NULL,
  "reference_id"    TEXT,
  "reference_type"  TEXT,
  "started_at"      TIMESTAMP(3) NOT NULL,
  "completed_at"    TIMESTAMP(3),
  "duration_mins"   DECIMAL(8,2),
  "standard_mins"   DECIMAL(8,2),
  "efficiency_pct"  DECIMAL(6,2),
  "notes"           TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL
);
CREATE INDEX "worker_task_logs_tenant_id_idx" ON "worker_task_logs"("tenant_id");
CREATE INDEX "worker_task_logs_tenant_id_worker_id_idx" ON "worker_task_logs"("tenant_id","worker_id");
CREATE INDEX "worker_task_logs_tenant_id_warehouse_id_idx" ON "worker_task_logs"("tenant_id","warehouse_id");

-- Warehouse Shift Templates
CREATE TABLE "warehouse_shift_templates" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "tenant_id"    TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "shift_name"   TEXT NOT NULL,
  "day_of_week"  INTEGER NOT NULL,
  "start_time"   TEXT NOT NULL,
  "end_time"     TEXT NOT NULL,
  "headcount"    INTEGER NOT NULL DEFAULT 1,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL
);
CREATE INDEX "warehouse_shift_templates_tenant_id_idx" ON "warehouse_shift_templates"("tenant_id");
CREATE INDEX "warehouse_shift_templates_tenant_id_warehouse_id_idx" ON "warehouse_shift_templates"("tenant_id","warehouse_id");

-- Supplier Scorecards
CREATE TABLE "supplier_scorecards" (
  "id"                    TEXT NOT NULL PRIMARY KEY,
  "tenant_id"             TEXT NOT NULL,
  "vendor_id"             TEXT NOT NULL,
  "period_start"          TIMESTAMP(3) NOT NULL,
  "period_end"            TIMESTAMP(3) NOT NULL,
  "quality_score"         DECIMAL(5,2),
  "delivery_score"        DECIMAL(5,2),
  "fill_rate_score"       DECIMAL(5,2),
  "overall_score"         DECIMAL(5,2),
  "on_time_deliveries"    INTEGER NOT NULL DEFAULT 0,
  "late_deliveries"       INTEGER NOT NULL DEFAULT 0,
  "defective_units"       INTEGER NOT NULL DEFAULT 0,
  "total_units_received"  INTEGER NOT NULL DEFAULT 0,
  "notes"                 TEXT,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_scorecards_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "supplier_scorecards_tenant_id_vendor_id_period_start_key" ON "supplier_scorecards"("tenant_id","vendor_id","period_start");
CREATE INDEX "supplier_scorecards_tenant_id_idx" ON "supplier_scorecards"("tenant_id");
CREATE INDEX "supplier_scorecards_tenant_id_vendor_id_idx" ON "supplier_scorecards"("tenant_id","vendor_id");

-- Supplier NCRs
CREATE TABLE "supplier_ncrs" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "tenant_id"      TEXT NOT NULL,
  "ncr_number"     TEXT NOT NULL,
  "vendor_id"      TEXT NOT NULL,
  "product_id"     TEXT,
  "warehouse_id"   TEXT,
  "reference_id"   TEXT,
  "reference_type" TEXT,
  "defect_type"    TEXT NOT NULL,
  "severity"       TEXT NOT NULL DEFAULT 'MINOR',
  "defect_qty"     INTEGER NOT NULL DEFAULT 0,
  "total_qty"      INTEGER NOT NULL DEFAULT 0,
  "description"    TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'OPEN',
  "resolution"     TEXT,
  "raised_by"      TEXT,
  "closed_at"      TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_ncrs_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "supplier_ncrs_tenant_id_ncr_number_key" ON "supplier_ncrs"("tenant_id","ncr_number");
CREATE INDEX "supplier_ncrs_tenant_id_idx" ON "supplier_ncrs"("tenant_id");
CREATE INDEX "supplier_ncrs_tenant_id_vendor_id_idx" ON "supplier_ncrs"("tenant_id","vendor_id");

-- Supplier CAR Requests
CREATE TABLE "supplier_car_requests" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "tenant_id"         TEXT NOT NULL,
  "car_number"        TEXT NOT NULL,
  "ncr_id"            TEXT NOT NULL,
  "vendor_id"         TEXT NOT NULL,
  "root_cause"        TEXT,
  "corrective_action" TEXT,
  "due_date"          TIMESTAMP(3),
  "status"            TEXT NOT NULL DEFAULT 'PENDING',
  "vendor_response"   TEXT,
  "responded_at"      TIMESTAMP(3),
  "closed_at"         TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supplier_car_requests_ncr_id_fkey" FOREIGN KEY ("ncr_id") REFERENCES "supplier_ncrs"("id") ON DELETE RESTRICT,
  CONSTRAINT "supplier_car_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "supplier_car_requests_tenant_id_car_number_key" ON "supplier_car_requests"("tenant_id","car_number");
CREATE INDEX "supplier_car_requests_tenant_id_idx" ON "supplier_car_requests"("tenant_id");
CREATE INDEX "supplier_car_requests_tenant_id_ncr_id_idx" ON "supplier_car_requests"("tenant_id","ncr_id");

-- Bin Replenishment Rules
CREATE TABLE "bin_replenishment_rules" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "tenant_id"         TEXT NOT NULL,
  "warehouse_id"      TEXT NOT NULL,
  "product_id"        TEXT NOT NULL,
  "active_bin_code"   TEXT NOT NULL,
  "reserve_bin_code"  TEXT NOT NULL,
  "trigger_qty"       DECIMAL(15,4) NOT NULL,
  "replenish_qty"     DECIMAL(15,4) NOT NULL,
  "is_active"         BOOLEAN NOT NULL DEFAULT true,
  "last_triggered_at" TIMESTAMP(3),
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "bin_replenishment_rules_tenant_warehouse_product_bin_key" ON "bin_replenishment_rules"("tenant_id","warehouse_id","product_id","active_bin_code");
CREATE INDEX "bin_replenishment_rules_tenant_id_idx" ON "bin_replenishment_rules"("tenant_id");

-- Inventory Holds
CREATE TABLE "inventory_holds" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "tenant_id"     TEXT NOT NULL,
  "hold_number"   TEXT NOT NULL,
  "warehouse_id"  TEXT NOT NULL,
  "product_id"    TEXT,
  "batch_id"      TEXT,
  "serial_id"     TEXT,
  "hold_type"     TEXT NOT NULL,
  "reason"        TEXT NOT NULL,
  "held_qty"      DECIMAL(15,4) NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'ACTIVE',
  "raised_by"     TEXT,
  "released_by"   TEXT,
  "released_at"   TIMESTAMP(3),
  "release_notes" TEXT,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "inventory_holds_tenant_id_hold_number_key" ON "inventory_holds"("tenant_id","hold_number");
CREATE INDEX "inventory_holds_tenant_id_idx" ON "inventory_holds"("tenant_id");
CREATE INDEX "inventory_holds_tenant_id_product_id_idx" ON "inventory_holds"("tenant_id","product_id");
