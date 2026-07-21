import { describe, it, expect, vi, beforeEach } from "vitest";
import { Reflector } from "@nestjs/core";
import { ForbiddenException } from "@nestjs/common";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { PERMISSIONS_KEY } from "../../../common/decorators/permissions.decorator";
import { SaasPortalSecurityController as SecurityController } from "../../saas-portal/controllers/security.controller";
import { AdminController } from "../admin.controller";
import { AutomationRulesController } from "../automation-rules.controller";
import { SuperAdminController } from "../super-admin.controller";
import { OperationsController } from "../operations.controller";

/**
 * QA independent verification of US-P0-1a (.ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md).
 *
 * This is deliberately NOT a duplicate of `permissions-drift.spec.ts` (which statically greps
 * controller source text for stacked decorators and registry drift) nor of
 * `rbac.guard.spec.ts` (which proves RbacGuard's matrix logic against a hand-built Reflector
 * mock with permission strings invented by the test author).
 *
 * The gap this file closes: nobody has proven that the REAL metadata NestJS reads off the REAL
 * admin controller classes (via `Reflect.getMetadata(PERMISSIONS_KEY, handler)`, exactly as
 * `Reflector.getAllAndOverride` does at runtime) actually resolves to a single fine-grained
 * permission per handler, and that RbacGuard's enforcement against that real metadata produces
 * the exact 200/403 behavior the acceptance criteria describe. This is what would have caught
 * the original P0-1 bug end-to-end (real decorator metadata -> real guard -> real allow/deny),
 * as opposed to the two existing tests which each verify one half of the chain in isolation.
 *
 * A real Reflector instance is used (not mocked) so `getAllAndOverride` runs its real
 * first-defined-wins-across-context-array logic against real reflect-metadata written by the
 * real `@Permissions(...)` decorator on the real controller class prototypes.
 */

vi.mock("@unerp/database", () => ({
  prisma: {
    userRole: { findMany: vi.fn() },
  },
  runWithTenantSession: vi.fn((_session: unknown, fn: () => unknown) =>
    Promise.resolve(fn()),
  ),
}));

import { prisma } from "@unerp/database";

function buildContext(
  user: unknown,
  handler: () => unknown,
  controllerClass: unknown,
) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => handler,
    getClass: () => controllerClass,
  } as any;
}

function roleWithPermissions(permissions: string[]) {
  return { role: { permissions: JSON.stringify(permissions) } };
}

async function callWithRole(
  guard: RbacGuard,
  controllerClass: any,
  handlerName: string,
  permissions: string[],
) {
  (prisma.userRole.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
    permissions.length ? [roleWithPermissions(permissions)] : [],
  );
  const handler = controllerClass.prototype[handlerName];
  return guard.canActivate(
    buildContext({ userId: "u1" }, handler, controllerClass),
  );
}

