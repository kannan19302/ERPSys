import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardSpendLimitService } from '../services/card-spend-limit.service';
import { prisma } from '@unerp/database';
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
      JsonNull: null,
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
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

  return {
    prisma: {
      corporateCard: createMockPrismaCollection(),
      cardSpendLimit: createMockPrismaCollection(),
      cardCategoryLimit: createMockPrismaCollection(),
      cardLimitAuditLog: createMockPrismaCollection(),
      cardLimitIncreaseRequest: createMockPrismaCollection(),
      adminAlert: createMockPrismaCollection(),
      employee: createMockPrismaCollection(),
      $queryRawUnsafe: vi.fn(),
    },
  };
});

const TENANT = 'tenant-1';
const CARD_ID = 'card-1';

describe('CardSpendLimitService', () => {
  let service: CardSpendLimitService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CardSpendLimitService();
    vi.mocked(prisma.cardLimitAuditLog.create).mockResolvedValue({} as any);
    vi.mocked(prisma.adminAlert.create).mockResolvedValue({} as any);
    vi.mocked(prisma.employee.findFirst).mockResolvedValue({ id: 'emp-1', departmentId: 'dept-1' } as any);
  });

  describe('checkAuthorization', () => {
    it('denies when card is frozen', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: true } as any);
      const result = await service.checkAuthorization(TENANT, CARD_ID, 50);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('frozen');
    });

    it('denies when transaction would exceed the active spend limit cap', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: false } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', tenantId: TENANT, cardId: CARD_ID, amountCap: 100, currentSpend: 80, period: 'MONTHLY', scopeType: 'CARD', breachCount: 0 },
      ] as any);
      // amount (30) pushes 80 -> 110 > cap 100, so the conditional UPDATE matches 0 rows.
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
      vi.mocked(prisma.cardSpendLimit.update).mockResolvedValue({ breachCount: 1 } as any);

      const result = await service.checkAuthorization(TENANT, CARD_ID, 30);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Exceeds MONTHLY spend limit');
      expect(prisma.cardLimitAuditLog.create).toHaveBeenCalled();
    });

    it('allows and atomically reserves spend when under the cap', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: false } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', tenantId: TENANT, cardId: CARD_ID, amountCap: 1000, currentSpend: 100, period: 'MONTHLY', scopeType: 'CARD', breachCount: 0 },
      ] as any);
      // 100 + 50 = 150 <= cap 1000, so the conditional UPDATE matches 1 row.
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ id: 'limit-1' }]);

      const result = await service.checkAuthorization(TENANT, CARD_ID, 50);

      expect(result.allowed).toBe(true);
      const rawCall = vi.mocked(prisma.$queryRawUnsafe).mock.calls[0];
      expect(rawCall[1]).toBe(50);
      expect(rawCall[2]).toBe('limit-1');
    });

    it('denies when category (MCC) limit is exceeded even if card limit is fine', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: false } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cardCategoryLimit.findMany).mockResolvedValue([
        { id: 'cat-1', tenantId: TENANT, cardId: CARD_ID, amountCap: 200, currentSpend: 190, period: 'WEEKLY', mccCategory: 'TRAVEL', breachCount: 0 },
      ] as any);
      // 190 + 20 = 210 > cap 200, conditional UPDATE matches 0 rows.
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
      vi.mocked(prisma.cardCategoryLimit.update).mockResolvedValue({ breachCount: 1 } as any);

      const result = await service.checkAuthorization(TENANT, CARD_ID, 20, 'TRAVEL');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('category limit');
    });

    it('auto-freezes the card after 3+ breaches in the period', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: false } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', tenantId: TENANT, cardId: CARD_ID, amountCap: 100, currentSpend: 100, period: 'MONTHLY', scopeType: 'CARD', breachCount: 2 },
      ] as any);
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);
      vi.mocked(prisma.cardSpendLimit.update).mockResolvedValue({ breachCount: 3 } as any);
      vi.mocked(prisma.corporateCard.update).mockResolvedValue({} as any);

      await service.checkAuthorization(TENANT, CARD_ID, 10);

      expect(prisma.corporateCard.update).toHaveBeenCalledWith({
        where: { id: CARD_ID },
        data: { isFrozen: true },
      });
    });

    it('only enforces an EMPLOYEE-scoped limit that matches the card holder', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, employeeId: 'emp-1', isFrozen: false } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([]);

      await service.checkAuthorization(TENANT, CARD_ID, 10);

      const findManyArgs = vi.mocked(prisma.cardSpendLimit.findMany).mock.calls[0][0] as any;
      const scopeOr = findManyArgs.where.OR;
      expect(scopeOr).toContainEqual({ scopeType: 'EMPLOYEE', scopeId: 'emp-1' });
      expect(scopeOr).toContainEqual({ scopeType: 'DEPARTMENT', scopeId: 'dept-1' });
    });
  });

  describe('getUtilization — limit math', () => {
    it('computes utilization percentage correctly', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', scopeType: 'CARD', scopeId: null, period: 'MONTHLY', periodStart: new Date(), periodEnd: new Date(), amountCap: 200, currentSpend: 50 },
      ] as any);
      vi.mocked(prisma.cardCategoryLimit.findMany).mockResolvedValue([]);

      const result = await service.getUtilization(TENANT, CARD_ID);

      expect(result.spendLimits[0].utilizationPct).toBe(25);
    });

    it('handles zero-cap limits without dividing by zero', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID } as any);
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', scopeType: 'CARD', scopeId: null, period: 'MONTHLY', periodStart: new Date(), periodEnd: new Date(), amountCap: 0, currentSpend: 0 },
      ] as any);
      vi.mocked(prisma.cardCategoryLimit.findMany).mockResolvedValue([]);

      const result = await service.getUtilization(TENANT, CARD_ID);

      expect(result.spendLimits[0].utilizationPct).toBe(0);
    });
  });

  describe('resetExpiredPeriods', () => {
    it('zeroes currentSpend and rolls the period forward for expired limits', async () => {
      const expiredEnd = new Date('2026-01-01');
      vi.mocked(prisma.cardSpendLimit.findMany).mockResolvedValue([
        { id: 'limit-1', tenantId: TENANT, period: 'MONTHLY', periodStart: new Date('2025-12-01'), periodEnd: expiredEnd, isActive: true },
      ] as any);
      vi.mocked(prisma.cardCategoryLimit.findMany).mockResolvedValue([]);
      vi.mocked(prisma.cardSpendLimit.update).mockResolvedValue({} as any);

      const result = await service.resetExpiredPeriods();

      expect(result.spendLimitsReset).toBe(1);
      const updateCall = vi.mocked(prisma.cardSpendLimit.update).mock.calls[0][0] as any;
      expect(Number(updateCall.data.currentSpend)).toBe(0);
      expect(updateCall.data.periodStart).toEqual(expiredEnd);
    });
  });

  describe('requestLimitIncrease', () => {
    it('rejects a requested cap that is not greater than the current cap', async () => {
      vi.mocked(prisma.cardSpendLimit.findFirst).mockResolvedValue({ id: 'limit-1', amountCap: 500 } as any);
      await expect(
        service.requestLimitIncrease(TENANT, 'limit-1', 'user-1', { requestedCap: 400 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the limit does not exist', async () => {
      vi.mocked(prisma.cardSpendLimit.findFirst).mockResolvedValue(null);
      await expect(
        service.requestLimitIncrease(TENANT, 'missing', 'user-1', { requestedCap: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('freezeCard / unfreezeCard', () => {
    it('freezes an active card', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, isFrozen: false } as any);
      vi.mocked(prisma.corporateCard.update).mockResolvedValue({ id: CARD_ID, isFrozen: true } as any);
      const result = await service.freezeCard(TENANT, CARD_ID);
      expect(result.isFrozen).toBe(true);
    });

    it('is a no-op when the card is already frozen', async () => {
      vi.mocked(prisma.corporateCard.findFirst).mockResolvedValue({ id: CARD_ID, isFrozen: true } as any);
      await service.freezeCard(TENANT, CARD_ID);
      expect(prisma.corporateCard.update).not.toHaveBeenCalled();
    });
  });
});
