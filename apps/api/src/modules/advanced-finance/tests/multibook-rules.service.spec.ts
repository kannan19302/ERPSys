import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlAccountingService } from '../services/gl-accounting.service';
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
      accountingBook: createMockPrismaCollection(),
      accountingBookRule: createMockPrismaCollection(),
      account: createMockPrismaCollection(),
      journal: createMockPrismaCollection(),
      journalEntry: createMockPrismaCollection(),
      financeAuditLog: createMockPrismaCollection(),
      organization: {
        findFirst: vi.fn().mockResolvedValue({ id: 'org-1' }),
      },
    },
  };
});

describe('MultiBook Rules Engine', () => {
  let service: GlAccountingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GlAccountingService();
  });

  describe('getAccountingBookRules', () => {
    it('should return accounting book rules', async () => {
      const mockRules = [{ id: 'rule-1', ruleType: 'MAP_ACCOUNT' }];
      vi.mocked(prisma.accountingBookRule.findMany).mockResolvedValue(mockRules as any);

      const result = await service.getAccountingBookRules('tenant-1');
      expect(prisma.accountingBookRule.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockRules);
    });
  });

  describe('createAccountingBookRule', () => {
    it('should create a new accounting book rule', async () => {
      const dto = {
        sourceBookId: 'book-1',
        destinationBookId: 'book-2',
        sourceAccountId: 'acc-1',
        destinationAccountId: 'acc-2',
        ruleType: 'MAP_ACCOUNT',
        multiplier: 1.2,
      };

      const mockRule = { id: 'rule-1', ...dto };
      vi.mocked(prisma.accountingBookRule.create).mockResolvedValue(mockRule as any);

      const result = await service.createAccountingBookRule('tenant-1', 'org-1', dto);
      expect(prisma.accountingBookRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sourceBookId: 'book-1',
          destinationBookId: 'book-2',
          sourceAccountId: 'acc-1',
          destinationAccountId: 'acc-2',
          ruleType: 'MAP_ACCOUNT',
          multiplier: 1.2,
        }),
      });
      expect(result).toEqual(mockRule);
    });
  });

  describe('deleteAccountingBookRule', () => {
    it('should throw NotFoundException if rule does not exist', async () => {
      vi.mocked(prisma.accountingBookRule.findFirst).mockResolvedValue(null);
      await expect(service.deleteAccountingBookRule('tenant-1', 'rule-1')).rejects.toThrow(NotFoundException);
    });

    it('should delete accounting book rule if it exists', async () => {
      const mockRule = { id: 'rule-1', tenantId: 'tenant-1' };
      vi.mocked(prisma.accountingBookRule.findFirst).mockResolvedValue(mockRule as any);
      vi.mocked(prisma.accountingBookRule.delete).mockResolvedValue(mockRule as any);

      const result = await service.deleteAccountingBookRule('tenant-1', 'rule-1');
      expect(prisma.accountingBookRule.delete).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
      expect(result).toEqual(mockRule);
    });
  });
});
