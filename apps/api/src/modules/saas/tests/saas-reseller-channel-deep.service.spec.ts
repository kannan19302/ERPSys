// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPartnerResellerChannel: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    saasResellerCommission: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasResellerChannelDeepService } from "../saas-reseller-channel-deep.service";

describe("SaasResellerChannelDeepService", () => {
  let service: SaasResellerChannelDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasResellerChannelDeepService],
    }).compile();

    service = module.get<SaasResellerChannelDeepService>(
      SaasResellerChannelDeepService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("recordCommission", () => {
    it("should calculate earned commission amount", async () => {
      const mockResult = {
        id: "c1",
        invoiceAmount: 1000,
        commissionPct: 20,
        earnedAmount: 200,
      };
      (prisma.saasResellerCommission.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.recordCommission({
        resellerId: "r1",
        tenantId: "t1",
        invoiceAmount: 1000,
        commissionPct: 20,
      });
      expect(res.earnedAmount).toBe(200);
    });
  });
});
