-- Float -> Decimal(19,4) for genuine monetary fields.
-- docs/ai/ARCHITECTURE_REVIEW.md § F11 / R11.
--
-- Postgres allows an in-place ALTER COLUMN TYPE from double precision to numeric; the
-- USING clause performs an explicit, checked cast rather than relying on an implicit one.
-- This is a full-table rewrite per column (ACCESS EXCLUSIVE lock) — acceptable here because
-- these are low-traffic, mostly-empty vertical/analytics tables, not the hot OLTP path.
-- Any table later found to be high-traffic should be migrated via the expand/backfill/
-- contract pattern in BACKEND_SCHEMA.md § 9 instead of an in-place ALTER.

-- bank_guarantees
ALTER TABLE "bank_guarantees" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "bank_guarantees" ALTER COLUMN "claimedAmount" TYPE DECIMAL(19,4) USING "claimedAmount"::DECIMAL(19,4);

-- delivery_zones
ALTER TABLE "delivery_zones" ALTER COLUMN "baseRate" TYPE DECIMAL(19,4) USING "baseRate"::DECIMAL(19,4);
ALTER TABLE "delivery_zones" ALTER COLUMN "ratePerKm" TYPE DECIMAL(19,4) USING "ratePerKm"::DECIMAL(19,4);

-- dynamic_discount_requests
ALTER TABLE "dynamic_discount_requests" ALTER COLUMN "originalAmount" TYPE DECIMAL(19,4) USING "originalAmount"::DECIMAL(19,4);
ALTER TABLE "dynamic_discount_requests" ALTER COLUMN "discountAmount" TYPE DECIMAL(19,4) USING "discountAmount"::DECIMAL(19,4);
ALTER TABLE "dynamic_discount_requests" ALTER COLUMN "netAmount" TYPE DECIMAL(19,4) USING "netAmount"::DECIMAL(19,4);

-- evm_baselines
ALTER TABLE "evm_baselines" ALTER COLUMN "budgetAtCompletion" TYPE DECIMAL(19,4) USING "budgetAtCompletion"::DECIMAL(19,4);

-- evm_measurements
ALTER TABLE "evm_measurements" ALTER COLUMN "plannedValue" TYPE DECIMAL(19,4) USING "plannedValue"::DECIMAL(19,4);
ALTER TABLE "evm_measurements" ALTER COLUMN "earnedValue" TYPE DECIMAL(19,4) USING "earnedValue"::DECIMAL(19,4);
ALTER TABLE "evm_measurements" ALTER COLUMN "actualCost" TYPE DECIMAL(19,4) USING "actualCost"::DECIMAL(19,4);
ALTER TABLE "evm_measurements" ALTER COLUMN "costVariance" TYPE DECIMAL(19,4) USING "costVariance"::DECIMAL(19,4);

-- export_licenses
ALTER TABLE "export_licenses" ALTER COLUMN "approved_value" TYPE DECIMAL(19,4) USING "approved_value"::DECIMAL(19,4);
ALTER TABLE "export_licenses" ALTER COLUMN "used_value" TYPE DECIMAL(19,4) USING "used_value"::DECIMAL(19,4);

-- job_cost_sheets
ALTER TABLE "job_cost_sheets" ALTER COLUMN "plannedMaterialCost" TYPE DECIMAL(19,4) USING "plannedMaterialCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "plannedLaborCost" TYPE DECIMAL(19,4) USING "plannedLaborCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "plannedOverheadCost" TYPE DECIMAL(19,4) USING "plannedOverheadCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "actualMaterialCost" TYPE DECIMAL(19,4) USING "actualMaterialCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "actualLaborCost" TYPE DECIMAL(19,4) USING "actualLaborCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "actualOverheadCost" TYPE DECIMAL(19,4) USING "actualOverheadCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "scrapCost" TYPE DECIMAL(19,4) USING "scrapCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "reworkCost" TYPE DECIMAL(19,4) USING "reworkCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "totalPlannedCost" TYPE DECIMAL(19,4) USING "totalPlannedCost"::DECIMAL(19,4);
ALTER TABLE "job_cost_sheets" ALTER COLUMN "totalActualCost" TYPE DECIMAL(19,4) USING "totalActualCost"::DECIMAL(19,4);

-- lc_presentations
ALTER TABLE "lc_presentations" ALTER COLUMN "documentaryCredit" TYPE DECIMAL(19,4) USING "documentaryCredit"::DECIMAL(19,4);
ALTER TABLE "lc_presentations" ALTER COLUMN "paymentAmount" TYPE DECIMAL(19,4) USING "paymentAmount"::DECIMAL(19,4);

