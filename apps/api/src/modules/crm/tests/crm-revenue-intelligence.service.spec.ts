import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmRevenueIntelligenceService } from '../crm-revenue-intelligence.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    pipelineRiskAlert: { findMany: vi.fn() },
    dealRiskDigestRun: { create: vi.fn(), findMany: vi.fn() },
    role: { findMany: vi.fn() },
    userRole: { findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';
const emit = vi.fn();
const mockEmitter = { emit } as unknown as import('@nestjs/event-emitter').EventEmitter2;

describe('CrmRevenueIntelligenceService — deal-risk digest', () => {
  let service: CrmRevenueIntelligenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmRevenueIntelligenceService(mockEmitter);
  });

  it('sends a rep digest per assigned rep and a team digest per manager', async () => {
    const now = new Date();
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        riskLevel: 'CRITICAL',
        createdAt: now,
        opportunity: { id: 'opp1', name: 'Acme', amount: { toString: () => '1000' } },
      },
      {
        riskLevel: 'MEDIUM',
        createdAt: new Date(now.getTime() - 100 * 3600_000),
        opportunity: { id: 'opp2', name: 'Beta', amount: { toString: () => '500' } },
      },
    ]);
    // both alerts belong to opportunities owned by different reps — service reads assignedToId
    // from the included opportunity, so patch findMany to include it.
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { riskLevel: 'CRITICAL', createdAt: now, opportunity: { id: 'opp1', name: 'Acme', amount: 1000, assignedToId: 'rep-1' } },
      { riskLevel: 'MEDIUM', createdAt: new Date(now.getTime() - 100 * 3600_000), opportunity: { id: 'opp2', name: 'Beta', amount: 500, assignedToId: 'rep-2' } },
    ]);
    (prisma.dealRiskDigestRun.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'run-1', ...data }));
    (prisma.role.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'role-manager', permissions: ['crm.opportunity.update'] },
    ]);
    (prisma.userRole.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ userId: 'manager-1' }]);

    const result = await service.generateAndSendDigests(TENANT, ORG, 24);

    expect(result.repDigestsSent).toBe(2);
    expect(result.managerDigestsSent).toBe(1);
    expect(result.totalOpenAlerts).toBe(2);
    expect(prisma.dealRiskDigestRun.create).toHaveBeenCalledTimes(3);
    expect(emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({ userId: 'rep-1', type: 'CRM_REVENUE_INTELLIGENCE_REP_DIGEST' }));
    expect(emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({ userId: 'manager-1', type: 'CRM_REVENUE_INTELLIGENCE_TEAM_DIGEST' }));
  });

  it('sends nothing when there are no open alerts', async () => {
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await service.generateAndSendDigests(TENANT, ORG, 24);

    expect(result.repDigestsSent).toBe(0);
    expect(result.managerDigestsSent).toBe(0);
    expect(prisma.dealRiskDigestRun.create).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('ignores alerts on unassigned opportunities for rep digests but still counts them for manager digests', async () => {
    const now = new Date();
    (prisma.pipelineRiskAlert.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { riskLevel: 'HIGH', createdAt: now, opportunity: { id: 'opp3', name: 'Gamma', amount: 200, assignedToId: null } },
    ]);
    (prisma.dealRiskDigestRun.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'run-2', ...data }));
    (prisma.role.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await service.generateAndSendDigests(TENANT, ORG, 24);

    expect(result.repDigestsSent).toBe(0);
    expect(result.managerDigestsSent).toBe(0);
    expect(result.totalOpenAlerts).toBe(1);
  });

  it('lists digest runs scoped to a tenant and optionally one recipient', async () => {
    (prisma.dealRiskDigestRun.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'run-1' }]);

    await service.listDigestRuns(TENANT, 'rep-1');

    expect(prisma.dealRiskDigestRun.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: TENANT, recipientUserId: 'rep-1' } }),
    );
  });
});
