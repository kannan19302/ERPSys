# Implementation Plan — Phase M: Stub-to-Real Migration & Deepening

## Cycle Info

- **Cycle**: Phase M, large horizontal batch
- **Phase**: M (Module Strengthening — foundation SEALED v1.0 on 2026-07-18)
- **Target**: ≥ 70,000 net LOC
- **Strategy**: Replace 6,410 stub endpoints + 950 HR GET-only stubs with real vertical slices following AUTOPILOT § Horizontal build order

## Scope & Why

Five `*-deep-suite.controller.ts` files and three `hr-deep-expansion*` controllers are 100% stubs — they return `{success, module, featureId, subDomain}` with zero Prisma, zero business logic, zero DTOs, zero tests, zero UI. They inflate feature counts by ~7,360 fake endpoints across 104k lines, violate AUTOPILOT § File-size discipline (each stub is 17k-21k lines), and mask the modules' real feature depth.

The Prisma schema already has 1,757 models including comprehensive coverage for all 5 modules (Manufacturing: 41 models, Projects: 88, Supply Chain: 59, Communication: 84, Builder: 161) plus HR. Each module ALSO has real controllers (Manufacturing: 154 real endpoints, Supply Chain: 343, Projects: 153, Communication: 255, Builder: 318) — the stubs are padding on top.

**Strategy**: Per AUTOPILOT § Phase M focus order (Supply Chain → Manufacturing → Projects → Communication → Builder), work each module horizontally:

1. Deepen each subDomain stub group into a real service + controller + Prisma queries
2. Add Zod-validated DTOs, proper RBAC permissions, Swagger docs
3. Add Vitest unit tests for each new service
4. Add UI pages using ModuleTabLayout/SubTabBar
5. Remove the stub file only after its last replacement ships

## Module-by-Module Plan (Focus Order)

### 1. Supply Chain (5th in Phase M focus)

**Stub**: `supply-chain-deep-suite.controller.ts` — 18,182 lines, 1,210 stub endpoints
**Real endpoints today**: 343
**SubDomains to replace** (grouped by the 30 existing real controller patterns):

- Demand Sensing & AI Forecasting → deepen `demand-planning.controller.ts`/service
- Multi-Echelon Inventory Optimization → deepen `meio.controller.ts`/service
- Digital Twin & Control Tower → deepen `digital-twin.controller.ts`/service
- Fleet Telematics → deepen `fleet-management.controller.ts`/service
- Supplier Portal → deepen `supplier-portal.controller.ts`/service
- Supply Chain Finance → deepen `supply-chain-finance.controller.ts`/service
- Sustainability/Carbon → deepen `sustainability.controller.ts`/service
- Freight/Rate Audit → deepen `freight-management`/`carrier-contract`
- Customs/Global Trade → deepen `customs-document`/`global-trade`
- Cross-Dock/Cold Chain → deepen `cross-dock.controller.ts`/service
- Route Optimization → deepen `route-optimization.controller.ts`/service
- Supplier performance/quality/risk → deepen existing controllers
- Supply Planning/Budget → deepen existing controllers
- Analytics/Advanced Analytics → deepen existing controllers
- Container Tracking → deepen existing controller

**Delivery**: 25+ new service methods with full CRUD across existing controllers, 150+ new real endpoints. Prisma schema models already exist.

### 2. Manufacturing (6th in Phase M focus)

**Stub**: `manufacturing-deep-suite.controller.ts` — 19,951 lines, 1,365 stub endpoints
**Real endpoints today**: 154
**SubDomains to replace** (using 41 existing models):

- MPS/MRP II → deepen `manufacturing.controller.ts` (BOM/WorkOrder already real)
- APS/Capacity Scheduling → deepen `scheduling.controller.ts`
- SPC Charts/Quality → deepen `manufacturing-advanced-quality.controller.ts`
- FMEA/APQP/PPAP → create new SPC-quality sub-services
- TPM/OEE → deepen `manufacturing-tpm.controller.ts`
- Lean/Kanban → deepen `manufacturing-lean.controller.ts`
- DDMRP → deepen `manufacturing-ddmrp.controller.ts`
- Energy Monitoring → deepen `manufacturing-energy.controller.ts`
- Tooling → deepen `manufacturing-tooling.controller.ts`
- Contract Manufacturing → deepen `manufacturing-contract-mfg.controller.ts`
- Enterprise ERP integration → use `manufacturing-enterprise` module

**Delivery**: 150+ new real endpoints across existing controllers. Schema models exist.

### 3. Projects (7th in Phase M focus)

**Stub**: `projects-deep-suite.controller.ts` — 20,087 lines, 1,365 stub endpoints
**Real endpoints today**: 153
**SubDomains to replace** (using 88 existing models):

