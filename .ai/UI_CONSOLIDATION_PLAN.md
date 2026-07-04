# UI Consolidation Plan — Fragmented Settings/Admin Pages

> Status: Phase 1 SHIPPED (2026-07-04); Phase 2 (all remaining Settings groups) SHIPPED (2026-07-04, see `.ai/CHANGELOG.md`) — all 9 hubs built, ~45 legacy redirects in place, nav updated, typecheck clean, hub + redirect URLs verified via curl. Phase 3a (CRM/HR/Supply Chain cross-module rollout) SHIPPED (2026-07-04, see `.ai/CHANGELOG.md`) — 4 hubs built (CRM Marketing & Outreach, CRM Sales Enablement, HR Operations & Service, Supply Chain Operations), 15 legacy redirects in place, nav updated, typecheck clean, hub + redirect URLs verified via curl. Phase 3b/3c (POS/Drive, Real Estate/Field Service/Healthcare/Education) remain deferred — see sequencing recommendation below.
> Owner: Product Manager
> Created: 2026-07-04
> Trigger: owner UX observation — many related single-purpose pages in Settings force
> multi-page navigation for one conceptual workflow.
> Duplicate-Feature Gate: no existing consolidation effort found in `.ai/MODULE_REGISTRY.md`
> or `.ai/DEV_SPRINTS.md` (DEV_SPRINTS.md currently tracks only Studio module work). Clear to proceed.

---

## Method

