import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmSalesOpsService } from '../crm-salesops.service';
import { Prisma } from '@prisma/client';

vi.mock('@unerp/database', () => ({
  prisma: {
    salesTarget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    opportunity: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmSalesOpsService', () => {
  let service: CrmSalesOpsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmSalesOpsService();
  });

  describe('getSalesTargets', () => {
    it('computes REVENUE quota attainment live from closed-won Opportunity amounts in the period', async () => {
      (prisma.salesTarget.findMany as any).mockResolvedValue([
        {
          id: 'target-1', tenantId: TENANT, orgId: 'org-1', userId: 'user-1',
          period: '2026-01', targetType: 'REVENUE', target: new Prisma.Decimal(10000),
          achieved: new Prisma.Decimal(0), createdAt: new Date(), updatedAt: new Date(),
        },
      ]);
      (prisma.opportunity.aggregate as any).mockResolvedValue({ _sum: { amount: new Prisma.Decimal(7500) } });

      const [target] = await service.getSalesTargets(TENANT);

      expect(prisma.opportunity.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            stage: 'CLOSED_WON',
            assignedToId: 'user-1',
            actualCloseDate: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2026, 1, 1)) },
          }),
        }),
      );
      expect(Number(target.achieved)).toBe(7500);
      expect(target.name).toContain('2026-01');
    });

    it('counts closed-won deals instead of summing amount for targetType DEALS', async () => {
      (prisma.salesTarget.findMany as any).mockResolvedValue([
        {
          id: 'target-2', tenantId: TENANT, orgId: 'org-1', userId: null,
          period: '2026-Q1', targetType: 'DEALS', target: new Prisma.Decimal(20),
          achieved: new Prisma.Decimal(0), createdAt: new Date(), updatedAt: new Date(),
        },
      ]);
      (prisma.opportunity.count as any).mockResolvedValue(12);

      const [target] = await service.getSalesTargets(TENANT);

      expect(prisma.opportunity.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            stage: 'CLOSED_WON',
            actualCloseDate: { gte: new Date(Date.UTC(2026, 0, 1)), lt: new Date(Date.UTC(2026, 3, 1)) },
          }),
        }),
      );
      expect(Number(target.achieved)).toBe(12);
      expect(target.name).toContain('(Team)');
    });
  });
});
