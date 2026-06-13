/*
  Warnings:

  - You are about to drop the column `body_html` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `body_text` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `email_templates` table. All the data in the column will be lost.
  - Added the required column `body` to the `email_templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_templates" DROP COLUMN "body_html",
DROP COLUMN "body_text",
DROP COLUMN "created_by",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "variables" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "salutation" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "title" TEXT,
    "department" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_sources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "salutation" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "source_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "industry" TEXT,
    "employee_count" INTEGER,
    "annual_revenue" DECIMAL(15,2),
    "score" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assigned_to_id" TEXT,
    "converted_customer_id" TEXT,
    "converted_opportunity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customer_id" TEXT,
    "lead_id" TEXT,
    "pipeline_id" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'PROSPECTING',
    "amount" DECIMAL(15,2),
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close_date" TIMESTAMP(3),
    "actual_close_date" TIMESTAMP(3),
    "competitor" TEXT,
    "loss_reason" TEXT,
    "notes" TEXT,
    "assigned_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "lead_id" TEXT,
    "opportunity_id" TEXT,
    "customer_id" TEXT,
    "contact_id" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "assigned_to_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_tenant_id_idx" ON "contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "contacts_customer_id_idx" ON "contacts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_tenant_id_org_id_email_key" ON "contacts"("tenant_id", "org_id", "email");

-- CreateIndex
CREATE INDEX "lead_sources_tenant_id_idx" ON "lead_sources"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_sources_tenant_id_name_key" ON "lead_sources"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_status_idx" ON "leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_id_idx" ON "leads"("assigned_to_id");

-- CreateIndex
CREATE INDEX "sales_pipelines_tenant_id_idx" ON "sales_pipelines"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_pipelines_tenant_id_name_key" ON "sales_pipelines"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_idx" ON "opportunities"("tenant_id");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_stage_idx" ON "opportunities"("tenant_id", "stage");

-- CreateIndex
CREATE INDEX "opportunities_tenant_id_pipeline_id_idx" ON "opportunities"("tenant_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "opportunities_customer_id_idx" ON "opportunities"("customer_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_idx" ON "activities"("tenant_id");

-- CreateIndex
CREATE INDEX "activities_lead_id_idx" ON "activities"("lead_id");

-- CreateIndex
CREATE INDEX "activities_opportunity_id_idx" ON "activities"("opportunity_id");

-- CreateIndex
CREATE INDEX "activities_customer_id_idx" ON "activities"("customer_id");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "lead_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "sales_pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
