import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrExitInterviewDeep: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { AdvancedHrExitInterviewDeepService } from "../advanced-hr-exit-interview-deep.service";

describe("AdvancedHrExitInterviewDeepService", () => {
  let service: AdvancedHrExitInterviewDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrExitInterviewDeepService],
    }).compile();
    service = module.get<AdvancedHrExitInterviewDeepService>(
      AdvancedHrExitInterviewDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should record an exit interview", async () => {
    (prisma.advancedHrExitInterviewDeep.create as any).mockResolvedValue({
      id: "ei-1",
      exitReason: "BETTER_OFFER",
    });
    const res = await service.recordInterview("t1", {
      employeeId: "e1",
      exitDate: "2026-07-01",
      exitReason: "BETTER_OFFER",
      satisfactionScore: 6,
      wouldRehire: true,
    });
    expect(res.exitReason).toBe("BETTER_OFFER");
  });

  it("should compute attrition insights with rehire rate", async () => {
    (prisma.advancedHrExitInterviewDeep.findMany as any).mockResolvedValue([
      { exitReason: "BETTER_OFFER", satisfactionScore: 6, wouldRehire: true },
      { exitReason: "RELOCATION", satisfactionScore: 8, wouldRehire: true },
      { exitReason: "BETTER_OFFER", satisfactionScore: 4, wouldRehire: false },
    ]);
    const res = await service.getAttritionInsights("t1");
    expect(res.totalExits).toBe(3);
    expect(res.rehireRate).toBe(67);
    expect(res.topReasons["BETTER_OFFER"]).toBe(2);
  });
});
