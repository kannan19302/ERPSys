import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../inventory.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      warehouse: {
        findMany: vi.fn(),
      },
      inventoryItem: {
        findMany: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('InventoryService', () => {
  let inventoryService: InventoryService;

  beforeEach(() => {
    inventoryService = new InventoryService();
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return all products in the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      const mockProducts = [
        {
          id: 'prod-1',
          sku: 'SKU-VIB-001',
          name: 'Refined Vibranium Alloy',
          type: 'STORABLE',
          costPrice: 8500,
          sellPrice: 12000,
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as Awaited<ReturnType<typeof prisma.product.findMany>>);

      const result = await inventoryService.getProducts('tenant-123');

      expect(result).toBeDefined();
      expect(result[0]?.sku).toBe('SKU-VIB-001');
    });
  });
});
