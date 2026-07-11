import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmCadencesService } from '../crm-cadences.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    emailSequence: { create: vi.fn(), findFirst: vi.fn() },
    emailSequenceStep: { findFirst: vi.fn() },
    emailSequenceEnrollment: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    cadenceAutoEnrollRule: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    cadenceStepTask: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    lead: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

describe('CrmCadencesService', () => {
  let service: CrmCadencesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmCadencesService();
  });

  it('creates a cadence with mixed-channel steps', async () => {
    (prisma.emailSequence.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
      Promise.resolve({ id: 'seq1', ...data, steps: [{ channel: 'EMAIL' }, { channel: 'CALL' }] }),
    );
    const cadence = await service.createCadence(TENANT, 'org1', {
      name: 'Outbound Q3',
      steps: [
        { channel: 'EMAIL', templateId: 'tpl1', delayDays: 0, sortOrder: 0 },
        { channel: 'CALL', instructions: 'Call and pitch demo', delayDays: 2, sortOrder: 1 },
      ],
    }, 'user-1');
    expect(cadence.name).toBe('Outbound Q3');
    expect(prisma.emailSequence.create).toHaveBeenCalled();
  });

  it('enrolls a lead when it matches an auto-enroll rule and is not already enrolled', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-1', industry: 'SOFTWARE', score: 80, sourceId: null });
    (prisma.cadenceAutoEnrollRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'rule1', sequenceId: 'seq1', conditions: { minScore: 50 } },
    ]);
    (prisma.emailSequenceEnrollment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.emailSequenceStep.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ delayDays: 1 });
    (prisma.emailSequenceEnrollment.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.evaluateAutoEnrollForLead(TENANT, 'lead-1');
    expect(result.enrolledInSequenceIds).toEqual(['seq1']);
  });

  it('skips a rule whose score threshold is not met', async () => {
    (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'lead-2', industry: 'SOFTWARE', score: 10, sourceId: null });
    (prisma.cadenceAutoEnrollRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'rule1', sequenceId: 'seq1', conditions: { minScore: 50 } },
    ]);
    const result = await service.evaluateAutoEnrollForLead(TENANT, 'lead-2');
    expect(result.enrolledInSequenceIds).toEqual([]);
  });

  it('advances EMAIL steps immediately and creates a task for non-EMAIL steps', async () => {
    (prisma.emailSequenceEnrollment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'enr-1', currentStep: 0, tenantId: TENANT,
        sequence: { steps: [{ id: 's1', channel: 'EMAIL', sortOrder: 0 }, { id: 's2', channel: 'CALL', delayDays: 1, sortOrder: 1 }] },
      },
      {
        id: 'enr-2', currentStep: 1, tenantId: TENANT,
        sequence: { steps: [{ id: 's1', channel: 'EMAIL', sortOrder: 0 }, { id: 's2', channel: 'CALL', delayDays: 1, sortOrder: 1 }] },
      },
    ]);
    (prisma.emailSequenceEnrollment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.cadenceStepTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.cadenceStepTask.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.processDueSteps(TENANT);
    expect(result.evaluated).toBe(2);
    expect(result.emailStepsAdvanced).toBe(1);
    expect(result.tasksCreated).toBe(1);
  });

  it('completing a step task advances the enrollment to the next step', async () => {
    (prisma.cadenceStepTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'task1', status: 'PENDING',
      enrollment: { id: 'enr-1', currentStep: 1, sequence: { steps: [{ sortOrder: 0 }, { sortOrder: 1 }, { delayDays: 3, sortOrder: 2 }] } },
    });
    (prisma.cadenceStepTask.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (prisma.emailSequenceEnrollment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await service.completeStepTask(TENANT, 'task1', { status: 'COMPLETED' }, 'user-1');
    expect(result.enrollmentAdvancedToStep).toBe(2);
    expect(prisma.emailSequenceEnrollment.update).toHaveBeenCalled();
  });

  it('rejects completing an already-resolved task', async () => {
    (prisma.cadenceStepTask.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'task1', status: 'COMPLETED' });
    await expect(service.completeStepTask(TENANT, 'task1', { status: 'COMPLETED' }, 'user-1')).rejects.toThrow('already resolved');
  });
});
