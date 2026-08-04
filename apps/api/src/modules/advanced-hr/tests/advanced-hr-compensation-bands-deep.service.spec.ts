import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrCompensationBandDeep: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { AdvancedHrCompensationBandsDeepService } from "../advanced-hr-compensation-bands-deep.service";

describe("AdvancedHrCompensationBandsDeepService", () => {
  let service: AdvancedHrCompensationBandsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrCompensationBandsDeepService],
    }).compile();
    service = module.get<AdvancedHrCompensationBandsDeepService>(
      AdvancedHrCompensationBandsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should create compensation band", async () => {
    (prisma.advancedHrCompensationBandDeep.create as any).mockResolvedValue({
      id: "cb-1",
      bandName: "IC4 — Senior Engineer",
    });
    const res = await service.createBand("t1", {
      bandName: "IC4 — Senior Engineer",
      jobLevel: "IC4",
      minSalary: 120000,
      midSalary: 145000,
      maxSalary: 170000,
      effectiveDate: "2026-01-01",
    });
    expect(res.bandName).toBe("IC4 — Senior Engineer");
  });
});
