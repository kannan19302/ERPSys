import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesGamificationDeepService {
  async getLeaderboard(tenantId: string, period?: string, metric?: string) {
    const targetPeriod =
      period ||
      `MONTHLY-${new Date().toISOString().slice(5, 7)}-${new Date().getFullYear()}`;
    const targetMetric = metric || "CLOSED_WON_VALUE";

    const record = await prisma.salesGamificationDeep.findFirst({
      where: { tenantId, period: targetPeriod, metric: targetMetric },
    });

    if (record) return record;

    // Default mock calculation if no record seeded yet
    return {
      tenantId,
      period: targetPeriod,
      metric: targetMetric,
      leaderboards: [
        {
          rank: 1,
          salesRepId: "rep-101",
          name: "Sarah Connor",
          score: 450000,
          deals: 12,
          streak: 5,
        },
        {
          rank: 2,
          salesRepId: "rep-102",
          name: "John Matrix",
          score: 380000,
          deals: 9,
          streak: 3,
        },
        {
          rank: 3,
          salesRepId: "rep-103",
          name: "Ellen Ripley",
          score: 310000,
          deals: 7,
          streak: 4,
        },
      ],
      streakData: { currentTopStreakRep: "rep-101", streakCount: 5 },
      badgeAwards: [
        {
          repId: "rep-101",
          badge: "PRESIDENTS_CLUB",
          awardedAt: new Date().toISOString(),
        },
        {
          repId: "rep-102",
          badge: "DEAL_CLOSER_GOLD",
          awardedAt: new Date().toISOString(),
        },
      ],
    };
  }

  async recordRepActivity(
    tenantId: string,
    dto: { salesRepId: string; metric: string; scoreDelta: number },
  ) {
    const period = `MONTHLY-${new Date().toISOString().slice(5, 7)}-${new Date().getFullYear()}`;

    const existing = await prisma.salesGamificationDeep.findFirst({
      where: { tenantId, period, metric: dto.metric },
    });

    if (existing) {
      const leaderboards: any[] = Array.isArray(existing.leaderboards)
        ? existing.leaderboards
        : [];
      const repIdx = leaderboards.findIndex(
        (r) => r.salesRepId === dto.salesRepId,
      );

      if (repIdx >= 0) {
        leaderboards[repIdx].score += dto.scoreDelta;
      } else {
        leaderboards.push({
          rank: leaderboards.length + 1,
          salesRepId: dto.salesRepId,
          name: `Rep ${dto.salesRepId}`,
          score: dto.scoreDelta,
          deals: 1,
          streak: 1,
        });
      }

      leaderboards.sort((a, b) => b.score - a.score);
      leaderboards.forEach((r, idx) => {
        r.rank = idx + 1;
      });

      return prisma.salesGamificationDeep.update({
        where: { id: existing.id },
        data: { leaderboards },
      });
    }

    return prisma.salesGamificationDeep.create({
      data: {
        tenantId,
        period,
        metric: dto.metric,
        leaderboards: [
          {
            rank: 1,
            salesRepId: dto.salesRepId,
            name: `Rep ${dto.salesRepId}`,
            score: dto.scoreDelta,
            deals: 1,
            streak: 1,
          },
        ],
        streakData: { currentTopStreakRep: dto.salesRepId, streakCount: 1 },
      },
    });
  }

  async getQuotaAttainment(
    tenantId: string,
    salesRepId?: string,
    period?: string,
  ) {
    const where: any = { tenantId };
    if (salesRepId) where.salesRepId = salesRepId;
    if (period) where.period = period;

    return prisma.salesQuotaAttainment.findMany({
      where,
      orderBy: { attainmentPct: "desc" },
    });
  }

  async setQuotaAttainment(tenantId: string, dto: any) {
    const attainmentPct =
      dto.quotaAmount > 0 ? (dto.achievedAmount / dto.quotaAmount) * 100 : 0;

    return prisma.salesQuotaAttainment.upsert({
      where: {
        tenantId_salesRepId_period: {
          tenantId,
          salesRepId: dto.salesRepId,
          period: dto.period,
        },
      },
      create: {
        tenantId,
        salesRepId: dto.salesRepId,
        period: dto.period,
        quotaAmount: dto.quotaAmount,
        achievedAmount: dto.achievedAmount,
        attainmentPct,
        commissionEarned: dto.commissionEarned || 0,
      },
      update: {
        quotaAmount: dto.quotaAmount,
        achievedAmount: dto.achievedAmount,
        attainmentPct,
        commissionEarned: dto.commissionEarned,
      },
    });
  }
}
