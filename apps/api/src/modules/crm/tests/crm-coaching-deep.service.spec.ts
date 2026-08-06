import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrmCoachingDeepService } from "../crm-coaching-deep.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    organization: { findFirst: vi.fn() },
    coachingProgram: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    callScorecard: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

const TENANT = "tenant-1";

describe("CrmCoachingDeepService", () => {
  let service: CrmCoachingDeepService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCoachingDeepService();
    (
      prisma.organization.findFirst as ReturnType<typeof vi.fn>
    ).mockResolvedValue({ id: "org1" });
  });

  describe("Programs", () => {
    it("lists coaching programs", async () => {
      (
        prisma.coachingProgram.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([{ id: "p1", name: "Onboarding" }]);
      const result = await service.getCoachingPrograms(TENANT);
      expect(result).toHaveLength(1);
    });

    it("creates a program", async () => {
      (
        prisma.coachingProgram.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "p1", name: "Sales Onboarding" });
      const result = await service.createProgram(TENANT, "org1", "user-mgr", {
        name: "Sales Onboarding",
        programType: "ONBOARDING",
      });
      expect(prisma.coachingProgram.create).toHaveBeenCalled();
      expect(result.id).toBe("p1");
    });

    it("creates a program with modules", async () => {
      (
        prisma.coachingProgram.create as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "p1", name: "Sales Onboarding" });
      const result = await service.createProgram(TENANT, "org1", "user-mgr", {
        name: "Sales Onboarding",
        programType: "ONBOARDING",
        modules: [
          {
            name: "Intro to CRM",
            content: "Learn CRM basics",
            durationMinutes: 30,
          },
        ],
      });
      expect(result.id).toBe("p1");
    });

    it("throws on update for non-existent program", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(
        service.updateProgram(TENANT, "bad-id", { name: "x" }),
      ).rejects.toThrow("Coaching program not found");
    });

    it("updates a program", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "p1", tenantId: TENANT });
      (
        prisma.coachingProgram.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "p1", name: "Updated" });
      const result = await service.updateProgram(TENANT, "p1", {
        name: "Updated",
      });
      expect(result.name).toBe("Updated");
    });

    it("deletes a program", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ id: "p1", tenantId: TENANT });
      (
        prisma.coachingProgram.delete as ReturnType<typeof vi.fn>
      ).mockResolvedValue({});
      const result = await service.deleteProgram(TENANT, "p1");
      expect(result.status).toBe("deleted");
    });
  });

  describe("Enrollment & Progress", () => {
    it("enrolls a user in a program", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        assigneeIds: [],
      });
      (
        prisma.coachingProgram.update as ReturnType<typeof vi.fn>
      ).mockResolvedValue({});
      const result = await service.enrollUserInProgram(TENANT, "p1", "u1");
      expect(result.status).toBe("enrolled");
    });

    it("rejects duplicate enrollment", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        assigneeIds: ["u1"],
      });
      await expect(
        service.enrollUserInProgram(TENANT, "p1", "u1"),
      ).rejects.toThrow("already enrolled");
    });

    it("returns program progress for enrolled user", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        assigneeIds: ["u1"],
        modules: [{ name: "Module 1" }, { name: "Module 2" }],
      });
      const result = await service.getProgramProgress(TENANT, "p1", "u1");
      expect(result.enrolled).toBe(true);
      expect(result.totalCount).toBe(2);
    });

    it("returns zero progress for unenrolled user", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        assigneeIds: ["u2"],
        modules: [{ name: "Module 1" }],
      });
      const result = await service.getProgramProgress(TENANT, "p1", "u1");
      expect(result.enrolled).toBe(false);
    });

    it("completes a program module", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        modules: [{ name: "Module 1" }],
      });
      const result = await service.completeProgramModule(
        TENANT,
        "p1",
        "u1",
        "Module 1",
      );
      expect(result.status).toBe("completed");
    });

    it("rejects completing a non-existent module", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        tenantId: TENANT,
        modules: [{ name: "Module 1" }],
      });
      await expect(
        service.completeProgramModule(TENANT, "p1", "u1", "Module X"),
      ).rejects.toThrow("not found in this program");
    });
  });

  describe("Recommendations", () => {
    it("returns recommendations based on weak areas", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          totalScore: 3,
          maxScore: 10,
          objectionHandlingScore: 20,
          talkRatio: 80,
          nextStepsSet: false,
        },
        {
          totalScore: 4,
          maxScore: 10,
          objectionHandlingScore: 30,
          talkRatio: 75,
          nextStepsSet: false,
        },
      ]);
      (
        prisma.coachingProgram.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          id: "p1",
          name: "Fundamentals",
          programType: "ONBOARDING",
          status: "ACTIVE",
        },
      ]);
      const result = await service.getCoachingRecommendations(TENANT, "u1");
      expect(result.weakAreas.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("returns generic recommendations when no scorecards exist", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      (
        prisma.coachingProgram.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getCoachingRecommendations(TENANT, "u1");
      expect(result.weakAreas).toHaveLength(0);
    });
  });

  describe("Team Dashboard", () => {
    it("returns team coaching dashboard", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          totalScore: 8,
          maxScore: 10,
          talkRatio: 40,
          objectionHandlingScore: 70,
          createdAt: new Date(),
          activity: { assignedToId: "u1" },
        },
        {
          totalScore: 6,
          maxScore: 10,
          talkRatio: 60,
          objectionHandlingScore: 50,
          createdAt: new Date(),
          activity: { assignedToId: "u2" },
        },
      ]);
      (
        prisma.coachingProgram.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getTeamCoachingDashboard(TENANT, "mgr1");
      expect(result.teamSize).toBe(2);
      expect(result.totalScorecards).toBe(2);
    });
  });

  describe("Effectiveness", () => {
    it("calculates coaching effectiveness", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          totalScore: 5,
          maxScore: 10,
          createdAt: new Date("2026-01-01"),
          activity: { assignedToId: "u1" },
        },
        {
          totalScore: 9,
          maxScore: 10,
          createdAt: new Date("2026-06-01"),
          activity: { assignedToId: "u1" },
        },
      ]);
      const result = await service.getCoachingEffectiveness(TENANT);
      expect(result.totalRepsAnalyzed).toBe(1);
    });

    it("returns empty when no scorecards", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getCoachingEffectiveness(TENANT);
      expect(result.totalRepsAnalyzed).toBe(0);
    });
  });

  describe("Program Analytics", () => {
    it("returns program analytics", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        id: "p1",
        name: "Onboarding",
        modules: [{ name: "M1" }],
        assigneeIds: ["u1", "u2"],
        status: "ACTIVE",
        programType: "ONBOARDING",
      });
      const result = await service.getProgramAnalytics(TENANT, "p1");
      expect(result.totalEnrolled).toBe(2);
      expect(result.totalModules).toBe(1);
    });

    it("throws for non-existent program", async () => {
      (
        prisma.coachingProgram.findFirst as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);
      await expect(service.getProgramAnalytics(TENANT, "bad")).rejects.toThrow(
        "Coaching program not found",
      );
    });
  });

  describe("Recommended Actions", () => {
    it("returns HIGH priority actions when no scorecards exist", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([]);
      const result = await service.getRecommendedCoachingActions(TENANT, "u1");
      expect(result.some((a) => a.priority === "HIGH")).toBe(true);
    });

    it("returns actions based on scorecard analysis", async () => {
      (
        prisma.callScorecard.findMany as ReturnType<typeof vi.fn>
      ).mockResolvedValue([
        {
          totalScore: 3,
          maxScore: 10,
          objectionHandlingScore: 20,
          talkRatio: 80,
          nextStepsSet: false,
        },
      ]);
      const result = await service.getRecommendedCoachingActions(TENANT, "u1");
      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(
        result.some((a) => a.action === "intensive_coaching_session"),
      ).toBe(true);
    });
  });
});
