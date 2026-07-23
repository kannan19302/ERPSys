import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CrmGuidedSellingService } from '../crm-guided-selling.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    crmNextBestActionConfig: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    crmActionSuggestion: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    crmGuidedSellingPlaybook: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    crmDealReadinessScore: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), aggregate: vi.fn() },
    opportunity: { findFirst: vi.fn(), findFirstOrThrow: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmGuidedSellingService', () => {
  let service: CrmGuidedSellingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmGuidedSellingService();
  });

  describe('action configs', () => {
    it('listActionConfigs returns configs', async () => {
      vi.mocked(prisma.crmNextBestActionConfig.findMany).mockResolvedValue([{ id: 'c1' }] as any);
      const r = await service.listActionConfigs(TENANT, 'OPPORTUNITY');
      expect(r).toHaveLength(1);
    });

    it('getActionConfig throws if missing', async () => {
      vi.mocked(prisma.crmNextBestActionConfig.findFirst).mockResolvedValue(null);
      await expect(service.getActionConfig(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('toggleActionConfig flips isActive', async () => {
      vi.mocked(prisma.crmNextBestActionConfig.findFirst).mockResolvedValue({ id: 'c1', isActive: false } as any);
      vi.mocked(prisma.crmNextBestActionConfig.update).mockResolvedValue({} as any);
      await service.toggleActionConfig(TENANT, 'c1');
      expect(prisma.crmNextBestActionConfig.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: true } }));
    });
  });

  describe('suggestions', () => {
    it('generateSuggestions creates suggestions from configs', async () => {
      vi.mocked(prisma.crmNextBestActionConfig.findMany).mockResolvedValue([
        { id: 'c1', actionType: 'CALL', actionLabel: 'Call prospect', priority: 5, name: 'Call Config' } as any,
      ]);
      vi.mocked(prisma.crmActionSuggestion.create).mockResolvedValue({ id: 's1' } as any);
      const r = await service.generateSuggestions(TENANT, 'opp1', 'OPPORTUNITY');
      expect(r).toHaveLength(1);
    });

    it('generateSuggestions creates default if no configs', async () => {
      vi.mocked(prisma.crmNextBestActionConfig.findMany).mockResolvedValue([]);
      vi.mocked(prisma.crmActionSuggestion.create).mockResolvedValue({ id: 's1' } as any);
      const r = await service.generateSuggestions(TENANT, 'opp1', 'OPPORTUNITY');
      expect(r).toHaveLength(1);
      expect(vi.mocked(prisma.crmActionSuggestion.create).mock.calls[0][0].data.actionType).toBe('FOLLOW_UP');
    });

    it('acceptSuggestion throws if not SUGGESTED', async () => {
      vi.mocked(prisma.crmActionSuggestion.findFirst).mockResolvedValue({ id: 's1', status: 'ACCEPTED' } as any);
      await expect(service.acceptSuggestion(TENANT, 's1')).rejects.toThrow(BadRequestException);
    });

    it('dismissSuggestion throws if not SUGGESTED', async () => {
      vi.mocked(prisma.crmActionSuggestion.findFirst).mockResolvedValue({ id: 's1', status: 'DISMISSED' } as any);
      await expect(service.dismissSuggestion(TENANT, 's1')).rejects.toThrow(BadRequestException);
    });

    it('completeSuggestion throws if not ACCEPTED', async () => {
      vi.mocked(prisma.crmActionSuggestion.findFirst).mockResolvedValue({ id: 's1', status: 'SUGGESTED' } as any);
      await expect(service.completeSuggestion(TENANT, 's1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('playbooks', () => {
    it('createPlaybook creates with dto', async () => {
      const dto = { name: 'Test Playbook', objectType: 'OPPORTUNITY' as const };
      vi.mocked(prisma.crmGuidedSellingPlaybook.create).mockResolvedValue({ id: 'p1' } as any);
      const r = await service.createPlaybook(TENANT, dto);
      expect(r.id).toBe('p1');
    });

    it('updatePlaybook increments version', async () => {
      vi.mocked(prisma.crmGuidedSellingPlaybook.findFirst).mockResolvedValue({ id: 'p1', version: 1 } as any);
      vi.mocked(prisma.crmGuidedSellingPlaybook.update).mockResolvedValue({} as any);
      await service.updatePlaybook(TENANT, 'p1', { name: 'Updated' });
      expect(prisma.crmGuidedSellingPlaybook.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: { increment: 1 } }) }));
    });
  });

  describe('deal readiness', () => {
    it('scoreDealReadiness throws if opp missing', async () => {
      vi.mocked(prisma.opportunity.findFirst).mockResolvedValue(null);
      await expect(service.scoreDealReadiness(TENANT, 'bad')).rejects.toThrow(NotFoundException);
    });

    it('scoreDealReadiness computes score', async () => {
      vi.mocked(prisma.opportunity.findFirst).mockResolvedValue({ id: 'opp1', expectedRevenue: 50000, expectedCloseDate: new Date() } as any);
      vi.mocked(prisma.crmDealReadinessScore.create).mockResolvedValue({ id: 'ds1', score: 60 } as any);
      const r = await service.scoreDealReadiness(TENANT, 'opp1');
      expect(r.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analytics', () => {
    it('getSuggestionAnalytics returns computed data', async () => {
      vi.mocked(prisma.crmActionSuggestion.count).mockResolvedValueOnce(100).mockResolvedValueOnce(30).mockResolvedValueOnce(20).mockResolvedValueOnce(40).mockResolvedValueOnce(10);
      vi.mocked(prisma.crmActionSuggestion.groupBy).mockResolvedValue([]);
      const a = await service.getSuggestionAnalytics(TENANT);
      expect(a.total).toBe(100);
      expect(a.acceptanceRate).toBe(30);
    });
  });
});
