-- CreateTable
CREATE TABLE "salary_components" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_percent" BOOLEAN NOT NULL DEFAULT false,
    "value" DECIMAL(15,2) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "overtime_hours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "file_url" TEXT,
    "expiry_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "serial_number" TEXT,
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "return_due_date" TIMESTAMP(3),
    "returned_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "onboarding_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "exit_date" TIMESTAMP(3) NOT NULL,
    "exit_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offboarding_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department_id" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "location" TEXT,
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "salary_range" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "cover_letter" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'APPLIED',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "round" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "type" TEXT NOT NULL DEFAULT 'QUARTERLY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'percentage',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_360" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'PEER',
    "period" TEXT NOT NULL DEFAULT '2026-Q2',
    "overallRating" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_360_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "category" TEXT NOT NULL DEFAULT 'COMMUNICATION',

    CONSTRAINT "feedback_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "current_holder_id" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "readinessLevel" TEXT NOT NULL DEFAULT 'NOT_READY',
    "successor_id" TEXT,
    "development_plan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "succession_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_skills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "certification_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'QUERY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'ENGAGEMENT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_components_tenant_id_idx" ON "salary_components"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_tenant_id_name_key" ON "salary_components"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "attendance_records_tenant_id_idx" ON "attendance_records"("tenant_id");

-- CreateIndex
CREATE INDEX "attendance_records_tenant_id_employee_id_idx" ON "attendance_records"("tenant_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_tenant_id_employee_id_date_key" ON "attendance_records"("tenant_id", "employee_id", "date");

-- CreateIndex
CREATE INDEX "employee_documents_tenant_id_idx" ON "employee_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_documents_tenant_id_employee_id_idx" ON "employee_documents"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "asset_assignments_tenant_id_idx" ON "asset_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_assignments_tenant_id_employee_id_idx" ON "asset_assignments"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "onboarding_checklists_tenant_id_idx" ON "onboarding_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "onboarding_items_tenant_id_idx" ON "onboarding_items"("tenant_id");

-- CreateIndex
CREATE INDEX "offboarding_checklists_tenant_id_idx" ON "offboarding_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "offboarding_items_tenant_id_idx" ON "offboarding_items"("tenant_id");

-- CreateIndex
CREATE INDEX "job_postings_tenant_id_idx" ON "job_postings"("tenant_id");

-- CreateIndex
CREATE INDEX "applicants_tenant_id_idx" ON "applicants"("tenant_id");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_idx" ON "interviews"("tenant_id");

-- CreateIndex
CREATE INDEX "goals_tenant_id_idx" ON "goals"("tenant_id");

-- CreateIndex
CREATE INDEX "goals_tenant_id_employee_id_idx" ON "goals"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "key_results_tenant_id_idx" ON "key_results"("tenant_id");

-- CreateIndex
CREATE INDEX "feedback_360_tenant_id_idx" ON "feedback_360"("tenant_id");

-- CreateIndex
CREATE INDEX "feedback_360_tenant_id_employee_id_idx" ON "feedback_360"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "feedback_responses_tenant_id_idx" ON "feedback_responses"("tenant_id");

-- CreateIndex
CREATE INDEX "succession_plans_tenant_id_idx" ON "succession_plans"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "succession_plans_tenant_id_position_key" ON "succession_plans"("tenant_id", "position");

-- CreateIndex
CREATE INDEX "employee_skills_tenant_id_idx" ON "employee_skills"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_skills_tenant_id_employee_id_skill_name_key" ON "employee_skills"("tenant_id", "employee_id", "skill_name");

-- CreateIndex
CREATE INDEX "hr_tickets_tenant_id_idx" ON "hr_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_tickets_tenant_id_employee_id_idx" ON "hr_tickets"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "engagement_surveys_tenant_id_idx" ON "engagement_surveys"("tenant_id");

-- CreateIndex
CREATE INDEX "survey_questions_tenant_id_idx" ON "survey_questions"("tenant_id");

-- CreateIndex
CREATE INDEX "survey_responses_tenant_id_idx" ON "survey_responses"("tenant_id");

-- AddForeignKey
ALTER TABLE "onboarding_items" ADD CONSTRAINT "onboarding_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "onboarding_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_items" ADD CONSTRAINT "offboarding_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "offboarding_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback_360"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "engagement_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