1. Read `apps/web/src/navigation/moduleNav.tsx` in full (every module's sidebar).
2. Measured actual page size (line count as a complexity proxy) for every candidate page under
   `apps/web/app/(dashboard)/settings/**`, plus comparable pages in HR and CRM, before deciding
   consolidate vs. leave alone. Thin config/monitor pages (<200 lines, mostly read-only or a single
   form) consolidate cleanly into tabs. Pages with substantial CRUD/table/detail logic (400+ lines)
   can still consolidate as tabs, but their "create/edit" actions must become modals, not be crammed
   flat onto the page.
3. Rejected consolidation wherever pages represent genuinely distinct operational workflows
   (different mental model, different primary actor, or a data-dense grid/canvas that doesn't fit
   in a modal).

---

## Phase 1 (SHIPPED 2026-07-04) — Identity & Access Hub

**Location**: `apps/web/app/(dashboard)/settings/identity-access/page.tsx` (new), replacing the nav
entries currently pointing at 5 separate pages.

**Merge these pages into one tabbed page:**

| Current page | Lines | New tab |
|---|---|---|
| `settings/users/page.tsx` | 546 | **Users** |
| `settings/groups/page.tsx` | 470 | **Groups & Teams** |
| `settings/access-control/roles/page.tsx` | 441 | **Roles** |
| `settings/access-control/packages/page.tsx` | ~250 | **Access Packages** |

**Structure**: single page, `PageHeader` + `Tabs` (`@unerp/ui`) — Users / Groups / Roles / Packages.
Each tab keeps its own `DataTable` + existing list/filter/search logic (all four already fetch
independently and page-scope their own data — no shared state needed across tabs, so this is a
low-risk merge). "Create User", "Create Group", "Create Role", "Create Package" all open a `Modal`
(Users and Packages already use `Modal` for create; Groups and Roles currently mix inline forms —
must be converted to `Modal` as part of this work, not left as-is). Deep-linking preserved via a
`?tab=` query param so existing bookmarks/links to `/settings/users` etc. 301-equivalent redirect
to `/settings/identity-access?tab=users`.

**Explicitly stays a separate full page** (not merged in):
- `settings/access-control/matrix/page.tsx` (270 lines) — a dense interactive grid
  (role x permission matrix). Cramming a data-dense grid into a tab-within-a-tab or a modal
  actively hurts usability; keep as its own page, but add a "Permissions Matrix" quick-link button
  from the new hub's Roles tab.
- `settings/sso/page.tsx`, `settings/mfa/page.tsx`, `settings/password-policy/page.tsx`,
  `settings/sessions/page.tsx`, `settings/impersonate/page.tsx`, `settings/delegations/page.tsx` —
  these are conceptually **Security Policy**, not **Identity & Access** (who exists / what they can
  do vs. how authentication is enforced). Bundling all 11 original pages into one mega-page was
  rejected as over-consolidation. See Phase 2 candidate below for these instead.

**Nav change**: `moduleNav.tsx` "Identity & Access" section collapses from 4 of its current 11
entries into 1 ("Identity & Access Hub") + keeps Permissions Matrix, SSO, MFA, Password Policies,
Sessions, Impersonation, Delegations as-is for now (Phase 2 decides their fate).

### Acceptance criteria (Phase 1)
- Given a user with `admin.users.read` navigates to `/settings/identity-access`, when the page loads, then all 4 tabs render and the default tab is Users.
- Given a user clicks the Groups tab, when the tab switches, then group list loads independently (no full page reload, no stale Users state bleeding through).
- Given a user with `admin.users.create` clicks "New User" on the Users tab, when the modal opens, submits, and succeeds, then the Users tab's table refreshes in place and the modal closes — no navigation occurs.
- Given a user without `admin.roles.manage`, when they open the Roles tab, then the "New Role" action is hidden/disabled (existing RBAC gating logic must be preserved per-tab, not just once at page level).
- Given someone links to the legacy `/settings/groups` URL, when they land, then they are redirected to `/settings/identity-access?tab=groups` (no 404, no broken bookmark).
- Given the Permissions Matrix link is clicked from the Roles tab, when it navigates, then it goes to the existing standalone `/settings/access-control/matrix` page unchanged.
- All 4 merged pages' existing RBAC permission strings (e.g. `admin.users.read/create/update/delete`, equivalents for groups/roles/packages) are preserved verbatim — this is a UI reorganization, not a permission model change.
- Change-history/audit logging on create/update/delete actions for all 4 entities is unaffected.
- `pnpm --filter web typecheck` passes; existing per-page tests (if any) are ported to the new tab components, not deleted.

---

## Phase 2 — full Settings consolidation (SHIPPED 2026-07-04)

Covers every remaining nav group in `apps/web/src/navigation/moduleNav.tsx`'s Settings block:
Security & Compliance, Automation & Workflows, Branding & Communication, System Operations,
Platform Configuration, Data & Integration, Reports, plus the standalone Identity & Access
leftovers (Permissions Matrix, SSO, MFA, Password Policies, Sessions, Impersonation, Delegations).

**Non-overlap rule applied**: every page below is assigned to exactly one hub tab or kept as
exactly one standalone page. No page appears in two hubs. Where two pages had genuine functional
overlap on inspection (see 2a), the overlap was resolved by merging them into one tab, not by
letting two hubs both claim the capability.

### 2a. Settings → Security Policies hub (APPROVED — supersedes old 2a recommendation)
**New page**: `settings/security-policies/page.tsx`, tabs:

| Current page | Lines | New tab | Notes |
|---|---|---|---|
| `security/page.tsx` | 281 | **Overview** | KPI dashboard (MFA/SSO status, failed logins, compliance score) — becomes the hub's landing tab, deep-links out to other tabs via `Link`, not duplicated logic |
| `sso/page.tsx` | 175 | **SSO** | thin config form |
| `mfa/page.tsx` | 165 | **MFA / 2FA** | thin config form |
| `password-policy/page.tsx` | 163 | **Password Policy** | thin config form |
| `sessions/page.tsx` | 205 | **Active Sessions** | session list/revoke |
| `ip-restrictions/page.tsx` | 276 | **IP & Geo Rules** | list + add/edit rule (form becomes modal) |
| `audit-trail/page.tsx` | 229 | **Audit Trail** | generic entity audit log viewer |
| `login-history/page.tsx` | 191 | **Login History** | same `AuditLog` shape as audit-trail, filtered to auth events only — confirmed near-duplicate on read; this tab reuses the audit-trail table component with a fixed `action=LOGIN*` filter, not a second independent implementation |

**Resolved overlap**: Audit Trail and Login History both render the identical `AuditLog` interface
against `/api/v1/admin/security`. Rather than let one live in a "Security" hub and the other in an
"Audit/Compliance" hub, both are owned here, as adjacent tabs of the same table component with
different default filters. Compliance Reports and GDPR pages (2b) do NOT duplicate this — they are
reports *about* audit data, not another raw log viewer.

**Explicitly stays separate** (unchanged from original Phase 1 note):
- `access-control/matrix/page.tsx` (291 lines, dense grid) — already decided in Phase 1, linked from Identity & Access Roles tab. Do not also link it from here to avoid a second "home" for the same page.
- `impersonate/page.tsx` (211) — sensitive audited action-flow, distinct actor model (admin acting as another user), stays its own page under Identity & Access nav group.
- `delegations/page.tsx` (312) — OOO handoff actor model, distinct from security config, stays its own page under Identity & Access nav group.

### 2b. Settings → Compliance & Data Governance hub (NET NEW, approved)
Security & Compliance group has a second cluster distinct from "Security Policies" above — these
are governance/legal artifacts, not live security controls:

| Current page | Lines | New tab |
|---|---|---|
| `compliance/page.tsx` | 285 | **Compliance Reports** |
| `data-retention/page.tsx` | 284 | **Data Retention Policies** |
| `gdpr/erasure/page.tsx` | 211 | **GDPR Erasure Requests** |
| `gdpr/retention/page.tsx` | 181 | **GDPR Retention Rules** |

New page: `settings/compliance-governance/page.tsx`. `gdpr/page.tsx` (5-line redirect to
`gdpr/erasure`) is replaced with a redirect to `?tab=erasure`. This hub is deliberately **separate
from Security Policies (2a)**: 2a is "how auth/access is enforced right now," 2b is "what we keep,
purge, and report on for regulators" — different actor (compliance officer vs security admin) and
different cadence (policy-setting vs live monitoring). No page appears in both.

### 2c. Settings → Workflow Automation hub, split into two (APPROVED, refines old 2b)
Old 2b's "reconsider" concern is resolved by explicitly splitting monitoring from configuration
into two separate hubs (not one), removing the mental-model mismatch:

**2c-i. Approval Operations hub** (`settings/approval-operations/page.tsx`) — monitoring/live views:
| Current page | Lines | New tab |
|---|---|---|
| `workflows/approvals/page.tsx` | 153 | **Active Approvals** |
| `workflows/bulk/page.tsx` | 118 | **Bulk Approvals** |
| `workflows/analytics/page.tsx` | 100 | **Approval Analytics** |
| `workflows/escalations/page.tsx` | 135 | **Escalation Logs** |

**2c-ii. Workflow Builder hub** (`settings/workflow-builder/page.tsx`) — config/authoring tools:
| Current page | Lines | New tab |
|---|---|---|
| `workflows/templates/page.tsx` | 171 | **Templates** |
| `workflows/routing/page.tsx` | 63 | **Dynamic Routing** |
| `workflows/email/page.tsx` | 90 | **Email Approvals** |
| `workflows/simulation/page.tsx` | 175 | **Simulator** |
| `automation-rules/page.tsx` | 536 | *stays standalone — see below* |

`automation-rules/page.tsx` (536 lines) is excluded from the Workflow Builder hub tabs: it's a
substantially larger, distinct rule-canvas builder (trigger/condition/action editor), not a thin
config form — matches the Phase 1 rule that dense builder/canvas tools stay full pages. Keep as
its own page, linked from the Workflow Builder hub's Templates tab as a related tool (link only,
no shared tab).

