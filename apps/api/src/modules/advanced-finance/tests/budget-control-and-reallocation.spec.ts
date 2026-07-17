import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetControlService } from '../services/budget-control.service';
import { BudgetReallocationService } from '../services/budget-reallocation.service';
import { BudgetingService } from '../services/budgeting.service';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

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
        valueOf() {
          return this.value;
        }
        toFixed(decimals: number) {
          return this.value.toFixed(decimals);
        }
      },
    },
  };
});

vi.mock('@unerp/database', () => {
  const createMockCollection = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  });

  const mockPrisma = {
    budget: createMockCollection(),
    budgetPeriodAmount: createMockCollection(),
    budgetControlConfig: createMockCollection(),
    budgetReallocation: createMockCollection(),
    budgetReallocationLine: createMockCollection(),
    journal: createMockCollection(),
    journalEntry: createMockCollection(),
    account: createMockCollection(),
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };

  return {
    prisma: mockPrisma,
  };
});

describe('Budget Control and Reallocation Services', () => {
  let controlService: BudgetControlService;
  let reallocationService: BudgetReallocationService;
  let budgetingService: BudgetingService;
  let mockGlService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    controlService = new BudgetControlService();
    reallocationService = new BudgetReallocationService();

    mockGlService = {
      resolveOrgId: vi.fn().mockResolvedValue('org-1'),
      logAudit: vi.fn().mockResolvedValue(true),
    };

    budgetingService = new BudgetingService(mockGlService);
  });

  describe('BudgetControlService', () => {
    it('should return default config if none exists', async () => {
      vi.mocked(prisma.budgetControlConfig.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.budgetControlConfig.create).mockResolvedValue({
        tenantId: 'tenant-1',
        enforcementAction: 'WARN',
        checkInvoices: true,
        checkJournals: true,
        checkExpenses: true,
        tolerancePercentage: new Prisma.Decimal(0.0),
      } as any);

      const config = await controlService.getControlConfig('tenant-1');
      expect(config.enforcementAction).toBe('WARN');
      expect(prisma.budgetControlConfig.create).toHaveBeenCalled();
    });

    it('should allow transaction if action is ALLOW', async () => {
      vi.mocked(prisma.budgetControlConfig.findUnique).mockResolvedValue({
        enforcementAction: 'ALLOW',
      } as any);

      const res = await controlService.checkBudgetLimit('tenant-1', 'org-1', 'acc-1', 100, new Date());
      expect(res.allowed).toBe(true);
    });

    it('should throw BadRequestException if limit exceeded and action is BLOCK', async () => {
      vi.mocked(prisma.budgetControlConfig.findUnique).mockResolvedValue({
        enforcementAction: 'BLOCK',
        tolerancePercentage: new Prisma.Decimal(0.0),
      } as any);

      vi.mocked(prisma.budget.findFirst).mockResolvedValue({
        id: 'budget-1',
        amount: new Prisma.Decimal(1000),
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        periodAmounts: [],
      } as any);

      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue([
        { debit: new Prisma.Decimal(950), credit: new Prisma.Decimal(0) },
      ] as any);

      // Proposed = 100 + Actuals = 950 = 1050 (limit = 1000/12 = 83.33)
      await expect(
        controlService.checkBudgetLimit('tenant-1', 'org-1', 'acc-1', 100, new Date('2026-06-15')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('BudgetReallocationService', () => {
    it('should create reallocation in DRAFT', async () => {
      vi.mocked(prisma.budgetReallocation.count).mockResolvedValue(0);
      vi.mocked(prisma.budget.findFirst).mockImplementation(async (query: any) => {
        if (query.where.id === 'b-src') {
          return { id: 'b-src', amount: new Prisma.Decimal(1000) } as any;
        }
        return { id: 'b-dest', amount: new Prisma.Decimal(100) } as any;
      });

      vi.mocked(prisma.budgetReallocation.create).mockResolvedValue({
        id: 'br-1',
        status: 'DRAFT',
      } as any);

      const res = await reallocationService.createReallocation(
        'tenant-1',
        'org-1',
        {
          description: 'Transfer',
          lines: [
            { budgetId: 'b-src', type: 'SOURCE', amount: 200 },
            { budgetId: 'b-dest', type: 'DESTINATION', amount: 200 },
          ],
        },
        'user-1',
      );

      expect(res.status).toBe('DRAFT');
    });

    it('should throw on unbalanced reallocation amounts', async () => {
      vi.mocked(prisma.budget.findFirst).mockImplementation(async (query: any) => {
        return { id: query.where.id, amount: new Prisma.Decimal(1000) } as any;
      });

      await expect(
        reallocationService.createReallocation(
          'tenant-1',
          'org-1',
          {
            lines: [
              { budgetId: 'b-src', type: 'SOURCE', amount: 200 },
              { budgetId: 'b-dest', type: 'DESTINATION', amount: 150 },
            ],
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Budgeting Service Spreads', () => {
    it('should create budget with EVEN spread', async () => {
      const mockBudget = { id: 'b-1', amount: new Prisma.Decimal(1200) };
      vi.mocked(prisma.budget.create).mockResolvedValue(mockBudget as any);

      await budgetingService.createBudget('tenant-1', 'org-1', {
        accountId: 'acc-1',
        amount: 1200,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        spreadMethod: 'EVEN',
      });

      expect(prisma.budgetPeriodAmount.create).toHaveBeenCalledTimes(12);
      expect(prisma.budgetPeriodAmount.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: {
            tenantId: 'tenant-1',
            budgetId: 'b-1',
            period: '2026-01',
            amount: new Prisma.Decimal(100),
          },
        }),
      );
    });
  });
});
