-- Row-Level Security policies for tenant isolation.
-- These act as a database-level safety net beyond the Prisma extension.
-- The app sets `app.current_tenant_id` per-connection via SET LOCAL.

-- Helper function to get the current tenant context
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE);
END;
$$ LANGUAGE plpgsql STABLE;

-- Apply RLS to high-value tables (financial, PII, health data).

DO $rls$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT unnest AS tbl FROM unnest(ARRAY[
      'users','invoices','payments','employees','patients',
      'payroll_runs','journals','customers','vendors',
      'sales_orders','purchase_orders','audit_logs'
    ])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t.tbl);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tbl AND policyname = 'tenant_isolation_' || t.tbl
      ) THEN
        EXECUTE format(
          'CREATE POLICY %I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())',
          'tenant_isolation_' || t.tbl, t.tbl
        );
      END IF;
    END IF;
  END LOOP;
END;
$rls$;
