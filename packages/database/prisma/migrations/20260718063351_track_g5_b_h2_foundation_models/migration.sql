-- CreateTable
CREATE TABLE "tenant_lifecycle_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "initiatedBy" TEXT,
    "retentionDays" INTEGER DEFAULT 90,
    "payload" JSONB,
    "errorMessage" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_version" INTEGER NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "event_key" TEXT NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "outbox_event_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lease_owner" TEXT,
    "lease_expires_at" TIMESTAMP(3),
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_consumer_receipts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "outbox_event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_consumer_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "series" TEXT NOT NULL,
    "description" TEXT,
    "prefix" TEXT NOT NULL DEFAULT '',
    "suffix" TEXT NOT NULL DEFAULT '',
    "padding" INTEGER NOT NULL DEFAULT 5,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "reset_frequency" TEXT,
    "reset_period" TEXT,
    "format" TEXT NOT NULL DEFAULT '{prefix}{number}{suffix}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_lifecycle_events_tenantId_idx" ON "tenant_lifecycle_events"("tenantId");

-- CreateIndex
CREATE INDEX "outbox_events_tenant_id_idx" ON "outbox_events"("tenant_id");

-- CreateIndex
CREATE INDEX "outbox_events_tenant_id_aggregate_type_aggregate_id_idx" ON "outbox_events"("tenant_id", "aggregate_type", "aggregate_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_tenant_id_event_key_key" ON "outbox_events"("tenant_id", "event_key");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_tenant_id_aggregate_type_aggregate_id_sequenc_key" ON "outbox_events"("tenant_id", "aggregate_type", "aggregate_id", "sequence");

-- CreateIndex
CREATE INDEX "outbox_deliveries_tenant_id_idx" ON "outbox_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "outbox_deliveries_status_available_at_idx" ON "outbox_deliveries"("status", "available_at");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_deliveries_outbox_event_id_destination_key" ON "outbox_deliveries"("outbox_event_id", "destination");

-- CreateIndex
CREATE INDEX "outbox_consumer_receipts_tenant_id_idx" ON "outbox_consumer_receipts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_consumer_receipts_consumer_outbox_event_id_key" ON "outbox_consumer_receipts"("consumer", "outbox_event_id");

-- CreateIndex
CREATE INDEX "document_sequences_tenant_id_idx" ON "document_sequences"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_tenant_id_series_organization_id_key" ON "document_sequences"("tenant_id", "series", "organization_id");

-- AddForeignKey
ALTER TABLE "tenant_lifecycle_events" ADD CONSTRAINT "tenant_lifecycle_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_deliveries" ADD CONSTRAINT "outbox_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_deliveries" ADD CONSTRAINT "outbox_deliveries_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_consumer_receipts" ADD CONSTRAINT "outbox_consumer_receipts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
