import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveOrgId } from './crm-shared';

export const createBadgeSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  icon: z.string().max(60).default('award'),
  criteriaType: z.enum(['DEALS_WON_COUNT', 'REVENUE_TOTAL', 'ACTIVITY_STREAK', 'FIRST_DEAL', 'DEAL_SIZE_ABOVE']),
  criteriaValue: z.number().min(0).default(0),
  periodScope: z.enum(['ALL_TIME', 'MONTHLY', 'QUARTERLY']).default('ALL_TIME'),
});
export type CreateBadgeInput = z.infer<typeof createBadgeSchema>;

export const updateBadgeSchema = createBadgeSchema.partial().extend({ isActive: z.boolean().optional() });
export type UpdateBadgeInput = z.infer<typeof updateBadgeSchema>;

const CLOSED_WON = ['CLOSED_WON', 'CLOSED WON'];

/** Resolves a leaderboard "period" string into a closed date range, or null for ALL_TIME. */
function periodToRange(period: string): { start: Date; end: Date } | null {
  if (period === 'ALL_TIME') return null;
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]) - 1;
    return { start: new Date(Date.UTC(year, month, 1)), end: new Date(Date.UTC(year, month + 1, 1)) };
  }
  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/i);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const q = Number(quarterMatch[2]);
    const startMonth = (q - 1) * 3;
    return { start: new Date(Date.UTC(year, startMonth, 1)), end: new Date(Date.UTC(year, startMonth + 3, 1)) };
  }
  const yearMatch = period.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  return null;
}

/**
 * CRM Sales Gamification & Real-Time Leaderboards (Up Next item 44).
 *
 * Deepens the pre-existing point-in-time `CrmEnablementService.getLeaderboard`
 * (still used for the quick "current standings" widget) with: persisted
 * per-period leaderboard snapshots (history), badge definitions + awards
 * (SalesScreen/Ambition-style recognition), and per-rep activity streaks.
 */
