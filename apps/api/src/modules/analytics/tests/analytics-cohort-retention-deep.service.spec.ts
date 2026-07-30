// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    analyticsCohortAnalysis: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    analyticsCohortGroup: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { AnalyticsCohortRetentionDeepService } from "../analytics-cohort-retention-deep.service";

describe("AnalyticsCohortRetentionDeepService", () => {
  let service: AnalyticsCohortRetentionDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsCohortRetentionDeepService],
    }).compile();

    service = module.get<AnalyticsCohortRetentionDeepService>(
      AnalyticsCohortRetentionDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createCohortAnalysis", () => {
    it("should create cohort retention analysis record", async () => {
      const mockResult = { id: "ca-1", cohortName: "Q1 Signup Cohort" };
      (prisma.analyticsCohortAnalysis.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createCohortAnalysis("t1", {
        cohortName: "Q1 Signup Cohort",
        groupingRule: "SIGNUP_MONTH",
      });
      expect(res.cohortName).toBe("Q1 Signup Cohort");
    });
  });
});
