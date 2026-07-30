// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsRealtimeStreamDeepService } from "../analytics-realtime-stream-deep.service";

describe("AnalyticsRealtimeStreamDeepService", () => {
  let service: AnalyticsRealtimeStreamDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsRealtimeStreamDeepService],
    }).compile();

    service = module.get<AnalyticsRealtimeStreamDeepService>(
      AnalyticsRealtimeStreamDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLiveMetrics", () => {
    it("should return live system analytics metrics", async () => {
      const res = await service.getLiveMetrics("t1");
      expect(res.activeUsersNow).toBe(418);
      expect(res.p99LatencyMs).toBe(42);
    });
  });
});
