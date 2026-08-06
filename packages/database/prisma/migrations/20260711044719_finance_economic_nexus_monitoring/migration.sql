-- CreateTable
CREATE TABLE "economic_nexus_thresholds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "state" TEXT NOT NULL,
    "revenue_threshold" DECIMAL(15,2) NOT NULL DEFAULT 100000,
    "transaction_threshold" INTEGER,
    "measurement_period" TEXT NOT NULL DEFAULT 'TRAILING_12_MONTHS',
    "includes_exempt_sales" BOOLEAN NOT NULL DEFAULT false,
    "marketplace_facilitator_law" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_url" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_nexus_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus_monitoring_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "state" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transaction_count" INTEGER NOT NULL DEFAULT 0,
    "revenue_threshold" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transaction_threshold" INTEGER,
    "revenue_pct" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "transaction_pct" DECIMAL(6,2),
    "status" TEXT NOT NULL DEFAULT 'NOT_MET',
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nexus_monitoring_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus_registrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_REGISTERED',
    "registration_number" TEXT,
    "registered_at" TIMESTAMP(3),
    "effective_date" TIMESTAMP(3),
    "filing_frequency" TEXT,
    "next_filing_due_date" TIMESTAMP(3),
    "deregistered_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nexus_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "economic_nexus_thresholds_tenant_id_idx" ON "economic_nexus_thresholds"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "economic_nexus_thresholds_tenant_id_country_state_key" ON "economic_nexus_thresholds"("tenant_id", "country", "state");

-- CreateIndex
CREATE INDEX "nexus_monitoring_snapshots_tenant_id_idx" ON "nexus_monitoring_snapshots"("tenant_id");

-- CreateIndex
CREATE INDEX "nexus_monitoring_snapshots_tenant_id_state_idx" ON "nexus_monitoring_snapshots"("tenant_id", "state");

-- CreateIndex
CREATE INDEX "nexus_monitoring_snapshots_tenant_id_computed_at_idx" ON "nexus_monitoring_snapshots"("tenant_id", "computed_at");

-- CreateIndex
CREATE INDEX "nexus_registrations_tenant_id_idx" ON "nexus_registrations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "nexus_registrations_tenant_id_country_state_key" ON "nexus_registrations"("tenant_id", "country", "state");
