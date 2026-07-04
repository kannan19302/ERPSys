import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmDealsService } from '../crm-deals.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    opportunityLineItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    salesPipeline: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    priceBook: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    salesPlaybook: {
      findFirst: vi.fn(),
    },
    opportunityChecklist: {
      findMany: vi.fn(),
    },
    lead: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    leadSource: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmDealsService', () => {
  let service: CrmDealsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmDealsService();
  });

  describe('exportOpportunities', () => {
    it('exports opportunities as CSV-ready objects with flat fields', async () => {
      const mockOpps = [
        {
          id: 'opp-1',
          name: 'Deal 1',
          amount: 10000,
          stage: 'PROSPECTING',
          pipelineId: 'pipeline-1',
          expectedCloseDate: new Date('2026-12-31'),
          actualCloseDate: null,
          probability: 25,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 'opp-2',
          name: 'Deal 2',
          amount: 50000,
          stage: 'NEGOTIATION',
          pipelineId: 'pipeline-1',
          expectedCloseDate: new Date('2026-06-30'),
          actualCloseDate: null,
          probability: 75,
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date('2026-02-01'),
        },
      ];
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockOpps);

      const result = await service.exportOpportunities(TENANT);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockOpps[0]);
      expect(result[1]).toEqual(mockOpps[1]);
      expect(prisma.opportunity.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: TENANT, deletedAt: null },
        orderBy: { name: 'asc' },
      }));
    });

    it('filters opportunities by pipelineId when provided', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.exportOpportunities(TENANT, { pipelineId: 'pipeline-1' });

      const call = (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.pipelineId).toBe('pipeline-1');
    });

    it('filters opportunities by stage when provided', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.exportOpportunities(TENANT, { stage: 'CLOSED_WON' });

      const call = (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.stage).toBe('CLOSED_WON');
    });

    it('filters opportunities by search term (name) when provided', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.exportOpportunities(TENANT, { search: 'Enterprise Deal' });

      const call = (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR[0].name).toEqual({ contains: 'Enterprise Deal', mode: 'insensitive' });
    });

    it('combines multiple filters', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.exportOpportunities(TENANT, {
        pipelineId: 'pipeline-1',
        stage: 'NEGOTIATION',
        search: 'Acme',
      });

      const call = (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.tenantId).toBe(TENANT);
      expect(call.where.pipelineId).toBe('pipeline-1');
      expect(call.where.stage).toBe('NEGOTIATION');
      expect(call.where.OR).toBeDefined();
    });
  });

  describe('bulkUpdateOpportunityStage', () => {
    it('updates multiple opportunities to a new stage', async () => {
      (prisma.opportunity.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

      const result = await service.bulkUpdateOpportunityStage(TENANT, ['opp-1', 'opp-2', 'opp-3'], 'CLOSED_WON');

      expect(result).toEqual({ updated: 3, stage: 'CLOSED_WON' });
      expect(prisma.opportunity.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['opp-1', 'opp-2', 'opp-3'] }, tenantId: TENANT, deletedAt: null },
          data: expect.objectContaining({ stage: 'CLOSED_WON' }),
        })
      );
    });

    it('sets stageEnteredAt to current time when updating stage', async () => {
      const beforeUpdate = Date.now();
      (prisma.opportunity.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });

      await service.bulkUpdateOpportunityStage(TENANT, ['opp-1'], 'PROPOSAL');

      const updateCall = (prisma.opportunity.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const stageEnteredAt = updateCall.data.stageEnteredAt;
      expect(stageEnteredAt).toBeInstanceOf(Date);
      expect(stageEnteredAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('throws BadRequestException if ids array is empty', async () => {
      await expect(service.bulkUpdateOpportunityStage(TENANT, [], 'CLOSED_WON')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if ids array is not provided', async () => {
      await expect(service.bulkUpdateOpportunityStage(TENANT, undefined as any, 'CLOSED_WON')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if stage is empty string', async () => {
      await expect(service.bulkUpdateOpportunityStage(TENANT, ['opp-1'], '')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if stage is whitespace only', async () => {
      await expect(service.bulkUpdateOpportunityStage(TENANT, ['opp-1'], '   ')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if stage is not a string', async () => {
      await expect(service.bulkUpdateOpportunityStage(TENANT, ['opp-1'], null as any)).rejects.toThrow(BadRequestException);
    });

    it('returns zero count when no opportunities match the filter', async () => {
      (prisma.opportunity.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

      const result = await service.bulkUpdateOpportunityStage(TENANT, ['missing-1', 'missing-2'], 'CLOSED_WON');

      expect(result).toEqual({ updated: 0, stage: 'CLOSED_WON' });
    });
  });

  describe('getOpportunitySummary', () => {
    it('throws if the opportunity does not exist', async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getOpportunitySummary(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('computes weighted pipeline value, days in stage, and aging bucket for an open deal', async () => {
      const stageEnteredAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'opp-1',
        stage: 'PROPOSAL',
        amount: 10000,
        probability: 40,
        stageEnteredAt,
        updatedAt: stageEnteredAt,
        createdAt: stageEnteredAt,
        activities: [{ id: 'a1' }, { id: 'a2' }],
        lineItems: [
          { id: 'li1', totalAmount: 6000, product: null },
          { id: 'li2', totalAmount: 4000, product: null },
        ],
      });

      const result = await service.getOpportunitySummary(TENANT, 'opp-1');

      expect(result.metrics.weightedPipelineValue).toBe(4000); // 10000 * 0.4
      expect(result.metrics.daysInCurrentStage).toBeGreaterThanOrEqual(9);
      expect(result.metrics.agingBucket).toBe('aging'); // 8-30 days
      expect(result.metrics.isClosed).toBe(false);
      expect(result.metrics.lineItemsTotal).toBe(10000);
      expect(result.metrics.lineItemsCount).toBe(2);
      expect(result.lineItems).toHaveLength(2);
      expect(result.recentActivities).toHaveLength(2);
    });

    it('marks a CLOSED_WON opportunity with a "closed" aging bucket regardless of age', async () => {
      const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'opp-2',
        stage: 'CLOSED_WON',
        amount: 5000,
        probability: 100,
        stageEnteredAt: oldDate,
        updatedAt: oldDate,
        createdAt: oldDate,
        activities: [],
        lineItems: [],
      });

      const result = await service.getOpportunitySummary(TENANT, 'opp-2');
      expect(result.metrics.agingBucket).toBe('closed');
      expect(result.metrics.isClosed).toBe(true);
      expect(result.metrics.isWon).toBe(true);
    });

    it('flags a stale open deal older than 30 days in-stage as rotting', async () => {
      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'opp-3',
        stage: 'NEGOTIATION',
        amount: 20000,
        probability: 60,
        stageEnteredAt: oldDate,
        updatedAt: oldDate,
        createdAt: oldDate,
        activities: [],
        lineItems: [],
      });

      const result = await service.getOpportunitySummary(TENANT, 'opp-3');
      expect(result.metrics.agingBucket).toBe('stale'); // 31-60 days
      expect(result.metrics.isRotting).toBe(true);
    });
  });
});
