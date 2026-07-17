-- AlterTable
ALTER TABLE "approval_chains" ADD COLUMN     "delegated_role" TEXT;

-- AlterTable
ALTER TABLE "bom_items" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'COMPONENT';

-- AlterTable
ALTER TABLE "boms" ADD COLUMN     "material_cost" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "overhead_cost" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "routingJson" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "standard_cost" DECIMAL(15,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "leave_policies" ADD COLUMN     "carry_forward_limit" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "portfolio_id" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "actual_cost" DECIMAL(15,3),
ADD COLUMN     "cost_variance" DECIMAL(15,3),
ADD COLUMN     "overhead_cost" DECIMAL(15,3),
ADD COLUMN     "standard_cost" DECIMAL(15,3),
ADD COLUMN     "workstation_id" TEXT;

-- CreateTable
CREATE TABLE "project_portfolios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "risk_score" DECIMAL(5,2),
    "strategic_alignment" TEXT,
    "budget" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "probability" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "mitigation_plan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requested_amount" DECIMAL(15,2) NOT NULL,
    "requested_schedule_days" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_letters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "salary_offered" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_schemes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "employee_cost_share" DECIMAL(15,2) NOT NULL,
    "employer_cost_share" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_benefits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "scheme_id" TEXT NOT NULL,
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coverage_amount" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_requirements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "required_level" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "budgeted_salary" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "employee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "message" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_tables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "income_bracket_min" DECIMAL(15,2) NOT NULL,
    "income_bracket_max" DECIMAL(15,2),
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "allowance_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holiday_calendars" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workstations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacity_hours" DECIMAL(10,2) NOT NULL,
    "hourly_overhead_rate" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workstations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "run_by" TEXT,

    CONSTRAINT "mrp_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mrp_planned_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mrp_run_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "bom_id" TEXT,
    "demand_source" TEXT NOT NULL,
    "demand_source_id" TEXT,
    "quantity_needed" DECIMAL(15,3) NOT NULL,
    "quantity_in_stock" DECIMAL(15,3) NOT NULL,
    "net_quantity_required" DECIMAL(15,3) NOT NULL,
    "action_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mrp_planned_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspection_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "checks" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_inspection_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformance_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quality_inspection_id" TEXT,
    "work_order_id" TEXT,
    "product_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "disposition" TEXT NOT NULL DEFAULT 'REWORK',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "logged_by" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "non_conformance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_downtime_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "downtime_code" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machine_downtime_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CORRECTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "assigned_to" TEXT,
    "cost" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcontracting_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "bom_id" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "delivery_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontracting_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_forms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "doc_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "trigger" TEXT NOT NULL DEFAULT 'SUBMIT',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "layout" JSONB NOT NULL DEFAULT '{}',
    "refresh_rate" INTEGER NOT NULL DEFAULT 300,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "entities" JSONB NOT NULL DEFAULT '[]',
    "relationships" JSONB NOT NULL DEFAULT '[]',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "trigger_config" JSONB NOT NULL DEFAULT '{}',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "avg_exec_ms" INTEGER,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_import_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_model" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "column_mapping" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_log" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "meta_title" TEXT,
    "meta_desc" TEXT,
    "og_image" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "category" TEXT NOT NULL DEFAULT 'General',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "author" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured_image" TEXT,
    "meta_title" TEXT,
    "meta_desc" TEXT,
    "read_time" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_portfolios_tenant_id_idx" ON "project_portfolios"("tenant_id");

-- CreateIndex
CREATE INDEX "project_risks_tenant_id_idx" ON "project_risks"("tenant_id");

-- CreateIndex
CREATE INDEX "project_risks_project_id_idx" ON "project_risks"("project_id");

-- CreateIndex
CREATE INDEX "change_requests_tenant_id_idx" ON "change_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "change_requests_project_id_idx" ON "change_requests"("project_id");

-- CreateIndex
CREATE INDEX "offer_letters_tenant_id_idx" ON "offer_letters"("tenant_id");

-- CreateIndex
CREATE INDEX "benefit_schemes_tenant_id_idx" ON "benefit_schemes"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_benefits_tenant_id_idx" ON "employee_benefits"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_benefits_tenant_id_employee_id_scheme_id_key" ON "employee_benefits"("tenant_id", "employee_id", "scheme_id");

-- CreateIndex
CREATE INDEX "skill_requirements_tenant_id_idx" ON "skill_requirements"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_requirements_tenant_id_designation_skill_name_key" ON "skill_requirements"("tenant_id", "designation", "skill_name");

-- CreateIndex
CREATE INDEX "positions_tenant_id_idx" ON "positions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "positions_tenant_id_code_key" ON "positions"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "compliance_checks_tenant_id_idx" ON "compliance_checks"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_tables_tenant_id_country_idx" ON "tax_tables"("tenant_id", "country");

-- CreateIndex
CREATE INDEX "holiday_calendars_tenant_id_idx" ON "holiday_calendars"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "holiday_calendars_tenant_id_date_region_key" ON "holiday_calendars"("tenant_id", "date", "region");

-- CreateIndex
CREATE INDEX "workstations_tenant_id_idx" ON "workstations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "workstations_tenant_id_org_id_code_key" ON "workstations"("tenant_id", "org_id", "code");

-- CreateIndex
CREATE INDEX "mrp_runs_tenant_id_idx" ON "mrp_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "mrp_planned_items_tenant_id_idx" ON "mrp_planned_items"("tenant_id");

-- CreateIndex
CREATE INDEX "mrp_planned_items_mrp_run_id_idx" ON "mrp_planned_items"("mrp_run_id");

-- CreateIndex
CREATE INDEX "quality_inspection_plans_tenant_id_idx" ON "quality_inspection_plans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspection_plans_tenant_id_code_key" ON "quality_inspection_plans"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "non_conformance_reports_tenant_id_idx" ON "non_conformance_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "machine_downtime_logs_tenant_id_idx" ON "machine_downtime_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "machine_downtime_logs_workstation_id_idx" ON "machine_downtime_logs"("workstation_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_tenant_id_idx" ON "maintenance_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_workstation_id_idx" ON "maintenance_requests"("workstation_id");

-- CreateIndex
CREATE INDEX "subcontracting_orders_tenant_id_idx" ON "subcontracting_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "builder_forms_tenant_id_idx" ON "builder_forms"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "builder_forms_tenant_id_slug_key" ON "builder_forms"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "builder_workflows_tenant_id_idx" ON "builder_workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "builder_dashboards_tenant_id_idx" ON "builder_dashboards"("tenant_id");

-- CreateIndex
CREATE INDEX "builder_modules_tenant_id_idx" ON "builder_modules"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "builder_modules_tenant_id_slug_key" ON "builder_modules"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "automation_rules_tenant_id_idx" ON "automation_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "data_import_jobs_tenant_id_idx" ON "data_import_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "web_pages_tenant_id_idx" ON "web_pages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "web_pages_tenant_id_slug_key" ON "web_pages"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "blog_posts_tenant_id_idx" ON "blog_posts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_tenant_id_slug_key" ON "blog_posts"("tenant_id", "slug");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "project_portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_letters" ADD CONSTRAINT "offer_letters_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "benefit_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_planned_items" ADD CONSTRAINT "mrp_planned_items_mrp_run_id_fkey" FOREIGN KEY ("mrp_run_id") REFERENCES "mrp_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_planned_items" ADD CONSTRAINT "mrp_planned_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mrp_planned_items" ADD CONSTRAINT "mrp_planned_items_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_reports" ADD CONSTRAINT "non_conformance_reports_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_downtime_logs" ADD CONSTRAINT "machine_downtime_logs_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_workstation_id_fkey" FOREIGN KEY ("workstation_id") REFERENCES "workstations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracting_orders" ADD CONSTRAINT "subcontracting_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracting_orders" ADD CONSTRAINT "subcontracting_orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcontracting_orders" ADD CONSTRAINT "subcontracting_orders_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
