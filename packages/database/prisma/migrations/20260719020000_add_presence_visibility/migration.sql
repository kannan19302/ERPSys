-- Add manual presence visibility toggle (EVERYONE / ORG_ONLY / NOBODY) to user_presence.
ALTER TABLE "user_presence" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'EVERYONE';
