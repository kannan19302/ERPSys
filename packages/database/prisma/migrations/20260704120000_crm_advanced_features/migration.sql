-- CRM Advanced Features: Lead Scoring, Duplicate Detection, Configurable Pipelines,
-- Customer Segmentation, SLA Policies. Idempotent — safe to re-run against a dev DB
-- that may already have drift.

-- ────────────────────────────────────────────────
-- 1. Lead Scoring
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_lead_scoring_rules" (
  "id"         TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "field"      TEXT NOT NULL,
  "operator"   TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "points"     INTEGER NOT NULL,
  "active"     BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_lead_scoring_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_lead_scoring_rules_tenant_id_active_idx"
  ON "crm_lead_scoring_rules" ("tenant_id", "active");

-- Lead.score already exists per schema.prisma; add defensively in case of drift.
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────
-- 2. Duplicate Detection
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_duplicate_rules" (
  "id"           TEXT NOT NULL,
  "tenant_id"    TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "entity"       TEXT NOT NULL,
  "match_fields" JSONB NOT NULL,
  "threshold"    INTEGER NOT NULL,
  "action"       TEXT NOT NULL,
  "active"       BOOLEAN NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_duplicate_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_duplicate_rules_tenant_id_entity_active_idx"
  ON "crm_duplicate_rules" ("tenant_id", "entity", "active");

-- ────────────────────────────────────────────────
-- 3. Configurable Pipelines (PipelineStage relates to sales_pipelines).
--    We deliberately leave opportunities.stage (enum-ish text column) in place
--    for backward-compat; migration of reads is a later step.
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_pipeline_stages" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "pipeline_id" TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "order"       INTEGER NOT NULL,
  "probability" INTEGER NOT NULL,
  "is_won"      BOOLEAN NOT NULL DEFAULT false,
  "is_lost"     BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_pipeline_stages_tenant_id_pipeline_id_idx"
  ON "crm_pipeline_stages" ("tenant_id", "pipeline_id");

DO $$ BEGIN
  ALTER TABLE "crm_pipeline_stages"
    ADD CONSTRAINT "crm_pipeline_stages_pipeline_id_fkey"
    FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────
-- 4. Customer Segmentation
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_segments" (
  "id"         TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "entity"     TEXT NOT NULL,
  "criteria"   JSONB NOT NULL,
  "is_dynamic" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_segments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_segments_tenant_id_entity_idx"
  ON "crm_segments" ("tenant_id", "entity");

CREATE TABLE IF NOT EXISTS "crm_segment_members" (
  "id"         TEXT NOT NULL,
  "segment_id" TEXT NOT NULL,
  "entity_id"  TEXT NOT NULL,
  "added_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_segment_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "crm_segment_members_segment_id_entity_id_key"
  ON "crm_segment_members" ("segment_id", "entity_id");
CREATE INDEX IF NOT EXISTS "crm_segment_members_segment_id_idx"
  ON "crm_segment_members" ("segment_id");

DO $$ BEGIN
  ALTER TABLE "crm_segment_members"
    ADD CONSTRAINT "crm_segment_members_segment_id_fkey"
    FOREIGN KEY ("segment_id") REFERENCES "crm_segments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ────────────────────────────────────────────────
-- 5. SLA Policies + Breaches
-- ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "crm_sla_policies" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "name"                TEXT NOT NULL,
  "entity"              TEXT NOT NULL,
  "priority"            TEXT NOT NULL,
  "first_response_mins" INTEGER NOT NULL,
  "resolution_mins"     INTEGER NOT NULL,
  "business_hours_id"   TEXT,
  "active"              BOOLEAN NOT NULL DEFAULT true,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "crm_sla_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_sla_policies_tenant_id_entity_active_idx"
  ON "crm_sla_policies" ("tenant_id", "entity", "active");

CREATE TABLE IF NOT EXISTS "crm_sla_breaches" (
  "id"          TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,
  "entity"      TEXT NOT NULL,
  "entity_id"   TEXT NOT NULL,
  "policy_id"   TEXT NOT NULL,
  "breach_type" TEXT NOT NULL,
  "breached_at" TIMESTAMP(3) NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "crm_sla_breaches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "crm_sla_breaches_tenant_id_entity_entity_id_idx"
  ON "crm_sla_breaches" ("tenant_id", "entity", "entity_id");
CREATE INDEX IF NOT EXISTS "crm_sla_breaches_tenant_id_policy_id_idx"
  ON "crm_sla_breaches" ("tenant_id", "policy_id");

-- Case model SLA columns (existing sla_deadline / first_response_at / resolved_at
-- are left untouched for backward-compat).
ALTER TABLE "crm_cases" ADD COLUMN IF NOT EXISTS "sla_first_response_at" TIMESTAMP(3);
ALTER TABLE "crm_cases" ADD COLUMN IF NOT EXISTS "sla_resolve_by"        TIMESTAMP(3);
ALTER TABLE "crm_cases" ADD COLUMN IF NOT EXISTS "sla_breached"          BOOLEAN NOT NULL DEFAULT false;
