import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * PublicTenantResolverGuard — the ONE sanctioned way to resolve tenant context
 * for the storefront's public, unauthenticated `store/:tenantSlug/*` routes.
 *
 * These routes serve anonymous external customers who have no UniERP login —
 * there is no JWT, so the standard `JwtAuthGuard` + `RbacGuard` pair cannot be
 * used, and this is a deliberate, documented exception to AGENTS.md Rule 15
 * ("every endpoint MUST use @Permissions") — see
 * .ai/ECOMMERCE_MODULE_REQUIREMENTS.md Section 7 and .ai/DATA_MODEL.md
 * Section 3.4's "Tenant-resolution note" (flagged there for security-auditor
 * review as a distinct, non-JWT tenant-resolution path).
 *
 * Design choice: rather than re-implementing the AsyncLocalStorage session
 * dance here, this guard resolves `:tenantSlug` -> `StorefrontConfig.tenantId`
 * and stamps a synthetic `request.user = { tenantId, userId: 'storefront-guest' }`
 * onto the request — the exact same shape the JWT payload normally has. The
 * app-wide `TenantInterceptor` (apps/api/src/common/guards/tenant.interceptor.ts,
 * registered as a global APP_INTERCEPTOR) already knows how to turn any
 * `request.user.tenantId` into a real `runWithTenantSession(...)` call via
 * `@unerp/database`'s `AsyncLocalStorage`-based tenant-context module
 * (packages/database/src/tenant-context.ts) — it doesn't care whether that
 * `request.user` came from a verified JWT or, as here, from a guard. Guards
 * run before interceptors in Nest's request lifecycle, so by the time
 * `TenantInterceptor.intercept()` reads `request.user`, it's already set.
 * This reuses the existing tenant-scoping mechanism verbatim instead of
 * reinventing it, and keeps the Prisma tenant-scope extension's auto-injection
 * behavior identical for public and authenticated requests alike.
 *
 * 404s (not 401/403 — the storefront's public existence itself is not
 * information to leak) when:
 *   - no `StorefrontConfig` matches the slug, or
 *   - the storefront is disabled (`isEnabled === false`).
 *
 * Also attaches the resolved `StorefrontConfig` to `request.storefrontConfig`
 * so downstream controllers/services can read branding fields without a
 * second lookup.
 */
export const STOREFRONT_GUEST_USER_ID = 'storefront-guest';

export interface StorefrontRequest {
  user?: { tenantId: string; userId: string };
  storefrontConfig?: {
    id: string;
    tenantId: string;
    storeName: string;
    storeSlug: string;
    isEnabled: boolean;
    currency: string;
    contactEmail: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  params: Record<string, string>;
}

@Injectable()
export class PublicTenantResolverGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StorefrontRequest>();
    const tenantSlug = request.params?.tenantSlug;

    if (!tenantSlug) {
      throw new NotFoundException('Storefront not found');
    }

    const config = await prisma.storefrontConfig.findUnique({
      where: { storeSlug: tenantSlug },
    });

    if (!config || !config.isEnabled) {
      throw new NotFoundException('Storefront not found');
    }

    request.storefrontConfig = {
      id: config.id,
      tenantId: config.tenantId,
      storeName: config.storeName,
      storeSlug: config.storeSlug,
      isEnabled: config.isEnabled,
      currency: config.currency,
      contactEmail: config.contactEmail,
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor,
    };

    // Synthetic identity so the global TenantInterceptor establishes the same
    // AsyncLocalStorage tenant session it would for an authenticated request.
    request.user = { tenantId: config.tenantId, userId: STOREFRONT_GUEST_USER_ID };

    return true;
  }
}
