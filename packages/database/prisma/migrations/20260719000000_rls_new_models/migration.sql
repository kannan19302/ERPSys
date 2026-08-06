-- Enable RLS on new tables and create tenant_isolation policies.
BEGIN;
DO $$DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN (
    'lead_scoring_behavioral_config',
    'lead_scoring_demographic_config',
    'lead_scoring_predictive_model',
    'lead_scoring_composite_config',
    'nurture_campaign',
    'nurture_step',
    'nurture_content',
    'nurture_ab_test'
  )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', tbl, tbl);
  END LOOP;
END$$;
COMMIT;