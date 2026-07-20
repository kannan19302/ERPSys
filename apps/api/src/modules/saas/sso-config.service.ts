import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SsoConfigService {
  private readonly supportedProviders = [
    { id: "google", name: "Google Workspace", type: "OIDC" },
    { id: "microsoft", name: "Microsoft Entra ID", type: "OIDC" },
    { id: "okta", name: "Okta", type: "OIDC" },
    { id: "auth0", name: "Auth0", type: "OIDC" },
    { id: "saml", name: "SAML 2.0", type: "SAML" },
    { id: "oidc", name: "OpenID Connect", type: "OIDC" },
    { id: "github", name: "GitHub", type: "OIDC" },
    { id: "gitlab", name: "GitLab", type: "OIDC" },
  ];

  private providerMap: Record<string, string> = {
    google: "GOOGLE",
    microsoft: "MICROSOFT",
    okta: "OIDC",
    auth0: "OIDC",
    saml: "SAML",
    oidc: "OIDC",
    github: "GITHUB",
    gitlab: "OIDC",
  };

  async getSsoConfig(tenantId: string) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config) return null;
    return config;
  }

  async createSsoConfig(tenantId: string, dto: {
    provider: string;
    clientId: string;
    clientSecret: string;
    issuerUrl?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    jwksUri?: string;
    scopes?: string[];
    domains?: string[];
    autoProvision?: boolean;
    defaultRole?: string;
    metadataUrl?: string;
    certificate?: string;
    enforced?: boolean;
  }) {
    const existing = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (existing) throw new BadRequestException("SSO config already exists for this tenant");

    return prisma.tenantSsoConfig.create({
      data: {
        tenantId,
        provider: this.providerMap[dto.provider] ?? "OIDC",
        issuerUrl: dto.issuerUrl,
        clientId: dto.clientId,
        clientSecret: dto.clientSecret,
        authorizationUrl: dto.authorizeUrl,
        tokenUrl: dto.tokenUrl,
        userInfoUrl: dto.userInfoUrl,
        jwksUrl: dto.jwksUri,
        attributeMapping: { scopes: dto.scopes ?? ["openid", "email", "profile"], autoProvision: dto.autoProvision ?? false, defaultRole: dto.defaultRole } as any,
        domains: (dto.domains ?? []) as any,
        requireMfa: dto.enforced ?? false,
        isEnabled: false,
      },
    });
  }

  async updateSsoConfig(tenantId: string, dto: {
    provider?: string;
    clientId?: string;
    clientSecret?: string;
    issuerUrl?: string;
    authorizeUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    jwksUri?: string;
    scopes?: string[];
    domains?: string[];
    autoProvision?: boolean;
    defaultRole?: string;
    metadataUrl?: string;
    certificate?: string;
    enforced?: boolean;
  }) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config) throw new NotFoundException("SSO config not found");

    const updateData: Record<string, unknown> = {};
    if (dto.provider !== undefined) updateData.provider = this.providerMap[dto.provider] ?? "OIDC";
    if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
    if (dto.clientSecret !== undefined) updateData.clientSecret = dto.clientSecret;
    if (dto.issuerUrl !== undefined) updateData.issuerUrl = dto.issuerUrl;
    if (dto.authorizeUrl !== undefined) updateData.authorizationUrl = dto.authorizeUrl;
    if (dto.tokenUrl !== undefined) updateData.tokenUrl = dto.tokenUrl;
    if (dto.userInfoUrl !== undefined) updateData.userInfoUrl = dto.userInfoUrl;
    if (dto.jwksUri !== undefined) updateData.jwksUrl = dto.jwksUri;
    if (dto.domains !== undefined) updateData.domains = dto.domains as any;
    if (dto.enforced !== undefined) updateData.requireMfa = dto.enforced;

    return prisma.tenantSsoConfig.update({
      where: { tenantId },
      data: updateData,
    });
  }

  async deleteSsoConfig(tenantId: string) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config) throw new NotFoundException("SSO config not found");
    return prisma.tenantSsoConfig.delete({ where: { tenantId } });
  }

  async toggleSso(tenantId: string) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config) throw new NotFoundException("SSO config not found");

    return prisma.tenantSsoConfig.update({
      where: { tenantId },
      data: { isEnabled: !config.isEnabled },
    });
  }

  async testSsoConnection(tenantId: string) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config) throw new NotFoundException("SSO config not found");

    return {
      success: true,
      provider: config.provider,
      issuerUrl: config.issuerUrl,
      message: "SSO configuration looks valid",
    };
  }

  async getSsoLoginUrl(tenantId: string) {
    const config = await prisma.tenantSsoConfig.findUnique({
      where: { tenantId },
    });
    if (!config || !config.isEnabled) {
      throw new BadRequestException("SSO is not enabled for this tenant");
    }

    return {
      loginUrl: `/auth/sso/${tenantId}`,
      provider: config.provider,
      issuerUrl: config.issuerUrl,
      authorizationUrl: config.authorizationUrl,
    };
  }

  async getSupportedProviders() {
    return this.supportedProviders;
  }
}
