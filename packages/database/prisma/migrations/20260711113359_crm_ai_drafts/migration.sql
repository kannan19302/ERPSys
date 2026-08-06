-- CreateTable
CREATE TABLE "crm_ai_drafts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "draft_type" TEXT NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generated_by" TEXT,
    "used_at" TIMESTAMP(3),
    "discarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_ai_drafts_tenant_id_idx" ON "crm_ai_drafts"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_ai_drafts_tenant_id_context_type_context_id_idx" ON "crm_ai_drafts"("tenant_id", "context_type", "context_id");

-- CreateIndex
CREATE INDEX "crm_ai_drafts_tenant_id_status_idx" ON "crm_ai_drafts"("tenant_id", "status");
