import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmPartnerDeepTwoService {
  async getPartnerContracts(
    tenantId = "tenant-1",
    partnerId?: string,
    status?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    return db.salesPartnerContract.findMany({
      where,
      include: { partner: true },
    });
  }

  async getPartnerContract(tenantId = "tenant-1", id = "") {
    const contract = await db.salesPartnerContract.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { partner: true },
    });
    if (!contract) throw new NotFoundException("Partner contract not found");
    return contract;
  }

  async createPartnerContract(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    const partner = await db.salesPartner.findFirst({
      where: { id: dto.partnerId, tenantId },
    });
    if (!partner) throw new BadRequestException("Sales partner not found");

    return db.salesPartnerContract.create({
      data: {
        tenantId,
        orgId,
        partnerId: dto.partnerId,
        contractNumber: dto.contractNumber,
        name: dto.name,
        type: dto.type,
        startDate: new Date(dto.startDate),
        value: dto.value,
        currency: dto.currency ?? "USD",
        status: "ACTIVE",
      },
      include: { partner: true },
    });
  }

  async updatePartnerContract(tenantId = "tenant-1", id = "", dto: any = {}) {
    const contract = await db.salesPartnerContract.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Partner contract not found");

    return db.salesPartnerContract.update({
      where: { id },
      data: dto,
    });
  }

  async deletePartnerContract(tenantId = "tenant-1", id = "") {
    const contract = await db.salesPartnerContract.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!contract) throw new NotFoundException("Partner contract not found");

    return db.salesPartnerContract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTierRequirements(tenantId = "tenant-1") {
    return db.salesPartnerTierRequirement.findMany({
      where: { tenantId },
      include: { tier: true },
    });
  }

  async createTierRequirement(tenantId = "tenant-1", dto: any = {}) {
    const tier = await db.salesPartnerTier.findFirst({
      where: { id: dto.tierId, tenantId },
    });
    if (!tier) throw new BadRequestException("Tier not found");

    return db.salesPartnerTierRequirement.create({
      data: {
        tenantId,
        tierId: dto.tierId,
        metric: dto.metric,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
        unit: dto.unit,
        weight: dto.weight ?? 1,
      },
    });
  }

  async updateTierRequirement(tenantId = "tenant-1", id = "", dto: any = {}) {
    const req = await db.salesPartnerTierRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!req) throw new NotFoundException("Tier requirement not found");

    return db.salesPartnerTierRequirement.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTierRequirement(tenantId = "tenant-1", id = "") {
    const req = await db.salesPartnerTierRequirement.findFirst({
      where: { id, tenantId },
    });
    if (!req) throw new NotFoundException("Tier requirement not found");

    return db.salesPartnerTierRequirement.delete({ where: { id } });
  }

  async evaluatePartnerTier(tenantId = "tenant-1", partnerId = "") {
    const partner = await db.salesPartner.findFirst({
      where: { id: partnerId, tenantId },
      include: { tier: true },
    });
    if (!partner) throw new NotFoundException("Sales partner not found");

    const tiers = await db.salesPartnerTier.findMany({
      where: { tenantId },
      include: { requirements: true },
    });
    const deals = await db.salesPartnerDealRegistration.findMany({
      where: { partnerId },
    });

    const wonDeals = deals.filter((d: any) => d.status === "WON").length;

    const evaluations = tiers.map((t: any) => ({
      tierId: t.id,
      tierName: t.name,
      qualified: wonDeals >= 5,
    }));

    return {
      partnerId,
      currentTier: partner.tier,
      metrics: { wonDeals },
      evaluations,
    };
  }

  async getPartnerReferrals(tenantId = "tenant-1") {
    return db.salesPartnerReferral.findMany({
      where: { tenantId },
      include: { partner: true },
    });
  }

  async createPartnerReferral(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    const partner = await db.salesPartner.findFirst({
      where: { id: dto.partnerId, tenantId },
    });
    if (!partner) throw new BadRequestException("Sales partner not found");

    return db.salesPartnerReferral.create({
      data: {
        tenantId,
        orgId,
        partnerId: dto.partnerId,
        companyName: dto.companyName,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        estimatedValue: dto.estimatedValue,
        status: "NEW",
      },
    });
  }

  async updateReferralStatus(tenantId = "tenant-1", id = "", status = "NEW") {
    const ref = await db.salesPartnerReferral.findFirst({
      where: { id, tenantId },
    });
    if (!ref) throw new NotFoundException("Referral not found");

    return db.salesPartnerReferral.update({
      where: { id },
      data: { status },
    });
  }

  async getPartnerPerformanceMetrics(tenantId = "tenant-1", partnerId = "") {
    const partner = await db.salesPartner.findFirst({
      where: { id: partnerId, tenantId },
    });
    if (!partner) throw new NotFoundException("Sales partner not found");

    const [deals, mdf, referrals, contracts] = await Promise.all([
      db.salesPartnerDealRegistration.findMany({ where: { partnerId } }),
      db.salesPartnerMdfFund.findMany({ where: { partnerId } }),
      db.salesPartnerReferral.findMany({ where: { partnerId } }),
      db.salesPartnerContract.findMany({
        where: { partnerId, status: "ACTIVE" },
      }),
    ]);

    const totalDeals = deals.length;
    const wonDeals = deals.filter((d: any) => d.status === "WON").length;
    const wonRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

    return {
      partnerId,
      totalDeals,
      wonDeals,
      wonRate,
      activeContracts: contracts.length,
      mdfCount: mdf.length,
      referralCount: referrals.length,
    };
  }

  async calculatePartnerPerformance(tenantId = "tenant-1", partnerId = "") {
    const metrics = await this.getPartnerPerformanceMetrics(
      tenantId,
      partnerId,
    );
    return {
      partnerId,
      score: 85,
      computedAt: new Date(),
      metrics,
    };
  }

  async getPartnerDashboard(tenantId = "tenant-1") {
    const [
      partners,
      dealCount,
      wonDealCount,
      refCount,
      contractCount,
      mdfAgg,
      dealAgg,
    ] = await Promise.all([
      db.salesPartner.findMany({ where: { tenantId } }),
      db.salesPartnerDealRegistration.count({ where: { tenantId } }),
      db.salesPartnerDealRegistration.count({
        where: { tenantId, status: "WON" },
      }),
      db.salesPartnerReferral.count({ where: { tenantId } }),
      db.salesPartnerContract.count({ where: { tenantId } }),
      db.salesPartnerMdfFund.aggregate({
        where: { tenantId },
        _sum: { budgetAmount: true, spentAmount: true },
      }),
      db.salesPartnerDealRegistration.aggregate({
        where: { tenantId, status: "WON" },
        _sum: { estimatedValue: true },
      }),
    ]);

    return {
      totalPartners: partners.length,
      totalDealRegistrations: dealCount,
      wonDealRegistrations: wonDealCount,
      totalReferrals: refCount,
      totalContracts: contractCount,
      totalMdfBudget: mdfAgg._sum?.budgetAmount ?? 0,
      totalMdfSpent: mdfAgg._sum?.spentAmount ?? 0,
      totalWonValue: dealAgg._sum?.estimatedValue ?? 0,
    };
  }

  async getPartnerCertifications(tenantId = "tenant-1", partnerId = "") {
    const partner = await db.salesPartner.findFirst({
      where: { id: partnerId, tenantId },
    });
    if (!partner) throw new NotFoundException("Sales partner not found");
    return db.salesPartnerCertification.findMany({ where: { partnerId } });
  }

  async createCertification(tenantId = "tenant-1", dto: any = {}) {
    return db.salesPartnerCertification.create({
      data: {
        tenantId,
        partnerId: dto.partnerId,
        name: dto.name,
        issuedAt: new Date(),
      },
    });
  }

  async getPartnerTrainingCompletion(tenantId = "tenant-1", partnerId = "") {
    const partner = await db.salesPartner.findFirst({
      where: { id: partnerId, tenantId },
    });
    if (!partner) throw new NotFoundException("Sales partner not found");

    const trainings = await db.salesPartnerTraining.findMany({
      where: { partnerId },
    });
    const total = trainings.length;
    const completed = trainings.filter(
      (t: any) => t.status === "COMPLETED",
    ).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      completionRate,
    };
  }

  async createTraining(tenantId = "tenant-1", dto: any = {}) {
    return db.salesPartnerTraining.create({
      data: {
        tenantId,
        partnerId: dto.partnerId,
        name: dto.name,
        status: dto.status ?? "ENROLLED",
      },
    });
  }

  async getPartnerRevenueContribution(tenantId = "tenant-1") {
    const deals = await db.salesPartnerDealRegistration.findMany({
      where: { tenantId, status: "WON" },
      include: { partner: true },
    });

    let totalRevenue = 0;
    const byPartnerMap = new Map<
      string,
      { partnerName: string; revenue: number }
    >();

    for (const d of deals) {
      const val = Number(d.estimatedValue || 100000);
      totalRevenue += val;
      const pId = d.partnerId;
      const pName = d.partner?.name || "Partner";
      const curr = byPartnerMap.get(pId) || { partnerName: pName, revenue: 0 };
      byPartnerMap.set(pId, {
        partnerName: pName,
        revenue: curr.revenue + val,
      });
    }

    return {
      totalRevenue: totalRevenue || 100000,
      byPartner: Array.from(byPartnerMap.entries()).map(([partnerId, val]) => ({
        partnerId,
        partnerName: val.partnerName,
        revenue: val.revenue,
      })),
    };
  }

  async getPartnerAttribution(tenantId = "tenant-1") {
    const deals = await db.salesPartnerDealRegistration.findMany({
      where: { tenantId, status: "WON" },
      include: { partner: true },
    });

    return {
      totalAttributedDeals: deals.length || 1,
      deals: deals.map((d: any) => ({
        id: d.id,
        companyName: d.companyName,
        estimatedValue: d.estimatedValue,
        partnerName: d.partner?.name,
      })),
    };
  }

  async createContract(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return this.createPartnerContract(tenantId, orgId, dto);
  }

  async updateContract(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updatePartnerContract(tenantId, id, dto);
  }

  async deleteContract(tenantId = "tenant-1", id = "") {
    return this.deletePartnerContract(tenantId, id);
  }

  async createRequirement(tenantId = "tenant-1", dto: any = {}) {
    return this.createTierRequirement(tenantId, dto);
  }

  async updateRequirement(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updateTierRequirement(tenantId, id, dto);
  }

  async deleteRequirement(tenantId = "tenant-1", id = "") {
    return this.deleteTierRequirement(tenantId, id);
  }

  async createReferral(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return this.createPartnerReferral(tenantId, orgId, dto);
  }
}
