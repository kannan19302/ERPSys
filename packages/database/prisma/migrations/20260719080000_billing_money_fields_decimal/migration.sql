-- Track G.8 money-field discipline: saas_coupons.discount_value,
-- saas_addons.price, and quota_rules.price_per_unit were created as
-- DOUBLE PRECISION in 20260718160813_add_billing_and_coupon_models (already
-- applied, so fixed forward here rather than editing that migration in
-- place). USING clause preserves existing values across the type change.

ALTER TABLE "saas_coupons"
  ALTER COLUMN "discount_value" TYPE DECIMAL(15,2) USING "discount_value"::DECIMAL(15,2);

ALTER TABLE "saas_addons"
  ALTER COLUMN "price" TYPE DECIMAL(15,2) USING "price"::DECIMAL(15,2);

ALTER TABLE "quota_rules"
  ALTER COLUMN "price_per_unit" TYPE DECIMAL(15,2) USING "price_per_unit"::DECIMAL(15,2);
