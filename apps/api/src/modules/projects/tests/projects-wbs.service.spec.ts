import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectsWbsService } from "../services/projects-wbs.service";

vi.mock("@unerp/database", () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    milestone: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

describe("ProjectsWbsService", () => {
  let service: ProjectsWbsService;

  beforeEach(() => {
    service = new ProjectsWbsService();
    vi.clearAllMocks();
  });

  describe("getWbsTree", () => {
    it("should return WBS tree with tasks and milestones", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
        name: "Test",
      } as never);
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        { id: "t-1", name: "Task 1", status: "DONE", timesheets: [] } as never,
        {
          id: "t-2",
          name: "Task 2",
          status: "IN_PROGRESS",
          description: "desc",
          priority: "HIGH",
          assignedToId: "u-1",
          timesheets: [{ hours: 5 }],
        } as never,
      ]);
      vi.mocked(prisma.milestone.findMany).mockResolvedValue([
        {
          id: "m-1",
          name: "M1",
          isCompleted: true,
          dueDate: new Date(),
        } as never,
      ]);

      const result = await service.getWbsTree("tenant-1", "p-1");

      expect(result.projectId).toBe("p-1");
      expect(result.tasks).toHaveLength(2);
      expect(result.milestones).toHaveLength(1);
      expect(result.totalTasks).toBe(2);
      expect(result.completedTasks).toBe(1);
    });

    it("should throw if project not found", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
      await expect(service.getWbsTree("t-1", "bad-id")).rejects.toThrow(
        "Project not found",
      );
    });
  });

  describe("getWbsGanttData", () => {
    it("should return Gantt chart data", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
        name: "Project X",
      } as never);
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        {
          id: "t-1",
          name: "Task 1",
          status: "DONE",
          createdAt: new Date("2026-01-01"),
          dueDate: new Date("2026-01-15"),
          assignedToId: "u-1",
        } as never,
      ]);
      vi.mocked(prisma.milestone.findMany).mockResolvedValue([
        {
          id: "m-1",
          name: "M1",
          isCompleted: true,
          dueDate: new Date("2026-02-01"),
        } as never,
      ]);

      const result = await service.getWbsGanttData("t-1", "p-1");

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].name).toBe("Task 1");
      expect(result.milestones[0].name).toBe("M1");
    });
  });

  describe("createWbsTask", () => {
    it("should create a task", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
      } as never);
      vi.mocked(prisma.task.create).mockResolvedValue({
        id: "t-1",
        name: "New Task",
      } as never);

      const result = await service.createWbsTask("t-1", {
        projectId: "p-1",
        name: "New Task",
      });
      expect(result).toBeDefined();
    });
  });

  describe("updateWbsTask", () => {
    it("should update a task", async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        id: "t-1",
        tenantId: "t-1",
      } as never);
      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "t-1",
        name: "Updated",
      } as never);

      const result = await service.updateWbsTask("t-1", "t-1", {
        name: "Updated",
      });
      expect(result).toBeDefined();
    });
  });

  describe("deleteWbsTask", () => {
    it("should delete a task", async () => {
      vi.mocked(prisma.task.findFirst).mockResolvedValue({
        id: "t-1",
        tenantId: "t-1",
      } as never);
      vi.mocked(prisma.task.delete).mockResolvedValue({ id: "t-1" } as never);

      const result = await service.deleteWbsTask("t-1", "t-1");
      expect(result).toBeDefined();
    });
  });

  describe("getWbsDashboard", () => {
    it("should return dashboard summary", async () => {
      vi.mocked(prisma.project.findFirst).mockResolvedValue({
        id: "p-1",
        name: "P1",
      } as never);
      vi.mocked(prisma.task.findMany).mockResolvedValue([
        { id: "t-1", status: "DONE" } as never,
        { id: "t-2", status: "IN_PROGRESS" } as never,
        { id: "t-3", status: "BACKLOG" } as never,
        { id: "t-4", status: "DONE" } as never,
      ]);
      vi.mocked(prisma.milestone.findMany).mockResolvedValue([
        { id: "m-1", isCompleted: true } as never,
        { id: "m-2", isCompleted: false } as never,
      ]);

      const result = await service.getWbsDashboard("t-1", "p-1");

      expect(result.taskSummary.total).toBe(4);
      expect(result.taskSummary.done).toBe(2);
      expect(result.taskSummary.completionRate).toBe(50);
      expect(result.milestoneSummary.completed).toBe(1);
    });
  });
});