`workflows/page.tsx` (242) and `workflows/advanced/page.tsx` (5-line redirect) are landing/redirect
shells for the old flat nav group; both are replaced by redirects into the two new hubs
(`workflows/page.tsx` → `approval-operations`, `workflows/advanced` → `workflow-builder`).

**No overlap between 2c-i and 2c-ii**: "watch approvals in flight" vs. "author the workflow rules
that produce those approvals" are different tools for different moments, per original Phase 2b
reasoning — now cleanly separated instead of bundled with a caveat.

### 2d. Settings → Branding & Communication hub (NET NEW, approved)
All 5 pages in this nav group are thin, single-purpose config panels serving the same actor
(admin customizing the tenant-facing look/feel and outbound comms) — genuine fragmentation:

| Current page | Lines | New tab |
|---|---|---|
| `login-customizer/page.tsx` | 110 | **Login Page** |
| `email-config/page.tsx` | 210 | **Email Server (SMTP)** |
| `email-templates/page.tsx` | 285 | **Email Templates** |
| `announcements/page.tsx` | 271 | **Announcements** |
| `maintenance/page.tsx` | 137 | **Maintenance Mode** |

New page: `settings/branding-communication/page.tsx`. Create/edit actions (new template, new
announcement) become modals; template body editor (if rich-text/large) stays inline in the tab
(not modal) since it's the tab's primary content, not a secondary action — mirrors Phase 1's rule
that only "create/edit" actions become modals, not primary editing surfaces.

**Boundary note**: `branding/page.tsx` (135 lines, under Platform Configuration, not this group)
and `white-label/page.tsx` (205 lines) are a *different* cluster — tenant-wide visual identity/PWA
config, evaluated separately in 2f. Do not merge them here even though the name "Branding" is
similar; they serve platform-level white-labeling, this hub serves tenant-facing comms content.
Announcements also does NOT merge with `notifications/page.tsx` (Reports group, 2g) — Announcements
is admin-authored broadcast content; Notifications is a per-user preference panel. Different actor,
different data model, kept apart.

### 2e. Settings → System Operations hub (NET NEW, approved)
9 pages, all admin/ops-facing monitoring or maintenance-trigger panels:

| Current page | Lines | New tab |
|---|---|---|
| `system-health/page.tsx` | 215 | **System Health** |
| `jobs/page.tsx` | 173 | **Background Jobs** |
| `scheduled-tasks/page.tsx` | 159 | **Scheduled Tasks** |
| `error-logs/page.tsx` | 206 | **Error Logs** |
| `alerts/page.tsx` | 476 | **Admin Alerts** |
| `recycle-bin/page.tsx` | 340 | **Recycle Bin** |

New page: `settings/system-operations/page.tsx`. `alerts/page.tsx` (476) and `recycle-bin/page.tsx`
(340) are larger but still single-purpose list/monitor views (not builder/canvas tools) — per
Phase 1's rule, 400+ line pages can still consolidate as tabs if their create/edit actions move to
modals; here there's no create/edit at all (both are monitor + restore/dismiss actions), so they
consolidate cleanly.

**Explicitly stays separate**:
- `backups/page.tsx` (155) — a sensitive, irreversible-adjacent action (restore) with its own
  confirmation/audit flow; bundling "trigger a restore" into a tab alongside routine monitoring
  views raises the risk of a misclick on a destructive action. Keep standalone.
- `db-schema/page.tsx` (138) — a schema-inspection/dev tool with a different primary actor
  (engineer/DBA, not ops admin) and different risk profile. Keep standalone.
- `bulk-operations/page.tsx` (499) — a dense multi-step bulk-action tool (select records, choose
  operation, preview, execute), not a monitoring view; matches Phase 1's "distinct workflow" reject
  criteria. Keep standalone.

### 2f. Settings → Platform Configuration hub, split into two (NET NEW, approved)
13 pages is too broad for one hub (violates "thin tabs only" — several of these are substantial
distinct systems). Splitting into two hubs by genuine cohesion:

**2f-i. General & Branding hub** (`settings/general-branding/page.tsx`):
| Current page | Lines | New tab |
|---|---|---|
| `general/page.tsx` | 306 | **General Settings** |
| `branding/page.tsx` | 135 | **Branding** |
| `white-label/page.tsx` | 205 | **White-Label & PWA** |
| `feature-flags/page.tsx` | 164 | **Feature Flags** |
| `custom-fields/page.tsx` | 399 | **Custom Fields** |

`custom-fields/page.tsx` (399) consolidates as a tab per Phase 1's 400-line threshold rule (its
add/edit field actions become a modal); it's a config surface, not a distinct workflow.

**Explicitly stays separate** (distinct systems, not thin config):
- `domains/page.tsx` (199) — custom domain provisioning has its own verification/DNS-check
  workflow (external state, polling) distinct from static config forms. Keep standalone.
- `environments/page.tsx` (160) — environment/deployment management, a different actor
  (platform engineer) and overlaps conceptually with Studio's `manage/environments` (already
  rejected for consolidation per Studio note above) — keep aligned with that precedent, standalone.
- `updates/page.tsx` (149) — system update/patch management, an irreversible-adjacent action
  akin to Backups; standalone for the same reason.
- `modules/page.tsx` (160, Module Manager) — enable/disable entire ERP modules is a
  high-blast-radius action distinct from a settings toggle; standalone.
- `marketplace/page.tsx` (510) — full app-store browsing/install experience (per Marketplace
  bundle architecture memory), a distinct large surface; standalone, unchanged.
- `subscription/page.tsx` (264) — billing/plan management, a different actor (finance/owner) and
  sensitive (payment-adjacent); standalone.
- `org-hierarchy/page.tsx` (367) — org chart/tree editor, a dense canvas-like structure, not a
  form; standalone per the same rule as Permissions Matrix.

