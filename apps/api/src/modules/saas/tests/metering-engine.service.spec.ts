import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasMeteringRule: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    saasUsageEventBatch: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { SaasMeteringEngineDeepService } from "../saas-metering-engine-deep.service";

describe("SaasMeteringEngineDeepService", () => {
  let service: SaasMeteringEngineDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasMeteringEngineDeepService],
    }).compile();

    service = module.get<SaasMeteringEngineDeepService>(
      SaasMeteringEngineDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("processUsageBatch", () => {
    it("should process usage event batch", async () => {
      const mockResult = {
        id: "b-1",
        batchRef: "ref-101",
        eventCount: 2,
        status: "COMPLETED",
      };
      (prisma.saasUsageEventBatch.create as any).mockResolvedValue(mockResult);

      const res = await service.processUsageBatch("t1", {
        batchRef: "ref-101",
        events: [{}, {}],
      });
      expect(res.status).toBe("COMPLETED");
      expect(prisma.saasUsageEventBatch.create).toHaveBeenCalled();
    });
  });
});
