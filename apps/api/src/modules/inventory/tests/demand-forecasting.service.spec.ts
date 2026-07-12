import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DemandForecastingService } from '../demand-forecasting.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      demandForecastRun: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      demandForecastLine: {
        findMany: vi.fn(),
        count: vi.fn(),
        createMany: vi.fn(),
      },
      reorderSuggestion: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      stockLedgerEntry: {
        findMany: vi.fn(),
      },
      inventoryItem: {
        aggregate: vi.fn(),
      },
    },
  };
});

describe('DemandForecastingService', () => {
  let service: DemandForecastingService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    emitter = new EventEmitter2();
    vi.spyOn(emitter, 'emit');
    service = new DemandForecastingService(emitter);
    vi.clearAllMocks();
  });

  describe('listRuns', () => {
    it('returns paginated, tenant-scoped runs', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecastRun.findMany).mockResolvedValue([{ id: 'run-1' }] as never);
      vi.mocked(prisma.demandForecastRun.count).mockResolvedValue(1);

      const result = await service.listRuns('tenant-1', {});

      expect(prisma.demandForecastRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1', deletedAt: null }) }),
      );
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getRun', () => {
    it('throws NotFoundException when run does not exist for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecastRun.findFirst).mockResolvedValue(null);

      await expect(service.getRun('tenant-1', 'missing-id')).rejects.toThrow('Demand forecast run not found');
    });
  });

  describe('generateForecast', () => {
    it('creates a run, aggregates ledger demand into forecast lines, and derives reorder suggestions', async () => {
      const { prisma } = await import('@unerp/database');

      vi.mocked(prisma.demandForecastRun.create).mockResolvedValue({ id: 'run-1' } as never);
      vi.mocked(prisma.demandForecastRun.update).mockResolvedValue({ id: 'run-1', status: 'COMPLETED' } as never);

      const today = new Date();
      vi.mocked(prisma.stockLedgerEntry.findMany).mockResolvedValue([
        { productId: 'p-1', warehouseId: 'w-1', qtyOut: 10, postingDate: today },
        { productId: 'p-1', warehouseId: 'w-1', qtyOut: 20, postingDate: today },
      ] as never);
      vi.mocked(prisma.demandForecastLine.createMany).mockResolvedValue({ count: 1 } as never);
      vi.mocked(prisma.inventoryItem.aggregate).mockResolvedValue({ _sum: { quantity: 0 } } as never);
      vi.mocked(prisma.reorderSuggestion.create).mockResolvedValue({ id: 'sugg-1' } as never);

      const result = await service.generateForecast('tenant-1', 'org-1', 'user-1', {
        name: 'Q3 Forecast',
        method: 'MOVING_AVERAGE',
        historyDays: 7,
        horizonDays: 30,
        windowDays: 7,
        alpha: 0.3,
        leadTimeDays: 7,
        safetyStockDays: 3,
      });

      expect(prisma.demandForecastRun.create).toHaveBeenCalled();
      expect(prisma.demandForecastLine.createMany).toHaveBeenCalled();
      expect(prisma.reorderSuggestion.create).toHaveBeenCalled();
      expect(result.lineCount).toBe(1);
      expect(result.suggestionCount).toBe(1);
      expect(emitter.emit).toHaveBeenCalledWith('inventory.demand_forecast.generated', expect.objectContaining({ tenantId: 'tenant-1' }));
    });

    it('marks the run FAILED and rethrows when ledger lookup errors', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.demandForecastRun.create).mockResolvedValue({ id: 'run-2' } as never);
      vi.mocked(prisma.stockLedgerEntry.findMany).mockRejectedValue(new Error('db down'));
      vi.mocked(prisma.demandForecastRun.update).mockResolvedValue({ id: 'run-2', status: 'FAILED' } as never);

      await expect(
        service.generateForecast('tenant-1', 'org-1', 'user-1', {
          name: 'Broken run',
          method: 'MOVING_AVERAGE',
          historyDays: 7,
          horizonDays: 30,
          windowDays: 7,
          alpha: 0.3,
          leadTimeDays: 7,
          safetyStockDays: 3,
        }),
      ).rejects.toThrow('db down');

      expect(prisma.demandForecastRun.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'run-2' }, data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });
  });

  describe('acceptSuggestion / dismissSuggestion', () => {
    it('accepts a pending suggestion and emits a decision event', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderSuggestion.findFirst).mockResolvedValue({
        id: 'sugg-1',
        status: 'PENDING',
        productId: 'p-1',
        warehouseId: 'w-1',
      } as never);
      vi.mocked(prisma.reorderSuggestion.update).mockResolvedValue({ id: 'sugg-1', status: 'ACCEPTED' } as never);

      const result = await service.acceptSuggestion('tenant-1', 'sugg-1', 'user-1');

      expect(result.status).toBe('ACCEPTED');
      expect(emitter.emit).toHaveBeenCalledWith('inventory.reorder_suggestion.decided', expect.objectContaining({ status: 'ACCEPTED' }));
    });

    it('rejects deciding a suggestion that is not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderSuggestion.findFirst).mockResolvedValue({
        id: 'sugg-1',
        status: 'ACCEPTED',
      } as never);

      await expect(service.dismissSuggestion('tenant-1', 'sugg-1', 'user-1')).rejects.toThrow('already accepted');
    });

    it('throws NotFoundException for a suggestion outside the tenant scope', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.reorderSuggestion.findFirst).mockResolvedValue(null);

      await expect(service.acceptSuggestion('tenant-1', 'sugg-x', 'user-1')).rejects.toThrow('Reorder suggestion not found');
    });
  });
});
