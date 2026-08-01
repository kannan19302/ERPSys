import { describe, it, expect, vi, beforeEach } from "vitest";
import { CloseOpsService } from "../close-ops.service";

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      closeTask: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      closeTaskTemplate: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      financialPeriod: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

import { prisma } from "@unerp/database";

describe("CloseOpsService", () => {
  let service: CloseOpsService;

  beforeEach(() => {
    service = new CloseOpsService();
    vi.clearAllMocks();
  });

  describe("getCloseStatus", () => {
    it("should return close status breakdown", async () => {
      (prisma.closeTask.findMany as any).mockResolvedValue([
        { id: "t1", status: "DONE" },
        { id: "t2", status: "IN_PROGRESS" },
        { id: "t3", status: "OPEN" },
        { id: "t4", status: "SKIPPED" },
      ]);
      const result = await service.getCloseStatus("tenant-1", "fp-1");
      expect(result.total).toBe(4);
      expect(result.done).toBe(1);
      expect(result.inProgress).toBe(1);
      expect(result.progress).toBe(25);
    });
  });

  describe("createCloseTask", () => {
    it("should create a close task", async () => {
      const dto = {
        financialPeriodId: "fp-1",
        name: "Reconcile bank",
        description: "Month-end bank rec",
        createdBy: "user-1",
      };
      (prisma.closeTask.create as any).mockResolvedValue({
        id: "task-1",
        ...dto,
        tenantId: "tenant-1",
        status: "OPEN",
      });
      const result = await service.createCloseTask("tenant-1", dto);
      expect(result.id).toBe("task-1");
      expect(result.status).toBe("OPEN");
    });
  });

  describe("getFinancialPeriods", () => {
    it("should return paginated periods", async () => {
      (prisma.financialPeriod.findMany as any).mockResolvedValue([
        {
          id: "fp-1",
          name: "FY 2026-01",
          status: "OPEN",
          tenantId: "tenant-1",
        },
      ]);
      (prisma.financialPeriod.count as any).mockResolvedValue(1);
      const result = await service.getFinancialPeriods("tenant-1");
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe("closeFinancialPeriod", () => {
    it("should close an open period", async () => {
      (prisma.financialPeriod.findFirst as any).mockResolvedValue({
        id: "fp-1",
        status: "OPEN",
        tenantId: "tenant-1",
      });
      (prisma.financialPeriod.update as any).mockResolvedValue({
        id: "fp-1",
        status: "CLOSED",
      });
      const result = await service.closeFinancialPeriod("tenant-1", "fp-1");
      expect(result.status).toBe("CLOSED");
    });

    it("should throw when period not found", async () => {
      (prisma.financialPeriod.findFirst as any).mockResolvedValue(null);
      await expect(
        service.closeFinancialPeriod("tenant-1", "fp-1"),
      ).rejects.toThrow();
    });
  });
});
