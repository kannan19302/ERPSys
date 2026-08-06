-- CreateTable
CREATE TABLE "vendor_1099_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "is_1099_vendor" BOOLEAN NOT NULL DEFAULT false,
    "form_type" TEXT NOT NULL DEFAULT 'NEC',
    "default_box" TEXT NOT NULL DEFAULT '1',
    "tax_id_type" TEXT NOT NULL DEFAULT 'EIN',
    "tax_id_masked" TEXT,
    "w9_on_file" BOOLEAN NOT NULL DEFAULT false,
    "w9_received_date" TIMESTAMP(3),
    "tin_match_status" TEXT NOT NULL DEFAULT 'NOT_CHECKED',
    "tin_match_checked_at" TIMESTAMP(3),
    "backup_withholding_active" BOOLEAN NOT NULL DEFAULT false,
    "backup_withholding_rate" DECIMAL(5,2) NOT NULL DEFAULT 24.0,
    "state_filing_required" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT,
    "state_tax_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_1099_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_1099s" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "form_type" TEXT NOT NULL DEFAULT 'NEC',
    "box_amounts" JSONB NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "federal_withholding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "state" TEXT,
    "state_id" TEXT,
    "state_withholding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "batch_id" TEXT,
    "corrected_from_id" TEXT,
    "is_correction" BOOLEAN NOT NULL DEFAULT false,
    "filed_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "efile_submission_id" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_1099s_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_1099_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tax_year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "form_count" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "efile_confirmation" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_1099_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_1099_profiles_vendor_id_key" ON "vendor_1099_profiles"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_1099_profiles_tenant_id_idx" ON "vendor_1099_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_1099_profiles_tenant_id_is_1099_vendor_idx" ON "vendor_1099_profiles"("tenant_id", "is_1099_vendor");

-- CreateIndex
CREATE UNIQUE INDEX "form_1099s_corrected_from_id_key" ON "form_1099s"("corrected_from_id");

-- CreateIndex
CREATE INDEX "form_1099s_tenant_id_idx" ON "form_1099s"("tenant_id");

-- CreateIndex
CREATE INDEX "form_1099s_tenant_id_tax_year_idx" ON "form_1099s"("tenant_id", "tax_year");

-- CreateIndex
CREATE INDEX "form_1099s_tenant_id_status_idx" ON "form_1099s"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "form_1099s_tenant_id_vendor_id_tax_year_form_type_is_correc_key" ON "form_1099s"("tenant_id", "vendor_id", "tax_year", "form_type", "is_correction");

-- CreateIndex
CREATE INDEX "form_1099_batches_tenant_id_idx" ON "form_1099_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "form_1099_batches_tenant_id_tax_year_idx" ON "form_1099_batches"("tenant_id", "tax_year");

-- AddForeignKey
ALTER TABLE "vendor_1099_profiles" ADD CONSTRAINT "vendor_1099_profiles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_1099s" ADD CONSTRAINT "form_1099s_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_1099s" ADD CONSTRAINT "form_1099s_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "form_1099_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_1099s" ADD CONSTRAINT "form_1099s_corrected_from_id_fkey" FOREIGN KEY ("corrected_from_id") REFERENCES "form_1099s"("id") ON DELETE SET NULL ON UPDATE CASCADE;
