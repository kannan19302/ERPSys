-- CreateEnum
CREATE TYPE "PickWaveItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PICKED', 'SHORT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickTaskStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "pick_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pickWaveId" TEXT NOT NULL,
    "pickItemId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" "PickTaskStatus" NOT NULL DEFAULT 'ASSIGNED',
    "binLocation" TEXT,
    "instructionNote" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pick_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pick_tasks_tenantId_idx" ON "pick_tasks"("tenantId");
CREATE INDEX "pick_tasks_tenantId_pickWaveId_idx" ON "pick_tasks"("tenantId", "pickWaveId");
CREATE INDEX "pick_tasks_tenantId_assignedTo_idx" ON "pick_tasks"("tenantId", "assignedTo");
CREATE INDEX "pick_tasks_tenantId_status_idx" ON "pick_tasks"("tenantId", "status");
