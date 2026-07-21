-- Platform-wide (no tenant_id) admin-editable integration credentials/tunables.
-- Deliberately NOT covered by the dynamic per-tenant RLS loop (no tenant_id
-- column), so no follow-up RLS migration is needed for this table.

CREATE TABLE IF NOT EXISTS "platform_credentials" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_credentials_provider_key_key"
    ON "platform_credentials"("provider", "key");
