import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmGamificationService } from '../crm-gamification.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    opportunity: { findMany: vi.fn() },
    activity: { findMany: vi.fn(), groupBy: vi.fn() },
    user: { findMany: vi.fn() },
    leaderboardSnapshot: { deleteMany: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    salesStreak: { upsert: vi.fn(), findMany: vi.fn() },
    gamificationBadge: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    gamificationBadgeAward: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const emit = vi.fn();
const mockEmitter = { emit } as unknown as import('@nestjs/event-emitter').EventEmitter2;

describe('CrmGamificationService', () => {
  let service: CrmGamificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmGamificationService(mockEmitter);
    (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org1' });
  });

  it('computes and persists a leaderboard snapshot ranked by points', async () => {
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { assignedToId: 'user-a', amount: 50000 },
      { assignedToId: 'user-b', amount: 10000 },
    ]);
    (prisma.activity.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { assignedToId: 'user-a', _count: { id: 5 } },
    ]);
    (prisma.leaderboardSnapshot.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: 'user-a', rank: 1, points: 160, dealsWon: 1, revenue: 50000, activityCount: 5 },
      { userId: 'user-b', rank: 2, points: 100, dealsWon: 1, revenue: 10000, activityCount: 0 },
    ]);
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'user-a', firstName: 'Ann', lastName: 'A' },
      { id: 'user-b', firstName: 'Bob', lastName: 'B' },
    ]);

    const result = await service.computeLeaderboard(TENANT, 'org-system-default', '2026-07');

    expect(prisma.leaderboardSnapshot.deleteMany).toHaveBeenCalledWith({ where: { tenantId: TENANT, period: '2026-07' } });
    expect(prisma.leaderboardSnapshot.createMany).toHaveBeenCalled();
    expect(result[0].userId).toBe('user-a');
    expect(result[0].userName).toBe('Ann A');
    expect(emit).toHaveBeenCalledWith('crm.gamification.leaderboard_computed', expect.objectContaining({ tenantId: TENANT, period: '2026-07' }));
  });

  it('creates a badge definition', async () => {
    (prisma.gamificationBadge.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'badge1', name: 'Deal Closer' });
    const result = await service.createBadge(TENANT, 'org-system-default', {
      name: 'Deal Closer', icon: 'award', criteriaType: 'DEALS_WON_COUNT', criteriaValue: 5, periodScope: 'ALL_TIME',
    });
    expect(prisma.gamificationBadge.create).toHaveBeenCalled();
    expect(result.id).toBe('badge1');
  });

  it('awards a badge when a rep meets DEALS_WON_COUNT criteria and skips if already awarded', async () => {
    (prisma.gamificationBadge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'badge1', criteriaType: 'DEALS_WON_COUNT', criteriaValue: 2, name: 'Closer' },
    ]);
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { assignedToId: 'user-a', amount: 10000 },
      { assignedToId: 'user-a', amount: 20000 },
    ]);
    (prisma.salesStreak.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.gamificationBadgeAward.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.gamificationBadgeAward.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.evaluateBadges(TENANT, 'org-system-default');

    expect(result.awarded).toBe(1);
    expect(prisma.gamificationBadgeAward.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: TENANT, badgeId: 'badge1', userId: 'user-a' }),
    }));
    expect(emit).toHaveBeenCalledWith('crm.gamification.badge_awarded', expect.objectContaining({ userId: 'user-a', badgeId: 'badge1' }));
  });

  it('does not re-award an already-awarded badge', async () => {
    (prisma.gamificationBadge.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'badge1', criteriaType: 'DEALS_WON_COUNT', criteriaValue: 1, name: 'Closer' },
    ]);
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ assignedToId: 'user-a', amount: 5000 }]);
    (prisma.salesStreak.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.gamificationBadgeAward.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing-award' });

    const result = await service.evaluateBadges(TENANT, 'org-system-default');

    expect(result.awarded).toBe(0);
    expect(prisma.gamificationBadgeAward.create).not.toHaveBeenCalled();
  });

  it('computes streaks from consecutive activity days', async () => {
    const today = new Date();
    const yesterday = new Date(Date.now() - 86_400_000);
    (prisma.activity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { assignedToId: 'user-a', createdAt: today },
      { assignedToId: 'user-a', createdAt: yesterday },
    ]);
    (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.salesStreak.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.computeStreaks(TENANT, 'org-system-default');

    expect(result.usersProcessed).toBe(1);
    expect(prisma.salesStreak.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId_userId_streakType: { tenantId: TENANT, userId: 'user-a', streakType: 'ACTIVITY' } },
      update: expect.objectContaining({ currentStreak: 2 }),
    }));
  });

  it('throws BadRequestException from getMySummary when no data exists yet', async () => {
    (prisma.leaderboardSnapshot.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.gamificationBadgeAward.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.salesStreak.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await expect(service.getMySummary(TENANT, 'user-x')).rejects.toThrow('No gamification data yet');
  });
});
