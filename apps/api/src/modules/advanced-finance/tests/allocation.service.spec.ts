import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllocationService } from '../services/allocation.service';
import { GlAccountingService } from '../services/gl-accounting.service';
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
  });

  return {
    prisma: {
      allocationRule: createMockCollection(),
      allocationRun: createMockCollection(),
      account: createMockCollection(),
      employee: createMockCollection(),
      journal: createMockCollection(),
      journalEntry: createMockCollection(),
      organization: createMockCollection(),
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

describe('AllocationService', () => {
  let service: AllocationService;
  let glService: GlAccountingService;

  beforeEach(() => {
    vi.clearAllMocks();

    glService = {
      resolveOrgId: vi.fn().mockResolvedValue('org-1'),
      createJournal: vi.fn().mockResolvedValue({ id: 'journal-1' }),
      logAudit: vi.fn().mockResolvedValue(true),
    } as any;

    service = new AllocationService(glService);
  });

  describe('Rules CRUD', () => {
    it('should list all rules', async () => {
      const mockRules = [{ id: 'rule-1', name: 'Rule 1' }];
      vi.mocked(prisma.allocationRule.findMany).mockResolvedValue(mockRules as any);

      const result = await service.getRules('tenant-1');
      expect(result).toEqual(mockRules);
      expect(prisma.allocationRule.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: { sourceAccount: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw on getRuleById if not found', async () => {
      vi.mocked(prisma.allocationRule.findFirst).mockResolvedValue(null);

      await expect(service.getRuleById('tenant-1', 'rule-1')).rejects.toThrow(NotFoundException);
    });

    it('should create a rule', async () => {
      const mockAccount = { id: 'acc-1', name: 'Pool Account', type: 'EXPENSE' };
      vi.mocked(prisma.account.findFirst).mockResolvedValue(mockAccount as any);

      const mockCreated = { id: 'rule-1', name: 'Allocation Rule' };
      vi.mocked(prisma.allocationRule.create).mockResolvedValue(mockCreated as any);

      const dto = {
        name: 'Alloc Rule 1',
        allocationType: 'STATIC_PCT',
        sourceAccountId: 'acc-1',
        targetAllocations: [
          { accountId: 'acc-2', percentage: 40 },
          { accountId: 'acc-3', percentage: 60 },
        ],
      };

      const result = await service.createRule('tenant-1', dto, 'user-1');
      expect(result).toEqual(mockCreated);
      expect(prisma.allocationRule.create).toHaveBeenCalled();
      expect(glService.logAudit).toHaveBeenCalled();
    });

    it('should throw on createRule if static percentage total is not 100%', async () => {
      const mockAccount = { id: 'acc-1', name: 'Pool Account', type: 'EXPENSE' };
      vi.mocked(prisma.account.findFirst).mockResolvedValue(mockAccount as any);

      const dto = {
        name: 'Alloc Rule 1',
        allocationType: 'STATIC_PCT',
        sourceAccountId: 'acc-1',
        targetAllocations: [
          { accountId: 'acc-2', percentage: 40 },
          { accountId: 'acc-3', percentage: 50 }, // Total = 90%
        ],
      };

      await expect(service.createRule('tenant-1', dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeAllocationRun', () => {
    it('should execute static percentage run', async () => {
      const mockAccount = { id: 'acc-1', name: 'Pool Account', type: 'EXPENSE' };
      const mockRule = {
        id: 'rule-1',
        name: 'Static rule',
        isActive: true,
        allocationType: 'STATIC_PCT',
        sourceAccountId: 'acc-1',
        sourceAccount: mockAccount,
        targetAllocations: [
          { accountId: 'acc-2', percentage: 40 },
          { accountId: 'acc-3', percentage: 60 },
        ],
      };

      vi.mocked(prisma.allocationRule.findFirst).mockResolvedValue(mockRule as any);

      // Setup journal entries in period to yield a pool balance of $1000
      const mockEntries = [
        { debit: new Prisma.Decimal(1500), credit: new Prisma.Decimal(500) }, // net debit = 1000
      ];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockEntries as any);

      const mockRunCreated = { id: 'run-1', allocatedAmount: 1000 };
      vi.mocked(prisma.allocationRun.create).mockResolvedValue(mockRunCreated as any);

      const dto = { periodStart: '2026-01-01', periodEnd: '2026-01-31' };
      const result = await service.executeAllocationRun('tenant-1', 'org-1', 'rule-1', dto, 'user-1');

      expect(result.runId).toBeDefined();
      expect(result.allocatedAmount).toBe(1000);
      expect(glService.createJournal).toHaveBeenCalledWith('tenant-1', 'org-1', {
        entryNumber: expect.any(String),
        notes: expect.any(String),
        entries: [
          {
            accountId: 'acc-2',
            debit: 400,
            credit: 0,
            description: 'Allocation from Pool Account (40%)',
            costCenterId: undefined,
            departmentId: undefined,
          },
          {
            accountId: 'acc-3',
            debit: 600,
            credit: 0,
            description: 'Allocation from Pool Account (60%)',
            costCenterId: undefined,
            departmentId: undefined,
          },
          {
            accountId: 'acc-1',
            debit: 0,
            credit: 1000,
            description: 'Allocation source pool clearing for rule: Static rule',
          },
        ],
      });
    });

    it('should execute dynamic headcount run', async () => {
      const mockAccount = { id: 'acc-1', name: 'Pool Account', type: 'EXPENSE' };
      const mockRule = {
        id: 'rule-1',
        name: 'Headcount rule',
        isActive: true,
        allocationType: 'DYNAMIC_STAT',
        basisType: 'HEADCOUNT',
        sourceAccountId: 'acc-1',
        sourceAccount: mockAccount,
        targetAllocations: [
          { accountId: 'acc-2', departmentId: 'dept-1' },
          { accountId: 'acc-3', departmentId: 'dept-2' },
        ],
      };

      vi.mocked(prisma.allocationRule.findFirst).mockResolvedValue(mockRule as any);

      const mockEntries = [
        { debit: new Prisma.Decimal(1000), credit: new Prisma.Decimal(0) },
      ];
      vi.mocked(prisma.journalEntry.findMany).mockResolvedValue(mockEntries as any);

      // Setup active employees
      const mockEmployees = [
        { id: 'emp-1', departmentId: 'dept-1', status: 'ACTIVE' },
        { id: 'emp-2', departmentId: 'dept-1', status: 'ACTIVE' },
        { id: 'emp-3', departmentId: 'dept-2', status: 'ACTIVE' },
      ]; // dept-1 has 2, dept-2 has 1. Ratio = 2/3 and 1/3
      vi.mocked(prisma.employee.findMany).mockResolvedValue(mockEmployees as any);

      vi.mocked(prisma.allocationRun.create).mockResolvedValue({ id: 'run-2' } as any);

      const dto = { periodStart: '2026-01-01', periodEnd: '2026-01-31' };
      const result = await service.executeAllocationRun('tenant-1', 'org-1', 'rule-1', dto, 'user-1');

      expect(result.allocatedAmount).toBe(1000);
      expect(glService.createJournal).toHaveBeenCalled();
    });
  });
});
