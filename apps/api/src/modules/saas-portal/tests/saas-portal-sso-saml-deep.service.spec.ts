import { describe, it, expect, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { SaasPortalSsoSamlDeepService } from "../saas-portal-sso-saml-deep.service";

describe("SaasPortalSsoSamlDeepService", () => {
  let service: SaasPortalSsoSamlDeepService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaasPortalSsoSamlDeepService],
    }).compile();

    service = module.get<SaasPortalSsoSamlDeepService>(
      SaasPortalSsoSamlDeepService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getSsoConfigs", () => {
    it("should return tenant SSO configurations", async () => {
      const res = await service.getSsoConfigs("t1");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].provider).toBe("OKTA");
    });
  });
});
