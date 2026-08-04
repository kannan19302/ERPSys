-- Add columns declared in the schema that the database is missing.
--
-- Companion to 20260804010000_create_unmigrated_schema_tables, which created
-- the 762 absent tables but deliberately skipped every ALTER: the raw
-- `prisma migrate diff` mixes additive ADD COLUMNs with DROP COLUMN and DROP
-- TABLE that would delete the IdP's data, because both schemas target the same
-- `public` schema.
--
-- This keeps only ADD COLUMN, made idempotent with IF NOT EXISTS so it is safe
-- to replay against a database that already has some of them.
--
-- 46 columns.

ALTER TABLE "crm_contract_templates" ADD COLUMN IF NOT EXISTS "category_id" TEXT;
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "variables" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "document_versions" ADD COLUMN IF NOT EXISTS "changes" TEXT;
ALTER TABLE "education_attendance_records" ADD COLUMN IF NOT EXISTS "attendance_id" TEXT;
ALTER TABLE "field_service_checklists" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "field_service_checklists" ADD COLUMN IF NOT EXISTS "is_template" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "billable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "completed_date" TIMESTAMP(3);
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "contact_person" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "customer_email" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "customer_phone" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "escalation_level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "invoice_ref" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "invoiced" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "resolution" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "scheduled_date" TIMESTAMP(3);
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "sla_breached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "sla_id" TEXT;
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "field_service_tickets" ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "auto_renewal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "deposit_held" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "documents" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "next_renewal_date" TIMESTAMP(3);
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "payment_due_day" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "renewal_terms" TEXT;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "tenant_email" TEXT;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "tenant_phone" TEXT;
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "terms" TEXT DEFAULT '';
ALTER TABLE "real_estate_leases" ADD COLUMN IF NOT EXISTS "unit_id" TEXT;
ALTER TABLE "real_estate_tenants" ADD COLUMN IF NOT EXISTS "documents" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "real_estate_tenants" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "real_estate_tenants" ADD COLUMN IF NOT EXISTS "lease_start" TIMESTAMP(3);
ALTER TABLE "real_estate_tenants" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "real_estate_tenants" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "stored_files" ADD COLUMN IF NOT EXISTS "folder_id" TEXT;
ALTER TABLE "stored_files" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL;
