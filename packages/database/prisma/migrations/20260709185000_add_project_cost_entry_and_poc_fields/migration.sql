-- AlterTable
ALTER TABLE "projects" ADD COLUMN "estimated_cost" DECIMAL(15,2),
ADD COLUMN "contract_value" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "project_id" TEXT;

-- CreateIndex
CREATE INDEX "invoices_project_id_idx" ON "invoices"("project_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "project_cost_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_cost_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_cost_entries_tenant_id_idx" ON "project_cost_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "project_cost_entries_project_id_idx" ON "project_cost_entries"("project_id");

-- AddForeignKey
ALTER TABLE "project_cost_entries" ADD CONSTRAINT "project_cost_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
