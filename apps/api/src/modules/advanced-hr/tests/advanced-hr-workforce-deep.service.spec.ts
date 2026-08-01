import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    hrHeadcountPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    hrHeadcountPlanLine: { findMany: vi.fn() },
    hrSuccessionPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    hrSuccessionCandidate: { findMany: vi.fn(), create: vi.fn() },
    skillGapAnalysis: { findMany: vi.fn() },
    careerPath: { findMany: vi.fn() },
    mentoringProgram: { findMany: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { AdvancedHrWorkforceDeepService } from "../services/advanced-hr-workforce-deep.service";

describe("AdvancedHrWorkforceDeepService", () => {
  let service: AdvancedHrWorkforceDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrWorkforceDeepService],
    }).compile();
    service = module.get<AdvancedHrWorkforceDeepService>(
      AdvancedHrWorkforceDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  describe("listHeadcountPlans", () => {
    it("should list headcount plans without filters", async () => {
      (prisma.hrHeadcountPlan.findMany as any).mockResolvedValue([
        { id: "hcp-1", name: "Plan A" },
      ]);
      const res = await service.listHeadcountPlans("t1");
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("Plan A");
    });

    it("should filter by fiscalYear and status", async () => {
      (prisma.hrHeadcountPlan.findMany as any).mockResolvedValue([
        { id: "hcp-2", fiscalYear: 2026, status: "APPROVED" },
      ]);
      const res = await service.listHeadcountPlans("t1", "2026", "APPROVED");
      expect(prisma.hrHeadcountPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "t1",
            fiscalYear: 2026,
            status: "APPROVED",
          }),
        }),
      );
      expect(res).toHaveLength(1);
    });
  });

  describe("getHeadcountPlan", () => {
    it("should return plan when found", async () => {
      const mockPlan = { id: "hcp-1", name: "Plan A", lines: [] };
      (prisma.hrHeadcountPlan.findFirst as any).mockResolvedValue(mockPlan);
      const res = await service.getHeadcountPlan("t1", "hcp-1");
      expect(res.name).toBe("Plan A");
    });

    it("should throw NotFoundException when not found", async () => {
      (prisma.hrHeadcountPlan.findFirst as any).mockResolvedValue(null);
      await expect(
        service.getHeadcountPlan("t1", "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createHeadcountPlan", () => {
    it("should create a headcount plan", async () => {
      const dto = { name: "New Plan", fiscalYear: 2026, description: "Test" };
      (prisma.hrHeadcountPlan.create as any).mockResolvedValue({
        id: "hcp-new",
        ...dto,
        status: "DRAFT",
      });
      const res = await service.createHeadcountPlan("t1", dto, "u1");
      expect(res.status).toBe("DRAFT");
      expect(res.name).toBe("New Plan");
    });
  });
});
