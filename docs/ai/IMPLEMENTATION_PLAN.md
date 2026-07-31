# IMPLEMENTATION PLAN — The AI Agent Workflow

> **The order of work: Model → Database → API → Auth → UI → Test → Ship.** One file.
> Amended, never replaced. Established 2026-07-30 · Read `README.md` § 0 before editing.

---

## 1. The prime directive

> **Nothing is built out of order, and nothing is built partially.**

Every ERP failure mode traces to the same root: someone built a screen before the data model
was right, or shipped an endpoint before the authorization rule existed. The layer order below
is not a suggestion — it is the mechanism that keeps 45 modules coherent across years and a
rotating cast of AI agents.

```
   ① MODEL          What is this thing? Which context owns it? What events does it emit?
        ▼
   ② DATABASE       Prisma model · tenantId · indexes · migration · RLS policy
        ▼
   ③ API            Zod DTOs · service (all logic) · controller (routing only) · outbox events
        ▼
   ④ AUTH           Permission registered · @Permissions guard · record-level rule · two-tenant test
        ▼
   ⑤ UI             Schema declaration → framework-rendered list/detail/form · tokens only
        ▼
   ⑥ TEST           Unit · integration · tenant isolation · E2E · a11y
        ▼
   ⑦ SHIP           Gates green → changelog → docs amended → push → CI → deploy
```

**A layer is not started until the one above it is complete and its tests pass.** An agent that
writes a React page before the migration exists has failed the task regardless of how the page
looks.

---

## 2. Layer ① — Model (think before typing)

Answer these in writing before the first line of code. If any answer is unclear, the work is
not ready to start.

1. **What is the entity, in the business's own words?** Use the customer's vocabulary, not
   ours. A `SalesOrder` is not a `Transaction`.
2. **Which bounded context owns it?** (`BACKEND_SCHEMA.md § 3`.) Exactly one. If two contexts
   both claim it, the model is wrong — split it.
3. **What is its lifecycle?** Draw the state machine. Which state makes it immutable?
   (`APP_FLOW.md § C4`.)
4. **What events does it emit?** Which other contexts react? Those are outbox events, not
   direct calls.
5. **Who may see it, and who may change it?** Enumerate the permissions now, not at layer ④.
6. **Does it already exist?** Search the schema and the module list first. **Duplicate entities
   are the single most common failure of multi-agent development.**
7. **What must never happen to it?** Write the invariant down; it becomes a test.

---

## 3. Layer ② — Database

```
1  Add the model to schema.prisma following the universal contract (BACKEND_SCHEMA § 2)
2  tenantId + @@index([tenantId]) + @@index([tenantId, <default sort column>])
3  Money → Decimal(19,4). Status → enum. Timestamps → UTC DateTime.
4  pnpm db:migrate --name <module>_<change>
5  READ THE GENERATED SQL LINE BY LINE. Never trust it unreviewed.
6  Add the RLS policy for the new table (it is NOT automatic for new tables)
7  Add seed data for local development
8  pnpm migration:discipline && node scripts/check-rls-verify.mjs
```

**Blocking conditions:** no `tenantId` · no RLS policy · `Float` on money · a hand-edited
historical migration · destructive DDL · a migration that locks a large table.

---

## 4. Layer ③ — API

```
apps/api/src/modules/<module>/
├── dto/<entity>.dto.ts        Zod schemas — EXPORTED, because the UI imports the same object
├── <entity>.service.ts        ALL business logic. The only file that touches Prisma.
├── <entity>.controller.ts     Routing, HTTP status, serialisation. Zero logic.
├── events/<entity>.events.ts  Outbox event definitions + consumers
└── tests/                     *.service.spec.ts, *.controller.spec.ts
```

**Rules**

- The controller contains no `if`. If it does, that logic belongs in the service.
- The service is the only layer aware of Prisma. Nothing else imports the client.
- Writes run inside the tenant-scoped transaction client. Always.
- Cross-module effects go into the **outbox, inside the same transaction**. Never a direct
  import of another module's service; never a bare `EventEmitter2` for a critical fact.
- Errors are typed domain errors mapped to RFC 7807 problem responses.
- Pagination, filtering, and sorting are **server-side**, with `limit ≤ 100`.
- OpenAPI annotations are mandatory — the frontend's types are generated from them, never
  hand-written.

---

## 5. Layer ④ — Auth (never deferred, never "added later")

