-- Cycle 24: Yard Management System

CREATE TYPE "DockDoorType" AS ENUM ('INBOUND', 'OUTBOUND', 'DUAL');
CREATE TYPE "DockDoorStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'LOADING', 'COMPLETE', 'NO_SHOW', 'CANCELLED');
CREATE TYPE "YardMoveStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED');

CREATE TABLE "dock_doors" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "door_number" TEXT NOT NULL,
  "door_type" "DockDoorType" NOT NULL DEFAULT 'DUAL',
  "status" "DockDoorStatus" NOT NULL DEFAULT 'AVAILABLE',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dock_doors_tenant_warehouse_door_key" UNIQUE("tenant_id","warehouse_id","door_number")
);
CREATE INDEX "dock_doors_tenant_id_idx" ON "dock_doors"("tenant_id");
CREATE INDEX "dock_doors_warehouse_id_idx" ON "dock_doors"("warehouse_id");

CREATE TABLE "yard_appointments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "appointment_number" TEXT NOT NULL,
  "dock_door_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "carrier_id" TEXT,
  "carrier_name" TEXT,
  "driver_name" TEXT,
  "truck_plate" TEXT,
  "trailer_number" TEXT,
  "appointment_type" TEXT NOT NULL DEFAULT 'INBOUND',
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "checked_in_at" TIMESTAMP(3),
  "loading_start_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "reference_number" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "yard_appointments_tenant_number_key" UNIQUE("tenant_id","appointment_number"),
  CONSTRAINT "yard_appointments_dock_door_fk" FOREIGN KEY("dock_door_id") REFERENCES "dock_doors"("id") ON DELETE SET NULL
);
CREATE INDEX "yard_appointments_tenant_id_idx" ON "yard_appointments"("tenant_id");
CREATE INDEX "yard_appointments_warehouse_id_idx" ON "yard_appointments"("warehouse_id");
CREATE INDEX "yard_appointments_dock_door_id_idx" ON "yard_appointments"("dock_door_id");
CREATE INDEX "yard_appointments_status_idx" ON "yard_appointments"("status");

CREATE TABLE "gate_passes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "appointment_id" TEXT NOT NULL UNIQUE,
  "pass_number" TEXT NOT NULL,
  "gate_in_at" TIMESTAMP(3),
  "gate_out_at" TIMESTAMP(3),
  "gate_in_by" TEXT,
  "gate_out_by" TEXT,
  "vehicle_weight" DECIMAL(10,2),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gate_passes_tenant_number_key" UNIQUE("tenant_id","pass_number"),
  CONSTRAINT "gate_passes_appointment_fk" FOREIGN KEY("appointment_id") REFERENCES "yard_appointments"("id") ON DELETE CASCADE
);
CREATE INDEX "gate_passes_tenant_id_idx" ON "gate_passes"("tenant_id");

CREATE TABLE "yard_moves" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "appointment_id" TEXT,
  "warehouse_id" TEXT NOT NULL,
  "trailer_number" TEXT NOT NULL,
  "from_location" TEXT NOT NULL,
  "to_location" TEXT NOT NULL,
  "status" "YardMoveStatus" NOT NULL DEFAULT 'PENDING',
  "assigned_to" TEXT,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "yard_moves_appointment_fk" FOREIGN KEY("appointment_id") REFERENCES "yard_appointments"("id") ON DELETE SET NULL
);
CREATE INDEX "yard_moves_tenant_id_idx" ON "yard_moves"("tenant_id");
CREATE INDEX "yard_moves_warehouse_id_idx" ON "yard_moves"("warehouse_id");
CREATE INDEX "yard_moves_status_idx" ON "yard_moves"("status");

CREATE TABLE "yard_inventory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "trailer_number" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "product_id" TEXT,
  "description" TEXT,
  "qty" DECIMAL(15,4),
  "uom" TEXT,
  "arrived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "departed_at" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "yard_inventory_tenant_id_idx" ON "yard_inventory"("tenant_id");
CREATE INDEX "yard_inventory_warehouse_id_idx" ON "yard_inventory"("warehouse_id");
CREATE INDEX "yard_inventory_trailer_number_idx" ON "yard_inventory"("trailer_number");
