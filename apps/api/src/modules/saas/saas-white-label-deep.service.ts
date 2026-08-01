import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasWhiteLabelDeepService {
  async getDomains(tenantId: string) {
    return prisma.saasWhiteLabelDomain.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async addCustomDomain(
    tenantId: string,
    dto: { customDomain: string; brandingConfig?: any },
  ) {
    const verificationToken = `TOKEN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    return prisma.saasWhiteLabelDomain.create({
      data: {
        tenantId,
        customDomain: dto.customDomain,
        verificationToken,
        brandingConfig: dto.brandingConfig || null,
      },
    });
  }

  async verifyDomain(tenantId: string, id: string) {
    const domain = await prisma.saasWhiteLabelDomain.findFirst({
      where: { id, tenantId },
    });
    if (!domain) throw new NotFoundException("Custom domain not found");

    return prisma.saasWhiteLabelDomain.update({
      where: { id },
      data: {
        isVerified: true,
        status: "ACTIVE",
      },
    });
  }

  async issueSslCert(tenantId: string, domainId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    return prisma.saasSslCertificate.create({
      data: {
        tenantId,
        domainId,
        provider: "LETS_ENCRYPT",
        status: "ACTIVE",
        expiresAt,
        autoRenew: true,
      },
    });
  }
}
