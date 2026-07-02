# Security Audit -- RBAC Decorator-Stacking Defect (Project-Wide)

> Auditor: security-auditor | Date: 2026-07-02
> Trigger: PM finding in .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md, Section 1 ("Root-cause finding")
> Scope of this audit: (1) mechanically verify the reported decorator bug, (2) sweep the ENTIRE codebase (not just
> admin) for the same pattern, (3) recommend the RBAC boundary for backup/restore operations (P1-1).
> This audit does NOT fix any code -- findings and recommendations only, per instructions.

---

## 1. Mechanical verification of the reported bug -- CONFIRMED, exact mechanics as described

Source inspected:
- apps/api/src/common/decorators/permissions.decorator.ts
- apps/api/src/common/guards/rbac.guard.ts
- node_modules/.pnpm/@nestjs+core.../reflector.service.js (Reflector.getAllAndOverride)

permissions.decorator.ts:

    export const PERMISSIONS_KEY = 'permissions';
    export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

SetMetadata (NestJS core) calls Reflect.defineMetadata(PERMISSIONS_KEY, permissions, target) -- a single key,
last-write-wins, on whichever target (here: the method) it is applied to.

rbac.guard.ts:

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

Reflector.getAllAndOverride source (confirmed by reading the installed package):

    getAllAndOverride(metadataKeyOrDecorator, targets) {
        for (const target of targets) {
            const result = this.get(metadataKeyOrDecorator, target);
            if (result !== undefined) return result;
        }
        return undefined;
    }

It returns the first defined value found across [handler, class] -- it does not merge multiple values set on the
same target. Since both stacked @Permissions(...) calls write to the same key on the same handler, only the value
written by the last-applied decorator survives.

