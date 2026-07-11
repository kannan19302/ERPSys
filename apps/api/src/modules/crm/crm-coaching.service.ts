import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const rubricCriterionSchema = z.object({
  key: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  weight: z.number().min(0).max(100).default(1),
  maxScore: z.number().int().min(1).max(100).default(10),
});

export const createRubricSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  criteria: z.array(rubricCriterionSchema).min(1),
});
export type CreateRubricInput = z.infer<typeof createRubricSchema>;

export const updateRubricSchema = createRubricSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateRubricInput = z.infer<typeof updateRubricSchema>;

export const scoreCriterionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  notes: z.string().max(500).optional(),
});

export const createScorecardSchema = z.object({
  activityId: z.string().min(1),
  rubricId: z.string().min(1),
  criteriaScores: z.array(scoreCriterionSchema).min(1),
  talkRatio: z.number().int().min(0).max(100).optional(),
  objectionHandlingScore: z.number().int().min(0).max(100).optional(),
  nextStepsSet: z.boolean().optional(),
  managerNotes: z.string().max(2000).optional(),
});
export type CreateScorecardInput = z.infer<typeof createScorecardSchema>;

export const createLibraryItemSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['OBJECTION_HANDLING', 'DISCOVERY', 'CLOSING', 'NEGOTIATION', 'DEMO']),
  sourceActivityId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().max(40)).optional(),
});
export type CreateLibraryItemInput = z.infer<typeof createLibraryItemSchema>;

/**
 * Sales coaching / call-scoring (Up Next item 47, benchmark: Gong, Chorus.ai,
 * Salesloft — structured scorecards: talk-ratio, objection-handling,
 * next-steps-set; manager review workflow; coaching library). Extends the
 * existing conversation-intelligence call log rather than duplicating it —
 * a `CallScorecard` is a manager's structured evaluation of a call `Activity`
 * that already has AI-derived sentiment/summary attached.
 */
@Injectable()
export class CrmCoachingService {
  // ── Rubrics ──────────────────────────────────────────
  async createRubric(tenantId: string, orgId: string, dto: CreateRubricInput) {
    return prisma.coachingRubric.create({
      data: { tenantId, orgId, name: dto.name, description: dto.description ?? null, criteria: dto.criteria },
    });
  }

