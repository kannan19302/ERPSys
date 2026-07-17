-- CRM Phases 7-12 Migration
-- Phase 7: Custom Fields & Record Types
-- Phase 8: Approval Workflows
-- Phase 9: Advanced Quotation Builder
-- Phase 10: Deal Rooms & Collaboration
-- Phase 11: Sales Playbooks & Guided Selling
-- Phase 12: Dashboard Builder

-- ============================================
-- Modify existing tables
-- ============================================

ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "template_id" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "opportunity_id" TEXT;
ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "contact_id" TEXT;

ALTER TABLE "quotation_items" ADD COLUMN IF NOT EXISTS "section_id" TEXT;

-- ============================================
-- Phase 7: Custom Fields & Record Types
-- ============================================

CREATE TABLE IF NOT EXISTS "crm_custom_fields" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "options" JSONB NOT NULL DEFAULT '[]',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "lookup_entity" TEXT,
    "formula_expr" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT NOT NULL DEFAULT 'Custom Fields',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_custom_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_custom_field_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_custom_field_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_record_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "field_layout" JSONB NOT NULL DEFAULT '[]',
    "pipeline_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_record_types_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 8: Approval Workflows
-- ============================================

CREATE TABLE IF NOT EXISTS "crm_approval_processes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "trigger_conditions" JSONB NOT NULL DEFAULT '[]',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_approval_processes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_approval_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "process_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "submitted_by" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "crm_approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_approval_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comments" TEXT,
    "acted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_approval_actions_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 9: Advanced Quotation Builder
-- ============================================

CREATE TABLE IF NOT EXISTS "quotation_sections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "quotation_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotation_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "header_html" TEXT,
    "footer_html" TEXT,
    "terms_template" TEXT,
    "logo_url" TEXT,
    "color_scheme" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "quotation_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotation_signatures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signed_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "signature_data" TEXT,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quotation_signatures_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 10: Deal Rooms & Collaboration
-- ============================================

CREATE TABLE IF NOT EXISTS "crm_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "body" TEXT NOT NULL,
    "mentions" JSONB NOT NULL DEFAULT '[]',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_followers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_followers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'GENERAL',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 11: Sales Playbooks
-- ============================================

CREATE TABLE IF NOT EXISTS "sales_playbooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pipeline_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "sales_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "playbook_stages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "guidance_notes" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "required_fields" JSONB NOT NULL DEFAULT '[]',
    "talking_points" JSONB NOT NULL DEFAULT '[]',
    "exit_criteria" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "playbook_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "battlecards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "playbook_id" TEXT,
    "competitor" TEXT NOT NULL,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "objections" JSONB NOT NULL DEFAULT '[]',
    "win_strategy" TEXT,
    "lose_reasons" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "battlecards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "opportunity_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "stage_checklist_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "opportunity_checklists_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 12: Dashboard Builder
-- ============================================

