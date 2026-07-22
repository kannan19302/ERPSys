-- CreateTable: supplier_contracts
CREATE TABLE "supplier_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contractType" TEXT NOT NULL DEFAULT 'PURCHASE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_value" DECIMAL(18,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "renewal_terms" TEXT,
    "terms_conditions" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_contract_line_items
CREATE TABLE "supplier_contract_line_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "product_id" TEXT,
    "item_code" TEXT,
    "description" TEXT,
    "unit_price" DECIMAL(18,4),
    "quantity" DECIMAL(15,4),
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "discount_pct" DECIMAL(5,2),
    "total_price" DECIMAL(18,4),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_contract_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_performance_kpis
CREATE TABLE "supplier_performance_kpis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'QUALITY',
    "unit" TEXT NOT NULL DEFAULT 'SCORE',
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_performance_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_assessments
CREATE TABLE "supplier_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assessment_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'QUALITY',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "score" DECIMAL(5,2),
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "assessed_by" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "overall_rating" TEXT,
    "next_assessment_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supply_chain_budgets
CREATE TABLE "supply_chain_budgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "budget_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'YEARLY',
    "total_amount" DECIMAL(18,4) NOT NULL,
    "spent_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "department" TEXT,
    "description" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supply_chain_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supply_chain_budget_lines
CREATE TABLE "supply_chain_budget_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TRANSPORTATION',
    "description" TEXT,
    "allocated" DECIMAL(18,4) NOT NULL,
    "spent" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supply_chain_budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable: container_tracking
CREATE TABLE "container_tracking" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "container_number" TEXT NOT NULL,
    "containerType" TEXT NOT NULL DEFAULT 'DRY_VAN',
    "size" TEXT NOT NULL DEFAULT '20FT',
    "status" TEXT NOT NULL DEFAULT 'EMPTY',
    "carrier_id" TEXT,
    "seal_number" TEXT,
    "vessel_name" TEXT,
    "voyage_number" TEXT,
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "inbound_shipment_id" TEXT,
    "outbound_shipment_id" TEXT,
    "estimated_arrival" TIMESTAMP(3),
    "actual_arrival" TIMESTAMP(3),
    "estimated_return" TIMESTAMP(3),
    "demurrage_days" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "container_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable: container_tracking_events
CREATE TABLE "container_tracking_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "container_id" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "container_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customs_documents
CREATE TABLE "customs_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doc_number" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'INVOICE',
    "direction" TEXT NOT NULL DEFAULT 'EXPORT',
    "shipment_type" TEXT,
    "shipment_id" TEXT,
    "container_id" TEXT,
    "customs_value" DECIMAL(18,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "hs_code" TEXT,
    "country_of_origin" TEXT,
    "country_of_dest" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "cleared_at" TIMESTAMP(3),
    "broker_id" TEXT,
    "broker_name" TEXT,
    "duty_amount" DECIMAL(18,4),
    "tax_amount" DECIMAL(18,4),
    "total_fees" DECIMAL(18,4),
    "document_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customs_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_non_conformances
CREATE TABLE "supplier_non_conformances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ncr_number" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "product_id" TEXT,
    "purchase_order_id" TEXT,
    "receipt_id" TEXT,
    "defectType" TEXT NOT NULL DEFAULT 'QUALITY',
    "severity" TEXT NOT NULL DEFAULT 'MINOR',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "defect_qty" INTEGER NOT NULL DEFAULT 0,
    "total_qty" INTEGER NOT NULL DEFAULT 0,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "prevention_plan" TEXT,
    "due_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "closed_by" TEXT,
    "credit_requested" DECIMAL(18,4),
    "credit_received" DECIMAL(18,4),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_non_conformances_pkey" PRIMARY KEY ("id")
);

