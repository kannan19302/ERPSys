import { describe, it, expect, beforeAll, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    crmSavedReport: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    crmReportSchedule: {
      count: vi.fn().mockResolvedValue(0),
    },
    systemReport: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      upsert: vi.fn().mockResolvedValue({}),
    },
    reportCategory: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      upsert: vi.fn().mockResolvedValue({}),
    },
    reportSchedule: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import {
  CrmReportingDeepService,
  createCrmSavedReportSchema,
  createReportScheduleSchema,
  createDashboardTemplateSchema,
} from "../crm-reporting-deep.service";
import { NotFoundException } from "@nestjs/common";

describe("CrmReportingDeepService", () => {
  let service: CrmReportingDeepService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmReportingDeepService],
    }).compile();
    service = module.get<CrmReportingDeepService>(CrmReportingDeepService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("Schema validation", () => {
    it("should validate createCrmSavedReportSchema", () => {
      const valid = createCrmSavedReportSchema.parse({
        name: "Pipeline Report",
        type: "CHART",
      });
      expect(valid.name).toBe("Pipeline Report");
      expect(valid.type).toBe("CHART");
    });

    it("should reject empty name", () => {
      expect(() => createCrmSavedReportSchema.parse({ name: "" })).toThrow();
    });

    it("should validate createReportScheduleSchema", () => {
      const valid = createReportScheduleSchema.parse({
        name: "Weekly Pipeline",
        frequency: "WEEKLY",
        recipients: ["user@example.com"],
      });
      expect(valid.frequency).toBe("WEEKLY");
      expect(valid.format).toBe("PDF");
    });

    it("should validate createDashboardTemplateSchema", () => {
      const valid = createDashboardTemplateSchema.parse({
        name: "Exec Dashboard",
        category: "EXECUTIVE",
      });
      expect(valid.category).toBe("EXECUTIVE");
    });
  });

  describe("Business logic stubs", () => {
    it("should produce report dashboard data shape", async () => {
      const result = await service.getReportDashboard("tenant1");
      expect(result).toHaveProperty("totalReports");
      expect(result).toHaveProperty("systemReports");
      expect(result).toHaveProperty("favoriteReports");
      expect(result).toHaveProperty("recentReports");
    });

    it("should produce system reports with seed data", async () => {
      const reports = await service.getSystemReports("tenant1");
      expect(Array.isArray(reports)).toBe(true);
    });

    it("should produce report categories", async () => {
      const cats = await service.getReportCategories("tenant1");
      expect(Array.isArray(cats)).toBe(true);
    });
  });
});
