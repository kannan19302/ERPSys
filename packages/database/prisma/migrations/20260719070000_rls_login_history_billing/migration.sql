-- login_histories, tenant_addons, and payment_methods (added in
-- 20260718154634_add_login_history / 20260718160813_add_billing_and_coupon_models)
-- were created AFTER the one-time RLS sweep in 20260718101000_rls_all_tables and
-- so never got a tenant_isolation policy — a real Track C (#21) gap: any
-- tenant-scoped table must carry RLS. saas_coupons/saas_addons/quota_rules are
-- global catalog tables (no tenant_id column) and correctly need none.

DO $$DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['login_histories', 'tenant_addons', 'payment_methods'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', tbl, tbl);
  END LOOP;
END$$;
