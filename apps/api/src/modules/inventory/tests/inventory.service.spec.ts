import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../inventory.service';
import { Prisma, Product, StockEntry, QualityInspection } from '@prisma/client';

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
      expect(result[0]?.sku).toBe('SKU-VIB-001');
    });
  });

  describe('createStockEntry', () => {
    it('should create a stock entry draft', async () => {
      const { prisma } = await import('@unerp/database');
      const mockEntry = {
        id: 'ste-1',
        entryNumber: 'STE-2026-001',
        purpose: 'MATERIAL_RECEIPT',
        status: 'DRAFT',
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue({ costPrice: new Prisma.Decimal(10) } as unknown as Product);
      vi.mocked(prisma.stockEntry.create).mockResolvedValue(mockEntry as unknown as StockEntry);

      const result = await inventoryService.createStockEntry(
        'tenant-123',
        'org-123',
        {
          purpose: 'MATERIAL_RECEIPT',
          remarks: 'Test receipt',
          items: [{ productId: 'prod-1', qty: 10 }],
        },
        'user-123'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('createQualityInspection', () => {
    it('should create a quality inspection report', async () => {
      const { prisma } = await import('@unerp/database');
      const mockInsp = {
        id: 'insp-1',
        inspectionNumber: 'QA-INSP-999',
        status: 'PASSED',
      };

      vi.mocked(prisma.qualityInspection.create).mockResolvedValue(mockInsp as unknown as QualityInspection);

      const result = await inventoryService.createQualityInspection(
        'tenant-123',
        'org-123',
        {
          referenceType: 'Purchase Receipt',
          referenceId: 'pr-123',
          productId: 'prod-1',
          inspectedQty: 50,
          passedQty: 50,
          rejectedQty: 0,
          checklist: [{ parameter: 'Dimensions', status: 'PASS' }],
        },
        'user-123'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('PASSED');
    });
  });
});
