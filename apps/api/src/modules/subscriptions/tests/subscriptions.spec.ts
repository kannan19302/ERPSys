import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionsService } from '../subscriptions.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

vi.mock('@unerp/database', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    subscriptionLine: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    subscriptionInvoice: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    subscriptionUsage: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    invoice: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  const tenantId = 'tenant-1';
  const orgId = 'org-1';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SubscriptionsService();
  });

  describe('findAll', () => {
    it('returns paginated and filtered subscriptions', async () => {
      const mockItems = [{ id: 'sub-1', name: 'Premium Plan' }];
      vi.mocked(prisma.subscription.findMany).mockResolvedValue(mockItems as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: '1', limit: '10', status: 'ACTIVE', search: 'Premium' });

      expect(result.data).toEqual(mockItems);
      expect(result.meta.total).toBe(1);
      expect(prisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('returns subscription by ID', async () => {
      const mockSub = { id: 'sub-1', name: 'Premium Plan' };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);

      const result = await service.findById(tenantId, 'sub-1');
      expect(result).toEqual(mockSub);
    });

    it('throws NotFoundException if not found', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
      await expect(service.findById(tenantId, 'sub-invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new subscription', async () => {
      const mockSub = { id: 'sub-1', name: 'Premium Plan' };
      vi.mocked(prisma.subscription.create).mockResolvedValue(mockSub as any);

      const dto = {
        name: 'Premium Plan',
        unitAmount: 100,
        startDate: '2026-01-01T00:00:00Z',
        lines: [
          { description: 'Base fee', unitAmount: 100, quantity: 1, taxRate: 5 }
        ]
      };

      const result = await service.create(tenantId, orgId, dto);
      expect(result).toEqual(mockSub);
      expect(prisma.subscription.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates a subscription', async () => {
      const mockSub = { id: 'sub-1', name: 'Premium Plan' };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ ...mockSub, name: 'Enterprise' } as any);

      const result = await service.update(tenantId, 'sub-1', { name: 'Enterprise' });
      expect(result.name).toBe('Enterprise');
    });
  });

  describe('lifecycle methods', () => {
    it('pauses active subscription', async () => {
      const mockSub = { id: 'sub-1', status: 'ACTIVE' };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ ...mockSub, status: 'PAUSED' } as any);

      const result = await service.pause(tenantId, 'sub-1');
      expect(result.status).toBe('PAUSED');
    });

    it('resumes paused subscription', async () => {
      const mockSub = { id: 'sub-1', status: 'PAUSED' };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ ...mockSub, status: 'ACTIVE' } as any);

      const result = await service.resume(tenantId, 'sub-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('cancels active subscription', async () => {
      const mockSub = { id: 'sub-1', status: 'ACTIVE' };
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ ...mockSub, status: 'CANCELED' } as any);

      const result = await service.cancel(tenantId, 'sub-1', true);
      expect(result.status).toBe('CANCELED');
    });
  });

  describe('usage tracking', () => {
    it('records usage', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: 'sub-1' } as any);
      vi.mocked(prisma.subscriptionUsage.create).mockResolvedValue({ id: 'use-1' } as any);

      const result = await service.recordUsage(tenantId, 'sub-1', {
        usageDate: '2026-01-01',
        metricName: 'seats',
        quantity: 5,
        unitAmount: 10
      });

      expect(result).toBeDefined();
    });

    it('gets usage logs', async () => {
      const mockUsage = [{ id: 'use-1', metricName: 'seats', quantity: 5 }];
      vi.mocked(prisma.subscriptionUsage.findMany).mockResolvedValue(mockUsage as any);

      const result = await service.getUsage(tenantId, 'sub-1', 'seats');
      expect(result).toEqual(mockUsage);
    });

    it('gets usage summary grouped by metric', async () => {
      vi.mocked(prisma.subscription.findFirst).mockResolvedValue({ id: 'sub-1' } as any);
      vi.mocked(prisma.subscriptionUsage.groupBy).mockResolvedValue([
        { metricName: 'seats', _sum: { quantity: 10, totalAmount: new Prisma.Decimal(100) } }
      ] as any);

      const result = await service.getUsageSummary(tenantId, 'sub-1');
      expect(result).toEqual([{ metricName: 'seats', totalQuantity: 10, totalAmount: 100 }]);
    });
  });

  describe('runBilling', () => {
    it('processes due subscriptions and generates invoices', async () => {
      const mockSub = {
        id: 'sub-1',
        orgId: 'org-1',
        customerId: 'cust-1',
        name: 'Premium',
        unitAmount: new Prisma.Decimal(100),
        quantity: 1,
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        trialEndDate: null,
      };

      vi.mocked(prisma.subscription.findMany).mockResolvedValue([mockSub] as any);
      vi.mocked(prisma.invoice.count).mockResolvedValue(0);
      vi.mocked(prisma.invoice.create).mockResolvedValue({ id: 'inv-1', invoiceNumber: 'SUB-org-1-00001' } as any);
      vi.mocked(prisma.subscriptionInvoice.count).mockResolvedValue(0);
      vi.mocked(prisma.subscriptionInvoice.create).mockResolvedValue({ id: 'sub-inv-1' } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({} as any);

      const result = await service.runBilling(tenantId);
      expect(result.processed).toBe(1);
      expect(result.billed).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('calculates ARR, MRR and growth ratios', async () => {
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([
        { unitAmount: new Prisma.Decimal(100), quantity: 1, billingPeriod: 'MONTHLY' }
      ] as any);
      vi.mocked(prisma.subscription.count).mockResolvedValue(1);

      const result = await service.getMetrics(tenantId);
      expect(result.mrr).toBe(100);
      expect(result.arr).toBe(1200);
    });
  });

  describe('getStats', () => {
    it('returns subscription summary count grouped by status', async () => {
      vi.mocked(prisma.subscription.count).mockResolvedValue(10);
      vi.mocked(prisma.subscription.groupBy).mockResolvedValue([
        { status: 'ACTIVE', _count: 8 },
        { status: 'PAUSED', _count: 2 }
      ] as any);

      const result = await service.getStats(tenantId);
      expect(result.total).toBe(10);
      expect(result.byStatus).toHaveLength(2);
    });
  });
});

