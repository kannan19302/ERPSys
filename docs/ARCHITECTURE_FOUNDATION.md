# UniERP Architecture Foundation

> Status: **feature freeze for foundation remediation** (2026-07-16). This document is the durable architecture baseline for engineers and AI agents. It distinguishes implemented controls from required remediation; do not treat a planned control as an active safeguard.

## Decision

UniERP remains a **modular monolith** while it earns the operational evidence needed to extract a service. The core owns transactional truth; extensions and integrations use stable public APIs and versioned business-event contracts. No module may reach into another module's implementation.

This deliberately follows durable patterns visible across leading ERP platforms: SAP's clean-core/side-by-side extension model, Oracle and Dynamics business-event catalogs, Workday's governed API gateway and orchestration, Salesforce's event bus/change data capture, SuiteCloud's packaged extensions, and the transaction-safe module patterns in Odoo/Frappe-class systems.

## Current foundation scorecard

| Concern | Current control | Status | Required next move |
|---|---|---:|---|
| Module boundaries | `architecture:check` rejects new direct relative imports across API modules; dependency-cruiser rejects cycles. Explicit common integration ports carry approved read-only and shared-infrastructure capabilities. | Enforced with two write-path exceptions | Replace the two storefront-to-Sales synchronous writes with durable outbox delivery after #17. |
| Core/extension separation | `ExtGatewayModule`, marketplace packages, and public API surfaces exist; manifests are normalized and checked against the explicit service-kit API compatibility range. | Partially enforced | Maintain the published compatibility window and contract tests before widening external APIs. |
| Transactional consistency | Prisma transactions are used in key workflows. | Partial | Add a transactional outbox before any new critical cross-module or external event. See #17. |
| Event delivery | Nest in-process events remain legacy best-effort transport. | At risk | Do not add critical business effects to the legacy emitter; deliver #17 first. |
| Tenant isolation | Prisma request scoping is active. PostgreSQL RLS session binding is not proven. | At risk | Resolve #21 with real two-tenant RLS integration tests. |
| Database evolution | Prisma schema and migrations are source-controlled. All 125 existing migrations replay on a fresh disposable PostgreSQL database; schema history still diverges from the current Prisma schema. | Blocked | Resolve #19 before schema work resumes; retain clean replay as a CI release gate. |
| Async work | Redis/BullMQ, retries, health probes, structured logging, traces, and metrics are present. | Partial | Standardize idempotency, DLQ visibility, SLOs, and runbooks with the outbox. |
| Observability | OpenTelemetry, Sentry, Prometheus metrics, health/readiness endpoints. | Active | Add business-event and migration SLOs when their foundations are repaired. |
| Security | JWT/RBAC, CSRF, headers, rate limits, audit/change history. | Partial | RLS proof is a release blocker (#21). |

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

## Foundation freeze

Until the linked blockers are resolved, agents may work only on foundation remediation, tests, documentation, and the architecture quality gates. They must not add feature modules, Prisma entities, public integration contracts, or new cross-module critical workflows.

- #17 — transactional outbox and durable event delivery
- #19 — shared development database migration drift
- #21 — transaction-scoped PostgreSQL RLS tenant context
- #22 — remove the existing cross-module imports tracked by the architecture baseline

Resolved foundation evidence:

- #20: all 125 migrations, including PostgreSQL extension bootstrap, replayed successfully on a fresh disposable database.
- #23: Docker dev startup now validates workspace package links and has been verified with live API and web HTTP 200 responses.
- #22 progress: AI, read-only reporting, Drive-backed document storage, real-time publication, and extension-runtime capabilities now cross module boundaries through explicit common ports; the Marketplace lifecycle was relocated into its owning module. The checked legacy direct-import baseline fell from 27 to 2. The remaining E-Commerce→Sales write path is deliberately deferred to #17's transactional outbox rather than masked with another synchronous port. `pnpm architecture:check`, API type-check, API build, and focused tests pass.

## Data migration safeguard

The #19 reconciliation cannot be accepted as an automatic Prisma catch-up: the generated migration would drop and recreate historically renamed columns. Resolve this only with an approved, data-preserving expand/backfill/contract transition and an explicit verification of both a migration-history database and an already-drifted database. `db:push` is disabled by a command-level guard, and Docker development startup now runs `pnpm db:deploy` without swallowing errors. The shared dev database is therefore correctly rejected with Prisma P3005 until it is reconciled, rather than silently running without the RLS migration. Fresh replay of all 125 recorded migrations succeeds on a disposable PostgreSQL database.

### #19 reconciliation plan and controlled exception

The 2026-07-16 isolated `prisma migrate diff` is evidence that automatic catch-up is unsafe: it proposed **134 column additions, 135 column drops, 48 type changes, 39 constraint drops, 41 constraint additions, 29 index renames, seven type creations, three type drops, and one new table** across 58 altered tables. The near one-to-one add/drop pattern is consistent with historical physical-name drift, but it is not proof that any column is safe to discard. The shared development database currently reports only 29 estimated rows across 645 application tables; that is a planning input, not authorization to reset or discard data.

The reproducible mapping report is `pnpm migration:reconciliation:report`, which requires `MIGRATION_SHADOW_DATABASE_URL` to name an isolated disposable database. Its 2026-07-16 baseline reports 134 normalized rename candidates across 21 tables and one unmatched destructive operation: `landed_cost_receipt_links.updatedAt` has no target column. Same-name candidates still require enum/type-conversion review. Run the report with `-- --check` only after every unmatched operation has an approved retention decision; the report intentionally fails that final gate while an unknown remains.

#### Proposed retention decision: landed-cost receipt-link timestamp

`landed_cost_receipt_links.updatedAt` originated as a non-null historical `@updatedAt` column. The current `LandedCostReceiptLink` model intentionally contains only `createdAt`, and the landed-cost service neither reads nor writes an update timestamp. The preservation-first proposal is to rename—not drop—the column to `legacy_updated_at`, expose it temporarily as a read-only nullable `legacyUpdatedAt` compatibility field, include it in clone backup/checksum proof, and perform no new writes to it. A later, separately approved contract release may remove it after the audit-retention review. This is **not approved yet**: the report's final check must continue failing until the database owner and code owner accept this retention treatment.

The normal "never hand-edit a migration" rule remains the default. The sole permitted exception is this one-time reconciliation: after Prisma generates a `--create-only` candidate on an isolated database, a named database owner and code owner may approve a reviewable SQL transformation that replaces only proven destructive rename cases with `RENAME COLUMN`/`RENAME INDEX` or additive/backfill steps. It may not introduce a data drop, table rewrite, broad `CASCADE`, or reset. The final migration must be accompanied by a mapping ledger of old physical name, new physical name, transformation, null/default behavior, owner, and validation query.

Required sequence:

1. Freeze schema changes and take logical schema/data backups plus row-count and checksum baselines for both a migration-history clone and the drifted shared database.
2. Generate the candidate only on a disposable database; classify every proposed destructive operation as a proven rename, an additive/backfill change, or an explicitly rejected unknown. Stop if any unknown has data.
3. Apply the reviewed reconciliation to fresh clones of both database shapes. Verify row counts, tenant counts, foreign-key integrity, representative business aggregates, and application read/write smoke tests before cutover.
4. Apply no destructive contract step in the reconciliation release. Retain compatibility columns/mappings until the following release has observed stable reads and the documented expiry review approves removal.
5. Roll back by returning the application to the prior compatible read/write shape and restoring from the verified logical backup if required; never use `db push` or an unreviewed down migration.

The reconciliation closes #19 only after the recorded migration history deploys cleanly on a fresh database, the drifted clone is preserved through the transition, CI runs both migration replay and schema-diff checks, and the Docker stack reaches healthy API/Web status using `pnpm db:deploy`.

## #17 transactional outbox design (implementation blocked by #19)

This is a design contract, not an implemented safeguard. `EventEmitter2` remains legacy best-effort transport, and `BackgroundJob` remains operational-job tracking: its current flow enqueues BullMQ before creating its tracking row, so it cannot prove atomic business-event persistence. The outbox must be a distinct, immutable database record created in the same Prisma transaction as the owning aggregate mutation.

| Record | Required fields and guarantees |
|---|---|
| `OutboxEvent` | Immutable `id`, `tenantId`, `eventName`, integer `eventVersion`, `aggregateType`, `aggregateId`, per-aggregate sequence, `occurredAt`, `payload`, correlation/causation IDs, and producer-supplied `eventKey`. Enforce unique `(tenantId, eventKey)` to make producer retries safe. |
| `OutboxDelivery` | One row per resolved destination with unique `(outboxEventId, destination)`, status, attempt count, lease/lock owner, `availableAt`, `lastError`, and terminal timestamps. The event does not become fully delivered merely because one consumer succeeds. |
| Consumer receipt | Every state-changing consumer writes a receipt with unique `(consumer, outboxEventId)` in the *same transaction* as its business effect. A duplicate is a successful no-op, never a second mutation. |

Dispatcher rules:

1. A poller claims due deliveries with a short lease and `FOR UPDATE SKIP LOCKED`; it may enqueue a BullMQ job using `outboxEventId` as the stable job id, but Redis is a transport optimization rather than the source of truth.
2. A worker reloads the immutable event, verifies tenant/destination scope, writes the receipt and business effect transactionally, then marks only that delivery complete. Crashes before or after enqueue are safe because the dispatcher can retry and the consumer receipt deduplicates.
3. Retries use bounded exponential backoff with jitter. Exhaustion moves a delivery to `DEAD`; it never silently disappears. Re-drive requires an audited operator action that keeps the same event id.
4. Ordering is guaranteed only within an aggregate sequence when a destination declares that requirement; consumers must otherwise tolerate reordering and at-least-once delivery. Payloads are additive and event-name/version pairs are immutable.
5. Outbox payloads must minimize PII, respect tenant boundaries, carry a correlation id, and use the existing signed extension-webhook policy for external service deliveries. Retention/archive is operational data retention, never permission to delete an undelivered event.

Required proof before #17 closes: rollback creates no event; committed mutation and outbox row appear atomically; dispatcher crashes at every enqueue/ack boundary produce no lost effect; duplicate/re-drive creates one consumer effect; tenant attempts cannot cross deliveries; ordered aggregate delivery is verified where declared; DLQ/re-drive, pending-age, retry, and terminal-failure metrics have health checks, alerts, SLOs, and a runbook. The first boundary migration is #22's E-Commerce checkout-to-Sales handoff; it becomes asynchronous with an observable checkout state rather than another synchronous module port.

## #21 transaction-scoped RLS design (implementation blocked by #19)

This is also a design contract, not an implemented safeguard. Live inspection on 2026-07-16 found the development `unerp` role is both `SUPERUSER` and `BYPASSRLS`; the sampled high-value tables have RLS disabled and zero policies because the drifted database never applied the recorded migrations. Application-level Prisma filters remain useful defense in depth, but they do not establish database isolation.

The implementation must introduce separate database identities: a migration/owner identity used only by schema deployment, and the API/worker identity as `NOSUPERUSER NOBYPASSRLS NOINHERIT`. Protected tables are owned by a non-login owner and use `FORCE ROW LEVEL SECURITY`; application connections never receive the owner or migration credentials. CI verifies this role configuration rather than assuming it from a connection string.

Every protected query must run through a tenant unit of work that opens an interactive Prisma transaction, calls parameterized `set_config('app.current_tenant_id', tenantId, true)`, and uses the resulting transaction client for all protected reads and writes. `true` makes the setting transaction-local, so it is cleared on commit or rollback and cannot leak through the pool. The Nest tenant interceptor continues to establish identity, but it must not rely on AsyncLocalStorage alone as proof of RLS. No external network call may be held inside this database transaction. Jobs, schedulers, and webhooks must enter the same unit of work explicitly for one tenant at a time; privileged maintenance uses a separate audited path. `@SkipTenantScope` never authorizes access to an RLS-protected model.

Required #21 proof uses two tenants and the non-bypass application role against a migration-built database: tenant A can read/write only A; direct IDs, list queries, updates, deletes, relations, and raw SQL cannot expose or mutate B; inserts with a spoofed tenant fail policy checks; no session context returns no protected rows; sequential and concurrent A/B requests prove connection-pool settings do not bleed; jobs/webhooks have the same proof; and every protected table has enabled/forced RLS plus the expected policy. The test suite must use the real Prisma transaction path—not a mocked tenant filter—and CI must fail if the role, policy inventory, or two-tenant assertions regress. Only then may product copy claim database-enforced RLS.

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

Reassess this document quarterly and before any service extraction. The gate to lift the feature freeze is: #17, #19, #21, and #22 closed; clean migration replay in CI; real two-tenant RLS proof; `pnpm architecture:check` green; a healthy Docker API/Web stack; and a documented event contract/retry/runbook baseline.

Run `pnpm foundation:check` after any foundation-policy, architecture-gate, or agent-guidance change. It validates this benchmark and the #17/#19/#21 designs, package guards, and every supported agent/skill/Copilot entry point. `pnpm foundation:check -- --release-ready` is expected to fail until the freeze-lift evidence above is real.

Primary references: [SAP clean core](https://news.sap.com/2025/08/extend-sap-s4hana-cloud-right-way-clean-clear/), [Oracle ERP events](https://docs.oracle.com/en/cloud/paas/application-integration/erp-adapter/oracle-erp-cloud-adapter-capabilities.html), [Dynamics business events](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/business-events/business-events-dev-doc), [NetSuite SuiteCloud](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157660595670.html), [Workday API gateway](https://developer.workday.com/documentation/GUID-6141e955-7cfe-4bee-b736-73a108d19d9f-enHYPHENus/ConceptWorkdayCloudPlatformAPIGateway), [Salesforce event architecture](https://developer.salesforce.com/blogs/2020/04/event-driven-app-architecture-on-the-customer-360-platform), [Odoo transaction guidance](https://www.odoo.com/documentation/master/developer/reference/external_api.html), and [Infor Event Hub](https://docs.infor.com/m3coretech/13.4.x/en-us/m3coretechopolh/ientcolpatug/iao1493403551667.html).