-- letters_of_credit
ALTER TABLE "letters_of_credit" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);

-- logistics_provider_invoices
ALTER TABLE "logistics_provider_invoices" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);

-- logistics_providers
ALTER TABLE "logistics_providers" ALTER COLUMN "contractValue" TYPE DECIMAL(19,4) USING "contractValue"::DECIMAL(19,4);

-- machine_maintenance_logs
ALTER TABLE "machine_maintenance_logs" ALTER COLUMN "cost" TYPE DECIMAL(19,4) USING "cost"::DECIMAL(19,4);

-- manufacturing_machines
ALTER TABLE "manufacturing_machines" ALTER COLUMN "assetValue" TYPE DECIMAL(19,4) USING "assetValue"::DECIMAL(19,4);

-- marketplace_packages
ALTER TABLE "marketplace_packages" ALTER COLUMN "price" TYPE DECIMAL(19,4) USING "price"::DECIMAL(19,4);

-- mfg_cost_entries
ALTER TABLE "mfg_cost_entries" ALTER COLUMN "unitCost" TYPE DECIMAL(19,4) USING "unitCost"::DECIMAL(19,4);
ALTER TABLE "mfg_cost_entries" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);

-- mfg_maintenance_work_orders
ALTER TABLE "mfg_maintenance_work_orders" ALTER COLUMN "cost" TYPE DECIMAL(19,4) USING "cost"::DECIMAL(19,4);

-- multimodal_transport_legs
ALTER TABLE "multimodal_transport_legs" ALTER COLUMN "cost" TYPE DECIMAL(19,4) USING "cost"::DECIMAL(19,4);

-- multimodal_transport_orders
ALTER TABLE "multimodal_transport_orders" ALTER COLUMN "cost" TYPE DECIMAL(19,4) USING "cost"::DECIMAL(19,4);

-- ppm_change_requests
ALTER TABLE "ppm_change_requests" ALTER COLUMN "costImpact" TYPE DECIMAL(19,4) USING "costImpact"::DECIMAL(19,4);

-- ppm_portfolios
ALTER TABLE "ppm_portfolios" ALTER COLUMN "budget" TYPE DECIMAL(19,4) USING "budget"::DECIMAL(19,4);

-- ppm_procurement_plans
ALTER TABLE "ppm_procurement_plans" ALTER COLUMN "totalBudget" TYPE DECIMAL(19,4) USING "totalBudget"::DECIMAL(19,4);

-- ppm_procurement_requisitions
ALTER TABLE "ppm_procurement_requisitions" ALTER COLUMN "estimatedCost" TYPE DECIMAL(19,4) USING "estimatedCost"::DECIMAL(19,4);

-- project_benefits
ALTER TABLE "project_benefits" ALTER COLUMN "baselineValue" TYPE DECIMAL(19,4) USING "baselineValue"::DECIMAL(19,4);
ALTER TABLE "project_benefits" ALTER COLUMN "targetValue" TYPE DECIMAL(19,4) USING "targetValue"::DECIMAL(19,4);
ALTER TABLE "project_benefits" ALTER COLUMN "actualValue" TYPE DECIMAL(19,4) USING "actualValue"::DECIMAL(19,4);

-- project_subcontractors
ALTER TABLE "project_subcontractors" ALTER COLUMN "contractValue" TYPE DECIMAL(19,4) USING "contractValue"::DECIMAL(19,4);

-- project_templates
ALTER TABLE "project_templates" ALTER COLUMN "budget" TYPE DECIMAL(19,4) USING "budget"::DECIMAL(19,4);

-- reverse_logistics_items
ALTER TABLE "reverse_logistics_items" ALTER COLUMN "unitCost" TYPE DECIMAL(19,4) USING "unitCost"::DECIMAL(19,4);
ALTER TABLE "reverse_logistics_items" ALTER COLUMN "refurbishmentCost" TYPE DECIMAL(19,4) USING "refurbishmentCost"::DECIMAL(19,4);

-- reverse_logistics_orders
ALTER TABLE "reverse_logistics_orders" ALTER COLUMN "creditAmount" TYPE DECIMAL(19,4) USING "creditAmount"::DECIMAL(19,4);

-- scm_financing_drawdowns
ALTER TABLE "scm_financing_drawdowns" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);
ALTER TABLE "scm_financing_drawdowns" ALTER COLUMN "interest" TYPE DECIMAL(19,4) USING "interest"::DECIMAL(19,4);

