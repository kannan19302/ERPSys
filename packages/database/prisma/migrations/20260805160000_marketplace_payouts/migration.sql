-- Marketplace earnings and payouts — PLATFORM_ARCHITECTURE.md § 8, Phase 5.
--
-- Replaces a fabricated figure: `getRevenueAnalytics` computed
-- `totalRevenue = apps.length * 1000`, then derived commission and
-- `developerPayouts: totalRevenue * 0.7` from that invention, in binary
-- floating point. Publishers are real companies expecting real money, so the
-- numbers behind a payout have to come from a ledger.
--
-- These are PLATFORM-level tables with no tenant_id, deliberately. An earning
-- belongs to a publisher, who sells across many tenants; scoping the row to the
-- paying tenant would hide a publisher's own ledger from them. The paying
-- tenant is recorded as `paying_tenant_id` — data, not scope — and the column
-- is deliberately not called `tenant_id` so that neither the tenant-scope
-- extension nor the RLS sweep mistakes a platform ledger for tenant data.
-- Access is enforced at the permission layer instead.

CREATE TABLE "marketplace_payout_batches" (
  "id"                  TEXT NOT NULL,
  "vendor_id"           TEXT NOT NULL,
  "period_start"        TIMESTAMP(3) NOT NULL,
  "period_end"          TIMESTAMP(3) NOT NULL,
  "total_amount"        DECIMAL(19,4) NOT NULL,
  "currency"            TEXT NOT NULL DEFAULT 'USD',
  "status"              TEXT NOT NULL DEFAULT 'DRAFT',
  "provider_ref"        TEXT,
  "provider"            TEXT,
  "approved_by_user_id" TEXT,
  "approved_at"         TIMESTAMP(3),
  "paid_at"             TIMESTAMP(3),
  "failure_reason"      TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_payout_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_payout_batches_vendor_id_status_idx"
  ON "marketplace_payout_batches" ("vendor_id", "status");

CREATE TABLE "marketplace_earnings" (
  "id"                TEXT NOT NULL,
  "vendor_id"         TEXT NOT NULL,
  "app_slug"          TEXT NOT NULL,
  "paying_tenant_id"  TEXT NOT NULL,
  "gross_amount"      DECIMAL(19,4) NOT NULL,
  "commission_amount" DECIMAL(19,4) NOT NULL,
  "net_amount"        DECIMAL(19,4) NOT NULL,
  "commission_rate"   DECIMAL(9,6) NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'USD',
  "status"            TEXT NOT NULL DEFAULT 'PENDING',
  "payout_batch_id"   TEXT,
  "earned_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_earnings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_earnings_vendor_id_status_idx"
  ON "marketplace_earnings" ("vendor_id", "status");
CREATE INDEX "marketplace_earnings_payout_batch_id_idx"
  ON "marketplace_earnings" ("payout_batch_id");

ALTER TABLE "marketplace_earnings"
  ADD CONSTRAINT "marketplace_earnings_payout_batch_id_fkey"
  FOREIGN KEY ("payout_batch_id") REFERENCES "marketplace_payout_batches"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
