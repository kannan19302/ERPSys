-- ============================================================
-- INVENTORY CYCLE 29 — Catch-Weight & Product Recall
-- ============================================================

CREATE TABLE "catch_weight_configs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "nominal_weight_kg" DECIMAL(10,4) NOT NULL,
  "tolerance_pct_plus" DECIMAL(5,2) NOT NULL DEFAULT 5,
  "tolerance_pct_minus" DECIMAL(5,2) NOT NULL DEFAULT 5,
  "pricing_basis" TEXT NOT NULL DEFAULT 'ACTUAL_WEIGHT',
  "tare_weight_kg" DECIMAL(10,4) NOT NULL DEFAULT 0,
  "uom_nominal" TEXT NOT NULL DEFAULT 'UNIT',
  "uom_weight" TEXT NOT NULL DEFAULT 'KG',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "catch_weight_configs_tenant_product_key" ON "catch_weight_configs"("tenant_id","product_id");
CREATE INDEX "catch_weight_configs_tenant_id_idx" ON "catch_weight_configs"("tenant_id");

CREATE TABLE "catch_weight_readings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "config_id" TEXT NOT NULL,
  "reference_type" TEXT NOT NULL,
  "reference_id" TEXT NOT NULL,
  "lot_number" TEXT,
  "serial_number" TEXT,
  "nominal_qty" DECIMAL(15,4) NOT NULL,
  "actual_weight_kg" DECIMAL(10,4) NOT NULL,
  "variance_kg" DECIMAL(10,4) NOT NULL,
  "variance_pct" DECIMAL(7,4) NOT NULL,
  "variance_status" TEXT NOT NULL,
  "scale_id" TEXT,
  "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "captured_by" TEXT NOT NULL,
  FOREIGN KEY ("config_id") REFERENCES "catch_weight_configs"("id")
);
CREATE INDEX "catch_weight_readings_tenant_id_idx" ON "catch_weight_readings"("tenant_id");
CREATE INDEX "catch_weight_readings_config_id_idx" ON "catch_weight_readings"("config_id");
CREATE INDEX "catch_weight_readings_ref_idx" ON "catch_weight_readings"("reference_type","reference_id");

CREATE TABLE "catch_weight_tares" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "container_label" TEXT NOT NULL,
  "tare_weight_kg" DECIMAL(10,4) NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "catch_weight_tares_tenant_label_key" ON "catch_weight_tares"("tenant_id","container_label");
CREATE INDEX "catch_weight_tares_tenant_id_idx" ON "catch_weight_tares"("tenant_id");

CREATE TABLE "product_recalls" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "recall_number" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "recall_class" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "regulatory_ref" TEXT,
  "affected_lot_numbers" TEXT[] NOT NULL DEFAULT '{}',
  "affected_serials" TEXT[] NOT NULL DEFAULT '{}',
  "affected_date_from" TIMESTAMP(3),
  "affected_date_to" TIMESTAMP(3),
  "action_required" TEXT NOT NULL,
  "issued_at" TIMESTAMP(3),
  "deadline_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "total_units_affected" INT NOT NULL DEFAULT 0,
  "total_units_recovered" INT NOT NULL DEFAULT 0,
  "notified_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "product_recalls_tenant_number_key" ON "product_recalls"("tenant_id","recall_number");
CREATE INDEX "product_recalls_tenant_id_idx" ON "product_recalls"("tenant_id");
CREATE INDEX "product_recalls_tenant_status_idx" ON "product_recalls"("tenant_id","status");

CREATE TABLE "recall_affected_stocks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "recall_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "location_bin" TEXT,
  "lot_number" TEXT,
  "serial_number" TEXT,
  "qty_affected" DECIMAL(15,4) NOT NULL,
  "qty_quarantined" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "qty_recovered" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "quarantined_at" TIMESTAMP(3),
  FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE
);
CREATE INDEX "recall_affected_stocks_tenant_id_idx" ON "recall_affected_stocks"("tenant_id");
CREATE INDEX "recall_affected_stocks_recall_id_idx" ON "recall_affected_stocks"("recall_id");

CREATE TABLE "recall_customer_notices" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "recall_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "customer_name" TEXT NOT NULL,
  "contact_email" TEXT,
  "qty_shipped" DECIMAL(15,4) NOT NULL,
  "qty_returned" DECIMAL(15,4) NOT NULL DEFAULT 0,
  "notice_sent_at" TIMESTAMP(3),
  "acknowledged_at" TIMESTAMP(3),
  "notes" TEXT,
  FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE
);
CREATE INDEX "recall_customer_notices_tenant_id_idx" ON "recall_customer_notices"("tenant_id");
CREATE INDEX "recall_customer_notices_recall_id_idx" ON "recall_customer_notices"("recall_id");

CREATE TABLE "recall_disposal_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "recall_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "qty_processed" DECIMAL(15,4) NOT NULL,
  "disposal_method" TEXT,
  "authorized_by" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "certificate_ref" TEXT,
  "notes" TEXT,
  FOREIGN KEY ("recall_id") REFERENCES "product_recalls"("id") ON DELETE CASCADE
);
CREATE INDEX "recall_disposal_records_tenant_id_idx" ON "recall_disposal_records"("tenant_id");
CREATE INDEX "recall_disposal_records_recall_id_idx" ON "recall_disposal_records"("recall_id");
