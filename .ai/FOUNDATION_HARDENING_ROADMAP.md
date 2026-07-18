# UniERP Foundation Hardening Roadmap

> **Status:** Active plan (2026-07-18). Companion to
> [`ARCHITECTURE_FOUNDATION.md`](ARCHITECTURE_FOUNDATION.md) — the foundation doc states the
> *rules and blockers*; this roadmap states the *sequence, proofs, and exit gates* to close them
> and reach a basement that can carry 100 floors (target scale: lakhs of concurrent users,
> thousands of tenants).
>
> **Audience:** every engineer and AI agent. Read before selecting foundation work.
> **Prime directive:** *the basement gets strong before any new floor.* No new product feature,
> Prisma entity, public contract, or critical cross-module workflow lands while a Track A–D gate
> is open (this is the existing feature freeze, restated with a finish line).

---

## 1. Why this roadmap exists

A user directive set the goal plainly: this repo must be built to serve **lakhs of people** — so
the foundation (architecture, DB, security, tenancy, scalability, infra) must be strong *first*,
then any floor can be built on top. Blockchain was recently introduced and must be held to the
same bar.

The foundation doc already declares a feature freeze with four blockers. This roadmap turns that
freeze from an open-ended "do not proceed" into a **critical path with measurable exit gates**, and
folds the new blockchain layer into that path correctly rather than letting it accrete as a fifth
floor on a cracked basement.

---

## 2. Current-state snapshot (verified 2026-07-18)

### 2.1 The four foundation blockers

| # | Blocker | Verified state | Blocks |
|---|---|---|---|
| **#19** | Migration drift | 125 migrations replay clean on a fresh DB, but the shared dev DB diverges from the Prisma schema (isolated `migrate diff` proposed 134 col adds / 135 drops / 48 type changes across 58 tables). `db:push` disabled; dev DB fails closed on P3005. | #17, #21, all schema work |
| **#17** | No transactional outbox | `EventEmitter2` + BullMQ are best-effort. `BackgroundJob` enqueues before writing its tracking row → cannot prove atomic business-event persistence. Design contract exists; **not implemented**. | Every critical cross-module effect; blockchain anchoring; storefront→Sales |
| **#21** | RLS unproven | Dev `unerp` role is `SUPERUSER BYPASSRLS`; sampled protected tables have RLS disabled + zero policies. Isolation currently rests on Prisma `where` filters only. Design contract exists; **not implemented**. | Any claim of DB-enforced tenant isolation |
| **#22** | Cross-module imports | Reduced 27 → 2. Remaining: E-Commerce checkout → Sales synchronous write, deliberately deferred to the outbox. | Closes with #17 |

### 2.2 The blockchain island (new, added during the freeze)

Added: `packages/blockchain` (`@unerp/blockchain` — Fabric Gateway wrapper, 4 chaincodes:
document-registry, finance-ledger, supply-chain, procurement), `apps/api/src/modules/blockchain`
(module, controller, 4 anchor services, sync service, gateway provider), 2 Prisma models
(`BlockchainTransaction`, `BlockchainVerification`) + migration `20260717180000_add_blockchain_models`.

**What's right (keep):** feature-flagged (`BLOCKCHAIN_ENABLED`); fails safe — Fabric down never
crashes the API; **hash-only on chain** (full data + PII stay in Postgres); `tenant_id` + FK +
indexes on both new tables; tamper-detection semantics in the finance-ledger contract.

