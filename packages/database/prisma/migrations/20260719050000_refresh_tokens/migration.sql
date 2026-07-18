-- Refresh-token rotation (AUTH_BILLING_PROGRAM Phase 1.2).
-- The session row carries the (hashed) current refresh token; rotation swaps
-- the hash so an old refresh token dies the moment a new one is issued.

ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "refresh_token_hash" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "refresh_expires_at" TIMESTAMP(3);
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "remember_me" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- The refresh endpoint is unauthenticated (the access token may already be
-- expired), so it cannot see user_sessions under RLS. Same narrow
-- SECURITY DEFINER audited-exception pattern as auth_lookup_user_tenants.
CREATE OR REPLACE FUNCTION auth_lookup_refresh_token(p_hash TEXT)
RETURNS TABLE(id TEXT, user_id TEXT, tenant_id TEXT, refresh_expires_at TIMESTAMP, is_active BOOLEAN, remember_me BOOLEAN)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT s.id, s.user_id, s.tenant_id, s.refresh_expires_at, s.is_active, s.remember_me
  FROM user_sessions s
  WHERE s.refresh_token_hash = p_hash;
$$;

REVOKE ALL ON FUNCTION auth_lookup_refresh_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_lookup_refresh_token(TEXT) TO unerp_api;
