import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";

vi.mock("@unerp/database", () => ({
  prisma: {
    saasWhiteLabelDomain: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    saasSslCertificate: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { SaasWhiteLabelDeepService } from "../saas-white-label-deep.service";

describe("SaasWhiteLabelDeepService", () => {
  let service: SaasWhiteLabelDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasWhiteLabelDeepService],
    }).compile();

    service = module.get<SaasWhiteLabelDeepService>(SaasWhiteLabelDeepService);
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addCustomDomain", () => {
    it("should generate verification token and create custom domain", async () => {
      const mockResult = {
        id: "d1",
        customDomain: "erp.acme.com",
        verificationToken: "TOKEN-123",
      };
      (prisma.saasWhiteLabelDomain.create as any).mockResolvedValue(mockResult);

      const res = await service.addCustomDomain("t1", {
        customDomain: "erp.acme.com",
      });
      expect(res.customDomain).toBe("erp.acme.com");
    });
  });
});
