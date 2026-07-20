import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class BrandingService {
  private readonly defaultBranding = {
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#2563EB",
    accentColor: "#7C3AED",
    companyName: null,
    supportEmail: null,
    supportUrl: null,
    customCss: null,
  };

  async getBranding(tenantId: string) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
      include: { customDomain: true },
    });
    if (!branding) return null;
    return branding;
  }

  async updateBranding(tenantId: string, dto: {
    primaryColor?: string;
    accentColor?: string;
    companyName?: string;
    supportEmail?: string;
    supportUrl?: string;
    customCss?: string;
    customDomainId?: string;
    isActive?: boolean;
  }) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      return prisma.tenantBranding.create({
        data: { tenantId: tenantId as any, ...dto },
      });
    }

    if (dto.customDomainId) {
      const domain = await prisma.tenantDomain.findUnique({
        where: { id: dto.customDomainId },
      });
      if (!domain) throw new NotFoundException("Custom domain not found");
    }

    return prisma.tenantBranding.update({
      where: { tenantId },
      data: dto as any,
    });
  }

  async uploadLogo(tenantId: string, file: { filename: string; path: string; mimetype: string }) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      return prisma.tenantBranding.create({
        data: { tenantId: tenantId as any, logoUrl: file.path },
      });
    }

    return prisma.tenantBranding.update({
      where: { tenantId },
      data: { logoUrl: file.path },
    });
  }

  async uploadFavicon(tenantId: string, file: { filename: string; path: string; mimetype: string }) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      return prisma.tenantBranding.create({
        data: { tenantId: tenantId as any, faviconUrl: file.path },
      });
    }

    return prisma.tenantBranding.update({
      where: { tenantId },
      data: { faviconUrl: file.path },
    });
  }

  async previewBranding(tenantId: string) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    const css = `
:root {
  --brand-primary: ${branding?.primaryColor ?? "#2563EB"};
  --brand-accent: ${branding?.accentColor ?? "#7C3AED"};
  --brand-logo-url: ${branding?.logoUrl ? `url("${branding.logoUrl}")` : "none"};
  --brand-company-name: "${branding?.companyName ?? ""}";
}
${branding?.customCss ?? ""}
    `.trim();

    return {
      branding,
      renderedCss: css,
    };
  }

  async resetBranding(tenantId: string) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });
    if (!branding) throw new NotFoundException("Branding not found");

    return prisma.tenantBranding.update({
      where: { tenantId },
      data: { ...this.defaultBranding, isActive: true },
    });
  }

  async getActiveBranding(tenantId: string) {
    const branding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
      include: { customDomain: true },
    });

    if (!branding || !branding.isActive) {
      return this.defaultBranding;
    }

    return {
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      companyName: branding.companyName,
      supportEmail: branding.supportEmail,
      supportUrl: branding.supportUrl,
      customCss: branding.customCss,
      domain: branding.customDomain?.domain ?? null,
    };
  }
}
