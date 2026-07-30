// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SaasOnboardingFlowDeepService } from "../saas-onboarding-flow-deep.service";

describe("SaasOnboardingFlowDeepService", () => {
  let service: SaasOnboardingFlowDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasOnboardingFlowDeepService],
    }).compile();

    service = module.get<SaasOnboardingFlowDeepService>(
      SaasOnboardingFlowDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getOnboardingChecklist", () => {
    it("should return tenant onboarding steps", async () => {
      const res = await service.getOnboardingChecklist("t1");
      expect(res.steps.length).toBeGreaterThan(0);
      expect(res.overallProgressPct).toBeGreaterThan(0);
    });
  });
});
