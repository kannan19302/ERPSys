-- Cycle 27: Approved Supplier List (ASL) & Vendor Item Catalog

CREATE TYPE "AslStatus" AS ENUM ('APPROVED','CONDITIONAL','DISQUALIFIED','PENDING_APPROVAL');
CREATE TYPE "AslChangeType" AS ENUM ('APPROVED','DISQUALIFIED','CONDITIONAL','PRICE_UPDATE','LEAD_TIME_UPDATE','PREFERRED_UPDATE');

CREATE TABLE "approved_suppliers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "vendor_product_ref" TEXT,
  "vendor_product_name" TEXT,
  "status" "AslStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "is_preferred" BOOLEAN NOT NULL DEFAULT false,
  "preference_rank" INT NOT NULL DEFAULT 999,
  "unit_price" DECIMAL(15,4),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "moq" DECIMAL(15,4),
  "lead_time_days" INT,
  "max_order_qty" DECIMAL(15,4),
  "uom" TEXT NOT NULL DEFAULT 'UNIT',
  "pack_size" DECIMAL(15,4),
  "qualification_date" TIMESTAMPTZ,
  "expiry_date" TIMESTAMPTZ,
  "conditional_note" TEXT,
  "disqualified_reason" TEXT,
  "approved_by" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","product_id","vendor_id")
);
CREATE INDEX "approved_suppliers_tenant_id_idx" ON "approved_suppliers"("tenant_id");
CREATE INDEX "approved_suppliers_product_id_idx" ON "approved_suppliers"("product_id");
CREATE INDEX "approved_suppliers_vendor_id_idx" ON "approved_suppliers"("vendor_id");
CREATE INDEX "approved_suppliers_status_idx" ON "approved_suppliers"("status");

CREATE TABLE "supplier_price_tiers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "approved_supplier_id" TEXT NOT NULL,
  "from_qty" DECIMAL(15,4) NOT NULL,
  "to_qty" DECIMAL(15,4),
  "unit_price" DECIMAL(15,4) NOT NULL,
  "effective_from" TIMESTAMPTZ NOT NULL,
  "effective_to" TIMESTAMPTZ,
  FOREIGN KEY ("approved_supplier_id") REFERENCES "approved_suppliers"("id") ON DELETE CASCADE
);
CREATE INDEX "supplier_price_tiers_tenant_id_idx" ON "supplier_price_tiers"("tenant_id");
CREATE INDEX "supplier_price_tiers_approved_supplier_id_idx" ON "supplier_price_tiers"("approved_supplier_id");

CREATE TABLE "asl_change_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "approved_supplier_id" TEXT NOT NULL,
  "change_type" "AslChangeType" NOT NULL,
  "previous_value" TEXT,
  "new_value" TEXT,
  "reason" TEXT,
  "changed_by" TEXT NOT NULL,
  "changed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY ("approved_supplier_id") REFERENCES "approved_suppliers"("id") ON DELETE CASCADE
);
CREATE INDEX "asl_change_logs_tenant_id_idx" ON "asl_change_logs"("tenant_id");
CREATE INDEX "asl_change_logs_approved_supplier_id_idx" ON "asl_change_logs"("approved_supplier_id");

CREATE TABLE "vendor_item_attributes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "vendor_id" TEXT NOT NULL,
  "attribute_key" TEXT NOT NULL,
  "attribute_value" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","product_id","vendor_id","attribute_key")
);
CREATE INDEX "vendor_item_attributes_tenant_id_idx" ON "vendor_item_attributes"("tenant_id");
CREATE INDEX "vendor_item_attributes_product_vendor_idx" ON "vendor_item_attributes"("product_id","vendor_id");

CREATE TABLE "asl_compliance_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_category" TEXT,
  "min_approved_vendors" INT NOT NULL DEFAULT 1,
  "requires_qualification" BOOLEAN NOT NULL DEFAULT false,
  "qualification_validity_days" INT,
  "requires_preferred" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","product_category")
);
CREATE INDEX "asl_compliance_rules_tenant_id_idx" ON "asl_compliance_rules"("tenant_id");