**What repeats the cracks (fix before it's wired to any module):**

1. **Dual-write, no outbox (widens #17).** `finance-ledger-blockchain.service.ts` writes a
   `BlockchainTransaction` row → calls Fabric → updates the row. A crash/outage between steps
   orphans `PENDING` rows with no durable retry. Anchoring a GL journal is a *critical fact*;
   rule #13 forbids this shape without the outbox.
2. **Global Prisma client, not the tenant unit-of-work (sits in the #21 gap).** Services and the
   sync listener use the raw global `prisma`; the new migration adds no RLS policy. Isolation is
   one missing `where` from a cross-tenant leak.
3. **Fire-and-forget Fabric listener.** `blockchain-sync.service.ts` has no durable checkpoint or
   idempotent receipt; an API restart drops missed blocks with no replay.

**Redeeming fact:** a repo-wide grep shows **zero ERP modules currently call the blockchain
services**. The dangerous path has not shipped. This is a clean, isolated island we can re-platform
correctly.

### 2.3 The key architectural insight

**Blockchain is not a new pillar — it is the first real consumer of the transactional outbox (#17).**
The correct shape: an ERP module commits its business fact in one Postgres transaction *and* writes
an outbox row; a durable dispatcher later anchors the hash to Fabric with retry / DLQ / idempotency.
That erases the dual-write, enforces tenant context, and gives every future floor (external
webhooks, analytics, replication, AI) the same durable rail. This is why the sequence below fixes
the outbox *before* re-wiring blockchain.

---

## 3. Guiding principles (the basement code)

1. **Dependencies dictate order.** #19 is the root; #17 and #21 are blocked by it; blockchain
   re-platform is blocked by #17. Do not invert this to chase a quick win.
2. **Every gate is a proof, not a checkbox.** A track closes only when its listed evidence exists
   and is enforced in CI so it cannot silently regress.
3. **Expand → backfill → observe → contract.** All schema and contract change is additive-first and
   reversible. Rollback means returning reads/writes to the compatible shape, never deleting tenant
   data.
4. **One transactional owner.** A command mutates one aggregate in one DB transaction; multi-module
   / external outcomes (incl. blockchain) are asynchronous, idempotent, at-least-once.
5. **Tenant isolation in depth.** App scoping + DB RLS + RBAC + audit all enforce the same boundary.
   A Prisma filter is never an RLS substitute.
6. **Owner + runbook before business-critical.** Every async/integration flow ships with retry,
   idempotency, DLQ visibility, tracing, a health signal, and a named owner before it carries
   critical facts.
7. **Blockchain holds no higher trust than its weakest input.** On-chain hashes prove *integrity of
   what was anchored*, not correctness of the source write. The Postgres write path and its RLS are
   the real security boundary; the ledger is tamper-evidence on top.

---

## 4. Critical path (dependency graph)

```
        ┌───────────────────────────────────────────────┐
        │ Track 0 — Governance + quarantine blockchain   │  (immediate, parallel-safe)
        └───────────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────────┐
        │ Track A — #19 migration trust (ROOT)           │  ← your owner sign-off gate
        └───────────────────────────────────────────────┘
                    │                         │
                    ▼                         ▼
   ┌─────────────────────────┐   ┌─────────────────────────────┐
   │ Track B — #17 outbox    │   │ Track C — #21 RLS proof     │  (B and C parallel after A)
   └─────────────────────────┘   └─────────────────────────────┘
                    │                         │
                    ▼                         │
   ┌─────────────────────────┐               │
   │ Track D — #22 finish    │               │
   │ (storefront→Sales via   │               │
   │  outbox)                │               │
   └─────────────────────────┘               │
                    └─────────────┬───────────┘
                                  ▼
        ┌───────────────────────────────────────────────┐
        │ Track E — Re-platform blockchain on the outbox │
        └───────────────────────────────────────────────┘
                                  ▼
        ┌───────────────────────────────────────────────┐
        │ Track F — Platform scale/security hardening    │  (continuous; some items parallel-safe)
        │ (lakhs-of-users concerns)                      │
        └───────────────────────────────────────────────┘
                                  ▼
                      ▶ Feature-freeze LIFT gate ◀
```

---

## 5. Track 0 — Governance & blockchain quarantine ✅ CLOSED 2026-07-18 (cycle 1)

**Closing evidence:** quarantine guard live in `scripts/check-module-boundaries.mjs`
(inside `pnpm architecture:check`) — red/green proven with a deliberate violation;
quarantine hardened beyond plan: `BlockchainModule` unregistered from
`app.module.ts` and excluded from the API tsconfig because the island did not
compile (unlinked `@unerp/blockchain`, unbuilt dist, absent
`@hyperledger/fabric-gateway`) — Track E owns re-linking, building, and
re-registering it on the outbox. 0.3 marking in MODULE_REGISTRY; 0.1/0.4 records
in CHANGELOG 2026-07-18. Commit: CHANGELOG cycle-1 entry.

**Goal:** stop the bleeding and make the plan enforceable, without touching the DB.

| Item | Action |
|---|---|
| 0.1 | Add this roadmap to the 3-file record (CHANGELOG entry + MODULE_REGISTRY Collab Board Up-Next). |
| 0.2 | **Quarantine blockchain:** confirm no ERP module imports the anchor services (CI guard: `architecture:check` rule that fails if any non-blockchain module imports `*BlockchainService`). Keep `BLOCKCHAIN_ENABLED` default-off. |
| 0.3 | Mark the blockchain module + its migration as **"provisional / freeze-exception, not to be wired"** in MODULE_REGISTRY, with a pointer to Track E for the correct integration. |
| 0.4 | Log a dated architecture exception in CHANGELOG for the blockchain code added during the freeze (per foundation rule 16: deviations require a documented approved exception). |

**Exit gate:** blockchain cannot be called from a business module without tripping CI; the exception
is recorded; the roadmap is in the tracked files.

---

## 6. Track A — #19 migration trust (ROOT BLOCKER) 🔒 needs owner sign-off

> **Status 2026-07-18 (cycle 2): A.1 + A.2 COMPLETE; A.3/A.4 PREPARED, ⚠️ awaiting
> named-owner sign-off** — see `.ai/TRACK_A_RECONCILIATION_2026-07-18.md`.
> Key findings that refine this track: (1) the dev DB has ZERO drift from the
> recorded 128-migration history (`migrate diff` dev→migrations is empty) — the
> divergence is migrations vs `schema.prisma` (un-migrated schema edits, mostly
> naming-convention `@map` work); (2) all 23 affected tables hold 0 rows (dev DB
> total: 333 seed rows), so the reconciliation is provably lossless in this
> environment. Classification: 125 mechanical case-convention renames, 9
> text→enum conversions, 2 additive, 1 drop (`landed_cost_receipt_links.updatedAt`
> — the A.3 decision). Candidate SQL committed for review (NOT applied).

**Goal:** schema evolution becomes trustworthy — recorded history and the live DB provably converge
with zero data loss.

**Why first:** #17 and #21 both need to add tables/roles/policies via migrations; doing that on a
drifted DB compounds the problem.

| Item | Action |
|---|---|
| A.1 | Freeze schema changes; take logical schema+data backups + row-count/checksum baselines for **both** a migration-history clone and the drifted shared DB. |
| A.2 | Run `pnpm migration:reconciliation:report` against an isolated `MIGRATION_SHADOW_DATABASE_URL`. Classify every proposed destructive op as (a) proven rename, (b) additive/backfill, or (c) rejected unknown. |
| A.3 | Resolve the known unknown: `landed_cost_receipt_links.updatedAt` → rename to `legacy_updated_at`, expose read-only nullable, include in checksum proof (per the doc's proposed retention decision). **Requires named DB-owner + code-owner approval.** |
| A.4 | Produce the mapping ledger (old physical name, new name, transformation, null/default, owner, validation query). Generate a `--create-only` candidate on a disposable DB; hand-edit **only** proven renames to `RENAME COLUMN`/`RENAME INDEX`. No drops, no `CASCADE`, no reset. |
| A.5 | Apply the reviewed reconciliation to fresh clones of *both* DB shapes; verify row counts, tenant counts, FK integrity, representative business aggregates, and read/write smoke tests. |
| A.6 | Wire CI: fresh migration replay **and** schema-diff-must-be-empty gates. |

**Exit gate (#19 closed):** recorded history deploys clean on a fresh DB; drifted clone preserved
through the transition; CI runs replay + diff gates green; Docker stack reaches healthy API/Web via
`pnpm db:deploy`. **No destructive contract step ships in this release** — compatibility columns
retained until a later, separately approved contract release.

---

## 7. Track B — #17 transactional outbox (blocked by A)

**Goal:** a durable, tenant-safe, at-least-once event rail — the substrate for all critical
cross-module effects, external webhooks, and blockchain anchoring.

| Item | Action |
|---|---|
| B.1 | Migration: `OutboxEvent` (immutable; `id`, `tenantId`, `eventName`, int `eventVersion`, `aggregateType/Id`, per-aggregate sequence, `occurredAt`, `payload`, correlation/causation IDs, `eventKey`; unique `(tenantId, eventKey)`). |
| B.2 | Migration: `OutboxDelivery` (one row per destination; unique `(outboxEventId, destination)`; status, attempts, lease owner, `availableAt`, `lastError`, terminal timestamps). |
| B.3 | Consumer receipt table: unique `(consumer, outboxEventId)`, written in the **same transaction** as the business effect; duplicate = successful no-op. |
| B.4 | Producer helper: write the outbox row inside the aggregate's Prisma transaction (no separate call). |
| B.5 | Dispatcher: poller claims due deliveries `FOR UPDATE SKIP LOCKED` with a short lease; enqueues BullMQ using `outboxEventId` as stable job id (Redis = transport, not source of truth). |
| B.6 | Worker: reload immutable event → verify tenant/destination scope → write receipt + effect transactionally → mark that delivery complete. Bounded exponential backoff + jitter; exhaustion → `DEAD` (audited re-drive only). |
| B.7 | Observability: DLQ/re-drive, pending-age, retry, terminal-failure metrics + health checks + alerts + SLOs + runbook. |

**Exit gate (#17 closed):** rollback creates no event; committed mutation + outbox row appear
atomically; dispatcher crash at every enqueue/ack boundary loses no effect; duplicate/re-drive yields
exactly one consumer effect; tenant cannot cross deliveries; ordered aggregate delivery verified
where declared; all outbox metrics have alerts + runbook.

---

## 8. Track C — #21 transaction-scoped RLS proof (blocked by A, parallel to B)

**Goal:** database-*enforced* tenant isolation, proven with two tenants against the non-bypass role.

| Item | Action |
|---|---|
| C.1 | Split DB identities: migration/owner identity (schema deploy only) vs API/worker identity `NOSUPERUSER NOBYPASSRLS NOINHERIT`. Protected tables owned by a non-login owner with `FORCE ROW LEVEL SECURITY`. App connections never get owner/migration creds. |
| C.2 | Tenant unit-of-work: open interactive Prisma transaction → `set_config('app.current_tenant_id', tenantId, true)` (transaction-local) → use that tx client for all protected reads/writes. No external network call held inside the tx. |
| C.3 | Policy inventory: every protected table has enabled+forced RLS and the expected policy. Jobs/schedulers/webhooks enter the same unit-of-work per tenant; privileged maintenance uses a separate audited path. `@SkipTenantScope` never authorizes an RLS-protected model. |
| C.4 | CI verifies role config + policy inventory (not assumed from a connection string). |

**Exit gate (#21 closed):** two-tenant suite on a migration-built DB with the non-bypass role proves
A reads/writes only A across direct IDs, lists, updates, deletes, relations, raw SQL; spoofed-tenant
inserts fail policy; no-context returns no rows; sequential+concurrent A/B prove no pool bleed;
jobs/webhooks have the same proof. Tests use the real Prisma transaction path; CI fails on any
role/policy/assertion regression.

---

## 9. Track D — #22 finish cross-module boundary (blocked by B)

**Goal:** remove the last direct cross-module write.

| Item | Action |
|---|---|
| D.1 | Convert the E-Commerce checkout → Sales synchronous write into an outbox event (`ecommerce.checkout.completed` → Sales consumer) with an observable checkout state. |
| D.2 | `architecture:check` baseline of remaining direct imports drops from 2 → 0. |

**Exit gate:** zero direct cross-module implementation imports; checkout→order is asynchronous,
idempotent, observable.

---

## 10. Track E — Re-platform blockchain on the outbox (blocked by B, benefits from C)

**Goal:** turn the blockchain island into a correct, first-class outbox consumer — the reference
implementation for "durable external side effect."

| Item | Action |
|---|---|
| E.1 | Delete the in-service dual-write. Anchoring is triggered by an outbox event (`finance.journal.posted`, `document.registered`, `supplychain.shipment.updated`, `procurement.match.completed`) whose row is written in the *same tx* as the source aggregate. |
| E.2 | A `blockchain-anchor` outbox **destination**: dispatcher delivers to a worker that (a) computes the hash, (b) submits to Fabric, (c) writes the receipt + updates `BlockchainTransaction` transactionally. Fabric down → delivery retries/DLQs, never orphans. |
| E.3 | Replace the fire-and-forget Fabric listener with a durable checkpoint: persist last-processed block per (channel, chaincode); on restart, replay from checkpoint; sync writes are idempotent by `(txId)`. |
| E.4 | Route all blockchain Postgres access through the Track C tenant unit-of-work; add RLS policies to `blockchain_transactions` / `blockchain_verifications` in a migration. |
| E.5 | Only after E.1–E.4: wire the first real caller (recommend Finance GL journal posting) behind the flag; verify end-to-end anchor + tamper-detect + verify endpoints. |

**Exit gate:** no dual-write remains; anchoring survives Fabric outage + API restart with exactly-once
effect; blockchain tables are RLS-protected and accessed only via the tenant unit-of-work; the
integration passes the same outbox proofs as Track B.

---

## 11. Track F — Platform scale & security hardening (lakhs-of-users)

Continuous; several items are parallel-safe with A–E. These are the "can it actually hold lakhs of
users across thousands of tenants" concerns the directive named. Each becomes a tracked work item
with its own gate; this is the backlog, not a freeze exception.

**Data & DB scale**
- Connection pooling at scale (PgBouncer/pooler) sized against the non-bypass role; verify `SET LOCAL`
  tenant context survives pooling (interlocks with Track C).
- Partitioning / archival strategy for high-volume tables (audit/change-history, outbox, blockchain
  tx, events, notifications). Time- or tenant-partitioning + retention jobs.
- Read-replica routing for reporting/BI; index review under realistic tenant cardinality.
- Backup/restore + PITR drills; documented RPO/RTO.

**Runtime & throughput**
- Horizontal-scale readiness: stateless API workers; dispatcher/worker leader-election or safe
  concurrency (outbox `SKIP LOCKED` already helps); BullMQ concurrency + rate limits per tenant.
- Caching tiers (Redis) with tenant-scoped keys + explicit invalidation on outbox events.
- Per-tenant quotas / fair-use limits so one tenant cannot starve others.

**Security, network, tenancy**
- WAF + edge rate-limiting + bot/abuse controls; strict security headers/CSP audit; CORS review.
- Secrets management (rotation, no secrets in code — audit); mTLS/identity for Fabric + internal
  service calls.
- Firewall/network policy: DB and Redis not publicly reachable; per-service least-privilege network
  policies (K8s NetworkPolicy or equivalent); egress control for outbound webhooks/Fabric.
- Storage: MinIO/S3 bucket policies, encryption at rest, signed/expiring URLs, virus scan on upload,
  tenant-scoped prefixes.
- Dependency hygiene: automated SCA/CVE scanning gate in CI; SBOM; pinned + reviewed additions.

**Operability**
- **System-wide + per-module maintenance mode** (read-only / drain / banner) as a first-class
  platform capability, so any floor can be serviced without a full outage.
- SLOs + dashboards + alerts per critical async flow (outbox lag, DLQ depth, RLS-denied spikes,
  Fabric anchor latency).
- Load/soak tests at target scale; chaos drills (Fabric down, DB failover, Redis loss) with runbooks.

**Exit gate:** each F item has a proof and a runbook; the platform sustains a defined load target
with tenant isolation intact and no single-tenant starvation.

---

## 11b. Track G — Platform contracts (the "never touch the foundation again" layer)

**Goal:** every cross-cutting convention a feature developer will ever need exists as a
platform-level contract *before* the freeze lifts — so no future module ever has to invent
(or re-litigate) a foundational pattern. Verified missing by repo audit on 2026-07-18.

| Item | Verified gap | Required contract |
|---|---|---|
| G.1 | **API versioning is a prefix, not a policy.** Only a global `api/v1` prefix in `main.ts`; no mechanism to serve v2 beside v1, no deprecation/sunset policy. | Adopt Nest URI versioning; publish a written deprecation policy (new version beside old for ≥1 documented release, `Deprecation`/`Sunset` headers); wire into the extension `apiVersion` window. |
| G.2 | ~~**No concurrency-control convention.**~~ ✅ **Mechanism CLOSED 2026-07-18 (cycle 7)**; `version`-column backfill on existing aggregates queued for the post-Track-A migration window (same queue as G.8's Decimal conversion). | `updateWithVersionGuard` + `StaleWriteError` in `@unerp/database` (single conditional write on `(id, tenantId, version)` + atomic increment; tenant-scoped stale/missing probe with no cross-tenant existence leak); global filter maps to 409 `STALE_WRITE` (code reserved in G.9 registry); scaffolder emits `version Int @default(1)`, `expectedVersion` in update DTOs, and the guarded update path (also fixed: scaffolder emitted G.8-violating `Float` — now `Decimal(18,2)`); 5 unit tests. |
| G.3 | **No platform write idempotency.** Only e-commerce checkout implements idempotency keys. | Global `Idempotency-Key` middleware for all POST/state-changing public endpoints: store `(tenantId, key, requestHash, response)` with TTL; replay returns the stored response. Required for mobile/PWA offline sync and every external integration. |
| G.4 | **Inconsistent deletion semantics.** 46 `deletedAt` columns across 645 tables; the rest hard-delete. | A written deletion policy per entity class: business documents = soft-delete + audit; operational/log data = retention-based hard delete; PII = erasure workflow (H.1). Shared helper + Prisma middleware so filters are automatic; scaffolder default. |
| G.5 | **No shared document-numbering service.** No sequence/numbering service under `common/`; modules number documents ad hoc. | Tenant-scoped, gapless-where-required, concurrency-safe numbering service (`(tenantId, series)` row with `SELECT … FOR UPDATE`), configurable formats (prefix/fiscal-year/reset), used by all documents (invoices, POs, JEs…). Legal requirement in many jurisdictions. |
| G.6 | ~~**No boot-time env validation.**~~ ✅ **CLOSED 2026-07-18 (cycle 4).** | `apps/api/src/common/config/env.schema.ts` (39-variable Zod schema, dev defaults, production-strict secrets incl. length/placeholder/localhost checks) + `validateEnv()` fail-fast in `main.ts`; `.env.example` GENERATED via `scripts/generate-env-example.mjs`, CI `--check` drift gate; 8 unit tests. |
| G.7 | **Rate limiting is global only.** No per-tenant throttling; one tenant can starve others. | Per-tenant (and per-API-key) quota tiers enforced at the guard layer, backed by Redis; limits configurable per subscription plan (ties into Phase 20 metering). |
| G.8 | ~~**Money-type audit.**~~ ✅ **CLOSED 2026-07-18 (cycle 6)** — lint live; 2-column Decimal conversion queued behind Track A's schema freeze. | Audit done: `Vendor.averageLeadTimeDays`/`.qualityScore` + `ExpenseReportItem.ocrConfidence` = legitimate metrics; **`WebOrder.subtotal`/`.total` = money-as-Float**, queued for `Decimal(18,2)` in the Track A reconciliation release (named in the baseline so it can't be silently forgotten). `scripts/check-schema-lints.mjs` + shrink-only `schema-lint-baseline.json` forbid any new Float (proven red/green); wired into CI + `pnpm schema:lint` + `migration:discipline`. |
| G.9 | ~~**Error envelope + pagination as executable contracts.**~~ ✅ **CLOSED 2026-07-18 (cycle 5).** | `packages/shared/src/contracts/` — `errorEnvelopeSchema` + `ERROR_CODES` registry + `codeForStatus` (consumed by `AllExceptionsFilter`), `listQuerySchema` (page/limit/sortBy/sortOrder) + `paginatedResponseSchema` + `buildPaginationMeta` (canonical; validators' loose duplicate removed, legacy `paginationSchema` deprecated); scaffolder emits the contract (incl. sortBy allowlist); 7 contract tests, 43 shared tests green. |

**Exit gate:** each contract exists in `packages/shared`/`common`, is enforced mechanically
(middleware, guard, schema lint, or scaffolder default — not prose), and has tests. New-module
scaffolding (`scaffold-entity.mjs`) emits all of them by default.

## 11c. Track H — Data lifecycle, compliance & DR (verified gaps)

| Item | Verified gap | Required control |
|---|---|---|
| H.1 | GDPR service exists (`admin/gdpr.service.ts`) but erasure coverage across all 645 tables is unproven. | Erasure/anonymization must be **registry-driven**: every model carrying PII declares its treatment (erase / anonymize / retain-legal-hold); a test fails when a new PII model lacks a declaration. Erasure runs produce an auditable report. |
| H.2 | **No tenant lifecycle as a platform capability.** No tenant-level export/offboarding path found. | First-class tenant lifecycle: provision (exists, Phase 20) → suspend → full data export (portable format) → offboard with retention window → verified purge. This is both a GDPR Art. 20 duty and an enterprise-sales requirement. |
| H.3 | **Backup + restore-verify automation ✅ landed + drilled 2026-07-18 (cycle 8)**; remaining sub-item: WAL-based PITR at production topology. | `scripts/backup-database.mjs` (containerized pg_dump -Fc, SHA-256, retention) + `scripts/verify-backup.mjs` (disposable-DB restore, exact per-table row-count + migration equality). Drill evidence: 655 tables / 333 rows / 128 migrations verified equal, backup 1.9s, restore+verify 20.3s. `docs/RUNBOOK_BACKUP_RESTORE.md` records procedure + RPO≤24h/RTO≤30min (current topology) + the PITR production requirement. |
| H.4 | Retention policy per data class is undocumented. | One retention matrix (audit/change-history, outbox, blockchain tx, notifications, logs, files) with automated enforcement jobs — same matrix drives F's partitioning/archival. |

**Exit gate:** two-sided proof — a tenant can be fully exported and verifiably purged; a backup has
been restored and validated in a drill; PII registry test is green in CI.

## 11d. Track I — Delivery integrity (build, test, CI) (verified gaps)

| Item | Verified gap | Required control |
|---|---|---|
| I.1 | ~~**Production build is broken at HEAD**~~ ✅ **CLOSED 2026-07-18 (cycle 3).** Root cause was NOT package `exports` (maps were correct): OneDrive sync + EACCES-aborted `pnpm install` runs left 31 broken/missing junctions under `{apps,packages}/*/node_modules/@unerp/`; the production `import` condition resolves through them while dev mode masks it via the `development` condition. | Fixed: `scripts/repair-workspace-links.mjs` (idempotent repair + `--check` mode) — 31 links repaired, `next build` green with full page manifest; CI now builds ui-*/framework dists and the production web artifact on every merge (`ci.yml`). |
| I.2 | **No load/perf tests anywhere.** | k6 (or equivalent) suite for the top tenant-scoped flows (login, list+paginate, document post, checkout); a stated capacity target (e.g. N RPS/tenant at p95 < X ms) verified before the freeze lifts and re-verified per release. Prerequisite for any "lakhs of users" claim. |
| I.3 | **E2E depth is 3 smoke specs** (`api-health`, `auth`, `smoke`). | Playwright journeys for the critical business paths (order-to-cash, procure-to-pay, GL post+close) incl. two-tenant isolation walk-through at the UI layer. |
| I.4 | Single `ci.yml`; release gates incomplete (and CI has been red on Actions billing). | CI must enforce, per merge: typecheck, unit, architecture:check, migration replay + empty schema-diff (A.6), RLS two-tenant suite (C), prod build (I.1), SCA/CVE scan (F). A red or non-running CI is itself a foundation blocker — restore billing/runner or self-host. |

**Exit gate:** green end-to-end pipeline containing every foundation proof; prod artifact builds; a
load target is met and recorded.

## 11e. Foundation completeness review — how we know nothing is missing

The gap audit (2026-07-18) swept these platform surfaces against the actual code; each is now
either **verified present**, or **covered by a track item**:

- *Verified present, keep and verify depth:* global error filter, feature-flag service, field
  encryption (`packages/database/src/encryption.ts`, MFA secrets), SSO (OIDC/SAML controller),
  GDPR service, platform maintenance service, observability stack (OTel/Sentry/Prometheus),
  webhook signing policy, CSRF/headers/global rate limit, i18n, PWA/offline queue, audit/change
  history, custom-field model, workflow engine, file storage (MinIO/S3), extension API window.
- *Covered by tracks:* everything in the table rows of Tracks 0–I.
- *Explicitly out of foundation scope (product work, post-lift):* new module features, industry
  depth, UI polish, marketplace content, AI copilot features.

If a future gap is discovered that is genuinely foundational (a cross-cutting contract every module
needs), it is added **here** as a track item before any module works around it locally. Local
workarounds of missing platform contracts are treated as architecture violations.

## 12. Feature-freeze LIFT gate

The freeze lifts (new floors allowed) only when **all** hold:

- #17, #19, #21, #22 closed (Tracks A–D gates green).
- Blockchain re-platformed on the outbox (Track E gate green) — or explicitly re-quarantined.
- Track G platform contracts exist and are mechanically enforced + scaffolder-default.
- Track H lifecycle/DR proofs (tenant export+purge, restore drill, PII registry test) green.
- Track I delivery integrity green: **prod build succeeds in CI**, load target met, e2e journeys pass.
- CI enforces: clean migration replay, empty schema diff, two-tenant RLS proof, zero cross-module
  direct imports, outbox proofs, `architecture:check` green, prod build, SCA scan.
- Healthy Docker API/Web stack via `pnpm db:deploy`; documented event-contract/retry/runbook baseline.
- `pnpm foundation:check -- --release-ready` passes.

Until then, work is restricted to Tracks 0–I (remediation, tests, docs, quality gates, scale/security
hardening) per the standing freeze.

## 12b. Foundation SEALED — development-only mode after the lift

Once every track above is closed with evidence, the foundation is declared **v1.0 — SEALED**:

1. **This roadmap flips to a completion record.** Each track shows ✅ + closing commit. The
   document stops being a plan and becomes the auditable proof that the basement is done.
2. **All subsequent work is development on top, never re-architecture.** Modules build using the
   sealed contracts (outbox, tenant unit-of-work, versioned APIs, idempotency, numbering, deletion
   policy, error/pagination envelopes, scaffolder defaults). A feature that seems to need a new
   foundational pattern is a *design smell* — first check whether an existing contract covers it.
3. **Changing a sealed contract requires an ADR** (architecture decision record in `.ai/`),
   approved before implementation, with a compatibility window per the evolution-governance table —
   never an in-flight rework inside a feature branch. Expected frequency: rare (a few per year),
   because Tracks G–I exist precisely to pre-answer the recurring questions.
4. **The gates keep running forever.** CI proofs (replay, diff, RLS, boundaries, outbox, prod
   build, load target) remain required on every merge — the seal is enforced mechanically, not by
   memory. Regression of any proof re-opens the corresponding track automatically.
5. **Quarterly review shrinks to verification.** The quarterly architecture review confirms gates
   are green and exceptions are current; it does not redesign anything.

---

## 13. Governance & cadence

- **Tracking:** every track item flows through the 3-file system (CHANGELOG entry + MODULE_REGISTRY
  status/Collab-Board) exactly like feature work.
- **Sign-off gates:** Track A (A.3/A.4) requires named DB-owner + code-owner approval before any
  reconciling SQL. No auto-apply.
- **Review:** quarterly architecture review (per foundation doc) also checks progress against this
  roadmap; expired exceptions are removed or re-approved with a dated plan.
- **This doc is durable:** update it as tracks close; do not delete closed tracks — mark them
  ✅ with the closing evidence + commit, so the finish line stays auditable.

---
---

# PART II — ERP *Platform* Doctrine (decades horizon)

> Added 2026-07-18. Part I (Tracks 0–I) repairs and completes the foundation of the *system we
> have*. Part II defines what makes UniERP an ERP **platform** rather than an ERP **application** —
> the doctrine that lets it grow for decades without the foundation changing again.
>
> The distinction, learned from every long-lived enterprise platform (SAP ~50 yrs, Salesforce ~25,
> Dynamics ~30, mainframe ERPs still running): **applications are rewritten when their technology
> ages; platforms survive because their *contracts* outlive their *implementations*.** Nest,
> Prisma, Next.js, BullMQ, even PostgreSQL are implementations. The platform is the set of
> contracts. Part II seals the contracts; implementations stay swappable forever.

## 14. The Kernel Constitution — platform vs module (the deepest boundary)

**The kernel test:** *"Could an independent third party build our entire Finance module from
scratch using only publicly documented kernel contracts — no internal imports, no shared tables,
no undocumented behavior?"* Until the answer is yes, we have an application with modules, not a
platform.

**The kernel** (the only truly permanent code) provides exactly these capabilities, each as a
versioned public contract:

| Kernel capability | Contract it exposes | Part I origin |
|---|---|---|
| Tenancy & isolation | tenant unit-of-work, RLS guarantee, tenant lifecycle | C, H.2 |
| Identity & access | authN, sessions, RBAC→policy decisions (§17), SCIM/SSO | existing + §17 |
| Event backbone | outbox publish/subscribe, event catalog, replay | B |
| Metadata & schema registry | entity/field/custom-field/UI-schema definitions | `@unerp/framework` + Studio |
| Workflow & approvals | state machines, approval chains, SLA | Phase 8 |
| Document numbering | tenant-scoped series | G.5 |
| Files & documents | storage, templates, rendering, retention | Phase 10 |
| Search & query | indexed search port, reporting/BI substrate | §15.3 port |
| i18n & locale | translations, calendars, formats | Phase 17 |
| Communication | notifications, email, real-time channels | Phase 9 |
| Extension runtime | marketplace packages, ext-gateway, service-kit, sandboxing | existing |
| Metering & billing | usage events, quotas, plans | Phase 20, G.7 |
| Audit & compliance | change history, authZ decision log, erasure registry | existing + H.1 |
| AI substrate | grounded retrieval + governed actions (§19) | new |

**Constitutional rules:**

1. **Modules — including our own Finance/HR/CRM — are tenants of the kernel.** First-party modules
   get zero private privileges. The day Finance needs a kernel backdoor, the kernel is wrong — fix
   the kernel contract, never punch the hole. (This is SAP's "clean core" made structural.)
2. **The kernel never imports a module.** Dependency direction is one-way, mechanically enforced by
   `architecture:check` (extends #22's gate).
3. **Kernel contracts are sealed by §12b**; kernel *implementations* are replaceable at any time
   behind the contract (see §15).
4. **A capability enters the kernel only by subtraction proof:** at least two modules need it, and
   building it twice would fork a cross-cutting concern. Everything else stays in module space.

## 15. Longevity engineering — surviving technology churn

The stack *will* age: frameworks fall out of favor (~5–8 yr cycles), Node itself may yield,
databases evolve. A decades-platform plans for replacement without rewrites.

### 15.1 Hexagonal ports (contracts over frameworks)

Every external technology sits behind a port owned by the platform, so swapping the technology is
an implementation project, not an architecture change:

| Port | Current adapter | Replaceability requirement |
|---|---|---|
| Persistence | Prisma/PostgreSQL | Domain services depend on repository/unit-of-work interfaces, not `prisma` directly. (Track E already forces this for blockchain; extend platform-wide as modules are touched — *migration by strangler, not big-bang*.) |
| Message transport | BullMQ/Redis | Already doctrine in B.5: Redis is "transport optimization, not source of truth". Keep it true. |
| File storage | MinIO/S3 API | S3 API *is* the port. Never use vendor-specific features without an adapter. |
| Search | (to be chosen) | Define `SearchPort` before adopting any engine, so Elastic/Typesense/pg-fts are adapters. |
| LLM/AI | Ollama/Claude/any | Model-agnostic `AiPort` (§19). Models will change yearly; the port must not. |
| Web/API framework | NestJS | Controllers/DTOs are thin; business logic lives in framework-free services. Enforce via lint: no Nest imports in domain-service files. |
| Ledger/attestation | Hyperledger Fabric | Track E's outbox destination *is* the port. Fabric is an adapter; a future ledger (or plain notarized hash-chain) slots in without touching modules. |

### 15.2 Contract-first, generated everywhere

OpenAPI specs and event schemas are the **source of truth**; server DTOs, client types, SDKs, and
docs are *generated* from them (rule 16's "no hand-rolled per-page API types", completed). A
contract diff in CI is a reviewable, versioned artifact — the platform's real changelog.

### 15.3 Data longevity (the part that truly lasts decades)

Data outlives every line of code. Standards, sealed with G:

- **Identity:** UUIDs (prefer UUIDv7 for new tables — time-ordered, index-friendly at scale).
  Never expose DB sequence integers publicly.
- **Time:** store UTC; render per user timezone/locale; **effective-dated** records for anything
  legally time-sensitive (prices, tax rates, salaries, org structure) — the platform provides an
  effective-dating convention, with bitemporal (valid-time + transaction-time) reserved for audit-
  critical finance data.
- **Fiscal reality:** fiscal years/periods/calendars are first-class kernel data, per tenant, per
  country — never derived from calendar math in module code.
- **Quantity & money:** `Decimal` only (G.8); currency codes ISO 4217 with support for
  re-denomination events; units-of-measure with conversion tables as kernel data.
- **Text:** all user-visible strings translatable (Phase 17.5 model); no language assumptions in
  data (e.g., name ordering, address formats — use structured, country-aware address schema).
- **Formats chosen for 20-year readability:** JSON payloads with published schemas; no
  serialization format that requires our own code to decode (no proprietary blobs).

### 15.4 Cryptographic agility

Algorithms have shorter lives than platforms. Rules: every hash/cipher/signature use goes through
`packages/database/src/encryption.ts`-style central utilities with an **algorithm identifier stored
beside every ciphertext/hash**; key rotation is a supported operation, not an incident; when NIST
post-quantum migration guidance firms up for our dependency set, it's an adapter swap. The
blockchain anchors already store hash values — ensure the hash *algorithm* is recorded on-chain
with them (chaincode payloads must carry `hashAlg`), or 2040's verifier can't verify 2026's anchor.

### 15.5 Deprecation as a product feature

The platform publishes clocks, not surprises: every public contract version carries a status
(current / deprecated with sunset date / retired), `Deprecation`+`Sunset` headers (G.1), a
migration guide, and telemetry showing who still uses it. Nothing retires while a paying tenant's
extension depends on it within the window. This single discipline is most of why Salesforce
integrations from 2010 still run.

## 16. Tenant topology & planetary scale (cells, regions, sovereignty)

"Lakhs of users" is Part I's Track F. Decades add: *where* tenants live becomes a legal and
commercial dimension, not just a scaling one.

- **Three tenancy tiers, one codebase:** pooled (RLS-shared, default), siloed (dedicated schema/DB
  for enterprise tiers), dedicated (single-tenant deployment for sovereign/regulated buyers). The
  Track C tenant unit-of-work is the abstraction that makes all three possible without module
  changes — modules never know which tier they're on.
- **Cell-based architecture** at scale: tenants are assigned to cells (a full stack slice: DB,
  workers, cache); a cell failure hits only its tenants; cells are the unit of capacity planning,
  deployment canary, and blast radius. Kernel owns the tenant→cell directory.
- **Tenant mobility is a kernel operation:** move a tenant between cells/tiers/regions using the
  H.2 export/import path + outbox replay. Rehearsed, not theoretical.
- **Data residency/sovereignty:** tenant metadata records its legal region; storage, backups, and
  processing honor it; cross-region features (global search, analytics) must degrade gracefully
  rather than leak data across residency lines.
- **Region evacuation drill** joins H.3's DR drills once multi-region exists.

## 17. Authorization evolution — from roles to policy

RBAC (`module.resource.action`) is correct today and sealed as the *interface*. Decades of
enterprise reality (field-level security, row conditions like "own department only", delegation,
temporal grants, licensing entitlements) will demand more. The doctrine:

- Introduce a **central Policy Decision Point** behind the existing `@Permissions` decorator — the
  decorator is the sealed contract; the engine behind it evolves (RBAC → attribute/relationship-
  based) without touching a single endpoint.
- **AuthZ decisions are auditable events:** who asked, what policy answered, why — feeding the
  audit kernel. Required for SOX/ISO 27001-class certification later.
- **Entitlements ≠ permissions:** what a tenant *bought* (plan, modules, seats) is licensing data
  and gates features *before* RBAC is consulted. Keep the two systems separate or pricing changes
  will forever require permission migrations.
- Zero-trust posture for service-to-service: every internal caller (workers, ext-gateway, Fabric
  bridge) has its own identity and least-privilege grant — no shared god-credentials (extends C.1's
  DB-role split to the whole runtime).

## 18. Interoperability — the platform speaks the world's languages

An ERP that can't exchange documents with governments, banks, and other ERPs dies commercially, so
the *ports* are foundation even though each country adapter is ordinary development:

- **Kernel ports (sealed):** e-invoicing port, banking/payments port (ISO 20022 pain/camt shapes),
  EDI port, tax-authority filing port. Each defines canonical internal document → wire-format
  mapping points.
- **Country/network adapters (post-lift, as marketplace extensions where possible):** Peppol
  (EU/global e-invoicing), India GST e-invoice/e-way bill, GCC ZATCA, open-banking feeds, carrier
  EDI. Each is versioned, certified via the ecosystem program (§20), and never touches module
  internals.
- **Canonical import/export:** every business document has a documented, versioned portable format
  (H.2 relies on this for tenant export; interop reuses it).

## 19. AI-native substrate (a kernel capability, governed like one)

AI will be the dominant interaction and automation surface of the coming decades; bolting it on
per-module would fork governance. The kernel provides — behind the model-agnostic `AiPort` (§15.1):

- **Grounded retrieval API:** permission-aware context assembly — the AI sees exactly what the
  asking user could see (PDP-checked per §17), tenant-scoped by construction (Track C), with PII
  minimization from the H.1 registry. Retrieval never bypasses RLS.
- **Governed action API:** AI-proposed mutations flow through the *same* command handlers,
  validation, RBAC, audit, and outbox as human actions — plus a human-in-the-loop approval workflow
  (reusing Phase 8) for consequential actions. An AI action is never a special path.
- **Full AI audit:** prompt/context/response/action trail per tenant — legally required
  (EU AI Act-class regimes) and operationally essential.
- **Model lifecycle:** models are versioned adapters; evaluation harness before promotion; tenant-
  level opt-in/opt-out and data-usage controls recorded as consent data.

## 20. Ecosystem governance — the marketplace is part of the foundation

A platform's moat is its ecosystem; an ungoverned ecosystem is its biggest liability. Building on
the existing marketplace/service-kit/`apiVersion` window:

- **Certification pipeline:** an extension ships only after automated contract tests (against the
  sealed kernel contracts), security scan, permission-manifest review (least privilege, declared
  data access), and performance budget check.
- **Sandboxing doctrine:** extensions run with declared capabilities only (the ext-gateway is the
  enforcement point); no extension ever gets DB credentials or kernel-internal APIs.
- **Trust tiers:** first-party / certified partner / community — with correspondingly scoped
  capabilities and review depth.
- **Ecosystem compatibility promise:** the §15.5 deprecation clocks are a *contract with the
  ecosystem*; breaking an extension without its migration window is a platform incident, not a
  vendor's problem.

## 21. The operating model — Conway's Law is an architecture decision

Structure that must hold regardless of who (humans or AI agents) does the work:

- **Ownership map:** every kernel capability and every module has exactly one accountable owner
  (today: agent roles per `AGENTS.md`; tomorrow: teams). Unowned code is the root of most decade-
  scale rot.
- **ADR discipline (§12b made routine):** significant decisions get a numbered ADR in `.ai/`
  (context → options → decision → consequences). The existing 3-file system records *what*
  happened; ADRs record *why* — the thing future maintainers always lack.
- **Architecture review = fitness functions first:** the quarterly review (§13) examines the
  mechanical gate dashboard before opinions. Human judgment is spent only where machines can't
  measure.
- **Knowledge longevity:** the 5-file `.ai/` system + ADRs + generated contract docs are the
  institutional memory; any convention not written there does not exist.

## 22. Fitness functions — the constitution, mechanically enforced forever

The complete set of always-on CI gates that *are* the sealed foundation (consolidating Parts I+II —
each maps to a track/section):

1. Migration replay clean + schema diff empty (A) 
2. Two-tenant RLS proof with non-bypass role (C) 
3. Zero cross-module imports; kernel never imports modules (#22, §14) 
4. Outbox atomicity/idempotency proofs (B) 
5. Prod build + typecheck + unit + e2e journeys (I) 
6. Contract diff review gate — OpenAPI/event schemas versioned, no silent breaking change (§15.2) 
7. No framework imports in domain services; no raw `prisma` outside the unit-of-work (§15.1, C) 
8. Schema lints: tenant_id present, Decimal-for-money, UUID ids, soft-delete/erasure declaration
   present (G, H.1, §15.3) 
9. SCA/CVE + secrets scan + SBOM (F) 
10. Load target met per release (I.2) 
11. Extension contract tests green across the supported `apiVersion` window (§20) 
12. Deprecation telemetry: nothing retired with active consumers in-window (§15.5)

**Sealing note (extends §12b):** Part II's *contracts and doctrine* seal with foundation v1.0.
Part II *implementations* (PDP engine, search adapter, cells, interop adapters, AI substrate) are
staged development **on top of** the sealed contracts — they are floors, built the normal way,
precisely because the contracts were laid here. That is the whole point: after the seal, decades of
building, zero re-architecting.
