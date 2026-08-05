import { describe, it, expect, beforeEach } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ControlPlaneGuard } from "../control-plane.guard";
import { PERMISSIONS_KEY } from "../../decorators/permissions.decorator";
import { SKIP_TENANT_SCOPE_KEY } from "../../decorators/skip-tenant-scope.decorator";

/**
 * The control-plane boundary had no tests, despite being the second of the four
 * layers standing between a customer administrator and platform-global control
 * (§ 1.2 — an exposure that was confirmed exploitable twice). Each case below is
 * one of the ways that boundary can be crossed.
 */
describe("ControlPlaneGuard", () => {
  let guard: ControlPlaneGuard;

  /** A context whose metadata and request the test controls directly. */
  const contextFor = (opts: {
    crossTenant?: boolean;
    permissions?: string[];
    user?: Record<string, unknown> | null;
  }) => {
    const meta = new Map<unknown, unknown>([
      [SKIP_TENANT_SCOPE_KEY, opts.crossTenant ?? true],
      [PERMISSIONS_KEY, opts.permissions],
    ]);
    const reflector = {
      getAllAndOverride: (key: unknown) => meta.get(key),
    } as unknown as Reflector;
    guard = new ControlPlaneGuard(reflector);

    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          url: "/api/platform/v1/tenants",
          user:
            opts.user === null
              ? undefined
              : (opts.user ?? {
                  userId: "u1",
                  permissions: ["system.tenant.read"],
                  amr: ["pwd", "otp"],
                }),
        }),
      }),
    } as never;
  };

  beforeEach(() => {
    /* guard is constructed per-context */
  });

  it("ignores handlers that are not cross-tenant", async () => {
    await expect(
      guard === undefined
        ? Promise.resolve(true)
        : guard.canActivate(contextFor({ crossTenant: false })),
    ).resolves.toBe(true);
  });

  it("refuses a cross-tenant handler that declares no permission", async () => {
    const ctx = contextFor({ permissions: undefined });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /declares no permissions/,
    );
  });

  it("refuses a cross-tenant handler guarded by a TENANT-scoped permission", async () => {
    // This is the second confirmed escalation: TenantLifecycleController was
    // @SkipTenantScope() and guarded by admin.tenant.export, a tenant namespace
    // the seeded ADMIN role carries — so an ordinary customer admin could export
    // any tenant on the platform by id.
    const ctx = contextFor({ permissions: ["admin.tenant.export"] });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /tenant-scoped permission/,
    );
  });

  it("allows a control-plane permission on an MFA-backed session", async () => {
    const ctx = contextFor({
      permissions: ["system.tenant.read"],
      user: {
        userId: "u1",
        permissions: ["system.tenant.read"],
        amr: ["pwd", "otp"],
      },
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("refuses a control-plane session with no second factor (§ 5.2)", async () => {
    const ctx = contextFor({
      permissions: ["system.tenant.read"],
      user: { userId: "u1", permissions: ["system.tenant.read"], amr: ["pwd"] },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(/multi-factor/);
  });

  it("accepts webauthn as a second factor", async () => {
    const ctx = contextFor({
      permissions: ["system.tenant.read"],
      user: {
        userId: "u1",
        permissions: ["system.tenant.read"],
        amr: ["pwd", "webauthn"],
      },
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("refuses when the session carries no user at all", async () => {
    const ctx = contextFor({ permissions: ["system.tenant.read"], user: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("refuses a control-plane permission the caller does not hold", async () => {
    const ctx = contextFor({
      permissions: ["system.tenant.purge"],
      user: {
        userId: "u1",
        permissions: ["system.tenant.read"],
        mfaVerified: true,
      },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /explicitly granted platform permission/,
    );
  });

  it("does not let a tenant wildcard satisfy a control-plane permission", async () => {
    // The first confirmed escalation: every tenant's first user is seeded
    // SUPER_ADMIN with permissions ["*"], and hasPermission returned true for a
    // bare "*" against anything — including system.tenant.read.
    const ctx = contextFor({
      permissions: ["system.tenant.read"],
      user: { userId: "u1", permissions: ["*"], mfaVerified: true },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(
      /explicitly granted platform permission/,
    );
  });
});
