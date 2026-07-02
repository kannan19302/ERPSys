# Admin UI Design Spec — Access Control Matrix Restructure + Backups Copy Treatment

> Owner: uiux-designer | Status: spec ready for backend-developer/frontend-developer | Created: 2026-07-02
> Trigger: `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md` P0-1 (dead fine-grained RBAC fix) and P1-1 (fabricated backups)
> Scope: `apps/web/app/(dashboard)/admin/access-control/**`, `apps/web/app/(dashboard)/admin/backups/page.tsx`
> **No production code changes in this pass** for the matrix/roles restructuring or backups relabeling — those are
> handed off to frontend-developer once backend-developer lands P0-1's registry fill. Small, non-controversial,
> unrelated-to-the-permission-work fixes are called out separately in Section 4.

---

## 1. Can the current UI handle ~30 newly-live fine-grained permissions? — No, not as built

I read the actual component code, not just the API shape:

- **`matrix/page.tsx`** (`apps/web/app/(dashboard)/admin/access-control/matrix/page.tsx`): groups permissions by
  `module` only (`allModules()` at line 22 = `new Set(PERMISSION_REGISTRY.map(p => p.module))`). Every admin
  sub-resource — users, roles, settings, access-packages, security, user-groups, automation, platform, operations,
  org-hierarchy, bulk-operations, custom-fields, data-quality, delegation, GDPR, import-export, recycle-bin,
  subscription, alerts, announcements — collapses into a **single `admin` column** showing one aggregate
  Full/Partial/None icon (lines 54–61, 150–172). Once P0-1 registers ~30 new `admin.*` codes, that one column's
  tooltip will read "12/34 admin permissions" — a meaningless aggregate that actively hides the
  read-audit-logs-but-not-manage-user-groups distinction P0-1 exists to enable. **The matrix's core value
  proposition (see access at a glance) breaks specifically for the module this fix targets.**

- **`roles/page.tsx`** (`apps/web/app/(dashboard)/admin/access-control/roles/page.tsx`): the expanded `RoleCard` view
  (lines 202–242) and the `CreateRoleModal` permission picker (lines 330–360) both render one flat card/section per
  `module` with every permission in that module listed as a vertically-stacked checkbox list, no sub-grouping. Today
  `admin` has 17 permissions rendered as one uninterrupted checkbox column inside a 280px-wide card (line 202:
  `minmax(280px, 1fr)`). Adding ~30 more in the same undifferentiated list produces a **card with 47+ checkboxes in
  one unbroken column** — a direct Hick's Law violation (excessive undifferentiated choices slow decision-making and
  invite mis-clicks on a security-sensitive surface). The `CreateRoleModal` list has the same problem inside a
  360px-tall scroll region (line 327), which would need to scroll through 47+ items with zero landmarks.

- Both pages already import `getPermissionsByModule` from `@unerp/shared` as their only grouping primitive — there is
  no existing "group by resource" or "group by category" utility to reuse. This must be added to
  `packages/shared/src/permissions/registry.ts`, not invented ad hoc in the frontend.

**Verdict: the matrix and role-editor UIs, as coded today, will become unreadable and unreliable the moment P0-1
ships the registry fill. A restructuring is required, not optional.**

---

## 2. Recommended grouping pattern: two-level hierarchy — Module → Category

### 2.1 Data model change (hand to backend-developer / data-architect, not built here)

Add one field to `PermissionDefinition` (`packages/shared/src/types` — confirm exact file before editing):

```ts
export interface PermissionDefinition {
  code: string;
  module: string;
  resource: string;
  action: string;
  level: PermissionLevel;
  description: string;
  category?: string; // NEW — sub-resource grouping label, admin-only for now
}
```

`category` is optional so every non-admin module (finance, hr, crm, etc.) is unaffected — they stay single-level
(`module` only) since none of them have Admin's 21-resource sprawl. Populate `category` only for the `admin` module
entries, mapping each `resource` to one of the groups the PM doc already names:

