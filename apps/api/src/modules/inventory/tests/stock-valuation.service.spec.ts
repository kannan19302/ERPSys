import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockValuationService } from '../stock-valuation.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    stockValuationPolicy: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stockValuationLedger: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    costAdjustment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    stockRevaluation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

const TENANT = 't1';
const USER = 'u1';

const mockPolicy = (o = {}) => ({ id: 'p1', tenantId: TENANT, method: 'WEIGHTED_AVG', isActive: true, ...o });
const mockAdj = (o = {}) => ({ id: 'a1', tenantId: TENANT, adjustmentNumber: 'CAD-00001', productId: 'prod1', oldUnitCost: '10', newUnitCost: '12', qty: '100', impactAmount: '200', reason: 'Test', status: 'PENDING', ...o });
const mockReval = (o = {}) => ({ id: 'r1', tenantId: TENANT, revaluationNumber: 'RVL-00001', status: 'DRAFT', lines: [], ...o });

describe('StockValuationService', () => {
  let svc: StockValuationService;

  beforeEach(async () => {
    vi.clearAllMocks();
    svc = new StockValuationService();
  });

  describe('listPolicies', () => {
    it('returns all policies for tenant', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.findMany).mockResolvedValue([mockPolicy()] as never);
      const result = await svc.listPolicies(TENANT);
      expect(result).toHaveLength(1);
    });
  });

  describe('getPolicy', () => {
    it('returns policy when found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.findFirst).mockResolvedValue(mockPolicy() as never);
      const result = await svc.getPolicy(TENANT, 'p1');
      expect(result.id).toBe('p1');
    });

    it('throws NotFoundException when not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.findFirst).mockResolvedValue(null as never);
      await expect(svc.getPolicy(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertPolicy', () => {
    it('creates or updates policy', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.upsert).mockResolvedValue(mockPolicy() as never);
      const result = await svc.upsertPolicy(TENANT, USER, { method: 'WEIGHTED_AVG', productId: 'prod1' });
      expect(result.method).toBe('WEIGHTED_AVG');
    });
  });

  describe('deactivatePolicy', () => {
    it('deactivates active policy', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.findFirst).mockResolvedValue(mockPolicy() as never);
      vi.mocked(prisma.stockValuationPolicy.update).mockResolvedValue(mockPolicy({ isActive: false }) as never);
      const result = await svc.deactivatePolicy(TENANT, 'p1');
      expect(result.isActive).toBe(false);
    });
  });

  describe('postLedgerEntry', () => {
    it('posts entry with running totals', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationLedger.findFirst).mockResolvedValue({
        runningQty: '100', runningValue: '1000',
      } as never);
      vi.mocked(prisma.stockValuationLedger.create).mockResolvedValue({ id: 'le1' } as never);
      await svc.postLedgerEntry(TENANT, {
        productId: 'prod1', method: 'WEIGHTED_AVG', transactionType: 'RECEIPT',
        transactionRef: 'SE-001', qty: 50, unitCost: 12,
      });
      expect(prisma.stockValuationLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ transactionType: 'RECEIPT' }),
        }),
      );
    });

    it('starts from zero when no prior entries', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationLedger.findFirst).mockResolvedValue(null as never);
      vi.mocked(prisma.stockValuationLedger.create).mockResolvedValue({ id: 'le1' } as never);
      await svc.postLedgerEntry(TENANT, {
        productId: 'prod1', method: 'FIFO', transactionType: 'RECEIPT',
        transactionRef: 'SE-001', qty: 100, unitCost: 10,
      });
      expect(prisma.stockValuationLedger.create).toHaveBeenCalled();
    });
  });

  describe('computeIssueCost', () => {
    it('uses weighted average for WEIGHTED_AVG method', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationLedger.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.stockValuationLedger.findFirst).mockResolvedValue({ runningAvgCost: '10.5' } as never);
      const result = await svc.computeIssueCost(TENANT, 'p1', undefined, 100, 'WEIGHTED_AVG');
      expect(result.unitCost).toBe(10.5);
      expect(result.issueCost).toBe(1050);
    });

    it('returns FIFO cost from oldest layers', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationLedger.findMany).mockResolvedValue([
        { qty: '50', unitCost: '10' },
        { qty: '100', unitCost: '12' },
      ] as never);
      const result = await svc.computeIssueCost(TENANT, 'p1', undefined, 75, 'FIFO');
      expect(result.issueCost).toBeCloseTo(50 * 10 + 25 * 12);
    });
  });

  describe('createAdjustment', () => {
    it('creates adjustment with impact amount', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.costAdjustment.create).mockResolvedValue(mockAdj() as never);
      const result = await svc.createAdjustment(TENANT, USER, {
        productId: 'prod1', oldUnitCost: 10, newUnitCost: 12, qty: 100, reason: 'Price correction',
      });
      expect(result.adjustmentNumber).toBe('CAD-00001');
    });
  });

  describe('approveAdjustment', () => {
    it('approves PENDING adjustment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.findFirst).mockResolvedValue(mockAdj() as never);
      vi.mocked(prisma.costAdjustment.update).mockResolvedValue(mockAdj({ status: 'APPROVED' }) as never);
      const result = await svc.approveAdjustment(TENANT, 'a1', USER);
      expect(result.status).toBe('APPROVED');
    });

    it('throws if not PENDING', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.findFirst).mockResolvedValue(mockAdj({ status: 'APPROVED' }) as never);
      await expect(svc.approveAdjustment(TENANT, 'a1', USER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('postAdjustment', () => {
    it('posts APPROVED adjustment and creates ledger entry', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.findFirst).mockResolvedValue(mockAdj({ status: 'APPROVED' }) as never);
      vi.mocked(prisma.stockValuationLedger.create).mockResolvedValue({ id: 'le1' } as never);
      vi.mocked(prisma.costAdjustment.update).mockResolvedValue(mockAdj({ status: 'POSTED' }) as never);
      const result = await svc.postAdjustment(TENANT, 'a1');
      expect(prisma.stockValuationLedger.create).toHaveBeenCalled();
      expect(result.status).toBe('POSTED');
    });

    it('throws if not APPROVED', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.findFirst).mockResolvedValue(mockAdj({ status: 'PENDING' }) as never);
      await expect(svc.postAdjustment(TENANT, 'a1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectAdjustment', () => {
    it('rejects PENDING adjustment', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.costAdjustment.findFirst).mockResolvedValue(mockAdj() as never);
      vi.mocked(prisma.costAdjustment.update).mockResolvedValue(mockAdj({ status: 'REJECTED' }) as never);
      const result = await svc.rejectAdjustment(TENANT, 'a1');
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('createRevaluation', () => {
    it('creates revaluation with total impact', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockRevaluation.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.stockRevaluation.create).mockResolvedValue(mockReval() as never);
      await svc.createRevaluation(TENANT, USER, {
        revaluationDate: '2026-07-13',
        lines: [{ productId: 'p1', currentQty: 100, currentUnitCost: 10, newUnitCost: 11 }],
      });
      expect(prisma.stockRevaluation.create).toHaveBeenCalled();
    });
  });

  describe('postRevaluation', () => {
    it('posts DRAFT revaluation', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockRevaluation.findFirst).mockResolvedValue(mockReval({
        lines: [{ id: 'l1', productId: 'p1', currentQty: '100', currentUnitCost: '10', newUnitCost: '11', impactAmount: '100', warehouseId: null }],
      }) as never);
      vi.mocked(prisma.stockValuationLedger.create).mockResolvedValue({} as never);
      vi.mocked(prisma.stockRevaluation.update).mockResolvedValue(mockReval({ status: 'POSTED' }) as never);
      const result = await svc.postRevaluation(TENANT, 'r1');
      expect(result.status).toBe('POSTED');
    });

    it('throws if not DRAFT', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockRevaluation.findFirst).mockResolvedValue(mockReval({ status: 'POSTED', lines: [] }) as never);
      await expect(svc.postRevaluation(TENANT, 'r1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getDashboard', () => {
    it('returns all dashboard stats', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.stockValuationPolicy.count).mockResolvedValue(5 as never);
      vi.mocked(prisma.costAdjustment.count).mockResolvedValue(3 as never);
      vi.mocked(prisma.stockRevaluation.count).mockResolvedValue(2 as never);
      vi.mocked(prisma.stockRevaluation.aggregate).mockResolvedValue({ _sum: { totalImpact: '5000' } } as never);
      vi.mocked(prisma.costAdjustment.aggregate).mockResolvedValue({ _sum: { impactAmount: '1000' } } as never);
      const result = await svc.getDashboard(TENANT);
      expect(result.totalPolicies).toBe(5);
      expect(result.totalRevaluationImpact).toBe(5000);
    });
  });
});
