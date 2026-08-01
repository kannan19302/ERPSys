import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SaasPortalAuditTrailDeepService } from "../saas-portal-audit-trail-deep.service";

describe("SaasPortalAuditTrailDeepService", () => {
  let service: SaasPortalAuditTrailDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalAuditTrailDeepService],
    }).compile();

    service = module.get<SaasPortalAuditTrailDeepService>(
      SaasPortalAuditTrailDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getAuditLogs", () => {
    it("should return tenant audit trail logs", async () => {
      const res = await service.getAuditLogs("t1");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].action).toBe("UPDATE_SSO_CONFIG");
    });
  });
});
