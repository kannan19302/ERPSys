-- CreateTable
CREATE TABLE "system_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'archive',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_erasure_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "subject_email" TEXT NOT NULL,
    "subject_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "entity_types" JSONB NOT NULL DEFAULT '[]',
    "erased_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_erasure_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_announcements_tenant_id_is_active_idx" ON "system_announcements"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "scheduled_reports_tenant_id_idx" ON "scheduled_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "data_retention_policies_tenant_id_idx" ON "data_retention_policies"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_policies_tenant_id_entity_type_key" ON "data_retention_policies"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "data_erasure_requests_tenant_id_status_idx" ON "data_erasure_requests"("tenant_id", "status");
