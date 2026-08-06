-- R11 — the last seven Float columns that carry, or multiply, money.
-- ARCHITECTURE_REVIEW § F11; PLATFORM_ARCHITECTURE.md § 10 ("Decimal(19,4) for money").
--
-- The other 22 Float columns the name heuristic flagged are genuinely
-- dimensionless (delivery rates, SPC measurements, ML accuracy, hours, unit
-- counts) and are recorded field-by-field in scripts/ci/float-classification.json
-- rather than converted. Only these seven are money or are multiplied by it.
--
-- Amounts use Decimal(19,4), the platform money type. Rates use Decimal(9,6):
-- a tax, discount, interest or cost-allocation rate is multiplied by an amount,
-- so drift in the rate becomes drift in the money, but the rate itself needs
-- fractional precision rather than currency precision.
--
-- double precision -> numeric is a widening conversion with an exact USING
-- cast, so this is safe to run against existing rows and does not need the
-- expand/contract dance: no value is truncated and no application code
-- observes a narrower type. Backward-compatible for one full train
-- (§ 13.4) because a numeric column still serialises to a JSON number.

-- ── amounts ──────────────────────────────────────────────────────────────────
ALTER TABLE "logistics_provider_performance"
  ALTER COLUMN "cost_variance" TYPE DECIMAL(19,4) USING "cost_variance"::numeric;

ALTER TABLE "production_analytics_snapshots"
  ALTER COLUMN "cost_per_unit" TYPE DECIMAL(19,4) USING "cost_per_unit"::numeric;

-- ── rates that multiply an amount ────────────────────────────────────────────
ALTER TABLE "hs_code_classifications"
  ALTER COLUMN "tariff_rate" TYPE DECIMAL(9,6) USING "tariff_rate"::numeric;

ALTER TABLE "hs_code_classifications"
  ALTER COLUMN "vat_rate" TYPE DECIMAL(9,6) USING "vat_rate"::numeric;

ALTER TABLE "dynamic_discount_requests"
  ALTER COLUMN "discount_rate" TYPE DECIMAL(9,6) USING "discount_rate"::numeric;

ALTER TABLE "scm_financing_facilities"
  ALTER COLUMN "interest_rate" TYPE DECIMAL(9,6) USING "interest_rate"::numeric;

ALTER TABLE "co_products"
  ALTER COLUMN "value_factor" TYPE DECIMAL(9,6) USING "value_factor"::numeric;