- WBS/Gantt → add to `projects.controller.ts`
- EVM → deepen `advanced-evm.controller.ts`
- PPM/PMO → deepen `pmo.controller.ts`
- Agile/Scrum → deepen `agile.controller.ts`
- Resource Skills → deepen `resource-skills.controller.ts`
- CAPEX → deepen `capex.controller.ts`
- Claims/Variations → deepen `claims.controller.ts`
- Collaboration → deepen `collaboration.controller.ts`
- Program Management → deepen `program-management.controller.ts`
- Timesheets → add to existing project scheduling

**Delivery**: 150+ new real endpoints. Schema models exist.

### 4. Communication (8th in Phase M focus)

**Stub**: `communication-deep-suite.controller.ts` — 18,491 lines, 1,265 stub endpoints
**Real endpoints today**: 255
**SubDomains to replace** (using 84 existing models):

- Omnichannel Email → deepen `omnichannel.controller.ts`
- Video Conferencing → deepen `video-deep.controller.ts`
- VoIP/SIP → deepen `voip.controller.ts`
- Knowledge Base → deepen `knowledge-base.controller.ts`
- Real-Time Chat → deepen `real-time-collab.controller.ts`
- Helpdesk → deepen `helpdesk.controller.ts`
- Enterprise Search → deepen `search.controller.ts`
- Surveys → deepen `survey.controller.ts`
- Notifications/Push → add to `communication.controller.ts`
- Chatbots/AI → add to `communication-bots.service.ts`

**Delivery**: 150+ new real endpoints. Schema models exist.

### 5. Builder Studio (9th in Phase M focus)

**Stub**: `builder-deep-suite.controller.ts` — 17,615 lines, 1,205 stub endpoints
**Real endpoints today**: 318
**SubDomains to replace** (using 161 existing models):

- Custom Data Models → deepen existing builder services
- BPMN Engine → deepen `bpmn.controller.ts`
- Rules Engine → deepen `rules-engine.controller.ts`
- API Builder → deepen `api-builder.controller.ts`
- ETL Pipelines → deepen `etl.controller.ts`
- Document Templates → add to `builder-forms.service.ts`
- Form Builder → deepen `advanced-forms.controller.ts`
- Mobile Studio → deepen `mobile-builder.controller.ts`
- Theme Manager → deepen `theme-manager.controller.ts`
- A/B Testing → deepen `ab-testing.controller.ts`

**Delivery**: 150+ new real endpoints. Schema models exist.

### 6. HR-Advanced Audit

**Stub files**: `hr-deep-expansion.controller.ts` (313L, 100 GET stubs), `hr-deep-expansion-bulk.controller.ts` (2,263L, 750 GET stubs), `hr-deep-expansion-mega.controller.ts` (313L, 100 GET stubs)

- **Total**: 950 GET-only stubs, 2,889 lines
- **Real HR endpoints**: 117 in main controller, plus dozens across 9 deep controllers
- **Plan**: Verify each stub endpoint maps to an existing deep service (benefits, payroll, workforce, talent, etc.). If already covered, remove stub; if not, add real methods to existing services. Remove all 3 stub files.

## Acceptance Criteria

1. All 5 deep-suite stub files deleted from repo (after replacement ships)
2. HR 3 stub expansion files deleted or replaced
3. No Zod `z.any()` in new DTO code
4. Every new endpoint has permission string registered in shared permission set
5. Every new service has a `.spec.ts` test (happy path + tenant isolation + RBAC denial)
6. `pnpm typecheck` clean across api and web
7. `pnpm architecture:check` passes (no cross-module imports)
8. Feature ledger shows CORRECTED count (stubs removed = count goes down, then real features added)

## Gate Tier

**MILESTONE** — touches 6 modules, data-affecting, RBAC-affecting, multi-controller refactor. Full suite:

- `pnpm --filter @unerp/api typecheck`
- `pnpm --filter @unerp/web typecheck`
- `pnpm architecture:check`
- `pnpm foundation:check`
- Vitest for touched modules
- `node scripts/pre-push-gate.mjs`

## Rollback

If any gate fails, revert the failing module's commit and fix. Each module commits independently so a failure in one does not block others.

## Duplicate Check

The `.ai/FEATURE_LEDGER.md` will be regenerated at Record step. The stubs register as individual features; removing them corrects the count. Before building any new endpoint, verify it's not already covered by the existing real controllers.

## Throughput Floor

Target: ≥ 70,000 net LOC. Split across 6 modules with ~12k-15k LOC of real code per module (services + controllers + DTOs + tests + UI pages). This exceeds the 5k floor handily.