describe("Admin RBAC regression sweep (US-P0-1a, real controller metadata)", () => {
  let guard: RbacGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RbacGuard(new Reflector());
  });

  it("sanity check: each targeted handler carries exactly ONE fine-grained permission in real metadata (proves the decorator-stacking bug is fixed, not just registry-filled)", () => {
    const targets: Array<[any, string, string]> = [
      [SecurityController, "getActiveSessions", "admin.security.read"],
      [AdminController, "getGroups", "admin.user-group.read"],
      [AutomationRulesController, "createRule", "admin.automation.create"],
      [SuperAdminController, "getTenants", "system.tenant.read"],
      [OperationsController, "getBackups", "system.operations.backup"],
    ];

    for (const [controllerClass, handlerName, expectedCode] of targets) {
      const metadata = Reflect.getMetadata(
        PERMISSIONS_KEY,
        controllerClass.prototype[handlerName],
      );
      expect(
        metadata,
        `${controllerClass.name}.${handlerName} metadata`,
      ).toEqual([expectedCode]);
    }
  });

  describe("(a) a role with ONLY the matching fine-grained permission succeeds", () => {
    it("GET /saas-portal/security/sessions succeeds with only admin.security.read", async () => {
      await expect(
        callWithRole(guard, SecurityController, "getActiveSessions", [
          "admin.security.read",
        ]),
      ).resolves.toBe(true);
    });

    it("GET /admin/user-groups (getGroups) succeeds with only admin.user-group.read", async () => {
      await expect(
        callWithRole(guard, AdminController, "getGroups", [
          "admin.user-group.read",
        ]),
      ).resolves.toBe(true);
    });

    it("POST /admin/automation-rules succeeds with only admin.automation.create", async () => {
      await expect(
        callWithRole(guard, AutomationRulesController, "createRule", [
          "admin.automation.create",
        ]),
      ).resolves.toBe(true);
    });

    it("GET /super-admin/tenants succeeds with only system.tenant.read", async () => {
      await expect(
        callWithRole(guard, SuperAdminController, "getTenants", [
          "system.tenant.read",
        ]),
      ).resolves.toBe(true);
    });

    it("GET /admin/operations/backups succeeds with only system.operations.backup", async () => {
      await expect(
        callWithRole(guard, OperationsController, "getBackups", [
          "system.operations.backup",
        ]),
      ).resolves.toBe(true);
    });
  });

  describe("(b) a role with an unrelated fine-grained permission is rejected (403)", () => {
    it("admin.security.read does NOT grant GET /admin/user-groups", async () => {
      await expect(
        callWithRole(guard, AdminController, "getGroups", [
          "admin.security.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.user-group.read does NOT grant POST /admin/automation-rules", async () => {
      await expect(
        callWithRole(guard, AutomationRulesController, "createRule", [
          "admin.user-group.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.automation.read does NOT grant GET /super-admin/tenants (tenant-scoped fine-grained code must not cross into system-scoped surface)", async () => {
      await expect(
        callWithRole(guard, SuperAdminController, "getTenants", [
          "admin.automation.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.operations.read does NOT grant GET /admin/operations/backups (tenant-scoped operations permission must not reach the platform-wide backup surface)", async () => {
      await expect(
        callWithRole(guard, OperationsController, "getBackups", [
          "admin.operations.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("system.tenant.read does NOT grant GET /saas-portal/security/sessions", async () => {
      await expect(
        callWithRole(guard, SecurityController, "getActiveSessions", [
          "system.tenant.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("(c) a role with ONLY the legacy coarse admin.read is rejected everywhere (no more backdoor)", () => {
    it("admin.read does NOT grant GET /saas-portal/security/sessions", async () => {
      await expect(
        callWithRole(guard, SecurityController, "getActiveSessions", [
          "admin.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.read does NOT grant GET /admin/user-groups", async () => {
      await expect(
        callWithRole(guard, AdminController, "getGroups", ["admin.read"]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.read does NOT grant GET /admin/automation-rules (getRules)", async () => {
      await expect(
        callWithRole(guard, AutomationRulesController, "getRules", [
          "admin.read",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("admin.read does NOT grant GET /admin/operations/backups (coarse tenant admin must never reach the Super-Admin-only backup surface)", async () => {
      await expect(
        callWithRole(guard, OperationsController, "getBackups", ["admin.read"]),
      ).rejects.toThrow(ForbiddenException);
    });

    it("the coarse admin.* wildcard (a role granted blanket admin module access) is the only way coarse grants still work — a bare admin.read string grants nothing on its own", async () => {
      // Documents the one legitimate escape hatch: `admin.*` (module wildcard) still matches
      // fine-grained codes via hasPermission's wildcard rule, by design (super-admin-style
      // roles). This is intentionally different from the literal string `admin.read` used
      // above, which is NOT a wildcard and matches nothing but itself.
      await expect(
        callWithRole(guard, SecurityController, "getActiveSessions", [
          "admin.*",
        ]),
      ).resolves.toBe(true);
    });
  });

  describe("cross-check: GET /admin/operations/jobs (tenant-scoped admin.operations.read) still works normally and is distinct from the backup surface", () => {
    it("admin.operations.read grants GET /admin/operations/jobs", async () => {
      await expect(
        callWithRole(guard, OperationsController, "getBackgroundJobs", [
          "admin.operations.read",
        ]),
      ).resolves.toBe(true);
    });

    it("system.operations.backup does NOT grant GET /admin/operations/jobs (permission boundary is not accidentally bidirectional)", async () => {
      await expect(
        callWithRole(guard, OperationsController, "getBackgroundJobs", [
          "system.operations.backup",
        ]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Backup permission boundary (P1-1 RBAC boundary): a realistic full Tenant Admin persona is rejected", () => {
    // Simulates a normal Tenant Admin role seeded with the full realistic fine-grained
    // "admin.*" operational set (every admin.<resource>.<action> code EXCEPT the new
    // Super-Admin-only system.operations.backup) — this is the exact persona the
    // completion requirements doc (P1-1 Cross-cutting requirements) says must be excluded
    // from the backup surface, not just an isolated single-permission role.
    const realisticTenantAdminPermissions = [
      "admin.user.read",
      "admin.user.create",
      "admin.user.update",
      "admin.user.delete",
      "admin.role.read",
      "admin.setting.read",
      "admin.setting.update",
      "admin.security.read",
      "admin.security.update",
      "admin.automation.read",
      "admin.automation.create",
      "admin.automation.update",
      "admin.automation.delete",
      "admin.operations.read",
      "admin.operations.update",
      "admin.user-group.read",
      "admin.user-group.create",
      "admin.user-group.update",
      "admin.user-group.delete",
      "admin.platform.read",
      "admin.platform.update",
    ];

    it("POST /admin/operations/backups/create is rejected for a fully-provisioned Tenant Admin lacking system.operations.backup", async () => {
      await expect(
        callWithRole(
          guard,
          OperationsController,
          "createBackup",
          realisticTenantAdminPermissions,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("GET /admin/operations/backups (list) is rejected for the same Tenant Admin persona", async () => {
      await expect(
        callWithRole(
          guard,
          OperationsController,
          "getBackups",
          realisticTenantAdminPermissions,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("the same Tenant Admin persona legitimately succeeds on tenant-scoped admin.operations.* endpoints (proves the rejection above is a real boundary, not a broken guard)", async () => {
      await expect(
        callWithRole(
          guard,
          OperationsController,
          "getBackgroundJobs",
          realisticTenantAdminPermissions,
        ),
      ).resolves.toBe(true);
      await expect(
        callWithRole(
          guard,
          OperationsController,
          "retryJobs",
          realisticTenantAdminPermissions,
        ),
      ).resolves.toBe(true);
    });

    it('only a role literally granted system.operations.backup (or a "*"/"system.*" wildcard) can create or list backups', async () => {
      await expect(
        callWithRole(guard, OperationsController, "createBackup", [
          "system.operations.backup",
        ]),
      ).resolves.toBe(true);
      await expect(
        callWithRole(guard, OperationsController, "createBackup", ["system.*"]),
      ).resolves.toBe(true);
    });
  });
});