CREATE TABLE IF NOT EXISTS "crm_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "widget_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data_source" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "refresh_interval" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "crm_dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Indexes
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS "crm_custom_fields_tenant_id_entity_field_name_key" ON "crm_custom_fields"("tenant_id", "entity", "field_name");
CREATE INDEX IF NOT EXISTS "crm_custom_fields_tenant_id_idx" ON "crm_custom_fields"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_custom_fields_tenant_id_entity_idx" ON "crm_custom_fields"("tenant_id", "entity");
CREATE UNIQUE INDEX IF NOT EXISTS "crm_custom_field_values_field_id_entity_id_key" ON "crm_custom_field_values"("field_id", "entity_id");
CREATE INDEX IF NOT EXISTS "crm_custom_field_values_tenant_id_idx" ON "crm_custom_field_values"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_custom_field_values_entity_type_entity_id_idx" ON "crm_custom_field_values"("entity_type", "entity_id");
CREATE UNIQUE INDEX IF NOT EXISTS "crm_record_types_tenant_id_entity_name_key" ON "crm_record_types"("tenant_id", "entity", "name");
CREATE INDEX IF NOT EXISTS "crm_record_types_tenant_id_idx" ON "crm_record_types"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_approval_processes_tenant_id_idx" ON "crm_approval_processes"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_approval_processes_tenant_id_entity_idx" ON "crm_approval_processes"("tenant_id", "entity");
CREATE INDEX IF NOT EXISTS "crm_approval_requests_tenant_id_idx" ON "crm_approval_requests"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_approval_requests_tenant_id_entity_type_entity_id_idx" ON "crm_approval_requests"("tenant_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "crm_approval_requests_tenant_id_status_idx" ON "crm_approval_requests"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "crm_approval_actions_request_id_idx" ON "crm_approval_actions"("request_id");
CREATE INDEX IF NOT EXISTS "quotation_sections_quotation_id_idx" ON "quotation_sections"("quotation_id");
CREATE UNIQUE INDEX IF NOT EXISTS "quotation_versions_quotation_id_version_number_key" ON "quotation_versions"("quotation_id", "version_number");
CREATE INDEX IF NOT EXISTS "quotation_versions_tenant_id_idx" ON "quotation_versions"("tenant_id");
CREATE INDEX IF NOT EXISTS "quotation_versions_quotation_id_idx" ON "quotation_versions"("quotation_id");
CREATE INDEX IF NOT EXISTS "quotation_templates_tenant_id_idx" ON "quotation_templates"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "quotation_signatures_token_key" ON "quotation_signatures"("token");
CREATE INDEX IF NOT EXISTS "quotation_signatures_tenant_id_idx" ON "quotation_signatures"("tenant_id");
CREATE INDEX IF NOT EXISTS "quotation_signatures_quotation_id_idx" ON "quotation_signatures"("quotation_id");
CREATE INDEX IF NOT EXISTS "crm_comments_tenant_id_idx" ON "crm_comments"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_comments_entity_type_entity_id_idx" ON "crm_comments"("entity_type", "entity_id");
CREATE UNIQUE INDEX IF NOT EXISTS "crm_followers_entity_type_entity_id_user_id_key" ON "crm_followers"("entity_type", "entity_id", "user_id");
CREATE INDEX IF NOT EXISTS "crm_followers_tenant_id_idx" ON "crm_followers"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_followers_user_id_idx" ON "crm_followers"("user_id");
CREATE INDEX IF NOT EXISTS "crm_notes_tenant_id_idx" ON "crm_notes"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_notes_entity_type_entity_id_idx" ON "crm_notes"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "sales_playbooks_tenant_id_idx" ON "sales_playbooks"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "playbook_stages_playbook_id_stage_name_key" ON "playbook_stages"("playbook_id", "stage_name");
CREATE INDEX IF NOT EXISTS "playbook_stages_tenant_id_idx" ON "playbook_stages"("tenant_id");
CREATE INDEX IF NOT EXISTS "battlecards_tenant_id_idx" ON "battlecards"("tenant_id");
CREATE INDEX IF NOT EXISTS "battlecards_tenant_id_competitor_idx" ON "battlecards"("tenant_id", "competitor");
CREATE UNIQUE INDEX IF NOT EXISTS "opportunity_checklists_opportunity_id_stage_checklist_id_key" ON "opportunity_checklists"("opportunity_id", "stage_checklist_id");
CREATE INDEX IF NOT EXISTS "opportunity_checklists_tenant_id_idx" ON "opportunity_checklists"("tenant_id");
CREATE INDEX IF NOT EXISTS "opportunity_checklists_opportunity_id_idx" ON "opportunity_checklists"("opportunity_id");
CREATE INDEX IF NOT EXISTS "crm_dashboards_tenant_id_idx" ON "crm_dashboards"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_dashboards_tenant_id_created_by_idx" ON "crm_dashboards"("tenant_id", "created_by");
CREATE INDEX IF NOT EXISTS "crm_dashboard_widgets_dashboard_id_idx" ON "crm_dashboard_widgets"("dashboard_id");

-- ============================================
-- Foreign Keys
-- ============================================

ALTER TABLE "crm_custom_field_values" ADD CONSTRAINT "crm_custom_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "crm_custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_approval_requests" ADD CONSTRAINT "crm_approval_requests_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "crm_approval_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_approval_actions" ADD CONSTRAINT "crm_approval_actions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "crm_approval_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_sections" ADD CONSTRAINT "quotation_sections_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_versions" ADD CONSTRAINT "quotation_versions_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotation_signatures" ADD CONSTRAINT "quotation_signatures_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_comments" ADD CONSTRAINT "crm_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "crm_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "playbook_stages" ADD CONSTRAINT "playbook_stages_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "sales_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "battlecards" ADD CONSTRAINT "battlecards_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "sales_playbooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_dashboard_widgets" ADD CONSTRAINT "crm_dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "crm_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
