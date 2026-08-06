-- Connect Extensions Phase 2

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "view_once" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "poll_id" TEXT;

CREATE TABLE IF NOT EXISTS "connect_polls" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL, "channel_id" TEXT NOT NULL,
    "message_id" TEXT, "user_id" TEXT NOT NULL, "question" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "connect_polls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "connect_poll_options" (
    "id" TEXT NOT NULL, "poll_id" TEXT NOT NULL,
    "label" TEXT NOT NULL, "emoji" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "connect_poll_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "connect_poll_votes" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL, "option_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connect_poll_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "custom_emojis" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL, "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "custom_emojis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reminders" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL, "text" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "channel_id" TEXT, "message_id" TEXT,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "snoozed" BOOLEAN NOT NULL DEFAULT false,
    "recur_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "channel_templates" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL, "description" TEXT,
    "channel_type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "topic" TEXT, "emoji" TEXT NOT NULL DEFAULT '',
    "tabs" JSONB NOT NULL DEFAULT '[]',
    "is_preset" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_summaries" (
    "id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL, "summary" TEXT NOT NULL,
    "key_points" JSONB NOT NULL DEFAULT '[]',
    "action_items" JSONB NOT NULL DEFAULT '[]',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_summaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "messages_scheduled_at_idx" ON "messages"("scheduled_at");
CREATE INDEX IF NOT EXISTS "connect_polls_tenant_id_channel_id_idx" ON "connect_polls"("tenant_id", "channel_id");
CREATE INDEX IF NOT EXISTS "connect_poll_votes_tenant_id_poll_id_idx" ON "connect_poll_votes"("tenant_id", "poll_id");
CREATE INDEX IF NOT EXISTS "custom_emojis_tenant_id_idx" ON "custom_emojis"("tenant_id");
CREATE INDEX IF NOT EXISTS "reminders_tenant_id_user_id_remind_at_idx" ON "reminders"("tenant_id", "user_id", "remind_at");
CREATE INDEX IF NOT EXISTS "reminders_remind_at_is_sent_idx" ON "reminders"("remind_at", "is_sent");
CREATE INDEX IF NOT EXISTS "channel_templates_tenant_id_idx" ON "channel_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS "meeting_summaries_tenant_id_meeting_id_idx" ON "meeting_summaries"("tenant_id", "meeting_id");

ALTER TABLE "messages" ADD CONSTRAINT "messages_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "connect_polls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "connect_polls" ADD CONSTRAINT "connect_polls_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_poll_options" ADD CONSTRAINT "connect_poll_options_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "connect_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_poll_votes" ADD CONSTRAINT "connect_poll_votes_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "connect_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_poll_votes" ADD CONSTRAINT "connect_poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "connect_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_summaries" ADD CONSTRAINT "meeting_summaries_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "connect_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
