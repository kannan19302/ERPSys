import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    reportingTemplateDeep: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    reportingTemplateSection: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { ReportingTemplatesDeepService } from "../reporting-templates-deep.service";

describe("ReportingTemplatesDeepService", () => {
  let service: ReportingTemplatesDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingTemplatesDeepService],
    }).compile();

    service = module.get<ReportingTemplatesDeepService>(
      ReportingTemplatesDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTemplate", () => {
    it("should create report template", async () => {
      const mockResult = { id: "tmpl-1", title: "Monthly P&L Statement" };
      (prisma.reportingTemplateDeep.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createTemplate("t1", {
        title: "Monthly P&L Statement",
        category: "FINANCIAL",
        layoutHtml: "<div>Report</div>",
      });
      expect(res.title).toBe("Monthly P&L Statement");
    });
  });
});
