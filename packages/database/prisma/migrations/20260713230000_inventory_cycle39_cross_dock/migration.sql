-- CreateEnum
CREATE TYPE "CrossDockStatus" AS ENUM ('PENDING', 'RECEIVING', 'STAGING', 'DISPATCHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrossDockType" AS ENUM ('OPPORTUNISTIC', 'PLANNED', 'FLOW_THROUGH');

-- CreateTable
CREATE TABLE "cross_dock_stations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doorNumber" TEXT NOT NULL,
    "status" "DockDoorStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isInbound" BOOLEAN NOT NULL DEFAULT true,
    "isOutbound" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cross_dock_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_dock_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "type" "CrossDockType" NOT NULL DEFAULT 'OPPORTUNISTIC',
    "status" "CrossDockStatus" NOT NULL DEFAULT 'PENDING',
    "warehouseId" TEXT NOT NULL,
    "stationId" TEXT,
    "productId" TEXT NOT NULL,
    "expectedQty" DECIMAL(18,4) NOT NULL,
    "receivedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "dispatchedQty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "inboundRef" TEXT,
    "outboundRef" TEXT,
    "supplierName" TEXT,
    "customerName" TEXT,
    "expected_arrival" TIMESTAMP(3),
    "expected_dispatch" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cross_dock_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_dock_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "qty" DECIMAL(18,4),
    "notes" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cross_dock_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cross_dock_stations_tenantId_warehouseId_code_key" ON "cross_dock_stations"("tenantId", "warehouseId", "code");
CREATE INDEX "cross_dock_stations_tenantId_idx" ON "cross_dock_stations"("tenantId");
CREATE INDEX "cross_dock_stations_tenantId_warehouseId_idx" ON "cross_dock_stations"("tenantId", "warehouseId");
CREATE INDEX "cross_dock_stations_tenantId_status_idx" ON "cross_dock_stations"("tenantId", "status");

CREATE UNIQUE INDEX "cross_dock_orders_tenantId_orderNumber_key" ON "cross_dock_orders"("tenantId", "orderNumber");
CREATE INDEX "cross_dock_orders_tenantId_idx" ON "cross_dock_orders"("tenantId");
CREATE INDEX "cross_dock_orders_tenantId_status_idx" ON "cross_dock_orders"("tenantId", "status");
CREATE INDEX "cross_dock_orders_tenantId_warehouseId_idx" ON "cross_dock_orders"("tenantId", "warehouseId");
CREATE INDEX "cross_dock_orders_tenantId_productId_idx" ON "cross_dock_orders"("tenantId", "productId");

CREATE INDEX "cross_dock_events_tenantId_idx" ON "cross_dock_events"("tenantId");
CREATE INDEX "cross_dock_events_tenantId_orderId_idx" ON "cross_dock_events"("tenantId", "orderId");

-- AddForeignKey
ALTER TABLE "cross_dock_orders" ADD CONSTRAINT "cross_dock_orders_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "cross_dock_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cross_dock_events" ADD CONSTRAINT "cross_dock_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "cross_dock_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
