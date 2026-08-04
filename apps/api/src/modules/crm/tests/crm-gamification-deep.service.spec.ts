import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmGamificationDeepService } from "../crm-gamification-deep.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    teamGoal: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    salesContest: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    salesContestEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    opportunity: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    gamificationBadgeAward: { findMany: vi.fn(), count: vi.fn() },
    gamificationBadge: { count: vi.fn() },
    salesStreak: { findMany: vi.fn() },
    leaderboardSnapshot: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";
const emit = vi.fn();
const mockEmitter = {
  emit,
} as unknown as import("@nestjs/event-emitter").EventEmitter2;

describe("CrmGamificationDeepService", () => {
  let service: CrmGamificationDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmGamificationDeepService(mockEmitter);
    (
      prisma.organization.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "org1" });
  });

  describe("Team Goals", () => {
    it("lists team goals", async () => {
      (prisma.teamGoal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "g1", name: "Q3 Revenue" },
      ]);
      const result = await service.getTeamGoals(TENANT);
      expect(result).toHaveLength(1);
      expect(prisma.teamGoal.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT },
        orderBy: { createdAt: "desc" },
      });
    });

    it("creates a team goal", async () => {
      (prisma.teamGoal.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "g1",
        name: "Q3 Revenue",
      });
      const result = await service.createTeamGoal(
        TENANT,
        "org-system-default",
        {
          name: "Q3 Revenue",
          goalType: "REVENUE",
          targetValue: 500000,
          period: "Q3-2026",
          startDate: "2026-07-01T00:00:00Z",
          endDate: "2026-09-30T00:00:00Z",
        },
      );
      expect(prisma.teamGoal.create).toHaveBeenCalled();
      expect(result.id).toBe("g1");
    });

    it("throws on update for non-existent goal", async () => {
      (prisma.teamGoal.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        null,
      );
      await expect(
        service.updateTeamGoal(TENANT, "bad-id", { name: "x" }),
      ).rejects.toThrow("Team goal not found");
    });

    it("deletes a team goal", async () => {
      (prisma.teamGoal.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        { id: "g1", tenantId: TENANT },
      );
      (prisma.teamGoal.delete as ReturnType<typeof vi.fn>).mockResolvedValue(
        {},
      );
      const result = await service.deleteTeamGoal(TENANT, "g1");
      expect(result.status).toBe("deleted");
    });

    it("returns goal progress with percentage", async () => {
      (prisma.teamGoal.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        {
          id: "g1",
          tenantId: TENANT,
          name: "Q3",
          targetValue: 1000,
          currentValue: 250,
          goalType: "REVENUE",
          period: "Q3-2026",
          status: "ACTIVE",
        },
      );
      const result = await service.getTeamGoalProgress(TENANT, "g1");
      expect(result.progressPct).toBe(25);
      expect(result.remaining).toBe(750);
    });
  });

  describe("Sales Contests", () => {
    it("lists contests with entry count", async () => {
      (
        prisma.salesContest.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { id: "c1", name: "July Race", _count: { entries: 3 } },
      ]);
      const result = await service.getSalesContests(TENANT);
      expect(result).toHaveLength(1);
    });

    it("creates a contest", async () => {
      (
        prisma.salesContest.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", name: "July Race" });
      const result = await service.createContest(TENANT, "org1", "user-mgr", {
        name: "July Race",
        contestType: "REVENUE_RACE",
        startDate: "2026-07-01T00:00:00Z",
        endDate: "2026-07-31T00:00:00Z",
      });
      expect(prisma.salesContest.create).toHaveBeenCalled();
      expect(result.id).toBe("c1");
    });

    it("starts a contest from DRAFT", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "DRAFT" });
      (
        prisma.salesContest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", status: "ACTIVE" });
      const result = await service.startContest(TENANT, "c1");
      expect(result.status).toBe("ACTIVE");
    });

    it("rejects starting a non-DRAFT contest", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "ACTIVE" });
      await expect(service.startContest(TENANT, "c1")).rejects.toThrow(
        "Only DRAFT contests can be started",
      );
    });

    it("ends an ACTIVE contest", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "ACTIVE" });
      (
        prisma.salesContest.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", status: "COMPLETED" });
      const result = await service.endContest(TENANT, "c1");
      expect(result.status).toBe("COMPLETED");
    });

    it("returns ranked contest leaderboard", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT });
      (
        prisma.salesContestEntry.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { userId: "u1", score: 100 },
        { userId: "u2", score: 50 },
      ]);
      (idpPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "u1", firstName: "Ann", lastName: "A" },
        { id: "u2", firstName: "Bob", lastName: "B" },
      ]);
      const result = await service.getContestLeaderboard(TENANT, "c1");
      expect(result[0].rank).toBe(1);
      expect(result[0].userName).toBe("Ann A");
    });

    it("joins a contest", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "ACTIVE" });
      (
        prisma.salesContestEntry.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      (
        prisma.salesContestEntry.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "e1" });
      const result = await service.joinContest(TENANT, "c1", "u1");
      expect(prisma.salesContestEntry.create).toHaveBeenCalled();
    });

    it("rejects joining a non-active contest", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "DRAFT" });
      await expect(service.joinContest(TENANT, "c1", "u1")).rejects.toThrow(
        "Contest is not active",
      );
    });

    it("rejects duplicate enrollment", async () => {
      (
        prisma.salesContest.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "c1", tenantId: TENANT, status: "ACTIVE" });
      (
        prisma.salesContestEntry.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "e1" });
      await expect(service.joinContest(TENANT, "c1", "u1")).rejects.toThrow(
        "already enrolled",
      );
    });

    it("updates contest score", async () => {
      (
        prisma.salesContestEntry.findUnique as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "e1", userId: "u1" });
      (
        prisma.salesContestEntry.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "e1", score: 200 });
      const result = await service.updateContestScore(TENANT, "c1", "u1", 200);
      expect(result.score.toString()).toBe("200");
    });
  });

  describe("Leaderboard", () => {
    it("computes current standings by metric", async () => {
      (
        prisma.opportunity.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { assignedToId: "u1", amount: 50000 },
        { assignedToId: "u2", amount: 25000 },
      ]);
      (idpPrisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: "u1", firstName: "Ann", lastName: "A" },
        { id: "u2", firstName: "Bob", lastName: "B" },
      ]);
      const result = await service.getLeaderboard(
        TENANT,
        "ALL_TIME",
        "revenue",
      );
      expect(result[0].userId).toBe("u1");
      expect(result[0].rank).toBe(1);
    });
  });

  describe("Achievements & Streaks", () => {
    it("gets user achievements", async () => {
      (
        prisma.gamificationBadgeAward.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "a1", badge: { name: "Closer" } }]);
      (
        prisma.salesStreak.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.leaderboardSnapshot.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getUserAchievements(TENANT, "u1");
      expect(result.badges).toHaveLength(1);
    });

    it("returns streak data", async () => {
      (
        prisma.salesStreak.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        { streakType: "ACTIVITY", currentStreak: 5, bestStreak: 10 },
        { streakType: "DEALS_WON", currentStreak: 3, bestStreak: 7 },
      ]);
      const result = await service.getStreakData(TENANT, "u1");
      expect(result.activity.current).toBe(5);
      expect(result.deals.best).toBe(7);
    });

    it("returns empty streak data when no streaks exist", async () => {
      (
        prisma.salesStreak.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getStreakData(TENANT, "u1");
      expect(result.activity.current).toBe(0);
    });
  });

  describe("Dashboard", () => {
    it("returns gamification dashboard KPIs", async () => {
      (prisma.teamGoal.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      (prisma.salesContest.count as ReturnType<typeof vi.fn>).mockResolvedValue(
        2,
      );
      (
        prisma.salesContestEntry.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(15);
      (
        prisma.salesStreak.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.gamificationBadge.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(5);
      (
        prisma.gamificationBadgeAward.count as ReturnType<typeof vi.fn>
      ).mockResolvedValue(20);
      (
        prisma.leaderboardSnapshot.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);

      const result = await service.getGamificationDashboard(TENANT);
      expect(result.activeGoals).toBe(3);
      expect(result.activeContests).toBe(2);
      expect(result.totalContestEntries).toBe(15);
      expect(result.totalBadges).toBe(5);
      expect(result.awardedBadges).toBe(20);
    });
  });
});
