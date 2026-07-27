import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasPortalBillingSelfServiceService {
  async getProfile(tenantId: string) {
    return prisma.saasPortalAccountProfile.findUnique({
      where: { tenantId },
    });
  }

  async upsertProfile(tenantId: string, dto: any) {
    return prisma.saasPortalAccountProfile.upsert({
      where: { tenantId },
      create: {
        tenantId,
        companyName: dto.companyName,
        taxId: dto.taxId,
        billingEmail: dto.billingEmail,
        technicalEmail: dto.technicalEmail,
        address: dto.address,
        country: dto.country || "US",
      },
      update: {
        companyName: dto.companyName,
        taxId: dto.taxId,
        billingEmail: dto.billingEmail,
        technicalEmail: dto.technicalEmail,
        address: dto.address,
        country: dto.country,
      },
    });
  }

  async getPaymentMethods(tenantId: string) {
    return prisma.saasPortalPaymentMethod.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async addPaymentMethod(tenantId: string, dto: any) {
    return prisma.saasPortalPaymentMethod.create({
      data: {
        tenantId,
        brand: dto.brand || "VISA",
        last4: dto.last4 || "4242",
        expMonth: dto.expMonth || 12,
        expYear: dto.expYear || 2028,
        isDefault: dto.isDefault || false,
        stripePaymentMethodId: dto.stripePaymentMethodId,
      },
    });
  }

  async logInvoiceDownload(
    tenantId: string,
    userId: string,
    invoiceId: string,
  ) {
    return prisma.saasPortalInvoiceDownloadLog.create({
      data: {
        tenantId,
        invoiceId,
        downloadedBy: userId,
      },
    });
  }
}
