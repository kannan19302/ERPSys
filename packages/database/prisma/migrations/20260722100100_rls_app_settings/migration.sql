-- Enables tenant-isolation RLS on the recreated "app_settings" table, matching
-- the pattern applied to every other tenant-scoped table in 20260718101000_rls_all_tables
-- (which ran before this table existed, so it was never covered).

ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "app_settings" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_app_settings" ON "app_settings";

CREATE POLICY "tenant_isolation_app_settings" ON "app_settings"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());