  async listRubrics(tenantId: string, activeOnly?: boolean) {
    return prisma.coachingRubric.findMany({
      where: { tenantId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRubric(tenantId: string, id: string) {
    const rubric = await prisma.coachingRubric.findFirst({ where: { id, tenantId } });
    if (!rubric) throw new NotFoundException('Coaching rubric not found');
    return rubric;
  }

  async updateRubric(tenantId: string, id: string, dto: UpdateRubricInput) {
    await this.getRubric(tenantId, id);
    return prisma.coachingRubric.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.criteria !== undefined ? { criteria: dto.criteria } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  // ── Scorecards ───────────────────────────────────────
  async createScorecard(tenantId: string, orgId: string, reviewerId: string, dto: CreateScorecardInput) {
    const activity = await prisma.activity.findFirst({ where: { id: dto.activityId, tenantId, type: 'CALL' } });
    if (!activity) throw new NotFoundException('Call activity not found');
    const rubric = await this.getRubric(tenantId, dto.rubricId);

    const rubricKeys = new Set((rubric.criteria as Array<{ key: string }>).map((c) => c.key));
    for (const cs of dto.criteriaScores) {
      if (!rubricKeys.has(cs.key)) throw new BadRequestException(`Unknown criterion key "${cs.key}" for this rubric`);
      if (cs.score > cs.maxScore) throw new BadRequestException(`Score for "${cs.key}" exceeds its max`);
    }

    const totalScore = dto.criteriaScores.reduce((s, c) => s + c.score, 0);
    const maxScore = dto.criteriaScores.reduce((s, c) => s + c.maxScore, 0);

    return prisma.callScorecard.create({
      data: {
        tenantId,
        orgId,
        activityId: dto.activityId,
        rubricId: dto.rubricId,
        reviewerId,
        criteriaScores: dto.criteriaScores,
        totalScore,
        maxScore,
        talkRatio: dto.talkRatio ?? null,
        objectionHandlingScore: dto.objectionHandlingScore ?? null,
        nextStepsSet: dto.nextStepsSet ?? false,
        managerNotes: dto.managerNotes ?? null,
        status: 'SUBMITTED',
      },
    });
  }

  async listScorecardsForCall(tenantId: string, activityId: string) {
    return prisma.callScorecard.findMany({
      where: { tenantId, activityId },
      include: { rubric: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getScorecard(tenantId: string, id: string) {
    const sc = await prisma.callScorecard.findFirst({
      where: { id, tenantId },
      include: { rubric: true, activity: { select: { subject: true, assignedToId: true, aiSentiment: true } } },
    });
    if (!sc) throw new NotFoundException('Scorecard not found');
    return sc;
  }

  async acknowledgeScorecard(tenantId: string, id: string) {
    const sc = await this.getScorecard(tenantId, id);
    if (sc.status === 'ACKNOWLEDGED') return sc;
    return prisma.callScorecard.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
    });
  }

  /** Rep-level coaching rollup: avg score, avg talk ratio, trend of last N scorecards. */
  async getRepCoachingSummary(tenantId: string, repUserId: string) {
    const scorecards = await prisma.callScorecard.findMany({
      where: { tenantId, activity: { assignedToId: repUserId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { totalScore: true, maxScore: true, talkRatio: true, objectionHandlingScore: true, nextStepsSet: true, createdAt: true },
    });

    if (scorecards.length === 0) {
      return { repUserId, scorecardsReviewed: 0, averageScorePct: null, averageTalkRatio: null, nextStepsSetRate: null, trend: [] };
    }

    const scorePctSum = scorecards.reduce((s, c) => s + (c.maxScore > 0 ? (c.totalScore / c.maxScore) * 100 : 0), 0);
    const talkRatios = scorecards.filter((c) => c.talkRatio != null).map((c) => c.talkRatio as number);
    const nextStepsCount = scorecards.filter((c) => c.nextStepsSet).length;

    return {
      repUserId,
      scorecardsReviewed: scorecards.length,
      averageScorePct: Math.round(scorePctSum / scorecards.length),
      averageTalkRatio: talkRatios.length > 0 ? Math.round(talkRatios.reduce((s, v) => s + v, 0) / talkRatios.length) : null,
      nextStepsSetRate: Math.round((nextStepsCount / scorecards.length) * 100),
      trend: scorecards.slice(0, 10).reverse().map((c) => ({
        date: c.createdAt,
        scorePct: c.maxScore > 0 ? Math.round((c.totalScore / c.maxScore) * 100) : 0,
      })),
    };
  }

  /** Team-wide coaching dashboard: per-rep averages across all reviewed calls. */
  async getTeamCoachingDashboard(tenantId: string) {
    const scorecards = await prisma.callScorecard.findMany({
      where: { tenantId },
      include: { activity: { select: { assignedToId: true } } },
    });

    const byRep = new Map<string, { totalScorePct: number; count: number; talkRatioSum: number; talkRatioCount: number }>();
    for (const sc of scorecards) {
      const repId = sc.activity.assignedToId ?? 'unassigned';
      const entry = byRep.get(repId) ?? { totalScorePct: 0, count: 0, talkRatioSum: 0, talkRatioCount: 0 };
      entry.totalScorePct += sc.maxScore > 0 ? (sc.totalScore / sc.maxScore) * 100 : 0;
      entry.count += 1;
      if (sc.talkRatio != null) {
        entry.talkRatioSum += sc.talkRatio;
        entry.talkRatioCount += 1;
      }
      byRep.set(repId, entry);
    }

    return Array.from(byRep.entries()).map(([repUserId, e]) => ({
      repUserId,
      scorecardsReviewed: e.count,
      averageScorePct: e.count > 0 ? Math.round(e.totalScorePct / e.count) : 0,
      averageTalkRatio: e.talkRatioCount > 0 ? Math.round(e.talkRatioSum / e.talkRatioCount) : null,
    })).sort((a, b) => b.averageScorePct - a.averageScorePct);
  }

  // ── Coaching library ─────────────────────────────────
  async createLibraryItem(tenantId: string, orgId: string, createdById: string, dto: CreateLibraryItemInput) {
    return prisma.coachingLibraryItem.create({
      data: {
        tenantId,
        orgId,
        title: dto.title,
        category: dto.category,
        sourceActivityId: dto.sourceActivityId ?? null,
        notes: dto.notes ?? null,
        tags: dto.tags ?? [],
        createdById,
      },
    });
  }

  async listLibraryItems(tenantId: string, category?: string) {
    return prisma.coachingLibraryItem.findMany({
      where: { tenantId, ...(category ? { category } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteLibraryItem(tenantId: string, id: string) {
    const item = await prisma.coachingLibraryItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Coaching library item not found');
    await prisma.coachingLibraryItem.delete({ where: { id } });
    return { status: 'deleted' };
  }
}
