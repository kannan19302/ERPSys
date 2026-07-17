import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { EcommercePublicController } from '../ecommerce-public.controller';
import { PublicTenantResolverGuard } from '../guards/public-tenant-resolver.guard';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';

/**
 * Proves the acceptance criterion in
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 9, item 10: "public controller
 * has explicit tests proving it does NOT require a JWT/Authorization header."
 * We can't spin up a full HTTP server here without a database, so this
 * verifies the same guarantee at the metadata level: the controller is
 * guarded ONLY by `PublicTenantResolverGuard` (no `JwtAuthGuard`/`RbacGuard`),
 * and none of its handlers carry `@Permissions()` metadata.
 */
describe('EcommercePublicController — unauthenticated by design', () => {
  it('is guarded only by PublicTenantResolverGuard, not JwtAuthGuard/RbacGuard', () => {
    const guards = Reflect.getMetadata('__guards__', EcommercePublicController) as unknown[] | undefined;
    expect(guards).toBeDefined();
    expect(guards).toContain(PublicTenantResolverGuard);
    expect(guards).not.toContain(JwtAuthGuard);
    expect(guards).not.toContain(RbacGuard);
  });

  it('has no @Permissions() metadata on any handler (public by design, not an oversight)', () => {
    const prototype = EcommercePublicController.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter((name) => name !== 'constructor');

    expect(methodNames.length).toBeGreaterThan(0);

    for (const name of methodNames) {
      const handler = (prototype as unknown as Record<string, (...args: unknown[]) => unknown>)[name];
      const permissions = Reflect.getMetadata(PERMISSIONS_KEY, handler);
      expect(permissions, `handler "${name}" should not carry @Permissions() metadata`).toBeUndefined();
    }
  });
});