```
1  Register the permission in packages/shared/src/permissions/registry.ts
       'sales.order.approve'
2  @Permissions('sales.order.approve') on the endpoint     ← CI fails without it
3  Apply the record-level rule (own | team | org | all)
4  Add the permission to the appropriate default roles
5  WRITE THE TWO-TENANT TEST — tenant B must get zero rows, not filtered rows
6  Verify the endpoint returns 403 (not 404, not 500) for an unauthorised user
```

> **"I'll add permissions after the feature works" is how every ERP breach starts.**
> The guard is written in the same commit as the endpoint or the commit is rejected.

---

## 6. Layer ⑤ — UI

```
1  Declare the entity schema for @unerp/framework
       fields · list columns · form layout · validation (the SAME Zod schema as the API)
2  The framework renders list, detail, and form. Do not hand-build these.
3  Custom UI only where the schema genuinely cannot express it — and justify it in the PR.
4  Compose from @unerp/ui-* only. If a component does not exist, add it TO THE PACKAGE
   (with a Storybook entry), not locally to the page.
5  Design tokens only. A literal hex or px value fails the build.
6  Handle all six states: loading · empty · filtered-empty · error · forbidden · partial
7  Breadcrumb registered · ChangeHistory component on the detail page ·
   ProtectedComponent around every privileged control
8  Keyboard complete · axe clean · works at 320px and at 200% zoom
9  Mobile (Flutter) and desktop (Tauri) parity, or a logged Tier-4 exemption
```

---

## 7. Layer ⑥ — Test

| Type                 | Scope                                                   | Bar                                   |
| :------------------- | :------------------------------------------------------ | :------------------------------------ |
| **Unit**             | Service business logic, calculations, state transitions | ≥ 80%; **100% on financial maths**    |
| **Tenant isolation** | Every protected table                                   | Mandatory. Non-negotiable.            |
| **Permission**       | Every endpoint                                          | Authorised → 200; unauthorised → 403  |
| **Integration**      | Service ↔ database ↔ outbox                             | Happy path + every failure branch     |
| **Contract**         | OpenAPI ⇄ generated client                              | No drift permitted                    |
| **E2E**              | Every user-facing flow in `APP_FLOW.md`                 | Playwright                            |
| **Accessibility**    | Every new screen                                        | axe, zero violations                  |
| **Load**             | Endpoints on hot paths                                  | p95 < 300 ms under target concurrency |

**Tests assert behaviour, not implementation.** A test that breaks on a refactor without a
behaviour change is a badly written test.

---

## 8. Layer ⑦ — Ship

```
1  pnpm verify                      ← the full local gate; must be green
2  Append ONE line to docs/ai/CHANGELOG.md
3  Amend the relevant master doc if an interface, schema, or flow changed
4  Commit — conventional commit format, explaining WHY
5  git pull --rebase && push       ← pre-push runs every gate again
6  CI runs every gate server-side  ← red pipeline is never merged, never bypassed
7  Green main ⇒ automatic staging deploy ⇒ manual approval ⇒ production
```

---

## 9. The two agents

### 9.1 `feature-architect` — the DEV flow

Builds new capability and scales the platform.

```
① ORIENT     read PRD + this plan + the target module's current state
             check CHANGELOG for recent related work — never duplicate
② SELECT     priority ladder, strictly in order:
                1. broken build or failing gate
                2. open security / critical issue
                3. foundation remediation (ARCHITECTURE_REVIEW § R1–R8)
                4. unfinished work from a previous cycle
                5. deepening an existing module
                6. new capability
③ PLAN       write the layer ①–⑦ breakdown before coding
④ BUILD      layers ② → ⑦ in order, end to end, no partial slices
⑤ VERIFY     pnpm verify green; the suppression ratchet must go DOWN, never up
⑥ RECORD     one CHANGELOG line; amend master docs if interfaces changed
⑦ REPORT     what was built, what was proven, what is now possible
```

**Every cycle carries a mandatory debt quota:** remove `@ts-nocheck` from **at least one
complete module** and fix the resulting type errors properly. Feature work does not exempt an
agent from this. See `ARCHITECTURE_REVIEW.md § R1`.

### 9.2 `security-sentinel` — the QA flow

Finds and eliminates defects in code that already exists.

```
① SCAN       security first, in this order:
                tenant isolation → authz → injection → secrets → crypto →
                dependencies → input validation → business-logic flaws →
                DoS/resource exhaustion → data integrity
② PROVE      write a FAILING TEST that demonstrates the flaw.
             No reproduction, no finding. Speculation is not a vulnerability.
③ FILE       one issue per flaw, with severity, blast radius, and the reproduction
④ FIX        at the ROOT CAUSE. If the same class of bug can recur, fix the class:
             add a lint rule, a CI gate, or a framework-level guard.
⑤ VERIFY     the failing test now passes; run the full suite for regressions
⑥ CLOSE      link the fix to the issue; one CHANGELOG line
```

