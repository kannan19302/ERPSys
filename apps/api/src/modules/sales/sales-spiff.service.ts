import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesSpiffService {
  async getSpiffCampaigns(tenantId: string, planId?: string) {
    const where: Prisma.CommissionSpiffWhereInput = { tenantId };
    if (planId) where.planId = planId;
    return prisma.commissionSpiff.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async getSpiffCampaignById(tenantId: string, id: string) {
    const spiff = await prisma.commissionSpiff.findFirst({ where: { id, tenantId } });
    if (!spiff) throw new NotFoundException("SPIFF campaign not found");
    return spiff;
  }

  async createSpiffCampaign(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }
    return prisma.commissionSpiff.create({
      data: {
        tenantId, orgId: resolvedOrgId, planId: dto.planId || null,
        name: dto.name, criteriaType: dto.criteriaType,
        criteriaValue: dto.criteriaValue as Prisma.InputJsonValue,
        bonusType: dto.bonusType, bonusAmount: new Prisma.Decimal(dto.bonusAmount),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSpiffCampaign(tenantId: string, id: string, dto: any) {
    const existing = await prisma.commissionSpiff.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("SPIFF campaign not found");
    const data: Prisma.CommissionSpiffUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.criteriaType !== undefined) data.criteriaType = dto.criteriaType;
    if (dto.criteriaValue !== undefined) data.criteriaValue = dto.criteriaValue as Prisma.InputJsonValue;
    if (dto.bonusType !== undefined) data.bonusType = dto.bonusType;
    if (dto.bonusAmount !== undefined) data.bonusAmount = new Prisma.Decimal(dto.bonusAmount);
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return prisma.commissionSpiff.update({ where: { id }, data });
  }

  async deleteSpiffCampaign(tenantId: string, id: string) {
    const existing = await prisma.commissionSpiff.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("SPIFF campaign not found");
    return prisma.commissionSpiff.delete({ where: { id } });
  }

  async getTeamSplits(tenantId: string) {
    return prisma.teamSplit.findMany({ where: { tenantId }, include: { members: true }, orderBy: { createdAt: "desc" } });
  }

  async createTeamSplit(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException("No Organization found.");
      resolvedOrgId = org.id;
    }
    return prisma.teamSplit.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null, splitType: dto.splitType,
        members: { create: dto.members.map((m: any) => ({ tenantId, userId: m.userId, share: new Prisma.Decimal(m.share), role: m.role || "MEMBER" })) },
      },
      include: { members: true },
    });
  }

  async updateTeamSplit(tenantId: string, id: string, dto: any) {
    const existing = await prisma.teamSplit.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Team split not found");
    const data: Prisma.TeamSplitUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.splitType !== undefined) data.splitType = dto.splitType;
    return prisma.teamSplit.update({ where: { id }, data, include: { members: true } });
  }

  async deleteTeamSplit(tenantId: string, id: string) {
    const existing = await prisma.teamSplit.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Team split not found");
    return prisma.teamSplit.delete({ where: { id } });
  }

  async processClawback(tenantId: string, dto: any) {
    const payout = await prisma.commissionPayout.findFirst({ where: { id: dto.payoutId, tenantId } });
    if (!payout) throw new NotFoundException("Commission payout not found");
    if (payout.status === "PAID") throw new BadRequestException("Cannot clawback an already paid payout");
    return prisma.commissionPayout.update({
      where: { id: dto.payoutId },
      data: { totalPayout: new Prisma.Decimal(Math.max(0, Number(payout.totalPayout) - dto.amount)), status: "DRAFT" },
    });
  }

  async getSpiffDashboard(tenantId: string) {
    const [activeCampaigns, totalPayouts, pendingPayouts] = await Promise.all([
      prisma.commissionSpiff.count({ where: { tenantId, isActive: true } }),
      prisma.commissionPayout.aggregate({ where: { tenantId }, _sum: { spiffBonus: true } }),
      prisma.commissionPayout.count({ where: { tenantId, status: "DRAFT" } }),
    ]);
    return { activeCampaigns, totalSpiffPayouts: Number(totalPayouts._sum.spiffBonus || 0), pendingApprovals: pendingPayouts };
  }

  async getDealRegistrations(tenantId: string, status?: string) {
    const where: Prisma.SalesPartnerDealRegistrationWhereInput = { tenantId };
    if (status) where.status = status;
    return prisma.salesPartnerDealRegistration.findMany({ where, include: { partner: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  }

  async calculateSpiffEligibility(tenantId: string, salesOrderId: string) {
    const order = await prisma.salesOrder.findFirst({ where: { id: salesOrderId, tenantId } });
    if (!order) throw new NotFoundException("Sales order not found");
    const orderAmount = Number(order.totalAmount);
    const activeSpiffs = await prisma.commissionSpiff.findMany({ where: { tenantId, isActive: true } });

    const matched: Array<{ spiffId: string; name: string; bonusType: string; bonusAmount: number; matchedCriteria: string }> = [];
    for (const spiff of activeSpiffs) {
      if (spiff.criteriaType === "DEAL_SIZE_ABOVE") {
        const threshold = Number((spiff.criteriaValue as any)?.threshold || 0);
        if (spiff.criteriaType === "DEAL_SIZE_ABOVE" && orderAmount >= threshold) {
          matched.push({ spiffId: spiff.id, name: spiff.name, bonusType: spiff.bonusType, bonusAmount: Number(spiff.bonusAmount), matchedCriteria: `Order $${orderAmount} >= threshold $${threshold}` });
        }
      }
      if (spiff.criteriaType === "NEW_LOGO" && order.salesChannel === "B2C") {
        matched.push({ spiffId: spiff.id, name: spiff.name, bonusType: spiff.bonusType, bonusAmount: Number(spiff.bonusAmount), matchedCriteria: "New logo (B2C first order)" });
      }
    }
    return { salesOrderId, orderAmount, matchedSpiffs: matched, totalBonus: matched.reduce((s, m) => s + (m.bonusType === "FLAT" ? m.bonusAmount : orderAmount * m.bonusAmount / 100), 0) };
  }
}
