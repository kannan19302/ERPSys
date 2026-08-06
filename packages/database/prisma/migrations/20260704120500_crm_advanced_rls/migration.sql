-- Row-Level Security policies for the 7 CRM advanced-feature tables added by
-- 20260704120000_crm_advanced_features. Follows the canonical pattern from
-- 20260626120000_rls_policies: single combined USING + WITH CHECK policy per
-- table, ENABLE + FORCE RLS, tenant context read from current_tenant_id().
--
-- Idempotent: DROP POLICY IF EXISTS ... ; CREATE POLICY ...
-- Assumes current_tenant_id() function already exists (created by the canonical
-- 20260626120000_rls_policies migration).

-- ────────────────────────────────────────────────
-- Tables with a direct tenant_id column
-- ────────────────────────────────────────────────
DO $rls$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_lead_scoring_rules',
    'crm_duplicate_rules',
    'crm_pipeline_stages',
    'crm_segments',
    'crm_sla_policies',
    'crm_sla_breaches'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || t, t);
      EXECUTE format(
        'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())',
        'tenant_isolation_' || t, t
      );
    END IF;
  END LOOP;
END;
$rls$;

-- ────────────────────────────────────────────────
-- crm_segment_members: no direct tenant_id column — scoped indirectly through
-- the parent crm_segments row. Deviation from the canonical pattern: policy
-- predicate uses an EXISTS subquery against the parent segment's tenant_id.
-- ────────────────────────────────────────────────
DO $rls_members$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'crm_segment_members'
  ) THEN
    ALTER TABLE "crm_segment_members" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "crm_segment_members" FORCE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "tenant_isolation_crm_segment_members" ON "crm_segment_members";
    CREATE POLICY "tenant_isolation_crm_segment_members"
      ON "crm_segment_members"
      USING (
        EXISTS (
          SELECT 1 FROM "crm_segments" s
          WHERE s."id" = "crm_segment_members"."segment_id"
            AND s."tenant_id" = current_tenant_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM "crm_segments" s
          WHERE s."id" = "crm_segment_members"."segment_id"
            AND s."tenant_id" = current_tenant_id()
        )
      );
  END IF;
END;
$rls_members$;
