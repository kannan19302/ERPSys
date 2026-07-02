# Admin Module — Completion Requirements

> Owner: product-manager | Status: backlog approved for build | Created: 2026-07-02
> Scope: `apps/api/src/modules/admin/**`, `apps/web/app/(dashboard)/admin/**`, `packages/shared/src/permissions/registry.ts`
> Goal: close *real, verified* functional gaps so every declared Admin capability actually works end-to-end. This is not a
> feature-expansion pass — no new admin capabilities are introduced beyond making existing declared ones real.

---

## 0. Overview

Admin is broad (19 controllers/services, 24+ Prisma models, 83 frontend pages) and mostly real. A code-inventory flagged
5 suspected gaps; each was independently verified by reading the actual controller/service source (not assumed). Two are
confirmed real and severe, one is confirmed real but narrower/different than described, one is not a gap, and one
(login-customizer parity) turned out to be an instance of the first gap, not a separate issue.

| # | Suspected gap | Verdict |
|---|---|---|
| 1 | Permission registry missing `admin.user-group.*` / `admin.security.*` | **CONFIRMED — and more severe than described** (see P0-1) |
| 2 | Some frontend pages call endpoints that don't fully exist | **Not found as a separate issue.** Spot-checked login-customizer — real, wired backend. The actual defect underneath is P0-1, not missing endpoints. |
| 3 | Workflow/automation-rules engine may be CRUD-only with no runtime | **CONFIRMED — no runtime at all** (see P0-2) |
| 4 | Marketplace may be a shallow duplicate of Builder Studio's app-store | **NOT A GAP.** `admin/marketplace.service.ts` directly composes `marketplace/bundle-store.service`, `marketplace/app-provisioning.service`, `marketplace/vendor.service` — the same real engine referenced in Builder Studio. Admin's controller is the admin-facing surface over the one shared engine, not a competitor. No consolidation work needed. |
| 5 | Job scheduler/backup runtime may be CRUD over a table with no worker | **CONFIRMED — worse than described** (see P1-1) |

---

## 1. Root-cause finding common to P0-1 and the "gap 2" false lead

Every admin controller method that appears to declare two permissions, e.g.:

```ts
@Permissions('admin.read')
@Get('users')
@Permissions('admin.user.read')
async getUsers(...)
```

does **not** register two required permissions. `Permissions()` calls `SetMetadata(PERMISSIONS_KEY, permissions)`, which
does `Reflect.defineMetadata` on the same key on the same handler. TS decorators evaluate bottom-to-top, so the
*physically lower* decorator (`@Permissions('admin.user.read')`) executes first and is immediately clobbered by the
*physically higher* one (`@Permissions('admin.read')`), which runs last and wins. `RbacGuard.canActivate` reads via
`reflector.getAllAndOverride(...)`, which returns only the single winning value per handler — it does not merge both.

**Net effect:** across all 19 admin controllers (360 `@Permissions` call sites), only the 4 coarse verbs
(`admin.read` / `admin.create` / `admin.update` / `admin.delete`) are ever actually enforced. Every fine-grained
permission string — `admin.user.read`, `admin.security.read`, `admin.user-group.create`, `admin.automation.update`,
`admin.platform.read`, `admin.marketplace.*`, etc. — is dead code. It is never seen by the guard, so:

- Any role granted `admin.read` can read *every* admin sub-resource (users, security audit logs, sessions, MFA config,
  user groups, automation rules, GDPR erasure requests, marketplace submissions...) — there is no way today to grant a
  role, say, "read audit logs but not manage user groups."
- The Access Control admin UI, once the registry is filled in with these fine-grained codes, would be lying to
  administrators: toggling `admin.user-group.create` on/off for a role would visibly change in the UI but have zero
  effect on actual authorization.
- This is a superset of the "missing registry entries" framing in the original ask — filling in the registry alone
  (without fixing the decorator stacking) would make the problem worse, not better, by giving admins a false sense of
  granular control.

This single root cause is why P0-1 is scoped as a code fix + registry fix together, not a registry-only fix.

---

## P0 — Must fix before Admin can be called "fully packed"

### P0-1: Fix dead fine-grained RBAC across all Admin controllers + fill permission registry

**Problem & user:** As a Tenant Admin persona (see `.ai/GLOSSARY.md` RBAC), I need to grant a support-desk role
"view security audit logs" without also granting "manage user groups," because both currently collapse to the same
coarse `admin.read`/`admin.update` gate. Today that separation is impossible — it's cosmetic in the source code but
inert at runtime.

