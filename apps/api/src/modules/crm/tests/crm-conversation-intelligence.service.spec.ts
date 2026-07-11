import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmConversationIntelligenceService } from '../crm-conversation-intelligence.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    activity: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';

describe('CrmConversationIntelligenceService', () => {
  let service: CrmConversationIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmConversationIntelligenceService();
  });

  it('logs a call, links it to an opportunity, and attaches a positive-sentiment AI summary', async () => {
    (prisma.activity.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'act1', ...data }));

    const transcript =
      "Thanks for hopping on the call! We're really excited about the proposal and love the pricing. " +
      "I'll send over the signed contract by Friday. Sounds good?";

    const result = await service.logCall(TENANT, ORG, {
      subject: 'Discovery call with Acme',
      opportunityId: 'opp1',
      transcriptText: transcript,
    });

    expect(prisma.activity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: TENANT,
          type: 'CALL',
          opportunityId: 'opp1',
          transcriptText: transcript,
          aiSentiment: 'POSITIVE',
        }),
      }),
    );
    expect(result.aiSentiment).toBe('POSITIVE');
    expect(result.aiSummary).toContain('Positive call');
    expect(typeof result.aiTalkTrackScore).toBe('number');
  });

  it('flags a negative sentiment when the transcript has more negative than positive keywords', async () => {
    (prisma.activity.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'act2', ...data }));

    const transcript =
      'Honestly we are concerned about the price, it seems too expensive and we are hesitant. ' +
      'There is also an issue with the competitor offering a better deal, and the delay is a real problem.';

    const result = await service.logCall(TENANT, ORG, {
      subject: 'Renewal check-in',
      customerId: 'cust1',
      transcriptText: transcript,
    });

    expect(result.aiSentiment).toBe('NEGATIVE');
    expect(result.aiSummary).toContain('At-risk call');
  });

  it('extracts action items from "will"/"follow up"/"I\'ll" phrasing', async () => {
    (prisma.activity.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'act3', ...data }));

    const transcript = "I'll follow up with the legal team next week. We will schedule a demo for the whole team.";

    const result = await service.logCall(TENANT, ORG, {
      subject: 'Follow-up call',
      leadId: 'lead1',
      transcriptText: transcript,
    });

    expect(Array.isArray(result.aiActionItems)).toBe(true);
    expect((result.aiActionItems as string[]).length).toBeGreaterThan(0);
  });

  it('rejects a call not linked to any CRM entity', async () => {
    await expect(
      service.logCall(TENANT, ORG, { subject: 'Orphan call', transcriptText: 'hello world' }),
    ).rejects.toThrow('A call must be linked to at least one of opportunity/lead/customer/contact');
    expect(prisma.activity.create).not.toHaveBeenCalled();
  });

  it('regenerates the summary for an existing call activity', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'act1',
      tenantId: TENANT,
      type: 'CALL',
      transcriptText: 'Great news, we are excited and ready to move forward!',
    });
    (prisma.activity.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'act1', ...data }));

    const result = await service.regenerateSummary(TENANT, 'act1');

    expect(prisma.activity.update).toHaveBeenCalled();
    expect(result.aiSentiment).toBe('POSITIVE');
  });

  it('throws NotFoundException when regenerating a call that does not exist in the tenant', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.regenerateSummary(TENANT, 'missing')).rejects.toThrow('Call activity not found');
  });

  it('throws BadRequestException when regenerating a call with no transcript', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'act1', tenantId: TENANT, type: 'CALL', transcriptText: null,
    });
    await expect(service.regenerateSummary(TENANT, 'act1')).rejects.toThrow('Activity has no transcript to analyze');
  });

  it('computes a tenant-wide insights summary across analyzed calls', async () => {
    (prisma.activity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { aiSentiment: 'POSITIVE', aiTalkTrackScore: 80, aiActionItems: ['a', 'b'] },
      { aiSentiment: 'NEGATIVE', aiTalkTrackScore: 40, aiActionItems: [] },
    ]);

    const summary = await service.getInsightsSummary(TENANT);

    expect(summary.totalCallsAnalyzed).toBe(2);
    expect(summary.bySentiment).toEqual({ POSITIVE: 1, NEGATIVE: 1 });
    expect(summary.averageTalkTrackScore).toBe(60);
    expect(summary.totalActionItemsExtracted).toBe(2);
  });

  it('lists calls filtered by tenant + opportunity', async () => {
    (prisma.activity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'act1' }]);
    await service.listCalls(TENANT, { opportunityId: 'opp1' });
    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT, type: 'CALL', opportunityId: 'opp1' }) }),
    );
  });
});
