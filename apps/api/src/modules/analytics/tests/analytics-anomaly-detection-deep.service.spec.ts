import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsAnomalyDetectionDeepService } from "../analytics-anomaly-detection-deep.service";

describe("AnalyticsAnomalyDetectionDeepService", () => {
  let service: AnalyticsAnomalyDetectionDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsAnomalyDetectionDeepService],
    }).compile();

    service = module.get<AnalyticsAnomalyDetectionDeepService>(
      AnalyticsAnomalyDetectionDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAnomalies", () => {
    it("should return metric anomaly entries", async () => {
      const res = await service.getAnomalies("t1");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].severity).toBe("CRITICAL");
    });
  });
});
