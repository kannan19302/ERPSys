// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    reportingExportJob: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { ReportingExportsDeepService } from "../reporting-exports-deep.service";

describe("ReportingExportsDeepService", () => {
  let service: ReportingExportsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingExportsDeepService],
    }).compile();

    service = module.get<ReportingExportsDeepService>(
      ReportingExportsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("requestExport", () => {
    it("should request instant report export", async () => {
      const mockResult = {
        id: "exp-1",
        reportType: "AUDIT_LOG",
        exportFormat: "PDF",
      };
      (prisma.reportingExportJob.create as any).mockResolvedValue(mockResult);

      const res = await service.requestExport("t1", "u1", {
        reportType: "AUDIT_LOG",
        exportFormat: "PDF",
      });
      expect(res.reportType).toBe("AUDIT_LOG");
    });
  });
});
