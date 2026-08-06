-- Extension platform persistence — PLATFORM_ARCHITECTURE.md § 8.
-- Replaces the registry's hardcoded "mocked for phase 4" array.
--
-- Both tables carry tenant_id with RLS ENABLED and FORCED and a
-- tenant_isolation policy, per BACKEND_SCHEMA § 4.4 — an extension
-- installation reveals which capabilities a tenant has granted and to whom, so
-- it is exactly as tenant-confidential as the business data it can reach.

CREATE TABLE "tenant_extension_installations" (
  "id"                    TEXT NOT NULL,
  "tenant_id"             TEXT NOT NULL,
  "extension_id"          TEXT NOT NULL,
  "version"               TEXT NOT NULL,
  "publisher"             TEXT NOT NULL,
  "status"                TEXT NOT NULL DEFAULT 'INSTALLED',
  "granted_scopes"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "approved_hosts"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "budget"                JSONB,
  "killed"                BOOLEAN NOT NULL DEFAULT false,
  "killed_reason"         TEXT,
  "installed_by_user_id"  TEXT,
  "installed_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenant_extension_installations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_extension_installations_tenant_id_extension_id_key"
  ON "tenant_extension_installations" ("tenant_id", "extension_id");
CREATE INDEX "tenant_extension_installations_tenant_id_status_idx"
  ON "tenant_extension_installations" ("tenant_id", "status");

CREATE TABLE "extension_invocation_usage" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "extension_id" TEXT NOT NULL,
  "hook"         TEXT NOT NULL,
  "cpu_ms"       DECIMAL(12,3) NOT NULL,
  "queries"      INTEGER NOT NULL DEFAULT 0,
  "http_calls"   INTEGER NOT NULL DEFAULT 0,
  "failed"       BOOLEAN NOT NULL DEFAULT false,
  "error_kind"   TEXT,
  "occurred_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "extension_invocation_usage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "extension_invocation_usage_tenant_id_extension_id_occurred_idx"
  ON "extension_invocation_usage" ("tenant_id", "extension_id", "occurred_at");

-- ── RLS: ENABLE + FORCE, so the migrating/seeding owner is not exempt ────────
ALTER TABLE "tenant_extension_installations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_extension_installations" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_tenant_extension_installations"
  ON "tenant_extension_installations"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());

ALTER TABLE "extension_invocation_usage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extension_invocation_usage" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_extension_invocation_usage"
  ON "extension_invocation_usage"
  USING ("tenant_id" = current_tenant_id())
  WITH CHECK ("tenant_id" = current_tenant_id());
