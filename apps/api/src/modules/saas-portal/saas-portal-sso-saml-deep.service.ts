import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalSsoSamlDeepService {
  async getSsoConfigs(tenantId: string) {
    return [
      {
        id: "sso-1",
        tenantId,
        provider: "OKTA",
        issuerUrl: "https://dev-12345.okta.com/app/exk12345/sso/saml",
        ssoUrl: "https://dev-12345.okta.com/app/exk12345/sso/saml",
        isEnabled: true,
        enforceSso: false,
      },
    ];
  }

  async configureSso(tenantId: string, dto: any) {
    return {
      id: `sso-${Date.now()}`,
      tenantId,
      provider: dto.provider || "SAML_GENERIC",
      issuerUrl: dto.issuerUrl,
      ssoUrl: dto.ssoUrl,
      isEnabled: true,
      enforceSso: dto.enforceSso || false,
    };
  }
}
