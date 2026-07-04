# MASTER_PROMPT.md — The Single Prompt Every Agent Reads Before Starting

> This is the **one** task-template file for UniERP. It replaces the former six separate
> files (`new-module.md`, `new-entity.md`, `new-api-endpoint.md`, `new-ui-page.md`,
> `bugfix.md`, `review.md`) — all deleted. Read this file before starting **any** task,
> per [AGENTS.md rule 19](../../AGENTS.md).

---

## 1. Mission & Scale Goal

Universal ERP System (UniERP) is a composable, multi-tenant, industry-agnostic ERP —
31 modules across phases 0–20, built AI-agent-driven on a TypeScript monorepo
(NestJS + Next.js 15 + Prisma/PostgreSQL).

**Current measured scale**: ~408,300 lines of code as of 2026-07-04, measured via:
```
git ls-files | grep -E '\.(ts|tsx|js|jsx|prisma|css|scss)$' \
  | grep -v node_modules | grep -v dist | grep -v '\.next' \
  | xargs wc -l
```
(counting `.ts`, `.tsx`, `.js`, `.jsx`, `.prisma`, `.css`, `.scss` tracked files, excluding
`node_modules`, `dist`, and `.next`).

**North star**: the owner's goal is **1,000,000+ lines of genuine, production-ready,
non-padded enterprise functionality.** This is not a line-count vanity metric to game —
it is a proxy for "how much real, working ERP capability exists." Every line added must be:

- Real business logic, not stubs, mocks, or `// TODO` placeholders
- Backed by a real data model (Prisma schema, migrations, indexes)
- Exposed via a real, tested API (NestJS controller + service + DTOs)
- Validated (Zod schemas shared frontend/backend)
- Covered by real tests (unit + integration, 80%+ target on business logic)
- Wired end-to-end (DB → API → UI) per the project's "develop End-to-End" rule

Padding line count with generated boilerplate, dead code, or unused scaffolding works
against this goal, not toward it. Growth must be genuine capability growth.

---

## 2. The 3-File Tracking System

UniERP tracks all project state in exactly 3 files — `.ai/MODULE_REGISTRY.md`,
`.ai/CHANGELOG.md`, `.ai/HANDBOOK.md`. This is non-negotiable for every AI agent,
every session, every task, no exceptions — including one-line fixes.

