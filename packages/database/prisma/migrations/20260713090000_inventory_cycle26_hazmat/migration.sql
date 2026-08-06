-- Cycle 26: Hazardous Materials & Dangerous Goods Management

CREATE TYPE "HazardClass" AS ENUM (
  'CLASS_1_EXPLOSIVES','CLASS_2_GASES','CLASS_3_FLAMMABLE_LIQUIDS',
  'CLASS_4_FLAMMABLE_SOLIDS','CLASS_5_OXIDIZERS','CLASS_6_TOXIC',
  'CLASS_7_RADIOACTIVE','CLASS_8_CORROSIVES','CLASS_9_MISC'
);
CREATE TYPE "PackingGroup" AS ENUM ('I','II','III');
CREATE TYPE "HazmatRegulation" AS ENUM ('ADR','IATA','IMDG','DOT','REACH');
CREATE TYPE "SdsStatus" AS ENUM ('CURRENT','EXPIRED','PENDING_REVIEW','SUPERSEDED');
CREATE TYPE "HazmatManifestStatus" AS ENUM ('DRAFT','SUBMITTED','ACKNOWLEDGED','IN_TRANSIT','DELIVERED','CANCELLED');
CREATE TYPE "StorageCompatibilityResult" AS ENUM ('COMPATIBLE','INCOMPATIBLE','CONDITIONAL');

CREATE TABLE "hazmat_classifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "un_number" TEXT NOT NULL,
  "proper_shipping_name" TEXT NOT NULL,
  "hazard_class" "HazardClass" NOT NULL,
  "subsidiary_hazards" TEXT[] NOT NULL DEFAULT '{}',
  "packing_group" "PackingGroup",
  "regulation" "HazmatRegulation" NOT NULL,
  "flash_point" DECIMAL(8,2),
  "boiling_point" DECIMAL(8,2),
  "max_qty_per_package" DECIMAL(15,4),
  "transport_index" DECIMAL(8,2),
  "is_exempted" BOOLEAN NOT NULL DEFAULT false,
  "exemption_ref" TEXT,
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","product_id","regulation")
);
CREATE INDEX "hazmat_classifications_tenant_id_idx" ON "hazmat_classifications"("tenant_id");
CREATE INDEX "hazmat_classifications_un_number_idx" ON "hazmat_classifications"("un_number");

CREATE TABLE "safety_data_sheets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "classification_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "sds_number" TEXT NOT NULL,
  "revision" TEXT NOT NULL,
  "issue_date" TIMESTAMPTZ NOT NULL,
  "expiry_date" TIMESTAMPTZ,
  "supplier" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'EN',
  "status" "SdsStatus" NOT NULL DEFAULT 'CURRENT',
  "storage_conditions" TEXT,
  "first_aid_measures" TEXT,
  "spill_procedures" TEXT,
  "disposal_methods" TEXT,
  "document_url" TEXT,
  "acknowledged_by" TEXT,
  "acknowledged_at" TIMESTAMPTZ,
  "superseded_by_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","sds_number"),
  FOREIGN KEY ("classification_id") REFERENCES "hazmat_classifications"("id") ON DELETE CASCADE
);
CREATE INDEX "safety_data_sheets_tenant_id_idx" ON "safety_data_sheets"("tenant_id");
CREATE INDEX "safety_data_sheets_product_id_idx" ON "safety_data_sheets"("product_id");
CREATE INDEX "safety_data_sheets_status_idx" ON "safety_data_sheets"("status");

CREATE TABLE "hazmat_storage_rules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "hazard_class_a" "HazardClass" NOT NULL,
  "hazard_class_b" "HazardClass" NOT NULL,
  "result" "StorageCompatibilityResult" NOT NULL,
  "condition" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","hazard_class_a","hazard_class_b")
);
CREATE INDEX "hazmat_storage_rules_tenant_id_idx" ON "hazmat_storage_rules"("tenant_id");

CREATE TABLE "hazmat_manifests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "manifest_number" TEXT NOT NULL,
  "regulation" "HazmatRegulation" NOT NULL,
  "shipment_ref" TEXT,
  "carrier_id" TEXT,
  "carrier_name" TEXT,
  "origin_address" TEXT NOT NULL,
  "dest_address" TEXT NOT NULL,
  "shipped_at" TIMESTAMPTZ,
  "delivered_at" TIMESTAMPTZ,
  "status" "HazmatManifestStatus" NOT NULL DEFAULT 'DRAFT',
  "total_gross_weight" DECIMAL(15,4),
  "weight_unit" TEXT NOT NULL DEFAULT 'KG',
  "emergency_contact" TEXT,
  "special_instructions" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","manifest_number")
);
CREATE INDEX "hazmat_manifests_tenant_id_idx" ON "hazmat_manifests"("tenant_id");
CREATE INDEX "hazmat_manifests_status_idx" ON "hazmat_manifests"("status");

CREATE TABLE "hazmat_manifest_lines" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "manifest_id" TEXT NOT NULL,
  "classification_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" DECIMAL(15,4) NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'KG',
  "gross_weight" DECIMAL(15,4),
  "net_weight" DECIMAL(15,4),
  "number_of_packages" INT NOT NULL DEFAULT 1,
  "packaging_type" TEXT,
  "label_required" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  FOREIGN KEY ("manifest_id") REFERENCES "hazmat_manifests"("id") ON DELETE CASCADE,
  FOREIGN KEY ("classification_id") REFERENCES "hazmat_classifications"("id")
);
CREATE INDEX "hazmat_manifest_lines_tenant_id_idx" ON "hazmat_manifest_lines"("tenant_id");
CREATE INDEX "hazmat_manifest_lines_manifest_id_idx" ON "hazmat_manifest_lines"("manifest_id");

CREATE TABLE "hazmat_incidents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "incident_number" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "warehouse_id" TEXT,
  "incident_date" TIMESTAMPTZ NOT NULL,
  "severity" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "immediate_action" TEXT,
  "root_cause" TEXT,
  "corrective_action" TEXT,
  "reported_by" TEXT NOT NULL,
  "reported_to_authority" BOOLEAN NOT NULL DEFAULT false,
  "authority_ref" TEXT,
  "closed_at" TIMESTAMPTZ,
  "closed_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","incident_number")
);
CREATE INDEX "hazmat_incidents_tenant_id_idx" ON "hazmat_incidents"("tenant_id");
CREATE INDEX "hazmat_incidents_product_id_idx" ON "hazmat_incidents"("product_id");
