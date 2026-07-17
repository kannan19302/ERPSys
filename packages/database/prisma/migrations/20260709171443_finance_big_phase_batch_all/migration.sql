-- CreateTable
CREATE TABLE "tax_jurisdictions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "county" TEXT,
    "tax_type" TEXT NOT NULL,
    "rate" DECIMAL(8,4) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_jurisdictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_exemption_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "jurisdiction_id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "exemption_type" TEXT NOT NULL,
    "exemption_pct" DECIMAL(8,4),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "document_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_exemption_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_reconciliations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "tax_type" TEXT NOT NULL,
    "output_tax" DECIMAL(15,2) NOT NULL,
    "input_tax" DECIMAL(15,2) NOT NULL,
    "net_liability" DECIMAL(15,2) NOT NULL,
    "payments_made" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "difference" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withholding_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "withholding_tax_id" TEXT,
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "tax_withheld" DECIMAL(15,2) NOT NULL,
    "certificate_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "filed_at" TIMESTAMP(3),
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withholding_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amended_tax_filings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "original_filing_id" TEXT NOT NULL,
    "amended_reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '{}',
    "refund_amount" DECIMAL(15,2),
    "additional_tax" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amended_tax_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasury_positions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "position_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "book_balance" DECIMAL(15,2) NOT NULL,
    "available_balance" DECIMAL(15,2) NOT NULL,
    "float_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bank_account_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treasury_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hedge_instruments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "instrument_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "counterparty" TEXT,
    "notional_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "strike_rate" DECIMAL(12,6),
    "premium" DECIMAL(15,2),
    "trade_date" TIMESTAMP(3) NOT NULL,
    "maturity_date" TIMESTAMP(3) NOT NULL,
    "settlement_date" TIMESTAMP(3),
    "market_value" DECIMAL(15,2),
    "unrealized_pnl" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "hedged_item_ref" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hedge_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_facilities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facility_type" TEXT NOT NULL,
    "lender" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "facility_limit" DECIMAL(15,2) NOT NULL,
    "drawn_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "available_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL(8,4) NOT NULL,
    "rate_type" TEXT NOT NULL DEFAULT 'FIXED',
    "start_date" TIMESTAMP(3) NOT NULL,
    "maturity_date" TIMESTAMP(3) NOT NULL,
    "covenants" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_holdings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "security_name" TEXT NOT NULL,
    "ticker" TEXT,
    "asset_class" TEXT NOT NULL,
    "units" DECIMAL(15,4) NOT NULL,
    "cost_basis" DECIMAL(15,2) NOT NULL,
    "current_price" DECIMAL(15,4),
    "current_value" DECIMAL(15,2),
    "unrealized_pnl" DECIMAL(15,2),
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "maturity_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "custodian" TEXT,
    "gl_account_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_statements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "notes" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ap_duplicate_flags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "duplicate_invoice_id" TEXT,
    "match_score" DECIMAL(5,2) NOT NULL,
    "match_criteria" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "notes" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ap_duplicate_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ap_approval_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "threshold_min" DECIMAL(15,2),
    "threshold_max" DECIMAL(15,2),
    "approver_roles" JSONB NOT NULL DEFAULT '[]',
    "requires_two" BOOLEAN NOT NULL DEFAULT false,
    "department_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ap_approval_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grni_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "receipt_id" TEXT,
    "vendor_id" TEXT NOT NULL,
    "product_id" TEXT,
    "received_qty" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4) NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "invoiced_date" TIMESTAMP(3),
    "invoice_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "aging_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grni_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_promises_to_pay" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "promised_date" TIMESTAMP(3) NOT NULL,
    "promised_amount" DECIMAL(15,2) NOT NULL,
    "received_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PROMISED',
    "collector_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_promises_to_pay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_disputes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "disputed_amount" DECIMAL(15,2) NOT NULL,
    "resolved_amount" DECIMAL(15,2),
    "opened_by" TEXT NOT NULL,
    "assigned_to" TEXT,
    "linked_credit_note_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bad_debt_provisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'AGING_BUCKET',
    "provision_pct" DECIMAL(8,4),
    "provision_amount" DECIMAL(15,2) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '[]',
    "gl_journal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bad_debt_provisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_insurances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "coverage_type" TEXT NOT NULL,
    "coverage_amount" DECIMAL(15,2) NOT NULL,
    "premium" DECIMAL(15,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "document_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_impairments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "test_date" TIMESTAMP(3) NOT NULL,
    "carrying_amount" DECIMAL(15,2) NOT NULL,
    "recoverable_amount" DECIMAL(15,2) NOT NULL,
    "impairment_loss" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,
    "gl_journal_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_impairments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "budget_amount" DECIMAL(15,2) NOT NULL,
    "actual_spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "expected_completion" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "cost_gl_account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "converted_assets" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_project_costs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capital_project_id" TEXT NOT NULL,
    "cost_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cost_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "vendor_id" TEXT,
    "invoice_id" TEXT,
    "gl_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capital_project_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rolling_forecasts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'FORECAST',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rolling_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "headcount_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "department_id" TEXT,
    "role_name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "planned_hc" INTEGER NOT NULL,
    "loaded_cost_rate" DECIMAL(15,2) NOT NULL,
    "projected_cost" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "headcount_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "account_id" TEXT,
    "period" TEXT,
    "author_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "management_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "customer_id" TEXT,
    "project_id" TEXT,
    "contract_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" TEXT,
    "fixed_amount" DECIMAL(15,2),
    "hourly_rate" DECIMAL(15,4),
    "gl_revenue_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "billing_rule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "amount" DECIMAL(15,2) NOT NULL,
    "completion_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoice_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_modifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "modification_date" TIMESTAMP(3) NOT NULL,
    "mod_type" TEXT NOT NULL,
    "original_value" DECIMAL(15,2) NOT NULL,
    "new_value" DECIMAL(15,2) NOT NULL,
    "cumulative_adjustment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenue_schedule_id" TEXT,
    "gl_journal_id" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deferred_revenue_roll_forwards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "added_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "recognized_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deferred_revenue_roll_forwards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiered_pricing_tables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiered_pricing_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_controls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "control_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "control_type" TEXT NOT NULL,
    "category" TEXT,
    "owner_id" TEXT,
    "test_frequency" TEXT NOT NULL DEFAULT 'QUARTERLY',
    "procedure" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_tests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "control_id" TEXT NOT NULL,
    "test_date" TIMESTAMP(3) NOT NULL,
    "tester_id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "finding_notes" TEXT,
    "remediation_plan" TEXT,
    "remediation_due" TIMESTAMP(3),
    "evidence_urls" JSONB NOT NULL DEFAULT '[]',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sod_conflicts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT,
    "permission_1" TEXT NOT NULL,
    "permission_2" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "mitigation_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sod_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_confirmations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "confirmation_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "response_date" TIMESTAMP(3),
    "balance_as_of" TIMESTAMP(3) NOT NULL,
    "confirmed_amount" DECIMAL(15,2),
    "book_amount" DECIMAL(15,2),
    "difference" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "notes" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "certifier_role" TEXT NOT NULL,
    "certifier_id" TEXT NOT NULL,
    "certifier_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statement" TEXT,
    "ip_address" TEXT,
    "certified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sod_rule_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permission_1" TEXT NOT NULL,
    "permission_2" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sod_rule_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_jurisdictions_tenant_id_idx" ON "tax_jurisdictions"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_jurisdictions_tenant_id_country_idx" ON "tax_jurisdictions"("tenant_id", "country");

-- CreateIndex
CREATE INDEX "tax_exemption_certificates_tenant_id_idx" ON "tax_exemption_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_exemption_certificates_tenant_id_entity_type_entity_id_idx" ON "tax_exemption_certificates"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "tax_exemption_certificates_jurisdiction_id_idx" ON "tax_exemption_certificates"("jurisdiction_id");

-- CreateIndex
CREATE INDEX "tax_reconciliations_tenant_id_idx" ON "tax_reconciliations"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_reconciliations_tenant_id_period_start_period_end_idx" ON "tax_reconciliations"("tenant_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "withholding_certificates_tenant_id_idx" ON "withholding_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "withholding_certificates_tenant_id_vendor_id_idx" ON "withholding_certificates"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "amended_tax_filings_tenant_id_idx" ON "amended_tax_filings"("tenant_id");

-- CreateIndex
CREATE INDEX "amended_tax_filings_original_filing_id_idx" ON "amended_tax_filings"("original_filing_id");

-- CreateIndex
CREATE INDEX "treasury_positions_tenant_id_idx" ON "treasury_positions"("tenant_id");

-- CreateIndex
CREATE INDEX "treasury_positions_tenant_id_position_date_idx" ON "treasury_positions"("tenant_id", "position_date");

-- CreateIndex
CREATE INDEX "hedge_instruments_tenant_id_idx" ON "hedge_instruments"("tenant_id");

-- CreateIndex
CREATE INDEX "hedge_instruments_tenant_id_status_idx" ON "hedge_instruments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "debt_facilities_tenant_id_idx" ON "debt_facilities"("tenant_id");

-- CreateIndex
CREATE INDEX "debt_facilities_tenant_id_status_idx" ON "debt_facilities"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "investment_holdings_tenant_id_idx" ON "investment_holdings"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_statements_tenant_id_idx" ON "vendor_statements"("tenant_id");

-- CreateIndex
CREATE INDEX "vendor_statements_tenant_id_vendor_id_idx" ON "vendor_statements"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "ap_duplicate_flags_tenant_id_idx" ON "ap_duplicate_flags"("tenant_id");

-- CreateIndex
CREATE INDEX "ap_duplicate_flags_invoice_id_idx" ON "ap_duplicate_flags"("invoice_id");

-- CreateIndex
CREATE INDEX "ap_approval_policies_tenant_id_idx" ON "ap_approval_policies"("tenant_id");

-- CreateIndex
CREATE INDEX "grni_records_tenant_id_idx" ON "grni_records"("tenant_id");

-- CreateIndex
CREATE INDEX "grni_records_tenant_id_status_idx" ON "grni_records"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "grni_records_vendor_id_idx" ON "grni_records"("vendor_id");

-- CreateIndex
CREATE INDEX "ar_promises_to_pay_tenant_id_idx" ON "ar_promises_to_pay"("tenant_id");

-- CreateIndex
CREATE INDEX "ar_promises_to_pay_tenant_id_customer_id_idx" ON "ar_promises_to_pay"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "ar_promises_to_pay_invoice_id_idx" ON "ar_promises_to_pay"("invoice_id");

-- CreateIndex
CREATE INDEX "ar_disputes_tenant_id_idx" ON "ar_disputes"("tenant_id");

-- CreateIndex
CREATE INDEX "ar_disputes_tenant_id_customer_id_idx" ON "ar_disputes"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "ar_disputes_invoice_id_idx" ON "ar_disputes"("invoice_id");

-- CreateIndex
CREATE INDEX "bad_debt_provisions_tenant_id_idx" ON "bad_debt_provisions"("tenant_id");

-- CreateIndex
CREATE INDEX "bad_debt_provisions_tenant_id_period_idx" ON "bad_debt_provisions"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "asset_insurances_tenant_id_idx" ON "asset_insurances"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_insurances_asset_id_idx" ON "asset_insurances"("asset_id");

-- CreateIndex
CREATE INDEX "asset_impairments_tenant_id_idx" ON "asset_impairments"("tenant_id");

-- CreateIndex
CREATE INDEX "asset_impairments_asset_id_idx" ON "asset_impairments"("asset_id");

-- CreateIndex
CREATE INDEX "capital_projects_tenant_id_idx" ON "capital_projects"("tenant_id");

-- CreateIndex
CREATE INDEX "capital_project_costs_tenant_id_idx" ON "capital_project_costs"("tenant_id");

-- CreateIndex
CREATE INDEX "capital_project_costs_capital_project_id_idx" ON "capital_project_costs"("capital_project_id");

-- CreateIndex
CREATE INDEX "rolling_forecasts_tenant_id_idx" ON "rolling_forecasts"("tenant_id");

-- CreateIndex
CREATE INDEX "rolling_forecasts_tenant_id_period_idx" ON "rolling_forecasts"("tenant_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "rolling_forecasts_tenant_id_org_id_period_account_id_cost_c_key" ON "rolling_forecasts"("tenant_id", "org_id", "period", "account_id", "cost_center_id", "source");

-- CreateIndex
CREATE INDEX "headcount_plans_tenant_id_idx" ON "headcount_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "headcount_plans_tenant_id_period_idx" ON "headcount_plans"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "budget_comments_tenant_id_idx" ON "budget_comments"("tenant_id");

-- CreateIndex
CREATE INDEX "budget_comments_budget_id_idx" ON "budget_comments"("budget_id");

-- CreateIndex
CREATE INDEX "management_reports_tenant_id_idx" ON "management_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "billing_rules_tenant_id_idx" ON "billing_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "billing_milestones_tenant_id_idx" ON "billing_milestones"("tenant_id");

-- CreateIndex
CREATE INDEX "billing_milestones_billing_rule_id_idx" ON "billing_milestones"("billing_rule_id");

-- CreateIndex
CREATE INDEX "contract_modifications_tenant_id_idx" ON "contract_modifications"("tenant_id");

-- CreateIndex
CREATE INDEX "contract_modifications_contract_id_idx" ON "contract_modifications"("contract_id");

-- CreateIndex
CREATE INDEX "deferred_revenue_roll_forwards_tenant_id_idx" ON "deferred_revenue_roll_forwards"("tenant_id");

-- CreateIndex
CREATE INDEX "deferred_revenue_roll_forwards_tenant_id_period_idx" ON "deferred_revenue_roll_forwards"("tenant_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "deferred_revenue_roll_forwards_tenant_id_org_id_period_key" ON "deferred_revenue_roll_forwards"("tenant_id", "org_id", "period");

-- CreateIndex
CREATE INDEX "tiered_pricing_tables_tenant_id_idx" ON "tiered_pricing_tables"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_controls_tenant_id_idx" ON "financial_controls"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_controls_tenant_id_control_code_key" ON "financial_controls"("tenant_id", "control_code");

-- CreateIndex
CREATE INDEX "control_tests_tenant_id_idx" ON "control_tests"("tenant_id");

-- CreateIndex
CREATE INDEX "control_tests_control_id_idx" ON "control_tests"("control_id");

-- CreateIndex
CREATE INDEX "sod_conflicts_tenant_id_idx" ON "sod_conflicts"("tenant_id");

-- CreateIndex
CREATE INDEX "sod_conflicts_tenant_id_user_id_idx" ON "sod_conflicts"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_confirmations_tenant_id_idx" ON "audit_confirmations"("tenant_id");

-- CreateIndex
CREATE INDEX "period_certifications_tenant_id_idx" ON "period_certifications"("tenant_id");

-- CreateIndex
CREATE INDEX "period_certifications_tenant_id_period_idx" ON "period_certifications"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "sod_rule_definitions_tenant_id_idx" ON "sod_rule_definitions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sod_rule_definitions_tenant_id_permission_1_permission_2_key" ON "sod_rule_definitions"("tenant_id", "permission_1", "permission_2");

-- AddForeignKey
ALTER TABLE "tax_exemption_certificates" ADD CONSTRAINT "tax_exemption_certificates_jurisdiction_id_fkey" FOREIGN KEY ("jurisdiction_id") REFERENCES "tax_jurisdictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_project_costs" ADD CONSTRAINT "capital_project_costs_capital_project_id_fkey" FOREIGN KEY ("capital_project_id") REFERENCES "capital_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_comments" ADD CONSTRAINT "budget_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "budget_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_milestones" ADD CONSTRAINT "billing_milestones_billing_rule_id_fkey" FOREIGN KEY ("billing_rule_id") REFERENCES "billing_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_tests" ADD CONSTRAINT "control_tests_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "financial_controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
