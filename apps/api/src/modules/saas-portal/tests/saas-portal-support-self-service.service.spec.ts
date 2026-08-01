import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasPortalSupportTicketDeep: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    saasPortalTicketMessage: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SaasPortalSupportSelfServiceService } from "../saas-portal-support-self-service.service";

describe("SaasPortalSupportSelfServiceService", () => {
  let service: SaasPortalSupportSelfServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalSupportSelfServiceService],
    }).compile();

    service = module.get<SaasPortalSupportSelfServiceService>(
      SaasPortalSupportSelfServiceService,
    );
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createTicket", () => {
    it("should generate ticket number and create support ticket", async () => {
      const mockResult = {
        id: "st-1",
        ticketNumber: "TICK-123456",
        subject: "Billing Query",
      };
      (prisma.saasPortalSupportTicketDeep.create as any).mockResolvedValue(
        mockResult,
      );

      const res = await service.createTicket("t1", "u1", {
        subject: "Billing Query",
        category: "BILLING",
      });
      expect(res.ticketNumber).toContain("TICK-");
    });
  });
});
