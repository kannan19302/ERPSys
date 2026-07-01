# Enterprise Hardening Plan — UniERP

> Owner: Architecture. Created: 2026-07-01. Status: **living document**.
> Goal: move UniERP from "heuristic 10/10" to genuine enterprise-grade
> (SAP / Oracle / Dynamics / NetSuite-class) readiness.
> Companion to `.ai/SCORECARD.md` (heuristic) and `.ai/DEV_SPRINTS.md` (Studio-only).

---

## 0. Ground truth (measured 2026-07-01)

| Metric | Value | Note |
| --- | --- | --- |
| API modules | 34 | modular monolith (NestJS) |
| TS/TSX LOC | ~75,835 across 1,522 files | |
| Prisma models | 362 (7,662-line schema) | `tenantId` used 853× → shared-DB row-scoping |
| Test files | 126 | run **one-at-a-time** via `run-tests-sequential.ps1` |
| TODO/FIXME/HACK | 4 | low surface debt |
| `console.*` in api/src | 7 | should be 0 (structured logging) |
| API typecheck | ✅ green | `tsc --noEmit` clean |
| Web typecheck | ❌→✅ | had 4 errors masked by config; fixed 2026-07-01 |

### The headline problem
`.ai/SCORECARD.md` reports **10/10 system-wide**, but the score is produced by
`scripts/scorecard.mjs`, which checks for the **presence** of decorators
(`@Permissions`, `@ApiOperation`, zod pipes) — not correctness, compilation, or
runtime behavior. Evidence it is not ground truth:

- `apps/web/next.config` sets `typescript.ignoreBuildErrors: true` **and**
  `eslint.ignoreDuringBuilds: true`. The web app shipped with **type errors**
  (incl. one in the latest CRM commit) and still "built".
- The API test runner exits on first failure and runs sequentially to dodge a
  memory leak — so "tests pass" has never meant a full parallel green run.

**Goodhart's law**: the scorecard became the target and stopped measuring
readiness. Fixing this measurement gap is Phase 0.

---

## Phased roadmap

Each phase leaves the system working, is independently shippable, and ends with
a commit. No big-bang rewrites.

### Phase 0 — Restore honest quality gates  *(in progress)*
1. [x] Green `tsc` on web (3 masked errors fixed).
2. [ ] Add `typecheck` script to web + api; wire `tsc --noEmit` into `turbo` + CI.
3. [ ] Remove `ignoreBuildErrors` / `ignoreDuringBuilds` from `next.config` once
       green (fail the build on type/lint regressions).
4. [ ] Fix the test runner: root-cause the vitest worker memory leak, restore
       parallel `vitest run`, stop exiting on first failure. Real full-suite green.
5. [ ] Upgrade `scripts/scorecard.mjs` to fold in **real** gates: does it compile?
       does the full test suite pass? coverage thresholds? Presence-checks stay
       but can no longer produce a 10 on their own.
**Exit:** CI runs typecheck + lint + full parallel tests on both apps and fails
on regression; scorecard reflects compile/test reality.

### Phase 1 — Architecture guardrails & god-class decomposition
- God-classes to split (SRP): `builder.service.ts` (2,905), `crm.service.ts`
  (2,330), `crm.controller.ts` (66 KB), `inventory.service.ts` (1,792),
  `advanced-finance` (1,281), `procurement` (1,252), `manufacturing` (1,227).
  CRM split already begun (`crm-contacts`/`crm-customers` services) — finish it
  as the reference pattern, then apply to the rest.
- Enforce layering with `dependency-cruiser` / ESLint boundaries: controllers
  thin, no business logic in controllers or UI, no cross-module deep imports.
- Standardize DTOs, pagination, filtering, sorting, RFC7807 error shape.
**Exit:** no service > ~600 LOC without justification; boundary lint in CI.

### Phase 2 — Data & tenant integrity
- Verify tenant isolation is enforced **centrally** (Prisma client extension /
  middleware + guard), not re-implemented per query. Audit for IDOR / missing
  `tenantId` filters across 362 models.
- Schema review: indexing strategy, FK completeness, nullable abuse, consistent
  audit columns (createdAt/updatedAt/createdBy/deletedAt) + soft-delete policy.
- Migration safety (expand/contract, no destructive drift). See memory:
  prisma-dev-workflow-gotchas.
**Exit:** tenant-scoping guaranteed by construction; schema lint/report clean.

### Phase 3 — Security hardening (OWASP)
- RBAC that is *actually* enforced (not decorator-presence): permission matrix
  tests. JWT/session review, CSRF, XSS/output encoding, SSRF, file-upload
  validation + scanning, secrets management, security headers, rate limiting,
  audit logging on all mutations, dependency vuln scan in CI.
**Exit:** documented OWASP audit + automated security tests + `npm audit` gate.

### Phase 4 — Observability & ops
- Structured logging + correlation IDs everywhere; remove all `console.*`.
- OpenTelemetry traces/metrics; health/readiness/liveness probes verified.
**Exit:** request traceable end-to-end; zero stray console logging.

### Phase 5 — Testing depth
- Coverage on high-value business logic (finance postings, inventory movements,
  RBAC, tenant scoping); integration + e2e on critical paths; contract tests for
  the public API surface.
**Exit:** meaningful coverage thresholds enforced, not presence heuristics.

### Phase 6 — Frontend architecture
- Fix the data layer: `useApiQuery` should propagate the `select` transform
  return type (two-generic form) so consumers stop casting `ListResponse` →
  array. Drive out `any`. Error boundaries, loading/empty states, a11y pass.
**Exit:** web builds with gates ON; no per-call-site list casts; `any` audited.

### Phase 7 — Delivery & DR
- CI/CD hardening, zero-downtime migrations, blue/green or canary, rollback,
  backup/restore runbook validation.

---

## Governance
- This file is the source of truth for platform-wide hardening; `DEV_SPRINTS.md`
  stays Studio-scoped.
- Every iteration: analyze → smallest safe change → keep green → commit → update
  this file's checkboxes.
