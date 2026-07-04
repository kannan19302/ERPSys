import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmLeadsService } from '../crm-leads.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

vi.mock('@unerp/database', () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findFirst: vi.fn().mockResolvedValue({ id: 'org-1' }),
    },
    opportunity: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmLeadsService', () => {
  let service: CrmLeadsService;
  let mockLeadScoring: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org-1' });
    mockLeadScoring = { recalculateScore: vi.fn().mockResolvedValue(undefined) };
    service = new CrmLeadsService(mockLeadScoring);
  });

  describe('bulkUpdateLeadStatus', () => {
    it('rejects invalid status values', async () => {
      await expect(service.bulkUpdateLeadStatus(TENANT, ['lead-1'], 'INVALID')).rejects.toThrow(BadRequestException);
    });

    it('accepts valid lead status values', async () => {
      const validStatuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'];
      for (const status of validStatuses) {
        (prisma.lead.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 });
        const result = await service.bulkUpdateLeadStatus(TENANT, ['lead-1'], status);
        expect(result).toEqual({ updated: 1, status });
      }
    });

    it('updates multiple leads with a valid status', async () => {
      (prisma.lead.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 5 });

      const result = await service.bulkUpdateLeadStatus(TENANT, ['lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5'], 'QUALIFIED');
      expect(result).toEqual({ updated: 5, status: 'QUALIFIED' });

      const call = (prisma.lead.updateMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.id.in).toEqual(['lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5']);
      expect(call.where.tenantId).toBe(TENANT);
      expect(call.where.deletedAt).toBeNull();
      expect(call.data.status).toBe('QUALIFIED');
    });
  });

  describe('exportLeads', () => {
    it('returns leads with relevant fields for export', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
          status: 'QUALIFIED',
          score: 75,
        },
      ]);

      const result = await service.exportLeads(TENANT);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('firstName');
      expect(result[0]).toHaveProperty('lastName');
      expect(result[0]).toHaveProperty('company');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('score');
    });

    it('filters by status when provided', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportLeads(TENANT, { status: 'QUALIFIED' });

      const call = (prisma.lead.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.status).toBe('QUALIFIED');
      expect(call.where.deletedAt).toBeNull();
    });

    it('filters by search term across multiple fields', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportLeads(TENANT, { search: 'acme' });

      const call = (prisma.lead.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
      expect(call.where.OR).toContainEqual(expect.objectContaining({
        firstName: { contains: 'acme', mode: 'insensitive' },
      }));
      expect(call.where.OR).toContainEqual(expect.objectContaining({
        company: { contains: 'acme', mode: 'insensitive' },
      }));
    });

    it('always scopes by tenant and excludes soft-deleted leads', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportLeads(TENANT);

      const call = (prisma.lead.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.tenantId).toBe(TENANT);
      expect(call.where.deletedAt).toBeNull();
    });

    it('orders export results by createdAt descending', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.exportLeads(TENANT);

      const call = (prisma.lead.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
    });
  });

  describe('updateLeadStatus (transition guard)', () => {
    it('throws if the lead does not exist', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.updateLeadStatus(TENANT, 'missing', 'QUALIFIED')).rejects.toThrow(NotFoundException);
    });

    it('allows a valid forward transition (NEW -> CONTACTED)', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', tenantId: TENANT, status: 'NEW' });
      (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', status: 'CONTACTED' });

      const result = await service.updateLeadStatus(TENANT, 'lead-1', 'CONTACTED');
      expect(result.status).toBe('CONTACTED');
    });

    it('rejects DISQUALIFIED -> CONVERTED (terminal status, no transitions allowed)', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', tenantId: TENANT, status: 'DISQUALIFIED' });
      await expect(service.updateLeadStatus(TENANT, 'lead-1', 'CONVERTED')).rejects.toThrow(BadRequestException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('rejects CONVERTED -> anything (terminal status)', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', tenantId: TENANT, status: 'CONVERTED' });
      await expect(service.updateLeadStatus(TENANT, 'lead-1', 'NEW')).rejects.toThrow(BadRequestException);
      expect(prisma.lead.update).not.toHaveBeenCalled();
    });

    it('rejects reaching CONVERTED via a plain status update with a specific message pointing at /convert', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', tenantId: TENANT, status: 'NEW' });
      await expect(service.updateLeadStatus(TENANT, 'lead-1', 'CONVERTED')).rejects.toThrow(/convert/i);
    });

    it('allows re-setting the same status as a no-op', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', tenantId: TENANT, status: 'QUALIFIED' });
      (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', status: 'QUALIFIED' });

      const result = await service.updateLeadStatus(TENANT, 'lead-1', 'QUALIFIED');
      expect(result.status).toBe('QUALIFIED');
    });
  });

  describe('getLeadSummary', () => {
    it('throws if the lead does not exist', async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.getLeadSummary(TENANT, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the lead, related opportunities, and computed metrics', async () => {
      const createdAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-1',
        tenantId: TENANT,
        status: 'QUALIFIED',
        score: 80,
        createdAt,
        activities: [
          { id: 'a1', completedAt: new Date() },
          { id: 'a2', completedAt: new Date() },
          { id: 'a3', completedAt: null },
        ],
      });
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'opp-1', name: 'Deal from lead', stage: 'QUALIFICATION' },
      ]);

      const result = await service.getLeadSummary(TENANT, 'lead-1');

      expect(result.lead.id).toBe('lead-1');
      expect(result.relatedOpportunities).toHaveLength(1);
      expect(result.metrics.daysSinceCreation).toBeGreaterThanOrEqual(4);
      expect(result.metrics.conversionLikelihood).toBe('high'); // score 80 >= 70
      // 2 completed > 1 pending -> upward trend
      expect(result.metrics.scoreTrend).toBe('up');
      expect(result.metrics.completedActivities).toBe(2);
      expect(result.metrics.pendingActivities).toBe(1);
    });

    it('buckets conversion likelihood by score thresholds', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-low', tenantId: TENANT, status: 'NEW', score: 10, createdAt: new Date(), activities: [],
      });
      let result = await service.getLeadSummary(TENANT, 'lead-low');
      expect(result.metrics.conversionLikelihood).toBe('low');

      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-mid', tenantId: TENANT, status: 'NEW', score: 50, createdAt: new Date(), activities: [],
      });
      result = await service.getLeadSummary(TENANT, 'lead-mid');
      expect(result.metrics.conversionLikelihood).toBe('medium');

      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-high', tenantId: TENANT, status: 'NEW', score: 90, createdAt: new Date(), activities: [],
      });
      result = await service.getLeadSummary(TENANT, 'lead-high');
      expect(result.metrics.conversionLikelihood).toBe('high');
    });

    it('marks isConverted true only when status is CONVERTED', async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'lead-1', tenantId: TENANT, status: 'CONVERTED', score: 50, createdAt: new Date(), activities: [],
      });
      const result = await service.getLeadSummary(TENANT, 'lead-1');
      expect(result.metrics.isConverted).toBe(true);
    });
  });
});
