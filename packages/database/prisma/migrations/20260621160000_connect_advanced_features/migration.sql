-- Connect: advanced features — bookmarks, starred/muted channels, calendar fields, status emoji. Idempotent.

-- Message bookmarks
CREATE TABLE IF NOT EXISTS "message_bookmarks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_bookmarks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_bookmarks_message_id_user_id_key" ON "message_bookmarks"("message_id", "user_id");
CREATE INDEX IF NOT EXISTS "message_bookmarks_tenant_id_user_id_idx" ON "message_bookmarks"("tenant_id", "user_id");

-- Channel member: starred + muted
ALTER TABLE "channel_members" ADD COLUMN IF NOT EXISTS "starred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "channel_members" ADD COLUMN IF NOT EXISTS "muted" BOOLEAN NOT NULL DEFAULT false;

-- User presence: status emoji
ALTER TABLE "user_presence" ADD COLUMN IF NOT EXISTS "status_emoji" TEXT;

-- Calendar events: extended fields
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "color" TEXT;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "all_day" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "calendar_events" ADD COLUMN IF NOT EXISTS "recurrence" TEXT NOT NULL DEFAULT 'none';
