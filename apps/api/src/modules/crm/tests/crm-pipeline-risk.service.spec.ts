import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmPipelineRiskService } from '../crm-pipeline-risk.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: { findMany: vi.fn() },
    activity: { findFirst: vi.fn() },
    pipelineRiskAlert: {
      findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(),
    },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const emit = vi.fn();
const mockEmitter = { emit } as unknown as import('@nestjs/event-emitter').EventEmitter2;

describe('CrmPipelineRiskService', () => {
  let service: CrmPipelineRiskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmPipelineRiskService(mockEmitter);
  });

  it('creates a STAGE_STALL alert for a deal that exceeded its stage threshold', async () => {
    const stageEnteredAt = new Date(Date.now() - 30 * 86_400_000); // 30 days ago, threshold for PROSPECTING is 21
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp1', orgId: 'org1', name: 'Big Deal', stage: 'PROSPECTING', probability: 50, expectedCloseDate: null, stageEnteredAt, createdAt: stageEnteredAt },
    ]);
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1' });
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.pipelineRiskAlert.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.recomputeAlerts(TENANT);

    expect(result.scanned).toBe(1);
    expect(result.created).toBeGreaterThanOrEqual(1);
    expect(prisma.pipelineRiskAlert.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ alertType: 'STAGE_STALL', tenantId: TENANT, opportunityId: 'opp1' }),
    }));
    expect(emit).toHaveBeenCalledWith('pipeline.deal.at_risk', expect.objectContaining({ opportunityId: 'opp1' }));
  });

  it('flags a CLOSE_DATE_SLIPPED alert when expectedCloseDate is in the past', async () => {
    const recent = new Date();
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp2', orgId: 'org1', name: 'Late Deal', stage: 'NEGOTIATION', probability: 80, expectedCloseDate: new Date(Date.now() - 10 * 86_400_000), stageEnteredAt: recent, createdAt: recent },
    ]);
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1' });
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.pipelineRiskAlert.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await service.recomputeAlerts(TENANT);

    expect(prisma.pipelineRiskAlert.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ alertType: 'CLOSE_DATE_SLIPPED' }),
    }));
  });

  it('flags LOW_CONFIDENCE for late-stage deals with low probability', async () => {
    const recent = new Date();
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp3', orgId: 'org1', name: 'Risky Deal', stage: 'PROPOSAL', probability: 10, expectedCloseDate: null, stageEnteredAt: recent, createdAt: recent },
    ]);
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1' });
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.pipelineRiskAlert.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await service.recomputeAlerts(TENANT);

    expect(prisma.pipelineRiskAlert.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ alertType: 'LOW_CONFIDENCE' }),
    }));
  });

  it('flags NO_ACTIVITY when there is no recent activity', async () => {
    const recent = new Date();
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp4', orgId: 'org1', name: 'Quiet Deal', stage: 'QUALIFICATION', probability: 50, expectedCloseDate: null, stageEnteredAt: recent, createdAt: recent },
    ]);
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.pipelineRiskAlert.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await service.recomputeAlerts(TENANT);

    expect(prisma.pipelineRiskAlert.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ alertType: 'NO_ACTIVITY' }),
    }));
  });

  it('auto-resolves alerts whose deal no longer meets any risk condition', async () => {
    const recent = new Date();
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp5', orgId: 'org1', name: 'Healthy Deal', stage: 'QUALIFICATION', probability: 80, expectedCloseDate: null, stageEnteredAt: recent, createdAt: recent },
    ]);
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1' }); // has recent activity -> no NO_ACTIVITY risk
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'alert1', opportunityId: 'opp5', alertType: 'STAGE_STALL' },
    ]);
    (prisma.pipelineRiskAlert.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.recomputeAlerts(TENANT);

    expect(result.resolved).toBe(1);
    expect(prisma.pipelineRiskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'alert1' },
      data: expect.objectContaining({ status: 'RESOLVED' }),
    }));
  });

  it('acknowledgeAlert rejects an already-resolved alert', async () => {
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'a1', status: 'RESOLVED' });
    await expect(service.acknowledgeAlert(TENANT, 'a1', 'user1')).rejects.toThrow('Cannot acknowledge');
  });

  it('acknowledgeAlert throws NotFoundException for a missing alert', async () => {
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(service.acknowledgeAlert(TENANT, 'missing', 'user1')).rejects.toThrow('Alert not found');
  });

  it('snoozeAlert sets status SNOOZED with a future snoozedUntil', async () => {
    (prisma.pipelineRiskAlert.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'a1', status: 'OPEN' });
    (prisma.pipelineRiskAlert.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await service.snoozeAlert(TENANT, 'a1', { days: 7 });
    expect(prisma.pipelineRiskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'a1' },
      data: expect.objectContaining({ status: 'SNOOZED' }),
    }));
  });

  it('getSummary aggregates open alerts by risk level and type', async () => {
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { riskLevel: 'HIGH', alertType: 'STAGE_STALL' },
      { riskLevel: 'HIGH', alertType: 'NO_ACTIVITY' },
      { riskLevel: 'MEDIUM', alertType: 'STAGE_STALL' },
    ]);
    const summary = await service.getSummary(TENANT);
    expect(summary.totalOpen).toBe(3);
    expect(summary.byRiskLevel.HIGH).toBe(2);
    expect(summary.byType.STAGE_STALL).toBe(2);
  });
});
