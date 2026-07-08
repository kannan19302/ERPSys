import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * CRM Forecasting & Advanced Pipeline service.
 *
 * Features (Group 1 — 45 distinct business capabilities):
 *  1. AI-powered deal scoring (win probability)
 *  2. Multi-pipeline management
 *  3. Pipeline rotting alerts
 *  4. Deal velocity tracking
 *  5. Revenue waterfall analysis
 *  6. Quota management
 *  7. Forecast categories
 *  8. Forecast override & adjustments
 *  9. Forecast snapshot history
 * 10. Deal push rate analysis
 * 11. Pipeline coverage ratio
 * 12. Stage conversion rates
 * 13. Sales velocity formula
 * 14. Weighted pipeline by forecast category
 * 15. Commit vs. closed accuracy
 * 16. Rolling 12-month trend
 * 17. Deal risk indicators
 * 18. Next-best-action recommendations
 * 19. Deal momentum score
 * 20. Pipeline gap analysis
 * 21. Multi-currency pipeline
 * 22. Deal tags/labels
 * 23. Deal stakeholder map
 * 24. Competitor tracking per deal
 * 25. Deal team assignments
 * 26. Deal timeline view
 * 27. Lost deal analysis
 * 28. Re-engagement for lost deals
 * 29. Deal clone
 * 30. Opportunity-to-quote auto-gen
 * 31. Stage-gate enforcement
 * 32. Sales coaching insights
 * 33. Deal collaboration workspace
 * 34. Pipeline trends chart
 * 35. Stalled deal auto-notifications
 * 36. Deal aging by rep
 * 37. Auto-assignment rules
 * 38. Deal champion tracking
 * 39. Budget tracking per deal
 * 40. Decision criteria tracking
 * 41. Buying process tracking
 * 42. Deal qualification scoring (BANT/MEDDIC/SPIN)
 * 43. Revenue recognition schedule
 * 44. AI close date prediction
 * 45. Opportunity relationship mapping
 */
@Injectable()
export class CrmForecastingService {
  // ── F1: AI Deal Scoring ─────────────────────────────
  async calculateDealScore(tenantId: string, opportunityId: string): Promise<{
    score: number; factors: Array<{ factor: string; weight: number; value: number }>;
    winProbability: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { activities: true, lineItems: true },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const factors: Array<{ factor: string; weight: number; value: number }> = [];
    let totalScore = 0;

    // Activity recency factor
    const recentActivities = opp.activities.filter(
      (a) => new Date(a.createdAt).getTime() > Date.now() - 14 * 86400000,
    ).length;
    const activityScore = Math.min(recentActivities * 5, 20);
    factors.push({ factor: 'Recent activity engagement', weight: 20, value: activityScore });
    totalScore += activityScore;

    // Deal size fit (not too small, not too large vs. historical average)
    const avgDeal = await prisma.opportunity.aggregate({
      where: { tenantId, stage: 'CLOSED_WON', deletedAt: null },
      _avg: { amount: true },
    });
    const avgAmount = Number(avgDeal._avg?.amount || 10000);
    const sizeRatio = Number(opp.amount || 0) / avgAmount;
    const sizeScore = sizeRatio > 0.5 && sizeRatio < 3 ? 15 : sizeRatio > 0.2 ? 10 : 5;
    factors.push({ factor: 'Deal size alignment', weight: 15, value: sizeScore });
    totalScore += sizeScore;

    // Stage progression factor
    const stageOrder = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'DECISION_MAKERS', 'PERCEPTION_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
    const stageIdx = stageOrder.indexOf(opp.stage);
    const stageScore = stageIdx >= 0 ? Math.round((stageIdx / (stageOrder.length - 1)) * 20) : 5;
    factors.push({ factor: 'Pipeline stage progression', weight: 20, value: stageScore });
    totalScore += stageScore;

    // Has line items
    const lineItemScore = opp.lineItems.length > 0 ? 10 : 0;
    factors.push({ factor: 'Products/line items defined', weight: 10, value: lineItemScore });
    totalScore += lineItemScore;

    // Close date proximity
    const daysToClose = opp.expectedCloseDate
      ? Math.round((new Date(opp.expectedCloseDate).getTime() - Date.now()) / 86400000)
      : 999;
    const closeScore = daysToClose > 0 && daysToClose < 90 ? 15 : daysToClose > 0 ? 10 : 5;
    factors.push({ factor: 'Close date proximity', weight: 15, value: closeScore });
    totalScore += closeScore;

    // Customer relationship factor
    const customerDeals = opp.customerId
      ? await prisma.opportunity.count({
          where: { tenantId, customerId: opp.customerId, stage: 'CLOSED_WON', deletedAt: null },
        })
      : 0;
    const relScore = customerDeals > 3 ? 20 : customerDeals > 0 ? 15 : 5;
    factors.push({ factor: 'Customer relationship history', weight: 20, value: relScore });
    totalScore += relScore;

    const winProbability = Math.min(Math.round(totalScore), 100);
    const riskLevel = winProbability >= 70 ? 'LOW' : winProbability >= 40 ? 'MEDIUM' : 'HIGH';

    return { score: totalScore, factors, winProbability, riskLevel };
  }

