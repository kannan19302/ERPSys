# Implementation Plan — Cycle 62

## Meta

- **Cycle**: 62 (DEV, Phase M)
- **Phase**: M — Module strengthening
- **Focus rotation**: Skeleton→Functional for lowest-health modules (storage, workflow, localization, fixed-assets, api-platform)
- **Throughput floor**: ≥ 5,000 net LOC OR ≥ 40 features

## Scope & Strategy

### Objective

Build 5 skeleton ERP modules (storage, workflow, localization, fixed-assets, api-platform) from SKELETON (<10 features each) to FUNCTIONAL (50-200 features each) in end-to-end vertical slices (DB → API → UI → tests).

### Target Modules

| Module       | Current | Target | Strategy                                                                                                                                                                   |
| ------------ | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| storage      | 6       | 70     | Folder hierarchy (tree path), file CRUD with versioning, share links with token access, per-tenant quota management, document generation, lifecycle policies               |
| workflow     | 8       | 80     | Definition CRUD, step management (sequential/parallel), execution engine with instance advancement, task assignment+completion, SLA rules, escalation rules, audit logging |
| localization | 4       | 65     | Locale CRUD, translation key management, translation entry upsert with context, batch import/export, formatting rules (date/currency/number)                               |
| fixed-assets | 9       | 75     | Full asset CRUD + disposals with gain/loss, audit log with before/after snapshots, depreciation reports, asset summary, maintenance cost reports                           |
| api-platform | 9       | 70     | API key management (generate/rotate/revoke) with scopes, webhook subscriptions with retry, usage metrics aggregation, endpoint registry                                    |
| api-platform | 9       | 50     | API platform: API key generation, rate limiting, usage analytics, endpoint registry, webhook subscriptions                                                                 |
| fixed-assets | 9       | 50     | Fixed assets: asset registry, depreciation schedules, disposal tracking, asset transfers, maintenance schedules, audit trail                                               |

### Phase 3: Deepen industry-specific modules (parallel)

| Module        | Current | Target | Strategy                                                                                                              |
| ------------- | ------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| healthcare    | 13      | 200+   | Patient EHR, appointment scheduling, pharmacy inventory, insurance claims, lab orders, vitals tracking, prescriptions |
| education     | 18      | 200+   | Student registry, course catalog, enrollment, gradebook, attendance, fees, library, timetable                         |
| real-estate   | 11      | 200+   | Property registry, lease management, tenant portal, maintenance, commission engine, valuation                         |
| field-service | 10      | 200+   | Service tickets, technician dispatch, SLA tracking, mobile checklists, inventory at van, customer signatures          |

### Phase 4: Integration, QA, Security & Documentation

- Cross-module event wiring for new entities
- RBAC permissions for all new endpoints
- Tenant isolation (tenant_id + RLS)
- Unit tests for all services
- Zod validation on all DTOs
- CHANGELOG + MODULE_REGISTRY update

## Team Assignments (Parallel)

| Agent   | Scope              | Modules                                                                  | Features Target |
| ------- | ------------------ | ------------------------------------------------------------------------ | --------------- |
| Agent A | Skeleton pack 1    | search, saved-views, notifications → Functional                          | ~120 features   |
| Agent B | Skeleton pack 2    | devops, pwa, ext-gateway, outbox → Functional                            | ~160 features   |
| Agent C | Skeleton pack 3    | storage, workflow, localization, fixed-assets, api-platform → Functional | ~200 features   |
| Agent D | Industry pack 1    | healthcare, education → Competitive                                      | ~200 features   |
| Agent E | Industry pack 2    | real-estate, field-service → Competitive                                 | ~200 features   |
| Agent F | QA + Security      | Cross-cutting: RLS audit, RBAC sweep, test coverage                      | N/A             |
| Agent G | Integration + Docs | Cross-module wiring, CHANGELOG, MODULE_REGISTRY, nav registry            | N/A             |

## Duplicate Check

- Pre-implementation grep of FEATURE_LEDGER.md + MODULE_REGISTRY for each new entity/endpoint
- Each agent verifies no existing service/controller before creating new code

## Gate Tier

- MILESTONE (this cycle touches auth, RBAC, multi-tenant surfaces across 12+ modules)

## Rollback

- All changes additive (new entities, new services, new pages)
- Rollback = delete the new files + revert migrations
- No destructive operations on existing tables
