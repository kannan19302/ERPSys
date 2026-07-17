-- Inventory Cycle 17: Quality & Compliance Management
-- CAPA, Instrument Calibration, Deviation Management, SOP Document Control

CREATE TABLE "capa_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "capa_number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'CORRECTIVE',
  "source" TEXT NOT NULL DEFAULT 'INTERNAL',
  "source_ref_id" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "description" TEXT NOT NULL,
  "root_cause" TEXT,
  "immediate_action" TEXT,
  "corrective_action" TEXT,
  "preventive_action" TEXT,
  "due_date" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "verified_at" TIMESTAMP(3),
  "verified_by" TEXT,
  "assigned_to" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "capa_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "capa_records_tenant_id_capa_number_key" ON "capa_records"("tenant_id", "capa_number");
CREATE INDEX "capa_records_tenant_id_idx" ON "capa_records"("tenant_id");
CREATE INDEX "capa_records_tenant_id_status_idx" ON "capa_records"("tenant_id", "status");

CREATE TABLE "capa_actions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "capa_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "assigned_to" TEXT,
  "due_date" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "capa_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "capa_actions_tenant_id_idx" ON "capa_actions"("tenant_id");
CREATE INDEX "capa_actions_capa_id_idx" ON "capa_actions"("capa_id");

ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_capa_id_fkey"
  FOREIGN KEY ("capa_id") REFERENCES "capa_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "calibration_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "instrument_id" TEXT NOT NULL,
  "instrument_name" TEXT NOT NULL,
  "serial_number" TEXT,
  "location" TEXT,
  "calibration_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DUE',
  "scheduled_date" TIMESTAMP(3) NOT NULL,
  "performed_at" TIMESTAMP(3),
  "next_due_date" TIMESTAMP(3),
  "interval_days" INTEGER,
  "performed_by" TEXT,
  "external_vendor" TEXT,
  "certificate_number" TEXT,
  "certificate_url" TEXT,
  "result" TEXT,
  "measurement_before" TEXT,
  "measurement_after" TEXT,
  "tolerance" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calibration_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "calibration_records_tenant_id_idx" ON "calibration_records"("tenant_id");
CREATE INDEX "calibration_records_tenant_id_status_idx" ON "calibration_records"("tenant_id", "status");
CREATE INDEX "calibration_records_tenant_id_instrument_id_idx" ON "calibration_records"("tenant_id", "instrument_id");

CREATE TABLE "deviation_records" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "deviation_number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PROCESS',
  "severity" TEXT NOT NULL DEFAULT 'MINOR',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "description" TEXT NOT NULL,
  "detected_at" TIMESTAMP(3) NOT NULL,
  "detected_by" TEXT,
  "area" TEXT,
  "product_id" TEXT,
  "batch_id" TEXT,
  "impact" TEXT,
  "immediate_action" TEXT,
  "capa_id" TEXT,
  "closed_at" TIMESTAMP(3),
  "closed_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "deviation_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "deviation_records_tenant_id_deviation_number_key" ON "deviation_records"("tenant_id", "deviation_number");
CREATE INDEX "deviation_records_tenant_id_idx" ON "deviation_records"("tenant_id");
CREATE INDEX "deviation_records_tenant_id_status_idx" ON "deviation_records"("tenant_id", "status");

CREATE TABLE "sop_documents" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "doc_number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'SOP',
  "department" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "version" TEXT NOT NULL DEFAULT '1.0',
  "effective_date" TIMESTAMP(3),
  "review_date" TIMESTAMP(3),
  "expiry_date" TIMESTAMP(3),
  "author_id" TEXT,
  "approver_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "file_url" TEXT,
  "description" TEXT,
  "keywords" TEXT,
  "superseded_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sop_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sop_documents_tenant_id_doc_number_version_key" ON "sop_documents"("tenant_id", "doc_number", "version");
CREATE INDEX "sop_documents_tenant_id_idx" ON "sop_documents"("tenant_id");
CREATE INDEX "sop_documents_tenant_id_status_idx" ON "sop_documents"("tenant_id", "status");

CREATE TABLE "sop_revisions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "doc_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "changed_by" TEXT,
  "change_summary" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sop_revisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sop_revisions_tenant_id_idx" ON "sop_revisions"("tenant_id");
CREATE INDEX "sop_revisions_doc_id_idx" ON "sop_revisions"("doc_id");

ALTER TABLE "sop_revisions" ADD CONSTRAINT "sop_revisions_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "sop_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
