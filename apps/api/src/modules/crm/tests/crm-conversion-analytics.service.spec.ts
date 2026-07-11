import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmConversionAnalyticsService } from '../crm-conversion-analytics.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    lead: { count: vi.fn(), findMany: vi.fn() },
    opportunity: { count: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmConversionAnalyticsService', () => {
  let service: CrmConversionAnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmConversionAnalyticsService();
  });

  describe('getFunnelSummary', () => {
    it('computes conversion rates at each funnel stage', async () => {
      (prisma.lead.count as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(100) // totalLeads
        .mockResolvedValueOnce(40) // qualifiedLeads
        .mockResolvedValueOnce(20) // convertedLeads
        .mockResolvedValueOnce(10); // wonOpportunities
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.getFunnelSummary(TENANT);

      expect(result.totalLeads).toBe(100);
      expect(result.qualifiedLeads).toBe(40);
      expect(result.convertedLeads).toBe(20);
      expect(result.wonOpportunities).toBe(10);
      expect(result.leadToQualifiedRate).toBe(40);
      expect(result.qualifiedToConvertedRate).toBe(50);
      expect(result.convertedToWonRate).toBe(50);
      expect(result.overallLeadToWonRate).toBe(10);
    });

    it('returns zero rates safely when there are no leads', async () => {
      (prisma.lead.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.getFunnelSummary(TENANT);
      expect(result.totalLeads).toBe(0);
      expect(result.leadToQualifiedRate).toBe(0);
      expect(result.overallLeadToWonRate).toBe(0);
      expect(result.averageCycleDays).toBeNull();
    });

    it('computes average cycle time from lead creation to opportunity close', async () => {
      (prisma.lead.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      const createdAt = new Date('2026-01-01T00:00:00Z');
      const closedAt = new Date('2026-01-11T00:00:00Z'); // +10 days
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { createdAt, opportunities: [{ stage: 'CLOSED_WON', actualCloseDate: closedAt }] },
      ]);

      const result = await service.getFunnelSummary(TENANT);
      expect(result.averageCycleDays).toBe(10);
    });
  });

  describe('getFunnelBySource', () => {
    it('groups conversion funnel counts by lead source', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: 'CONVERTED', convertedOpportunityId: 'o1', source: { id: 's1', name: 'Webinar' }, opportunities: [{ stage: 'CLOSED_WON' }] },
        { status: 'QUALIFIED', convertedOpportunityId: null, source: { id: 's1', name: 'Webinar' }, opportunities: [] },
        { status: 'NEW', convertedOpportunityId: null, source: null, opportunities: [] },
      ]);

      const result = await service.getFunnelBySource(TENANT);
      const webinar = result.find((r) => r.groupLabel === 'Webinar');
      const unknown = result.find((r) => r.groupLabel === 'Unknown / No Source');

      expect(webinar?.totalLeads).toBe(2);
      expect(webinar?.wonOpportunities).toBe(1);
      expect(unknown?.totalLeads).toBe(1);
    });
  });

  describe('getFunnelByCampaign', () => {
    it('groups conversion funnel counts by campaign, defaulting to No Campaign', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { status: 'NEW', convertedOpportunityId: null, campaign: null, opportunities: [] },
      ]);
      const result = await service.getFunnelByCampaign(TENANT);
      expect(result[0].groupLabel).toBe('No Campaign');
    });
  });

  describe('getFunnelByRep', () => {
    it('resolves rep names and sorts by conversion rate descending', async () => {
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { assignedToId: 'u1', status: 'CONVERTED', convertedOpportunityId: 'o1', opportunities: [{ stage: 'CLOSED_WON' }] },
        { assignedToId: 'u2', status: 'NEW', convertedOpportunityId: null, opportunities: [] },
      ]);
      (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'u1', firstName: 'Ana', lastName: 'Lee' },
        { id: 'u2', firstName: 'Bo', lastName: 'Kim' },
      ]);

      const result = await service.getFunnelByRep(TENANT);
      expect(result[0].groupLabel).toBe('Ana Lee');
      expect(result[0].overallLeadToWonRate).toBeGreaterThan(result[1].overallLeadToWonRate);
    });
  });

  describe('getConversionTrend', () => {
    it('returns one bucket per trailing week', async () => {
      (prisma.lead.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);
      (prisma.opportunity.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const result = await service.getConversionTrend(TENANT, 4);
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('weekStart');
      expect(result[0].leadsCreated).toBe(5);
      expect(result[0].opportunitiesWon).toBe(2);
    });
  });
});
