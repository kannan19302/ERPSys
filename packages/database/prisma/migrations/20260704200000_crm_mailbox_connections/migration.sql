-- CreateTable
CREATE TABLE IF NOT EXISTS "crm_mailbox_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "last_synced_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "last_sync_messages" INTEGER NOT NULL DEFAULT 0,
    "last_sync_events" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "disconnected_at" TIMESTAMP(3),

    CONSTRAINT "crm_mailbox_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "crm_mailbox_connections_tenant_id_user_id_provider_key" ON "crm_mailbox_connections"("tenant_id", "user_id", "provider");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_mailbox_connections_tenant_id_idx" ON "crm_mailbox_connections"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "crm_mailbox_connections_tenant_id_status_idx" ON "crm_mailbox_connections"("tenant_id", "status");
