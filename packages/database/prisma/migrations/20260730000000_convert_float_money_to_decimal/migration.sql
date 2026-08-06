-- Float -> Decimal(19,4) for genuine monetary fields.
-- docs/ai/ARCHITECTURE_REVIEW.md § F11 / R11.
--
-- Each statement is guarded on the table and column existing AND still being a
-- floating-point type. Reasons, in order:
--
--   1. Only a subset of these models has ever been migrated into a database.
--      41 of the 42 tables below did not exist when this first ran, so the
--      unguarded version aborted the whole deploy on the first missing table.
--   2. For a model with no table yet, there is nothing to convert: its eventual
--      CREATE TABLE is generated from the current schema, which already
--      declares Decimal(19,4).
--   3. The type predicate makes the file safe to replay where it already
--      applied, so environments that ran the original converge rather than
--      diverge.
--
-- Postgres allows an in-place ALTER COLUMN TYPE from double precision to
-- numeric; the USING clause performs an explicit, checked cast. This is a full
-- table rewrite per column (ACCESS EXCLUSIVE). Acceptable on these low-traffic
-- vertical/analytics tables; a high-traffic table must instead use the
-- expand/backfill/contract pattern in BACKEND_SCHEMA.md § 9.

DO $$
DECLARE
  t text;
  c text;
BEGIN
  FOR t, c IN
    SELECT * FROM (VALUES
      ('bank_guarantees', 'amount'),
      ('bank_guarantees', 'claimedAmount'),
      ('delivery_zones', 'baseRate'),
      ('delivery_zones', 'ratePerKm'),
      ('dynamic_discount_requests', 'originalAmount'),
      ('dynamic_discount_requests', 'discountAmount'),
      ('dynamic_discount_requests', 'netAmount'),
      ('evm_baselines', 'budgetAtCompletion'),
      ('evm_measurements', 'plannedValue'),
      ('evm_measurements', 'earnedValue'),
      ('evm_measurements', 'actualCost'),
      ('evm_measurements', 'costVariance'),
      ('export_licenses', 'approved_value'),
      ('export_licenses', 'used_value'),
      ('job_cost_sheets', 'plannedMaterialCost'),
      ('job_cost_sheets', 'plannedLaborCost'),
      ('job_cost_sheets', 'plannedOverheadCost'),
      ('job_cost_sheets', 'actualMaterialCost'),
      ('job_cost_sheets', 'actualLaborCost'),
      ('job_cost_sheets', 'actualOverheadCost'),
      ('job_cost_sheets', 'scrapCost'),
      ('job_cost_sheets', 'reworkCost'),
      ('job_cost_sheets', 'totalPlannedCost'),
      ('job_cost_sheets', 'totalActualCost'),
      ('lc_presentations', 'documentaryCredit'),
      ('lc_presentations', 'paymentAmount'),
      ('letters_of_credit', 'amount'),
      ('logistics_provider_invoices', 'amount'),
      ('logistics_providers', 'contractValue'),
      ('machine_maintenance_logs', 'cost'),
      ('manufacturing_machines', 'assetValue'),
      ('marketplace_packages', 'price'),
      ('mfg_cost_entries', 'unitCost'),
      ('mfg_cost_entries', 'amount'),
      ('mfg_maintenance_work_orders', 'cost'),
      ('multimodal_transport_legs', 'cost'),
      ('multimodal_transport_orders', 'cost'),
      ('ppm_change_requests', 'costImpact'),
      ('ppm_portfolios', 'budget'),
      ('ppm_procurement_plans', 'totalBudget'),
      ('ppm_procurement_requisitions', 'estimatedCost'),
      ('project_benefits', 'baselineValue'),
      ('project_benefits', 'targetValue'),
      ('project_benefits', 'actualValue'),
      ('project_subcontractors', 'contractValue'),
      ('project_templates', 'budget'),
      ('reverse_logistics_items', 'unitCost'),
      ('reverse_logistics_items', 'refurbishmentCost'),
      ('reverse_logistics_orders', 'creditAmount'),
      ('scm_financing_drawdowns', 'amount'),
      ('scm_financing_drawdowns', 'interest'),
      ('scm_financing_facilities', 'creditLimit'),
      ('scm_financing_facilities', 'availableLimit'),
      ('scm_iot_readings', 'value'),
      ('scm_risk_mitigations', 'cost'),
      ('six_sigma_projects', 'expectedBenefit'),
      ('six_sigma_projects', 'actualBenefit'),
      ('sop_consensus_plans', 'revenuePlan'),
      ('sop_consensus_plans', 'marginPlan'),
      ('sop_demand_plans', 'forecastValue'),
      ('sop_supply_plans', 'inventoryTarget'),
      ('spare_parts', 'unitCost'),
      ('standard_costs', 'materialCost'),
      ('standard_costs', 'laborCost'),
      ('standard_costs', 'overheadCost'),
      ('standard_costs', 'totalCost'),
      ('subcontractor_payment_milestones', 'amount'),
      ('supplier_development_plans', 'budget'),
      ('warehouse_network_designs', 'totalCost'),
      ('warehouse_network_designs', 'transportCost'),
      ('warehouse_network_designs', 'storageCost'),
      ('warehouse_network_designs', 'handlingCost'),
      ('warehouse_network_nodes', 'fixedCost'),
      ('warehouse_network_nodes', 'variableCost'),
      ('web_orders', 'subtotal'),
      ('web_orders', 'total')
    ) AS pairs(tbl, col)
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = t
           AND column_name = c
           AND data_type IN ('double precision', 'real')
       )
    THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN %I TYPE DECIMAL(19,4) USING %I::DECIMAL(19,4)',
        t, c, c
      );
      RAISE NOTICE 'converted %.% to DECIMAL(19,4)', t, c;
    END IF;
  END LOOP;
END $$;
