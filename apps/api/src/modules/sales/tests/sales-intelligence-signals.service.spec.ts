// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    salesIntelligenceSignal: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesIntelligenceSignalsService } from "../sales-intelligence-signals.service";

describe("SalesIntelligenceSignalsService", () => {
  let service: SalesIntelligenceSignalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesIntelligenceSignalsService],
    }).compile();

    service = module.get<SalesIntelligenceSignalsService>(
      SalesIntelligenceSignalsService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSignals", () => {
    it("should return signals filtered by severity", async () => {
      const mockSignals = [
        { id: "sig-1", headline: "Executive Departure", severity: "HIGH" },
      ];
      (prisma.salesIntelligenceSignal.findMany as any).mockResolvedValue(
        mockSignals,
      );

      const result = await service.getSignals("tenant-1", { severity: "HIGH" });
      expect(result).toEqual(mockSignals);
      expect(prisma.salesIntelligenceSignal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: "tenant-1",
            severity: "HIGH",
          }),
        }),
      );
    });
  });

  describe("createSignal", () => {
    it("should create an intelligence signal", async () => {
      const dto = {
        signalType: "ENGAGEMENT_DROP",
        headline: "No emails in 14 days",
        severity: "HIGH",
      };
      const mockCreated = { id: "sig-1", ...dto, isActioned: false };
      (prisma.salesIntelligenceSignal.create as any).mockResolvedValue(
        mockCreated,
      );

      const result = await service.createSignal("tenant-1", dto);
      expect(result).toEqual(mockCreated);
      expect(prisma.salesIntelligenceSignal.create).toHaveBeenCalled();
    });
  });
});