@Injectable()
export class CrmGamificationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ── LEADERBOARD ────────────────────────────────

  /** Compute and persist a leaderboard snapshot for the given period. */
  async computeLeaderboard(tenantId: string, orgId: string, period = 'ALL_TIME') {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const range = periodToRange(period);
    const whereOpp: Prisma.OpportunityWhereInput = {
      tenantId,
      deletedAt: null,
      stage: { in: CLOSED_WON },
      assignedToId: { not: null },
      ...(range ? { actualCloseDate: { gte: range.start, lt: range.end } } : {}),
    };
    const wonOpps = await prisma.opportunity.findMany({
      where: whereOpp,
      select: { assignedToId: true, amount: true },
    });

    const whereActivity: Prisma.ActivityWhereInput = {
      tenantId,
      ...(range ? { createdAt: { gte: range.start, lt: range.end } } : {}),
    };
    const activities = await prisma.activity.groupBy({
      by: ['assignedToId'],
      where: whereActivity,
      _count: { id: true },
    });

    const statsByUser = new Map<string, { dealsWon: number; revenue: number; activityCount: number }>();
    for (const opp of wonOpps) {
      const uid = opp.assignedToId!;
      const s = statsByUser.get(uid) ?? { dealsWon: 0, revenue: 0, activityCount: 0 };
      s.dealsWon += 1;
      s.revenue += Number(opp.amount || 0);
      statsByUser.set(uid, s);
    }
    for (const a of activities) {
      if (!a.assignedToId) continue;
      const s = statsByUser.get(a.assignedToId) ?? { dealsWon: 0, revenue: 0, activityCount: 0 };
      s.activityCount += a._count.id;
      statsByUser.set(a.assignedToId, s);
    }

    // Points formula: deals won weighted highest, then revenue (scaled), then activity volume.
    const ranked = Array.from(statsByUser.entries())
      .map(([userId, s]) => ({
        userId,
        ...s,
        points: Math.round(s.dealsWon * 100 + s.revenue / 1000 + s.activityCount * 2),
      }))
      .sort((a, b) => b.points - a.points);

    await prisma.leaderboardSnapshot.deleteMany({ where: { tenantId, period } });
    if (ranked.length > 0) {
      await prisma.leaderboardSnapshot.createMany({
        data: ranked.map((r, idx) => ({
          tenantId, orgId: resolvedOrgId, period, userId: r.userId, rank: idx + 1,
          points: r.points, dealsWon: r.dealsWon, revenue: new Prisma.Decimal(r.revenue),
          activityCount: r.activityCount,
        })),
      });
    }

    this.eventEmitter.emit('crm.gamification.leaderboard_computed', { tenantId, period, rankedCount: ranked.length });
    return this.getLeaderboard(tenantId, period);
  }

  async getLeaderboard(tenantId: string, period = 'ALL_TIME') {
    const rows = await prisma.leaderboardSnapshot.findMany({
      where: { tenantId, period },
      orderBy: { rank: 'asc' },
    });
    const userIds = rows.map((r) => r.userId);
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return rows.map((r) => ({ ...r, userName: userMap.get(r.userId) ?? 'Unknown' }));
  }

  async listAvailablePeriods(tenantId: string) {
    const rows = await prisma.leaderboardSnapshot.findMany({
      where: { tenantId },
      select: { period: true },
      distinct: ['period'],
      orderBy: { period: 'desc' },
    });
    return rows.map((r) => r.period);
  }

  // ── STREAKS ────────────────────────────────────

  /** Recompute activity + deals-won streaks for every rep with recent history. */
  async computeStreaks(tenantId: string, orgId: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const since = new Date(Date.now() - 90 * 86_400_000);

    const activities = await prisma.activity.findMany({
      where: { tenantId, assignedToId: { not: null }, createdAt: { gte: since } },
      select: { assignedToId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const wonDeals = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { in: CLOSED_WON }, assignedToId: { not: null }, actualCloseDate: { gte: since } },
      select: { assignedToId: true, actualCloseDate: true },
      orderBy: { actualCloseDate: 'desc' },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const activityDaysByUser = new Map<string, Set<string>>();
    for (const a of activities) {
      if (!a.assignedToId) continue;
      if (!activityDaysByUser.has(a.assignedToId)) activityDaysByUser.set(a.assignedToId, new Set());
      activityDaysByUser.get(a.assignedToId)!.add(dayKey(a.createdAt));
    }
    const dealDaysByUser = new Map<string, Set<string>>();
    for (const d of wonDeals) {
      if (!d.assignedToId || !d.actualCloseDate) continue;
      if (!dealDaysByUser.has(d.assignedToId)) dealDaysByUser.set(d.assignedToId, new Set());
      dealDaysByUser.get(d.assignedToId)!.add(dayKey(d.actualCloseDate));
    }

    const computeStreakFromDays = (days: Set<string>): { current: number; best: number; lastDate: Date | null } => {
      if (days.size === 0) return { current: 0, best: 0, lastDate: null };
      const sorted = Array.from(days).sort();
      let best = 1;
      let run = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] as string);
        const cur = new Date(sorted[i] as string);
        const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
        run = diffDays === 1 ? run + 1 : 1;
        if (run > best) best = run;
      }
      // Current streak: consecutive days ending today or yesterday.
      const lastDay = sorted[sorted.length - 1] as string;
      const todayKey = dayKey(new Date());
      const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000));
      let current = 0;
      if (lastDay === todayKey || lastDay === yesterdayKey) {
        current = 1;
        for (let i = sorted.length - 1; i > 0; i--) {
          const prev = new Date(sorted[i - 1] as string);
          const cur = new Date(sorted[i] as string);
          const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
          if (diffDays === 1) current++; else break;
        }
      }
      return { current, best, lastDate: new Date(lastDay) };
    };

    let updated = 0;
    const allUsers = new Set([...activityDaysByUser.keys(), ...dealDaysByUser.keys()]);
    for (const userId of allUsers) {
      const activityStreak = computeStreakFromDays(activityDaysByUser.get(userId) ?? new Set());
      const dealsStreak = computeStreakFromDays(dealDaysByUser.get(userId) ?? new Set());

      await prisma.salesStreak.upsert({
        where: { tenantId_userId_streakType: { tenantId, userId, streakType: 'ACTIVITY' } },
        create: {
          tenantId, orgId: resolvedOrgId, userId, streakType: 'ACTIVITY',
          currentStreak: activityStreak.current, bestStreak: activityStreak.best, lastCountedDate: activityStreak.lastDate,
        },
        update: {
          currentStreak: activityStreak.current,
          bestStreak: Math.max(activityStreak.best, activityStreak.current),
          lastCountedDate: activityStreak.lastDate,
        },
      });
      await prisma.salesStreak.upsert({
        where: { tenantId_userId_streakType: { tenantId, userId, streakType: 'DEALS_WON' } },
        create: {
          tenantId, orgId: resolvedOrgId, userId, streakType: 'DEALS_WON',
          currentStreak: dealsStreak.current, bestStreak: dealsStreak.best, lastCountedDate: dealsStreak.lastDate,
        },
        update: {
          currentStreak: dealsStreak.current,
          bestStreak: Math.max(dealsStreak.best, dealsStreak.current),
          lastCountedDate: dealsStreak.lastDate,
        },
      });
      updated++;
    }
    return { usersProcessed: updated };
  }

  async listStreaks(tenantId: string) {
    const rows = await prisma.salesStreak.findMany({ where: { tenantId }, orderBy: { currentStreak: 'desc' } });
    const userIds = Array.from(new Set(rows.map((r) => r.userId)));
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return rows.map((r) => ({ ...r, userName: userMap.get(r.userId) ?? 'Unknown' }));
  }

  // ── BADGES ─────────────────────────────────────

  async listBadges(tenantId: string) {
    return prisma.gamificationBadge.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { awards: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBadge(tenantId: string, orgId: string, dto: CreateBadgeInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.gamificationBadge.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description,
        icon: dto.icon, criteriaType: dto.criteriaType,
        criteriaValue: new Prisma.Decimal(dto.criteriaValue), periodScope: dto.periodScope,
      },
    });
  }

  async updateBadge(tenantId: string, id: string, dto: UpdateBadgeInput) {
    const existing = await prisma.gamificationBadge.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Badge not found');
    return prisma.gamificationBadge.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.criteriaType !== undefined && { criteriaType: dto.criteriaType }),
        ...(dto.criteriaValue !== undefined && { criteriaValue: new Prisma.Decimal(dto.criteriaValue) }),
        ...(dto.periodScope !== undefined && { periodScope: dto.periodScope }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteBadge(tenantId: string, id: string) {
    const existing = await prisma.gamificationBadge.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Badge not found');
    return prisma.gamificationBadge.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Scan won deals/activity per rep against every active badge and award new ones. */
  async evaluateBadges(tenantId: string, orgId: string) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const badges = await prisma.gamificationBadge.findMany({ where: { tenantId, isActive: true, deletedAt: null } });
    if (badges.length === 0) return { evaluated: 0, awarded: 0 };

    const wonOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { in: CLOSED_WON }, assignedToId: { not: null } },
      select: { assignedToId: true, amount: true },
    });
    const dealsByUser = new Map<string, { count: number; revenue: number; maxDeal: number }>();
    for (const o of wonOpps) {
      const uid = o.assignedToId!;
      const s = dealsByUser.get(uid) ?? { count: 0, revenue: 0, maxDeal: 0 };
      s.count += 1;
      s.revenue += Number(o.amount || 0);
      s.maxDeal = Math.max(s.maxDeal, Number(o.amount || 0));
      dealsByUser.set(uid, s);
    }
    const streaks = await prisma.salesStreak.findMany({ where: { tenantId, streakType: 'ACTIVITY' } });
    const streakByUser = new Map(streaks.map((s) => [s.userId, s.bestStreak]));

    let awarded = 0;
    for (const [userId, stats] of dealsByUser.entries()) {
      for (const badge of badges) {
        const threshold = Number(badge.criteriaValue);
        let earned = false;
        if (badge.criteriaType === 'DEALS_WON_COUNT') earned = stats.count >= threshold;
        else if (badge.criteriaType === 'REVENUE_TOTAL') earned = stats.revenue >= threshold;
        else if (badge.criteriaType === 'FIRST_DEAL') earned = stats.count >= 1;
        else if (badge.criteriaType === 'DEAL_SIZE_ABOVE') earned = stats.maxDeal >= threshold;
        else if (badge.criteriaType === 'ACTIVITY_STREAK') earned = (streakByUser.get(userId) ?? 0) >= threshold;
        if (!earned) continue;

        const existing = await prisma.gamificationBadgeAward.findUnique({
          where: { tenantId_badgeId_userId: { tenantId, badgeId: badge.id, userId } },
        });
        if (existing) continue;
        await prisma.gamificationBadgeAward.create({
          data: {
            tenantId, orgId: resolvedOrgId, badgeId: badge.id, userId,
            context: { dealsWon: stats.count, revenue: stats.revenue, maxDeal: stats.maxDeal },
          },
        });
        awarded++;
        this.eventEmitter.emit('crm.gamification.badge_awarded', { tenantId, badgeId: badge.id, userId, badgeName: badge.name });
      }
    }
    return { evaluated: dealsByUser.size, awarded };
  }

  async listBadgeAwards(tenantId: string, userId?: string) {
    return prisma.gamificationBadgeAward.findMany({
      where: { tenantId, ...(userId ? { userId } : {}) },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  /** Combined per-rep gamification summary: rank, badges, streaks. */
  async getMySummary(tenantId: string, userId: string, period = 'ALL_TIME') {
    const snapshot = await prisma.leaderboardSnapshot.findUnique({
      where: { tenantId_period_userId: { tenantId, period, userId } },
    });
    const badgeAwards = await prisma.gamificationBadgeAward.findMany({
      where: { tenantId, userId }, include: { badge: true }, orderBy: { awardedAt: 'desc' },
    });
    const streaks = await prisma.salesStreak.findMany({ where: { tenantId, userId } });
    if (!snapshot && badgeAwards.length === 0 && streaks.length === 0) {
      throw new BadRequestException('No gamification data yet for this user — run recompute first');
    }
    return { rank: snapshot?.rank ?? null, points: snapshot?.points ?? 0, badges: badgeAwards, streaks };
  }
}
