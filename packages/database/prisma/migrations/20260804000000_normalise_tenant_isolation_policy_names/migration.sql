-- Normalise tenant-isolation policy names to `tenant_isolation_<table>`.
--
-- 26 tenant-scoped tables carry a policy named `tenant_isolation_policy` rather
-- than the per-table convention used by the other 1,002. They are equally
-- protected: RLS is ENABLED and FORCED on all of them and the predicate is
-- byte-identical, `(tenant_id = current_tenant_id())`. Only the name differs.
--
-- The name is not cosmetic. `src/tenant-rls-integration.test.ts` asserts that
-- every tenant-scoped table has a policy called `tenant_isolation_<table>`, and
-- the generated per-table isolation tests described in
-- PLATFORM_ARCHITECTURE § 5.1 key off the same convention. A table whose policy
-- is named differently reads as unprotected to those checks, which is the worst
-- kind of failure: it trains people to treat a real isolation alarm as noise.
--
-- ALTER POLICY ... RENAME TO is a catalogue-only change. No predicate, no
-- permissions and no data are touched, and nothing is dropped, so there is no
-- window in which a table sits unprotected.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'tenant_isolation_policy'
  LOOP
    -- Skip if the conventional name somehow already exists on this table.
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = r.tablename
        AND policyname = 'tenant_isolation_' || r.tablename
    ) THEN
      EXECUTE format(
        'ALTER POLICY tenant_isolation_policy ON public.%I RENAME TO %I',
        r.tablename,
        'tenant_isolation_' || r.tablename
      );
      RAISE NOTICE 'renamed tenant_isolation_policy on % to tenant_isolation_%', r.tablename, r.tablename;
    END IF;
  END LOOP;
END $$;
