import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaasService } from '../saas.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    saaSPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    tenantSubscription: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    usageRecord: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('SaasService', () => {
  let service: SaasService;

  beforeEach(() => {
    service = new SaasService();
    vi.clearAllMocks();
  });

  it('should list all SaaS plans', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.saaSPlan.findMany).mockResolvedValue([
      { id: 'plan-1', name: 'Starter', stripePriceId: 'price_starter', maxUsers: 5, maxStorage: 1024 },
      { id: 'plan-2', name: 'Growth', stripePriceId: 'price_growth', maxUsers: 50, maxStorage: 10240 },
    ] as any);

    const plans = await service.getPlans();
    expect(plans).toHaveLength(2);
    expect(plans[0]?.name).toBe('Starter');
  });

  it('should get active subscription for a tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.tenantSubscription.findFirst).mockResolvedValue({
      id: 'sub-1',
      tenantId: 't1',
      planId: 'plan-2',
      status: 'ACTIVE',
      plan: { name: 'Growth', maxUsers: 50 },
    } as any);

    const sub = await service.getSubscription('t1');
    expect(sub).toBeDefined();
    expect(sub.status).toBe('ACTIVE');
  });

  it('should get usage records for a tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.usageRecord.findMany).mockResolvedValue([
      { id: 'ur-1', tenantId: 't1', metric: 'USERS_COUNT', currentValue: 12, limitValue: 50 },
      { id: 'ur-2', tenantId: 't1', metric: 'STORAGE_MB', currentValue: 2048, limitValue: 10240 },
    ] as any);

    const records = await service.getUsageRecords('t1');
    expect(records).toHaveLength(2);
    expect(records[0]?.metric).toBe('USERS_COUNT');
  });

  it('should create usage record when none exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.usageRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.usageRecord.create).mockImplementation((args: any) =>
      Promise.resolve({ id: 'ur-new', ...args.data }) as any,
    );

    const result = await service.updateUsage('t1', 'API_CALLS_COUNT', 100, 10000);
    expect(result).toBeDefined();
  });
});
