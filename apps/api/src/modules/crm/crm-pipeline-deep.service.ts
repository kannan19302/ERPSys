// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";

const db = prisma as any;

@Injectable()
export class CrmPipelineDeepService {
  async getPipelineInspectionConfigs(tenantId = "tenant-1") {
    return db.crmPipelineInspectionConfig.findMany({
      where: { tenantId, deletedAt: null },
      include: { pipeline: true },
    });
  }

  async getPipelineInspectionConfig(tenantId = "tenant-1", id = "") {
    const config = await db.crmPipelineInspectionConfig.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { pipeline: true },
    });
    if (!config) throw new NotFoundException("Inspection config not found");
    return config;
  }

  async createPipelineInspectionConfig(
    tenantId = "tenant-1",
    orgId = "org-1",
    dto: any = {},
  ) {
    return db.crmPipelineInspectionConfig.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        rules: dto.rules ?? [],
        schedule: dto.schedule ?? "WEEKLY",
        pipelineId: dto.pipelineId,
      },
      include: { pipeline: true },
    });
  }

  async updatePipelineInspectionConfig(
    tenantId = "tenant-1",
    id = "",
    dto: any = {},
  ) {
    await this.getPipelineInspectionConfig(tenantId, id);
    return db.crmPipelineInspectionConfig.update({
      where: { id },
      data: dto,
      include: { pipeline: true },
    });
  }

  async deletePipelineInspectionConfig(tenantId = "tenant-1", id = "") {
    await this.getPipelineInspectionConfig(tenantId, id);
    return db.crmPipelineInspectionConfig.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async runPipelineInspection(tenantId = "tenant-1", configId = "") {
    const config = await this.getPipelineInspectionConfig(tenantId, configId);
    const opps = await db.opportunity.findMany({
      where: { tenantId, pipelineId: config.pipelineId, deletedAt: null },
    });

    const issues: any[] = [];
    for (const opp of opps) {
      if ((opp.probability ?? 0) < 20 && opp.stage !== "CLOSED_LOST") {
        issues.push({
          opportunityId: opp.id,
          issueType: "LOW_PROBABILITY",
          severity: "WARNING",
          message: `Opportunity "${opp.name}" has low probability (${opp.probability}%).`,
        });
      }
    }

    const healthScore = Math.max(0, 100 - issues.length * 10);
    return db.crmPipelineInspectionResult.create({
      data: {
        tenantId,
        configId,
        healthScore,
        issues,
        inspectedAt: new Date(),
      },
    });
  }

  async getPipelineInspectionResults(tenantId = "tenant-1", configId = "") {
    return db.crmPipelineInspectionResult.findMany({
      where: { tenantId, configId },
      orderBy: { inspectedAt: "desc" },
    });
  }

  async getPipelineSummary(tenantId = "tenant-1", pipelineId?: string) {
    const where: any = { tenantId, deletedAt: null };
    if (pipelineId) where.pipelineId = pipelineId;

    const opps = await db.opportunity.findMany({
      where,
      include: {
        customer: true,
        assignedTo: true,
        pipeline: true,
        lineItems: true,
      },
    });

    let totalValue = 0;
    let weightedValue = 0;
    const stageBreakdown: Record<string, { count: number; value: number }> = {};

    for (const opp of opps) {
      const amt = Number(opp.amount?.toString() || 0);
      const prob = (opp.probability ?? 0) / 100;
      totalValue += amt;
      weightedValue += amt * prob;

      const stage = opp.stage || "UNKNOWN";
      if (!stageBreakdown[stage]) {
        stageBreakdown[stage] = { count: 0, value: 0 };
      }
      stageBreakdown[stage].count += 1;
      stageBreakdown[stage].value += amt;
    }

    return {
      totalOpportunities: opps.length,
      totalValue,
      weightedValue,
      stageBreakdown,
    };
  }

  async getConversionFunnel(
    tenantId = "tenant-1",
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [leads, opps] = await Promise.all([
      db.lead.findMany({ where }),
      db.opportunity.findMany({ where }),
    ]);

    const wonOpps = opps.filter((o: any) => o.stage === "CLOSED_WON");

    return {
      totalLeads: leads.length,
      totalOpportunities: opps.length,
      totalWon: wonOpps.length,
      leadToOppRate: leads.length > 0 ? (opps.length / leads.length) * 100 : 0,
      oppToWonRate: opps.length > 0 ? (wonOpps.length / opps.length) * 100 : 0,
      overallConversionRate:
        leads.length > 0 ? (wonOpps.length / leads.length) * 100 : 0,
    };
  }

  async getStageVelocity(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({
      where: { tenantId, deletedAt: null },
    });

    const map: Record<string, { totalDays: number; count: number }> = {};
    for (const opp of opps) {
      const stage = opp.stage || "UNKNOWN";
      if (!map[stage]) map[stage] = { totalDays: 0, count: 0 };
      const days = opp.stageEnteredAt
        ? Math.ceil(
            (Date.now() - new Date(opp.stageEnteredAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 5;
      map[stage].totalDays += days;
      map[stage].count += 1;
    }

    const velocityByStage = Object.entries(map).map(([stage, val]) => ({
      stage,
      avgDaysInStage: val.count > 0 ? val.totalDays / val.count : 0,
      count: val.count,
    }));

    return { velocityByStage };
  }

  async getWinLossAnalysis(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({
      where: { tenantId, deletedAt: null },
    });

    const map: Record<string, { total: number; won: number; lost: number }> =
      {};
    for (const opp of opps) {
      const stage = opp.stage || "UNKNOWN";
      if (!map[stage]) map[stage] = { total: 0, won: 0, lost: 0 };
      map[stage].total += 1;
      if (opp.stage === "CLOSED_WON") map[stage].won += 1;
      if (opp.stage === "CLOSED_LOST") map[stage].lost += 1;
    }

    const closed = opps.filter(
      (o: any) => o.stage === "CLOSED_WON" || o.stage === "CLOSED_LOST",
    );
    const won = closed.filter((o: any) => o.stage === "CLOSED_WON");

    return {
      totalClosed: closed.length,
      winRate: closed.length > 0 ? (won.length / closed.length) * 100 : 0,
      byStage: map,
    };
  }

  async getLeadSourcePerformance(tenantId = "tenant-1") {
    const leads = await db.lead.findMany({
      where: { tenantId, deletedAt: null },
    });

    const map: Record<string, { leads: number; converted: number }> = {};
    for (const lead of leads) {
      const src = lead.source || lead.sourceId || "Unknown";
      if (!map[src]) map[src] = { leads: 0, converted: 0 };
      map[src].leads += 1;
      if (lead.status === "CONVERTED") map[src].converted += 1;
    }

    return Object.entries(map).map(([source, val]) => ({
      source,
      totalLeads: val.leads,
      convertedLeads: val.converted,
      conversionRate: val.leads > 0 ? (val.converted / val.leads) * 100 : 0,
    }));
  }

  async getProductPerformance(tenantId = "tenant-1") {
    const items = await db.opportunityLineItem.findMany({
      where: { tenantId },
      include: { opportunity: true },
    });

    const map: Record<string, { units: number; revenue: number }> = {};
    for (const item of items) {
      const p = item.productName || item.productId || "General";
      if (!map[p]) map[p] = { units: 0, revenue: 0 };
      map[p].units += item.quantity ?? 1;
      map[p].revenue += Number(item.totalPrice?.toString() || 0);
    }

    return Object.entries(map).map(([product, val]) => ({
      product,
      unitsSold: val.units,
      totalRevenue: val.revenue,
    }));
  }

  async getRepLeaderboard(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({
      where: { tenantId, deletedAt: null },
      include: { assignedTo: true },
    });

    const map: Record<
      string,
      { repName: string; wonValue: number; wonCount: number }
    > = {};
    for (const opp of opps) {
      const repId = opp.assignedToId || "unassigned";
      const repName = opp.assignedTo?.name || "Unassigned";
      if (!map[repId]) map[repId] = { repName, wonValue: 0, wonCount: 0 };

      if (opp.stage === "CLOSED_WON") {
        map[repId].wonValue += Number(opp.amount?.toString() || 0);
        map[repId].wonCount += 1;
      }
    }

    return Object.values(map).sort((a, b) => b.wonValue - a.wonValue);
  }

  async createConfig(tenantId = "tenant-1", orgId = "org-1", dto: any = {}) {
    return this.createPipelineInspectionConfig(tenantId, orgId, dto);
  }

  async updateConfig(tenantId = "tenant-1", id = "", dto: any = {}) {
    return this.updatePipelineInspectionConfig(tenantId, id, dto);
  }

  async deleteConfig(tenantId = "tenant-1", id = "") {
    return this.deletePipelineInspectionConfig(tenantId, id);
  }

  async getDealComparison(
    tenantId = "tenant-1",
    opportunityIds: string[] = [],
  ) {
    if (
      !opportunityIds ||
      opportunityIds.length < 2 ||
      opportunityIds.length > 10
    ) {
      throw new BadRequestException(
        "Must compare between 2 and 10 opportunities",
      );
    }

    const opps = await db.opportunity.findMany({
      where: { tenantId, id: { in: opportunityIds } },
      include: {
        customer: true,
        assignedTo: true,
        pipeline: true,
        lineItems: true,
      },
    });

    if (opps.length !== opportunityIds.length) {
      throw new NotFoundException("One or more opportunities not found");
    }

    return opps.map((opp: any) => ({
      ...opp,
      weightedAmount: Number(opp.amount || 0) * ((opp.probability ?? 0) / 100),
    }));
  }

  async getDealAnalyticsDashboard(tenantId = "tenant-1") {
    const [totalDeals, wonDeals, lostDeals, pipeSum] = await Promise.all([
      db.opportunity.count({ where: { tenantId } }),
      db.opportunity.count({ where: { tenantId, stage: "CLOSED_WON" } }),
      db.opportunity.count({ where: { tenantId, stage: "CLOSED_LOST" } }),
      db.opportunity.aggregate({ where: { tenantId }, _sum: { amount: true } }),
    ]);

    const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const pipelineValue = pipeSum._sum?.amount ?? 0;

    return {
      totalDeals,
      wonDeals,
      lostDeals,
      winRate,
      pipelineValue,
    };
  }

  async getStageConversionRates(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({ where: { tenantId } });
    const stageMap = new Map<string, number>();

    for (const opp of opps) {
      const st = opp.stage || "UNKNOWN";
      stageMap.set(st, (stageMap.get(st) || 0) + 1);
    }

    return Array.from(stageMap.entries()).map(([stage, entered]) => ({
      stage,
      entered,
    }));
  }

  async getStageDurationAnalysis(tenantId = "tenant-1") {
    const histories = await db.opportunityStageHistory.findMany({
      where: { opportunity: { tenantId } },
      include: { opportunity: true },
    });

    const map = new Map<string, { count: number; totalDays: number }>();
    for (const h of histories) {
      const st = h.stageName || "UNKNOWN";
      const enteredAt = new Date(h.enteredAt).getTime();
      const exitedAt = h.exitedAt ? new Date(h.exitedAt).getTime() : Date.now();
      const days = (exitedAt - enteredAt) / (1000 * 60 * 60 * 24);

      const curr = map.get(st) || { count: 0, totalDays: 0 };
      map.set(st, { count: curr.count + 1, totalDays: curr.totalDays + days });
    }

    return Array.from(map.entries()).map(([stage, val]) => ({
      stage,
      count: val.count,
      avgDays: val.count > 0 ? val.totalDays / val.count : 0,
    }));
  }

  async getDealSizeDistribution(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({ where: { tenantId } });

    const buckets = [
      { label: "0-5K", count: 0 },
      { label: "5K-10K", count: 0 },
      { label: "10K-25K", count: 0 },
      { label: "25K-50K", count: 0 },
      { label: "50K-100K", count: 0 },
      { label: "100K-250K", count: 0 },
      { label: "250K+", count: 0 },
    ];

    for (const opp of opps) {
      const amt = Number(opp.amount || 0);
      if (amt < 5000) buckets[0]!.count++;
      else if (amt < 10000) buckets[1]!.count++;
      else if (amt < 25000) buckets[2]!.count++;
      else if (amt < 50000) buckets[3]!.count++;
      else if (amt < 100000) buckets[4]!.count++;
      else if (amt < 250000) buckets[5]!.count++;
      else buckets[6]!.count++;
    }

    return buckets;
  }

  async getWinRateByStage(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({ where: { tenantId } });
    const map = new Map<string, { total: number; won: number }>();

    for (const opp of opps) {
      const st = opp.stage || "UNKNOWN";
      const curr = map.get(st) || { total: 0, won: 0 };
      curr.total++;
      if (opp.stage === "CLOSED_WON") curr.won++;
      map.set(st, curr);
    }

    return Array.from(map.entries()).map(([stage, val]) => ({
      stage,
      total: val.total,
      won: val.won,
      winRate: val.total > 0 ? (val.won / val.total) * 100 : 0,
    }));
  }

  async getLossReasonAnalysis(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({
      where: { tenantId, lossReason: { not: null } },
    });
    const map = new Map<string, { count: number; totalAmount: number }>();

    for (const opp of opps) {
      const reason = opp.lossReason || "Other";
      const amt = Number(opp.amount || 0);
      const curr = map.get(reason) || { count: 0, totalAmount: 0 };
      map.set(reason, {
        count: curr.count + 1,
        totalAmount: curr.totalAmount + amt,
      });
    }

    return Array.from(map.entries()).map(([reason, val]) => ({
      reason,
      count: val.count,
      totalAmount: val.totalAmount,
    }));
  }

  async getWinRateBySource(tenantId = "tenant-1") {
    const leads = await db.lead.findMany({ where: { tenantId } });
    const map = new Map<string, { total: number; converted: number }>();

    for (const l of leads) {
      const src = l.source || "Unknown";
      const curr = map.get(src) || { total: 0, converted: 0 };
      curr.total++;
      if (l.status === "CONVERTED") curr.converted++;
      map.set(src, curr);
    }

    return Array.from(map.entries()).map(([source, val]) => ({
      source,
      total: val.total,
      converted: val.converted,
      conversionRate: val.total > 0 ? (val.converted / val.total) * 100 : 0,
    }));
  }

  async getSalesCycleByProduct(tenantId = "tenant-1") {
    const items = await db.opportunityLineItem.findMany({
      where: { opportunity: { tenantId } },
      include: { opportunity: true },
    });

    const map = new Map<string, { count: number; totalDays: number }>();
    for (const item of items) {
      const p = item.productName || "Product";
      const opp = item.opportunity;
      let days = 30;
      if (opp?.createdAt && opp?.actualCloseDate) {
        days =
          (new Date(opp.actualCloseDate).getTime() -
            new Date(opp.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
      }
      const curr = map.get(p) || { count: 0, totalDays: 0 };
      map.set(p, { count: curr.count + 1, totalDays: curr.totalDays + days });
    }

    return Array.from(map.entries()).map(([product, val]) => ({
      product,
      count: val.count,
      avgDays: val.count > 0 ? val.totalDays / val.count : 0,
    }));
  }

  async getForecastVsActualByRep(tenantId = "tenant-1") {
    const opps = await db.opportunity.findMany({
      where: { tenantId },
      include: { assignedTo: true },
    });

    const map = new Map<
      string,
      {
        repName: string;
        totalDeals: number;
        wonDeals: number;
        forecastAmount: number;
        actualAmount: number;
      }
    >();
    for (const opp of opps) {
      const repId = opp.assignedToId || "unassigned";
      const repName =
        opp.assignedTo?.name || opp.assignedTo?.firstName || "Unassigned";
      const amt = Number(opp.amount || 0);
      const prob = (opp.probability ?? 0) / 100;

      const curr = map.get(repId) || {
        repName,
        totalDeals: 0,
        wonDeals: 0,
        forecastAmount: 0,
        actualAmount: 0,
      };
      curr.totalDeals++;
      curr.forecastAmount += amt * prob;

      if (opp.stage === "CLOSED_WON") {
        curr.wonDeals++;
        curr.actualAmount += amt;
      }
      map.set(repId, curr);
    }

    return Array.from(map.values());
  }
}