**Existing coverage:** `packages/shared/src/permissions/registry.ts` has admin entries only for
`user/role/setting/access-package/demo/localization` (lines 9–26). Controllers reference ~30 additional fine-grained
codes (`admin.security.*`, `admin.user-group.*`, `admin.automation.*`, `admin.platform.*`, `admin.marketplace.*`,
`admin.operations.*`, `admin.org-hierarchy.*`, `admin.bulk-operation.*`, `admin.custom-field.*`, `admin.data-quality.*`,
`admin.delegation.*`, `admin.gdpr.*`, `admin.import-export.*`, `admin.recycle-bin.*`, `admin.subscription.*`,
`admin.alert.*`, `admin.announcement.*`) that exist in source but are unreachable at runtime due to the decorator bug.

**Scope:**
- In scope: every `admin/*.controller.ts` file (19 files). Replace each duplicated `@Permissions(coarse)` +
  `@Permissions(fine)` pair with a single `@Permissions(fine)` call (the fine-grained one is always the intended,
  more specific permission — confirmed by reading each pair). Register every one of those fine-grained codes in
  `packages/shared/src/permissions/registry.ts` with an exact-string match to the controller's runtime value (apply
  the same verification method used in the Connect module fix: grep every `@Permissions(...)` call site in each
  controller and diff against registry codes until zero drift).
- Out of scope: introducing brand-new permission granularity beyond what controllers already declare (e.g. do not
  invent field-level or record-level permissions for Admin in this pass — endpoint-level parity is the bar).
- Out of scope: changing which roles are seeded with which permissions by default (that's a follow-on seed-data/UAT
  concern, not a spec-writing concern here — flag to business-analyst-uat once shipped).

**User stories:**

- **US-P0-1a**: As a Tenant Admin, I want each Admin sub-resource (users, roles, settings, access packages, user
  groups, security/audit/sessions/MFA/SSO/password-policy, automation rules, marketplace, operations, org hierarchy,
  bulk operations, custom fields, data quality, delegation, GDPR, import/export, recycle bin, subscription, alerts,
  announcements) to have its own independently assignable read/create/update/delete permission, so I can build
  least-privilege roles.
  - **Given** a role has `admin.security.read` but not `admin.user-group.read`
    **When** a user with that role calls `GET /admin/security/audit-logs`
    **Then** the request succeeds (200)
  - **Given** the same role
    **When** that user calls `GET /admin/user-groups`
    **Then** the request is rejected (403)
  - **Given** a role has only the coarse legacy `admin.read`
    **When** that user calls any admin sub-resource read endpoint
    **Then** the request is rejected (403) — coarse `admin.read` must no longer function as a backdoor once fine-grained
    permissions are the enforced ones (this is an intentional breaking change to existing role definitions — see
    Dependencies below)

- **US-P0-1b**: As a developer verifying RBAC integrity, I want an automated check that every `@Permissions(...)`
  string used anywhere in `apps/api/src/modules/admin/**` has an exact corresponding entry in the permission registry,
  so drift (like the one found here) cannot silently reoccur.
  - **Given** the full admin controller set
    **When** a script/test greps every `@Permissions(...)` literal and diffs against `PERMISSION_REGISTRY`
    **Then** zero unregistered codes are reported
  - **Given** the registry
    **When** the same script checks for entries whose `code` has no corresponding `@Permissions(...)` call anywhere
    **Then** report (not necessarily fail) orphaned entries for cleanup

**Dependencies & sequencing:** No module dependency blockers (admin is Phase 0, foundational). Sequencing risk is
**data**, not code: once coarse `admin.read/create/update/delete` stop being sufixed as a backdoor, any role currently
relying on only the coarse grant (e.g. a seeded "Admin" role with `["admin.read","admin.create","admin.update","admin.delete"]`
and nothing else) will lose access to sub-resources unless it's re-seeded with the fine-grained set too. This must ship
together with a seed/migration data pass — flag explicitly to backend-developer and business-analyst-uat before this
goes to any environment with real assigned roles.

**Cross-cutting requirements:**
- Every fixed endpoint remains tenant-scoped (`TenantInterceptor` already applied — verify not accidentally removed).
- RBAC permission strings for the corrected fine-grained codes must be documented in the registry with `module`,
  `resource`, `action`, `level: 'endpoint'`.
- No `@TrackChanges` changes needed — this is a permissions-only fix, no entity-mutation contract changes.

**Success metrics:** Zero drift between controller `@Permissions` literals and registry (proven by the US-P0-1b check).
Access Control admin UI can grant/revoke each admin sub-resource permission independently and it visibly changes
authorization behavior in a live test.

