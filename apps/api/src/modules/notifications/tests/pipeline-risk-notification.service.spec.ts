import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PipelineRiskNotificationService } from '../pipeline-risk-notification.service';

/**
 * Closes MODULE_REGISTRY.md Up Next item 39: `pipeline.deal.at_risk` was
 * emitted (crm/crm-pipeline-risk.service.ts) with zero listeners. This
 * verifies the new real consumer notifies the assigned rep first, falls back
 * to CRM-permissioned tenant users on unassigned deals, and stays tenant-scoped.
 */

vi.mock('@unerp/database', () => ({
  prisma: {
    opportunity: { findFirst: vi.fn() },
    user: { findFirst: vi.fn() },
    role: { findMany: vi.fn() },
    userRole: { findMany: vi.fn() },
  },
}));

describe('PipelineRiskNotificationService — pipeline.deal.at_risk consumer', () => {
  let service: PipelineRiskNotificationService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = { emit: vi.fn() } as unknown as EventEmitter2;
    service = new PipelineRiskNotificationService(emitter);
  });

  it('notifies the assigned rep directly when the opportunity has one', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValue({
      id: 'opp-1',
      name: 'Acme Renewal',
      assignedToId: 'rep-1',
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'rep-1' } as never);

    await service.handleDealAtRisk({
      tenantId: 't1',
      opportunityId: 'opp-1',
      alertType: 'STAGE_STALL',
      riskLevel: 'HIGH',
      message: '"Acme Renewal" has been in PROPOSAL for 20 days.',
    });

    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(emitter.emit).toHaveBeenCalledTimes(1);
    expect(emitter.emit).toHaveBeenCalledWith(
      'notification.send',
      expect.objectContaining({
        tenantId: 't1',
        userId: 'rep-1',
        type: 'CRM_PIPELINE_DEAL_AT_RISK',
        title: expect.stringContaining('Acme Renewal'),
        channel: 'IN_APP',
      }),
    );
  });

  it('falls back to CRM-permissioned users when the deal is unassigned', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValue({
      id: 'opp-2',
      name: 'Beta Deal',
      assignedToId: null,
    } as never);
    vi.mocked(prisma.role.findMany).mockResolvedValue([
      { id: 'role-crm', permissions: ['crm.opportunity.update'] },
      { id: 'role-hr', permissions: ['hr.employee.read'] },
    ] as never);
    vi.mocked(prisma.userRole.findMany).mockResolvedValue([
      { userId: 'manager-1' },
      { userId: 'manager-2' },
    ] as never);

    await service.handleDealAtRisk({
      tenantId: 't1',
      opportunityId: 'opp-2',
      alertType: 'NO_ACTIVITY',
      riskLevel: 'MEDIUM',
      message: '"Beta Deal" has had no logged activity in 14+ days.',
    });

    expect(prisma.userRole.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ roleId: { in: ['role-crm'] } }) }),
    );
    expect(emitter.emit).toHaveBeenCalledTimes(2);
  });

  it('falls back to CRM-permissioned users when the assigned rep is no longer active', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValue({
      id: 'opp-3',
      name: 'Gamma Deal',
      assignedToId: 'former-rep',
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.role.findMany).mockResolvedValue([
      { id: 'role-crm', permissions: ['*'] },
    ] as never);
    vi.mocked(prisma.userRole.findMany).mockResolvedValue([{ userId: 'admin-1' }] as never);

    await service.handleDealAtRisk({
      tenantId: 't1',
      opportunityId: 'opp-3',
      alertType: 'CLOSE_DATE_SLIPPED',
      riskLevel: 'CRITICAL',
      message: '"Gamma Deal" expected close date slipped 40 days ago.',
    });

    expect(emitter.emit).toHaveBeenCalledWith(
      'notification.send',
      expect.objectContaining({ userId: 'admin-1' }),
    );
  });

  it('is a no-op when the opportunity cannot be found in the tenant (tenant isolation)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValue(null as never);

    await service.handleDealAtRisk({
      tenantId: 't2',
      opportunityId: 'opp-does-not-exist',
      alertType: 'STAGE_STALL',
      riskLevel: 'HIGH',
      message: 'irrelevant',
    });

    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.role.findMany).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('ignores events missing tenantId or opportunityId', async () => {
    const { prisma } = await import('@unerp/database');
    await service.handleDealAtRisk({
      tenantId: '',
      opportunityId: '',
      alertType: 'STAGE_STALL',
      riskLevel: 'HIGH',
      message: 'irrelevant',
    });
    expect(prisma.opportunity.findFirst).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('does nothing when there are no fallback recipients either', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.opportunity.findFirst).mockResolvedValue({
      id: 'opp-4',
      name: 'Delta Deal',
      assignedToId: null,
    } as never);
    vi.mocked(prisma.role.findMany).mockResolvedValue([
      { id: 'role-hr', permissions: ['hr.employee.read'] },
    ] as never);

    await service.handleDealAtRisk({
      tenantId: 't1',
      opportunityId: 'opp-4',
      alertType: 'NO_ACTIVITY',
      riskLevel: 'MEDIUM',
      message: 'irrelevant',
    });

    expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});