**Severity → response time:** Critical (tenant leak, auth bypass, RCE) — stop everything,
fix now. High — within the cycle. Medium — filed and scheduled. Low — filed and batched.

### 9.3 How they interlock

```
   feature-architect ──▶ builds ──▶ security-sentinel audits ──▶ findings ──▶ feature-architect fixes
        ▲                                                                          │
        └──────────────────────────────────────────────────────────────────────────┘

   Cadence: security-sentinel runs a full audit every 10th feature cycle,
            and unconditionally before any production release.
```

**Neither agent may relax a gate.** If a check fails, the code is wrong — not the check. An
agent that adds `@ts-nocheck`, `eslint-disable`, `continue-on-error`, or `--no-verify` to make
a pipeline green has caused a production incident, not delivered a feature.

---

## 10. Phase plan

### Phase 0 — Foundation restoration ⬅ **WE ARE HERE. Nothing else starts until this is done.**

The platform is broad but structurally compromised (`ARCHITECTURE_REVIEW.md`). Feature work
during Phase 0 is limited to what is required to prove the foundation.

| #   | Work                                                               | Exit criterion                               |
| :-- | :----------------------------------------------------------------- | :------------------------------------------- |
| R1  | Eliminate `@ts-nocheck` from all 3,241 files                       | Zero suppressions; ratchet baseline at 0     |
| R2  | Split the 40,577-line schema into per-domain files                 | No file over 3,000 lines                     |
| R3  | Wire RLS verification into CI; close every gap                     | 100% of tenant tables policied and tested    |
| R4  | Rearchitect CI/CD; no path to production without green gates       | Deploy is automatic, reversible, and gated   |
| R5  | Repo hygiene — remove one-off scripts, temp files, debug artifacts | Clean `git status`, no scratch files tracked |
| R6  | Coverage gate that can actually fail a build                       | ≥ 80% enforced                               |
| R7  | Dependency and licence scanning enforced                           | Zero high/critical; zero non-open licences   |
| R8  | Observability: SLOs, dashboards, alerts, runbooks                  | On-call can diagnose without reading code    |

### Phase 1 — Depth

Bring every existing module to genuine production quality: complete the state machines, close
the report gaps, finish cross-platform parity, reach performance targets under load.

### Phase 2 — Intelligence

Deliver the AI layer from `PRD.md § 5.3` — document intelligence, anomaly detection,
forecasting, autonomous tenant agents — all local-first, all permission-scoped, all reversible.

### Phase 3 — Ecosystem

Marketplace, partner extension SDK, certified integrations, vertical templates, self-serve
onboarding at scale.

### Phase 4 — Scale

Multi-region, cell-based tenancy, earned service extraction, 10,000-tenant capacity proven by
load test rather than by argument.

---

## 11. Anti-patterns — automatic rejection

| Anti-pattern                                    | Why it is rejected                                 |
| :---------------------------------------------- | :------------------------------------------------- |
| UI before API before database                   | Produces a mock, not a feature                     |
| `@ts-nocheck` / `@ts-ignore` / `eslint-disable` | Disables the guarantee the gate exists to provide  |
| `--no-verify`, `continue-on-error`, `\|\| true` | Turns a blocking gate into a decoration            |
| Endpoint without `@Permissions`                 | Security defect, shipped                           |
| Table without `tenantId` + RLS                  | Tenant-isolation breach, shipped                   |
| Direct cross-module import                      | Destroys the module boundary permanently           |
| Hardcoded hex or px                             | Breaks theming and density for every user          |
| Hand-rolled `<table>`                           | Loses sorting, pagination, a11y, and consistency   |
| `Float` for money                               | Silent financial corruption                        |
| New file in `docs/ai/`                          | Fragments the source of truth (`README.md` rule 1) |
| Rewriting a master doc                          | Destroys institutional memory (`README.md` rule 2) |
| Work with no CHANGELOG entry                    | Invisible to every future agent; gets duplicated   |
| Committing a secret                             | Immediate rotation + incident                      |

---

## 12. Amendment log

| Date       | Change                                                          | By          |
| :--------- | :-------------------------------------------------------------- | :---------- |
| 2026-07-30 | Document established; Phase 0 defined as foundation restoration | Claude Code |
