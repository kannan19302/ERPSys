import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrSuccessionPlan: { findMany: vi.fn(), create: vi.fn() },
    advancedHrSuccessionCandidate: { create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { AdvancedHrSuccessionPlanningDeepService } from "../advanced-hr-succession-planning-deep.service";

describe("AdvancedHrSuccessionPlanningDeepService", () => {
  let service: AdvancedHrSuccessionPlanningDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrSuccessionPlanningDeepService],
    }).compile();
    service = module.get<AdvancedHrSuccessionPlanningDeepService>(
      AdvancedHrSuccessionPlanningDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should create succession plan", async () => {
    (prisma.advancedHrSuccessionPlan.create as any).mockResolvedValue({
      id: "sp-1",
      planName: "CTO Succession 2027",
    });
    const res = await service.createPlan("t1", {
      planName: "CTO Succession 2027",
      targetRoleId: "role-cto",
    });
    expect(res.planName).toBe("CTO Succession 2027");
  });
});