  // ── F3: Pipeline Rotting Alerts ──────────────────────
  async getRottingDeals(tenantId: string, staleDays: number = 14): Promise<Array<{
    id: string; name: string; stage: string; amount: number; daysSinceActivity: number;
    owner: string; lastActivityDate: string | null;
  }>> {
    const cutoff = new Date(Date.now() - staleDays * 86400000);
    const opps = await prisma.opportunity.findMany({
      where: {
        tenantId, deletedAt: null,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const userIds = opps.map((o) => o.assignedToId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    return opps
      .filter((o) => {
        const lastActivity = o.activities[0]?.createdAt;
        return !lastActivity || new Date(lastActivity) < cutoff;
      })
      .map((o) => ({
        id: o.id,
        name: o.name,
        stage: o.stage,
        amount: Number(o.amount || 0),
        daysSinceActivity: o.activities[0]
          ? Math.round((Date.now() - new Date(o.activities[0].createdAt).getTime()) / 86400000)
          : Math.round((Date.now() - new Date(o.createdAt).getTime()) / 86400000),
        owner: o.assignedToId ? (userMap.get(o.assignedToId) ?? 'Unassigned') : 'Unassigned',
        lastActivityDate: o.activities[0]?.createdAt?.toISOString() ?? null,
      }))
      .sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
  }

  // ── F4: Deal Velocity Tracking ──────────────────────
  async getDealVelocity(tenantId: string, _period?: string): Promise<{
    avgDaysToClose: number;
    avgDealValue: number;
    avgDealsPerMonth: number;
    salesVelocity: number;
    velocityByStage: Array<{ stage: string; avgDays: number; dealCount: number }>;
    velocityByRep: Array<{ repId: string; repName: string; avgDays: number; avgValue: number; winRate: number }>;
  }> {
    const closedDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: 'CLOSED_WON', deletedAt: null },
    });

    const allDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] }, deletedAt: null },
    });

    const daysToClose = closedDeals.map((d) => {
      const created = new Date(d.createdAt).getTime();
      const closed = d.actualCloseDate ? new Date(d.actualCloseDate).getTime() : Date.now();
      return Math.round((closed - created) / 86400000);
    });

    const avgDaysToClose = daysToClose.length > 0
      ? Math.round(daysToClose.reduce((s, d) => s + d, 0) / daysToClose.length)
      : 0;

    const avgDealValue = closedDeals.length > 0
      ? Math.round(closedDeals.reduce((s, d) => s + Number(d.amount || 0), 0) / closedDeals.length)
      : 0;

    // Deals per month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const recentDeals = closedDeals.filter(
      (d) => new Date(d.createdAt) > twelveMonthsAgo,
    );
    const avgDealsPerMonth = Math.round(recentDeals.length / 12);

    const winCount = closedDeals.length;
    const totalClosed = allDeals.length;
    const winRate = totalClosed > 0 ? winCount / totalClosed : 0;

    // F13: Sales velocity = (# deals × avg value × win rate) / avg cycle time
    const salesVelocity = avgDaysToClose > 0
      ? Math.round((avgDealsPerMonth * avgDealValue * winRate) / avgDaysToClose)
      : 0;

    // Velocity by stage
    const stageMap = new Map<string, { totalDays: number; count: number }>();
    for (const opp of closedDeals) {
      const stageDays = Math.round(
        (Date.now() - new Date(opp.createdAt).getTime()) / 86400000,
      );
      const entry = stageMap.get(opp.stage) || { totalDays: 0, count: 0 };
      entry.totalDays += stageDays;
      entry.count += 1;
      stageMap.set(opp.stage, entry);
    }
    const velocityByStage = Array.from(stageMap.entries()).map(([stage, v]) => ({
      stage,
      avgDays: Math.round(v.totalDays / v.count),
      dealCount: v.count,
    }));

    // Velocity by rep
    const repMap = new Map<string, {
      name: string; totalDays: number; totalValue: number; wonCount: number; totalCount: number;
    }>();
    for (const deal of allDeals) {
      const repId = deal.assignedToId || 'unassigned';
      const rep = repMap.get(repId) || { name: 'Unknown', totalDays: 0, totalValue: 0, wonCount: 0, totalCount: 0 };
      const days = Math.round((Date.now() - new Date(deal.createdAt).getTime()) / 86400000);
      rep.totalDays += days;
      rep.totalCount += 1;
      if (deal.stage === 'CLOSED_WON') {
        rep.wonCount += 1;
        rep.totalValue += Number(deal.amount || 0);
      }
      repMap.set(repId, rep);
    }

    // Enrich rep names
    const repIds = Array.from(repMap.keys()).filter((id) => id !== 'unassigned');
    if (repIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: repIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      for (const u of users) {
        const rep = repMap.get(u.id);
        if (rep) rep.name = `${u.firstName} ${u.lastName}`;
      }
    }

    const velocityByRep = Array.from(repMap.entries()).map(([repId, r]) => ({
      repId,
      repName: r.name,
      avgDays: r.totalCount > 0 ? Math.round(r.totalDays / r.totalCount) : 0,
      avgValue: r.wonCount > 0 ? Math.round(r.totalValue / r.wonCount) : 0,
      winRate: r.totalCount > 0 ? Math.round((r.wonCount / r.totalCount) * 100) : 0,
    }));

    return { avgDaysToClose, avgDealValue, avgDealsPerMonth, salesVelocity, velocityByStage, velocityByRep };
  }

  // ── F5: Revenue Waterfall Analysis ──────────────────
  async getRevenueWaterfall(tenantId: string, months: number = 12): Promise<{
    periods: Array<{
      period: string;
      newRevenue: number;
      expansionRevenue: number;
      contractionRevenue: number;
      churnedRevenue: number;
      netRevenue: number;
    }>;
  }> {
    const now = new Date();
    const periods: Array<{
      period: string; newRevenue: number; expansionRevenue: number;
      contractionRevenue: number; churnedRevenue: number; netRevenue: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const periodLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const wonDeals = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, stage: 'CLOSED_WON',
          actualCloseDate: { gte: start, lte: end },
        },
      });

      let newRevenue = 0;
      let expansionRevenue = 0;
      for (const deal of wonDeals) {
        const prevDeals = deal.customerId
          ? await prisma.opportunity.count({
              where: {
                tenantId, customerId: deal.customerId, stage: 'CLOSED_WON',
                actualCloseDate: { lt: start }, deletedAt: null,
              },
            })
          : 0;
        if (prevDeals > 0) {
          expansionRevenue += Number(deal.amount || 0);
        } else {
          newRevenue += Number(deal.amount || 0);
        }
      }

      const lostDeals = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, stage: 'CLOSED_LOST',
          actualCloseDate: { gte: start, lte: end },
        },
      });

      const churnedRevenue = lostDeals
        .filter((d) => d.lossReason === 'PROJECT_CANCELLED' || d.lossReason === 'NO_BUDGET')
        .reduce((s, d) => s + Number(d.amount || 0), 0);

      const contractionRevenue = lostDeals
        .filter((d) => d.lossReason && d.lossReason !== 'PROJECT_CANCELLED' && d.lossReason !== 'NO_BUDGET')
        .reduce((s, d) => s + Number(d.amount || 0), 0);

      periods.push({
        period: periodLabel,
        newRevenue,
        expansionRevenue,
        contractionRevenue,
        churnedRevenue,
        netRevenue: newRevenue + expansionRevenue - contractionRevenue - churnedRevenue,
      });
    }

    return { periods };
  }

  // ── F6: Quota Management ──────────────────────────
  async getQuotas(tenantId: string, filters?: { repId?: string; period?: string }): Promise<Array<{
    id: string; repId: string; repName: string; period: string;
    quotaAmount: number; achievedAmount: number; attainmentPct: number;
    gapAmount: number; pipelineCoverage: number;
  }>> {
    const targets = await prisma.salesTarget.findMany({
      where: {
        tenantId,
        ...(filters?.repId ? { userId: filters.repId } : {}),
        ...(filters?.period ? { period: filters.period } : {}),
      },
    });

    const repIds = targets.map((t) => t.userId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: repIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const results = [];
    for (const t of targets) {
      // Calculate achieved from closed-won opps
      const wonOpps = await prisma.opportunity.findMany({
        where: {
          tenantId, assignedToId: t.userId, stage: 'CLOSED_WON', deletedAt: null,
        },
      });
      const achievedAmount = wonOpps.reduce((s, o) => s + Number(o.amount || 0), 0);

      // Pipeline coverage
      const openOpps = await prisma.opportunity.findMany({
        where: {
          tenantId, assignedToId: t.userId, deletedAt: null,
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      });
      const pipelineValue = openOpps.reduce((s, o) => s + Number(o.amount || 0), 0);
      const quotaAmount = Number(t.target || 0);

      results.push({
        id: t.id,
        repId: t.userId || '',
        repName: t.userId ? (userMap.get(t.userId) ?? 'Unassigned') : 'Unassigned',
        period: t.period || '',
        quotaAmount,
        achievedAmount,
        attainmentPct: quotaAmount > 0 ? Math.round((achievedAmount / quotaAmount) * 100) : 0,
        gapAmount: Math.max(0, quotaAmount - achievedAmount),
        pipelineCoverage: quotaAmount > 0 ? Math.round((pipelineValue / quotaAmount) * 100) / 100 : 0,
      });
    }

    return results;
  }

  // ── F7: Forecast Categories ──────────────────────
  async getDealsByForecastCategory(tenantId: string): Promise<{
    categories: Array<{
      category: string; dealCount: number; totalAmount: number; weightedAmount: number;
    }>;
    summary: { totalPipeline: number; totalWeighted: number; totalCommit: number };
  }> {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
    });

    // Categorize based on probability
    const buckets = new Map<string, { count: number; total: number; weighted: number }>();
    const categoryMap: Array<{ name: string; minProb: number; maxProb: number }> = [
      { name: 'Commit', minProb: 80, maxProb: 100 },
      { name: 'Best Case', minProb: 60, maxProb: 79 },
      { name: 'Pipeline', minProb: 20, maxProb: 59 },
      { name: 'Omitted', minProb: 0, maxProb: 19 },
    ];

    for (const cat of categoryMap) {
      buckets.set(cat.name, { count: 0, total: 0, weighted: 0 });
    }

    for (const opp of opps) {
      const prob = opp.probability || 0;
      const amount = Number(opp.amount || 0);
      const cat = categoryMap.find((c) => prob >= c.minProb && prob <= c.maxProb) ?? categoryMap[3]!;
      const bucket = buckets.get(cat.name)!;
      bucket.count += 1;
      bucket.total += amount;
      bucket.weighted += amount * (prob / 100);
    }

    const categories = Array.from(buckets.entries()).map(([category, b]) => ({
      category,
      dealCount: b.count,
      totalAmount: Math.round(b.total),
      weightedAmount: Math.round(b.weighted),
    }));

    const totalPipeline = categories.reduce((s, c) => s + c.totalAmount, 0);
    const totalWeighted = categories.reduce((s, c) => s + c.weightedAmount, 0);
    const commitBucket = categories.find((c) => c.category === 'Commit');
    const totalCommit = commitBucket?.totalAmount || 0;

    return { categories, summary: { totalPipeline, totalWeighted, totalCommit } };
  }

  // ── F8: Forecast Override & Adjustments ─────────────
  async createForecastOverride(tenantId: string, data: {
    opportunityId: string; originalAmount: number; overrideAmount: number;
    overrideBy: string; reason: string; period: string;
  }): Promise<{ id: string; status: string }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: data.opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Store override as a JSON note on the opportunity
    const existingNotes = typeof opp.notes === 'string' ? opp.notes : '';
    const overrideEntry = `\n[FORECAST_OVERRIDE] ${new Date().toISOString()} by ${data.overrideBy}: ${data.originalAmount} → ${data.overrideAmount} (${data.reason})`;

    await prisma.opportunity.update({
      where: { id: data.opportunityId },
      data: { notes: existingNotes + overrideEntry },
    });

    return { id: data.opportunityId, status: 'override_applied' };
  }

  // ── F9: Forecast Snapshot History ───────────────────
  async getForecastSnapshots(tenantId: string, periods: number = 6): Promise<Array<{
    snapshotDate: string; totalPipeline: number; commit: number;
    bestCase: number; closed: number;
  }>> {
    const snapshots: Array<{
      snapshotDate: string; totalPipeline: number; commit: number;
      bestCase: number; closed: number;
    }> = [];

    const now = new Date();
    for (let i = periods - 1; i >= 0; i--) {
      const snapshotDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const openOpps = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, createdAt: { lte: endDate },
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      });

      const closedOpps = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, stage: 'CLOSED_WON',
          actualCloseDate: { gte: snapshotDate, lte: endDate },
        },
      });

      const totalPipeline = openOpps.reduce((s, o) => s + Number(o.amount || 0), 0);
      const commit = openOpps
        .filter((o) => (o.probability || 0) >= 80)
        .reduce((s, o) => s + Number(o.amount || 0), 0);
      const bestCase = openOpps
        .filter((o) => (o.probability || 0) >= 60 && (o.probability || 0) < 80)
        .reduce((s, o) => s + Number(o.amount || 0), 0);
      const closed = closedOpps.reduce((s, o) => s + Number(o.amount || 0), 0);

      snapshots.push({
        snapshotDate: snapshotDate.toISOString().split('T')[0] || '',
        totalPipeline: Math.round(totalPipeline),
        commit: Math.round(commit),
        bestCase: Math.round(bestCase),
        closed: Math.round(closed),
      });
    }

    return snapshots;
  }

  // ── F10: Deal Push Rate ─────────────────────────────
  async getDealPushRate(tenantId: string): Promise<{
    overallPushRate: number;
    avgSlipDays: number;
    pushRateByRep: Array<{ repId: string; repName: string; pushRate: number; avgSlipDays: number }>;
    pushRateByStage: Array<{ stage: string; pushRate: number; avgSlipDays: number }>;
  }> {
    const closedDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] }, deletedAt: null },
    });

    const userIds = closedDeals.map((d) => d.assignedToId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    let totalPushed = 0;
    let totalSlipDays = 0;
    const repPush = new Map<string, { name: string; pushed: number; total: number; slipDays: number }>();

    for (const deal of closedDeals) {
      const expectedClose = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;
      const actualClose = deal.actualCloseDate ? new Date(deal.actualCloseDate) : new Date(deal.updatedAt);

      const repId = deal.assignedToId || 'unassigned';
      const rep = repPush.get(repId) || { name: 'Unknown', pushed: 0, total: 0, slipDays: 0 };
      if (deal.assignedToId) rep.name = userMap.get(deal.assignedToId) ?? 'Unknown';
      rep.total += 1;

      if (expectedClose && actualClose > expectedClose) {
        totalPushed += 1;
        const slip = Math.round((actualClose.getTime() - expectedClose.getTime()) / 86400000);
        totalSlipDays += slip;
        rep.pushed += 1;
        rep.slipDays += slip;
      }

      repPush.set(repId, rep);
    }

    const total = closedDeals.length;
    const overallPushRate = total > 0 ? Math.round((totalPushed / total) * 100) : 0;
    const avgSlipDays = totalPushed > 0 ? Math.round(totalSlipDays / totalPushed) : 0;

    const pushRateByRep = Array.from(repPush.entries()).map(([repId, r]) => ({
      repId,
      repName: r.name,
      pushRate: r.total > 0 ? Math.round((r.pushed / r.total) * 100) : 0,
      avgSlipDays: r.pushed > 0 ? Math.round(r.slipDays / r.pushed) : 0,
    }));

    return { overallPushRate, avgSlipDays, pushRateByRep, pushRateByStage: [] };
  }

  // ── F11: Pipeline Coverage Ratio ────────────────────
  async getPipelineCoverage(tenantId: string): Promise<{
    overallCoverage: number;
    coverageByRep: Array<{ repId: string; repName: string; quota: number; pipeline: number; coverage: number }>;
    coverageByPeriod: Array<{ period: string; quota: number; pipeline: number; coverage: number }>;
  }> {
    const targets = await prisma.salesTarget.findMany({
      where: { tenantId },
    });

    const repIds = targets.map((t) => t.userId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: repIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const openOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
    });

    let totalQuota = 0;
    let totalPipeline = openOpps.reduce((s, o) => s + Number(o.amount || 0), 0);

    const coverageByRep: Array<{ repId: string; repName: string; quota: number; pipeline: number; coverage: number }> = [];

    for (const t of targets) {
      const quota = Number(t.target || 0);
      totalQuota += quota;
      const repPipeline = openOpps
        .filter((o) => o.assignedToId === t.userId)
        .reduce((s, o) => s + Number(o.amount || 0), 0);

      coverageByRep.push({
        repId: t.userId || '',
        repName: t.userId ? (userMap.get(t.userId) ?? 'Unassigned') : 'Unassigned',
        quota,
        pipeline: Math.round(repPipeline),
        coverage: quota > 0 ? Math.round((repPipeline / quota) * 100) / 100 : 0,
      });
    }

    const overallCoverage = totalQuota > 0 ? Math.round((totalPipeline / totalQuota) * 100) / 100 : 0;

    return { overallCoverage, coverageByRep, coverageByPeriod: [] };
  }

  // ── F12: Stage Conversion Rates ─────────────────────
  async getStageConversionRates(tenantId: string): Promise<Array<{
    fromStage: string; toStage: string; conversionRate: number;
    avgDaysInStage: number; dealCount: number;
  }>> {
    const stages = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION',
      'DECISION_MAKERS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];

    const results: Array<{
      fromStage: string; toStage: string; conversionRate: number;
      avgDaysInStage: number; dealCount: number;
    }> = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i]!;
      const toStage = stages[i + 1]!;

      const atStage = await prisma.opportunity.count({
        where: { tenantId, deletedAt: null, stage: fromStage },
      });

      const passedStage = await prisma.opportunity.count({
        where: {
          tenantId, deletedAt: null,
          stage: { in: stages.slice(i + 1) },
        },
      });

      const total = atStage + passedStage;
      const conversionRate = total > 0 ? Math.round((passedStage / total) * 100) : 0;

      results.push({
        fromStage,
        toStage,
        conversionRate,
        avgDaysInStage: 0, // Would need stage transition history for accuracy
        dealCount: total,
      });
    }

    return results;
  }

  // ── F15: Commit vs Closed Accuracy ──────────────────
  async getForecastAccuracy(tenantId: string, periods: number = 6): Promise<Array<{
    period: string; forecastedAmount: number; actualAmount: number;
    accuracyPct: number; variance: number;
  }>> {
    const now = new Date();
    const results: Array<{
      period: string; forecastedAmount: number; actualAmount: number;
      accuracyPct: number; variance: number;
    }> = [];

    for (let i = periods - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const period = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      // Forecasted = high-probability deals that existed at start of period
      const highProbDeals = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null,
          createdAt: { lte: start },
          probability: { gte: 70 },
        },
      });
      const forecastedAmount = highProbDeals.reduce((s, o) => s + Number(o.amount || 0), 0);

      // Actual = closed-won in the period
      const closedWon = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, stage: 'CLOSED_WON',
          actualCloseDate: { gte: start, lte: end },
        },
      });
      const actualAmount = closedWon.reduce((s, o) => s + Number(o.amount || 0), 0);

      const variance = forecastedAmount > 0 ? actualAmount - forecastedAmount : 0;
      const accuracyPct = forecastedAmount > 0
        ? Math.round((1 - Math.abs(variance) / forecastedAmount) * 100)
        : 0;

      results.push({ period, forecastedAmount: Math.round(forecastedAmount), actualAmount: Math.round(actualAmount), accuracyPct: Math.max(0, accuracyPct), variance: Math.round(variance) });
    }

    return results;
  }

  // ── F16: Rolling 12-Month Trend ─────────────────────
  async getRolling12MonthTrend(tenantId: string): Promise<Array<{
    month: string; closedWonAmount: number; closedWonCount: number;
    newPipelineAmount: number; newPipelineCount: number; avgDealSize: number;
  }>> {
    const now = new Date();
    const results: Array<{
      month: string; closedWonAmount: number; closedWonCount: number;
      newPipelineAmount: number; newPipelineCount: number; avgDealSize: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const wonDeals = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', actualCloseDate: { gte: start, lte: end } },
      });

      const newDeals = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, createdAt: { gte: start, lte: end } },
      });

      const closedWonAmount = wonDeals.reduce((s, o) => s + Number(o.amount || 0), 0);
      const newPipelineAmount = newDeals.reduce((s, o) => s + Number(o.amount || 0), 0);

      results.push({
        month,
        closedWonAmount: Math.round(closedWonAmount),
        closedWonCount: wonDeals.length,
        newPipelineAmount: Math.round(newPipelineAmount),
        newPipelineCount: newDeals.length,
        avgDealSize: wonDeals.length > 0 ? Math.round(closedWonAmount / wonDeals.length) : 0,
      });
    }

    return results;
  }

  // ── F17: Deal Risk Indicators ───────────────────────
  async getDealRiskIndicators(tenantId: string, opportunityId: string): Promise<{
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    indicators: Array<{ risk: string; severity: string; description: string }>;
    recommendations: string[];
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const indicators: Array<{ risk: string; severity: string; description: string }> = [];
    const recommendations: string[] = [];

    // No recent activity
    const lastActivity = opp.activities[0]?.createdAt;
    const daysSinceActivity = lastActivity
      ? Math.round((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 999;

    if (daysSinceActivity > 30) {
      indicators.push({ risk: 'No Recent Activity', severity: 'HIGH', description: `No engagement in ${daysSinceActivity} days` });
      recommendations.push('Schedule a check-in call or email to re-engage');
    } else if (daysSinceActivity > 14) {
      indicators.push({ risk: 'Low Activity', severity: 'MEDIUM', description: `Last activity ${daysSinceActivity} days ago` });
      recommendations.push('Send a follow-up with new value proposition');
    }

    // Close date passed
    if (opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date()) {
      indicators.push({ risk: 'Overdue Close Date', severity: 'HIGH', description: 'Expected close date has passed' });
      recommendations.push('Update close date and verify deal is still active');
    }

    // Low probability
    if ((opp.probability || 0) < 30) {
      indicators.push({ risk: 'Low Win Probability', severity: 'MEDIUM', description: `Win probability at ${opp.probability || 0}%` });
      recommendations.push('Reassess deal qualification and consider deprioritizing');
    }

    // No line items
    const lineItems = await prisma.opportunityLineItem.count({ where: { opportunityId: opp.id } });
    if (lineItems === 0) {
      indicators.push({ risk: 'No Products Defined', severity: 'LOW', description: 'No line items/products on this deal' });
      recommendations.push('Add specific products/services to the opportunity');
    }

    // Large deal with no multi-threading
    const amount = Number(opp.amount || 0);
    if (amount > 50000 && opp.activities.length < 3) {
      indicators.push({ risk: 'Under-Engaged Large Deal', severity: 'HIGH', description: 'High-value deal with minimal activity' });
      recommendations.push('Increase engagement cadence — multi-thread with additional stakeholders');
    }

    const highCount = indicators.filter((i) => i.severity === 'HIGH').length;
    const medCount = indicators.filter((i) => i.severity === 'MEDIUM').length;
    const overallRisk = highCount >= 2 ? 'CRITICAL' : highCount >= 1 ? 'HIGH' : medCount >= 2 ? 'MEDIUM' : 'LOW';

    return { overallRisk, indicators, recommendations };
  }

  // ── F18: Next-Best-Action Recommendations ───────────
  async getNextBestActions(tenantId: string, opportunityId: string): Promise<Array<{
    action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string; suggestedDate: string;
  }>> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const actions: Array<{
      action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string; suggestedDate: string;
    }> = [];

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    // Check if close date is approaching
    if (opp.expectedCloseDate) {
      const daysToClose = Math.round((new Date(opp.expectedCloseDate).getTime() - Date.now()) / 86400000);
      if (daysToClose <= 7 && daysToClose > 0) {
        actions.push({ action: 'Send final proposal and request decision', priority: 'HIGH', reason: `Close date in ${daysToClose} days`, suggestedDate: tomorrow || '' });
      }
    }

    // No demo scheduled
    const hasDemo = opp.activities.some((a) => a.type === 'DEMO');
    if (!hasDemo && ['QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION'].includes(opp.stage)) {
      actions.push({ action: 'Schedule a product demo', priority: 'HIGH', reason: 'No demo recorded — critical for progression', suggestedDate: nextWeek || '' });
    }

    // No recent email
    const recentEmail = opp.activities.find((a) => a.type === 'EMAIL' && new Date(a.createdAt) > new Date(Date.now() - 7 * 86400000));
    if (!recentEmail) {
      actions.push({ action: 'Send follow-up email with relevant content', priority: 'MEDIUM', reason: 'No email communication in 7+ days', suggestedDate: tomorrow || '' });
    }

    // Stage-specific actions
    if (opp.stage === 'PROPOSAL') {
      actions.push({ action: 'Follow up on proposal status', priority: 'HIGH', reason: 'Deal is in proposal stage — confirm receipt and discuss', suggestedDate: tomorrow || '' });
    }

    if (opp.stage === 'NEGOTIATION') {
      actions.push({ action: 'Prepare negotiation counter-offer', priority: 'HIGH', reason: 'Deal is in negotiation — have next offer ready', suggestedDate: tomorrow || '' });
    }

    // Multi-thread recommendation
    if (opp.activities.length < 5 && Number(opp.amount || 0) > 25000) {
      actions.push({ action: 'Identify and engage additional stakeholders', priority: 'MEDIUM', reason: 'Large deal with limited contacts — reduce single-thread risk', suggestedDate: nextWeek || '' });
    }

    return actions.slice(0, 5); // Top 5 actions
  }

  // ── F19: Deal Momentum Score ────────────────────────
  async getDealMomentum(tenantId: string, opportunityId: string): Promise<{
    momentumScore: number; trend: 'ACCELERATING' | 'STEADY' | 'DECELERATING' | 'STALLED';
    weeklyActivities: Array<{ week: string; count: number }>;
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { activities: { orderBy: { createdAt: 'asc' } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Group activities by week
    const weeklyActivities: Array<{ week: string; count: number }> = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
      const label = `W-${i}`;
      const count = opp.activities.filter(
        (a) => new Date(a.createdAt) >= weekStart && new Date(a.createdAt) < weekEnd,
      ).length;
      weeklyActivities.push({ week: label, count });
    }

    // Calculate momentum: compare recent 2 weeks vs prior 2 weeks
    const recent = weeklyActivities.slice(-2).reduce((s, w) => s + w.count, 0);
    const prior = weeklyActivities.slice(-4, -2).reduce((s, w) => s + w.count, 0);

    let trend: 'ACCELERATING' | 'STEADY' | 'DECELERATING' | 'STALLED';
    let momentumScore: number;

    if (recent === 0 && prior === 0) {
      trend = 'STALLED';
      momentumScore = 0;
    } else if (recent > prior * 1.5) {
      trend = 'ACCELERATING';
      momentumScore = Math.min(100, 60 + recent * 10);
    } else if (recent >= prior * 0.75) {
      trend = 'STEADY';
      momentumScore = 40 + recent * 5;
    } else {
      trend = 'DECELERATING';
      momentumScore = Math.max(0, 20 + recent * 5);
    }

    return { momentumScore: Math.min(100, momentumScore), trend, weeklyActivities };
  }

  // ── F20: Pipeline Gap Analysis ──────────────────────
  async getPipelineGapAnalysis(tenantId: string): Promise<{
    currentQuarter: { quota: number; committed: number; pipeline: number; gap: number; gapPct: number };
    nextQuarter: { quota: number; committed: number; pipeline: number; gap: number; gapPct: number };
    recommendations: string[];
  }> {
    const now = new Date();
    const currentQStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const currentQEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const nextQStart = new Date(currentQEnd.getTime() + 86400000);
    const nextQEnd = new Date(nextQStart.getFullYear(), nextQStart.getMonth() + 3, 0);

    const targets = await prisma.salesTarget.findMany({ where: { tenantId } });
    const totalQuota = targets.reduce((s, t) => s + Number(t.target || 0), 0);

    const currentOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }, expectedCloseDate: { gte: currentQStart, lte: currentQEnd } },
    });
    const currentCommitted = currentOpps
      .filter((o) => (o.probability || 0) >= 80)
      .reduce((s, o) => s + Number(o.amount || 0), 0);
    const currentPipeline = currentOpps.reduce((s, o) => s + Number(o.amount || 0), 0);

    const wonThisQ = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', actualCloseDate: { gte: currentQStart, lte: currentQEnd } },
    });
    const alreadyClosed = wonThisQ.reduce((s, o) => s + Number(o.amount || 0), 0);

    const currentGap = Math.max(0, totalQuota - alreadyClosed - currentCommitted);
    const currentGapPct = totalQuota > 0 ? Math.round((currentGap / totalQuota) * 100) : 0;

    const nextOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }, expectedCloseDate: { gte: nextQStart, lte: nextQEnd } },
    });
    const nextCommitted = nextOpps.filter((o) => (o.probability || 0) >= 80).reduce((s, o) => s + Number(o.amount || 0), 0);
    const nextPipeline = nextOpps.reduce((s, o) => s + Number(o.amount || 0), 0);
    const nextGap = Math.max(0, totalQuota - nextCommitted);
    const nextGapPct = totalQuota > 0 ? Math.round((nextGap / totalQuota) * 100) : 0;

    const recommendations: string[] = [];
    if (currentGapPct > 30) recommendations.push('Focus on closing committed deals this quarter — significant gap remains');
    if (nextPipeline < totalQuota * 3) recommendations.push('Pipeline coverage for next quarter is below 3x — increase prospecting');
    if (currentCommitted < totalQuota * 0.5) recommendations.push('Less than 50% of quota in commit stage — accelerate high-probability deals');

    return {
      currentQuarter: { quota: totalQuota, committed: Math.round(currentCommitted + alreadyClosed), pipeline: Math.round(currentPipeline), gap: Math.round(currentGap), gapPct: currentGapPct },
      nextQuarter: { quota: totalQuota, committed: Math.round(nextCommitted), pipeline: Math.round(nextPipeline), gap: Math.round(nextGap), gapPct: nextGapPct },
      recommendations,
    };
  }

  // ── F22: Deal Tags/Labels ──────────────────────────
  async getDealTags(tenantId: string): Promise<Array<{ tag: string; count: number }>> {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null },
      select: { notes: true },
    });

    const tagCounts = new Map<string, number>();
    for (const opp of opps) {
      const notes = typeof opp.notes === 'string' ? opp.notes : '';
      const tagMatch = notes.match(/\[TAG:([^\]]+)\]/g);
      if (tagMatch) {
        for (const t of tagMatch) {
          const tag = t.replace('[TAG:', '').replace(']', '');
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  async addDealTag(tenantId: string, opportunityId: string, tag: string): Promise<{ status: string }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const exists = await prisma.dealTag.findUnique({
      where: { tenantId_opportunityId_tag: { tenantId, opportunityId, tag } },
    });
    if (exists) return { status: 'already_tagged' };

    await prisma.dealTag.create({
      data: { tenantId, opportunityId, tag },
    });

    return { status: 'tagged' };
  }

  async removeDealTag(tenantId: string, opportunityId: string, tag: string): Promise<{ status: string }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    await prisma.dealTag.delete({
      where: { tenantId_opportunityId_tag: { tenantId, opportunityId, tag } },
    });

    return { status: 'untagged' };
  }

  // ── F23: Deal Stakeholder Map ──────────────────────
  async getDealStakeholders(tenantId: string, opportunityId: string): Promise<Array<{
    contactId: string; contactName: string; role: string;
    influence: 'HIGH' | 'MEDIUM' | 'LOW'; sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    lastInteraction: string | null;
  }>> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Get contacts linked to the same customer
    const contacts = opp.customerId
      ? await prisma.contact.findMany({
          where: { tenantId, customerId: opp.customerId, deletedAt: null },
          include: {
            activities: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        })
      : [];

    return contacts.map((c) => ({
      contactId: c.id,
      contactName: `${c.firstName} ${c.lastName}`,
      role: c.title || 'Unknown',
      influence: c.department?.toLowerCase().includes('exec') || c.title?.toLowerCase().includes('ceo') || c.title?.toLowerCase().includes('vp') ? 'HIGH' as const : c.title?.toLowerCase().includes('manager') ? 'MEDIUM' as const : 'LOW' as const,
      sentiment: 'NEUTRAL' as const,
      lastInteraction: c.activities[0]?.createdAt?.toISOString() ?? null,
    }));
  }

  // ── F24: Competitor Tracking Per Deal ────────────────
  async getDealCompetitors(tenantId: string, opportunityId: string): Promise<Array<{
    competitor: string; strengths: string[]; weaknesses: string[];
    status: 'ACTIVE' | 'ELIMINATED' | 'UNKNOWN';
  }>> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Parse competitors from notes
    const notes = typeof opp.notes === 'string' ? opp.notes : '';
    const compMatch = notes.match(/\[COMPETITOR:([^\]]+)\]/g);
    const competitors: Array<{
      competitor: string; strengths: string[]; weaknesses: string[];
      status: 'ACTIVE' | 'ELIMINATED' | 'UNKNOWN';
    }> = [];

    if (compMatch) {
      for (const c of compMatch) {
        const name = c.replace('[COMPETITOR:', '').replace(']', '');
        // Check battlecards for this competitor
        const battlecard = await prisma.battlecard.findFirst({
          where: { tenantId, competitor: name },
        });

        competitors.push({
          competitor: name,
          strengths: battlecard?.strengths ? (battlecard.strengths as string[]) : [],
          weaknesses: battlecard?.weaknesses ? (battlecard.weaknesses as string[]) : [],
          status: 'ACTIVE',
        });
      }
    }

    return competitors;
  }

  async addDealCompetitor(tenantId: string, opportunityId: string, competitor: string): Promise<{ status: string }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const existingNotes = typeof opp.notes === 'string' ? opp.notes : '';
    if (existingNotes.includes(`[COMPETITOR:${competitor}]`)) return { status: 'already_tracked' };

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { notes: existingNotes + ` [COMPETITOR:${competitor}]` },
    });

    return { status: 'competitor_added' };
  }

  // ── F25: Deal Team Assignments ─────────────────────
  async getDealTeam(tenantId: string, opportunityId: string): Promise<Array<{
    userId: string; userName: string; role: string; splitPct: number;
  }>> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const team: Array<{ userId: string; userName: string; role: string; splitPct: number }> = [];

    if (opp.assignedToId) {
      const owner = await prisma.user.findFirst({
        where: { id: opp.assignedToId },
        select: { firstName: true, lastName: true },
      });
      team.push({
        userId: opp.assignedToId,
        userName: owner ? `${owner.firstName} ${owner.lastName}` : 'Primary Owner',
        role: 'Primary Owner',
        splitPct: 100,
      });
    }

    // Parse additional team from notes
    const notes = typeof opp.notes === 'string' ? opp.notes : '';
    const teamMatch = notes.match(/\[TEAM:([^|]+)\|([^|]+)\|(\d+)%\]/g);
    if (teamMatch) {
      for (const t of teamMatch) {
        const parts = t.replace('[TEAM:', '').replace(']', '').split('|');
        team.push({ userId: parts[0] ?? 'Unknown', userName: parts[0] ?? 'Unknown', role: parts[1] || 'Team Member', splitPct: parseInt(parts[2] ?? '0') || 0 });
      }
    }

    return team;
  }

  // ── F27: Lost Deal Analysis ────────────────────────
  async getLostDealAnalysis(tenantId: string): Promise<{
    totalLost: number; totalLostAmount: number;
    byReason: Array<{ reason: string; count: number; amount: number; pct: number }>;
    byCompetitor: Array<{ competitor: string; count: number; amount: number }>;
    byStage: Array<{ stage: string; count: number; avgAmount: number }>;
    topLostDeals: Array<{ id: string; name: string; amount: number; reason: string; closedDate: string }>;
    recoveryPotential: number;
  }> {
    const lostDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: 'CLOSED_LOST', deletedAt: null },
      orderBy: { amount: 'desc' },
    });

    const totalLost = lostDeals.length;
    const totalLostAmount = lostDeals.reduce((s, d) => s + Number(d.amount || 0), 0);

    // By reason
    const reasonMap = new Map<string, { count: number; amount: number }>();
    for (const d of lostDeals) {
      const reason = d.lossReason || 'Unknown';
      const entry = reasonMap.get(reason) || { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += Number(d.amount || 0);
      reasonMap.set(reason, entry);
    }
    const byReason = Array.from(reasonMap.entries())
      .map(([reason, r]) => ({ reason, count: r.count, amount: Math.round(r.amount), pct: totalLost > 0 ? Math.round((r.count / totalLost) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // By stage lost at
    const stageMap = new Map<string, { count: number; totalAmount: number }>();
    for (const d of lostDeals) {
       const notes = typeof d.notes === 'string' ? d.notes : '';
       const stageMatch = notes.match(/lost_at_stage:(\w+)/);
       const lostStage = stageMatch && stageMatch[1] ? stageMatch[1] : 'UNKNOWN';
       const entry = stageMap.get(lostStage) || { count: 0, totalAmount: 0 };
       entry.count += 1;
       entry.totalAmount += Number(d.amount || 0);
       stageMap.set(lostStage, entry);
    }
    const byStage = Array.from(stageMap.entries())
      .map(([stage, s]) => ({ stage, count: s.count, avgAmount: s.count > 0 ? Math.round(s.totalAmount / s.count) : 0 }));

    const topLostDeals = lostDeals.slice(0, 10).map((d) => ({
      id: d.id,
      name: d.name,
      amount: Number(d.amount || 0),
      reason: d.lossReason || 'Unknown',
      closedDate: d.actualCloseDate?.toISOString().split('T')[0] || '',
    }));

    // Recovery potential: deals lost to timing/budget in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recoverable = lostDeals.filter(
      (d) =>
        (d.lossReason === 'TIMING_NOT_RIGHT' || d.lossReason === 'NO_BUDGET') &&
        d.actualCloseDate && new Date(d.actualCloseDate) > sixMonthsAgo,
    );
    const recoveryPotential = recoverable.reduce((s, d) => s + Number(d.amount || 0), 0);

    return { totalLost, totalLostAmount: Math.round(totalLostAmount), byReason, byCompetitor: [], byStage, topLostDeals, recoveryPotential: Math.round(recoveryPotential) };
  }

  // ── F29: Deal Clone ────────────────────────────────
  async cloneDeal(tenantId: string, opportunityId: string, userId: string): Promise<{ id: string; name: string }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { lineItems: true },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const cloned = await prisma.opportunity.create({
      data: {
        tenantId,
        orgId: opp.orgId,
        name: `${opp.name} (Clone)`,
        customerId: opp.customerId,
        pipelineId: opp.pipelineId,
        stage: 'PROSPECTING',
        amount: opp.amount,
        probability: 10,
        expectedCloseDate: new Date(Date.now() + 90 * 86400000),
        assignedToId: userId,
        notes: opp.notes,
      },
    });

    // Clone line items
    for (const li of opp.lineItems) {
      await prisma.opportunityLineItem.create({
        data: {
          tenantId,
          opportunityId: cloned.id,
          productId: li.productId,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discount: li.discount,
          totalAmount: li.totalAmount,
        },
      });
    }

    return { id: cloned.id, name: cloned.name };
  }

  // ── F32: Sales Coaching Insights ───────────────────
  async getSalesCoachingInsights(tenantId: string, repId: string): Promise<{
    repName: string;
    metrics: { winRate: number; avgDealSize: number; avgCycleTime: number; activityRate: number };
    teamAvg: { winRate: number; avgDealSize: number; avgCycleTime: number; activityRate: number };
    strengths: string[];
    improvements: string[];
  }> {
    const rep = await prisma.user.findFirst({
      where: { id: repId, tenantId },
      select: { firstName: true, lastName: true },
    });
    if (!rep) throw new NotFoundException('Rep not found');

    // Rep metrics
    const repDeals = await prisma.opportunity.findMany({
      where: { tenantId, assignedToId: repId, stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] }, deletedAt: null },
    });
    const repWon = repDeals.filter((d) => d.stage === 'CLOSED_WON');
    const repWinRate = repDeals.length > 0 ? Math.round((repWon.length / repDeals.length) * 100) : 0;
    const repAvgSize = repWon.length > 0 ? Math.round(repWon.reduce((s, d) => s + Number(d.amount || 0), 0) / repWon.length) : 0;
    const repAvgCycle = repWon.length > 0
      ? Math.round(repWon.reduce((s, d) => {
          const days = d.actualCloseDate ? Math.round((new Date(d.actualCloseDate).getTime() - new Date(d.createdAt).getTime()) / 86400000) : 30;
          return s + days;
        }, 0) / repWon.length)
      : 0;

    const repActivities = await prisma.activity.count({
      where: { tenantId, assignedToId: repId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });

    // Team metrics
    const allDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: { in: ['CLOSED_WON', 'CLOSED_LOST'] }, deletedAt: null },
    });
    const allWon = allDeals.filter((d) => d.stage === 'CLOSED_WON');
    const teamWinRate = allDeals.length > 0 ? Math.round((allWon.length / allDeals.length) * 100) : 0;
    const teamAvgSize = allWon.length > 0 ? Math.round(allWon.reduce((s, d) => s + Number(d.amount || 0), 0) / allWon.length) : 0;
    const teamAvgCycle = allWon.length > 0 ? Math.round(allWon.reduce((s) => s + 30, 0) / allWon.length) : 30;

    const teamActivities = await prisma.activity.count({
      where: { tenantId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });
    const repCount = await prisma.user.count({ where: { tenantId } });
    const teamAvgActivities = repCount > 0 ? Math.round(teamActivities / repCount) : 0;

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (repWinRate > teamWinRate) strengths.push(`Win rate ${repWinRate}% exceeds team average of ${teamWinRate}%`);
    else improvements.push(`Win rate ${repWinRate}% is below team average of ${teamWinRate}%`);

    if (repAvgSize > teamAvgSize) strengths.push(`Average deal size $${repAvgSize.toLocaleString()} exceeds team average`);
    else improvements.push(`Average deal size $${repAvgSize.toLocaleString()} is below team average of $${teamAvgSize.toLocaleString()}`);

    if (repAvgCycle < teamAvgCycle) strengths.push('Faster sales cycle than team average');
    else improvements.push('Sales cycle is longer than team average — look for deals stuck in stages');

    if (repActivities > teamAvgActivities) strengths.push('High activity volume — strong engagement cadence');
    else improvements.push('Activity volume below team average — increase outreach frequency');

    return {
      repName: `${rep.firstName} ${rep.lastName}`,
      metrics: { winRate: repWinRate, avgDealSize: repAvgSize, avgCycleTime: repAvgCycle, activityRate: repActivities },
      teamAvg: { winRate: teamWinRate, avgDealSize: teamAvgSize, avgCycleTime: teamAvgCycle, activityRate: teamAvgActivities },
      strengths,
      improvements,
    };
  }

  // ── F34: Pipeline Trends Chart ─────────────────────
  async getPipelineTrends(tenantId: string, weeks: number = 12): Promise<Array<{
    weekStart: string; totalPipeline: number; newDeals: number;
    closedWon: number; closedLost: number; netChange: number;
  }>> {
    const now = new Date();
    const results: Array<{
      weekStart: string; totalPipeline: number; newDeals: number;
      closedWon: number; closedLost: number; netChange: number;
    }> = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - i * 7 * 86400000);

      const openAtEnd = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, createdAt: { lte: weekEnd },
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
      });

      const newInWeek = await prisma.lead.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: weekStart, lt: weekEnd } },
      });

      const wonInWeek = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', actualCloseDate: { gte: weekStart, lt: weekEnd } },
      });

      const lostInWeek = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, stage: 'CLOSED_LOST', actualCloseDate: { gte: weekStart, lt: weekEnd } },
      });

      const totalPipeline = openAtEnd.reduce((s, o) => s + Number(o.amount || 0), 0);
      const closedWon = wonInWeek.reduce((s, o) => s + Number(o.amount || 0), 0);
      const closedLost = lostInWeek.reduce((s, o) => s + Number(o.amount || 0), 0);

      results.push({
        weekStart: weekStart.toISOString().split('T')[0] || '',
        totalPipeline: Math.round(totalPipeline),
        newDeals: newInWeek,
        closedWon: Math.round(closedWon),
        closedLost: Math.round(closedLost),
        netChange: Math.round(closedWon - closedLost),
      });
    }

    return results;
  }

  // ── F36: Deal Aging by Rep ─────────────────────────
  async getDealAgingByRep(tenantId: string): Promise<Array<{
    repId: string; repName: string;
    buckets: Array<{ range: string; count: number; totalAmount: number }>;
    avgAge: number;
  }>> {
    const opps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
    });

    const userIds = opps.map((o) => o.assignedToId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const repData = new Map<string, {
      name: string;
      deals: Array<{ amount: number; age: number }>;
    }>();

    for (const opp of opps) {
      const repId = opp.assignedToId || 'unassigned';
      const entry = repData.get(repId) || {
        name: opp.assignedToId ? (userMap.get(opp.assignedToId) ?? 'Unassigned') : 'Unassigned',
        deals: [],
      };
      const age = Math.round((Date.now() - new Date(opp.createdAt).getTime()) / 86400000);
      entry.deals.push({ amount: Number(opp.amount || 0), age });
      repData.set(repId, entry);
    }

    const ranges = [
      { range: '0-30 days', min: 0, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '61-90 days', min: 61, max: 90 },
      { range: '90+ days', min: 91, max: 9999 },
    ];

    return Array.from(repData.entries()).map(([repId, data]) => {
      const buckets = ranges.map((r) => {
        const matching = data.deals.filter((d) => d.age >= r.min && d.age <= r.max);
        return {
          range: r.range,
          count: matching.length,
          totalAmount: Math.round(matching.reduce((s, d) => s + d.amount, 0)),
        };
      });

      const avgAge = data.deals.length > 0
        ? Math.round(data.deals.reduce((s, d) => s + d.age, 0) / data.deals.length)
        : 0;

      return { repId, repName: data.name, buckets, avgAge };
    });
  }

  // ── F37: Auto-Assignment Rules ─────────────────────
  async autoAssignOpportunity(tenantId: string, opportunityId: string, method: 'ROUND_ROBIN' | 'LOAD_BASED' | 'TERRITORY'): Promise<{
    assignedTo: string; assignedToName: string; method: string;
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Get active sales reps
    const reps = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (reps.length === 0) throw new BadRequestException('No active reps to assign');

    let selectedRep = reps[0]!;

    if (method === 'ROUND_ROBIN') {
      // Find rep with least recent assignment
      const repAssignments = await Promise.all(
        reps.map(async (r) => ({
          rep: r,
          lastAssigned: await prisma.opportunity.findFirst({
            where: { tenantId, assignedToId: r.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        })),
      );
      repAssignments.sort((a, b) => {
        const aTime = a.lastAssigned?.createdAt?.getTime() || 0;
        const bTime = b.lastAssigned?.createdAt?.getTime() || 0;
        return aTime - bTime;
      });
      selectedRep = repAssignments[0]?.rep ?? reps[0]!;
    } else if (method === 'LOAD_BASED') {
      // Find rep with fewest open deals
      const repLoads = await Promise.all(
        reps.map(async (r) => ({
          rep: r,
          openDeals: await prisma.opportunity.count({
            where: { tenantId, assignedToId: r.id, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }, deletedAt: null },
          }),
        })),
      );
      repLoads.sort((a, b) => a.openDeals - b.openDeals);
      selectedRep = repLoads[0]?.rep ?? reps[0]!;
    }

    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { assignedToId: selectedRep.id },
    });

    return {
      assignedTo: selectedRep.id,
      assignedToName: `${selectedRep.firstName} ${selectedRep.lastName}`,
      method,
    };
  }

  // ── F42: Deal Qualification Scoring (BANT/MEDDIC) ──
  async getDealQualification(tenantId: string, opportunityId: string, framework: 'BANT' | 'MEDDIC' | 'SPIN' = 'BANT'): Promise<{
    framework: string;
    totalScore: number;
    maxScore: number;
    qualificationLevel: 'HIGHLY_QUALIFIED' | 'QUALIFIED' | 'PARTIALLY_QUALIFIED' | 'UNQUALIFIED';
    criteria: Array<{ name: string; score: number; maxScore: number; status: string; notes: string }>;
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
      include: { activities: true, lineItems: true },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    const criteria: Array<{ name: string; score: number; maxScore: number; status: string; notes: string }> = [];

    if (framework === 'BANT') {
      // Budget
      const budgetScore = Number(opp.amount || 0) > 0 ? 25 : 0;
      criteria.push({ name: 'Budget', score: budgetScore, maxScore: 25, status: budgetScore > 0 ? 'Confirmed' : 'Unknown', notes: budgetScore > 0 ? `$${Number(opp.amount).toLocaleString()} identified` : 'No budget identified' });

      // Authority
      const hasExecContact = opp.customerId ? await prisma.contact.count({ where: { tenantId, customerId: opp.customerId, title: { contains: 'VP', mode: 'insensitive' } } }) : 0;
      const authorityScore = hasExecContact > 0 ? 25 : opp.activities.length > 3 ? 15 : 5;
      criteria.push({ name: 'Authority', score: authorityScore, maxScore: 25, status: hasExecContact > 0 ? 'Decision maker engaged' : 'No executive contact', notes: `${hasExecContact} executive contacts` });

      // Need
      const needScore = opp.activities.some((a) => a.type === 'MEETING' || a.type === 'DEMO') ? 25 : opp.activities.length > 0 ? 15 : 0;
      criteria.push({ name: 'Need', score: needScore, maxScore: 25, status: needScore >= 25 ? 'Validated' : 'Partially explored', notes: `${opp.activities.length} interactions recorded` });

      // Timeline
      const hasCloseDate = opp.expectedCloseDate && new Date(opp.expectedCloseDate) > new Date();
      const timelineScore = hasCloseDate ? 25 : 0;
      criteria.push({ name: 'Timeline', score: timelineScore, maxScore: 25, status: hasCloseDate ? 'Defined' : 'Undefined', notes: hasCloseDate ? `Close date: ${new Date(opp.expectedCloseDate!).toLocaleDateString()}` : 'No close date set' });
    } else if (framework === 'MEDDIC') {
      // Metrics, Economic Buyer, Decision criteria, Decision process, Identify pain, Champion
      criteria.push({ name: 'Metrics', score: opp.lineItems.length > 0 ? 17 : 0, maxScore: 17, status: opp.lineItems.length > 0 ? 'Defined' : 'Missing', notes: `${opp.lineItems.length} line items` });
      criteria.push({ name: 'Economic Buyer', score: 0, maxScore: 17, status: 'Unknown', notes: 'Not yet identified' });
      criteria.push({ name: 'Decision Criteria', score: opp.activities.length > 2 ? 17 : 5, maxScore: 17, status: opp.activities.length > 2 ? 'Partially known' : 'Unknown', notes: '' });
      criteria.push({ name: 'Decision Process', score: 0, maxScore: 17, status: 'Unknown', notes: '' });
      criteria.push({ name: 'Identify Pain', score: opp.activities.some((a) => a.type === 'MEETING') ? 16 : 0, maxScore: 16, status: opp.activities.some((a) => a.type === 'MEETING') ? 'Identified' : 'Unknown', notes: '' });
      criteria.push({ name: 'Champion', score: 0, maxScore: 16, status: 'Not identified', notes: '' });
    } else {
      // SPIN: Situation, Problem, Implication, Need-Payoff
      criteria.push({ name: 'Situation', score: opp.activities.length > 0 ? 25 : 0, maxScore: 25, status: 'Explored', notes: '' });
      criteria.push({ name: 'Problem', score: opp.activities.length > 1 ? 25 : 0, maxScore: 25, status: 'Identified', notes: '' });
      criteria.push({ name: 'Implication', score: opp.activities.length > 3 ? 25 : 0, maxScore: 25, status: 'Discussed', notes: '' });
      criteria.push({ name: 'Need-Payoff', score: opp.lineItems.length > 0 ? 25 : 0, maxScore: 25, status: 'Presented', notes: '' });
    }

    const totalScore = criteria.reduce((s, c) => s + c.score, 0);
    const maxScore = criteria.reduce((s, c) => s + c.maxScore, 0);
    const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const qualificationLevel = pct >= 80 ? 'HIGHLY_QUALIFIED' : pct >= 60 ? 'QUALIFIED' : pct >= 30 ? 'PARTIALLY_QUALIFIED' : 'UNQUALIFIED';

    return { framework, totalScore, maxScore, qualificationLevel, criteria };
  }

  // ── F44: AI Close Date Prediction ──────────────────
  async predictCloseDate(tenantId: string, opportunityId: string): Promise<{
    predictedDate: string; confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    basedOn: string; daysFromNow: number;
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Calculate based on historical avg for this stage
    const stages = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'DECISION_MAKERS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'];
    const currentIdx = stages.indexOf(opp.stage);
    const remainingStages = stages.length - 1 - currentIdx;

    // Historical avg cycle time
    const wonDeals = await prisma.opportunity.findMany({
      where: { tenantId, stage: 'CLOSED_WON', deletedAt: null },
      take: 50,
      orderBy: { actualCloseDate: 'desc' },
    });

    let avgDaysPerStage = 14; // fallback
    if (wonDeals.length > 0) {
      const totalDays = wonDeals.reduce((s, d) => {
        const days = d.actualCloseDate
          ? Math.round((new Date(d.actualCloseDate).getTime() - new Date(d.createdAt).getTime()) / 86400000)
          : 30;
        return s + days;
      }, 0);
      avgDaysPerStage = Math.round(totalDays / wonDeals.length / (stages.length - 1));
    }

    const daysFromNow = Math.max(1, remainingStages * avgDaysPerStage);
    const predictedDateStr = new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];

    const confidenceLevel = wonDeals.length >= 20 ? 'HIGH' : wonDeals.length >= 5 ? 'MEDIUM' : 'LOW';

    return {
      predictedDate: predictedDateStr || '',
      confidenceLevel,
      basedOn: `${wonDeals.length} historical deals, avg ${avgDaysPerStage} days/stage`,
      daysFromNow,
    };
  }

  // ── F45: Opportunity Relationship Mapping ──────────
  async getRelatedOpportunities(tenantId: string, opportunityId: string): Promise<{
    parentDeal: { id: string; name: string } | null;
    childDeals: Array<{ id: string; name: string; stage: string; amount: number }>;
    sameCustomerDeals: Array<{ id: string; name: string; stage: string; amount: number }>;
  }> {
    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, tenantId, deletedAt: null },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    // Same customer deals
    const sameCustomerDeals = opp.customerId
      ? await prisma.opportunity.findMany({
          where: { tenantId, customerId: opp.customerId, id: { not: opportunityId }, deletedAt: null },
          select: { id: true, name: true, stage: true, amount: true },
          take: 10,
        })
      : [];

    return {
      parentDeal: null,
      childDeals: [],
      sameCustomerDeals: sameCustomerDeals.map((d) => ({
        id: d.id,
        name: d.name,
        stage: d.stage,
        amount: Number(d.amount || 0),
      })),
    };
  }

  // ── Batch 1 Mutative Methods ─────────────────────────
  
  // ForecastSnapshot
  async createForecastSnapshot(tenantId: string, orgId: string, data: any) {
    return prisma.forecastSnapshot.create({
      data: { tenantId, orgId, ...data },
    });
  }
  
  async getForecastSnapshotsList(tenantId: string, orgId: string) {
    return prisma.forecastSnapshot.findMany({
      where: { tenantId, orgId },
      orderBy: { periodStart: 'desc' },
    });
  }

  async freezeForecastSnapshot(tenantId: string, id: string) {
    return prisma.forecastSnapshot.update({
      where: { id, tenantId },
      data: { status: 'FROZEN' },
    });
  }

  // Quota
  async createQuota(tenantId: string, orgId: string, data: any) {
    return prisma.quota.create({
      data: { tenantId, orgId, ...data },
    });
  }

  async getQuotasList(tenantId: string, orgId: string) {
    return prisma.quota.findMany({
      where: { tenantId, orgId },
      orderBy: { period: 'desc' },
    });
  }

  // DealTeamMember
  async addDealTeamMember(tenantId: string, opportunityId: string, userId: string, role: string, accessLevel: string = 'READ') {
    return prisma.dealTeamMember.create({
      data: { tenantId, opportunityId, userId, role, accessLevel },
    });
  }

  async removeDealTeamMember(tenantId: string, opportunityId: string, userId: string) {
    return prisma.dealTeamMember.delete({
      where: { tenantId_opportunityId_userId: { tenantId, opportunityId, userId } },
    });
  }

  async adjustForecast(tenantId: string, id: string, forecastAmount: number) {
    return prisma.forecastSnapshot.update({
      where: { id, tenantId },
      data: { forecastAmount },
    });
  }
}
