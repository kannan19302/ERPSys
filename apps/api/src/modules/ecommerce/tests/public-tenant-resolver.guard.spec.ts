import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ExecutionContext } from '@nestjs/common';
import { PublicTenantResolverGuard, STOREFRONT_GUEST_USER_ID } from '../guards/public-tenant-resolver.guard';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      storefrontConfig: { findUnique: vi.fn() },
    },
  };
});

function contextWithRequest(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('PublicTenantResolverGuard', () => {
  let guard: PublicTenantResolverGuard;

  beforeEach(() => {
    guard = new PublicTenantResolverGuard();
    vi.clearAllMocks();
  });

  it('404s when no StorefrontConfig matches the slug (does not leak whether the tenant exists)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue(null);

    const request = { params: { tenantSlug: 'unknown-store' } };
    await expect(guard.canActivate(contextWithRequest(request))).rejects.toThrow(NotFoundException);
  });

  it('404s when the storefront exists but is disabled', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue({
      id: 'cfg-1',
      tenantId: 't1',
      isEnabled: false,
    } as never);

    const request = { params: { tenantSlug: 'disabled-store' } };
    await expect(guard.canActivate(contextWithRequest(request))).rejects.toThrow(NotFoundException);
  });

  it('404s when no tenantSlug param is present at all', async () => {
    const request = { params: {} };
    await expect(guard.canActivate(contextWithRequest(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves tenant context and stamps a synthetic request.user for a valid, enabled storefront', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue({
      id: 'cfg-1',
      tenantId: 'tenant-acme',
      storeName: 'Acme',
      storeSlug: 'acme',
      isEnabled: true,
      currency: 'USD',
      contactEmail: null,
      logoUrl: null,
      primaryColor: null,
    } as never);

    const request: Record<string, unknown> = { params: { tenantSlug: 'acme' } };
    const result = await guard.canActivate(contextWithRequest(request));

    expect(result).toBe(true);
    expect(request.user).toEqual({ tenantId: 'tenant-acme', userId: STOREFRONT_GUEST_USER_ID });
    expect((request as { storefrontConfig: { tenantId: string } }).storefrontConfig.tenantId).toBe('tenant-acme');
  });
});
