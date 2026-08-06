-- CRM Enhancement: All Phases Migration
-- Phase 1: Product Catalog & Deal Revenue
-- Phase 2: Contact Tags & 360
-- Phase 3: Sales Targets & Reports
-- Phase 4: Workflow Automation & Email Sequences
-- Phase 5: Territory & Commissions
-- Phase 6: Web Forms & Documents

-- ============================================
-- Modify existing tables
-- ============================================

ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "weighted_amount" DECIMAL(15,2);
ALTER TABLE "opportunities" ADD COLUMN IF NOT EXISTS "stage_entered_at" TIMESTAMP(3);

ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- Phase 1: Opportunity Line Items & Price Books
-- ============================================

CREATE TABLE IF NOT EXISTS "opportunity_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "opportunity_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "price_books" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "price_book_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "price_book_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "list_price" DECIMAL(15,2) NOT NULL,
    "min_quantity" DECIMAL(15,3) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_book_entries_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 2: Contact Tags
-- ============================================

CREATE TABLE IF NOT EXISTS "contact_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contact_tag_links" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "contact_tag_links_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 3: Sales Targets & Saved Reports
-- ============================================

CREATE TABLE IF NOT EXISTS "sales_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT,
    "period" TEXT NOT NULL,
    "target_type" TEXT NOT NULL DEFAULT 'REVENUE',
    "target" DECIMAL(15,2) NOT NULL,
    "achieved" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sales_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "saved_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "chart_type" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "schedule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 4: Workflow Rules & Email Sequences
-- ============================================

CREATE TABLE IF NOT EXISTS "crm_workflow_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_workflow_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "email_sequences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_sequence_steps" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "delay_days" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "email_sequence_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "email_sequence_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "lead_id" TEXT,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "next_send_at" TIMESTAMP(3),
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "email_sequence_enrollments_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 5: Territory & Commissions
-- ============================================

CREATE TABLE IF NOT EXISTS "sales_territories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "parent_id" TEXT,
    "manager_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "sales_territories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sales_team_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REP',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commission_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "rate" DECIMAL(5,2) NOT NULL,
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "applies_to_all" BOOLEAN NOT NULL DEFAULT true,
    "product_ids" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "commission_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_entries_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Phase 6: Web Forms & Documents
-- ============================================

CREATE TABLE IF NOT EXISTS "web_to_lead_forms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "embed_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "web_to_lead_forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "crm_documents_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS "opportunity_line_items_tenant_id_idx" ON "opportunity_line_items"("tenant_id");
CREATE INDEX IF NOT EXISTS "opportunity_line_items_opportunity_id_idx" ON "opportunity_line_items"("opportunity_id");
CREATE INDEX IF NOT EXISTS "price_books_tenant_id_idx" ON "price_books"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "price_books_tenant_id_name_key" ON "price_books"("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "price_book_entries_tenant_id_idx" ON "price_book_entries"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "price_book_entries_price_book_id_product_id_min_quantity_key" ON "price_book_entries"("price_book_id", "product_id", "min_quantity");
CREATE INDEX IF NOT EXISTS "contact_tags_tenant_id_idx" ON "contact_tags"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "contact_tags_tenant_id_name_key" ON "contact_tags"("tenant_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "contact_tag_links_contact_id_tag_id_key" ON "contact_tag_links"("contact_id", "tag_id");
CREATE INDEX IF NOT EXISTS "sales_targets_tenant_id_idx" ON "sales_targets"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_targets_tenant_id_user_id_period_target_type_key" ON "sales_targets"("tenant_id", "user_id", "period", "target_type");
CREATE INDEX IF NOT EXISTS "saved_reports_tenant_id_idx" ON "saved_reports"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_workflow_rules_tenant_id_idx" ON "crm_workflow_rules"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_workflow_rules_tenant_id_entity_trigger_idx" ON "crm_workflow_rules"("tenant_id", "entity", "trigger");
CREATE INDEX IF NOT EXISTS "email_sequences_tenant_id_idx" ON "email_sequences"("tenant_id");
CREATE INDEX IF NOT EXISTS "email_sequence_steps_sequence_id_idx" ON "email_sequence_steps"("sequence_id");
CREATE INDEX IF NOT EXISTS "email_sequence_enrollments_tenant_id_idx" ON "email_sequence_enrollments"("tenant_id");
CREATE INDEX IF NOT EXISTS "email_sequence_enrollments_tenant_id_status_idx" ON "email_sequence_enrollments"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "sales_territories_tenant_id_idx" ON "sales_territories"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_territories_tenant_id_name_key" ON "sales_territories"("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "sales_team_members_tenant_id_idx" ON "sales_team_members"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_team_members_territory_id_user_id_key" ON "sales_team_members"("territory_id", "user_id");
CREATE INDEX IF NOT EXISTS "commission_rules_tenant_id_idx" ON "commission_rules"("tenant_id");
CREATE INDEX IF NOT EXISTS "commission_entries_tenant_id_idx" ON "commission_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS "commission_entries_tenant_id_user_id_idx" ON "commission_entries"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "web_to_lead_forms_tenant_id_idx" ON "web_to_lead_forms"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_documents_tenant_id_idx" ON "crm_documents"("tenant_id");
CREATE INDEX IF NOT EXISTS "crm_documents_tenant_id_entity_type_entity_id_idx" ON "crm_documents"("tenant_id", "entity_type", "entity_id");

-- ============================================
-- Foreign Keys
-- ============================================

ALTER TABLE "opportunity_line_items" ADD CONSTRAINT "opportunity_line_items_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "opportunity_line_items" ADD CONSTRAINT "opportunity_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "price_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_book_entries" ADD CONSTRAINT "price_book_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contact_tag_links" ADD CONSTRAINT "contact_tag_links_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contact_tag_links" ADD CONSTRAINT "contact_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "contact_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_sequence_steps" ADD CONSTRAINT "email_sequence_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_territories" ADD CONSTRAINT "sales_territories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_team_members" ADD CONSTRAINT "sales_team_members_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
