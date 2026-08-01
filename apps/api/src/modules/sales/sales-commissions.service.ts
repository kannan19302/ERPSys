import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SalesCommissionsService {
  async getCommissionPlans(tenantId: string) {
    return prisma.commissionPlan.findMany({
      where: { tenantId, deletedAt: null },
      include: { _count: { select: { tiers: true, payouts: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPlanById(tenantId: string, id: string) {
    const plan = await prisma.commissionPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        tiers: { orderBy: { sortOrder: "asc" } },
        spiffs: { where: { isActive: true } },
      },
    });
    if (!plan) throw new NotFoundException("Commission plan not found");
    return plan;
  }

  async createPlan(tenantId: string, orgId: string, dto: any) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === "org-system-default") {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org)
        throw new BadRequestException("No Organization found for this Tenant.");
      resolvedOrgId = org.id;
    }
    return prisma.commissionPlan.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        description: dto.description || null,
        effectiveStart: new Date(dto.effectiveStart),
        effectiveEnd: dto.effectiveEnd ? new Date(dto.effectiveEnd) : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        tiers: dto.tiers?.length
          ? {
              create: dto.tiers.map((t: any, idx: number) => ({
                tenantId,
                minAttainmentPct: new Prisma.Decimal(t.minAttainmentPct),
                maxAttainmentPct:
                  t.maxAttainmentPct != null
                    ? new Prisma.Decimal(t.maxAttainmentPct)
                    : null,
                commissionRate: new Prisma.Decimal(t.commissionRate),
                sortOrder: t.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async updatePlan(tenantId: string, id: string, dto: any) {
    const plan = await prisma.commissionPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!plan) throw new NotFoundException("Commission plan not found");
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.effectiveStart !== undefined)
      updateData.effectiveStart = new Date(dto.effectiveStart);
    if (dto.effectiveEnd !== undefined)
      updateData.effectiveEnd = dto.effectiveEnd
        ? new Date(dto.effectiveEnd)
        : null;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    return prisma.commissionPlan.update({
      where: { id },
      data: updateData,
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async deletePlan(tenantId: string, id: string) {
    const plan = await prisma.commissionPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!plan) throw new NotFoundException("Commission plan not found");
    return prisma.commissionPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getPayouts(
    tenantId: string,
    planId?: string,
    userId?: string,
    period?: string,
  ) {
    const where: Prisma.CommissionPayoutWhereInput = { tenantId };
    if (planId) where.planId = planId;
    if (userId) where.userId = userId;
    if (period) where.period = period;
    return prisma.commissionPayout.findMany({
      where,
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { calculatedAt: "desc" },
    });
  }

  async getPayoutById(tenantId: string, id: string) {
    const payout = await prisma.commissionPayout.findFirst({
      where: { id, tenantId },
      include: {
        plan: { select: { id: true, name: true } },
        spiffLines: { include: { spiff: true } },
      },
    });
    if (!payout) throw new NotFoundException("Commission payout not found");
    return payout;
  }

  async approvePayout(
    tenantId: string,
    id: string,
    userId: string,
    _notes?: string,
  ) {
    const payout = await prisma.commissionPayout.findFirst({
      where: { id, tenantId },
    });
    if (!payout) throw new NotFoundException("Commission payout not found");
    if (payout.status !== "DRAFT")
      throw new BadRequestException(
        `Payout is already ${payout.status}, cannot approve`,
      );
    return prisma.commissionPayout.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
  }

  async getCommissionDashboard(tenantId: string) {
    const [totalPayouts, pendingApprovals, plansCount] = await Promise.all([
      prisma.commissionPayout.aggregate({
        where: { tenantId, status: { in: ["APPROVED", "PAID"] } },
        _sum: { totalPayout: true },
      }),
      prisma.commissionPayout.count({ where: { tenantId, status: "DRAFT" } }),
      prisma.commissionPlan.count({
        where: { tenantId, deletedAt: null, isActive: true },
      }),
    ]);
    return {
      totalApprovedPayouts: Number(totalPayouts._sum.totalPayout || 0),
      pendingApprovals,
      activePlansCount: plansCount,
    };
  }

  async calculatePayouts(
    tenantId: string,
    planId: string,
    period: string,
    userId?: string,
  ) {
    const plan = await prisma.commissionPlan.findFirst({
      where: { id: planId, tenantId, deletedAt: null },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    });
    if (!plan) throw new NotFoundException("Commission plan not found");
    if (plan.tiers.length === 0)
      throw new BadRequestException("Plan has no tiers configured");

    const parts = period.split("-");
    const year = parseInt(parts[0] ?? "0", 10);
    const quarter = parseInt((parts[1] ?? "Q1").replace("Q", ""), 10);
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

    const orderWhere: Prisma.SalesOrderWhereInput = {
      tenantId,
      status: { in: ["CONFIRMED", "DELIVERED"] },
      orderDate: { gte: startDate, lte: endDate },
      deletedAt: null,
    };
    if (userId) orderWhere.createdBy = userId;

    const salesOrders = await prisma.salesOrder.findMany({ where: orderWhere });
    const attainedAmount = salesOrders.reduce(
      (sum, so) => sum + Number(so.totalAmount),
      0,
    );
    const quotaAmount = attainedAmount || 1;
    const attainmentPct = (attainedAmount / quotaAmount) * 100;

    const matchingTier = plan.tiers.find(
      (t) =>
        Number(t.minAttainmentPct) <= attainmentPct &&
        (t.maxAttainmentPct === null ||
          Number(t.maxAttainmentPct) >= attainmentPct),
    );
    const appliedTierRate = matchingTier
      ? Number(matchingTier.commissionRate)
      : 0;
    const tieredCommission = (attainedAmount * appliedTierRate) / 100;

    const payoutData = {
      attainedAmount: new Prisma.Decimal(attainedAmount),
      attainmentPct: new Prisma.Decimal(attainmentPct),
      appliedTierRate: new Prisma.Decimal(appliedTierRate),
      tieredCommission: new Prisma.Decimal(tieredCommission),
      totalPayout: new Prisma.Decimal(tieredCommission),
      calculatedAt: new Date(),
    };

    if (userId) {
      const existing = await prisma.commissionPayout.findFirst({
        where: { tenantId, planId, userId, period },
      });
      if (existing)
        return prisma.commissionPayout.update({
          where: { id: existing.id },
          data: payoutData,
          include: { plan: { select: { id: true, name: true } } },
        });
    }

    return prisma.commissionPayout.create({
      data: {
        tenantId,
        orgId: plan.orgId,
        planId,
        userId: userId || "system",
        period,
        quotaAmount: new Prisma.Decimal(quotaAmount),
        ...payoutData,
      },
      include: { plan: { select: { id: true, name: true } } },
    });
  }
}
