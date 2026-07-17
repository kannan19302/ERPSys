import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FpaService } from '../services/fpa.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

vi.mock('@prisma/client', () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        private _v: number;
        constructor(v: unknown) { this._v = Number(v); }
        toNumber() { return this._v; }
        valueOf() { return this._v; }
        toFixed(d: number) { return this._v.toFixed(d); }
      },
    },
  };
});

vi.mock('@unerp/database', () => ({
  prisma: {
    closeTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    varianceFlag: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    budgetScenario: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    budgetScenarioLine: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    financialPeriod: {
      findFirst: vi.fn(),
    },
    journalEntry: {
      groupBy: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-002';
const USER_ID = 'user-002';
const ORG_ID = 'org-002';

describe('FpaService', () => {
  let service: FpaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FpaService();
  });

  // ── Close Tasks ─────────────────────────────────────────────────────────────

  describe('listCloseTasks', () => {
    it('should return close tasks filtered by status', async () => {
      const mockTasks = [{ id: 'task-1', status: 'OPEN' }];
      (prisma.closeTask.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);

      const result = await service.listCloseTasks(TENANT, 'period-1', 'OPEN');
      expect(result).toEqual(mockTasks);
      expect(prisma.closeTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            financialPeriodId: 'period-1',
            status: 'OPEN',
          }),
        }),
      );
    });
  });

  describe('getCloseTask', () => {
    it('should return a close task by id', async () => {
      const mockTask = { id: 'task-1', tenantId: TENANT };
      (prisma.closeTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);

      const result = await service.getCloseTask(TENANT, 'task-1');
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      (prisma.closeTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getCloseTask(TENANT, 'task-missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCloseTask', () => {
    it('should create a new close task when period exists', async () => {
      const mockPeriod = { id: 'period-1', tenantId: TENANT };
      const mockCreated = { id: 'task-new', name: 'Task New' };
      (prisma.financialPeriod.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockPeriod);
      (prisma.closeTask.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreated);

      const result = await service.createCloseTask(TENANT, USER_ID, {
        financialPeriodId: 'period-1',
        name: 'Task New',
        category: 'RECONCILIATION',
      });
      expect(result).toEqual(mockCreated);
    });

    it('should throw NotFoundException if financial period does not exist', async () => {
      (prisma.financialPeriod.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(
        service.createCloseTask(TENANT, USER_ID, {
          financialPeriodId: 'period-missing',
          name: 'Task New',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCloseTask', () => {
    it('should update task and assign completed dates if status is DONE', async () => {
      const mockTask = { id: 'task-1', tenantId: TENANT, status: 'OPEN', completedAt: null };
      (prisma.closeTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockTask);
      (prisma.closeTask.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ ...mockTask, ...data }),
      );

      const result = await service.updateCloseTask(TENANT, 'task-1', USER_ID, { status: 'DONE' });
      expect(result.status).toBe('DONE');
      expect(result.completedAt).toBeTruthy();
      expect(result.completedBy).toBe(USER_ID);
    });
  });

  describe('generateCloseTasksFromTemplate', () => {
    it('should bulk generate standard tasks from templates', async () => {
      const mockPeriod = { id: 'period-1', tenantId: TENANT, endDate: new Date('2026-06-30') };
      (prisma.financialPeriod.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockPeriod);
      (prisma.closeTask.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 13 });

      const result = await service.generateCloseTasksFromTemplate(TENANT, USER_ID, 'period-1');
      expect(result.created).toBe(13);
      expect(prisma.closeTask.createMany).toHaveBeenCalled();
    });
  });

  // ── Variance Flag Engine ────────────────────────────────────────────────────

  describe('runVarianceFlagEngine', () => {
    it('should execute comparison and create flags when variances exceed threshold', async () => {
      const currentPeriod = {
        id: 'period-current',
        tenantId: TENANT,
        orgId: ORG_ID,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
      };
      const priorPeriod = {
        id: 'period-prior',
        tenantId: TENANT,
        orgId: ORG_ID,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-31'),
      };

      (prisma.financialPeriod.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(currentPeriod) // for current
        .mockResolvedValueOnce(priorPeriod); // for prior

      (prisma.journalEntry.groupBy as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([
          { accountId: 'acc-1', _sum: { debit: 15000, credit: 0 } }, // Current: Net +15,000
        ])
        .mockResolvedValueOnce([
          { accountId: 'acc-1', _sum: { debit: 10000, credit: 0 } }, // Prior: Net +10,000 (variance +50%, exceeds 10%)
        ]);

      (prisma.varianceFlag.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

      const result = await service.runVarianceFlagEngine(TENANT, 'period-current', 10);
      expect(result.flagsCreated).toBe(1);
      expect(prisma.varianceFlag.createMany).toHaveBeenCalled();
    });
  });

  // ── Budget Scenarios ────────────────────────────────────────────────────────

  describe('createScenario', () => {
    it('should create a budget scenario in DRAFT state', async () => {
      const mockCreated = { id: 'sc-1', name: 'FY2026 Base', status: 'DRAFT' };
      (prisma.budgetScenario.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockCreated);

      const result = await service.createScenario(TENANT, USER_ID, {
        orgId: ORG_ID,
        name: 'FY2026 Base',
        fiscalYear: 2026,
        type: 'BASE',
      });
      expect(result.status).toBe('DRAFT');
      expect(result).toEqual(mockCreated);
    });
  });

  describe('lockScenario', () => {
    it('should set scenario to locked and status to APPROVED', async () => {
      const mockScenario = { id: 'sc-1', name: 'FY2026 Base', isLocked: false, lines: [] };
      (prisma.budgetScenario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockScenario);
      (prisma.budgetScenario.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ ...mockScenario, ...data }),
      );

      const result = await service.lockScenario(TENANT, 'sc-1', USER_ID);
      expect(result.isLocked).toBe(true);
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('cloneScenario', () => {
    it('should duplicate scenario metadata and all budget lines', async () => {
      const mockSource = {
        id: 'sc-src',
        name: 'Source Scenario',
        orgId: ORG_ID,
        fiscalYear: 2026,
        type: 'BASE',
        lines: [
          { accountId: 'acc-1', month: 1, amount: 1000, driverType: null },
          { accountId: 'acc-1', month: 2, amount: 1200, driverType: null },
        ],
      };
      const mockClone = { id: 'sc-clone', name: 'Upside Scenario' };

      (prisma.budgetScenario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockSource);
      (prisma.budgetScenario.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockClone);
      (prisma.budgetScenarioLine.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 2 });

      const result = await service.cloneScenario(TENANT, 'sc-src', USER_ID, {
        name: 'Upside Scenario',
        type: 'UPSIDE',
      });
      expect(result.clone).toEqual(mockClone);
      expect(result.linesCloned).toBe(2);
      expect(prisma.budgetScenarioLine.createMany).toHaveBeenCalled();
    });
  });

  describe('applyDriver', () => {
    it('should generate monthly lines using headcount * salary driver calculation', async () => {
      const mockScenario = { id: 'sc-1', isLocked: false, lines: [] };
      (prisma.budgetScenario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockScenario);
      (prisma.budgetScenarioLine.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

      const result = await service.applyDriver(TENANT, 'sc-1', USER_ID, {
        accountId: 'acc-salaries',
        driverType: 'HEADCOUNT',
        driverValue: 5, // 5 employees
        driverRate: 8000, // $8,000 per month each
        months: [1, 2, 3], // first quarter
      });

      expect(result.monthsUpdated).toBe(3);
      expect(result.amountPerMonth.toNumber()).toBe(40000); // 5 * 8000
      expect(result.totalBudgeted.toNumber()).toBe(120000); // 40000 * 3
      expect(prisma.budgetScenarioLine.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('compareScenarios', () => {
    it('should run scenario comparisons successfully', async () => {
      const mockScenarioA = {
        id: 'sc-a',
        name: 'Scenario A',
        lines: [
          { accountId: 'acc-1', month: 1, amount: 1000 },
          { accountId: 'acc-1', month: 2, amount: 1000 },
        ],
      };
      const mockScenarioB = {
        id: 'sc-b',
        name: 'Scenario B',
        lines: [
          { accountId: 'acc-1', month: 1, amount: 800 },
          { accountId: 'acc-1', month: 2, amount: 800 },
        ],
      };

      (prisma.budgetScenario.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockScenarioA)
        .mockResolvedValueOnce(mockScenarioB);

      const result = await service.compareScenarios(TENANT, 'sc-a', 'sc-b', 2026);
      expect(result.summary.totalA).toBe('2000.00'); // 1000 + 1000
      expect(result.summary.totalB).toBe('1600.00'); // 800 + 800
      expect(result.summary.netVariance).toBe('400.00');
    });
  });
});
