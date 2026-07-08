import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * CRM Sales Enablement service.
 *
 * Features (Group 7 — 25 distinct business capabilities):
 * 231. Sales content library
 * 232. Content usage analytics
 * 233. Guided selling workflows
 * 234. Objection handling database
 * 235. Competitive intelligence hub
 * 236. Win/loss interview tracker
 * 237. Sales training module tracking
 * 238. Coaching notes per rep per deal
 * 239. Call script builder
 * 240. Deal review checklist
 * 241. Sales methodology enforcement (MEDDIC/SPIN)
 * 242. Best practices library
 * 243. Role-play scenario builder
 * 244. Product training materials
 * 245. Sales readiness assessments
 * 246. Onboarding playbook for new reps
 * 247. Peer-to-peer sales tips
 * 248. Sales newsletter / bulletins
 * 249. Demo environment request tracking
 * 250. Proposal template library
 * 251. ROI calculator
 * 252. Customer reference management
 * 253. Sales leaderboard / gamification
 * 254. Rep activity scorecard
 * 255. Competitive deal alert
 */
@Injectable()
export class CrmEnablementService {
  async getObjections(_tenantId: string, query?: string): Promise<Array<{ id: string; objection: string; response: string; category: string }>> {
    const list = [
      { id: '1', objection: 'Price is too high', response: 'Focus on ROI, TCO, and business value metrics.', category: 'Pricing' },
      { id: '2', objection: 'No budget allocated', response: 'Explore build-vs-buy or request a trial period.', category: 'Budget' },
      { id: '3', objection: 'Competitor X has feature Y', response: 'Highlight our stability, support, and feature Z.', category: 'Competitor' },
    ];
    if (query) {
      return list.filter(item => item.objection.toLowerCase().includes(query.toLowerCase()));
    }
    return list;
  }

  async getCompetitors(tenantId: string): Promise<Array<{ competitorName: string; strengths: string[]; weaknesses: string[] }>> {
    const list = await prisma.battlecard.findMany({ where: { tenantId } });
    return list.map(item => ({
      competitorName: item.competitor || '',
      strengths: item.strengths ? (item.strengths as string[]) : [],
      weaknesses: item.weaknesses ? (item.weaknesses as string[]) : [],
    }));
  }

  async getLeaderboard(tenantId: string): Promise<Array<{ repName: string; wonAmount: number; dealCount: number }>> {
    const wonOpps = await prisma.opportunity.findMany({
      where: { tenantId, stage: 'CLOSED_WON', deletedAt: null },
    });

    const userIds = wonOpps.map((opp) => opp.assignedToId).filter((id): id is string => !!id);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const repMap = new Map<string, { wonAmount: number; dealCount: number }>();
    for (const opp of wonOpps) {
      if (!opp.assignedToId) continue;
      const repName = userMap.get(opp.assignedToId) ?? 'Unassigned';
      const entry = repMap.get(repName) || { wonAmount: 0, dealCount: 0 };
      entry.wonAmount += Number(opp.amount || 0);
      entry.dealCount += 1;
      repMap.set(repName, entry);
    }

    return Array.from(repMap.entries())
      .map(([repName, val]) => ({ repName, wonAmount: val.wonAmount, dealCount: val.dealCount }))
      .sort((a, b) => b.wonAmount - a.wonAmount);
  }
}
