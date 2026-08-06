-- AlterTable
ALTER TABLE "trainings" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "enrollment_deadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "training_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "training_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_enrollments_tenant_id_idx" ON "training_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "training_enrollments_training_id_idx" ON "training_enrollments"("training_id");

-- CreateIndex
CREATE INDEX "training_enrollments_employee_id_idx" ON "training_enrollments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_enrollments_tenant_id_training_id_employee_id_key" ON "training_enrollments"("tenant_id", "training_id", "employee_id");

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
