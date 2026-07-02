# Admin Module — UAT Sign-off

> Role: business-analyst-uat | Date: 2026-07-02
> Scope: P0-1 (RBAC decorator fix + registry fill), P0-2 (Automation Rules real execution engine),
> P1-1 (honest backup labeling + Super-Admin-only `system.operations.backup` gate)
> Inputs reviewed: `.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md`, `.ai/ADMIN_SECURITY_AUDIT.md`,
> `.ai/ADMIN_UI_ACCESS_CONTROL_SPEC.md`, plus the 4 evidence files below read directly.

## Verdict: UAT PASSED

The three closed gaps (P0-1 RBAC, P0-2 automation runtime, P1-1 backups/jobs) meet their acceptance
criteria as specified. Admin is cleared to move back to ACTIVE.

## Evidence walked, as a Tenant Admin / Ops Admin persona would experience it

**1. RBAC regression sweep** — `apps/api/src/modules/admin/tests/rbac-regression-sweep.spec.ts`
Uses a real `Reflector` against real controller class metadata (not a mocked reflector), which is
exactly the gap the security audit flagged as unverified. Confirms, with real 200/403 assertions:
- A role with only `admin.security.read` succeeds on `SecurityController.getActiveSessions` and is
  rejected on `AdminController.getGroups` (unrelated admin sub-resource) — satisfies US-P0-1a Given/When/Then.
- A role with only the coarse legacy `admin.read` is rejected on security, user-groups, automation-rules,
  and backups endpoints — the coarse backdoor is closed, per spec.
- Bonus coverage beyond the minimum ask: `SuperAdminController.getTenants` requires `system.tenant.read`
  specifically (closes the tenant-enumeration leak called out in the security audit), and a full
  "realistic Tenant Admin" persona with every tenant-scoped `admin.*` grant except
  `system.operations.backup` is still correctly rejected from the backup surface — this directly
  proves the P1-1 RBAC boundary recommendation from the security audit was implemented, not just the
  narrower P0-1 ask.

**2. Seed data non-breaking check** — `packages/database/prisma/seed.ts` line 20:
`ADMIN: { permissions: ['admin.*', 'finance.*', 'hr.*', 'crm.*', 'inventory.*'], ... }`
Confirmed wildcard, not literal `admin.read`/`admin.create`/etc. Per `hasPermission`'s wildcard rule
(exercised in the regression sweep's own `admin.*` test), this means the seeded Admin role keeps full
access to every newly-live fine-grained code with zero re-seeding needed. This satisfies the PM doc's
explicit blocking condition ("business-analyst-uat: do not sign off P0-1 until the seed-data
re-alignment is confirmed shipped alongside it") — it is shipped, via wildcard rather than an
enumerated list, which is an equally valid (and lower-maintenance) way to close that gap.

**3. Automation engine edge-case fix** — `apps/api/src/modules/admin/tests/automation-rule-engine.tenant-isolation-and-edge-cases.spec.ts`
Test `'FIXED: a rule with malformed (non-array, e.g. object) conditions is recorded as FAILED and
does not block sibling rules in the same batch'` (line 188) asserts: `thrown` is `undefined` (no
exception escapes the event handler), the malformed rule gets a `FAILED` execution row with a
descriptive `error` message (audit trail preserved per US-P0-2b), and the well-formed sibling rule
(`rule-well-formed`) still produces its own execution row — `toHaveBeenCalledTimes(2)` proves the
batch was not aborted. This matches the QA-findings note in the PM doc exactly.

**4. Backups page honesty + permission gate** — `apps/web/app/(dashboard)/admin/backups/page.tsx`
Copy matches the uiux-designer's Scenario B (simulated) spec precisely: title "Backup & Restore
Manager (Preview)", subtitle disclaims "do not yet produce a restorable database file," button reads
"Simulate Backup Run," success toast says "No file was written," a `DemoBanner`-equivalent warning
box repeats the disclosure, and every row carries a `Badge variant="warning"` "Simulated" tag sourced
from a real `source: 'REAL' | 'SIMULATED'` field (line 16). No "point-in-time recovery" or similar
overclaiming language remains. `ProtectedComponent permission={PERMISSION}` (`PERMISSION =
'system.operations.backup'`, line 19) gates both the action buttons and the entire list view, with an
honest fallback message for unauthorized users. This closes the "page has no permission gating
visible in the component at all" gap the UI spec flagged.

## Known limitations accepted as out of scope (not blocking)

- Automation rule execution idempotency (duplicate event delivery double-firing) — tracked as P2,
  acceptable under today's synchronous at-most-once emitter semantics.
- Scheduled Tasks → real handler dispatch — tracked as P2, narrower follow-up to P1-1.
- The project-wide stacked-`@Permissions` defect found in 54 other controllers (security audit
  Section 2) is **not** in scope for this sign-off — this UAT covers only the Admin module fix.
  Flagging again here for visibility: the same defect is live today in Finance, CRM, HR, Inventory,
  POS, and 20+ other modules and should be escalated as its own hardening-plan item.

## What was tested vs. what was not

Tested by direct evidence file inspection (per task instructions, full test suite already verified
independently and not re-run here): RBAC enforcement logic, seed data shape, automation engine
error-isolation logic, backups page copy and permission gate. Not walked in this pass: live
browser/API smoke test of the Access Control matrix UI restructuring (still pending
frontend-developer per the UI spec's sequencing) — that is a separate, not-yet-shipped follow-on and
does not block this sign-off since it was never claimed as delivered in this sprint.

**UAT PASSED: Admin module's P0-1 (RBAC), P0-2 (automation engine), and P1-1 (backups/jobs honesty)
fixes are ready for release.**