**Full rule, protocol, and Collab Board mechanics**: see
[AGENTS.md § Mandatory Tracking Convention](../../AGENTS.md#-mandatory-tracking-convention--the-3-file-system).
Do not duplicate that text here — read it there; this file only points to it.

---

## 3. Codebase Growth Tracker Protocol

`.ai/MODULE_REGISTRY.md` has a `## Codebase Growth Tracker` table near its top. After any
**substantial** unit of work (a new module, a significant feature, a major refactor —
use judgment; a one-line typo fix does not need a row), add a new dated row:

| Date | Total LOC | Delta | Notable modules/features added that session |
|:---|:---|:---|:---|

1. Re-run the LOC measurement command from § 1 above to get the new total.
2. Compute the delta against the previous row.
3. Add one line summarizing what grew the count (module names, feature names — be
   specific enough that another agent can tell what NOT to rebuild).
4. Append the row — never edit or delete prior rows; this table is append-only, like
   CHANGELOG.md.

This makes growth toward the 1,000,000+ LOC north star visible over time, session to
session, across every agent (Claude Code, Antigravity, Cursor, Copilot, etc.) working on
the repo. If you're editing `MODULE_REGISTRY.md` concurrently with another agent's pass,
add your row as a small, isolated edit near the top of the table to minimize merge
conflicts; if you hit a genuine conflict, re-fetch and retry rather than clobbering the
other agent's row.

---

## 4. Task Templates by Type

### New Module

**Pre-flight**: Read `AGENTS.md`, `.ai/HANDBOOK.md#architecture-reference` Section 3
(Module Structure), `.ai/HANDBOOK.md#coding-conventions`, `.ai/HANDBOOK.md#data-model`,
`.ai/HANDBOOK.md#api-standards`, and check `.ai/MODULE_REGISTRY.md` for existing modules
and potential conflicts/duplication.

**Spec to gather before building**:
- Module description (business purpose, key features)
- Key entities (name + one-line description each)
- Dependencies (modules this depends on; modules that depend on this one)
- Domain events to emit (`module.entity.action` — when/why) and domain events to
  listen to (source module → reaction)

**Build steps**:
1. Create the NestJS module in `apps/api/src/modules/<module-name>/` — `*.module.ts`,
   `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, `events/`, `tests/`
2. Create Prisma models in `packages/database/prisma/schema.prisma` (see § New Entity below)
3. Create shared Zod validators in `packages/shared/src/validators/`
4. Create shared types in `packages/shared/src/types/`
5. Create frontend pages in `apps/web/app/(dashboard)/<module-name>/`
6. Write unit tests for all service methods (target 80%+ coverage)
7. Update `.ai/MODULE_REGISTRY.md` and `.ai/CHANGELOG.md` (§ 2 above)

**Gotcha**: modules never import each other directly — cross-module communication is
domain events only.

### New Entity

**Pre-flight**: Read `.ai/HANDBOOK.md#data-model`, `.ai/HANDBOOK.md#coding-conventions`
§ naming rules, and check existing models in `packages/database/prisma/schema.prisma`
for conflicts.

**Spec to gather**: module owner, description, field table (name/type/required/default/
description), relationships (belongs-to, has-many, many-to-many), indexes (unique +
query-pattern indexes), and business rules (e.g. valid status transitions).

**Mandatory fields on every entity**:
- `id` (CUID2 primary key)
- `tenant_id` (multi-tenancy — never optional)
- `created_at`, `updated_at` (timestamps)
- `created_by`, `updated_by` (audit trail)
- Soft-delete fields if applicable (`deleted_at`, `deleted_by`)
- Money fields as `Decimal(15,2)`
- snake_case column names via `@map()`, plural table name via `@@map()`

**Gotcha**: never hand-edit `prisma/migrations/` — always `pnpm db:migrate --name
<module>_<change>`. Dev DB may have drift; prefer `migrate deploy` + idempotent SQL, and
stop `dev:api` before running `prisma generate`.

### New API Endpoint

**Pre-flight**: Read `.ai/HANDBOOK.md#api-standards`, `.ai/HANDBOOK.md#coding-conventions`,
`.ai/HANDBOOK.md#security` § RBAC requirements, and check the module's existing
controller for conflicts.

**Spec to gather**: method + path (`/api/v1/<module>/<resource>`), description,
permission string (`module.resource.action`), path/query parameters, request body shape,
success response shape (`{ data: ... }`), and error responses (400/401/403/404/422 with
conditions).

**Build steps**:
1. Create/update DTO in `dto/<action>-<entity>.dto.ts`
2. Create Zod validator in `packages/shared/src/validators/`
3. Add service method in `<module>.service.ts`
4. Add controller method in `<module>.controller.ts` with `@Permissions('module.
   resource.action')` and, if it mutates an entity, `@TrackChanges('EntityType')` +
   `@UseInterceptors(ChangeHistoryInterceptor)`
5. Register the permission string in `packages/shared/src/permissions/registry.ts`
6. Write a unit test for the service method and an integration test for the controller

### New UI Page

**Pre-flight**: Read `.ai/HANDBOOK.md#coding-conventions` § React/Next.js conventions,
check `packages/ui/` for available design-system components, and check existing pages
in `apps/web/app/(dashboard)/` for consistency.

**Spec to gather**: route (`/<module>/<resource>`), page type (List/Detail/Create-Edit/
Dashboard), title, description.

**Checklist by page type**:
- **List**: data table with defined columns, sortable/filterable columns, server-side
  pagination, bulk actions, row-click to detail, "Create New" button, empty state,
  loading skeleton.
- **Detail**: header with title + status badge, action buttons, information sections,
  related-data tabs, `<ChangeHistory entityType="X" entityId={id} />` at the bottom,
  breadcrumb navigation.
- **Create/Edit**: form fields, Zod validation from `packages/shared`, cancel
  confirmation on unsaved changes, success toast, redirect to detail page after save.

**Non-negotiables for every page type**: use `@unerp/ui` components only (no ad-hoc
components), Server Components for data fetching / Client Components only where
interactivity requires it, breadcrumbs registered in `SEGMENT_NAMES` in
`apps/web/app/(dashboard)/layout.tsx`, `<ProtectedComponent permission="...">` around
privileged actions, `.frappe-*` utility classes and `design-tokens.css` tokens only (no
inline styles, no hardcoded hex/pixels), and all four data-view states handled (loading,
empty, error, success).

### Bugfix

**Pre-flight**: Read `.ai/HANDBOOK.md#architecture-reference` for system context,
`.ai/HANDBOOK.md#coding-conventions` for error-handling patterns, and check
`.ai/CHANGELOG.md` for recent changes that might be related.

**Spec to gather**: problem description (expected vs. actual), steps to reproduce,
error messages/logs, environment (module, layer, browser if frontend).

**Method**:
1. Identify the root cause — don't just patch the symptom
2. Check whether it's a multi-tenancy issue (`tenant_id` filtering missing/wrong)
3. Check whether it's a permissions issue (`@Permissions` / RBAC guard missing)
4. Check `.ai/CHANGELOG.md` for related recent changes
5. Write a regression test that reproduces the bug **before** fixing it
6. Fix the issue
7. Verify the regression test passes
8. Check whether the same bug pattern exists in other modules
9. Update `.ai/CHANGELOG.md` with the fix (§ 2 above)

**Common patterns to check**:
- *Multi-tenancy*: is `tenant_id` correctly injected by Prisma middleware/extension? Is
  the JWT carrying the right `tenant_id`? Are RLS policies active on the table?
- *Permissions*: does the role have the required permission? Is `@Permissions` applied?
  Is the RBAC guard in the guard chain?
- *Data integrity*: are FK constraints satisfied? Unique constraints violated?
  Soft-delete filtering working?
- *Events*: is the event emitted with the correct name? Is the listener registered with
  `@OnEvent`? Is the payload complete?

### Code Review

**Method**: read the actual diff (`git diff` / `git diff main...HEAD`) before forming
any opinion — never review from a description alone.

**Checklist**:
- **Architecture**: no cross-module imports (domain events only); follows the module
  structure template (`.ai/HANDBOOK.md#architecture-reference` Section 3); no circular
  dependencies; no god-class growth.
- **Type safety**: no `any`; strict-mode compliant; shared types from `@unerp/shared`;
  DTOs validated with Zod.
- **Security**: `tenant_id` on every new table and query; `@UseGuards` + `@Permissions`
  on every controller method; no secrets in code; input validated/sanitized server-side;
  no raw-query SQL injection risk.
- **API standards**: RESTful URLs (plural nouns, kebab-case); correct HTTP
  methods/status codes; consistent `{ data, meta, error }` envelope; pagination on list
  endpoints.
- **Code quality**: naming conventions followed; no `console.log` (structured logger
  only); NestJS exceptions used for error handling; complex logic has "why" comments.
- **Testing**: unit tests for all service methods; edge cases covered (empty, null,
  boundary, duplicate); descriptive test names; no `skip`/`only` hiding failures.
- **Documentation**: `MODULE_REGISTRY.md` and `CHANGELOG.md` updated per § 2 above.
- **Performance**: indexed queries, no N+1 patterns, paginated lists, heavy operations
  via BullMQ.

**Output format**: group findings by severity — Blocker / Warning / Nit — each as
location → rule violated → required fix. If clean, say so explicitly and state what was
checked.
