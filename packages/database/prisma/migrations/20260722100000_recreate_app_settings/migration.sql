-- Recreates the "app_settings" table dropped by
-- 20260721090000_drop_unused_app_installation_settings, which was a mistaken
-- cleanup — AppSettingsService (apps/api/src/common/settings/settings.service.ts)
-- actively depends on it. Recreated with plain string scope/roleId columns
-- (no enum, no FK) to avoid reintroducing the same coupling fragility.

CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_slug" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'TENANT',
    "role_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_tenant_id_app_slug_key_scope_role_id_key"
    ON "app_settings"("tenant_id", "app_slug", "key", "scope", "role_id");

CREATE INDEX IF NOT EXISTS "app_settings_tenant_id_app_slug_idx"
    ON "app_settings"("tenant_id", "app_slug");