-- scm_financing_facilities
ALTER TABLE "scm_financing_facilities" ALTER COLUMN "creditLimit" TYPE DECIMAL(19,4) USING "creditLimit"::DECIMAL(19,4);
ALTER TABLE "scm_financing_facilities" ALTER COLUMN "availableLimit" TYPE DECIMAL(19,4) USING "availableLimit"::DECIMAL(19,4);

-- scm_iot_readings
ALTER TABLE "scm_iot_readings" ALTER COLUMN "value" TYPE DECIMAL(19,4) USING "value"::DECIMAL(19,4);

-- scm_risk_mitigations
ALTER TABLE "scm_risk_mitigations" ALTER COLUMN "cost" TYPE DECIMAL(19,4) USING "cost"::DECIMAL(19,4);

-- six_sigma_projects
ALTER TABLE "six_sigma_projects" ALTER COLUMN "expectedBenefit" TYPE DECIMAL(19,4) USING "expectedBenefit"::DECIMAL(19,4);
ALTER TABLE "six_sigma_projects" ALTER COLUMN "actualBenefit" TYPE DECIMAL(19,4) USING "actualBenefit"::DECIMAL(19,4);

-- sop_consensus_plans
ALTER TABLE "sop_consensus_plans" ALTER COLUMN "revenuePlan" TYPE DECIMAL(19,4) USING "revenuePlan"::DECIMAL(19,4);
ALTER TABLE "sop_consensus_plans" ALTER COLUMN "marginPlan" TYPE DECIMAL(19,4) USING "marginPlan"::DECIMAL(19,4);

-- sop_demand_plans
ALTER TABLE "sop_demand_plans" ALTER COLUMN "forecastValue" TYPE DECIMAL(19,4) USING "forecastValue"::DECIMAL(19,4);

-- sop_supply_plans
ALTER TABLE "sop_supply_plans" ALTER COLUMN "inventoryTarget" TYPE DECIMAL(19,4) USING "inventoryTarget"::DECIMAL(19,4);

-- spare_parts
ALTER TABLE "spare_parts" ALTER COLUMN "unitCost" TYPE DECIMAL(19,4) USING "unitCost"::DECIMAL(19,4);

-- standard_costs
ALTER TABLE "standard_costs" ALTER COLUMN "materialCost" TYPE DECIMAL(19,4) USING "materialCost"::DECIMAL(19,4);
ALTER TABLE "standard_costs" ALTER COLUMN "laborCost" TYPE DECIMAL(19,4) USING "laborCost"::DECIMAL(19,4);
ALTER TABLE "standard_costs" ALTER COLUMN "overheadCost" TYPE DECIMAL(19,4) USING "overheadCost"::DECIMAL(19,4);
ALTER TABLE "standard_costs" ALTER COLUMN "totalCost" TYPE DECIMAL(19,4) USING "totalCost"::DECIMAL(19,4);

-- subcontractor_payment_milestones
ALTER TABLE "subcontractor_payment_milestones" ALTER COLUMN "amount" TYPE DECIMAL(19,4) USING "amount"::DECIMAL(19,4);

-- supplier_development_plans
ALTER TABLE "supplier_development_plans" ALTER COLUMN "budget" TYPE DECIMAL(19,4) USING "budget"::DECIMAL(19,4);

-- warehouse_network_designs
ALTER TABLE "warehouse_network_designs" ALTER COLUMN "totalCost" TYPE DECIMAL(19,4) USING "totalCost"::DECIMAL(19,4);
ALTER TABLE "warehouse_network_designs" ALTER COLUMN "transportCost" TYPE DECIMAL(19,4) USING "transportCost"::DECIMAL(19,4);
ALTER TABLE "warehouse_network_designs" ALTER COLUMN "storageCost" TYPE DECIMAL(19,4) USING "storageCost"::DECIMAL(19,4);
ALTER TABLE "warehouse_network_designs" ALTER COLUMN "handlingCost" TYPE DECIMAL(19,4) USING "handlingCost"::DECIMAL(19,4);

-- warehouse_network_nodes
ALTER TABLE "warehouse_network_nodes" ALTER COLUMN "fixedCost" TYPE DECIMAL(19,4) USING "fixedCost"::DECIMAL(19,4);
ALTER TABLE "warehouse_network_nodes" ALTER COLUMN "variableCost" TYPE DECIMAL(19,4) USING "variableCost"::DECIMAL(19,4);

-- web_orders
ALTER TABLE "web_orders" ALTER COLUMN "subtotal" TYPE DECIMAL(19,4) USING "subtotal"::DECIMAL(19,4);
ALTER TABLE "web_orders" ALTER COLUMN "total" TYPE DECIMAL(19,4) USING "total"::DECIMAL(19,4);

