-- Email verification (AUTH_BILLING_PROGRAM Phase 1.1) + RLS repair for the
-- unauthenticated password-reset flow (same Track C gap that broke register).

-- 1. Track verification state on users.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);

-- 2. Single-use, hashed email verification tokens (mirrors password_reset_tokens).
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_expires_at_idx" ON "email_verification_tokens"("expires_at");

DO $$BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_verification_tokens_user_id_fkey'
  ) THEN
    ALTER TABLE "email_verification_tokens"
      ADD CONSTRAINT "email_verification_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- 3. RLS on the new table (standard tenant_isolation policy).
DO $$DECLARE tbl text := 'email_verification_tokens';
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
  EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())', tbl, tbl);
END$$;

-- 4. Narrow SECURITY DEFINER lookups for the two unauthenticated token flows.
-- Same audited-exception pattern as auth_lookup_user_tenants (Track C / #21):
-- tokens are unguessable 256-bit hashes, and these expose only the columns the
-- flow needs to resolve tenant context before a session exists.
CREATE OR REPLACE FUNCTION auth_lookup_reset_token(p_token_hash TEXT)
RETURNS TABLE(id TEXT, user_id TEXT, tenant_id TEXT, expires_at TIMESTAMP, used_at TIMESTAMP)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT t.id, t.user_id, t.tenant_id, t.expires_at, t.used_at
  FROM password_reset_tokens t
  WHERE t.token_hash = p_token_hash;
$$;

CREATE OR REPLACE FUNCTION auth_lookup_verification_token(p_token_hash TEXT)
RETURNS TABLE(id TEXT, user_id TEXT, tenant_id TEXT, expires_at TIMESTAMP, used_at TIMESTAMP)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT t.id, t.user_id, t.tenant_id, t.expires_at, t.used_at
  FROM email_verification_tokens t
  WHERE t.token_hash = p_token_hash;
$$;

REVOKE ALL ON FUNCTION auth_lookup_reset_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_lookup_verification_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_lookup_reset_token(TEXT) TO unerp_api;
GRANT EXECUTE ON FUNCTION auth_lookup_verification_token(TEXT) TO unerp_api;
