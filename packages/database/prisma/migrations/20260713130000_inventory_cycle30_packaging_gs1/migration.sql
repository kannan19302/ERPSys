-- ============================================================
-- INVENTORY CYCLE 30 — Packaging Specs & GS1 Barcode Management
-- ============================================================

CREATE TABLE "packaging_specs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "units_per_level" INT NOT NULL,
  "length_mm" DECIMAL(10,2),
  "width_mm" DECIMAL(10,2),
  "height_mm" DECIMAL(10,2),
  "gross_weight_kg" DECIMAL(10,4),
  "net_weight_kg" DECIMAL(10,4),
  "cubic_metre" DECIMAL(10,6),
  "stackable" BOOLEAN NOT NULL DEFAULT true,
  "max_stack_layers" INT,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "effective_from" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "packaging_specs_tenant_product_level_key" ON "packaging_specs"("tenant_id","product_id","level");
CREATE INDEX "packaging_specs_tenant_id_idx" ON "packaging_specs"("tenant_id");
CREATE INDEX "packaging_specs_tenant_product_idx" ON "packaging_specs"("tenant_id","product_id");

CREATE TABLE "item_barcodes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "packaging_spec_id" TEXT NOT NULL,
  "symbology" TEXT NOT NULL,
  "barcode_value" TEXT NOT NULL,
  "gtin_14" TEXT,
  "gs1_company_prefix" TEXT,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("packaging_spec_id") REFERENCES "packaging_specs"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "item_barcodes_tenant_barcode_key" ON "item_barcodes"("tenant_id","barcode_value");
CREATE INDEX "item_barcodes_tenant_id_idx" ON "item_barcodes"("tenant_id");
CREATE INDEX "item_barcodes_spec_id_idx" ON "item_barcodes"("packaging_spec_id");

CREATE TABLE "gs1_application_identifiers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "ai" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "data_format" TEXT NOT NULL,
  "fnc1_required" BOOLEAN NOT NULL DEFAULT false,
  "max_length" INT,
  "description" TEXT
);
CREATE UNIQUE INDEX "gs1_ai_tenant_ai_key" ON "gs1_application_identifiers"("tenant_id","ai");
CREATE INDEX "gs1_ai_tenant_id_idx" ON "gs1_application_identifiers"("tenant_id");

CREATE TABLE "label_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "template_type" TEXT NOT NULL,
  "width_mm" DECIMAL(8,2) NOT NULL,
  "height_mm" DECIMAL(8,2) NOT NULL,
  "content" TEXT NOT NULL,
  "version" INT NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "label_templates_tenant_name_version_key" ON "label_templates"("tenant_id","name","version");
CREATE INDEX "label_templates_tenant_id_idx" ON "label_templates"("tenant_id");

CREATE TABLE "label_assignments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "packaging_spec_id" TEXT NOT NULL,
  "template_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("packaging_spec_id") REFERENCES "packaging_specs"("id") ON DELETE CASCADE,
  FOREIGN KEY ("template_id") REFERENCES "label_templates"("id")
);
CREATE INDEX "label_assignments_tenant_id_idx" ON "label_assignments"("tenant_id");
CREATE INDEX "label_assignments_spec_id_idx" ON "label_assignments"("packaging_spec_id");

CREATE TABLE "sscc_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "sscc" TEXT NOT NULL,
  "extension_digit" INT NOT NULL,
  "gs1_company_prefix" TEXT NOT NULL,
  "serial_ref" TEXT NOT NULL,
  "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "used_at" TIMESTAMP(3),
  "shipment_ref" TEXT
);
CREATE UNIQUE INDEX "sscc_records_tenant_sscc_key" ON "sscc_records"("tenant_id","sscc");
CREATE INDEX "sscc_records_tenant_id_idx" ON "sscc_records"("tenant_id");
