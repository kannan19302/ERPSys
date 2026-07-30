# Implementation Plan — Stub Finisher + Infrastructure Repair + Land on main

## Two Parts

### Part A — Blocking (do first)

#### A1. Restore docker-entrypoint scripts

`scripts/docker-entrypoint-api.sh` and `scripts/docker-entrypoint-web.sh` were deleted from the working tree after commit `e1a66da5` but never committed. They still exist in HEAD and are well-designed:

- `docker-entrypoint-api.sh`: install deps, generate Prisma, build shared packages, migrate+seed, start only API dev server; writes `.shared-packages-built` marker.
- `docker-entrypoint-web.sh`: poll for `.shared-packages-built` marker, then start only Web dev server.

**Decision: Restore them** (superior split-container design; full combined script exists as fallback in `scripts/docker-entrypoint.sh`).

Command: `git checkout HEAD -- scripts/docker-entrypoint-api.sh scripts/docker-entrypoint-web.sh`

**Verify**: `pnpm docker:up` — confirm docker-compose builds without COPY error.

#### A2. Run scripts + commit dirty .ai/ state

Current dirty `git status`:

```
 M .ai/CHANGELOG.md     (Cycle Ledger row #69 from this morning)
 M .ai/MODULE_REGISTRY.md
 D scripts/docker-entrypoint-api.sh  (will be restored in A1)
 D scripts/docker-entrypoint-web.sh
```

Steps:

1. Restore entrypoints (A1)
2. Run `node scripts/feature-ledger.mjs` — regenerates `.ai/FEATURE_LEDGER.md` with honest post-stub-removal counts (down from ~21,265 to ~13,905)
3. Run `node scripts/module-health.mjs` — regenerates System Progress Dashboard with corrected health scores
4. `git add .ai/ scripts/`
5. `git commit -m "chore(cycle): run feature-ledger + module-health, restore deleted entrypoint scripts"`

#### A3. Merge v1.0 into main

```
git fetch origin main
git merge origin/main --no-ff -m "chore: sync v1.0 into main"
git push origin main
```

No force-push. If merge conflicts, resolve by keeping v1.0's version (it's ahead).

---

### Part B — Replace remaining 2,400 stub endpoints

**Remaining stub controllers** (all follow the `featN` pattern returning `{ success: true, feature: N }`):

| File                                         | Module                   | Stubs     | Lines       |
| -------------------------------------------- | ------------------------ | --------- | ----------- |
| `sales/sales-deep.controller.ts`             | Sales                    | 680       | ~9,000      |
| `procurement/procurement-deep.controller.ts` | Procurement              | 670       | ~8,900      |
| `advanced-hr/hr-deep.controller.ts`          | Advanced HR              | 620       | ~8,200      |
| `crm/crm-deep.controller.ts`                 | CRM                      | 230       | ~3,200      |
| `advanced-finance/ar-ap-deep.controller.ts`  | Advanced Finance (AR/AP) | 200       | ~2,800      |
| **Total**                                    | 5 controllers            | **2,400** | **~32,100** |

**Strategy**: Same approach as cycle e1a66da5 — group stubs by meaningful sub-domain, add real endpoints to existing controllers or create new focused controllers, delete stub file only after last endpoint replaced.

#### B1. Sales — 680 stubs (sales-deep.controller.ts)

**Existing real controllers** (39 files): `sales.controller.ts`, `sales-advanced-pricing.controller.ts`, `sales-analytics.controller.ts`, `sales-commissions.controller.ts`, `sales-contracts.controller.ts`, `sales-cpq.controller.ts`, `sales-customer-success.controller.ts`, `sales-deepening-*.controller.ts` (10 already-real files), `sales-documents-deep.controller.ts`, `sales-enterprise.controller.ts`, `sales-expansion.controller.ts`, `sales-forecasting.controller.ts`, `sales-gamification-deep.controller.ts`, `sales-global-revenue-ops-deep.controller.ts`, `sales-intelligence-signals.controller.ts`, `sales-omnichannel-deals-deep.controller.ts`, `sales-partners.controller.ts`, `sales-playbooks-deep.controller.ts`, `sales-promotions.controller.ts`, `sales-quote-cpq-master-deep.controller.ts`, `sales-returns-deep.controller.ts`, `sales-spiff.controller.ts`, `sales-subscription.controller.ts`, `sales-territory.controller.ts`, `pricing.controller.ts`, `settings.controller.ts`, etc.

