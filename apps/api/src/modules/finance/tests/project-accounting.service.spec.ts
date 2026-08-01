import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectAccountingService } from "../project-accounting.service";

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      project: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
      },
      projectCostEntry: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "@unerp/database";

describe("ProjectAccountingService", () => {
  let service: ProjectAccountingService;

  beforeEach(() => {
    service = new ProjectAccountingService();
    vi.clearAllMocks();
  });

  describe("getProjectBudgets", () => {
    it("should return projects with budget info", async () => {
      (prisma.project.findMany as any).mockResolvedValue([
        {
          id: "proj-1",
          name: "Project Alpha",
          budgetAmount: 100000,
          budgetUsed: 45000,
          status: "ACTIVE",
          tenantId: "tenant-1",
        },
      ]);
      (prisma.project.count as any).mockResolvedValue(1);
      const result = await service.getProjectBudgets("tenant-1");
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("getProjectCosts", () => {
    it("should return paginated cost entries", async () => {
      (prisma.projectCostEntry.findMany as any).mockResolvedValue([
        {
          id: "cost-1",
          projectId: "proj-1",
          description: "Consulting fees",
          amount: 5000,
          type: "LABOR",
          tenantId: "tenant-1",
        },
      ]);
      (prisma.projectCostEntry.count as any).mockResolvedValue(1);
      const result = await service.getProjectCosts("tenant-1", "proj-1");
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("recordProjectCost", () => {
    it("should create a cost entry", async () => {
      (prisma.project.findFirst as any).mockResolvedValue({
        id: "proj-1",
        tenantId: "tenant-1",
      });
      (prisma.projectCostEntry.create as any).mockResolvedValue({
        id: "cost-2",
        projectId: "proj-1",
        type: "MATERIAL",
        amount: 3000,
        tenantId: "tenant-1",
      });
      const result = await service.recordProjectCost("tenant-1", {
        projectId: "proj-1",
        type: "MATERIAL",
        amount: 3000,
      });
      expect(result.id).toBe("cost-2");
      expect(result.amount).toBe(3000);
    });
  });

  describe("getProjectProfitability", () => {
    it("should compute profitability", async () => {
      (prisma.project.findFirst as any).mockResolvedValue({
        id: "proj-1",
        name: "Alpha",
        code: "P001",
        tenantId: "tenant-1",
      });
      (prisma.projectCostEntry.findMany as any).mockResolvedValue([
        { amount: 20000, type: "LABOR" },
        { amount: 10000, type: "MATERIAL" },
      ]);
      (prisma.invoice.findMany as any).mockResolvedValue([
        { totalAmount: 50000, paidAmount: 30000, status: "PAID" },
      ]);
      const result = await service.getProjectProfitability(
        "tenant-1",
        "proj-1",
      );
      expect(result.projectName).toBe("Alpha");
      expect(result.totalCost).toBe(30000);
      expect(result.totalRevenue).toBe(50000);
      expect(result.margin).toBe(40.0);
    });
  });
});
