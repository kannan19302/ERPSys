import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DemandForecastingService } from '../demand-forecasting.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    demandForecast: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    reorderPoint: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    safetyStockConfig: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    replenishmentOrder: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    stockoutPrediction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stockEntryItem: {
      findMany: vi.fn(),
    },
  },
}));

const TENANT = 'tenant-1';
const USER = 'user-1';

describe('DemandForecastingService', () => {
  let service: DemandForecastingService;

  beforeEach(() => {
    service = new DemandForecastingService();
    vi.clearAllMocks();
  });

  // ── Forecasts ──────────────────────────────────────────────────────────────

  describe('listForecasts', () => {
    it('returns forecasts scoped to tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findMany).mockResolvedValue([{ id: 'f1' }] as never);
      const result = await service.listForecasts(TENANT);
      expect(prisma.demandForecast.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT }) }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('createForecast', () => {
    it('creates a forecast record', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.create).mockResolvedValue({ id: 'f1', status: 'ACTIVE' } as never);
      const dto = {
        productId: 'p-1',
        forecastDate: new Date().toISOString(),
        horizon: 30,
        method: 'MOVING_AVG' as const,
        forecastedQty: 100,
      };
      const result = await service.createForecast(TENANT, USER, dto);
      expect(prisma.demandForecast.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'f1');
    });
  });

  describe('getForecast', () => {
    it('throws NotFoundException when forecast not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findFirst).mockResolvedValue(null);
      await expect(service.getForecast(TENANT, 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateActual', () => {
    it('updates actual qty and calculates MAPE', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findFirst).mockResolvedValue({
        id: 'f1', forecastedQty: '100',
      } as never);
      vi.mocked(prisma.demandForecast.update).mockResolvedValue({ id: 'f1', actualQty: '90' } as never);
      const result = await service.updateActual(TENANT, 'f1', { actualQty: 90 });
      expect(prisma.demandForecast.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ actualQty: expect.anything() }) }),
      );
      expect(result).toHaveProperty('id', 'f1');
    });

    it('throws NotFoundException when forecast not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findFirst).mockResolvedValue(null);
      await expect(service.updateActual(TENANT, 'bad', { actualQty: 10 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('archiveForecast', () => {
    it('sets status to ARCHIVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findFirst).mockResolvedValue({ id: 'f1' } as never);
      vi.mocked(prisma.demandForecast.update).mockResolvedValue({ id: 'f1', status: 'ARCHIVED' } as never);
      const result = await service.archiveForecast(TENANT, 'f1');
      expect(prisma.demandForecast.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ARCHIVED' } }),
      );
      expect(result.status).toBe('ARCHIVED');
    });
  });

  // ── Reorder Points ─────────────────────────────────────────────────────────

  describe('calculateReorderPoint', () => {
    it('upserts reorder point with computed values', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderPoint.upsert).mockResolvedValue({ id: 'rp1', reorderPoint: '57' } as never);
      const result = await service.calculateReorderPoint(TENANT, {
        productId: 'p-1',
        leadTimeDays: 7,
        avgDailyDemand: 5,
        serviceLevel: 0.95,
      });
      expect(prisma.reorderPoint.upsert).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'rp1');
    });
  });

  describe('deactivateReorderPoint', () => {
    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderPoint.findFirst).mockResolvedValue(null);
      await expect(service.deactivateReorderPoint(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('sets isActive to false', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderPoint.findFirst).mockResolvedValue({ id: 'rp1' } as never);
      vi.mocked(prisma.reorderPoint.update).mockResolvedValue({ id: 'rp1', isActive: false } as never);
      const result = await service.deactivateReorderPoint(TENANT, 'rp1');
      expect(result.isActive).toBe(false);
    });
  });

  // ── Safety Stock ───────────────────────────────────────────────────────────

  describe('upsertSafetyStockConfig', () => {
    it('upserts a FIXED safety stock config', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyStockConfig.upsert).mockResolvedValue({ id: 'ssc1', method: 'FIXED' } as never);
      const result = await service.upsertSafetyStockConfig(TENANT, {
        productId: 'p-1', method: 'FIXED', fixedQty: 50,
      });
      expect(prisma.safetyStockConfig.upsert).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'ssc1');
    });
  });

  describe('deleteSafetyStockConfig', () => {
    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.safetyStockConfig.findFirst).mockResolvedValue(null);
      await expect(service.deleteSafetyStockConfig(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Replenishment Orders ───────────────────────────────────────────────────

  describe('createReplenishmentOrder', () => {
    it('creates order with auto-generated number', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.replenishmentOrder.count).mockResolvedValue(0);
      vi.mocked(prisma.replenishmentOrder.create).mockResolvedValue({ id: 'ro1', orderNumber: 'RPL-00001' } as never);
      const result = await service.createReplenishmentOrder(TENANT, USER, {
        productId: 'p-1', warehouseId: 'w-1', suggestedQty: 100,
        uom: 'EA', triggerType: 'MANUAL', currentStock: 5, priority: 'NORMAL',
      });
      expect(result.orderNumber).toBe('RPL-00001');
    });
  });

  describe('approveReplenishmentOrder', () => {
    it('throws BadRequestException when not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.replenishmentOrder.findFirst).mockResolvedValue({ id: 'ro1', status: 'APPROVED' } as never);
      await expect(
        service.approveReplenishmentOrder(TENANT, 'ro1', USER, { approvedQty: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('approves a pending order', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.replenishmentOrder.findFirst).mockResolvedValue({ id: 'ro1', status: 'PENDING' } as never);
      vi.mocked(prisma.replenishmentOrder.update).mockResolvedValue({ id: 'ro1', status: 'APPROVED' } as never);
      const result = await service.approveReplenishmentOrder(TENANT, 'ro1', USER, { approvedQty: 80 });
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('updateReplenishmentStatus', () => {
    it('throws BadRequestException for invalid transition', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.replenishmentOrder.findFirst).mockResolvedValue({ id: 'ro1', status: 'PENDING' } as never);
      await expect(service.updateReplenishmentStatus(TENANT, 'ro1', 'RECEIVED')).rejects.toThrow(BadRequestException);
    });
  });

  // ── Stockout Predictions ───────────────────────────────────────────────────

  describe('acknowledgeStockoutPrediction', () => {
    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockoutPrediction.findFirst).mockResolvedValue(null);
      await expect(
        service.acknowledgeStockoutPrediction(TENANT, 'bad', { acknowledgedBy: USER }),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets acknowledged true', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockoutPrediction.findFirst).mockResolvedValue({ id: 'sp1' } as never);
      vi.mocked(prisma.stockoutPrediction.update).mockResolvedValue({ id: 'sp1', acknowledged: true } as never);
      const result = await service.acknowledgeStockoutPrediction(TENANT, 'sp1', { acknowledgedBy: USER });
      expect(result.acknowledged).toBe(true);
    });
  });

  // ── Dashboard ──────────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('returns all metric keys', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.count).mockResolvedValue(10);
      vi.mocked(prisma.reorderPoint.count).mockResolvedValue(5);
      vi.mocked(prisma.replenishmentOrder.count).mockResolvedValue(3);
      vi.mocked(prisma.stockoutPrediction.count).mockResolvedValue(2);
      vi.mocked(prisma.safetyStockConfig.count).mockResolvedValue(4);
      vi.mocked(prisma.reorderPoint.findMany).mockResolvedValue([]);
      vi.mocked(prisma.demandForecast.aggregate).mockResolvedValue({ _avg: { mape: null } } as never);
      const result = await service.getDashboard(TENANT);
      expect(result).toHaveProperty('totalForecasts');
      expect(result).toHaveProperty('activeReorderPoints');
      expect(result).toHaveProperty('pendingReplenishments');
      expect(result).toHaveProperty('criticalStockouts');
    });
  });

  describe('getForecastAccuracy', () => {
    it('returns null accuracy when no actuals', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findMany).mockResolvedValue([]);
      const result = await service.getForecastAccuracy(TENANT);
      expect(result.accuracy).toBeNull();
      expect(result.samples).toBe(0);
    });

    it('computes accuracy from MAPE', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecast.findMany).mockResolvedValue([
        { id: 'f1', mape: '0.1', method: 'MOVING_AVG', actualQty: '90' },
        { id: 'f2', mape: '0.2', method: 'MOVING_AVG', actualQty: '80' },
      ] as never);
      const result = await service.getForecastAccuracy(TENANT);
      expect(result.samples).toBe(2);
      expect(result.avgMape).toBeCloseTo(0.15);
      expect(result.accuracy).toBeCloseTo(0.85);
    });
  });
});