**Sub-domains to real-ify** (add real endpoints to existing controllers):

- Sales Embeddings/Context AI → `sales.controller.ts` (Customer/Lead/Opportunity models)
- Sales Partners commissions/SPIFF → `sales-partners.controller.ts`, `sales-spiff.controller.ts`, `sales-commissions.controller.ts`
- Subscription billing → `sales-subscription.controller.ts`
- CPQ (configure-price-quote) → `sales-cpq.controller.ts`, `sales-quote-cpq-master-deep.controller.ts`
- Forecasting + Signals → `sales-forecasting.controller.ts`, `sales-analytics.controller.ts`, `sales-intelligence-signals.controller.ts`
- Territory management → `sales-territory.controller.ts`
- Gamification → `sales-gamification-deep.controller.ts`
- Returns → `sales-returns-deep.controller.ts`
- Contracts → `sales-contracts.controller.ts`
- Customer Success → `sales-customer-success.controller.ts`
- Partner management → `sales-partners.controller.ts`
- Pricing → `pricing.controller.ts`, `sales-advanced-pricing.controller.ts`

**Delete**: `sales-deep.controller.ts` after all 680 endpoints replaced.

#### B2. Procurement — 670 stubs (procurement-deep.controller.ts)

**Existing real controllers** (7 files): `procurement.controller.ts`, `procurement.public.controller.ts`, `procurement-enterprise.controller.ts`, `procurement-expansion.controller.ts`, `procurement-intelligence.controller.ts`, `procurement-scheduling.controller.ts`, `procurement-sourcing.controller.ts`, `contracts.controller.ts`, `settings.controller.ts`

**Sub-domains to real-ify**:

- Global trade/compliance (rulings, HTS) → `procurement-intelligence.controller.ts`
- Strategic sourcing (awards, negotiations) → `procurement-sourcing.controller.ts`
- Supply planning (Io, demand sensing, S&OP) → `procurement-scheduling.controller.ts`
- Control tower analytics (alerts, kpis) → `procurement-intelligence.controller.ts`
- Carrier management (lane rates, booking) → new `procurement-carrier.controller.ts`
- Supplier risk assessment → `procurement-enterprise.controller.ts`
- Vendor Managed Inventory → `procurement-expansion.controller.ts`
- Logistics provider invoices → new procurement-finance sub-service
- Budget integration → `controller.ts`

**Delete**: `procurement-deep.controller.ts` after all 670 endpoints replaced.

#### B3. Advanced HR — 620 stubs (hr-deep.controller.ts in advanced-hr module)

**Existing real controllers** (9 files): `advanced-hr.controller.ts`, `advanced-hr-benefits-admin-deep.controller.ts`, `advanced-hr-compensation-bands-deep.controller.ts`, `advanced-hr-exit-interview-deep.controller.ts`, `advanced-hr-learning-paths-deep.controller.ts`, `advanced-hr-org-chart-deep.controller.ts`, `advanced-hr-succession-planning-deep.controller.ts`, `advanced-hr-workforce-analytics-deep.controller.ts`

**Sub-domains to real-ify**:

- Global payroll deepening → `hr-payroll-deep.controller.ts` (in hr-advanced module)
- Time & attendance → `hr-time-attendance-deep.controller.ts`
- Workforce analytics → `advanced-hr-workforce-analytics-deep.controller.ts`
- Talent acquisition → `hr-talent-acquisition-deep.controller.ts`
- Learning/development → `advanced-hr-learning-paths-deep.controller.ts`
- Performance appraisals → `hr-performance-appraisals-deep.controller.ts`
- Benefits → `advanced-hr-benefits-admin-deep.controller.ts`
- Compensation → `advanced-hr-compensation-bands-deep.controller.ts`
- Employee relations → `hr-employee-relations.controller.ts`
- Org chart & succession → `advanced-hr-org-chart-deep.controller.ts`, `advanced-hr-succession-planning-deep.controller.ts`
- Exit → `advanced-hr-exit-interview-deep.controller.ts`
- HR operations → `hr-operations.controller.ts`
- Compliance → `hr-compliance-safety-deep.controller.ts`

**Delete**: `hr-deep.controller.ts` (in advanced-hr module) after all 620 endpoints replaced.

