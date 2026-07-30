// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPortalAccountProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    saasPortalPaymentMethod: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    saasPortalInvoiceDownloadLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasPortalBillingSelfServiceService } from "../saas-portal-billing-self-service.service";

describe("SaasPortalBillingSelfServiceService", () => {
  let service: SaasPortalBillingSelfServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalBillingSelfServiceService],
    }).compile();

    service = module.get<SaasPortalBillingSelfServiceService>(
      SaasPortalBillingSelfServiceService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addPaymentMethod", () => {
    it("should create payment method entry", async () => {
      const mockResult = { id: "pm-1", brand: "VISA", last4: "4242" };
      (prisma.saasPortalPaymentMethod.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.addPaymentMethod("t1", {
        brand: "VISA",
        last4: "4242",
      });
      expect(res.last4).toBe("4242");
    });
  });
});
