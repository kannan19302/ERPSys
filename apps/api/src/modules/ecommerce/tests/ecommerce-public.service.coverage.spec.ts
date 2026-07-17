import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EcommercePublicService } from '../ecommerce-public.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      storefrontConfig: { findUnique: vi.fn() },
      storefrontCategory: { findMany: vi.fn() },
      productListing: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
      cart: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
      cartItem: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    },
  };
});

describe('EcommercePublicService', () => {
  let service: EcommercePublicService;

  beforeEach(() => {
    service = new EcommercePublicService();
    vi.clearAllMocks();
  });

  describe('getPublicConfig', () => {
    it('404s when the storefront is disabled, even if a config row exists', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue({
        tenantId: 't1',
        isEnabled: false,
      } as never);

      await expect(service.getPublicConfig('t1')).rejects.toThrow(NotFoundException);
    });

    it('never leaks internal fields like id in the public response', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue({
        id: 'internal-cfg-id',
        tenantId: 't1',
        isEnabled: true,
        storeName: 'Acme',
        storeSlug: 'acme',
        currency: 'USD',
        logoUrl: null,
        primaryColor: null,
      } as never);

      const result = await service.getPublicConfig('t1');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('tenantId');
      expect(result.storeName).toBe('Acme');
    });
  });

  describe('tenant isolation', () => {
    it('scopes getProducts strictly by the resolved tenantId — a second tenant never sees the first tenant\'s listings', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.productListing.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productListing.count).mockResolvedValue(0);

      await service.getProducts('tenant-b', undefined, 1, 25);

      expect(prisma.productListing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-b', isPublished: true }) }),
      );
    });

    it('404s a cart lookup across tenants — tenant-a cannot read tenant-b\'s cart via sessionToken alone', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.cart.findFirst).mockResolvedValue(null);

      await expect(service.getCart('tenant-a', 'token-belongs-to-tenant-b')).rejects.toThrow(NotFoundException);
      expect(prisma.cart.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-a', sessionToken: 'token-belongs-to-tenant-b' } }),
      );
    });
  });

  describe('cart', () => {
    it('rejects adding an item for a listing that is not published', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: 'cart-1',
        tenantId: 't1',
        status: 'ACTIVE',
        items: [],
      } as never);
      vi.mocked(prisma.productListing.findFirst).mockResolvedValue(null); // unpublished/not found

      await expect(
        service.addCartItem('t1', 'session-1', { productListingId: 'listing-unpublished', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects modifying a cart that is not ACTIVE', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.cart.findFirst).mockResolvedValue({
        id: 'cart-1',
        tenantId: 't1',
        status: 'CONVERTED',
        items: [],
      } as never);

      await expect(
        service.addCartItem('t1', 'session-1', { productListingId: 'listing-1', quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('snapshots the effective price (priceOverride wins over Product.sellPrice) when adding an item', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce({ id: 'cart-1', tenantId: 't1', status: 'ACTIVE', items: [] } as never)
        .mockResolvedValueOnce({ id: 'cart-1', tenantId: 't1', status: 'ACTIVE', sessionToken: 's1', currency: 'USD', items: [] } as never);
      vi.mocked(prisma.productListing.findFirst).mockResolvedValue({
        id: 'listing-1',
        priceOverride: 15,
        product: { sellPrice: 25 },
      } as never);
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.cartItem.create).mockResolvedValue({ id: 'item-1' } as never);

      await service.addCartItem('t1', 'session-1', { productListingId: 'listing-1', quantity: 2 });

      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ unitPriceSnapshot: 15, quantity: 2 }) }),
      );
    });

    it('merges quantity into an existing line instead of duplicating it', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.cart.findFirst)
        .mockResolvedValueOnce({ id: 'cart-1', tenantId: 't1', status: 'ACTIVE', items: [] } as never)
        .mockResolvedValueOnce({ id: 'cart-1', tenantId: 't1', status: 'ACTIVE', sessionToken: 's1', currency: 'USD', items: [] } as never);
      vi.mocked(prisma.productListing.findFirst).mockResolvedValue({
        id: 'listing-1',
        priceOverride: null,
        product: { sellPrice: 10 },
      } as never);
      vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({ id: 'item-existing', quantity: 3 } as never);
      vi.mocked(prisma.cartItem.update).mockResolvedValue({ id: 'item-existing' } as never);

      await service.addCartItem('t1', 'session-1', { productListingId: 'listing-1', quantity: 2 });

      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item-existing' }, data: expect.objectContaining({ quantity: 5 }) }),
      );
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });
});