#### B4. CRM — 230 stubs (crm-deep.controller.ts)

**Existing real controllers** (81 files): `crm.controller.ts`, `crm-*.controller.ts` for every CRM sub-domain (ABM, activities, AI, analytics, cadences, coaching, commissions, communication, competitors, contracts, CPQ, customer experience, customer journey, data management, deal analytics, deal desk, deal room, enrichment, enterprise, expansion, forecasting, gamification, guided selling, incentive, intelligence, knowledge base, lead enrichment, lead routing, lead scoring, mailbox, marketing, partners, pipeline, portal, quotes, renewals, reporting, revenue, routing, sales operations, segments, SLA, support, territory, win/loss, etc.)

**Strategy**: Since 81 real controllers already exist covering every CRM sub-domain, this is primarily deepening existing controllers with more CRUD endpoints. Each group of stubs maps to an existing controller.

**Delete**: `crm-deep.controller.ts` after all 230 endpoints replaced.

#### B5. Advanced Finance (AR/AP) — 200 stubs (ar-ap-deep.controller.ts)

**Existing real controllers** (22 files): `advanced-finance.controller.ts`, `ap-automation.controller.ts`, `budget-deep.controller.ts`, `close-management.controller.ts`, `consolidation-v2.controller.ts`, `e-invoice.controller.ts`, `esg-accounting.controller.ts`, `finance-expansion-deep.controller.ts`, `finance-more-deep.controller.ts`, `finance-tax-journal-deep.controller.ts`, `financial-instruments.controller.ts`, `fixed-asset-deep.controller.ts`, `global-tax-deep.controller.ts`, `netting-deep.controller.ts`, `risk-management.controller.ts`, `subscription-billing.controller.ts`, `tax-provisioning.controller.ts`, `treasury-deep.controller.ts`, `working-capital.controller.ts`, `ai-analytics.controller.ts`, `asc606-deep.controller.ts`

**Sub-domains to real-ify**:

- AR aging/cash apps → add to `advanced-finance.controller.ts`
- Payables automation → `ap-automation.controller.ts`
- Invoice matching (PO match) → `ap-automation.controller.ts`
- Collections → add collections endpoint
- Customer credit → add credit management
- Payment runs → add to payment-batch endpoints
- AR/AP netting → `netting-deep.controller.ts`
- Multi-currency FX → add FX endpoints
- Vendor statement → add statement endpoints
- Bad debt → add provisioning endpoints
- Deductions/disputes → `close-management.controller.ts`

**Delete**: `ar-ap-deep.controller.ts` after all 200 endpoints replaced.

---

## Acceptance Criteria

1. All 5 deep stub files deleted from repo (after their last endpoint is replaced)
2. `pnpm typecheck` — clean on api + web
3. `pnpm architecture:check` — 0 new violations
4. `pnpm migration:discipline` — pass (no manual migration edits)
5. `node scripts/check-schema-lints.mjs` — pass
6. `pnpm test` — all existing + new tests pass
7. Feature ledger reports corrected feature count (no false stub inflation)
8. All new endpoints have Zod DTOs, RBAC permission strings registered in `packages/shared/src/permissions/registry.ts`, and unit tests

## Gate Tier

MILESTONE — touches 5 modules, RBAC-affecting, data-affecting. Full suite:

- `pnpm --filter @unerp/api typecheck`
- `pnpm --filter @unerp/web typecheck`
- `pnpm architecture:check`
- `pnpm foundation:check`
- `pnpm migration:discipline`
- `pnpm test -- --run` (headless unit tests)
- `node scripts/pre-push-gate.mjs`

## Commit Strategy

Each module commits independently so a failure in one does not block others:

1. `feat(sales): replace 680 deep stubs with real endpoints`
2. `feat(procurement): replace 670 deep stubs with real endpoints`
3. `feat(advanced-hr): replace 620 deep stubs with real endpoints`
4. `feat(crm): replace 230 deep stubs with real endpoints`
5. `feat(advanced-finance): replace 200 AR/AP stubs with real endpoints`

## Duplicate Check

Before building each new endpoint, verify it's not already covered by existing real endpoints in the same module. Regenerate `.ai/FEATURE_LEDGER.md` after each module to track true feature count.

## Rollback

If a gate fails on a module commit, revert that single commit and fix before proceeding to the next module.
