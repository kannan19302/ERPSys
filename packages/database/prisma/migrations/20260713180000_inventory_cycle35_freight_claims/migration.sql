-- CreateEnum
CREATE TYPE "DamageReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLAIM_FILED', 'RESOLVED', 'CLOSED');
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'SEVERE');
CREATE TYPE "FreightClaimType" AS ENUM ('DAMAGE', 'SHORTAGE', 'LOSS', 'DELAY', 'CONCEALED');
CREATE TYPE "FreightClaimStatus" AS ENUM ('DRAFT', 'FILED', 'ACKNOWLEDGED', 'UNDER_INVESTIGATION', 'SETTLEMENT_OFFERED', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateTable: cargo_damage_reports
CREATE TABLE "cargo_damage_reports" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "report_number" TEXT NOT NULL,
  "shipment_id" TEXT,
  "purchase_order_id" TEXT,
  "carrier_id" TEXT,
  "warehouse_id" TEXT,
  "reported_by_id" TEXT NOT NULL,
  "discovered_at" TIMESTAMP(3) NOT NULL,
  "severity" "DamageSeverity" NOT NULL DEFAULT 'MINOR',
  "status" "DamageReportStatus" NOT NULL DEFAULT 'DRAFT',
  "description" TEXT NOT NULL,
  "affected_skus" TEXT,
  "quantity_damaged" DECIMAL(18,4),
  "estimated_loss" DECIMAL(18,4),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "photo_urls" TEXT,
  "notes" TEXT,
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cargo_damage_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cargo_damage_reports_tenant_id_report_number_key" ON "cargo_damage_reports"("tenant_id", "report_number");
CREATE INDEX "cargo_damage_reports_tenant_id_idx" ON "cargo_damage_reports"("tenant_id");
CREATE INDEX "cargo_damage_reports_tenant_id_status_idx" ON "cargo_damage_reports"("tenant_id", "status");
CREATE INDEX "cargo_damage_reports_tenant_id_carrier_id_idx" ON "cargo_damage_reports"("tenant_id", "carrier_id");

-- CreateTable: freight_claims
CREATE TABLE "freight_claims" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "claim_number" TEXT NOT NULL,
  "damage_report_id" TEXT NOT NULL,
  "carrier_id" TEXT NOT NULL,
  "claim_type" "FreightClaimType" NOT NULL,
  "status" "FreightClaimStatus" NOT NULL DEFAULT 'DRAFT',
  "claimed_amount" DECIMAL(18,4) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "filed_by_id" TEXT,
  "filed_at" TIMESTAMP(3),
  "carrier_ref_number" TEXT,
  "settlement_amount" DECIMAL(18,4),
  "settlement_date" TIMESTAMP(3),
  "accepted_by_id" TEXT,
  "rejection_reason" TEXT,
  "due_date" TIMESTAMP(3),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "freight_claims_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "freight_claims_damage_report_id_key" ON "freight_claims"("damage_report_id");
CREATE UNIQUE INDEX "freight_claims_tenant_id_claim_number_key" ON "freight_claims"("tenant_id", "claim_number");
CREATE INDEX "freight_claims_tenant_id_idx" ON "freight_claims"("tenant_id");
CREATE INDEX "freight_claims_tenant_id_status_idx" ON "freight_claims"("tenant_id", "status");
CREATE INDEX "freight_claims_tenant_id_carrier_id_idx" ON "freight_claims"("tenant_id", "carrier_id");
CREATE INDEX "freight_claims_tenant_id_claim_type_idx" ON "freight_claims"("tenant_id", "claim_type");
ALTER TABLE "freight_claims" ADD CONSTRAINT "freight_claims_damage_report_id_fkey" FOREIGN KEY ("damage_report_id") REFERENCES "cargo_damage_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: freight_claim_events
CREATE TABLE "freight_claim_events" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "recorded_by_id" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "freight_claim_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "freight_claim_events_tenant_id_idx" ON "freight_claim_events"("tenant_id");
CREATE INDEX "freight_claim_events_tenant_id_claim_id_idx" ON "freight_claim_events"("tenant_id", "claim_id");
