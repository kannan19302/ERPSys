/*
  Warnings:

  - You are about to drop the `_archived_agent_commissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_book_register` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_book_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_drug_register` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_fee_structures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_leases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_medical_encounters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_patients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_practitioners` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_prescriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_preventative_maintenances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_properties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_property_maintenances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_service_dispatches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_service_tickets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_student_fees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_technician_checklists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_archived_timetables` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_archived_appointments" DROP CONSTRAINT "appointments_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_appointments" DROP CONSTRAINT "appointments_practitioner_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_book_transactions" DROP CONSTRAINT "book_transactions_book_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_book_transactions" DROP CONSTRAINT "book_transactions_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_leases" DROP CONSTRAINT "leases_property_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_medical_encounters" DROP CONSTRAINT "medical_encounters_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_medical_encounters" DROP CONSTRAINT "medical_encounters_practitioner_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_practitioners" DROP CONSTRAINT "practitioners_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_prescriptions" DROP CONSTRAINT "prescriptions_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_prescriptions" DROP CONSTRAINT "prescriptions_practitioner_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_properties" DROP CONSTRAINT "properties_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_property_maintenances" DROP CONSTRAINT "property_maintenances_property_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_service_dispatches" DROP CONSTRAINT "service_dispatches_ticket_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_student_fees" DROP CONSTRAINT "student_fees_fee_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_student_fees" DROP CONSTRAINT "student_fees_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_technician_checklists" DROP CONSTRAINT "technician_checklists_dispatch_id_fkey";

-- DropForeignKey
ALTER TABLE "_archived_timetables" DROP CONSTRAINT "timetables_course_id_fkey";

-- DropIndex
DROP INDEX "milestones_project_id_idx";

-- DropIndex
DROP INDEX "milestones_tenant_id_idx";

-- DropTable
DROP TABLE "_archived_agent_commissions";

-- DropTable
DROP TABLE "_archived_appointments";

-- DropTable
DROP TABLE "_archived_book_register";

-- DropTable
DROP TABLE "_archived_book_transactions";

-- DropTable
DROP TABLE "_archived_courses";

-- DropTable
DROP TABLE "_archived_drug_register";

-- DropTable
DROP TABLE "_archived_fee_structures";

-- DropTable
DROP TABLE "_archived_leases";

-- DropTable
DROP TABLE "_archived_medical_encounters";

-- DropTable
DROP TABLE "_archived_patients";

-- DropTable
DROP TABLE "_archived_practitioners";

-- DropTable
DROP TABLE "_archived_prescriptions";

-- DropTable
DROP TABLE "_archived_preventative_maintenances";

-- DropTable
DROP TABLE "_archived_properties";

-- DropTable
DROP TABLE "_archived_property_maintenances";

-- DropTable
DROP TABLE "_archived_service_dispatches";

-- DropTable
DROP TABLE "_archived_service_tickets";

-- DropTable
DROP TABLE "_archived_student_fees";

-- DropTable
DROP TABLE "_archived_students";

-- DropTable
DROP TABLE "_archived_technician_checklists";

-- DropTable
DROP TABLE "_archived_timetables";

-- CreateTable
CREATE TABLE "budget_period_amounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_period_amounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_control_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enforcementAction" TEXT NOT NULL DEFAULT 'WARN',
    "check_invoices" BOOLEAN NOT NULL DEFAULT true,
    "check_journals" BOOLEAN NOT NULL DEFAULT true,
    "check_expenses" BOOLEAN NOT NULL DEFAULT true,
    "tolerance_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_control_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_reallocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_reallocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_reallocation_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "budget_reallocation_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_reallocation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_period_amounts_tenant_id_idx" ON "budget_period_amounts"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_period_amounts_budget_id_idx" ON "budget_period_amounts"("budget_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_period_amounts_tenant_id_budget_id_period_key" ON "budget_period_amounts"("tenant_id", "budget_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "budget_control_configs_tenant_id_key" ON "budget_control_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_control_configs_tenant_id_idx" ON "budget_control_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_reallocations_number_key" ON "budget_reallocations"("number");

-- CreateIndex
CREATE INDEX "budget_reallocations_tenant_id_idx" ON "budget_reallocations"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_reallocation_lines_tenant_id_idx" ON "budget_reallocation_lines"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_reallocation_lines_budget_reallocation_id_idx" ON "budget_reallocation_lines"("budget_reallocation_id");

-- CreateIndex
CREATE INDEX "budget_reallocation_lines_budget_id_idx" ON "budget_reallocation_lines"("budget_id");

-- AddForeignKey
ALTER TABLE "budget_period_amounts" ADD CONSTRAINT "budget_period_amounts_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_reallocation_lines" ADD CONSTRAINT "budget_reallocation_lines_budget_reallocation_id_fkey" FOREIGN KEY ("budget_reallocation_id") REFERENCES "budget_reallocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_reallocation_lines" ADD CONSTRAINT "budget_reallocation_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
