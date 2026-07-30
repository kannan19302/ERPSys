// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    reportingScheduledJobDeep: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    reportingExecutionLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { ReportingScheduledJobsDeepService } from "../reporting-scheduled-jobs-deep.service";

describe("ReportingScheduledJobsDeepService", () => {
  let service: ReportingScheduledJobsDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingScheduledJobsDeepService],
    }).compile();

    service = module.get<ReportingScheduledJobsDeepService>(
      ReportingScheduledJobsDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createJob", () => {
    it("should create scheduled report execution job", async () => {
      const mockResult = { id: "job-1", jobName: "Weekly Financial Summary" };
      (prisma.reportingScheduledJobDeep.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createJob("t1", {
        jobName: "Weekly Financial Summary",
        templateId: "tmpl-1",
        cronSchedule: "0 8 * * 1",
      });
      expect(res.jobName).toBe("Weekly Financial Summary");
    });
  });
});
