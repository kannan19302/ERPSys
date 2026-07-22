import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { z } from "zod";

export const winLossReasonSchema = z.object({
  category: z.enum(["WON_REASON", "LOST_REASON"]),
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type WinLossReasonInput = z.infer<typeof winLossReasonSchema>;

export const competitorSchema = z.object({
  name: z.string().min(1),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  logoUrl: z.string().optional().nullable(),
  marketShare: z.number().min(0).max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CompetitorInput = z.infer<typeof competitorSchema>;

export const recordWinLossSchema = z.object({
  opportunityId: z.string().min(1),
  winLossReasonId: z.string().optional().nullable(),
  competitorId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type RecordWinLossInput = z.infer<typeof recordWinLossSchema>;

@Injectable()
export class CrmWinLossService {
  async getReasons(tenantId: string, category?: string) {
    const where: any = { tenantId, deletedAt: null };
    if (category) where.category = category;
    return prisma.winLossReason.findMany({ where, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  }

  async createReason(tenantId: string, orgId: string | undefined, dto: WinLossReasonInput) {
    return prisma.winLossReason.create({ data: { ...dto, tenantId, orgId: orgId || "" } });
  }

  async updateReason(tenantId: string, id: string, dto: Partial<WinLossReasonInput>) {
    const existing = await prisma.winLossReason.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Reason not found");
    return prisma.winLossReason.update({ where: { id }, data: dto });
  }

  async deleteReason(tenantId: string, id: string) {
    const existing = await prisma.winLossReason.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Reason not found");
    return prisma.winLossReason.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCompetitors(tenantId: string) {
    return prisma.competitor.findMany({ where: { tenantId, deletedAt: null }, orderBy: { name: "asc" } });
  }

  async getCompetitor(tenantId: string, id: string) {
    const comp = await prisma.competitor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!comp) throw new NotFoundException("Competitor not found");
    return comp;
  }

  async createCompetitor(tenantId: string, orgId: string | undefined, dto: CompetitorInput) {
    return prisma.competitor.create({ data: { ...dto, tenantId, orgId: orgId || "" } });
  }

  async updateCompetitor(tenantId: string, id: string, dto: Partial<CompetitorInput>) {
    const existing = await prisma.competitor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Competitor not found");
    return prisma.competitor.update({ where: { id }, data: dto });
  }

  async deleteCompetitor(tenantId: string, id: string) {
    const existing = await prisma.competitor.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Competitor not found");
    return prisma.competitor.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async recordWinLoss(tenantId: string, dto: RecordWinLossInput) {
    const opp = await prisma.opportunity.findFirst({ where: { id: dto.opportunityId, tenantId } });
    if (!opp) throw new NotFoundException("Opportunity not found");
    const data: any = { stage: dto.winLossReasonId ? "Closed Won" : "Closed Lost" };
    if (dto.winLossReasonId) data.winLossReasonId = dto.winLossReasonId;
    if (dto.competitorId) data.competitorId = dto.competitorId;
    if (dto.notes) data.notes = dto.notes;
    if (dto.winLossReasonId) data.actualCloseDate = new Date();
    return prisma.opportunity.update({ where: { id: dto.opportunityId }, data });
  }

  async getWinLossAnalytics(tenantId: string, period?: { start?: Date; end?: Date }) {
    const where: any = { tenantId, stage: { in: ["Closed Won", "Closed Lost"] } };
    if (period?.start || period?.end) {
      where.actualCloseDate = {};
      if (period.start) where.actualCloseDate.gte = period.start;
      if (period.end) where.actualCloseDate.lte = period.end;
    }
    const opportunities = await prisma.opportunity.findMany({
      where,
      select: { id: true, stage: true, amount: true, winLossReasonId: true, competitorId: true, assignedToId: true, actualCloseDate: true },
    });
    const total = opportunities.length;
    const won = opportunities.filter((o) => o.stage === "Closed Won");
    const lost = opportunities.filter((o) => o.stage === "Closed Lost");
    const totalWonValue = won.reduce((s, o) => s + Number(o.amount || 0), 0);
    const totalLostValue = lost.reduce((s, o) => s + Number(o.amount || 0), 0);
    const winRate = total > 0 ? (won.length / total) * 100 : 0;
    const reasons = await this.getReasons(tenantId);
    const byReason = reasons.map((r) => ({
      reasonId: r.id, reasonName: r.name, category: r.category,
      count: opportunities.filter((o) => o.winLossReasonId === r.id).length,
    })).filter((r) => r.count > 0);
    const competitors = await this.getCompetitors(tenantId);
    const byCompetitor = competitors.map((c) => ({
      competitorId: c.id, competitorName: c.name,
      totalDeals: opportunities.filter((o) => o.competitorId === c.id).length,
      wonDeals: opportunities.filter((o) => o.competitorId === c.id && o.stage === "Closed Won").length,
      lostDeals: opportunities.filter((o) => o.competitorId === c.id && o.stage === "Closed Lost").length,
    }));
    return { total, won: won.length, lost: lost.length, winRate, totalWonValue, totalLostValue, byReason, byCompetitor };
  }

  async getWinLossReasonsBreakdown(tenantId: string) {
    const [wonReasons, lostReasons] = await Promise.all([
      prisma.winLossReason.findMany({ where: { tenantId, deletedAt: null, category: "WON_REASON", isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.winLossReason.findMany({ where: { tenantId, deletedAt: null, category: "LOST_REASON", isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return { wonReasons, lostReasons };
  }
}
