import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ReportingInteractiveViewerDeepService } from "../reporting-interactive-viewer-deep.service";

describe("ReportingInteractiveViewerDeepService", () => {
  let service: ReportingInteractiveViewerDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportingInteractiveViewerDeepService],
    }).compile();
    service = module.get<ReportingInteractiveViewerDeepService>(
      ReportingInteractiveViewerDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a shareable viewer session with link", async () => {
    const res = await service.createViewerSession("t1", "u1", {
      reportTitle: "Board Executive Summary Q3",
    });
    expect(res.reportTitle).toBe("Board Executive Summary Q3");
    expect(res.shareableLink).toContain("/viewer/reports/");
  });
});
