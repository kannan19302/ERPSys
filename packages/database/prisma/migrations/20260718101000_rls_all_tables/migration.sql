-- Track C (#21) — C.3: Policy inventory
-- Enable RLS on EVERY tenant-scoped table and create tenant_isolation policies.
-- Uses the existing current_tenant_id() function from 20260626120000_rls_policies.
--
-- Idempotent: ALTER TABLE ... ENABLE/FORCE RLS is idempotent;
-- DROP POLICY IF EXISTS + CREATE POLICY handles re-runs.

DO $rls_all$
DECLARE
  tbl TEXT;
  col_exists BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'          -- ordinary tables only
      AND c.relname != '_prisma_migrations'  -- internal table
    ORDER BY c.relname
  LOOP
    -- Check if this table has a tenant_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl
        AND column_name = 'tenant_id'
    ) INTO col_exists;

    IF col_exists THEN
      -- Enable RLS (idempotent — no-op if already enabled)
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

      -- Drop existing policy if any (covers rename/recreate)
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || tbl, tbl);

      -- Create single combined USING + WITH CHECK policy
      EXECUTE format(
        'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())',
        'tenant_isolation_' || tbl, tbl
      );
    END IF;
  END LOOP;
END;
$rls_all$;

-- Note: crm_segment_members is excluded from the dynamic loop above because it
-- has no direct tenant_id column — it is scoped indirectly via the parent
-- crm_segments table. It already has a custom policy from the
-- 20260704120500_crm_advanced_rls migration.
