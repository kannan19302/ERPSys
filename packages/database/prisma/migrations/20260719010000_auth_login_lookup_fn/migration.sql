-- Login needs to resolve which tenant(s) an email belongs to BEFORE any
-- tenant context exists (Track C's unerp_api runtime role is NOBYPASSRLS,
-- so a plain cross-tenant SELECT on `users` returns zero rows once RLS is
-- enforced). This narrow SECURITY DEFINER function is the one deliberate,
-- audited exception: it exposes only id/tenant_id for a given email — the
-- same two columns the login flow already queried pre-RLS — and nothing
-- else. All other access to `users` remains fully RLS-scoped.
CREATE OR REPLACE FUNCTION auth_lookup_user_tenants(p_email TEXT)
RETURNS TABLE(id TEXT, tenant_id TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT u.id, u.tenant_id
  FROM users u
  WHERE u.email = p_email
    AND u.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION auth_lookup_user_tenants(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_lookup_user_tenants(TEXT) TO unerp_api;