### 2g. Settings → Data & Integration hub, split into two (NET NEW, approved)
**2g-i. API Platform hub** (`settings/api-platform/page.tsx` already exists as a 5-line redirect —
repurpose it as the real hub page):
| Current page | Lines | New tab |
|---|---|---|
| `api-keys/page.tsx` | 252 | **API Keys** |
| `api-platform/oauth/page.tsx` | 116 | **SSO & OAuth Clients** |
| `api-platform/sandbox/page.tsx` | 67 | **Developer Sandboxes** |
| `api-platform/analytics/page.tsx` | 81 | **API Metrics & Analytics** |
| `webhooks/page.tsx` | 65 | **Webhooks Config** |
| `webhook-logs/page.tsx` | 56 | **Webhook Logs** |

All 6 are thin, share one actor (developer/integrator) and one mental model ("manage programmatic
access to this tenant"). Genuine fragmentation — 6 nav entries for one workflow.

**2g-ii. Import/Export hub** (repurpose the existing `import-export/page.tsx` redirect shell):
| Current page | Lines | New tab |
|---|---|---|
| `import/page.tsx` | 310 | **Import Data** |
| `export/page.tsx` | 125 | **Export Data** |
| `sync/page.tsx` | 293 | **Sync Monitor** |

Import/export/sync are the same mental model ("move data in/out of this tenant") and were already
anticipated by the existing `import-export` redirect stub. `sync/page.tsx`'s "Sync Monitor" fits
here (bidirectional data movement) rather than System Operations (2e) — resolved in favor of this
hub since sync is data-integration monitoring, not general system health.

**Explicitly stays separate**:
- `localization/page.tsx` (363, i18n) — a distinct content-management surface (locale strings,
  translations), different actor (localization manager) than API/integration config; standalone.
- `data-quality/page.tsx` (298) — rule-based data validation/dedup tooling, a distinct analytical
  workflow, not a config form; standalone.
- `devops/page.tsx` (327, DevOps & Telemetry) — overlaps in name with System Operations (2e) but is
  scoped to deployment/telemetry metrics for engineers, not admin ops monitoring; on inspection this
  is a distinct actor/audience from 2e's alerts/jobs/error-logs (ops admin). Resolved: keep standalone,
  do NOT fold into 2e to avoid blurring "ops admin dashboard" with "engineering telemetry."

### 2h. Settings → Reports group — NO HUB, leave as-is (explicit no-go)
| Page | Lines | Verdict |
|---|---|---|
| `scheduled-reports/page.tsx` | 312 | standalone — report-scheduling has its own recipient/cadence workflow, distinct enough |
| `activity-feed/page.tsx` | 330 | standalone — a live feed/timeline UI, not a config form |
| `notifications/page.tsx` | 217 | standalone — per-user preference panel, different actor (end user, not admin) than everything else in Settings |
| `tenant-analytics/page.tsx` | 157 | standalone — analytics/BI view, distinct data model |

These 4 pages do not share a mental model or actor (a report scheduler, a live activity timeline, a
personal notification-preference form, and a tenant usage BI dashboard are four different jobs).
Forcing a "Reports" tab hub here would be consolidation for its own sake. **Explicit reject.**
Confirmed non-overlap: `notifications/page.tsx` (per-user prefs) is NOT the same as
`announcements/page.tsx` (2d, admin-authored broadcasts) — different direction of communication.

### 2i. CRM → Settings (custom-fields, record-types, approvals) — still no-go
224–261 lines each, genuinely related ("how CRM records are shaped/approved"). Candidate for a
"CRM Schema & Approvals" tabbed hub, but CRM already has its own dedicated `/crm/settings/*`
section separate from the org-wide Settings app — this is lower priority than the Settings app
itself and should wait until Phase 1's tab-hub pattern is proven in production before replicating
it into module-local settings. **Explicit reject for now, revisit after Phase 1 retro.**

### Acceptance criteria (Phase 2, applies to every new hub in 2a–2g)
- Given a user with the relevant `read` permission navigates to a hub URL, when the page loads, then all tabs render and the first tab is the default/landing view.
- Given a user switches tabs, when the tab changes, then that tab's data fetches independently (lazy-loaded on first activation) with no stale state bleeding from another tab.
- Given a user without the relevant `create`/`manage` permission for one tab's entity, when they view that tab, then its create/edit actions are hidden/disabled while other tabs' actions remain unaffected (per-tab RBAC gating, not page-level).
- Given someone links to any legacy page URL being merged (e.g. `/settings/sso`, `/settings/webhooks`), when they land, then they are redirected to the new hub with the correct `?tab=` query param — no 404s, no broken bookmarks.
- Given a "create/edit" action that used to be an inline form (e.g. IP rule, custom field), when the user triggers it in the new hub, then it opens as a `Modal` and, on success, refreshes only that tab's table without navigation.
- All existing RBAC permission strings for every merged page are preserved verbatim — hub creation is a UI reorganization only, not a permission model change.
- `tenant_id` scoping and audit/change-history logging for every merged entity is unaffected.
- Given two previously-separate pages had overlapping data (Audit Trail vs. Login History), when both are viewed as tabs in the Security Policies hub, then they visibly share the same underlying table component with different default filters (not two independent re-implementations) — verifying the overlap was actually resolved, not just visually hidden.
- `pnpm --filter web typecheck` passes; existing per-page tests are ported to new tab components, not deleted.
- No page URL appears as a tab in more than one hub, and no hub's stated scope overlaps another hub's stated scope (verify against the mapping tables in 2a–2g before merging).

### Rejected outright (leave fragmented — do not consolidate)
- **HR onboarding/offboarding** (416/430 lines) — genuinely distinct, large, checklist-driven
  workflows with different lifecycle triggers. Not a "related settings" pattern; forcing a tab
  switch mid-checklist would be actively worse UX.
- **Finance module clusters** (Core Accounting, Payables & Treasury, Tax & Compliance, Planning &
  Reporting) — each nav group already contains substantively distinct, data-dense record types
  (GL, Bank Recon, Tax Filing, Budgeting) that this project's Finance module notes describe as
  "already deep." These deserve full pages; a Finance mega-hub would be a regression.
- **Studio Manage pages** (`releases`, `environments`, `logs`, `access`, `connectors`, etc.) —
  each is a distinct engineering-facing surface with its own data model and, per
  `.ai/DEV_SPRINTS.md`, active roadmap work is already planned per-page (diff viewers, RBAC UI,
  run-logs). Consolidating mid-roadmap would conflict with in-flight Studio Phase 2–5 work.

---

---

## Phase 3 — Cross-module rollout (PLANNED, this session)

> Method: read `apps/web/src/navigation/moduleNav.tsx` in full for every remaining module's sidebar
> nav groups; measured line counts for a representative sample of pages per module
> (`apps/web/app/(dashboard)/<module>/**`); spot-read full contents of several small pages to confirm
> they are genuinely thin panels, not stubs disguising future complexity. Same rejection criteria as
> Phase 1/2: reject dense grids/canvases, sensitive audited flows, genuinely distinct workflows/actors,
> and any module flagged in `.ai/MODULE_REGISTRY.md`/`.ai/DEV_SPRINTS.md` as "already deep" or having
> active in-flight roadmap work.

**Key finding that changes the calculus vs. Settings**: several industry-vertical modules (Real
Estate, Field Service, Healthcare, Education) are currently thin, largely mocked/placeholder pages
(24–160 lines, hardcoded in-memory arrays, little/no real API wiring — confirmed by reading
`real-estate/tenants/page.tsx`, `field-service/customers/page.tsx`, `healthcare/fhir/page.tsx` in
full). Consolidating these is lower-risk (no real backend logic to break) but also lower urgency
(no live users navigating them today) — this pushes them down in sequencing despite high nav-entry
counts. Conversely, CRM, HR (non-onboarding/offboarding groups), Supply Chain, and Analytics are
real, API-wired, and actively used — consolidating these delivers immediate UX value to real
workflows, so they rank higher despite being lower-fragmentation-count.

### 3a. CRM — two hub candidates, most groups stay separate (SHIPPED 2026-07-04)
34 pages, several nav groups are genuinely thin single-purpose panels sharing one actor (sales ops).

**Marketing & Outreach hub** (`crm/marketing-outreach/page.tsx`):
| Current page | Lines | New tab |
|---|---|---|
| `crm/campaigns/page.tsx` | 227 | **Campaigns** |
| `crm/forms/page.tsx` | 306 | **Web Forms** |
| `crm/sequences/page.tsx` | 236 | **Email Sequences** |
| `crm/email-templates/page.tsx` | 176 | **Email Templates** |

Same actor (marketing/sales-ops admin), same mental model ("outbound content & automation"), all
thin CRUD list+modal pages. Genuine fragmentation — 4 nav entries for one workflow.

**Sales Enablement hub** (`crm/sales-enablement/page.tsx`):
| Current page | Lines | New tab |
|---|---|---|
| `crm/playbooks/page.tsx` | 281 | **Playbooks** |
| `crm/battlecards/page.tsx` | 224 | **Battlecards** |

Small, genuinely adjacent (reference content for reps), same actor. Only 2 tabs but both are thin
list+detail content libraries with near-identical CRUD shape — worth merging to cut 2 nav entries to 1.

**CRM Settings hub — still rejected** (`crm/settings/*`, 224–261 lines each): per the existing Phase
2i note, wait until the Settings hub pattern proves out in production before replicating into
module-local settings. Left as-is, no change this phase.

**Explicitly stays separate** (genuinely distinct workflows/actors, not thin fragments):
- `crm/customers/page.tsx` (112), `crm/vendors/page.tsx` (126), `crm/contacts/page.tsx` (238) —
  Account Management group. These are three distinct primary-entity registries (not
  config/monitoring panels) — each deserves full-page real estate for its own filters/bulk actions,
  same reasoning as why Settings never merged Users+Roles+Groups' *record* pages, only merged around
  config. Reject.
- `crm/leads/page.tsx` (240) + detail, `crm/opportunities/page.tsx` (256) + detail,
  `crm/quotations/page.tsx` (270), `crm/sales-orders/page.tsx` (165), `crm/products/page.tsx` (133),
  `crm/price-books/page.tsx` (150) — Sales Pipeline group. Each is a distinct pipeline-stage entity
  with its own detail page and workflow (lead→opportunity conversion, quote→order flow); this is the
  CRM equivalent of Finance's "distinct record types," reject.
- `crm/workflows/page.tsx` (290), `crm/approvals/page.tsx` (211), `crm/activities/page.tsx` (96),
  `crm/documents/page.tsx` (293) — Automation & Workflows group. `workflows` (rule canvas-adjacent)
  and `approvals` (live monitoring) are different mental models from each other and from
  `activities`/`documents` (record logs); no clean 2-tab split emerges without forcing it. Reject —
  these don't share one actor/moment the way Marketing/Outreach or Sales Enablement do.
- `crm/territories/page.tsx` (264), `crm/commissions/page.tsx` (362) — Teams & Territories. Only 2
  pages, but both are substantial rule-engine-style configuration (territory assignment logic,
  commission-split rules), not thin CRUD; commissions in particular (362 lines) is closer to
  Finance's "distinct record type" bar. Reject.
- `crm/forecasting/page.tsx` (197), `crm/reports/page.tsx` (344), `crm/dashboards/page.tsx` (315) +
  detail, `crm/advanced/page.tsx` (83) — Analytics & Reports. Each is a distinct BI surface (forecast
  model, report builder, dashboard canvas); `dashboards` in particular is a canvas-like builder.
  Reject.
- `crm/cases/page.tsx` (162) — Customer Service, single page, nothing to merge with. Leave alone.

**Non-overlap confirmed**: Marketing & Outreach and Sales Enablement share zero pages; neither
touches the untouched groups above.

### 3b. HR — one hub candidate, everything else stays separate (SHIPPED 2026-07-04)
25 pages under `/hr/advanced/*`. Per instructions, Onboarding (416) and Offboarding (430) checklists
remain explicitly rejected (large distinct lifecycle-triggered checklists, already flagged). Spot-read
`assets/page.tsx` (58 lines, real API-wired list+assign-modal) confirms genuine thinness for at least
one candidate.

**Operations & Service hub** (`hr/advanced/operations-service/page.tsx`) — reframing the existing
"Operations & Service" nav group, splitting out the two genuinely distinct items:

| Current page | Lines | New tab |
|---|---|---|
| `hr/advanced/assets/page.tsx` | 58 | **Asset Management** |
| `hr/advanced/holidays/page.tsx` | 149 | **Public Holidays** |
| `hr/advanced/compliance/page.tsx` | 161 | **Labor Compliance** |
| `hr/advanced/tickets/page.tsx` | 277 | **HR Helpdesk** |
| `hr/advanced/surveys/page.tsx` | 334 | **Engagement Surveys** |

All five are thin-to-moderate admin config/monitoring panels for the same actor (HR ops admin),
none is a checklist-driven lifecycle flow. `attendance/page.tsx` (152) and `shifts/page.tsx` (318)
are **excluded** — these are live operational data (clock-in/out records, shift rosters) with a
different cadence (daily operational tool, not admin config) and a different actor (line
manager/employee-facing), matching the Settings precedent of splitting "monitor" from "config."
`documents/page.tsx` (295, HR document manager) is also excluded — distinct file-management workflow
overlapping conceptually with Drive, not a config panel.

**Explicitly stays separate**:
- `hr/advanced/onboarding/page.tsx` (416), `offboarding/page.tsx` (430) — reject, per instructions
  (large distinct checklists, different lifecycle triggers).
- `hr/advanced/attendance/page.tsx` (152), `shifts/page.tsx` (318) — live operational tools, different
  cadence/actor than config panels. Reject (see above).
- Talent Management group (`recruitment` 594, `goals` 286, `skills` 224, `appraisals` 281,
  `feedback` 272, `succession` 242) — six substantial, genuinely distinct talent-lifecycle tools
  (a recruiting ATS, OKR tracker, skills matrix, appraisal cycle, 360 feedback tool, succession
  planner) — each has its own data model and workflow; this is HR's version of Finance's "distinct
  record types." Reject.
- Compensation & BI group (`payroll` 498, `leaves` 499, `benefits` 301, `positions` 277,
  `analytics` 249) — payroll and leave management are large, sensitive, audited-adjacent flows;
  benefits/positions/analytics are each a distinct system. Reject — matches the existing Finance/HR
  "already deep" precedent from Phase 2's rejection list.
- `hr/advanced/documents/page.tsx` (295) — see above, reject.
- `hr/advanced/self-service/page.tsx` (313) — distinct actor (employee, not HR admin), a portal not
  an admin panel. Reject.

### 3c. Supply Chain — one hub candidate (SHIPPED 2026-07-04)
8 pages. `supply-chain/analytics/page.tsx` (57 lines, confirmed via read: pure KPI+chart display, no
CRUD) pairs naturally with the dashboard-level views.

**Operations hub** (`supply-chain/operations/page.tsx`):
| Current page | Lines | New tab |
|---|---|---|
| `supply-chain/shipments/page.tsx` | 146 | **Shipments** |
| `supply-chain/tracking/page.tsx` | 103 | **Shipment Tracking** |
| `supply-chain/carriers/page.tsx` | 98 | **Carrier Management** |
| `supply-chain/routes/page.tsx` | 92 | **Route Optimization** |

Same actor (logistics coordinator), same mental model ("day-to-day shipment operations"), all thin.
`shipments/[id]/page.tsx` (288, detail page) is **not** merged — detail pages never become tabs,
consistent with every prior phase.

**Explicitly stays separate**:
- `supply-chain/demand-forecast/page.tsx` (86) and `supply-chain/analytics/page.tsx` (57) — Planning
  & Analytics group has only 2 pages; forecasting is a distinct predictive-modeling tool, not an ops
  monitor. Not worth a 2-tab hub on its own; leave both standalone (mirrors Phase 2h's "don't force a
  hub for its own sake" reasoning).

### 3d. Analytics / BI — reject entire module (no consolidation)
7 pages, but every one is a genuinely distinct analytical tool/canvas: `analytics/query` (506, visual
query builder canvas), `analytics/pivot` (188, pivot matrix engine), `analytics/builder` (289,
drag-drop dashboard builder canvas), `analytics/predictive` (278, ML-adjacent forecasting tool),
`analytics/insights` (164, smart-insights feed), `analytics/advanced` (271). These are Analytics'
equivalent of Studio's canvas editors or Finance's distinct record types — each is a builder/canvas
or a distinct analytical surface, not a thin config form. **Reject entirely**, no hub.

### 3e. POS & Retail — one small hub candidate (DEFER — Phase 3b, lower priority)
10 pages. `pos/page.tsx` (577, POS terminal — a dense operational UI, never touch),
`pos/advanced/page.tsx` (381) are large. Genuine thin cluster:

**Retail Tools hub candidate** (`pos/retail-tools/page.tsx`):
| Current page | Lines | New tab |
|---|---|---|
| `pos/held-orders/page.tsx` | 106 | **Held / Parked Carts** |
| `pos/promotions/page.tsx` | 44 | **Promotions Engine** |
| `pos/layaway/page.tsx` | 48 | **Layaway Plans** |

Genuinely thin, same actor (store manager configuring register-adjacent features). Low value (only
3 tabs, ~200 lines total) — deprioritized to a later pass rather than Phase 3a.

**Explicitly stays separate**: `pos/designer/page.tsx` (240, receipt canvas designer) and
`pos/diagnostics/page.tsx` (255, printer hardware diagnostics) — Customizer group, only 2 pages,
different mental models (visual designer vs. hardware troubleshooting). Reject.
`pos/customers/page.tsx`, `pos/reports/page.tsx`, `pos/orders/page.tsx` — distinct record
registries/reports, no fragmentation. Reject.

### 3f. Industry verticals — Real Estate, Field Service, Healthcare, Education (DEFER — Phase 3c, lowest priority despite highest fragmentation)
All four are dominated by very small (24–160 line), largely mocked/placeholder pages confirmed by
full reads of three samples (`real-estate/tenants`, `field-service/customers`, `healthcare/fhir`) —
hardcoded in-memory arrays, minimal/no real backend wiring. High nav-entry counts (9, 9, 11, 12
pages respectively) make them *look* like the most attractive consolidation targets, but:
- Low current usage/maturity means low UX urgency today.
- Because most pages are stubs, a consolidation pass here risks being thrown away once real backend
  work lands and the actual page shapes change — better to defer until each module gets real
  CRUD/API wiring, then consolidate for real (cheaper to do it once, correctly, on real pages).

**Recommendation**: defer all four to Phase 3c. When each module's backend work is scheduled, revisit
consolidation as part of that same effort rather than as a separate later pass — this avoids
building tab hubs around placeholder data that will be restructured anyway. If forced to rank
now for future reference: Real Estate (Portfolio: properties/leases/tenants, 3 pages) and Field
Service (Service Management: tickets/dispatch/checklists/preventive, 4 pages) have the cleanest
candidate hub shapes once real; Healthcare's Patient Care group (5 pages) is higher-risk to
consolidate given HIPAA-audited-flow concerns already noted in the roadmap (Phase 12.5) — likely a
partial reject even after real backend work lands (patient intake/prescriptions/lab-results may
stay separate as sensitive distinct workflows, similar to CRM's Sales Pipeline reasoning).

### 3g. Projects, Manufacturing, Ecommerce, Drive, Connect, Studio, Workflows, SaaS Portal, API Platform (top-level) — reject or already effectively lean
- **Projects** (6 pages) — every page is a distinct tool (Gantt/tasks, Portfolio Hub, Client Portal,
  Resource Workloads, Health & CPM, Revenue Recognition). No thin cluster. Reject.
- **Manufacturing** (8 pages, all 228–1188 lines) — every page is a substantial distinct
  shop-floor/planning system (BOM, MRP, shop floor, quality/NCR, scheduling, configurator). Matches
  Finance's "already deep" bar exactly. Reject entirely.
- **E-Commerce** (3 pages, already lean from its 2026-07-03 build) — nothing to consolidate.
- **Drive** (6 pages) — `templates` (147), `media` (73), `quotas` (119) are thin, but represent three
  different tool categories (document generation, media pipeline, storage limits) with no shared
  actor/moment; `advanced` (425, e-signatures/OCR) and `designer` (190, template canvas) are distinct
  builders. Marginal candidate at best — reject for now, revisit only if a 4th thin page appears.
- **Connect** — only 2 nav items at top level (`connect`, `communication/advanced`); the real
  complexity lives inside `connect/page.tsx` (2542 lines, a single dense chat/spaces/meetings
  workspace) which is already a unified surface, not fragmented. Reject — nothing to merge.
- **Studio (Builder)** — reject entirely, unchanged from the existing explicit rejection (active
  per-page roadmap in `.ai/DEV_SPRINTS.md` Phase 2–5; consolidating mid-roadmap would conflict with
  planned diff viewers/RBAC UI/run-logs work on specific Manage pages).
- **Workflows (top-level `/workflows`)** — only 4 nav entries and no page files exist yet under
  `apps/web/app/(dashboard)/workflows/` (confirmed — path does not exist; these nav entries likely
  route into the Settings Workflow Builder/Approval Operations hubs already shipped in Phase 2, or
  are stale/placeholder nav entries). Flagged as a **data-integrity follow-up for
  frontend-developer**, not a consolidation candidate — needs investigation, not a hub.
- **SaaS Portal** (1 nav item) and **API Platform (top-level)** — both resolve into existing Settings
  hubs (`/settings/subscription`, `/settings/api-platform`) or are single pages; nothing to merge.

---

## Phase 3 sequencing recommendation

**Phase 3a — SHIPPED 2026-07-04** (highest value : risk ratio; real, actively-used modules with
confirmed genuine thin-page clusters):
1. **CRM** — Marketing & Outreach hub (4→1) + Sales Enablement hub (2→1); ~30 other CRM pages
   explicitly stay separate.
2. **HR** — Operations & Service hub (5→1, reframed from the existing nav group, excluding
   attendance/shifts/documents); onboarding/offboarding/talent/compensation groups stay rejected.
3. **Supply Chain** — Operations hub (4→1); demand-forecast/analytics stay standalone.
4. **Analytics** — explicit full-module reject (documented so no one re-proposes it).

**Phase 3b — deferred, lower priority**:
5. **POS & Retail** — Retail Tools hub (3→1) once bandwidth allows; small win, not urgent.
6. **Drive** — revisit only if page count grows; marginal today.

**Phase 3c — deferred, revisit alongside future backend work** (not a standalone UI task):
7. **Real Estate, Field Service, Healthcare, Education** — defer consolidation until each module's
   real backend/API build lands (per the roadmap's Phase 12–15 industry-module work); consolidate
   as part of that effort, not before, to avoid building hubs around placeholder pages.

**Rejected entirely, no further action**:
- Manufacturing, Projects, E-Commerce, Connect, Studio, Finance (carried over), HR
  onboarding/offboarding (carried over) — see per-module notes above for reasoning.

**Flagged, not a consolidation task**: top-level `/workflows` nav entries point at a route with no
backing page files — needs a frontend-developer investigation pass (likely dead/stale nav or should
redirect into the Settings hubs), separate from this plan's scope.

### Acceptance criteria (Phase 3a, applies to all 3 hubs: CRM Marketing & Outreach, CRM Sales
Enablement, HR Operations & Service, Supply Chain Operations)
- Given a user with the relevant module `read` permission navigates to a hub URL, when the page
  loads, then all tabs render and the first tab is the default/landing view.
- Given a user switches tabs, then that tab's data fetches independently (lazy-loaded on first
  activation), matching the `visited`-Set pattern used in Phase 1/2.
- Given a user without the relevant `create`/`manage` permission for one tab's entity, then that
  tab's create/edit actions are hidden/disabled while other tabs are unaffected (per-tab RBAC).
- Given someone links to any legacy merged page URL (e.g. `/crm/campaigns`, `/hr/advanced/assets`,
  `/supply-chain/shipments`), then they are redirected to the new hub with the correct `?tab=` param
  — no 404s, no broken bookmarks.
- All existing RBAC permission strings for every merged page are preserved verbatim.
- `tenant_id` scoping and change-history/audit logging for every merged entity is unaffected.
- No page URL appears as a tab in more than one hub; every explicitly-rejected page keeps its own
  unchanged nav entry (non-overlap, mirroring Phase 2's guarantee).
- `pnpm --filter web typecheck` passes; existing per-page logic is ported into tab components, not
  rewritten from scratch.

## Next agents (Phase 3a)
- **uiux-designer**: tab layouts for the 3 new hubs (CRM Marketing & Outreach, CRM Sales Enablement,
  HR Operations & Service, Supply Chain Operations — 4 hubs total); modal conversion for any inline
  create/edit forms found during build (e.g. `crm/campaigns`, `hr/advanced/assets`).
- **frontend-developer**: build the 4 hub pages, add legacy-route redirects for all ~15 merged page
  URLs, update `moduleNav.tsx` for CRM/HR/Supply Chain sidebar groups, investigate and report back
  on the dangling top-level `/workflows` nav entries (separate from the hub-building task).
- **qa-tester**: verify acceptance criteria above per hub; regression-check CRM/HR/Supply Chain
  existing test suites are unaffected.
- **business-analyst-uat**: UAT script confirming a sales-ops persona can complete
  "create a campaign → check playbooks for talk track" without leaving the two new CRM hubs except
  for the intentional distinct-workflow pages (leads/opportunities/quotations).

---

## Cross-cutting notes for implementers
- Tab state must not leak across tabs (separate fetch/loading/error state per tab, lazy-load tab
  content on first activation to avoid firing all 4 entities' API calls on page load).
- RBAC gating stays per-action, not per-page — a user might see the Users tab but not the New Role
  button in the Roles tab.
- `tenant_id` scoping and audit/change-history logging are unaffected — no data-layer changes in
  Phase 1, UI reorganization only.
- Legacy URL redirects are mandatory (bookmarks, saved links, other in-app deep links must not break).

## Next agents

### Phase 1 (shipped)
- **uiux-designer**: tab layout/spacing for the Identity & Access hub, modal wizard forms for
  Groups/Roles create flows (Users/Packages already have modals — reuse pattern).
- **frontend-developer**: build `settings/identity-access/page.tsx`, convert Groups/Roles inline
  create forms to `Modal`, add legacy-route redirects, update `moduleNav.tsx`.
- **qa-tester**: verify acceptance criteria above, especially per-tab RBAC gating and legacy
  redirect coverage.
- **business-analyst-uat**: UAT script confirming an admin persona can complete a full
  "invite user → assign to group → assign role → verify via permissions matrix" flow without
  leaving the hub except for the intentional matrix hand-off.

### Phase 2 (approved, build now)
- **data-architect**: none required — Phase 2 is UI reorganization only, no schema changes.
- **uiux-designer**: tab layouts for all 7 new hubs (2a Security Policies, 2b Compliance &
  Governance, 2c-i Approval Operations, 2c-ii Workflow Builder, 2d Branding & Communication,
  2e System Operations, 2f-i General & Branding, 2g-i API Platform, 2g-ii Import/Export — 9 hubs
  total); modal forms for every action currently inline (IP rules, custom fields, email templates,
  announcements, webhook config).
- **frontend-developer**: build the 9 new hub pages listed above, convert inline create/edit forms
  to `Modal` per hub, repurpose the existing `api-platform/page.tsx` and `import-export/page.tsx`
  redirect stubs into real hub pages, add legacy-route redirects for all ~45 merged page URLs,
  update `moduleNav.tsx` Settings block to collapse each merged group down to its hub entry (+ the
  standalone pages listed in 2a/2e/2f/2g/2h that keep their own nav entries).
- **qa-tester**: verify Phase 2 acceptance criteria above, with special attention to the Audit
  Trail / Login History shared-component check and per-hub RBAC gating across all 9 hubs.
- **business-analyst-uat**: UAT scripts for (1) a security admin completing "check compliance
  score → review audit trail → adjust password policy" without leaving the Security Policies hub,
  (2) an ops admin completing "author a workflow template → later check its live approval queue"
  and confirming this correctly requires visiting two different hubs (Workflow Builder vs.
  Approval Operations) — the split, not a merge, is the expected/correct behavior here.
