-- Phase 0.0 (.ai/MULTI_CLIENT_MASTER_PLAN.md § 7): push notification device
-- tokens for Flutter mobile/desktop clients. New table, no backfill needed.

CREATE TABLE "push_device_tokens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "app_version" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_device_tokens_tenant_id_device_id_key" ON "push_device_tokens"("tenant_id", "device_id");
CREATE INDEX "push_device_tokens_tenant_id_user_id_idx" ON "push_device_tokens"("tenant_id", "user_id");

ALTER TABLE "push_device_tokens" ADD CONSTRAINT "push_device_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_device_tokens" ADD CONSTRAINT "push_device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
