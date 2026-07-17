import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EcommerceAdminService } from '../ecommerce-admin.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      storefrontConfig: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      storefrontCategory: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      productListing: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
      product: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('EcommerceAdminService', () => {
  let service: EcommerceAdminService;

  beforeEach(() => {
    service = new EcommerceAdminService();
    vi.clearAllMocks();
  });

  describe('StorefrontConfig', () => {
    it('returns null when no config exists yet for the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue(null);

      const result = await service.getConfig('tenant-1');
      expect(result).toBeNull();
    });

    it('upserts config scoped to the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.storefrontConfig.upsert).mockResolvedValue({ id: 'cfg-1', tenantId: 'tenant-1' } as never);

      const result = await service.upsertConfig('tenant-1', {
        storeName: 'Acme Store',
        storeSlug: 'acme',
        isEnabled: true,
        currency: 'USD',
      });

      expect(prisma.storefrontConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-1' } }),
      );
      expect(result).toEqual({ id: 'cfg-1', tenantId: 'tenant-1' });
    });

    it('rejects a store slug already used by a different tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontConfig.findUnique).mockResolvedValue({
        id: 'cfg-other',
        tenantId: 'tenant-2',
        storeSlug: 'acme',
      } as never);

      await expect(
        service.upsertConfig('tenant-1', { storeName: 'Acme', storeSlug: 'acme', isEnabled: true, currency: 'USD' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('StorefrontCategory', () => {
    it('creates a category and rejects a duplicate slug within the same tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontCategory.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.storefrontCategory.create).mockResolvedValue({ id: 'cat-1' } as never);

      await service.createCategory('tenant-1', { name: 'Widgets', slug: 'widgets', sortOrder: 0 });
      expect(prisma.storefrontCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-1', slug: 'widgets' }) }),
      );

      vi.mocked(prisma.storefrontCategory.findUnique).mockResolvedValueOnce({ id: 'cat-1' } as never);
      await expect(
        service.createCategory('tenant-1', { name: 'Widgets 2', slug: 'widgets', sortOrder: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException updating a category that does not belong to the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontCategory.findFirst).mockResolvedValue(null);

      await expect(service.updateCategory('tenant-1', 'cat-x', { name: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('unassigns listings before deleting a category', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.storefrontCategory.findFirst).mockResolvedValue({ id: 'cat-1', tenantId: 'tenant-1' } as never);
      vi.mocked(prisma.productListing.updateMany).mockResolvedValue({ count: 2 } as never);
      vi.mocked(prisma.storefrontCategory.delete).mockResolvedValue({ id: 'cat-1' } as never);

      await service.deleteCategory('tenant-1', 'cat-1');

      expect(prisma.productListing.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', categoryId: 'cat-1' },
        data: { categoryId: null },
      });
      expect(prisma.storefrontCategory.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });
  });

  describe('ProductListing', () => {
    it('rejects linking a Product that belongs to a different tenant', async () => {
      const { prisma } = await import('@unerp/database');
      // Product.findFirst is scoped by tenantId in the query itself — simulate
      // "not found for this tenant" even though the id exists globally.
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      await expect(
        service.createListing('tenant-1', { productId: 'prod-from-other-tenant', isPublished: true, sortOrder: 0 }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 'prod-from-other-tenant', tenantId: 'tenant-1', deletedAt: null },
      });
    });

    it('rejects a duplicate listing for the same product', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1' } as never);
      vi.mocked(prisma.productListing.findUnique).mockResolvedValue({ id: 'listing-1' } as never);

      await expect(
        service.createListing('tenant-1', { productId: 'prod-1', isPublished: true, sortOrder: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a listing when the product belongs to the tenant and is not already listed', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1' } as never);
      vi.mocked(prisma.productListing.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productListing.create).mockResolvedValue({ id: 'listing-1' } as never);

      const result = await service.createListing('tenant-1', { productId: 'prod-1', isPublished: true, sortOrder: 0 });
      expect(result).toEqual({ id: 'listing-1' });
    });

    it('joins Product + Category fields when listing storefront listings', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.productListing.findMany).mockResolvedValue([
        {
          id: 'listing-1',
          productId: 'prod-1',
          categoryId: 'cat-1',
          isPublished: true,
          displayName: null,
          sortOrder: 0,
          priceOverride: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: { name: 'Widget', sku: 'WID-1', sellPrice: 19.99 },
          category: { name: 'Widgets' },
        },
      ] as never);

      const result = await service.getListings('tenant-1');
      expect(result).toEqual([
        expect.objectContaining({
          id: 'listing-1',
          productName: 'Widget',
          productSku: 'WID-1',
          categoryName: 'Widgets',
          effectivePrice: 19.99,
        }),
      ]);
    });
  });
});