---

### P0-2: Automation Rules — build a real execution engine (or explicitly relabel as "rule designer, not yet live")

**Problem & user:** As an Ops Admin, when I create an automation rule ("when a Purchase Order is approved, notify
the requester") and set its status to ACTIVE, I expect it to actually fire when that event happens in the system.
Today, nothing fires it — ever.

**Existing coverage:** `AutomationRulesService` (`apps/api/src/modules/admin/automation-rules.service.ts`) is pure
CRUD (`getRules`/`getRule`/`createRule`/`updateRule`/`deleteRule`) plus a `testRule` method that evaluates the rule's
stored `conditions` against a `sampleData` object supplied manually by the caller in the request body, and returns
what actions *would* fire — it never executes the `actions` array against the real system, and there is no
`@OnEvent`/`EventEmitter2` listener anywhere in the admin module or elsewhere in `apps/api/src` that reads
`AutomationRule` rows and reacts to real domain events. `AutomationRuleExecution` rows are only ever created by
`testRule` with `status: 'TEST'` — there is no `status: 'LIVE'` or equivalent ever written.

**Scope:**
- In scope: a minimal, real trigger→condition→action runtime for the trigger types the schema already supports
  (confirm exact `trigger` string values already in use by reading `BuilderForm`/existing seeded rules — do not invent
  new trigger types beyond what's already modeled).
- In scope: wiring at least the domain events already emitted elsewhere in the codebase (e.g. `order.confirmed`,
  `invoice.paid`, `purchase.received` — confirm exact event names via grep before backend-developer starts) to a
  listener that loads ACTIVE `AutomationRule` rows matching that trigger for the tenant, evaluates `conditions`, and
  executes `actions` for real (starting with the action types that have a real downstream: send notification, send
  email — reuse existing `NotificationsGateway`/email queue, not new infra).
- Out of scope (this pass): a visual rule/condition builder UI overhaul (tracked separately in Studio's own backlog,
  `.ai/DEV_SPRINTS.md` Phase 2 "Business Logic" item — do not duplicate).
  Out of scope: every possible action type (webhooks, cross-module writes) — ship notify+email actions first, others
  become a P2 follow-up once the runtime shape is proven.
  Out of scope: a distributed/queued execution model — synchronous in-process execution triggered by the existing
  event emitter is acceptable for this pass; move to the BullMQ queue only if volume becomes a real concern later.

**User stories:**

- **US-P0-2a**: As an Ops Admin, I want an ACTIVE automation rule to actually execute when its trigger event occurs
  in the real system, so automation rules are not purely decorative.
  - **Given** an ACTIVE automation rule with trigger `X` and a condition that matches
    **When** a real domain event `X` fires for that tenant
    **Then** an `AutomationRuleExecution` row is created with `status: 'SUCCESS'` (not `'TEST'`) and the declared
    actions are actually performed (e.g. a real notification row/email is created)
  - **Given** the same rule but the condition does not match the event payload
    **When** the event fires
    **Then** an execution row is recorded with `status: 'SKIPPED'` (or equivalent) and no action is performed
  - **Given** a DRAFT (non-ACTIVE) rule
    **When** its trigger event fires
    **Then** nothing executes — DRAFT rules are inert by design

- **US-P0-2b**: As an Ops Admin, I want to see real execution history (not just test runs) on the automation rules
  page, so I can verify a rule is actually working in production.
  - **Given** a rule has fired 3 times for real events
    **When** I view `GET /admin/automation-rules/executions?ruleId=...`
    **Then** I see 3 rows with real trigger payloads and timestamps, distinguishable from TEST runs

**Dependencies & sequencing:** Depends on knowing the exact domain event names already emitted by other modules
(sales, procurement, finance) — a fullstack/backend-developer must grep `EventEmitter2`/`@OnEvent` usage
project-wide before wiring triggers, to avoid inventing event names that don't exist (respect the "no direct
cross-module imports" rule — this listens to already-emitted domain events, it does not import other modules'
services directly). No blocking phase dependency; Admin (Phase 0) already sits above all modules in the interaction
map as the orchestrator.

**Cross-cutting requirements:** Tenant-scoped execution (rules must only fire against events from their own tenant).
RBAC: existing `admin.automation.*` codes apply once P0-1 fixes them. Change history not applicable (executions are
an append-only log, not a mutated entity).

**Success metrics:** A rule created in the UI with a real trigger fires within the same request/transaction cycle as
the triggering event, verified by an integration test that emits the event and asserts a side effect (notification
created), not just a `testRule` sample-data call.

---

## P1 — Should fix, high value but not blocking a "works end-to-end" claim for the rest of the module

### P1-1: Operations — stop fabricating backup data; connect Background Jobs UI to something real

**Problem & user:** As a Tenant/Platform Admin relying on the Backups page to confirm disaster-recovery coverage,
I need the listed backups to be real files I could actually restore from — not randomly generated metadata with no
file behind it. Separately, when I click "Retry" on a failed background job, I expect it to actually re-run.

**Existing coverage:** `OperationsService.getBackups`/`createBackup` (operations.service.ts) store a JSON blob in the
`Setting` table with `sizeBytes: Math.round(15000000 + Math.random() * 500000)` — a fabricated number, no `pg_dump`
process, no file written anywhere, no download endpoint that could serve real bytes. Separately, a real BullMQ setup
exists (`apps/api/src/common/queues/queue.module.ts`: `email`, `export`, `payroll`, `data-import` queues with real
processors), but `OperationsService.getBackgroundJobs`/`retryJobs` only read/write the `BackgroundJob` **Prisma
table** — grepping confirms zero references from `common/queues/*` to that table. The admin "Background Jobs" page
and the real job queues are two unconnected systems; retrying a "failed job" flips a DB row that nothing consumes.

**Scope:**
- In scope: either (a) make `createBackup` actually invoke a real `pg_dump` (or equivalent) against the configured
  Postgres connection, store the artifact in the existing MinIO/S3 client already used by Drive, and make "download"
  serve real bytes — or (b) if a real backup pipeline is infra-owned and out of scope for this module pass, relabel
  the UI copy/API response honestly (e.g. `source: 'SIMULATED'` flag surfaced to the frontend) so it stops presenting
  fabricated data as real DR coverage. Recommend (a) for backups given MinIO/S3 infra already exists project-wide
  (Drive module precedent) — devops-engineer to confirm feasibility of shelling out to `pg_dump` from the API
  container before committing to (a).
- In scope: connect `BackgroundJob` Prisma rows to the real BullMQ queues — either by having the existing processors
  (`EmailProcessor`, `ExportProcessor`) write/update a `BackgroundJob` row per job lifecycle event (so the admin UI
  reflects real queue state), or by having `retryJobs` actually re-enqueue into the correct BullMQ queue by
  `queueName` instead of only flipping a DB status flag.
- Out of scope: adding new queues/processors beyond the 4 that already exist (`email`, `export`, `payroll`,
  `data-import`) — scheduled-task-triggered jobs (`triggerTask`) that don't map to one of these 4 real queues are a
  separate, smaller follow-up (P2, see below) since scheduled tasks currently have no defined handler contract at all.

**User stories:**

- **US-P1-1a**: As a Platform Admin, I want "Create Backup" to produce a real, restorable database dump, so the
  Backups page is a trustworthy DR tool.
  - **Given** I click "Create Backup"
    **When** the operation completes
    **Then** a real file exists in object storage with actual content matching the current database state, and its
    `sizeBytes` reflects the real file size, not a random number
  - **Given** a backup exists
    **When** I click "Download"
    **Then** I receive the real dump file, not a 404 or empty response

- **US-P1-1b**: As a Platform Admin, I want the Background Jobs monitor to reflect the real state of the email/export/
  payroll/data-import queues, so "Retry" actually does something.
  - **Given** a job in the `export` BullMQ queue fails
    **When** I view `GET /admin/operations/jobs`
    **Then** I see that failure reflected (queue name, failed count) sourced from real BullMQ state (directly via
    `Queue.getJobCounts()` or via a `BackgroundJob` row kept in sync by the processor)
  - **Given** that failed job
    **When** I click "Retry"
    **Then** the job is actually re-enqueued into BullMQ and re-attempts execution (not just a DB status flip)

**Dependencies & sequencing:** Depends on devops-engineer sign-off on shelling out `pg_dump` from within the API
container (or an equivalent managed-Postgres backup API if this runs against a cloud Postgres in some environments —
confirm target deployment before committing to implementation). No module dependency blockers otherwise.

**Cross-cutting requirements:** Tenant scoping is nuanced here — a full Postgres backup is instance-wide, not
per-tenant, so `admin.operations.*` for backups should likely be gated to Platform/Super-Admin only, not per-tenant
Admin (flag to backend-developer/security-auditor to confirm the right RBAC boundary — this may need a
`system.operations.backup` style permission distinct from tenant-scoped `admin.operations.*`, similar to the existing
`@SkipTenantScope()` precedent for `SuperAdminController`).

**Success metrics:** A created backup can be verified (checksummed/restored) as real. A retried job produces a real
BullMQ execution attempt with a real success/failure outcome, not a permanently-PENDING DB row.

---

## QA findings (post-implementation, 2026-07-02)

- **Major, FIXED**: `AutomationRuleEngineService.executeRule` threw an unhandled `TypeError` when
  a rule's `conditions`/`actions` JSON column held a malformed non-array value, which both lost
  the audit trail for that rule (violating US-P0-2b) and aborted processing of every sibling rule
  in the same trigger batch. Fixed: `executeRule` now explicitly validates conditions/actions
  shape and throws a descriptive error instead of hitting `.filter()` on non-array data; the
  per-rule loop in `runTriggersFor` now catches any such error, records a `FAILED` execution row,
  and continues to the next rule. Regression test:
  `apps/api/src/modules/admin/tests/automation-rule-engine.tenant-isolation-and-edge-cases.spec.ts`.
- **Minor, tracked as P2**: firing the identical domain event twice (duplicate delivery) causes
  an automation rule to execute twice — no idempotency guard exists. Acceptable under today's
  synchronous in-process, at-most-once emitter semantics; must be revisited before P0-2's
  explicitly-deferred move to a queued/at-least-once delivery model (see P2 item below).

## P2 — Backlog (explicitly deferred, not blocking "fully packed")

- **Automation rule execution idempotency**: no dedupe guard against duplicate domain-event
  delivery double-executing a rule's actions. Deferred alongside the queued-execution follow-up
  (see below) — the two should be solved together once real at-least-once delivery is in play.

- **Scheduled Tasks → real handler dispatch**: `triggerTask` creates a `BackgroundJob` row with `jobType: task.handler`
  but no processor exists that switches on arbitrary `handler` strings. Needs a small dispatch table once P1-1's
  queue-connection pattern is proven. Deferred because it's a narrower version of the same fix, best done right after
  P1-1 lands so it can reuse the same wiring rather than inventing a second pattern.
- **Marketplace app discovery/versioning depth**: confirmed NOT a duplicate of Builder Studio's engine (see Overview).
  No work item here. If a genuine marketplace UX gap is found later (e.g. dependency-resolution edge cases), scope it
  against `marketplace/` package directly, not `admin/marketplace.*`.
- **Seed-data re-alignment for existing roles** after P0-1 ships (roles relying on coarse `admin.read/create/update/delete`
  need fine-grained grants added so they don't silently lose access). Tracked here as a reminder but the actual work
  belongs to whichever pass implements P0-1 — call it out explicitly in that PR, do not silently ship a breaking
  RBAC change without a paired seed update.
- **Visual workflow/business-logic builder UI** — already tracked in `.ai/DEV_SPRINTS.md` (Studio Phase 2). Not
  duplicated here.

---

## Next agents

1. **uiux-designer** — review P0-1's impact on the Access Control admin UI (no new pages needed, but verify the
   role-permission matrix UI can render ~30 newly-live fine-grained permissions per category without becoming
   unreadable; consider grouping by sub-resource in the matrix view). Review P1-1's Backups page copy if option (b)
   ("relabel as simulated") is chosen instead of a real `pg_dump` implementation.
2. **backend-developer** — implement P0-1 (decorator fix + registry fill, with the drift-check test from US-P0-1b),
   P0-2 (automation rule execution engine wired to real domain events), and P1-1 (real backup generation +
   BullMQ↔BackgroundJob connection), pending devops-engineer confirmation on `pg_dump` feasibility.
3. **data-architect** — confirm no schema changes are needed for P0-1/P0-2 (both should be achievable on existing
   models: `AutomationRule`, `AutomationRuleExecution`, `BackgroundJob`); advise if `AutomationRuleExecution.status`
   needs a new enum value (`SUCCESS`/`SKIPPED` vs. existing `TEST`).
4. **qa-tester** — write the permission-drift regression test (US-P0-1b) first, before the fix, so it fails red then
   green; write integration tests proving real event→rule→action execution (US-P0-2a) and real backup/job retry
   behavior (US-P1-1).
5. **security-auditor** — review the RBAC boundary question raised in P1-1 (tenant-scoped vs. platform-scoped backup
   permission) before implementation; re-verify no other module has the same duplicate-`@Permissions`-decorator
   pattern found here (this may not be admin-specific — a project-wide grep is warranted as a follow-up).
6. **business-analyst-uat** — do not sign off P0-1 until the seed-data re-alignment (P2 item) is confirmed shipped
   alongside it; a role losing access silently would fail UAT even if the code is technically correct.
