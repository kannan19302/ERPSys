import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmGamificationDeepService {
  constructor(@Optional() private eventEmitter?: EventEmitter2) {}

  async getTeamGoals(tenantId = "tenant-1") {
    return db.teamGoal.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTeamGoal(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return db.teamGoal.create({
      data: {
        tenantId,
        orgId,
        name: dto.name ?? "New Goal",
        goalType: dto.goalType ?? "REVENUE",
        targetValue: dto.targetValue ?? 100000,
        period: dto.period ?? "Q3-2026",
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : new Date(),
      },
    });
  }

  async updateTeamGoal(tenantId = "tenant-1", id = "", dto: any = {}) {
    const goal = await db.teamGoal.findFirst({ where: { id, tenantId } });
    if (!goal) throw new NotFoundException("Team goal not found");
    return db.teamGoal.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTeamGoal(tenantId = "tenant-1", id = "") {
    const goal = await db.teamGoal.findFirst({ where: { id, tenantId } });
    if (!goal) throw new NotFoundException("Team goal not found");
    await db.teamGoal.delete({ where: { id } });
    return { status: "deleted" };
  }

  async getTeamGoalProgress(tenantId = "tenant-1", id = "") {
    const goal = await db.teamGoal.findFirst({ where: { id, tenantId } });
    if (!goal) throw new NotFoundException("Team goal not found");

    const target = Number(goal.targetValue || 0);
    const current = Number(goal.currentValue || 0);
    const progressPct = target > 0 ? (current / target) * 100 : 0;
    const remaining = Math.max(0, target - current);

    return {
      goal,
      progressPct,
      remaining,
    };
  }

  async getSalesContests(tenantId = "tenant-1") {
    return db.salesContest.findMany({
      where: { tenantId },
      include: { _count: { select: { entries: true } } },
    });
  }

  async createContest(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return db.salesContest.create({
      data: {
        tenantId,
        orgId,
        createdBy: userId,
        name: dto.name ?? "New Contest",
        contestType: dto.contestType ?? "REVENUE_RACE",
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : new Date(),
        status: "DRAFT",
      },
    });
  }

  async startContest(tenantId = "tenant-1", id = "") {
    const contest = await db.salesContest.findFirst({
      where: { id, tenantId },
    });
    if (!contest) throw new NotFoundException("Sales contest not found");
    if (contest.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT contests can be started");

    return db.salesContest.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  async endContest(tenantId = "tenant-1", id = "") {
    const contest = await db.salesContest.findFirst({
      where: { id, tenantId },
    });
    if (!contest) throw new NotFoundException("Sales contest not found");

    return db.salesContest.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  async getContestLeaderboard(tenantId = "tenant-1", contestId = "") {
    const contest = await db.salesContest.findFirst({
      where: { id: contestId, tenantId },
    });
    if (!contest) throw new NotFoundException("Sales contest not found");

    const entries = await db.salesContestEntry.findMany({
      where: { contestId },
    });
    const users = await db.user.findMany({ where: { tenantId } });

    entries.sort((a: any, b: any) => Number(b.score) - Number(a.score));

    return entries.map((e: any, idx: number) => {
      const u = users.find((user: any) => user.id === e.userId);
      return {
        rank: idx + 1,
        userId: e.userId,
        userName: u
          ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
          : "Unknown User",
        score: Number(e.score),
      };
    });
  }

  async joinContest(tenantId = "tenant-1", contestId = "", userId = "") {
    const contest = await db.salesContest.findFirst({
      where: { id: contestId, tenantId },
    });
    if (!contest) throw new NotFoundException("Sales contest not found");
    if (contest.status !== "ACTIVE")
      throw new BadRequestException("Contest is not active");

    const existing = await db.salesContestEntry.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (existing)
      throw new BadRequestException("User already enrolled in contest");

    return db.salesContestEntry.create({
      data: {
        contestId,
        userId,
        score: 0,
      },
    });
  }

  async updateContestScore(
    tenantId = "tenant-1",
    contestId = "",
    userId = "",
    score = 0,
  ) {
    const entry = await db.salesContestEntry.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (!entry) throw new NotFoundException("Entry not found");

    return db.salesContestEntry.update({
      where: { id: entry.id },
      data: { score },
    });
  }

  async getLeaderboard(
    tenantId = "tenant-1",
    timeframe = "ALL_TIME",
    metric = "revenue",
  ) {
    const opps = await db.opportunity.findMany({ where: { tenantId } });
    const users = await db.user.findMany({ where: { tenantId } });

    const userTotals = new Map<string, number>();
    for (const o of opps) {
      if (o.assignedToId) {
        userTotals.set(
          o.assignedToId,
          (userTotals.get(o.assignedToId) || 0) +
            Number(o.amount?.toString() || 0),
        );
      }
    }

    const standings = Array.from(userTotals.entries()).map(([uId, value]) => {
      const u = users.find((user: any) => user.id === uId);
      return {
        userId: uId,
        userName: u
          ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
          : "Unknown User",
        value,
      };
    });

    standings.sort((a, b) => b.value - a.value);

    return standings.map((s, idx) => ({
      rank: idx + 1,
      ...s,
    }));
  }

  async getUserAchievements(tenantId = "tenant-1", userId = "") {
    const [badges, streaks, snapshots] = await Promise.all([
      db.gamificationBadgeAward.findMany({ where: { userId } }),
      db.salesStreak.findMany({ where: { userId } }),
      db.leaderboardSnapshot.findMany({ where: { tenantId } }),
    ]);

    return {
      badges,
      streaks,
      snapshots,
    };
  }

  async getStreakData(tenantId = "tenant-1", userId = "") {
    const streaks = await db.salesStreak.findMany({ where: { userId } });

    const actStreak = streaks.find((s: any) => s.streakType === "ACTIVITY");
    const dealStreak = streaks.find((s: any) => s.streakType === "DEALS_WON");

    return {
      activity: {
        current: actStreak ? actStreak.currentStreak : 0,
        best: actStreak ? actStreak.bestStreak : 0,
      },
      deals: {
        current: dealStreak ? dealStreak.currentStreak : 0,
        best: dealStreak ? dealStreak.bestStreak : 0,
      },
    };
  }

  async getGamificationDashboard(tenantId = "tenant-1") {
    const [
      activeGoals,
      activeContests,
      totalContestEntries,
      streaks,
      totalBadges,
      awardedBadges,
      snapshots,
    ] = await Promise.all([
      db.teamGoal.count({ where: { tenantId } }),
      db.salesContest.count({ where: { tenantId } }),
      db.salesContestEntry.count({}),
      db.salesStreak.findMany({}),
      db.gamificationBadge.count({}),
      db.gamificationBadgeAward.count({}),
      db.leaderboardSnapshot.findMany({ where: { tenantId } }),
    ]);

    return {
      activeGoals,
      activeContests,
      totalContestEntries,
      streaks,
      totalBadges,
      awardedBadges,
      snapshots,
    };
  }

  async createSalesContest(
    tenantId = "tenant-1",
    orgId = "org-1",
    userId = "user-1",
    dto: any = {},
  ) {
    return this.createContest(tenantId, orgId, userId, dto);
  }

  async getBadges(tenantId = "tenant-1") {
    return [];
  }

  async awardBadge(tenantId = "tenant-1", dto: any = {}) {
    return { status: "awarded" };
  }

  async getPointsHistory(tenantId = "tenant-1", userId = "") {
    return [];
  }
}
