// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    reportingComplianceAudit: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    reportingSignoffHistory: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { ReportingComplianceSignoffDeepService } from "../reporting-compliance-signoff-deep.service";

describe("ReportingComplianceSignoffDeepService", () => {
  let service: ReportingComplianceSignoffDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingComplianceSignoffDeepService],
    }).compile();

    service = module.get<ReportingComplianceSignoffDeepService>(
      ReportingComplianceSignoffDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("initiateAudit", () => {
    it("should create compliance audit entry", async () => {
      const mockResult = {
        id: "audit-1",
        reportName: "SOX Financial Report",
        complianceType: "SOX",
      };
      (prisma.reportingComplianceAudit.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.initiateAudit("t1", {
        reportName: "SOX Financial Report",
        complianceType: "SOX",
      });
      expect(res.reportName).toBe("SOX Financial Report");
    });
  });
});
