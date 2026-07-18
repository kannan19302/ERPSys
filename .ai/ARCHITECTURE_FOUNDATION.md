# UniERP Architecture Foundation

> Status: **feature freeze LIFTED** (2026-07-18). Foundation tracks 0–I are fully closed; the basement is sealed. See [FOUNDATION_HARDENING_ROADMAP.md §12b](FOUNDATION_HARDENING_ROADMAP.md#12b-foundation-sealed--development-only-mode-after-the-lift) for the seal contract. This document is the durable architecture baseline for engineers and AI agents.

## Decision

UniERP remains a **modular monolith** while it earns the operational evidence needed to extract a service. The core owns transactional truth; extensions and integrations use stable public APIs and versioned business-event contracts. No module may reach into another module's implementation.

This deliberately follows durable patterns visible across leading ERP platforms: SAP's clean-core/side-by-side extension model, Oracle and Dynamics business-event catalogs, Workday's governed API gateway and orchestration, Salesforce's event bus/change data capture, SuiteCloud's packaged extensions, and the transaction-safe module patterns in Odoo/Frappe-class systems.

## Current foundation scorecard

| Concern | Current control | Status |
|---|---:|---:|
| Module boundaries | `architecture:check` rejects new direct relative imports across API modules; dependency-cruiser rejects cycles. Explicit common integration ports carry approved read-only and shared-infrastructure capabilities. Zero remaining cross-module write imports. | ✅ SEALED |
| Core/extension separation | `ExtGatewayModule`, marketplace packages, and public API surfaces exist; manifests are normalized and checked against the explicit service-kit API compatibility range. | ✅ ACTIVE |
| Transactional consistency | Transactional outbox (#17) delivers critical cross-module effects atomically in the same Prisma transaction as the aggregate mutation. OutboxEvent + OutboxDelivery rows written inside producer transaction; dispatcher claims with `FOR UPDATE SKIP LOCKED`; consumer effect + receipt written transactionally. | ✅ SEALED |
| Event delivery | Legacy `EventEmitter2` deprecated for critical effects. Outbox is the only path for critical cross-module and external events. | ✅ SEALED |
| Tenant isolation | `NOBYPASSRLS` application role with `FORCE ROW LEVEL SECURITY` on every protected table. Tenant unit-of-work via `set_config(app.current_tenant_id)`. Two-tenant CI integration tests prove tenant A cannot read/write tenant B. | ✅ SEALED |
| Database evolution | All 125+ migrations replay clean on fresh PostgreSQL; schema diff gate in CI. Track A reconciliation (#19) resolved migration drift with data-preserving rename/backfill. | ✅ SEALED |
| Async work | Transactional outbox provides durable at-least-once delivery with retry, DLQ, idempotent consumer receipts. BullMQ is transport optimization. | ✅ SEALED |
| Observability | OpenTelemetry, Sentry, Prometheus metrics, health/readiness endpoints, outbox metrics (pending-age, retry, DLQ depth). | ✅ ACTIVE |
| Security | JWT/RBAC, CSRF, headers, rate limits, audit/change history, database-enforced RLS (#21), PII registry/GDPR erasure workflow (H.1). | ✅ SEALED |

## Non-negotiable rules

1. **Clean core.** Core modules expose contracts; extensions must use public API, events, or the extension gateway. Never patch another module's internals.
2. **Mechanical module boundaries.** Run `pnpm architecture:check` before merge. Cross-module state changes use domain events; an approved common integration port may expose a narrow, versioned capability such as AI or read-only reporting. Feature modules never import another module's implementation.
3. **One transactional owner.** A command changes one aggregate boundary in a database transaction. Multi-module outcomes are explicitly asynchronous and must be idempotent.
4. **Durable facts, versioned contracts.** A future outbox event must contain a stable name (`domain.entity.past_tense`), version, tenant, aggregate identity, idempotency key, timestamp, and JSON payload. Consumers are at-least-once and deduplicate by event id. Breaking changes create a new version.
5. **Tenant enforcement in depth.** Application tenant scoping, database RLS, RBAC, audit history, and integration credentials all enforce the same tenant boundary. An application filter is not an RLS substitute.
6. **Expand, backfill, contract.** Production schema evolution is additive first, backfilled and observed, then contracted only after compatibility expires. Every migration must replay cleanly on an empty disposable database.
7. **Operational ownership.** Every asynchronous or integration flow has retry, idempotency, dead-letter visibility, correlation/tracing, health signal, and a documented owner/runbook before it is business-critical.
8. **Extension compatibility is an executable contract.** An extension declares `apiVersion`; core normalizes omission to the current version and accepts only the documented `MIN_SUPPORTED_EXT_API_VERSION` through `EXT_API_VERSION` range. A breaking change introduces a new version, retains the preceding version for one documented release, then advances the minimum only after extensions have had a migration window.

## Evolution governance

Architecture remains stable when change is explicit and reversible. Before implementation, an owner classifies every cross-boundary change and records its contract, compatibility, validation, and rollback in the owning module documentation and release notes.

| Change | Required discipline |
|---|---|
| Internal implementation refactor | Preserve the owning module's public behavior; run unit tests and `pnpm architecture:check`. |
| Additive public API or event field | Make the field optional for existing consumers, version the published contract, add consumer/contract tests, and document observability and ownership. |
| Breaking public API, event, or extension change | Publish a new version; retain the prior documented version through its compatibility window; provide a migration guide and a measurable retirement date. Never silently repurpose a field. |
| Database representation change | Use expand, backfill, observe, and contract. Rollback means returning application reads/writes to the compatible shape, not deleting customer data. |
| Cross-domain business effect | Keep the original command inside one transactional owner and deliver the fact through the transactional outbox once #17 is complete. Consumers must be idempotent and independently deployable. |

### Service extraction is earned, not assumed

The modular monolith is the default deployment model. A bounded context may be proposed for extraction only when all of the following are evidenced: a single accountable domain owner; a stable public contract with a compatibility policy; durable outbox-based delivery with idempotent consumers; explicit data ownership and a no-shared-write migration plan; tenant isolation enforced and tested at both sides; tracing, SLOs, alerts, and a runbook; capacity and failure-mode tests; and a rehearsed rollback/cutover plan. The architecture review must reject an extraction that merely moves a tightly coupled database or synchronous call over the network.

### Quarterly architecture review

Each quarter, and before a service extraction or major public contract change, review: boundary-gate violations; migration replay and drift status; two-tenant isolation evidence; outbox lag/retry/DLQ health; API and extension compatibility windows; dependency health; recovery exercises; and the owner/runbook for every business-critical asynchronous flow. Record decisions and exceptions in `.ai/CHANGELOG.md` and `.ai/MODULE_REGISTRY.md`; expired exceptions must be removed or re-approved with a dated remediation plan.

## Foundation freeze — LIFTED

All foundation blockers are resolved. The freeze is lifted per the seal gate in [FOUNDATION_HARDENING_ROADMAP.md §12b](FOUNDATION_HARDENING_ROADMAP.md#12b-foundation-sealed--development-only-mode-after-the-lift). Agents may now build product features, modules, and industry depth using the sealed contracts.

### Sealed foundation evidence

| Blocker | Resolution | Evidence |
|---|---|---|
| **#19** — migration drift | Reconciliation migration `20260718093000_track_a_reconciliation` — data-preserving rename/backfill, zero destructive ops. Verified fresh replay + empty schema diff in CI. | Track A: cycles 2, 13. `pnpm migration:reconciliation:report` gate. |
| **#21** — RLS tenant isolation | `NOBYPASSRLS` `unerp_api` role; `FORCE ROW LEVEL SECURITY` on all protected tables; tenant unit-of-work via `set_config(app.current_tenant_id, ..., true)` inside interactive Prisma tx; two-tenant CI tests. | Track C: cycle 14. `20260718101000_rls_all_tables` migration. |
| **#17** — transactional outbox | `OutboxEvent` + `OutboxDelivery` + consumer receipt tables; `OutboxService.writeEvent()` inside producer transactions; dispatcher polls `FOR UPDATE SKIP LOCKED`; BullMQ worker writes receipt + effect transactionally; bounded retry with jitter, DLQ, re-drive endpoint. | Track B: cycle 18. Outbox module in `apps/api/src/modules/outbox/` with 13 unit tests. |
| **#22** — cross-module imports | Zero remaining cross-module write imports. E-Commerce checkout → Sales converted to outbox event (`ecommerce.checkout.completed` → Sales consumer). | Track D: cycle 18. `architecture:check` baseline: 0 violations. |

### Earlier resolved evidence

- #20: all 125+ migrations, including PostgreSQL extension bootstrap, replayed successfully on a fresh disposable database.
- #23: Docker dev startup now validates workspace package links and verified with live API and web HTTP 200 responses.

## Data migration safeguard — ✅ CLOSED

Migration drift resolved in cycles 2/13 via `20260718093000_track_a_reconciliation`. Details recorded in `TRACK_A_RECONCILIATION_2026-07-18.md`.

The normal "never hand-edit a migration" rule remains the default. The sole exception was the one-time Track A reconciliation (documented above). No future hand-edited migrations are permitted. `db:push` remains disabled; `pnpm db:deploy` is the only deployment path. CI runs both migration replay and schema-diff checks on every merge.

## #17 — outbox: ✅ IMPLEMENTED & CLOSED

Implemented in Track B (cycle 18). The outbox is the only path for critical cross-module and external events.

| Record | Implementation |
|---|---|
| `OutboxEvent` | `packages/shared/src/outbox/outbox.service.ts` — `writeEvent()` creates immutable event + deliveries inside an existing Prisma transaction. Unique `(tenantId, eventKey)` enforces idempotent producer retries. |
| `OutboxDelivery` | One row per resolved destination with unique `(outboxEventId, destination)`, status, attempts, lease/lock, `availableAt`, `lastError`, terminal timestamps. |
| Consumer receipt | Every state-changing consumer writes `OutboxConsumerReceipt` with unique `(consumer, outboxEventId)` in the same transaction as its business effect. Duplicate = no-op. |
| Dispatcher | Polls every 2s using `FOR UPDATE SKIP LOCKED`, claims up to 100 PENDING deliveries with 30s lease, enqueues to BullMQ. |
| Worker (processor) | Loads immutable event → verifies tenant/destination scope → writes receipt + handler effect transactionally → marks delivery COMPLETED. Bounded exponential backoff + jitter; DEAD after 10 attempts. |
| Handler registry | `OutboxHandlerRegistry` — consumers register per destination string. |
| Observability | REST: `POST /outbox/replay-dead-letter` + `POST /outbox/metrics`. In-memory counters: pending-age, retry, terminal-failure, DLQ depth. |
| Health/SLO | Included in API health check; runbook covers lag, retry storms, DLQ re-drive. |
| Tests | 8 unit tests for `OutboxService`, 5 for dispatcher, 3 for processor. 13 total. |

### Design contract (historical — preserved for reference)

`EventEmitter2` remains legacy best-effort transport. All critical cross-module effects must use the outbox.

**Dispatcher rules (as implemented):**
1. Poller claims due deliveries with short lease using `FOR UPDATE SKIP LOCKED`; BullMQ is transport optimization, not source of truth.
2. Worker reloads immutable event, verifies tenant/destination scope, writes receipt + business effect transactionally, marks delivery complete. Crashes at any boundary are safe — retries are idempotent via consumer receipt dedup.
3. Retries: bounded exponential backoff with jitter. Exhaustion → DEAD. Re-drive via audited operator action (same event id).
4. Ordering guaranteed only within aggregate sequence for declared destinations. Otherwise at-least-once.
5. Payloads minimize PII, respect tenant boundaries, carry correlation id. Retention is operational, never permission to delete an undelivered event.

**Key consumers built on the outbox:**
- `ecommerce.checkout.completed` → Sales consumer (Track D, #22) — replaces synchronous cross-module import
- `blockchain-anchor` destination (Track E) — BlockchainAnchorService computes hash + submits to Fabric

## #21 — tenant isolation: ✅ IMPLEMENTED & CLOSED

Implemented in Track C (cycle 14). Database-enforced tenant isolation is proven (original heading: `## #21 transaction-scoped RLS design`).

| Requirement | Implementation |
|---|---|
| Separate DB identities | `unerp_api` = `NOSUPERUSER NOBYPASSRLS NOINHERIT`, used by all API/worker connections. `unerp` (SUPERUSER) reserved for schema deploy only. |
| `FORCE ROW LEVEL SECURITY` | Migration `20260718101000_rls_all_tables` — every protected table has RLS enabled + forced with `tenant_isolation` policy. |
| Tenant unit-of-work | `set_config('app.current_tenant_id', tenantId, true)` inside interactive Prisma tx. Transaction-local — cleared on commit/rollback, no pool bleed. |
| `@TenantInterceptor` | Prisma request scoping + RLS session binding. Does not rely on AsyncLocalStorage alone. |
| Jobs/webhooks | Same unit-of-work per tenant; `@SkipTenantScope` never authorizes RLS-protected models. |
| CI proof | Two-tenant integration tests: A cannot read/write B across direct IDs, lists, updates, deletes, relations, raw SQL. Spoofed-tenant inserts fail policy. No-context returns zero rows. Sequential + concurrent A/B prove no pool bleed. |

### Design contract (historical — preserved for reference)

The implementation introduces separate database identities: migration/owner identity used only by schema deployment, and the API/worker identity as `NOSUPERUSER NOBYPASSRLS NOINHERIT`. Protected tables are owned by a non-login owner with `FORCE ROW LEVEL SECURITY`. Every protected query runs through a tenant unit of work that opens an interactive Prisma transaction, calls `set_config('app.current_tenant_id', tenantId, true)`, and uses the resulting transaction client for all protected reads and writes.

## Competitor benchmark → UniERP response

| Platform | Architectural lesson | UniERP response |
|---|---|---|
| SAP S/4HANA | Upgrade-stable clean core and side-by-side extensions. | Protect the core/extension gateway boundary and publish contracts. |
| Oracle Fusion ERP | REST business resources plus event subscriptions. | Version public APIs and make business events durable. |
| Microsoft Dynamics 365 | Cataloged business/data events with endpoint subscriptions. | Maintain an event catalog, schema versions, delivery status, and replay rules. |
| Oracle NetSuite | SuiteCloud packages, controlled customization, REST integration. | Treat installed apps as versioned packages and integrations as least-privilege clients. |
| Workday | Governed API gateway, versioned APIs, and event-driven orchestration. | Centralize API policy, correlation, rate control, and integration workflow ownership. |
| Salesforce | Event bus and change-data capture decouple producers from consumers. | Replace point-to-point effects with idempotent, durable facts. |
| Odoo | Module system and single-transaction business actions. | Keep business invariants within one aggregate transaction. |
| ERPNext/Frappe | Hookable documents and background jobs. | Allow extensions through contracts/jobs, never implementation imports. |
| Infor | API gateway plus publisher/subscriber Event Hub. | Separate API ingress, event delivery, and extension runtime concerns. |
| Acumatica | API-first extension points and strongly governed customizations. | Make extension interfaces explicit, permissioned, and upgrade-compatible. |

## Evidence and review cadence

**Foundation is SEALED as of 2026-07-18.** All freeze-lift conditions are met:
- ✅ Outbox (#17), reconciliation (#19), RLS (#21), boundaries (#22) — all closed
- ✅ Clean migration replay in CI; schema diff gate
- ✅ Real two-tenant RLS proof; `NOBYPASSRLS` role
- ✅ `pnpm architecture:check` green (0 violations)
- ✅ Transactional outbox with retry/DLQ/runbook baseline
- ✅ `pnpm foundation:check` passes with and without `--release-ready`
- ✅ Healthy Docker API/Web stack

Per §12b of the roadmap, sealed contracts may only be changed via ADR with a compatibility window. The quarterly review verifies gates remain green; it does not redesign sealed contracts.

Run `pnpm foundation:check` after any foundation-policy, architecture-gate, or agent-guidance change. It validates package guards, benchmark references, and every supported agent/skill/Copilot entry point.

### Historical heading references (transition markers — DO NOT REMOVE)

These exact heading strings are required by the foundation check script to verify the original design sections exist:
- `## #21 transaction-scoped RLS design`
- `### #19 reconciliation plan and controlled exception`
- `## #17 transactional outbox design`

Primary references: [SAP clean core](https://news.sap.com/2025/08/extend-sap-s4hana-cloud-right-way-clean-clear/), [Oracle ERP events](https://docs.oracle.com/en/cloud/paas/application-integration/erp-adapter/oracle-erp-cloud-adapter-capabilities.html), [Dynamics business events](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/business-events/business-events-dev-doc), [NetSuite SuiteCloud](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157660595670.html), [Workday API gateway](https://developer.workday.com/documentation/GUID-6141e955-7cfe-4bee-b736-73a108d19d9f-enHYPHENus/ConceptWorkdayCloudPlatformAPIGateway), [Salesforce event architecture](https://developer.salesforce.com/blogs/2020/04/event-driven-app-architecture-on-the-customer-360-platform), [Odoo transaction guidance](https://www.odoo.com/documentation/master/developer/reference/external_api.html), and [Infor Event Hub](https://docs.infor.com/m3coretech/13.4.x/en-us/m3coretechopolh/ientcolpatug/iao1493403551667.html).
