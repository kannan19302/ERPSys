# Studio Module — Pending Work

> Scope: only the **Studio** module (`/builder`). Phase 1 (UI restructure foundation) is done;
> everything below is outstanding.
> Full plan: `~/.claude/plans/complete-ui-restructure-for-compiled-cosmos.md`
> (competitive comparison vs. top-10 low-code + web/CMS players, gap analysis, 5-phase roadmap).
> **Last updated**: 2026-06-28

> **Convention reminder:** `.frappe-*` utility classes are MANDATED (AGENTS.md §CSS), not legacy.
> The bar = `frappe-*` utilities + `@unerp/ui` components together (PageHeader/breadcrumbs/DataTable/Modal/KPICard).

---

## Carried over from Phase 1 (deferred)

- [x] **`web/pages` + `web/canvas`** — `web/pages` header aligned to `PageHeader`, table→`DataTable`, `confirm()`→`ConfirmDialog`. Canvas runs inside iframe (no separate header). ✅ Done.
- [x] **Modal/table modernization** — All 18 Studio subpages modernized to `@unerp/ui` `ConfirmDialog` and `DataTable`. ✅ Done.
- [ ] **Authenticated preview verification** — capture screenshots of Studio Home, the 4 pillar hubs, auto-breadcrumbs, and the Cmd-K palette (needs `infra` + `api` running; dev login `admin@unerp.dev` / `admin123`).

---

## Phase 2 — Parity Gap-Fill (Sprints 2–3)

- [ ] **Visual canvas editors**
  - [ ] Form Builder → true drag-drop canvas (extend `FormBuilderWorkspace.tsx`; `BuilderForm` stores nodes/edges JSON).
  - [ ] Page Builder → free/grid canvas (`PageBuilderWorkspace.tsx`).
  - [ ] Workflow editor → visual node/edge canvas (`WorkflowEditorWorkspace.tsx`; `BuilderWorkflow` nodes/edges).
  - [ ] Business Logic → visual rule/flow editor (replace form-driven automation rules).
- [ ] **Versioning UX** — `/builder/manage/releases`: version-history timeline + diff viewer + one-click restore over existing `AppRelease` snapshots. Backend has releases/rollback in `builder.service.ts`; add a diff endpoint.
- [ ] **Builder RBAC UI** — `/builder/manage/access`: assign edit/publish rights per artifact; reuse `PermissionContext`/`usePermission` from `@unerp/ui`.
- [ ] **Observability / Run Logs** — `/builder/manage/logs`: unified feed aggregating `AutomationRuleExecution` + workflow executions + form submissions + site events.
- [ ] **Component / template library** — shared cross-studio library; extend web `WebTemplate` concept to App Studio components.

**Exit:** visual editors shipped; releases diff/restore live; RBAC + run-logs pages functional.

---

## Phase 3 — AI Layer (Sprints 4–5)

- [ ] **Prompt→artifact generation** — new `apps/api/src/modules/builder/builder-ai.service.ts` (Claude, default `claude-opus-4-8`): app/module, form, workflow, dashboard, page/section.
- [ ] **Wire the Home "Start with AI" box** (currently a stub routing into App Studio) to real generation.
- [ ] **In-editor copilot** — contextual generate / fix / explain + schema & field suggestions in each editor (≥2 editors for exit).
- [ ] **AI site builder** for Web Studio — prompt→site + section regeneration (complements the existing per-site chatbot).

**Exit:** prompt→app and prompt→page produce editable artifacts end-to-end; copilot in ≥2 editors.

---

## Phase 4 — Governance & Enterprise (Sprint 6)

- [ ] **Environments + promotion pipeline** — `/builder/manage/environments`: dev → staging → prod with promote/diff/preview, built on `AppRelease` + `var/tenant-apps` provisioning.
- [ ] **Connector / integration catalog** — reusable data sources & actions usable in forms/workflows/logic.
- [ ] **Audit trail + approval gates** — extend `builder-governance.service.ts`; monitoring/alerts.

**Exit:** an app can be promoted across environments; connector catalog usable in builders.

---

## Phase 5 — Ecosystem & Web Advanced (Sprint 7)

- [ ] Theme/template marketplace.
- [ ] Custom-domain DNS/SSL automation (complete the `WebDomain` verify-only flow).
- [ ] DAM upgrade for assets — folders, transforms, CDN.
- [ ] A/B testing + personalization for Web Studio.
- [ ] Mobile runtime polish.

**Exit:** domain provisioning automated; A/B + DAM live.

---

## Key files

- Nav/IA: `apps/web/src/navigation/{moduleNav.tsx, registry.tsx, useResolvedNav.ts}`
- Studio shell: `apps/web/app/(dashboard)/builder/{layout.tsx, page.tsx}`, `src/components/builder/{StudioCommandPalette,StudioBreadcrumb}.tsx`
- Editors: `apps/web/src/components/builder/{FormBuilderWorkspace,PageBuilderWorkspace,WorkflowEditorWorkspace,DashboardEditorWorkspace}.tsx`
- Manage pages: `apps/web/app/(dashboard)/builder/manage/{releases,environments,logs,access}/page.tsx`
- Backend: `apps/api/src/modules/builder/{builder.service.ts, builder.controller.ts, builder-governance.service.ts}`; new `builder-ai.service.ts` (Phase 3)
- Data/UI: `apps/web/src/lib/{api.ts, hooks/useModuleData.ts, queryKeys.ts}`; `@unerp/ui` (`packages/ui/src/index.ts`)
