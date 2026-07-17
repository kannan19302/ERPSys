import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CashFlowForecastService } from '../services/cash-flow-forecast.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private value: number;
        constructor(val: unknown) {
          this.value = Number(val);
        }
        toNumber() {
          return this.value;
        }
        toFixed(decimals: number) {
          return this.value.toFixed(decimals);
        }
        valueOf() {
          return this.value;
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockPrismaCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      forecastWeek: createMockPrismaCollection(),
      forecastScenario: createMockPrismaCollection(),
      bankAccount: createMockPrismaCollection(),
      invoice: createMockPrismaCollection(),
      paymentSchedule: createMockPrismaCollection(),
    },
  };
});

describe('CashFlowForecastService', () => {
  let service: CashFlowForecastService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CashFlowForecastService();
  });

  describe('getScenarios', () => {
    it('should fetch scenarios in descending order', async () => {
      const mockScenarios = [{ id: 'scen-1', name: 'Optimistic' }];
      vi.mocked(prisma.forecastScenario.findMany).mockResolvedValue(mockScenarios as any);

      const result = await service.getScenarios('tenant-1');

      expect(prisma.forecastScenario.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockScenarios);
    });
  });

  describe('createScenario', () => {
    it('should create scenario with default factors', async () => {
      const mockScen = { id: 'scen-1', name: 'Conserv' };
      vi.mocked(prisma.forecastScenario.create).mockResolvedValue(mockScen as any);

      const result = await service.createScenario('tenant-1', 'org-1', {
        name: 'Conserv',
      });

      expect(prisma.forecastScenario.create).toHaveBeenCalled();
      expect(result).toEqual(mockScen);
    });
  });

  describe('saveForecastWeekOverride', () => {
    it('should create week override if it does not exist', async () => {
      vi.mocked(prisma.forecastWeek.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.forecastWeek.create).mockResolvedValue({ id: 'ow-1' } as any);

      const result = await service.saveForecastWeekOverride('tenant-1', new Date(), {
        adjustments: 2500,
        comments: 'Tax credit inflow',
      });

      expect(prisma.forecastWeek.findUnique).toHaveBeenCalled();
      expect(prisma.forecastWeek.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'ow-1' });
    });

    it('should update override if it already exists', async () => {
      const mockExisting = { id: 'ow-1', adjustments: 1000 };
      vi.mocked(prisma.forecastWeek.findUnique).mockResolvedValue(mockExisting as any);
      vi.mocked(prisma.forecastWeek.update).mockResolvedValue({ id: 'ow-1', adjustments: 2500 } as any);

      const result = await service.saveForecastWeekOverride('tenant-1', new Date(), {
        adjustments: 2500,
        comments: 'Updated override',
      });

      expect(prisma.forecastWeek.findUnique).toHaveBeenCalled();
      expect(prisma.forecastWeek.update).toHaveBeenCalled();
      expect(result.id).toBe('ow-1');
    });
  });

  describe('get13WeekForecast', () => {
    it('should aggregate baseline inflows and outflows for the next 13 weeks', async () => {
      // Setup mock data
      vi.mocked(prisma.bankAccount.findMany).mockResolvedValue([] as any); // Fallback to $150k
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { id: 'inv-1', totalAmount: new Prisma.Decimal(5000), dueDate: new Date() },
      ] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([
        { id: 'sched-1', amount: new Prisma.Decimal(2000), dueDate: new Date() },
      ] as any);
      vi.mocked(prisma.forecastWeek.findMany).mockResolvedValue([] as any);

      const result = await service.get13WeekForecast('tenant-1');

      expect(prisma.invoice.findMany).toHaveBeenCalled();
      expect(prisma.paymentSchedule.findMany).toHaveBeenCalled();
      expect(result.forecast.length).toBe(13);
      expect(result.startingCash).toBe(150000);
      // Week 1 projection verification: Inflow 5000, Outflow 2000, adjustments 0 -> net 3000
      expect(result.forecast[0].projectedInflow).toBe(5000);
      expect(result.forecast[0].projectedOutflow).toBe(2000);
      expect(result.forecast[0].net).toBe(3000);
      expect(result.forecast[0].cumulativeBalance).toBe(153000);
    });

    it('should multiply project values with scenario multipliers if provided', async () => {
      const mockScenario = { id: 'scen-1', name: 'Boom', inflowFactor: 1.5, outflowFactor: 0.8 };
      vi.mocked(prisma.forecastScenario.findFirst).mockResolvedValue(mockScenario as any);
      vi.mocked(prisma.bankAccount.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        { id: 'inv-1', totalAmount: new Prisma.Decimal(1000), dueDate: new Date() },
      ] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([
        { id: 'sched-1', amount: new Prisma.Decimal(1000), dueDate: new Date() },
      ] as any);
      vi.mocked(prisma.forecastWeek.findMany).mockResolvedValue([] as any);

      const result = await service.get13WeekForecast('tenant-1', 'scen-1');

      expect(prisma.forecastScenario.findFirst).toHaveBeenCalled();
      expect(result.scenarioName).toBe('Boom');
      // Inflow = 1000 * 1.5 = 1500
      // Outflow = 1000 * 0.8 = 800
      expect(result.forecast[0].projectedInflow).toBe(1500);
      expect(result.forecast[0].projectedOutflow).toBe(800);
      expect(result.forecast[0].net).toBe(700);
    });
  });

  describe('exportForecastCsv', () => {
    it('should return a csv formatted representation', async () => {
      vi.mocked(prisma.bankAccount.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.paymentSchedule.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.forecastWeek.findMany).mockResolvedValue([] as any);

      const csv = await service.exportForecastCsv('tenant-1');

      expect(csv).toContain('Week Start,Projected Inflow,Projected Outflow,Manual Adjustments,Net Flow,Cumulative Cash Balance,Comments');
      expect(csv.split('\n').length).toBe(15); // Header + 13 lines + ending empty line
    });
  });
});
