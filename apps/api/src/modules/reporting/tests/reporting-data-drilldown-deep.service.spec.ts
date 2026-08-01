import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ReportingDataDrilldownDeepService } from "../reporting-data-drilldown-deep.service";

describe("ReportingDataDrilldownDeepService", () => {
  let service: ReportingDataDrilldownDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingDataDrilldownDeepService],
    }).compile();
    service = module.get<ReportingDataDrilldownDeepService>(
      ReportingDataDrilldownDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should execute drilldown and return segmented results", async () => {
    const res = await service.executeDrilldown("t1", {
      dimension: "REGION",
      filterValue: "EMEA",
      metricKey: "REVENUE",
    });
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.dimension).toBe("REGION");
  });
});
