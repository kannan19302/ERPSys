-- Create 22 new HR Advanced tables
-- Migration: add_hr_advanced_22_models

-- EmployeeAchievement
CREATE TABLE "employee_achievements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "award_date" TIMESTAMPTZ NOT NULL,
    "awarded_by" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_achievements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_achievements_tenant_id_employee_id_idx" ON "employee_achievements"("tenant_id", "employee_id");

-- EmployeeReferral
CREATE TABLE "employee_referrals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "referring_employee_id" TEXT NOT NULL,
    "candidate_name" TEXT NOT NULL,
    "candidate_email" TEXT NOT NULL,
    "candidate_phone" TEXT,
    "position" TEXT,
    "relationship" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reward_amount" DECIMAL(15,2),
    "reward_paid" BOOLEAN NOT NULL DEFAULT false,
    "referral_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_referrals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_referrals_tenant_id_referring_employee_id_idx" ON "employee_referrals"("tenant_id", "referring_employee_id");

-- EmployeeEducation
CREATE TABLE "employee_education" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "field" TEXT,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "grade" TEXT,
    "is_highest_degree" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "employee_education_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_education_tenant_id_employee_id_idx" ON "employee_education"("tenant_id", "employee_id");

-- EmployeeDependent
CREATE TABLE "employee_dependents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "date_of_birth" TIMESTAMPTZ,
    "is_nominee" BOOLEAN NOT NULL DEFAULT false,
    "nominee_percent" INTEGER,
    CONSTRAINT "employee_dependents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_dependents_tenant_id_employee_id_idx" ON "employee_dependents"("tenant_id", "employee_id");

-- EmployeeEmergencyContact
CREATE TABLE "employee_emergency_contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "employee_emergency_contacts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_emergency_contacts_tenant_id_employee_id_idx" ON "employee_emergency_contacts"("tenant_id", "employee_id");

-- HrExpenseClaim
CREATE TABLE "hr_expense_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "submitted_at" TIMESTAMPTZ,
    "reimbursed_at" TIMESTAMPTZ,
    "payment_method" TEXT,
    "rejected_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_expense_claims_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_expense_claims_tenant_id_employee_id_idx" ON "hr_expense_claims"("tenant_id", "employee_id");

-- HrExpenseClaimItem
CREATE TABLE "hr_expense_claim_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "expense_date" TIMESTAMPTZ NOT NULL,
    "receipt_url" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    CONSTRAINT "hr_expense_claim_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_expense_claim_items_tenant_id_claim_id_idx" ON "hr_expense_claim_items"("tenant_id", "claim_id");
ALTER TABLE "hr_expense_claim_items" ADD CONSTRAINT "hr_expense_claim_items_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "hr_expense_claims"("id") ON DELETE CASCADE;

-- EmployeePromotion
CREATE TABLE "employee_promotions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "previous_title" TEXT NOT NULL,
    "new_title" TEXT NOT NULL,
    "previous_grade" TEXT,
    "new_grade" TEXT,
    "previous_salary" DECIMAL(15,2),
    "new_salary" DECIMAL(15,2),
    "promotion_date" TIMESTAMPTZ NOT NULL,
    "promotion_type" TEXT NOT NULL DEFAULT 'PROMOTION',
    "reason" TEXT,
    "approved_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_promotions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_promotions_tenant_id_employee_id_idx" ON "employee_promotions"("tenant_id", "employee_id");

-- EmployeeSeparation
CREATE TABLE "employee_separations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "separation_type" TEXT NOT NULL,
    "last_working_day" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "is_eligible_for_rehire" BOOLEAN NOT NULL DEFAULT true,
    "notice_period_days" INTEGER,
    "settlement_amount" DECIMAL(15,2),
    "approved_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_separations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_separations_tenant_id_employee_id_idx" ON "employee_separations"("tenant_id", "employee_id");

-- ExitInterview
CREATE TABLE "exit_interviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "separation_id" TEXT,
    "interview_date" TIMESTAMPTZ NOT NULL,
    "interviewer" TEXT,
    "reason_for_leaving" TEXT,
    "feedback" TEXT,
    "suggestions" TEXT,
    "would_return" BOOLEAN,
    "would_recommend" BOOLEAN,
    "satisfaction_score" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exit_interviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "exit_interviews_tenant_id_employee_id_idx" ON "exit_interviews"("tenant_id", "employee_id");

