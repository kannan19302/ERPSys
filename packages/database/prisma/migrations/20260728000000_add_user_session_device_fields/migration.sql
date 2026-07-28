-- Phase 0.0 (.ai/MULTI_CLIENT_MASTER_PLAN.md § 7): multi-client device
-- identity on user_sessions. Additive/nullable — non-breaking, no backfill
-- needed (existing browser sessions simply have these columns NULL).

ALTER TABLE "user_sessions" ADD COLUMN "device_id" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "platform" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN "app_version" TEXT;

CREATE INDEX "user_sessions_device_id_idx" ON "user_sessions"("device_id");
