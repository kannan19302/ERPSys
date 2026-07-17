-- CreateEnum
CREATE TYPE "ShipmentDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ShipmentExceptionStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED');

-- CreateTable
CREATE TABLE "shipment_exceptions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "direction" "ShipmentDirection" NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "exceptionCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" "ShipmentExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "resolvedBy" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shipment_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipment_exceptions_tenantId_idx" ON "shipment_exceptions"("tenantId");
CREATE INDEX "shipment_exceptions_tenantId_shipmentId_idx" ON "shipment_exceptions"("tenantId", "shipmentId");
CREATE INDEX "shipment_exceptions_tenantId_status_idx" ON "shipment_exceptions"("tenantId", "status");
