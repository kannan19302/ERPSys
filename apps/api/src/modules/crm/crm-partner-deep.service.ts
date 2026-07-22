import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const dealRegistrationSchema = z.object({
  partnerId: z.string().min(1),
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional().nullable(),
  estimatedValue: z.number().min(0).default(0),
  currency: z.string().default("USD"),
  notes: z.string().optional().nullable(),
});
export type DealRegistrationInput = z.infer<typeof dealRegistrationSchema>;

export const mdfFundSchema = z.object({
  partnerId: z.string().min(1),
  name: z.string().min(1),
  budgetAmount: z.number().min(0),
  currency: z.string().default("USD"),
  fundType: z.enum(["CO_OP", "REBATE", "MDF", "DEVELOPMENT"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  description: z.string().optional().nullable(),
  approvalRequired: z.boolean().default(true),
});
export type MdfFundInput = z.infer<typeof mdfFundSchema>;

@Injectable()
export class CrmPartnerDeepService {
  async getDealRegistrations(tenantId: string, partnerId?: string, status?: string) {
    const where: Prisma.SalesPartnerDealRegistrationWhereInput = { tenantId, deletedAt: null };
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    return prisma.salesPartnerDealRegistration.findMany({
      where, orderBy: { submittedAt: "desc" },
      include: { partner: { select: { id: true, name: true, tierId: true } } },
    });
  }

  async getDealRegistration(tenantId: string, id: string) {
    const reg = await prisma.salesPartnerDealRegistration.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { partner: { include: { tier: true } } },
    });
    if (!reg) throw new NotFoundException("Deal registration not found");
    return reg;
  }

  async createDealRegistration(tenantId: string, orgId: string | undefined, dto: DealRegistrationInput) {
    const partner = await prisma.salesPartner.findFirst({ where: { id: dto.partnerId, tenantId } });
    if (!partner) throw new BadRequestException("Partner not found");
    return prisma.salesPartnerDealRegistration.create({
      data: { ...dto, tenantId, orgId: orgId || "" },
      include: { partner: { select: { id: true, name: true } } },
    });
  }

  async approveDealRegistration(tenantId: string, id: string, approvedBy: string) {
    const reg = await prisma.salesPartnerDealRegistration.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!reg) throw new NotFoundException("Deal registration not found");
    if (reg.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED registrations can be approved");
    return prisma.salesPartnerDealRegistration.update({
      where: { id }, data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async rejectDealRegistration(tenantId: string, id: string, rejectionReason: string) {
    const reg = await prisma.salesPartnerDealRegistration.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!reg) throw new NotFoundException("Deal registration not found");
    if (reg.status !== "SUBMITTED") throw new BadRequestException("Only SUBMITTED registrations can be rejected");
    return prisma.salesPartnerDealRegistration.update({
      where: { id }, data: { status: "REJECTED", rejectionReason },
    });
  }

  async getDealRegistrationStats(tenantId: string) {
    const [submitted, approved, rejected, won, lost] = await Promise.all([
      prisma.salesPartnerDealRegistration.count({ where: { tenantId, deletedAt: null, status: "SUBMITTED" } }),
      prisma.salesPartnerDealRegistration.count({ where: { tenantId, deletedAt: null, status: "APPROVED" } }),
      prisma.salesPartnerDealRegistration.count({ where: { tenantId, deletedAt: null, status: "REJECTED" } }),
      prisma.salesPartnerDealRegistration.count({ where: { tenantId, deletedAt: null, status: "WON" } }),
      prisma.salesPartnerDealRegistration.count({ where: { tenantId, deletedAt: null, status: "LOST" } }),
    ]);
    const totalValue = await prisma.salesPartnerDealRegistration.aggregate({
      where: { tenantId, deletedAt: null }, _sum: { estimatedValue: true },
    });
    return { submitted, approved, rejected, won, lost, totalEstimatedValue: totalValue._sum.estimatedValue || 0 };
  }

  async getMdfFunds(tenantId: string, partnerId?: string, status?: string) {
    const where: Prisma.SalesPartnerMdfFundWhereInput = { tenantId, deletedAt: null };
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    return prisma.salesPartnerMdfFund.findMany({
      where, orderBy: { startDate: "desc" },
      include: { partner: { select: { id: true, name: true } } },
    });
  }

  async getMdfFund(tenantId: string, id: string) {
    const fund = await prisma.salesPartnerMdfFund.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { partner: { select: { id: true, name: true, tierId: true } } },
    });
    if (!fund) throw new NotFoundException("MDF fund not found");
    return fund;
  }

  async createMdfFund(tenantId: string, orgId: string | undefined, dto: MdfFundInput) {
    const partner = await prisma.salesPartner.findFirst({ where: { id: dto.partnerId, tenantId } });
    if (!partner) throw new BadRequestException("Partner not found");
    return prisma.salesPartnerMdfFund.create({
      data: { ...dto, tenantId, orgId: orgId || "" },
      include: { partner: { select: { id: true, name: true } } },
    });
  }

  async updateMdfFund(tenantId: string, id: string, dto: Partial<MdfFundInput>) {
    const existing = await prisma.salesPartnerMdfFund.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("MDF fund not found");
    return prisma.salesPartnerMdfFund.update({ where: { id }, data: dto });
  }

  async deleteMdfFund(tenantId: string, id: string) {
    const existing = await prisma.salesPartnerMdfFund.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("MDF fund not found");
    return prisma.salesPartnerMdfFund.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMdfFundStats(tenantId: string) {
    const [active, closed] = await Promise.all([
      prisma.salesPartnerMdfFund.aggregate({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
        _sum: { budgetAmount: true, spentAmount: true },
        _count: true,
      }),
      prisma.salesPartnerMdfFund.aggregate({
        where: { tenantId, deletedAt: null, status: { in: ["EXPIRED", "CLOSED"] } },
        _sum: { budgetAmount: true, spentAmount: true },
        _count: true,
      }),
    ]);
    return {
      activeFunds: active._count,
      activeBudget: active._sum.budgetAmount || 0,
      activeSpent: active._sum.spentAmount || 0,
      closedFunds: closed._count,
      totalBudget: Number(active._sum.budgetAmount || 0) + Number(closed._sum.budgetAmount || 0),
    };
  }

  async getPartnerPerformance(tenantId: string, partnerId: string) {
    const partner = await prisma.salesPartner.findFirst({ where: { id: partnerId, tenantId } });
    if (!partner) throw new NotFoundException("Partner not found");
    const [dealRegistrations, mdfFunds] = await Promise.all([
      prisma.salesPartnerDealRegistration.findMany({ where: { tenantId, partnerId, deletedAt: null } }),
      prisma.salesPartnerMdfFund.findMany({ where: { tenantId, partnerId, deletedAt: null } }),
    ]);
    const wonDeals = dealRegistrations.filter((d) => d.status === "WON");
    const totalDealValue = dealRegistrations.reduce((s, d) => s + Number(d.estimatedValue), 0);
    const wonDealValue = wonDeals.reduce((s, d) => s + Number(d.estimatedValue), 0);
    const totalMdfBudget = mdfFunds.reduce((s, f) => s + Number(f.budgetAmount), 0);
    const totalMdfSpent = mdfFunds.reduce((s, f) => s + Number(f.spentAmount), 0);
    return {
      totalDealRegistrations: dealRegistrations.length,
      wonDeals: wonDeals.length,
      wonRate: dealRegistrations.length > 0 ? (wonDeals.length / dealRegistrations.length) * 100 : 0,
      totalDealValue,
      wonDealValue,
      totalMdfBudget,
      totalMdfSpent,
      mdfUtilizationRate: totalMdfBudget > 0 ? (totalMdfSpent / totalMdfBudget) * 100 : 0,
    };
  }
}
