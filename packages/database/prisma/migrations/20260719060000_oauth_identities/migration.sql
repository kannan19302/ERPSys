-- Real OAuth sign-in (AUTH_BILLING_PROGRAM Phase 1.3/1.4): stable link between
-- an external identity (Google sub / Entra oid) and a tenant user, so email
-- changes at the provider can't hijack a different account.

CREATE TABLE IF NOT EXISTS "user_identities" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_identities_provider_subject_key" ON "user_identities"("provider", "subject");
CREATE INDEX IF NOT EXISTS "user_identities_user_id_idx" ON "user_identities"("user_id");

DO $$BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_identities_user_id_fkey'
  ) THEN
    ALTER TABLE "user_identities"
      ADD CONSTRAINT "user_identities_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- Standard tenant-isolation RLS.
DO $$DECLARE tbl text := 'user_identities';
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
  EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', tbl, tbl);
END$$;

-- The OAuth callback is unauthenticated; resolve the identity before any
-- tenant context exists (Track C audited-exception pattern).
CREATE OR REPLACE FUNCTION auth_lookup_oauth_identity(p_provider TEXT, p_subject TEXT)
RETURNS TABLE(user_id TEXT, tenant_id TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT i.user_id, i.tenant_id
  FROM user_identities i
  WHERE i.provider = p_provider AND i.subject = p_subject;
$$;

REVOKE ALL ON FUNCTION auth_lookup_oauth_identity(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_lookup_oauth_identity(TEXT, TEXT) TO unerp_api;
