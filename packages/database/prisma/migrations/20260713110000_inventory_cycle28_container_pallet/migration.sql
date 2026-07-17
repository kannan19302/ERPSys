-- Cycle 28: Container & Pallet Management

CREATE TYPE "PalletTypeCategory" AS ENUM ('STANDARD','EURO','CHEP','CUSTOM');
CREATE TYPE "ContainerTypeCategory" AS ENUM ('DRY_VAN','REEFER','FLAT_RACK','OPEN_TOP','TANK','BULK');
CREATE TYPE "LoadPlanStatus" AS ENUM ('DRAFT','OPTIMIZING','READY','IN_LOADING','LOADED','SHIPPED','CANCELLED');
CREATE TYPE "PackingPlanStatus" AS ENUM ('DRAFT','CONFIRMED','PACKING','COMPLETED','CANCELLED');

CREATE TABLE "pallet_types" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "PalletTypeCategory" NOT NULL,
  "length_mm" INT NOT NULL,
  "width_mm" INT NOT NULL,
  "height_mm" INT NOT NULL,
  "max_weight_kg" DECIMAL(10,2) NOT NULL,
  "own_weight_kg" DECIMAL(10,2) NOT NULL,
  "is_stackable" BOOLEAN NOT NULL DEFAULT false,
  "max_stack_layers" INT NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","code")
);
CREATE INDEX "pallet_types_tenant_id_idx" ON "pallet_types"("tenant_id");

CREATE TABLE "container_types" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "ContainerTypeCategory" NOT NULL,
  "iso_code" TEXT,
  "external_length_mm" INT NOT NULL,
  "external_width_mm" INT NOT NULL,
  "external_height_mm" INT NOT NULL,
  "internal_length_mm" INT NOT NULL,
  "internal_width_mm" INT NOT NULL,
  "internal_height_mm" INT NOT NULL,
  "max_payload_kg" DECIMAL(12,2) NOT NULL,
  "tare" DECIMAL(12,2) NOT NULL,
  "max_volume_m3" DECIMAL(10,3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","code")
);
CREATE INDEX "container_types_tenant_id_idx" ON "container_types"("tenant_id");

CREATE TABLE "load_plans" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "plan_number" TEXT NOT NULL,
  "container_type_id" TEXT NOT NULL,
  "shipment_ref" TEXT,
  "origin_warehouse" TEXT NOT NULL,
  "dest_address" TEXT NOT NULL,
  "planned_load_date" TIMESTAMPTZ,
  "status" "LoadPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "total_weight_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_volume_m3" DECIMAL(10,3) NOT NULL DEFAULT 0,
  "utilization_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "optimization_notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","plan_number"),
  FOREIGN KEY ("container_type_id") REFERENCES "container_types"("id")
);
CREATE INDEX "load_plans_tenant_id_idx" ON "load_plans"("tenant_id");
CREATE INDEX "load_plans_status_idx" ON "load_plans"("status");

CREATE TABLE "load_plan_pallets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "load_plan_id" TEXT NOT NULL,
  "pallet_type_id" TEXT NOT NULL,
  "pallet_sequence" INT NOT NULL,
  "position_x" INT,
  "position_y" INT,
  "position_z" INT,
  "gross_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "net_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "stack_layer" INT NOT NULL DEFAULT 1,
  "notes" TEXT,
  FOREIGN KEY ("load_plan_id") REFERENCES "load_plans"("id") ON DELETE CASCADE,
  FOREIGN KEY ("pallet_type_id") REFERENCES "pallet_types"("id")
);
CREATE INDEX "load_plan_pallets_tenant_id_idx" ON "load_plan_pallets"("tenant_id");
CREATE INDEX "load_plan_pallets_load_plan_id_idx" ON "load_plan_pallets"("load_plan_id");

CREATE TABLE "load_plan_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "load_plan_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" DECIMAL(15,4) NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'UNIT',
  "gross_weight_kg" DECIMAL(10,2),
  "volume_m3" DECIMAL(10,4),
  "pallet_sequence" INT,
  "notes" TEXT,
  FOREIGN KEY ("load_plan_id") REFERENCES "load_plans"("id") ON DELETE CASCADE
);
CREATE INDEX "load_plan_items_tenant_id_idx" ON "load_plan_items"("tenant_id");
CREATE INDEX "load_plan_items_load_plan_id_idx" ON "load_plan_items"("load_plan_id");

CREATE TABLE "packing_plans" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "plan_number" TEXT NOT NULL,
  "sales_order_ref" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "status" "PackingPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "planned_date" TIMESTAMPTZ,
  "total_cartons" INT NOT NULL DEFAULT 0,
  "total_weight_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "instructions" TEXT,
  "completed_at" TIMESTAMPTZ,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("tenant_id","plan_number")
);
CREATE INDEX "packing_plans_tenant_id_idx" ON "packing_plans"("tenant_id");
CREATE INDEX "packing_plans_status_idx" ON "packing_plans"("status");

CREATE TABLE "load_cartons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "packing_plan_id" TEXT NOT NULL,
  "carton_number" TEXT NOT NULL,
  "length_mm" INT,
  "width_mm" INT,
  "height_mm" INT,
  "gross_weight_kg" DECIMAL(10,2),
  "sealed" BOOLEAN NOT NULL DEFAULT false,
  "label_printed" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("packing_plan_id") REFERENCES "packing_plans"("id") ON DELETE CASCADE
);
CREATE INDEX "load_cartons_tenant_id_idx" ON "load_cartons"("tenant_id");
CREATE INDEX "load_cartons_packing_plan_id_idx" ON "load_cartons"("packing_plan_id");

CREATE TABLE "load_carton_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "carton_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "quantity" DECIMAL(15,4) NOT NULL,
  "uom" TEXT NOT NULL DEFAULT 'UNIT',
  FOREIGN KEY ("carton_id") REFERENCES "load_cartons"("id") ON DELETE CASCADE
);
CREATE INDEX "packing_carton_items_tenant_id_idx" ON "load_carton_items"("tenant_id");
CREATE INDEX "packing_carton_items_carton_id_idx" ON "load_carton_items"("carton_id");
