-- Connect: per-user read state for unread counts. Idempotent.
CREATE TABLE IF NOT EXISTS "channel_reads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_reads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "channel_reads_channel_id_user_id_key" ON "channel_reads"("channel_id", "user_id");
CREATE INDEX IF NOT EXISTS "channel_reads_tenant_id_user_id_idx" ON "channel_reads"("tenant_id", "user_id");
