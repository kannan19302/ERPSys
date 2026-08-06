-- Connect (Teams / Google Chat) features. Idempotent & additive.

-- ── Channels: relax name uniqueness to real channels; add space/DM fields ──
ALTER TABLE "channels" DROP CONSTRAINT IF EXISTS "channels_tenant_id_org_id_name_key";
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'CHANNEL';
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "space_id" TEXT;
ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "topic" TEXT;
CREATE INDEX IF NOT EXISTS "channels_tenant_id_space_id_idx" ON "channels"("tenant_id", "space_id");
CREATE UNIQUE INDEX IF NOT EXISTS "channels_unique_channel_name" ON "channels"("tenant_id", "org_id", "name") WHERE "kind" = 'CHANNEL';

-- ── Messages: threads, reactions, pins, edit/delete, attachments, system msgs ──
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "meeting_id" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "messages_channel_id_parent_id_idx" ON "messages"("channel_id", "parent_id");

-- ── Spaces ──
CREATE TABLE IF NOT EXISTS "connect_spaces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '#',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "connect_spaces_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "connect_spaces_tenant_id_idx" ON "connect_spaces"("tenant_id");

-- ── Channel membership ──
CREATE TABLE IF NOT EXISTS "channel_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "channel_members_channel_id_user_id_key" ON "channel_members"("channel_id", "user_id");
CREATE INDEX IF NOT EXISTS "channel_members_tenant_id_user_id_idx" ON "channel_members"("tenant_id", "user_id");

-- ── Message reactions ──
CREATE TABLE IF NOT EXISTS "message_reactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_reactions_message_id_user_id_emoji_key" ON "message_reactions"("message_id", "user_id", "emoji");
CREATE INDEX IF NOT EXISTS "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- ── User presence / status ──
CREATE TABLE IF NOT EXISTS "user_presence" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "presence" TEXT NOT NULL DEFAULT 'ACTIVE',
    "status_text" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_presence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_presence_tenant_id_user_id_key" ON "user_presence"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "user_presence_tenant_id_idx" ON "user_presence"("tenant_id");

-- ── Meetings ──
CREATE TABLE IF NOT EXISTS "connect_meetings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    CONSTRAINT "connect_meetings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "connect_meetings_tenant_id_idx" ON "connect_meetings"("tenant_id");

-- ── Calendar events ──
CREATE TABLE IF NOT EXISTS "calendar_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "duration_mins" INTEGER NOT NULL DEFAULT 30,
    "meeting_code" TEXT,
    "attendees" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "calendar_events_tenant_id_idx" ON "calendar_events"("tenant_id");

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "connect_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_members" ADD CONSTRAINT "channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