-- EmployeeWarning
CREATE TABLE "employee_warnings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "warning_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "issued_date" TIMESTAMPTZ NOT NULL,
    "expiry_date" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_warnings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "employee_warnings_tenant_id_employee_id_idx" ON "employee_warnings"("tenant_id", "employee_id");

-- HrPolicy
CREATE TABLE "hr_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effective_date" TIMESTAMPTZ NOT NULL,
    "created_by" TEXT,
    "requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_policies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_policies_tenant_id_idx" ON "hr_policies"("tenant_id");

-- HrPolicyAcknowledgment
CREATE TABLE "hr_policy_acknowledgments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "signature" TEXT,
    "acknowledged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_policy_acknowledgments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hr_policy_acknowledgments_tenant_id_policy_id_employee_id_key" ON "hr_policy_acknowledgments"("tenant_id", "policy_id", "employee_id");
CREATE INDEX "hr_policy_acknowledgments_tenant_id_idx" ON "hr_policy_acknowledgments"("tenant_id");
ALTER TABLE "hr_policy_acknowledgments" ADD CONSTRAINT "hr_policy_acknowledgments_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "hr_policies"("id") ON DELETE CASCADE;

-- HrAnnouncement
CREATE TABLE "hr_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ,
    "created_by" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hr_announcements_tenant_id_starts_at_idx" ON "hr_announcements"("tenant_id", "starts_at");

-- RecruitmentAgency
CREATE TABLE "recruitment_agencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "commission_rate" DECIMAL(5,2),
    "agreement_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recruitment_agencies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "recruitment_agencies_tenant_id_idx" ON "recruitment_agencies"("tenant_id");

-- OfferTemplate
CREATE TABLE "offer_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offer_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "offer_templates_tenant_id_idx" ON "offer_templates"("tenant_id");

-- SalaryRevision
CREATE TABLE "salary_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "previous_salary" DECIMAL(15,2) NOT NULL,
    "new_salary" DECIMAL(15,2) NOT NULL,
    "revision_type" TEXT NOT NULL DEFAULT 'ANNUAL',
    "effective_date" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salary_revisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "salary_revisions_tenant_id_employee_id_idx" ON "salary_revisions"("tenant_id", "employee_id");

-- OvertimeRequest
CREATE TABLE "overtime_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "total_hours" DECIMAL(6,2) NOT NULL,
    "rate" DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "overtime_requests_tenant_id_employee_id_idx" ON "overtime_requests"("tenant_id", "employee_id");

-- AttendanceAdjustment
CREATE TABLE "attendance_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_id" TEXT,
    "date" TIMESTAMPTZ NOT NULL,
    "previous_check_in" TIMESTAMPTZ,
    "previous_check_out" TIMESTAMPTZ,
    "new_check_in" TIMESTAMPTZ,
    "new_check_out" TIMESTAMPTZ,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "attendance_adjustments_tenant_id_employee_id_idx" ON "attendance_adjustments"("tenant_id", "employee_id");

-- PayrollTaxEntry
CREATE TABLE "payroll_tax_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "tax_type" TEXT NOT NULL,
    "taxable_amount" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_tax_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "payroll_tax_entries_tenant_id_payroll_run_id_idx" ON "payroll_tax_entries"("tenant_id", "payroll_run_id");

-- PayrollContribution
CREATE TABLE "payroll_contributions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "contribution_type" TEXT NOT NULL,
    "employer_amount" DECIMAL(15,2) NOT NULL,
    "employee_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payroll_contributions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "payroll_contributions_tenant_id_payroll_run_id_idx" ON "payroll_contributions"("tenant_id", "payroll_run_id");

-- KpiTemplate
CREATE TABLE "kpi_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PERFORMANCE',
    "metric_type" TEXT NOT NULL,
    "target_value" DECIMAL(15,2),
    "unit" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kpi_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kpi_templates_tenant_id_idx" ON "kpi_templates"("tenant_id");

-- KpiEvaluation
CREATE TABLE "kpi_evaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "kpi_template_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "target_value" DECIMAL(15,2) NOT NULL,
    "actual_value" DECIMAL(15,2),
    "weightage" INTEGER NOT NULL DEFAULT 100,
    "score" DECIMAL(8,2),
    "reviewer_id" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kpi_evaluations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "kpi_evaluations_tenant_id_employee_id_idx" ON "kpi_evaluations"("tenant_id", "employee_id");
ALTER TABLE "kpi_evaluations" ADD CONSTRAINT "kpi_evaluations_kpi_template_id_fkey" FOREIGN KEY ("kpi_template_id") REFERENCES "kpi_templates"("id") ON DELETE RESTRICT;
