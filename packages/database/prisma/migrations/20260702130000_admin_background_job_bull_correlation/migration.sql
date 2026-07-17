-- Admin P1-1: correlate BackgroundJob rows with real BullMQ jobs (email/export/payroll/data-import queues).
-- Idempotent & additive — safe to run against a drifted dev DB via `prisma migrate deploy`.
-- No enum change needed: BackgroundJob.status and AutomationRuleExecution.status are already
-- free-form TEXT columns, so new lifecycle values (e.g. real 'RUNNING'/'COMPLETED'/'FAILED' driven
-- by BullMQ, or 'SUCCESS'/'SKIPPED' for real automation-rule executions) require no migration.

-- ── BackgroundJob.bull_job_id ──
-- Nullable: existing rows (and any future rows created before enqueue, e.g. scheduled-task
-- placeholders with no queue mapping yet) have no corresponding BullMQ job. Populated going
-- forward by the code path that calls Queue.add(...) and captures the returned Job.id.
ALTER TABLE "background_jobs" ADD COLUMN IF NOT EXISTS "bull_job_id" TEXT;

-- Composite lookup index: processors/retry logic resolve "the BackgroundJob row for BullMQ job X
-- in queue Y" in both directions (DB row -> enqueue, and BullMQ event -> DB row to update).
CREATE INDEX IF NOT EXISTS "background_jobs_queue_name_bull_job_id_idx"
  ON "background_jobs"("queue_name", "bull_job_id");
