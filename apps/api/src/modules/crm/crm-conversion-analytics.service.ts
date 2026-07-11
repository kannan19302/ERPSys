import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Lead-to-Opportunity Conversion Analytics (Up Next item 43, benchmark:
 * Salesforce/HubSpot funnel reporting).
 *
 * Deepens `crm-dashboards.service.ts` with dedicated funnel-conversion
 * reporting: Lead created -> Qualified -> Converted to Opportunity ->
 * Opportunity Closed-Won, broken down by lead source and campaign, plus
 * average cycle-time and a trailing time-series so reps/managers can see
 * whether conversion rates are improving.
 */
@Injectable()
export class CrmConversionAnalyticsService {
  /**
   * Overall funnel: counts + conversion rates at each stage, tenant-wide,
   * optionally scoped to a date range on `Lead.createdAt`.
   */
  async getFunnelSummary(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where = this.buildLeadDateFilter(tenantId, dateFrom, dateTo);

    const [totalLeads, qualifiedLeads, convertedLeads, wonOpportunities] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: { in: ['QUALIFIED', 'CONVERTED'] } } }),
      prisma.lead.count({ where: { ...where, status: 'CONVERTED', convertedOpportunityId: { not: null } } }),
      prisma.lead.count({
        where: {
          ...where,
          status: 'CONVERTED',
          convertedOpportunityId: { not: null },
          opportunities: { some: { stage: 'CLOSED_WON' } },
        },
      }),
    ]);

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      wonOpportunities,
      leadToQualifiedRate: pct(qualifiedLeads, totalLeads),
      qualifiedToConvertedRate: pct(convertedLeads, qualifiedLeads),
      convertedToWonRate: pct(wonOpportunities, convertedLeads),
      overallLeadToWonRate: pct(wonOpportunities, totalLeads),
      averageCycleDays: await this.getAverageCycleDays(tenantId, dateFrom, dateTo),
    };
  }

  /**
   * Funnel breakdown grouped by lead source (join through `LeadSource.name`).
   */
  async getFunnelBySource(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where = this.buildLeadDateFilter(tenantId, dateFrom, dateTo);
    const leads = await prisma.lead.findMany({
      where,
      select: {
        status: true,
        convertedOpportunityId: true,
        source: { select: { id: true, name: true } },
        opportunities: { select: { stage: true }, where: { deletedAt: null } },
      },
    });
    return this.groupFunnel(leads, (l) => l.source?.name ?? 'Unknown / No Source');
  }

  /**
   * Funnel breakdown grouped by campaign.
   */
  async getFunnelByCampaign(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where = this.buildLeadDateFilter(tenantId, dateFrom, dateTo);
    const leads = await prisma.lead.findMany({
      where,
      select: {
        status: true,
        convertedOpportunityId: true,
        campaign: { select: { id: true, name: true } },
        opportunities: { select: { stage: true }, where: { deletedAt: null } },
      },
    });
    return this.groupFunnel(leads, (l) => l.campaign?.name ?? 'No Campaign');
  }

  /**
   * Weekly time-series of lead creation vs. conversion, trailing N weeks
   * (default 12), for a trend chart.
   */
  async getConversionTrend(tenantId: string, weeks = 12) {
    const now = new Date();
    const buckets: Array<{ weekStart: string; leadsCreated: number; leadsConverted: number; opportunitiesWon: number }> = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * 7 * 86400_000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 86400_000);

      const [leadsCreated, leadsConverted, opportunitiesWon] = await Promise.all([
        prisma.lead.count({ where: { tenantId, createdAt: { gte: weekStart, lt: weekEnd } } }),
        prisma.lead.count({
          where: { tenantId, status: 'CONVERTED', convertedOpportunityId: { not: null }, updatedAt: { gte: weekStart, lt: weekEnd } },
        }),
        prisma.opportunity.count({
          where: { tenantId, stage: 'CLOSED_WON', actualCloseDate: { gte: weekStart, lt: weekEnd } },
        }),
      ]);

      buckets.push({ weekStart: weekStart.toISOString().slice(0, 10), leadsCreated, leadsConverted, opportunitiesWon });
    }

    return buckets;
  }

  /**
   * Leaderboard: conversion rate per assigned rep (lead owner), sorted
   * descending, so managers can spot who's converting best.
   */
  async getFunnelByRep(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where = this.buildLeadDateFilter(tenantId, dateFrom, dateTo);
    const leads = await prisma.lead.findMany({
      where: { ...where, assignedToId: { not: null } },
      select: {
        assignedToId: true,
        status: true,
        convertedOpportunityId: true,
        opportunities: { select: { stage: true }, where: { deletedAt: null } },
      },
    });

    const repIds = Array.from(new Set(leads.map((l) => l.assignedToId).filter((id): id is string => !!id)));
    const users = repIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: repIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));

    const grouped = this.groupFunnel(leads, (l) => l.assignedToId!);
    return grouped
      .map((row) => ({ ...row, groupLabel: nameById.get(row.groupLabel) ?? row.groupLabel }))
      .sort((a, b) => b.overallLeadToWonRate - a.overallLeadToWonRate);
  }

  // ---- internal helpers ----

  private buildLeadDateFilter(tenantId: string, dateFrom?: string, dateTo?: string) {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }
    return where;
  }

  private groupFunnel<T extends { status: string; convertedOpportunityId: string | null; opportunities: { stage: string }[] }>(
    leads: T[],
    keyFn: (l: T) => string,
  ) {
    const groups = new Map<string, { total: number; qualified: number; converted: number; won: number }>();
    for (const lead of leads) {
      const key = keyFn(lead);
      const g = groups.get(key) ?? { total: 0, qualified: 0, converted: 0, won: 0 };
      g.total++;
      if (lead.status === 'QUALIFIED' || lead.status === 'CONVERTED') g.qualified++;
      if (lead.status === 'CONVERTED' && lead.convertedOpportunityId) {
        g.converted++;
        if (lead.opportunities.some((o) => o.stage === 'CLOSED_WON')) g.won++;
      }
      groups.set(key, g);
    }

    const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    return Array.from(groups.entries())
      .map(([groupLabel, g]) => ({
        groupLabel,
        totalLeads: g.total,
        qualifiedLeads: g.qualified,
        convertedLeads: g.converted,
        wonOpportunities: g.won,
        leadToQualifiedRate: pct(g.qualified, g.total),
        qualifiedToConvertedRate: pct(g.converted, g.qualified),
        overallLeadToWonRate: pct(g.won, g.total),
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);
  }

  private async getAverageCycleDays(tenantId: string, dateFrom?: string, dateTo?: string): Promise<number | null> {
    const where = this.buildLeadDateFilter(tenantId, dateFrom, dateTo);
    const converted = await prisma.lead.findMany({
      where: { ...where, status: 'CONVERTED', convertedOpportunityId: { not: null } },
      select: {
        createdAt: true,
        opportunities: { select: { stage: true, actualCloseDate: true }, where: { stage: 'CLOSED_WON', deletedAt: null } },
      },
    });

    const cycleDays: number[] = [];
    for (const lead of converted) {
      const won = lead.opportunities.find((o) => o.actualCloseDate);
      if (won?.actualCloseDate) {
        const days = (won.actualCloseDate.getTime() - lead.createdAt.getTime()) / 86400_000;
        if (days >= 0) cycleDays.push(days);
      }
    }

    if (cycleDays.length === 0) return null;
    return Math.round((cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10) / 10;
  }
}
