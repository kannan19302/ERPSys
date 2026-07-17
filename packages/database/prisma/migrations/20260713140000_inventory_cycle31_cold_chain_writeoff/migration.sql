-- Inventory Cycle 31: Cold Chain & Inventory Write-Off Management

CREATE TYPE "TemperatureUnit" AS ENUM ('CELSIUS','FAHRENHEIT');
CREATE TYPE "ExcursionSeverity" AS ENUM ('MINOR','MODERATE','CRITICAL');
CREATE TYPE "ExcursionStatus" AS ENUM ('OPEN','UNDER_REVIEW','QUARANTINED','RELEASED','DISPOSED');
CREATE TYPE "WriteDownStatus" AS ENUM ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','WRITTEN_DOWN');
CREATE TYPE "WriteOffStatus" AS ENUM ('DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','COMPLETED');

CREATE TABLE "cold_chain_requirements" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "min_temp_celsius" DECIMAL(10,2) NOT NULL,
  "max_temp_celsius" DECIMAL(10,2) NOT NULL,
  "min_humidity_pct" DECIMAL(5,2),
  "max_humidity_pct" DECIMAL(5,2),
  "max_excursion_mins" INTEGER,
  "special_handling" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cold_chain_requirements_tenant_id_product_id_key" UNIQUE ("tenant_id","product_id")
);
CREATE INDEX "cold_chain_requirements_tenant_id_idx" ON "cold_chain_requirements"("tenant_id");

CREATE TABLE "temperature_excursions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "requirement_id" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "batch_id" TEXT,
  "recorded_temp_c" DECIMAL(10,2) NOT NULL,
  "recorded_humidity_pct" DECIMAL(5,2),
  "excursion_start_at" TIMESTAMP(3) NOT NULL,
  "excursion_end_at" TIMESTAMP(3),
  "duration_mins" INTEGER,
  "severity" "ExcursionSeverity" NOT NULL,
  "status" "ExcursionStatus" NOT NULL DEFAULT 'OPEN',
  "logged_by_id" TEXT NOT NULL,
  "reviewed_by_id" TEXT,
  "disposition_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "temperature_excursions_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "cold_chain_requirements"("id") ON DELETE CASCADE
);
CREATE INDEX "temperature_excursions_tenant_id_idx" ON "temperature_excursions"("tenant_id");
CREATE INDEX "temperature_excursions_tenant_id_status_idx" ON "temperature_excursions"("tenant_id","status");
CREATE INDEX "temperature_excursions_tenant_id_warehouse_id_idx" ON "temperature_excursions"("tenant_id","warehouse_id");

CREATE TABLE "stock_write_down_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "request_number" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "batch_id" TEXT,
  "quantity" DECIMAL(15,4) NOT NULL,
  "original_value_per_unit" DECIMAL(15,4) NOT NULL,
  "proposed_value_per_unit" DECIMAL(15,4) NOT NULL,
  "write_down_reason" TEXT NOT NULL,
  "status" "WriteDownStatus" NOT NULL DEFAULT 'DRAFT',
  "requested_by_id" TEXT NOT NULL,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "rejection_notes" TEXT,
  "applied_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_write_down_requests_tenant_id_request_number_key" UNIQUE ("tenant_id","request_number")
);
CREATE INDEX "stock_write_down_requests_tenant_id_idx" ON "stock_write_down_requests"("tenant_id");
CREATE INDEX "stock_write_down_requests_tenant_id_status_idx" ON "stock_write_down_requests"("tenant_id","status");

CREATE TABLE "stock_write_off_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenant_id" TEXT NOT NULL,
  "write_off_number" TEXT NOT NULL,
  "warehouse_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "batch_id" TEXT,
  "quantity" DECIMAL(15,4) NOT NULL,
  "book_value_per_unit" DECIMAL(15,4) NOT NULL,
  "total_write_off" DECIMAL(15,4) NOT NULL,
  "disposal_method" TEXT NOT NULL,
  "write_off_reason" TEXT NOT NULL,
  "status" "WriteOffStatus" NOT NULL DEFAULT 'DRAFT',
  "requested_by_id" TEXT NOT NULL,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "rejection_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stock_write_off_records_tenant_id_write_off_number_key" UNIQUE ("tenant_id","write_off_number")
);
CREATE INDEX "stock_write_off_records_tenant_id_idx" ON "stock_write_off_records"("tenant_id");
CREATE INDEX "stock_write_off_records_tenant_id_status_idx" ON "stock_write_off_records"("tenant_id","status");
