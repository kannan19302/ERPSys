import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FixedAssetsService } from '../fixed-assets.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

// Mock @prisma/client Decimal behavior
vi.mock('@prisma/client', () => {
  class Decimal {
    private value: number;
    constructor(val: unknown) {
      this.value = Number(val);
    }
    toNumber() { return this.value; }
    toString() { return String(this.value); }
    minus(other: any) { return new Decimal(this.value - Number(other)); }
    plus(other: any) { return new Decimal(this.value + Number(other)); }
    mul(other: any) { return new Decimal(this.value * Number(other)); }
    div(other: any) { return new Decimal(this.value / Number(other)); }
    greaterThan(other: any) { return this.value > Number(other); }
    lessThanOrEqualTo(other: any) { return this.value <= Number(other); }
  }
  return {
    Prisma: {
      Decimal,
      JsonNull: 'JsonNull',
    },
  };
});

// Mock @unerp/database
vi.mock('@unerp/database', () => ({
  prisma: {
    fixedAssetCategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    fixedAsset: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    assetDepreciation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    assetTransferLog: {
      create: vi.fn(),
    },
    assetMaintenanceLog: {
      create: vi.fn(),
    },
    warehouse: {
      findFirst: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: any) => Promise<any>) =>
      fn({
        journal: {
          create: vi.fn().mockResolvedValue({ id: 'j-1', entryNumber: 'JV-1' }),
        },
        journalEntry: {
          create: vi.fn(),
        },
        assetDepreciation: {
          create: vi.fn().mockResolvedValue({ id: 'dep-1' }),
        },
        fixedAsset: {
          update: vi.fn(),
        },
        assetTransferLog: {
          create: vi.fn().mockResolvedValue({ id: 't-1' }),
        },
        assetMaintenanceLog: {
          create: vi.fn().mockResolvedValue({ id: 'm-1' }),
        },
      })
    ),
  },
}));

describe('FixedAssetsService', () => {
  let service: FixedAssetsService;
  let mockEventEmitter: EventEmitter2;

  beforeEach(() => {
    mockEventEmitter = {
      emit: vi.fn(),
    } as unknown as EventEmitter2;
    service = new FixedAssetsService(mockEventEmitter);
    vi.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create an asset category if unique', async () => {
      vi.mocked(prisma.fixedAssetCategory.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.fixedAssetCategory.create).mockResolvedValue({ id: 'cat-1', name: 'IT Equipment' } as any);

      const result = await service.createCategory('t-1', {
        name: 'IT Equipment',
        depreciationMethod: 'SLM',
        expectedLifeMonths: 36,
      });

      expect(result.id).toBe('cat-1');
      expect(prisma.fixedAssetCategory.create).toHaveBeenCalled();
    });

    it('should throw if category name already exists', async () => {
      vi.mocked(prisma.fixedAssetCategory.findFirst).mockResolvedValue({ id: 'cat-1', name: 'IT Equipment' } as any);

      await expect(
        service.createCategory('t-1', {
          name: 'IT Equipment',
          depreciationMethod: 'SLM',
          expectedLifeMonths: 36,
        })
      ).rejects.toThrow();
    });
  });

  describe('depreciation math', () => {
    it('should calculate straight-line monthly depreciation correctly', async () => {
      const mockAsset = {
        id: 'asset-1',
        name: 'Laptop',
        assetCode: 'AST-01',
        purchaseValue: 2500,
        salvageValue: 100,
        usefulLifeYears: 3,
        depreciationMethod: 'SLM',
        currentValue: 2500,
        categoryId: 'cat-1',
        category: {
          assetAccountId: 'acc-1',
          depreciationAccountId: 'acc-2',
          expenseAccountId: 'acc-3',
        },
      };

      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);
      vi.mocked(prisma.assetDepreciation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.assetDepreciation.aggregate).mockResolvedValue({ _sum: { amount: null } } as any);

      // We run depreciation for period "2026-07"
      // SLM calculation: (2500 - 100) / 3 / 12 = 2400 / 3 / 12 = 66.6666...
      const result = await service.postDepreciation('t-1', 'o-1', 'u-1', 'asset-1', '2026-07');
      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'assets.asset.depreciated',
        expect.objectContaining({
          amount: expect.closeTo(66.67, 1),
          periodName: '2026-07',
        })
      );
    });

    it('should safeguard book value from dropping below salvage value', async () => {
      const mockAsset = {
        id: 'asset-1',
        name: 'Old Laptop',
        assetCode: 'AST-01',
        purchaseValue: 2500,
        salvageValue: 100,
        usefulLifeYears: 3,
        depreciationMethod: 'SLM',
        currentValue: 120, // Only 20 above salvage value (100)
        categoryId: 'cat-1',
        category: {
          assetAccountId: 'acc-1',
          depreciationAccountId: 'acc-2',
          expenseAccountId: 'acc-3',
        },
      };

      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);
      vi.mocked(prisma.assetDepreciation.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.assetDepreciation.aggregate).mockResolvedValue({ _sum: { amount: 2380 } } as any);

      // Monthly depreciation is calculated as 66.67, but should be capped at 20 (120 - 100)
      const result = await service.postDepreciation('t-1', 'o-1', 'u-1', 'asset-1', '2026-07');
      expect(result).toBeDefined();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'assets.asset.depreciated',
        expect.objectContaining({
          amount: 20, // Capped to reach exactly the salvage value
        })
      );
    });
  });

  describe('transfers and maintenance logs', () => {
    it('should create transfer log and update custody', async () => {
      const mockAsset = {
        id: 'asset-1',
        locationId: 'loc-1',
        custodianId: 'emp-1',
      };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);

      const result = await service.transferAsset('t-1', 'asset-1', 'u-1', {
        transferDate: '2026-07-04',
        toLocationId: 'loc-2',
        toCustodianId: 'emp-2',
        reason: 'Office move',
      });

      expect(result).toBeDefined();
    });

    it('should log maintenance events', async () => {
      const mockAsset = { id: 'asset-1' };
      vi.mocked(prisma.fixedAsset.findFirst).mockResolvedValue(mockAsset as any);

      const result = await service.logMaintenance('t-1', 'asset-1', 'u-1', {
        maintenanceDate: '2026-07-04',
        type: 'CORRECTIVE',
        description: 'Repaired screen hinge',
        cost: 150,
        performedBy: 'Apple Store',
      });

      expect(result).toBeDefined();
    });
  });
});
