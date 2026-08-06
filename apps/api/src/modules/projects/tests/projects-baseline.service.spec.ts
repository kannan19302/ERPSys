import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsBaselineService } from "../services/projects-baseline.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    project: { findFirst: vi.fn() },
    evmBaseline: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    milestone: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    task: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("ProjectsBaselineService", () => {
  let service: ProjectsBaselineService;

  beforeEach(() => {
    service = new ProjectsBaselineService();
    vi.clearAllMocks();
  });

  describe("getBaselines", () => {
    it("should return baselines for a project", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.evmBaseline.findMany).mockResolvedValue([
        { id: "b-1", baselineType: "ORIGINAL", evmMeasurements: [] } as never,
      ]);

      const result = await service.getBaselines("t-1", "p-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getBaselineById", () => {
    it("should return a baseline by id", async () => {
      vi.mocked(prisma.evmBaseline.findFirst).mockResolvedValue({
        id: "b-1",
        baselineType: "ORIGINAL",
        evmMeasurements: [],
      } as never);

      const result = await service.getBaselineById("t-1", "b-1");
      expect(result.id).toBe("b-1");
    });

    it("should throw if baseline not found", async () => {
      vi.mocked(prisma.evmBaseline.findFirst).mockResolvedValue(null);
      await expect(service.getBaselineById("t-1", "bad")).rejects.toThrow(
        "Baseline not found",
      );
    });
  });

  describe("createBaseline", () => {
    it("should create a baseline", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.evmBaseline.create).mockResolvedValue({
        id: "b-1",
        baselineType: "ORIGINAL",
      } as never);

      const result = await service.createBaseline("t-1", {
        projectId: "p-1",
        name: "BL-1",
      });
      expect(result.id).toBe("b-1");
    });
  });

  describe("getMilestoneVariance", () => {
    it("should calculate milestone variance", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
        name: "P1",
      } as never);
      vi.mocked(prisma.milestone.findMany).mockResolvedValue([
        {
          id: "m-1",
          name: "M1",
          isCompleted: true,
          dueDate: new Date("2026-01-01"),
          completedAt: new Date("2026-01-05"),
        } as never,
        {
          id: "m-2",
          name: "M2",
          isCompleted: false,
          dueDate: new Date("2026-06-01"),
          completedAt: null,
        } as never,
      ]);
      vi.mocked(prisma.evmBaseline.findMany).mockResolvedValue([
        {
          id: "b-1",
          baselineType: "ORIGINAL",
          budgetAtCompletion: 10000,
        } as never,
      ]);

      const result = await service.getMilestoneVariance("t-1", "p-1");
      expect(result.milestones).toHaveLength(2);
      expect(result.summary.total).toBe(2);
    });
  });

  describe("createMilestone", () => {
    it("should create a milestone", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.milestone.create).mockResolvedValue({
        id: "m-1",
        name: "Release",
      } as never);

      const result = await service.createMilestone("t-1", {
        projectId: "p-1",
        name: "Release",
        dueDate: "2026-07-01",
      });
      expect(result.id).toBe("m-1");
    });
  });

  describe("completeMilestone", () => {
    it("should mark milestone completed", async () => {
      vi.mocked(prisma.milestone.findFirst).mockResolvedValue({
        id: "m-1",
        isCompleted: false,
      } as never);
      vi.mocked(prisma.milestone.update).mockResolvedValue({
        id: "m-1",
        isCompleted: true,
      } as never);

      const result = await service.completeMilestone("t-1", "m-1");
      expect(result).toBeDefined();
    });
  });
});
