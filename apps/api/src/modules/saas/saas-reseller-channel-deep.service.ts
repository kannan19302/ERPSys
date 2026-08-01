import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SaasResellerChannelDeepService {
  async getResellers() {
    return prisma.saasPartnerResellerChannel.findMany({
      orderBy: { managedTenants: "desc" },
    });
  }

  async createReseller(dto: any) {
    return prisma.saasPartnerResellerChannel.create({
      data: {
        partnerId: dto.partnerId,
        partnerName: dto.partnerName,
        tier: dto.tier || "SILVER",
        commissionPct: dto.commissionPct || 20.0,
      },
    });
  }

  async getCommissions(resellerId?: string, period?: string) {
    const where: any = {};
    if (resellerId) where.resellerId = resellerId;
    if (period) where.period = period;

    return prisma.saasResellerCommission.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async recordCommission(dto: any) {
    const invoiceAmount = Number(dto.invoiceAmount || 0);
    const commissionPct = Number(dto.commissionPct || 20);
    const earnedAmount = (invoiceAmount * commissionPct) / 100;

    return prisma.saasResellerCommission.create({
      data: {
        resellerId: dto.resellerId,
        tenantId: dto.tenantId,
        period: dto.period || new Date().toISOString().slice(0, 7),
        invoiceAmount,
        commissionPct,
        earnedAmount,
        payoutStatus: "PENDING",
      },
    });
  }
}
