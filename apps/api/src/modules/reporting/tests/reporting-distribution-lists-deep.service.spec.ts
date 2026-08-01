import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    reportingDistributionList: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    reportingDistributionRecipient: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { ReportingDistributionListsDeepService } from "../reporting-distribution-lists-deep.service";

describe("ReportingDistributionListsDeepService", () => {
  let service: ReportingDistributionListsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingDistributionListsDeepService],
    }).compile();

    service = module.get<ReportingDistributionListsDeepService>(
      ReportingDistributionListsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createList", () => {
    it("should create report distribution list", async () => {
      const mockResult = { id: "dl-1", listName: "Executive Leadership Team" };
      (prisma.reportingDistributionList.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createList("t1", {
        listName: "Executive Leadership Team",
      });
      expect(res.listName).toBe("Executive Leadership Team");
    });
  });
});
