import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmCoachingService } from '../crm-coaching.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    activity: { findFirst: vi.fn() },
    coachingRubric: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    callScorecard: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    coachingLibraryItem: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const ORG = 'org-1';
const REVIEWER = 'user-manager';

describe('CrmCoachingService', () => {
  let service: CrmCoachingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCoachingService();
  });

  it('creates a rubric with weighted criteria', async () => {
    (prisma.coachingRubric.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'rub1', ...data }));
    const result = await service.createRubric(TENANT, ORG, {
      name: 'Discovery Call Rubric',
      criteria: [
        { key: 'talk_ratio', label: 'Talk Ratio', weight: 1, maxScore: 10 },
        { key: 'objections', label: 'Objection Handling', weight: 1, maxScore: 10 },
      ],
    });
    expect(prisma.coachingRubric.create).toHaveBeenCalled();
    expect(result.name).toBe('Discovery Call Rubric');
  });

  it('rejects a scorecard referencing an unknown criterion key', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1', type: 'CALL' });
    (prisma.coachingRubric.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'rub1',
      tenantId: TENANT,
      criteria: [{ key: 'talk_ratio', label: 'Talk Ratio', weight: 1, maxScore: 10 }],
    });

    await expect(
      service.createScorecard(TENANT, ORG, REVIEWER, {
        activityId: 'act1',
        rubricId: 'rub1',
        criteriaScores: [{ key: 'unknown_key', label: 'x', score: 5, maxScore: 10 }],
      }),
    ).rejects.toThrow('Unknown criterion key');
  });

  it('rejects a scorecard where score exceeds maxScore', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1', type: 'CALL' });
    (prisma.coachingRubric.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'rub1',
      tenantId: TENANT,
      criteria: [{ key: 'talk_ratio', label: 'Talk Ratio', weight: 1, maxScore: 10 }],
    });

    await expect(
      service.createScorecard(TENANT, ORG, REVIEWER, {
        activityId: 'act1',
        rubricId: 'rub1',
        criteriaScores: [{ key: 'talk_ratio', label: 'x', score: 15, maxScore: 10 }],
      }),
    ).rejects.toThrow('exceeds its max');
  });

  it('creates a valid scorecard and computes total/max score', async () => {
    (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act1', type: 'CALL' });
    (prisma.coachingRubric.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'rub1',
      tenantId: TENANT,
      criteria: [
        { key: 'talk_ratio', label: 'Talk Ratio', weight: 1, maxScore: 10 },
        { key: 'objections', label: 'Objections', weight: 1, maxScore: 10 },
      ],
    });
    (prisma.callScorecard.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'sc1', ...data }));

    const result = await service.createScorecard(TENANT, ORG, REVIEWER, {
      activityId: 'act1',
      rubricId: 'rub1',
      criteriaScores: [
        { key: 'talk_ratio', label: 'Talk Ratio', score: 8, maxScore: 10 },
        { key: 'objections', label: 'Objections', score: 6, maxScore: 10 },
      ],
      talkRatio: 45,
      nextStepsSet: true,
    });

    expect(result.totalScore).toBe(14);
    expect(result.maxScore).toBe(20);
    expect(result.status).toBe('SUBMITTED');
  });

  it('acknowledges a scorecard, setting status and timestamp', async () => {
    (prisma.callScorecard.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sc1', tenantId: TENANT, status: 'SUBMITTED', rubric: {}, activity: {},
    });
    (prisma.callScorecard.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'sc1', ...data }));

    const result = await service.acknowledgeScorecard(TENANT, 'sc1');
    expect(result.status).toBe('ACKNOWLEDGED');
    expect(prisma.callScorecard.update).toHaveBeenCalled();
  });

  it('computes a rep coaching summary averaging score % and talk ratio', async () => {
    (prisma.callScorecard.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { totalScore: 8, maxScore: 10, talkRatio: 40, objectionHandlingScore: null, nextStepsSet: true, createdAt: new Date() },
      { totalScore: 6, maxScore: 10, talkRatio: 60, objectionHandlingScore: null, nextStepsSet: false, createdAt: new Date() },
    ]);

    const summary = await service.getRepCoachingSummary(TENANT, 'rep1');
    expect(summary.scorecardsReviewed).toBe(2);
    expect(summary.averageScorePct).toBe(70);
    expect(summary.averageTalkRatio).toBe(50);
    expect(summary.nextStepsSetRate).toBe(50);
  });

  it('returns an empty-state rep summary when no scorecards exist', async () => {
    (prisma.callScorecard.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const summary = await service.getRepCoachingSummary(TENANT, 'rep1');
    expect(summary.scorecardsReviewed).toBe(0);
    expect(summary.averageScorePct).toBeNull();
  });

  it('adds a coaching library item with tags', async () => {
    (prisma.coachingLibraryItem.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: never) => Promise.resolve({ id: 'lib1', ...data }));
    const result = await service.createLibraryItem(TENANT, ORG, 'user1', {
      title: 'Great objection handling example',
      category: 'OBJECTION_HANDLING',
      tags: ['pricing'],
    });
    expect(result.category).toBe('OBJECTION_HANDLING');
    expect(result.tags).toEqual(['pricing']);
  });
});
