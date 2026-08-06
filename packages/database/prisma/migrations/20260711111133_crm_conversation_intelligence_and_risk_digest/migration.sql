-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "ai_action_items" JSONB,
ADD COLUMN     "ai_sentiment" TEXT,
ADD COLUMN     "ai_summary" TEXT,
ADD COLUMN     "ai_summary_generated_at" TIMESTAMP(3),
ADD COLUMN     "ai_talk_track_score" INTEGER,
ADD COLUMN     "call_duration_sec" INTEGER,
ADD COLUMN     "call_recording_url" TEXT,
ADD COLUMN     "transcript_text" TEXT;

-- CreateTable
CREATE TABLE "deal_risk_digest_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'REP',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "new_alert_count" INTEGER NOT NULL DEFAULT 0,
    "open_alert_count" INTEGER NOT NULL DEFAULT 0,
    "critical_count" INTEGER NOT NULL DEFAULT 0,
    "at_risk_deal_count" INTEGER NOT NULL DEFAULT 0,
    "at_risk_pipeline_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_risk_digest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deal_risk_digest_runs_tenant_id_idx" ON "deal_risk_digest_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_risk_digest_runs_tenant_id_recipient_user_id_idx" ON "deal_risk_digest_runs"("tenant_id", "recipient_user_id");

-- CreateIndex
CREATE INDEX "deal_risk_digest_runs_tenant_id_sent_at_idx" ON "deal_risk_digest_runs"("tenant_id", "sent_at");
