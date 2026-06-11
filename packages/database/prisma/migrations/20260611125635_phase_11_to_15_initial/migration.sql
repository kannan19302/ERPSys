-- CreateTable
CREATE TABLE "report_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "chart_type" TEXT NOT NULL,
    "query_config" JSONB NOT NULL,
    "position" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query_config" JSONB NOT NULL,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule_cron" TEXT,
    "recipient_emails" TEXT,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "medical_history" JSONB,
    "vitals_history" JSONB,
    "allergies" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioners" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_register" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "is_controlled" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_encounters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment_code" TEXT NOT NULL,
    "claimStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "billing_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "enrollment_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "parent_contact" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_structure_id" TEXT NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_register" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "checkout_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3),
    "fine_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "portfolio" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "parent_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rent_amount" DECIMAL(15,2) NOT NULL,
    "security_deposit" DECIMAL(15,2) NOT NULL,
    "billing_frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_maintenances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "vendor_id" TEXT,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "split_ratio" DECIMAL(3,2) NOT NULL,
    "general_ledger_ref" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_dispatches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "route_details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technician_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "signature_url" TEXT,
    "is_offline_synced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technician_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preventative_maintenances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recurrence_cron" TEXT NOT NULL,
    "next_run_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preventative_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_widgets_tenant_id_idx" ON "report_widgets"("tenant_id");

-- CreateIndex
CREATE INDEX "report_views_tenant_id_idx" ON "report_views"("tenant_id");

-- CreateIndex
CREATE INDEX "patients_tenant_id_idx" ON "patients"("tenant_id");

-- CreateIndex
CREATE INDEX "practitioners_tenant_id_idx" ON "practitioners"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "prescriptions_tenant_id_idx" ON "prescriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "drug_register_tenant_id_idx" ON "drug_register"("tenant_id");

-- CreateIndex
CREATE INDEX "medical_encounters_tenant_id_idx" ON "medical_encounters"("tenant_id");

-- CreateIndex
CREATE INDEX "students_tenant_id_idx" ON "students"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_tenant_id_enrollment_number_key" ON "students"("tenant_id", "enrollment_number");

-- CreateIndex
CREATE INDEX "courses_tenant_id_idx" ON "courses"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_tenant_id_code_key" ON "courses"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "timetables_tenant_id_idx" ON "timetables"("tenant_id");

-- CreateIndex
CREATE INDEX "fee_structures_tenant_id_idx" ON "fee_structures"("tenant_id");

-- CreateIndex
CREATE INDEX "student_fees_tenant_id_idx" ON "student_fees"("tenant_id");

-- CreateIndex
CREATE INDEX "book_register_tenant_id_idx" ON "book_register"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_register_tenant_id_isbn_key" ON "book_register"("tenant_id", "isbn");

-- CreateIndex
CREATE INDEX "book_transactions_tenant_id_idx" ON "book_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "properties_tenant_id_idx" ON "properties"("tenant_id");

-- CreateIndex
CREATE INDEX "leases_tenant_id_idx" ON "leases"("tenant_id");

-- CreateIndex
CREATE INDEX "property_maintenances_tenant_id_idx" ON "property_maintenances"("tenant_id");

-- CreateIndex
CREATE INDEX "agent_commissions_tenant_id_idx" ON "agent_commissions"("tenant_id");

-- CreateIndex
CREATE INDEX "service_tickets_tenant_id_idx" ON "service_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "service_dispatches_tenant_id_idx" ON "service_dispatches"("tenant_id");

-- CreateIndex
CREATE INDEX "technician_checklists_tenant_id_idx" ON "technician_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "preventative_maintenances_tenant_id_idx" ON "preventative_maintenances"("tenant_id");

-- AddForeignKey
ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_encounters" ADD CONSTRAINT "medical_encounters_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_encounters" ADD CONSTRAINT "medical_encounters_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_fee_structure_id_fkey" FOREIGN KEY ("fee_structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_transactions" ADD CONSTRAINT "book_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_transactions" ADD CONSTRAINT "book_transactions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book_register"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_maintenances" ADD CONSTRAINT "property_maintenances_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_dispatches" ADD CONSTRAINT "service_dispatches_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technician_checklists" ADD CONSTRAINT "technician_checklists_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "service_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
