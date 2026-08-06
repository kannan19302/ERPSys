import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RbacGuard } from "../rbac.guard";

// This suite exists to prove RbacGuard's *actual* enforcement logic rather than
// decorator presence. It previously stubbed `userRole.findMany` and asserted
// against roles loaded from the database — but RbacGuard reads the permission
// list off the JWT claims that JwtAuthGuard already attached to `request.user`,
// and never touches the database at all. Those stubs were inert: every "denies"
// case passed only because `user.permissions` was undefined, which collapses to
// `[]` and denies everything, and every "allows" case failed for the same
// reason. The matrix below drives the guard through the input it genuinely
// consumes, so a regression in `hasPermission` wiring now actually fails here.
//
// Consequence worth knowing: because permissions ride on the token, a revoked
// role stays effective until the token is refreshed. Session revocation is
// handled separately, in JwtAuthGuard.
vi.mock("@unerp/database", () => {
  const mocked = {
    prisma: { userRole: { findMany: vi.fn() } },
    runWithTenantSession: vi.fn((_session: unknown, fn: () => unknown) => fn()),
  };
  return { ...mocked, idpPrisma: mocked.prisma };
});

import { idpClient as idpPrisma } from "@/common/idp-client";

function buildContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function buildReflector(requiredPermissions: string[] | undefined): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(requiredPermissions),
  } as unknown as Reflector;
}

/** A caller carrying the given permission claims. */
function callerWith(permissions: unknown) {
  return { userId: "u1", permissions };
}

describe("RbacGuard — permission matrix (deny-by-default enforcement)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the request through when the handler requires no permissions", async () => {
    const guard = new RbacGuard(buildReflector(undefined));
    const result = await guard.canActivate(buildContext(callerWith([])));
    expect(result).toBe(true);
  });

  it("never queries the database — permissions come from the token", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.read"]));
    await guard.canActivate(buildContext(callerWith(["finance.invoice.read"])));
    expect(idpPrisma.userRole.findMany).not.toHaveBeenCalled();
  });

  it("throws if there is no authenticated user on the request", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.read"]));
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("denies by default when the token carries no permissions at all", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.read"]));
    await expect(
      guard.canActivate(buildContext(callerWith([]))),
    ).rejects.toThrow(ForbiddenException);
  });

  it("denies when the caller has permissions but none grant the required one", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.create"]));
    await expect(
      guard.canActivate(buildContext(callerWith(["hr.employee.read"]))),
    ).rejects.toThrow(ForbiddenException);
  });

  it("allows when the token grants the exact required permission", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.create"]));
    await expect(
      guard.canActivate(buildContext(callerWith(["finance.invoice.create"]))),
    ).resolves.toBe(true);
  });

  it("allows via a module wildcard", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.void"]));
    await expect(
      guard.canActivate(buildContext(callerWith(["finance.*"]))),
    ).resolves.toBe(true);
  });

  it("requires ALL listed permissions when a handler declares more than one", async () => {
    const guard = new RbacGuard(
      buildReflector(["finance.invoice.read", "finance.invoice.create"]),
    );
    await expect(
      guard.canActivate(buildContext(callerWith(["finance.invoice.read"]))),
    ).rejects.toThrow(ForbiddenException);
  });

  it("aggregates permissions granted across several roles into one claim list", async () => {
    const guard = new RbacGuard(
      buildReflector(["finance.invoice.read", "finance.invoice.create"]),
    );
    await expect(
      guard.canActivate(
        buildContext(
          callerWith(["finance.invoice.read", "finance.invoice.create"]),
        ),
      ),
    ).resolves.toBe(true);
  });

  it("denies when the permissions claim is malformed rather than granting access", async () => {
    const guard = new RbacGuard(buildReflector(["finance.invoice.read"]));
    await expect(
      guard.canActivate(buildContext(callerWith("not-an-array"))),
    ).rejects.toThrow(ForbiddenException);
  });

  it("does not let a same-prefix module wildcard leak into an unrelated module (regression)", async () => {
    const guard = new RbacGuard(buildReflector(["financial.report.read"]));
    await expect(
      guard.canActivate(buildContext(callerWith(["finance.*"]))),
    ).rejects.toThrow(ForbiddenException);
  });

  it("only grants control-plane permissions to control-plane claims", async () => {
    const guard = new RbacGuard(buildReflector(["system.tenant.delete"]));
    // An explicit control-plane wildcard grants.
    await expect(
      guard.canActivate(buildContext(callerWith(["system.*"]))),
    ).resolves.toBe(true);
    // A tenant-scoped wildcard does not — and neither does the global `*`,
    // which is deliberate: reaching the control plane requires a claim in the
    // control-plane namespace, never a broad tenant grant.
    await expect(
      guard.canActivate(buildContext(callerWith(["finance.*"]))),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      guard.canActivate(buildContext(callerWith(["*"]))),
    ).rejects.toThrow(ForbiddenException);
  });
});
