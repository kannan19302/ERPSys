-- CreateTable
CREATE TABLE "dock_appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "dock_door" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "carrier_name" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "checked_in_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dock_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dock_appointments_tenant_id_idx" ON "dock_appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "dock_appointments_tenant_id_warehouse_id_dock_door_idx" ON "dock_appointments"("tenant_id", "warehouse_id", "dock_door");

-- CreateIndex
CREATE INDEX "dock_appointments_tenant_id_status_idx" ON "dock_appointments"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "dock_appointments" ADD CONSTRAINT "dock_appointments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
