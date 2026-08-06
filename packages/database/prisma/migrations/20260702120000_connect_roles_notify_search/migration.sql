-- Connect: channel member roles, per-channel notification level, message search index.
-- Idempotent & additive — safe to run against a drifted dev DB via `prisma migrate deploy`.

-- ── ChannelMember.role (OWNER | ADMIN | MEMBER) ──
ALTER TABLE "channel_members" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- Backfill: the channel's creator (channels.created_by) becomes OWNER of their own
-- membership row, wherever one already exists. Everyone else keeps the MEMBER default.
UPDATE "channel_members" cm
SET "role" = 'OWNER'
FROM "channels" c
WHERE cm."channel_id" = c."id"
  AND c."created_by" IS NOT NULL
  AND cm."user_id" = c."created_by"
  AND cm."role" <> 'OWNER';

CREATE INDEX IF NOT EXISTS "channel_members_channel_id_role_idx" ON "channel_members"("channel_id", "role");

-- ── ChannelMember.notify_level (ALL | MENTIONS | NONE) ──
-- Extends the existing ChannelMember row (consistent with how starred/muted are already modeled)
-- rather than introducing a new ChannelNotificationPreference table.
ALTER TABLE "channel_members" ADD COLUMN IF NOT EXISTS "notify_level" TEXT NOT NULL DEFAULT 'ALL';

-- Backfill: rows with the legacy `muted = true` boolean map to NONE so existing mute
-- behavior is preserved exactly when the tri-state preference ships in the API/UI.
UPDATE "channel_members"
SET "notify_level" = 'NONE'
WHERE "muted" = true AND "notify_level" = 'ALL';

-- ── Message search: pg_trgm GIN index on content, scoped for tenant-filtered ILIKE queries ──
-- Simpler operationally than a generated tsvector column for a first-pass search endpoint;
-- no existing tsvector/pg_trgm precedent exists elsewhere in this schema to follow, so this
-- picks the lower-complexity option per data-architect judgment call.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_messages_content_trgm"
  ON "messages" USING GIN ("content" gin_trgm_ops);

-- Composite btree to keep the tenant + channel-membership scoping cheap before the trigram
-- filter is applied (search always filters by tenant_id and excludes soft-deleted messages).
CREATE INDEX IF NOT EXISTS "messages_tenant_id_deleted_at_idx" ON "messages"("tenant_id", "deleted_at");
