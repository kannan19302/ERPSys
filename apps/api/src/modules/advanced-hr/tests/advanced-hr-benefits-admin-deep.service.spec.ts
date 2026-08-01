import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrBenefitsPlanDeep: { findMany: vi.fn(), create: vi.fn() },
    advancedHrBenefitsEnrollment: { create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { AdvancedHrBenefitsAdminDeepService } from "../advanced-hr-benefits-admin-deep.service";

describe("AdvancedHrBenefitsAdminDeepService", () => {
  let service: AdvancedHrBenefitsAdminDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrBenefitsAdminDeepService],
    }).compile();
    service = module.get<AdvancedHrBenefitsAdminDeepService>(
      AdvancedHrBenefitsAdminDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should create a benefits plan", async () => {
    (prisma.advancedHrBenefitsPlanDeep.create as any).mockResolvedValue({
      id: "bp-1",
      planName: "Platinum Family Health Plan",
    });
    const res = await service.createPlan("t1", {
      planName: "Platinum Family Health Plan",
      planType: "HEALTH",
      providerName: "Aetna",
      employeeCost: 180,
      employerCost: 820,
    });
    expect(res.planName).toBe("Platinum Family Health Plan");
  });
});
