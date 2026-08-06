import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    advancedHrOrgChartNodeDeep: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { AdvancedHrOrgChartDeepService } from "../advanced-hr-org-chart-deep.service";

describe("AdvancedHrOrgChartDeepService", () => {
  let service: AdvancedHrOrgChartDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedHrOrgChartDeepService],
    }).compile();
    service = module.get<AdvancedHrOrgChartDeepService>(
      AdvancedHrOrgChartDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => expect(service).toBeDefined());

  it("should upsert an org chart node", async () => {
    (prisma.advancedHrOrgChartNodeDeep.create as any).mockResolvedValue({
      id: "node-1",
      jobTitle: "CTO",
    });
    const res = await service.upsertNode("t1", {
      employeeId: "e1",
      jobTitle: "CTO",
      department: "Engineering",
      reportingLevel: 1,
    });
    expect(res.jobTitle).toBe("CTO");
  });

  it("should compute department headcounts", async () => {
    (prisma.advancedHrOrgChartNodeDeep.findMany as any).mockResolvedValue([
      { department: "Engineering", headcount: 45 },
      { department: "Engineering", headcount: 20 },
      { department: "Sales", headcount: 30 },
    ]);
    const res = await service.getDepartmentHeadcounts("t1");
    const eng = res.find((d) => d.department === "Engineering");
    expect(eng?.totalHeadcount).toBe(65);
  });
});
