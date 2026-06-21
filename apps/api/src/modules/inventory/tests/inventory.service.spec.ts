import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../inventory.service';
import { Product } from '@prisma/client';

vi.mock('@unerp/database', () => {
  const mockTx = {
    inventoryItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    stockLedgerEntry: {
      create: vi.fn(),
    },
    stockEntry: {
      update: vi.fn(),
    },
  };

  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      warehouse: {
        findMany: vi.fn(),
      },
      inventoryItem: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      stockEntry: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      stockLedgerEntry: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      qualityInspection: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockTx)),
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

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as unknown as Product[]);

      const result = await inventoryService.getProducts('tenant-123');

      expect(result).toBeDefined();
      expect((result.data || result)[0]?.sku).toBe('SKU-VIB-001');
    });
  });

  
});
