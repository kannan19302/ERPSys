import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrLearningPathDeep: { findMany: vi.fn(), create: vi.fn() },
    advancedHrLearningEnrollment: { create: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { AdvancedHrLearningPathsDeepService } from "../advanced-hr-learning-paths-deep.service";

describe("AdvancedHrLearningPathsDeepService", () => {
  let service: AdvancedHrLearningPathsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrLearningPathsDeepService],
    }).compile();
    service = module.get<AdvancedHrLearningPathsDeepService>(
      AdvancedHrLearningPathsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should create a learning path", async () => {
    (prisma.advancedHrLearningPathDeep.create as any).mockResolvedValue({
      id: "lp-1",
      pathName: "Python ML Engineer Track",
    });
    const res = await service.createPath("t1", {
      pathName: "Python ML Engineer Track",
      category: "TECHNICAL",
      estimatedHours: 40,
    });
    expect(res.pathName).toBe("Python ML Engineer Track");
  });
});