Empirical proof (ran in this repo's own reflect-metadata install, apps/api/node_modules/reflect-metadata):
Simulating:

    @Permissions('admin.read')
    @Permissions('admin.user.read')
    getUsers() {}

TypeScript/ECMAScript decorators are applied bottom-to-top (the physically lower decorator factory is invoked first).
Running the two SetMetadata calls in that exact order and reading back the metadata produced:

    Winning metadata (single key, last write wins): [ 'admin.read' ]

This confirms: the physically-topmost decorator (the coarse permission) wins; the physically-lower, fine-grained
permission is silently discarded before the guard ever runs. The PM document's mechanics are accurate in every detail.

Additional confirmation the existing test suite does not catch this: apps/api/src/common/guards/tests/rbac.guard.spec.ts
mocks reflector.getAllAndOverride directly (buildReflector(requiredPermissions)), so it validates the guard's
permission-matching logic in isolation but never exercises real @Permissions decorator stacking on a real class --
it would pass today and would continue to pass even if every controller in the codebase had this bug. Recommend
qa-tester add an integration-level test (per US-P0-1b in the PM doc) that reads real decorator metadata off actual
controller classes, not a mocked reflector.

Verdict: Confirmed, no caveats.

---

## 2. Project-wide sweep -- THIS IS NOT ADMIN-SPECIFIC. It is systemic across nearly the entire controller layer.

Method: scanned every *.controller.ts under apps/api/src/modules/** (excluding tests/) for methods with two or
more @Permissions(...) decorators stacked on the same handler (including compact single-line forms like
@Get('x') @Permissions('y')).

Result:
- 1,024 individual endpoint methods across 55 of 71 controller files (77% of all controllers) have the
  stacked-decorator bug.
- This spans effectively every business module in the system, not just Admin.

Per-file counts (methods affected), selected highlights across modules explicitly named in the task:

| Module | File | Affected methods |
|---|---|---|
| CRM | apps/api/src/modules/crm/crm.controller.ts | 177 |
| Builder Studio | apps/api/src/modules/builder/builder.controller.ts | 123 |
| Advanced HR | apps/api/src/modules/advanced-hr/advanced-hr.controller.ts | 90 |
| POS | apps/api/src/modules/pos/pos.controller.ts | 73 |
| Inventory | apps/api/src/modules/inventory/inventory.controller.ts | 69 |
| Manufacturing | apps/api/src/modules/manufacturing/manufacturing.controller.ts | 41 |
| Admin -- Marketplace | apps/api/src/modules/admin/marketplace.controller.ts | 33 |
| Communication/Connect | apps/api/src/modules/communication/communication.controller.ts | 29 |
| Procurement | apps/api/src/modules/procurement/procurement.controller.ts | 28 |
| Admin (core) | apps/api/src/modules/admin/admin.controller.ts | 23 |
| Admin -- Platform | apps/api/src/modules/admin/platform.controller.ts | 22 |
| Documents/Drive | apps/api/src/modules/documents/drive.controller.ts | 21 |
| Projects | apps/api/src/modules/projects/projects.controller.ts | 20 |
| Sales | apps/api/src/modules/sales/sales.controller.ts | 20 |
| Admin -- Security | apps/api/src/modules/admin/security.controller.ts | 18 |
| Education | apps/api/src/modules/education/education.controller.ts | 15 |
| Analytics | apps/api/src/modules/analytics/analytics.controller.ts | 12 |
| Healthcare | apps/api/src/modules/healthcare/healthcare.controller.ts | 12 |
| Finance | apps/api/src/modules/finance/finance.controller.ts | 11 |
| Admin -- Operations | apps/api/src/modules/admin/operations.controller.ts | 10 |
| Marketplace -- Developer | apps/api/src/modules/marketplace/developer.controller.ts | 10 |
| Admin -- Org Hierarchy | apps/api/src/modules/admin/org-hierarchy.controller.ts | 9 |
| API Platform | apps/api/src/modules/api-platform/api-platform.controller.ts | 9 |
| Field Service | apps/api/src/modules/field-service/field-service.controller.ts | 8 |
| HR | apps/api/src/modules/hr/hr.controller.ts | 8 |
| Real Estate | apps/api/src/modules/real-estate/real-estate.controller.ts | 8 |
| Admin -- Super Admin | apps/api/src/modules/admin/super-admin.controller.ts | 7 (see Critical finding below) |
| Healthcare Smart | apps/api/src/modules/healthcare/healthcare-smart.controller.ts | 7 |
| Admin -- GDPR | apps/api/src/modules/admin/gdpr.controller.ts | 6 |
| Storage | apps/api/src/modules/storage/storage.controller.ts | 6 |
| Workflow | apps/api/src/modules/workflow/workflow.controller.ts | 6 |
| Supply Chain | apps/api/src/modules/supply-chain/supply-chain.controller.ts | 5 |
| Reporting | apps/api/src/modules/reporting/*.controller.ts | 4-5 each |
| Notifications | apps/api/src/modules/notifications/notifications.controller.ts | 4 |
| SaaS / Devops / PWA / Localization / Sales-Pricing / Contracts / Costing | various | 1-4 each |

Confirmed representative examples outside Admin (exact file:line, read directly from source):

1. apps/api/src/modules/finance/finance.controller.ts:42-44

       @Permissions('finance.read')
       @Get('invoices')
       @Permissions('finance.invoice.read')
       async getInvoices(...)

2. apps/api/src/modules/crm/crm.controller.ts:110-112 -- cross-module mismatch, worse than same-module case:

       @Permissions('crm.read')
       ...
       @Permissions('procurement.vendor.read')

   The winning (coarse) permission is crm.read, meaning a vendor-read endpoint inside CRM is gated by a CRM
   permission while the intended procurement.vendor.read permission is completely inert -- this is not just loss of
   granularity, it is the wrong module's permission being unenforceable at all.

3. apps/api/src/modules/advanced-finance/advanced-finance.controller.ts:29-31 -- compact single-line form, same bug:

       @Permissions('advanced_finance.read')
       @Get('exchange-rates') @Permissions('finance.report.read')
       async getExchangeRates(...)

4. apps/api/src/modules/pos/pos.controller.ts:37-39

       @Permissions('pos.read')
       @Get('terminals')
       @Permissions('pos.terminal.read')

Critical additional finding -- the bug also affects cross-tenant platform-operator scope, not just fine-grained
tenant permissions:

apps/api/src/modules/admin/super-admin.controller.ts -- the controller explicitly named in the PM doc as the
precedent for @SkipTenantScope() -- has the identical bug on every one of its endpoints:

    @Controller('super-admin')
    @UseGuards(JwtAuthGuard, RbacGuard)
    @SkipTenantScope()          // this controller reads/writes ACROSS ALL TENANTS
    export class SuperAdminController {
      @Permissions('admin.read')
      @Get('tenants')
      @Permissions('system.tenant.read')   // dead; clobbered
      async getTenants() { ... }
      ...
    }

system.tenant.* (the permission actually intended to gate cross-tenant platform-operator access) is dead code here
too. Net effect: any role holding the ordinary tenant-scoped admin.read permission can currently call
GET /super-admin/tenants and enumerate every tenant on the platform, because admin.read -- not system.tenant.read --
is the value the guard actually receives. This is a tenant-isolation-adjacent finding (platform-wide data exposure
via a coarse permission that was never meant to authorize cross-tenant reads) and should be treated with the same
urgency as a Critical tenant-isolation gap, not merely as "some fine-grained RBAC is dead."

Communication/Connect module note: this module (currently mid-refactor per git status) is a mix -- older
endpoints (lines 36-83) have the stacked bug, but several newer-looking endpoints (lines 89, 98, 105, 112) already
use a single @Permissions(...) call correctly. This suggests the bug is a historical/copy-paste pattern from an
early module template, not a hard architectural constraint -- newer code in the same file demonstrates the correct
pattern already exists in the codebase and can be replicated.

Scope conclusion: The bug described as "admin-specific" in the PM doc is in fact a codebase-wide RBAC integrity
failure. Fixing it only in the 19 admin controllers (360 call sites, per the PM doc) leaves roughly 664 affected
endpoints in every other business module (Finance, CRM, HR, Inventory, POS, Procurement, Sales, Manufacturing,
Projects, Healthcare, Education, Real Estate, Field Service, Analytics, Documents, Communication, Reporting,
API Platform, Marketplace, Builder, SaaS, Workflow, Supply Chain, Storage, Notifications) still silently enforcing
only coarse module-level permissions. This changes the severity and scope of the fix from "an Admin module defect"
to "a platform-wide RBAC defect that happens to have been discovered via the Admin module." Recommend this be
escalated as its own P0 item at the Enterprise Hardening Plan level, tracked as a single systemic fix (with a shared
lint rule / codemod, not 20 separate module-by-module passes), rather than being fixed piecemeal only where a PM
investigation happens to look next.

Recommended guardrail (US-P0-1b generalized): Add a project-wide static check -- either an ESLint rule or a
build-time test that parses apps/api/src/modules/**/*.controller.ts and fails if any method has more than one
@Permissions(...) decorator applied to it. This is a mechanical, unambiguous pattern (multiple calls to the same
SetMetadata key is never valid, since Permissions() already accepts a variadic ...permissions: string[] and the
guard's hasPermission check already requires ALL listed permissions -- the correct way to require two permissions is
@Permissions('a', 'b') in a single call, not two stacked decorators). This check should run in CI and block merges,
not just admin-scoped.

---

## 3. RBAC boundary recommendation for backup/restore operations (P1-1)

Recommendation: create a new system.operations.backup permission, scoped to Super Admin / Platform Operator only,
enforced via @SkipTenantScope() on a dedicated controller (or a clearly separated route group) -- do NOT rely on
tenant-scoped admin.operations.* for actual pg_dump/restore actions.

Justification:

1. Blast radius mismatch. A full Postgres backup/restore, by definition, captures every tenant's data in one
   physical operation -- there is no way to pg_dump "just this tenant's rows" without a schema built for per-tenant
   database/schema separation, which this system does not have (multi-tenancy here is row-level, per
   .ai/SECURITY.md Section 3: single shared tables + tenant_id filter + RLS). Granting admin.operations.update
   to a Tenant Admin -- a role that is, by design, meant to be tenant-scoped -- and then allowing that same
   permission to trigger a backup of the entire database is a privilege-boundary violation: the permission's
   declared scope (this tenant's admin operations) does not match the action's actual blast radius (every
   tenant's data).

2. Restore is even more dangerous than backup. If/when a restore capability is added (implied by "real,
   restorable database dump" in US-P1-1a), a tenant-scoped admin triggering a full-instance restore could roll back
   or overwrite every other tenant's data to a prior state -- a catastrophic cross-tenant integrity and
   availability incident. This must never be reachable by a permission any individual tenant's Admin role could
   hold.

3. Precedent already exists and fits cleanly. SuperAdminController already demonstrates the intended pattern
   for instance-wide, cross-tenant operations: @SkipTenantScope() at the controller level plus a system.*
   permission namespace (system.tenant.read, system.tenant.create) distinct from tenant-scoped admin.*
   permissions. Backups should follow the same convention: system.operations.backup (and
   system.operations.restore if/when restore ships), not an extension of admin.operations.*.
   Caveat found during this audit: SuperAdminController itself currently has the same stacked-decorator bug
   (Section 2), so system.tenant.read is not actually enforced today. The system.operations.backup permission
   must be introduced using a single, non-stacked @Permissions('system.operations.backup') call from day one --
   do not perpetuate the broken pattern into new code, and this newly-added permission is a good forcing function
   to also fix SuperAdminController's existing instances of the bug in the same change.

4. Current state confirms the risk is live today, not hypothetical. apps/api/src/modules/admin/operations.controller.ts
   is presently @UseInterceptors(TenantInterceptor)-scoped (not @SkipTenantScope()), and its backup endpoints
   (GET /admin/operations/backups, POST /admin/operations/backups/create) are gated only by the coarse
   admin.read/admin.create permissions (the fine admin.operations.read/admin.operations.update are dead due to
   the Section 2 bug). Today, backups are simulated (per P1-1's existing-coverage note -- fabricated sizeBytes, no
   real pg_dump), so the current exposure is limited to fabricated metadata, not real data. However, once
   backend-developer implements a real pg_dump per P1-1 scope option (a), this same coarse-admin.read gate would
   become the only thing standing between any tenant-level admin and a real, instance-wide database dump. The RBAC
   boundary must be corrected in the same change that makes backups real -- shipping a real pg_dump behind the
   current (broken, coarse, tenant-admin-reachable) permission gate would itself be a Critical vulnerability.

5. Recommended shape:
   - New permission: system.operations.backup (and system.operations.restore if restore is added), registered in
     packages/shared/src/permissions/registry.ts under a system module namespace (matching system.tenant.*
     precedent), with level: 'endpoint'.
   - Enforcement: apply on the specific backup-creation/download/restore endpoints only -- it is reasonable for
     backup visibility (e.g., listing existing backup metadata for the current tenant's audit trail, if any
     tenant-facing backup status view is kept) to remain tenant-scoped under admin.operations.read, but the actual
     pg_dump/restore execution endpoints must require system.operations.backup and should live on a
     @SkipTenantScope() controller (either move them into SuperAdminController or create a new
     SystemOperationsController following the same pattern) so a coarse tenant admin.* grant can never reach them.
   - Do not seed this permission to any tenant-level role by default; it should only ever be assigned to a genuine
     Platform Operator / Super Admin role.

---

## What this audit did NOT cover (explicitly out of scope)

- No code fixes were made (per task instructions -- this is backend-developer's work).
- Did not audit whether the registered permission strings in packages/shared/src/permissions/registry.ts match
  the fine-grained (currently-dead) @Permissions(...) literals for every one of the 1,024 affected endpoints
  project-wide -- that drift check (US-P0-1b generalized) should be automated as recommended above rather than
  done manually here.
- Did not review seed-data/role-assignment impact of switching enforcement from coarse to fine-grained permissions
  project-wide (flagged in the PM doc as a required paired change for Admin; the same caution applies
  project-wide -- any role currently relying on coarse module permissions, e.g. finance.read, crm.read, pos.read,
  will need re-seeding with the newly-live fine-grained permissions across ALL modules, not just Admin, or those
  roles will silently lose access once the bug is fixed).
- Did not perform a full tenant-isolation query-level audit (missing tenant_id filters in Prisma calls) -- this
  audit was scoped specifically to the decorator/RBAC-enforcement mechanism per the task request. A follow-up
  sweep of $queryRaw/service-layer tenant filtering is recommended separately.
- Did not review the Automation Rules execution engine (P0-2) or the backup-implementation feasibility itself
  (P1-1's pg_dump-from-container question) -- those are devops-engineer/backend-developer implementation
  concerns, not RBAC-boundary concerns.