| Category label (UI) | `resource` values it covers | Example codes |
|:---|:---|:---|
| Users & Roles | `user`, `role`, `access-package` | `admin.user.read`, `admin.role.create` |
| Security | `security`, `session`, `mfa`, `sso`, `password-policy`, `ip-restriction` | `admin.security.read` |
| User Groups | `user-group` | `admin.user-group.create` |
| Automation | `automation`, `automation-rule` | `admin.automation.update` |
| Platform | `platform`, `api-key`, `webhook`, `feature-flag` | `admin.platform.read` |
| Operations | `operations`, `backup`, `background-job`, `scheduled-task` | `admin.operations.read` |
| Org Hierarchy | `org-hierarchy`, `department-tree` | `admin.org-hierarchy.read` |
| Bulk Operations | `bulk-operation` | `admin.bulk-operation.create` |
| Custom Fields | `custom-field` | `admin.custom-field.create` |
| Data Quality | `data-quality` | `admin.data-quality.read` |
| Delegation | `delegation` | `admin.delegation.create` |
| GDPR | `gdpr` | `admin.gdpr.read` |
| Import / Export | `import-export` | `admin.import-export.create` |
| Recycle Bin | `recycle-bin` | `admin.recycle-bin.update` |
| Subscription | `subscription` | `admin.subscription.read` |
| Alerts | `alert` | `admin.alert.read` |
| Announcements | `announcement` | `admin.announcement.create` |
| General Settings | `setting`, `localization`, `demo` | `admin.setting.update` |

Exact category-to-resource mapping must be verified against the real `@Permissions(...)` strings once
backend-developer fixes the decorator bug — do not hardcode this table into the frontend without that verification
step (same drift-check discipline as US-P0-1b).

### 2.2 Matrix page (`/admin/access-control/matrix`) — drill-in, not flat columns

Keep the existing per-module aggregate column for every non-admin module (they're fine at ~4-9 permissions each).
For the `admin` column specifically:

- Replace the single aggregate cell with a **clickable cell that opens a `Drawer`** (already in `@unerp/ui`,
  `packages/ui/src/components/navigation.tsx` — reuse, do not build a new overlay primitive) titled
  `"{Role name} — Admin permissions"`.
- Inside the drawer, list the 17 categories above as collapsible sections (a plain `<details>`-style disclosure
  using existing `.frappe-card` + a chevron icon, not a new accordion component — check `packages/ui` first; if no
  disclosure primitive exists, that is a genuine gap to flag to frontend-developer as a small addition, not build it
  here). Each section header shows `{granted}/{total}` using the same `Badge` treatment already used in
  `roles/page.tsx` line 214 pattern (color-coded: success at 100%, warning at partial, tertiary text at 0%).
- The top-level matrix cell itself keeps showing Full/Partial/None using the same three-state `levelConfig` (lines
  63–67 today), computed across **all** admin permissions — the aggregate is still a legitimate at-a-glance signal,
  it just needs a drill-in path instead of being the only view.
- Column header for `admin` gains a small subtitle `(17 categories)` in `var(--text-xs)` /
  `var(--color-text-tertiary)` so users know there's a hierarchy before they click — avoids surprising them (Jakob's
  Law: matches the "expand for detail" pattern already used in `RoleCard`).

### 2.3 Roles page (`/admin/access-control/roles`) — category sub-groups replace flat checkbox stacks

Both the expanded `RoleCard` view and the `CreateRoleModal` permission picker get the same restructuring:

- Within the `admin` module's card/section, replace the single flat `flexDirection: column` checkbox list
  (`roles/page.tsx` lines 225–238) with **nested category groups**: a `category` header row (small caps label +
  `{granted}/{total}` count, same visual weight as the existing module header at lines 210–217) containing its own
  mini progress bar, followed by that category's checkboxes indented one level.
- This is the same visual pattern already used for module-level grouping today — just applied one level deeper for
  `admin` only. Non-admin modules render exactly as they do now (no `category` field means no sub-grouping, so the
  existing flat list is unchanged and correct for them — this keeps the fix scoped and consistent elsewhere).
