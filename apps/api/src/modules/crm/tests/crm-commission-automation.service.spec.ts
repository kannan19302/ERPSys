import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmCommissionAutomationService } from '../crm-commission-automation.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    commissionPlan: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    commissionPlanTier: { create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
    commissionSpiff: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    quota: { findMany: vi.fn() },
    opportunity: { findMany: vi.fn(), count: vi.fn() },
    commissionPayout: { upsert: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    commissionPayoutSpiffLine: { deleteMany: vi.fn(), createMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const emit = vi.fn();
const mockEmitter = { emit } as unknown as import('@nestjs/event-emitter').EventEmitter2;

describe('CrmCommissionAutomationService', () => {
  let service: CrmCommissionAutomationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCommissionAutomationService(mockEmitter);
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org1' });
  });

  it('rejects a tier where maxAttainmentPct <= minAttainmentPct', async () => {
    (prisma.commissionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'plan1' });
    await expect(
      service.addTier(TENANT, 'plan1', { minAttainmentPct: 50, maxAttainmentPct: 40, commissionRate: 5, sortOrder: 0 }),
    ).rejects.toThrow('maxAttainmentPct must be greater');
  });

  it('calculates a tiered payout with the correct accelerator band and no SPIFFs', async () => {
    (prisma.commissionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'plan1',
      tiers: [
        { minAttainmentPct: 0, maxAttainmentPct: 70, commissionRate: 5, sortOrder: 0 },
        { minAttainmentPct: 70, maxAttainmentPct: 100, commissionRate: 8, sortOrder: 1 },
        { minAttainmentPct: 100, maxAttainmentPct: null, commissionRate: 12, sortOrder: 2 },
      ],
      spiffs: [],
    });
    (prisma.quota.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: 'user-a', amount: 100000, period: '2026-Q3' },
    ]);
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'opp1', amount: 120000, name: 'Big Deal', customerId: 'cust1' },
    ]);
    (prisma.commissionPayout.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'payout1', totalPayout: 14400 });
    (prisma.commissionPayoutSpiffLine.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const results = await service.calculatePayouts(TENANT, 'org-system-default', { planId: 'plan1', period: '2026-Q3' });

    expect(results).toHaveLength(1);
    // attainment = 120000/100000 = 120% -> top tier (100%+, rate 12%) -> 120000 * 0.12 = 14400
    expect(prisma.commissionPayout.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ tenantId: TENANT, userId: 'user-a', period: '2026-Q3' }),
    }));
    const createArg = (prisma.commissionPayout.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].create;
    expect(Number(createArg.tieredCommission)).toBeCloseTo(14400, 0);
    expect(emit).toHaveBeenCalledWith('crm.commission.payout_calculated', expect.objectContaining({ userId: 'user-a', planId: 'plan1' }));
  });

  it('applies a NEW_LOGO spiff bonus for a customer with no prior wins', async () => {
    (prisma.commissionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'plan1',
      tiers: [{ minAttainmentPct: 0, maxAttainmentPct: null, commissionRate: 10, sortOrder: 0 }],
      spiffs: [{ id: 'spiff1', criteriaType: 'NEW_LOGO', criteriaValue: {}, bonusType: 'FLAT', bonusAmount: 500, startDate: null, endDate: null }],
    });
    (prisma.quota.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ userId: 'user-a', amount: 50000, period: '2026-Q3' }]);
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'opp1', amount: 50000, name: 'New Co Deal', customerId: 'cust-new' }]);
    (prisma.opportunity.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.commissionPayout.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'payout1' });
    (prisma.commissionPayoutSpiffLine.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.commissionPayoutSpiffLine.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await service.calculatePayouts(TENANT, 'org-system-default', { planId: 'plan1', period: '2026-Q3' });

    const createArg = (prisma.commissionPayout.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].create;
    expect(Number(createArg.spiffBonus)).toBe(500);
    expect(prisma.commissionPayoutSpiffLine.createMany).toHaveBeenCalled();
  });

  it('throws when no Quota rows exist for the period', async () => {
    (prisma.commissionPlan.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'plan1', tiers: [{ minAttainmentPct: 0, maxAttainmentPct: null, commissionRate: 10 }], spiffs: [],
    });
    (prisma.quota.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await expect(service.calculatePayouts(TENANT, 'org-system-default', { planId: 'plan1', period: '2026-Q3' }))
      .rejects.toThrow('No Quota rows found');
  });

  it('approvePayout rejects a payout that is not DRAFT', async () => {
    (prisma.commissionPayout.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1', status: 'APPROVED' });
    await expect(service.approvePayout(TENANT, 'p1', 'user-approver')).rejects.toThrow('Only DRAFT payouts');
  });

  it('markPaid rejects a payout that is not APPROVED', async () => {
    (prisma.commissionPayout.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    await expect(service.markPaid(TENANT, 'p1')).rejects.toThrow('Only APPROVED payouts');
  });
});