-- CreateTable: lane_rates
CREATE TABLE "lane_rates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "origin_region" TEXT,
    "dest_region" TEXT,
    "transportMode" TEXT NOT NULL DEFAULT 'GROUND',
    "base_rate" DECIMAL(18,4) NOT NULL,
    "rate_per_kg" DECIMAL(18,6),
    "rate_per_km" DECIMAL(18,6),
    "rate_per_pallet" DECIMAL(18,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "min_charge" DECIMAL(18,4),
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "transit_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lane_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: supplier_certifications
CREATE TABLE "supplier_certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "certification_type" TEXT NOT NULL,
    "certification_name" TEXT NOT NULL,
    "issuing_body" TEXT NOT NULL,
    "certificate_number" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "document_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "supplier_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_contracts_tenant_id_contract_number_key" ON "supplier_contracts"("tenant_id", "contract_number");
CREATE INDEX "supplier_contracts_tenant_id_idx" ON "supplier_contracts"("tenant_id");
CREATE INDEX "supplier_contracts_tenant_id_vendor_id_idx" ON "supplier_contracts"("tenant_id", "vendor_id");
CREATE INDEX "supplier_contracts_tenant_id_status_idx" ON "supplier_contracts"("tenant_id", "status");

CREATE INDEX "supplier_contract_line_items_tenant_id_idx" ON "supplier_contract_line_items"("tenant_id");
CREATE INDEX "supplier_contract_line_items_contract_id_idx" ON "supplier_contract_line_items"("contract_id");

CREATE UNIQUE INDEX "supplier_performance_kpis_tenant_id_kpi_code_key" ON "supplier_performance_kpis"("tenant_id", "kpi_code");
CREATE INDEX "supplier_performance_kpis_tenant_id_idx" ON "supplier_performance_kpis"("tenant_id");

CREATE UNIQUE INDEX "supplier_assessments_tenant_id_assessment_number_key" ON "supplier_assessments"("tenant_id", "assessment_number");
CREATE INDEX "supplier_assessments_tenant_id_idx" ON "supplier_assessments"("tenant_id");
CREATE INDEX "supplier_assessments_tenant_id_vendor_id_idx" ON "supplier_assessments"("tenant_id", "vendor_id");

CREATE UNIQUE INDEX "supply_chain_budgets_tenant_id_budget_number_key" ON "supply_chain_budgets"("tenant_id", "budget_number");
CREATE INDEX "supply_chain_budgets_tenant_id_idx" ON "supply_chain_budgets"("tenant_id");
CREATE INDEX "supply_chain_budgets_tenant_id_fiscal_year_idx" ON "supply_chain_budgets"("tenant_id", "fiscal_year");

CREATE INDEX "supply_chain_budget_lines_tenant_id_idx" ON "supply_chain_budget_lines"("tenant_id");
CREATE INDEX "supply_chain_budget_lines_budget_id_idx" ON "supply_chain_budget_lines"("budget_id");

CREATE UNIQUE INDEX "container_tracking_tenant_id_container_number_key" ON "container_tracking"("tenant_id", "container_number");
CREATE INDEX "container_tracking_tenant_id_idx" ON "container_tracking"("tenant_id");
CREATE INDEX "container_tracking_tenant_id_status_idx" ON "container_tracking"("tenant_id", "status");

CREATE INDEX "container_tracking_events_tenant_id_idx" ON "container_tracking_events"("tenant_id");
CREATE INDEX "container_tracking_events_container_id_idx" ON "container_tracking_events"("container_id");

CREATE UNIQUE INDEX "customs_documents_tenant_id_doc_number_key" ON "customs_documents"("tenant_id", "doc_number");
CREATE INDEX "customs_documents_tenant_id_idx" ON "customs_documents"("tenant_id");
CREATE INDEX "customs_documents_tenant_id_status_idx" ON "customs_documents"("tenant_id", "status");
CREATE INDEX "customs_documents_tenant_id_shipment_type_shipment_id_idx" ON "customs_documents"("tenant_id", "shipment_type", "shipment_id");

CREATE UNIQUE INDEX "supplier_non_conformances_tenant_id_ncr_number_key" ON "supplier_non_conformances"("tenant_id", "ncr_number");
CREATE INDEX "supplier_non_conformances_tenant_id_idx" ON "supplier_non_conformances"("tenant_id");
CREATE INDEX "supplier_non_conformances_tenant_id_vendor_id_idx" ON "supplier_non_conformances"("tenant_id", "vendor_id");
CREATE INDEX "supplier_non_conformances_tenant_id_status_idx" ON "supplier_non_conformances"("tenant_id", "status");

CREATE INDEX "lane_rates_tenant_id_idx" ON "lane_rates"("tenant_id");
CREATE INDEX "lane_rates_tenant_id_carrier_id_idx" ON "lane_rates"("tenant_id", "carrier_id");
CREATE INDEX "lane_rates_tenant_id_origin_destination_idx" ON "lane_rates"("tenant_id", "origin", "destination");

CREATE UNIQUE INDEX "supplier_certifications_tenant_id_vendor_id_certification_type_certificate_number_key" ON "supplier_certifications"("tenant_id", "vendor_id", "certification_type", "certificate_number");
CREATE INDEX "supplier_certifications_tenant_id_idx" ON "supplier_certifications"("tenant_id");
CREATE INDEX "supplier_certifications_tenant_id_vendor_id_idx" ON "supplier_certifications"("tenant_id", "vendor_id");
CREATE INDEX "supplier_certifications_tenant_id_expiry_date_idx" ON "supplier_certifications"("tenant_id", "expiry_date");

-- AddForeignKey
ALTER TABLE "supplier_contracts" ADD CONSTRAINT "supplier_contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_contract_line_items" ADD CONSTRAINT "supplier_contract_line_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "supplier_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_assessments" ADD CONSTRAINT "supplier_assessments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supply_chain_budget_lines" ADD CONSTRAINT "supply_chain_budget_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "supply_chain_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "container_tracking" ADD CONSTRAINT "container_tracking_inbound_shipment_id_fkey" FOREIGN KEY ("inbound_shipment_id") REFERENCES "inbound_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "container_tracking" ADD CONSTRAINT "container_tracking_outbound_shipment_id_fkey" FOREIGN KEY ("outbound_shipment_id") REFERENCES "outbound_shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "container_tracking_events" ADD CONSTRAINT "container_tracking_events_container_id_fkey" FOREIGN KEY ("container_id") REFERENCES "container_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "supplier_non_conformances" ADD CONSTRAINT "supplier_non_conformances_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lane_rates" ADD CONSTRAINT "lane_rates_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "shipping_carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_certifications" ADD CONSTRAINT "supplier_certifications_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