- In `CreateRoleModal`, apply the identical nesting inside the existing scrollable picker (lines 330–360). Add a
  category-level "select all in category" checkbox (same indeterminate-checkbox pattern already implemented for
  the module-level `toggleModule` at lines 265–273, just parameterized by category instead of module) — this keeps
  bulk-grant workflows fast (Fitts's Law: fewer individual clicks for a common "grant this whole area" action)
  without losing the individual per-permission granularity that is the entire point of P0-1.
- Add a lightweight text filter/search specifically for the admin permission list once it exceeds ~15 items (reuse
  the existing `Search` input pattern already on both pages, e.g. `matrix/page.tsx` lines 95–106 — same
  `.frappe-input`-equivalent inline style block that's already in this codebase; do not introduce a new input
  component for this).

### 2.4 Component reuse map

| Need | Existing `@unerp/ui` component | New component required? |
|:---|:---|:---|
| Drill-in overlay for admin column in matrix | `Drawer` (`components/navigation.tsx`) | No |
| Category header with progress | `Badge` + inline progress bar (same pattern as `roles/page.tsx` 218–224) | No |
| Collapsible category section | None found — verify with frontend-developer before building | **Possibly** — a `Disclosure`/`Accordion` primitive. Confirm it's genuinely missing before proposing; if it's missing, scope it as a minimal wrapper around the existing chevron+toggle pattern already hand-rolled in `RoleCard` (lines 144–183), not a new design language. |
| Search/filter input | Existing inline `.frappe-input`-style pattern | No |
| Tooltip on matrix cells | `Tooltip` (`components/navigation.tsx`) | No |
| Loading state | `Skeleton` / `DataTable`'s built-in `loading` prop | No |
| Empty state (role with zero admin perms granted) | `EmptyState` | No |

**Do not build a new "permission tree" or "nested checkbox" component from scratch.** The nesting is one additional
level of the same header+list pattern already implemented twice on this page (module-level today, category-level
new) — extend the existing pattern, don't replace it.

### 2.5 Accessibility checklist

- Category disclosure toggles must be real `<button>` elements (or use a vetted disclosure primitive) with
  `aria-expanded` and `aria-controls` — not a `<div onClick>` (the existing `RoleCard` header at line 150 uses a
  `<div onClick>`; flag this as a pre-existing violation to fix in the same pass, see Section 4).
- Every checkbox must retain a real `<label>` association (already true — both pages wrap `<input>` in `<label>`
  correctly).
- The matrix drawer must trap focus and restore focus to the triggering cell on close (verify `Drawer` in
  `components/navigation.tsx` already does this — if not, that's a `@unerp/ui` fix, not a page-level one).
- Color is never the sole signal: Full/Partial/None already pairs color with an icon (Check/Minus/X) — preserve this
  when extending to category-level indicators; do not add a color-only category status dot.
- Contrast: category header text must hit ≥4.5:1 against `--color-bg-sunken` — verify with the existing token pairing
  already used for module headers (`--color-text-secondary` on `--color-bg-elevated`/`--color-bg-sunken` — this
  pairing is already in use elsewhere in the file, so it's pre-verified, just confirm it's reused, not reinvented).
- Keyboard: category select-all checkboxes must be reachable via Tab in DOM order (top-to-bottom, category before its
  children) — matches existing module-level tab order.

### 2.6 Handoff notes for frontend-developer

- **Do not start this until backend-developer lands P0-1's registry fill** — the exact `category` values per
  resource must be verified against real controller `@Permissions(...)` strings, not guessed from this spec's table.
- Sequence: (1) data-architect/backend-developer adds `category?: string` to `PermissionDefinition` type +
  populates it for all `admin.*` entries in the registry fill, (2) frontend-developer adds a
  `getPermissionsByCategory(module, category)` helper alongside the existing `getPermissionsByModule` in
  `packages/shared/src/permissions/registry.ts`, (3) frontend-developer restructures `matrix/page.tsx` and
  `roles/page.tsx` per Sections 2.2–2.3.
- Confirm before merging: no other module needs the same treatment. Grep `PERMISSION_REGISTRY` per module — only
  `admin` currently exceeds ~10 permissions in one module; everyone else is fine with flat module grouping. Do not
  add `category` support project-wide speculatively.

---

## 3. Backups page — copy/UI treatment for both P1-1 outcomes

Current state read from `apps/web/app/(dashboard)/admin/backups/page.tsx`: the page already **overclaims** —
heading "Backup & Restore Manager", subtext "Perform cold database backups... trigger point-in-time state recovery,"
success toast "SQL database backup archive generated successfully," and a disaster-recovery banner promising backups
"stored securely in internal private cloud object buckets" — none of which is true today (`createBackup` fabricates
`sizeBytes` with `Math.random()`, no file is written, "Download"/"Delete" buttons in the table have no `onClick` at
all). This page is presently the most misleading claim of "done" I've reviewed in Admin.

Both copy treatments below assume the eventual backend response includes a `source: 'REAL' | 'SIMULATED'` flag (per
the PM doc's proposed API contract) so the frontend can render conditionally without a second migration later —
**write the frontend to branch on this flag now if backend-developer confirms the field is coming**, so whichever
path backend chooses, only copy/badge rendering changes, not component structure.

### 3.1 Scenario A — Real `pg_dump`-backed backup (P1-1 option a)

| Element | Current (wrong) copy | Corrected copy |
|:---|:---|:---|
| Page title | "Backup & Restore Manager" | "Backup & Restore Manager" — unchanged, this is now accurate |
| Subtitle | "Perform cold database backups, download snapshot archives, and trigger point-in-time state recovery." | "Create on-demand PostgreSQL backups, download the archive, and restore from a previous snapshot." (drop "cold" and "point-in-time" — do not claim PITR unless it's actually implemented; a snapshot-restore is not the same as continuous PITR) |
| Create button | "Generate New SQL Backup" | "Create Backup" — simpler, matches `.frappe-btn` label conventions elsewhere (avoid "SQL" jargon per Hick's Law: the admin doesn't need to know the mechanism, just the outcome) |
| Success toast | "SQL database backup archive generated successfully." | "Backup created — {sizeBytes formatted} archived to object storage." (surface the real, verified file size, not a static string — proves it's real) |
| Disaster banner | "Backups are stored securely in internal private cloud object buckets." | Keep, but only if MinIO/S3 storage is actually wired — verify with backend-developer before shipping this line unchanged |
| Download button | No `onClick` (dead) | Wire to real download endpoint; disable with a `Tooltip` "Preparing…" state if the file isn't finalized yet, not a silent no-op |
| Table column | none | Add a `Badge variant="success"` "Verified" column once a checksum/restore-test step exists (from the PM doc's success metric: "can be verified/checksummed") — omit this column until that's real; do not add a badge that itself becomes a new fabrication |

No structural change needed if backend ships this option — the existing table/button layout is directionally right,
it just needs real handlers and honest copy.

### 3.2 Scenario B — Honestly-labeled simulated data (P1-1 option b, if `pg_dump` is deferred)

This is the harder case: the page must stop claiming DR capability it doesn't have, without simply hiding the
feature (hiding it would look like a regression and confuses admins who saw it before).

| Element | Current (wrong) copy | Simulated-mode copy |
|:---|:---|:---|
| Page title | "Backup & Restore Manager" | "Backup & Restore Manager (Preview)" — the "(Preview)" suffix is load-bearing, not decorative; keep it visually part of the `<h1>`, not a separate badge that can be missed |
| Subtitle | "...trigger point-in-time state recovery." | "This is a preview of the backup workflow. Generated entries are simulated and do not yet produce a restorable database file." |
| Create button | "Generate New SQL Backup" | "Simulate Backup Run" — the verb itself must not imply a real artifact was produced |
| Success toast | "SQL database backup archive generated successfully." | "Simulated backup entry recorded. No file was written — this feature is not yet connected to real storage." |
| Disaster banner | Warning-colored box claiming secure cloud storage | Replace entirely with a **`DemoBanner`** (`@unerp/ui`, `packages/ui/src/components/demo-banner.tsx` — this component already exists for exactly this "this is not real data" signal; **do not hand-roll a new banner, reuse it**) reading: "Simulated data — Backup & Restore is not yet connected to a real storage backend. No production DR coverage exists via this page today. Contact your platform team for actual database backup status." |
| Table column | `sizeBytes` shown as if real | Add a persistent `Badge variant="warning"`"Simulated" badge per row (every row, not just a page-level banner — a row could be screenshotted/exported independent of page context, so the row itself must self-disclose) |
| Download button | No `onClick` (dead, silently) | Either remove the button entirely (preferred — a dead button that does nothing on click is worse than no button, it invites a bug report) or wire it to a disabled state with `Tooltip` "Not available in preview mode" |
| Delete button | No `onClick` (dead, silently) | Wire for real (deleting a simulated `Setting`-table row is harmless and low-effort) or remove — do not ship a visibly clickable button with zero effect |

Use `<ProtectedComponent permission="admin.operations.backup">` (or whatever fine-grained code P0-1 assigns to this
resource) around the entire Create/Download/Delete action set regardless of which scenario ships — this page
currently has **no permission gating visible in the component at all**, which is itself a P0-1-adjacent gap worth
flagging: even after the backend RBAC fix, the frontend must actually consume it via `ProtectedComponent`, or a
user who can't call the endpoint still sees fully-interactive buttons that 403 on click (bad error-recovery UX,
violates the "all states handled" requirement).

### 3.3 Structural rewrite needed regardless of A or B

Independent of which scenario backend picks, this page violates enough conventions that frontend-developer should
rewrite its shell while doing this work (do not treat this as copy-only):

- No `PageHeader` component used — hand-rolled `<h1>`/`<p>` (lines 76–83) instead of the `PageHeader` used
  consistently elsewhere (e.g. `matrix/page.tsx` lines 71–79). **Must use `PageHeader` with `breadcrumbs`** for
  consistency — this is a "breaking consistency with existing pages" violation per the pushback protocol.
- Raw `<table>` with fully inline styles (lines 133–184) instead of `DataTable` from `@unerp/ui`, which already
  provides the loading-skeleton and empty-state behavior this page hand-rolls badly (loading state is a bare spinner
  centered in a `colSpan` cell, line 144–149; empty state is a plain text row, line 176–182 — both are exactly what
  `DataTable`'s `loading`/`emptyTitle`/`emptyMessage` props already solve for free).
- All buttons are raw `<button>` with inline styles instead of `Button` from `@unerp/ui` (lines 85–102, 158–171) —
  a direct violation of AGENTS.md rule 5 (no inline styles for layout/forms, use `.frappe-*`/`@unerp/ui` primitives).
- No breadcrumb registration issue — `backups` **is** already correctly registered in
  `apps/web/src/navigation/registry.tsx` (`backups: 'Database Backups'`), so the automatic breadcrumb from the
  dashboard layout will work once `PageHeader` is actually used; the current hand-rolled header bypasses that system
  entirely, so today's page shows no breadcrumb trail at all despite the registry entry existing.

---

## 4. Small non-controversial fixes made directly in this pass

None applied to source in this pass. Everything found (the raw-`<table>`/inline-style/no-`PageHeader`/no-permission-
gating issues on `apps/web/app/(dashboard)/admin/backups/page.tsx`, and the `<div onClick>` non-semantic toggle in
`RoleCard` at `apps/web/app/(dashboard)/admin/access-control/roles/page.tsx` line 150) is entangled with the P0-1
sequencing dependency or is a large enough structural rewrite (Section 3.3) that it should land as one reviewable
diff with the copy/permission-gating changes above, not as a drive-by edit ahead of backend-developer's fix. Bundling
avoids two frontend PRs touching the same file inside one sprint.

---

## 5. Summary of required sequencing

1. **backend-developer**: fix decorator bug + fill registry with ~30 `admin.*` fine-grained codes, including the new
   `category` field per Section 2.1 (coordinate exact category names with this doc).
2. **backend-developer**: decide backup scenario A vs. B; if A, confirm the `source: 'REAL'` response field; if B,
   confirm `source: 'SIMULATED'` field ships so frontend can branch without another round-trip.
3. **frontend-developer**: implement Section 2 (matrix drill-in drawer + roles category nesting) and Section 3
   (backups copy + structural rewrite to `PageHeader`/`DataTable`/`Button`/`ProtectedComponent`/`DemoBanner`),
   informed by whichever scenario backend chose.
4. **qa-tester**: verify the matrix drawer and category checkboxes reflect real 403 behavior post-fix (US-P0-1a),
   and that the backups page cannot be screenshotted/exported showing "Simulated" data without the badge present if
   scenario B ships.
