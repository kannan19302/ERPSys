-- AlterTable
ALTER TABLE "email_sequence_steps" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "subject" TEXT,
ALTER COLUMN "template_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "country" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "cadence_auto_enroll_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL DEFAULT 'LEAD',
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cadence_auto_enroll_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_step_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadence_step_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_assignment_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "territory_assignment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_assignment_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "territory_id" TEXT,
    "rule_id" TEXT,
    "assigned_to_id" TEXT,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territory_assignment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_round_robin_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "last_member_index" INTEGER NOT NULL DEFAULT -1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territory_round_robin_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_signature_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "signature_id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "document_hash" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signer_email" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "audit_trail" JSONB NOT NULL DEFAULT '[]',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_signature_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cadence_auto_enroll_rules_tenant_id_idx" ON "cadence_auto_enroll_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "cadence_auto_enroll_rules_tenant_id_is_active_idx" ON "cadence_auto_enroll_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "cadence_step_tasks_tenant_id_idx" ON "cadence_step_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "cadence_step_tasks_tenant_id_status_idx" ON "cadence_step_tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "cadence_step_tasks_enrollment_id_idx" ON "cadence_step_tasks"("enrollment_id");

-- CreateIndex
CREATE INDEX "territory_assignment_rules_tenant_id_idx" ON "territory_assignment_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "territory_assignment_rules_tenant_id_is_active_priority_idx" ON "territory_assignment_rules"("tenant_id", "is_active", "priority");

-- CreateIndex
CREATE INDEX "territory_assignment_logs_tenant_id_idx" ON "territory_assignment_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "territory_assignment_logs_tenant_id_entity_type_entity_id_idx" ON "territory_assignment_logs"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "territory_round_robin_states_tenant_id_territory_id_key" ON "territory_round_robin_states"("tenant_id", "territory_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_signature_certificates_signature_id_key" ON "quotation_signature_certificates"("signature_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_signature_certificates_certificate_number_key" ON "quotation_signature_certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "quotation_signature_certificates_tenant_id_idx" ON "quotation_signature_certificates"("tenant_id");

-- AddForeignKey
ALTER TABLE "cadence_auto_enroll_rules" ADD CONSTRAINT "cadence_auto_enroll_rules_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_step_tasks" ADD CONSTRAINT "cadence_step_tasks_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "email_sequence_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_step_tasks" ADD CONSTRAINT "cadence_step_tasks_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "email_sequence_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territory_assignment_rules" ADD CONSTRAINT "territory_assignment_rules_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_signature_certificates" ADD CONSTRAINT "quotation_signature_certificates_signature_id_fkey" FOREIGN KEY ("signature_id") REFERENCES "quotation_signatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
