import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

const cadenceStepSchema = z.object({
  channel: z.enum(['EMAIL', 'CALL', 'TASK', 'LINKEDIN']).default('EMAIL'),
  templateId: z.string().optional(),
  subject: z.string().max(200).optional(),
  instructions: z.string().max(2000).optional(),
  delayDays: z.number().int().min(0).default(1),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const createCadenceSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  steps: z.array(cadenceStepSchema).min(1),
});
export type CreateCadenceInput = z.infer<typeof createCadenceSchema>;

export const createAutoEnrollRuleSchema = z.object({
  sequenceId: z.string().min(1),
  name: z.string().min(1).max(150),
  entityType: z.enum(['LEAD', 'CONTACT']).default('LEAD'),
  conditions: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});
export const updateAutoEnrollRuleSchema = createAutoEnrollRuleSchema.partial();
export type CreateAutoEnrollRuleInput = z.infer<typeof createAutoEnrollRuleSchema>;
export type UpdateAutoEnrollRuleInput = z.infer<typeof updateAutoEnrollRuleSchema>;

export const completeStepTaskSchema = z.object({
  status: z.enum(['COMPLETED', 'SKIPPED']),
  notes: z.string().max(2000).optional(),
});
export type CompleteStepTaskInput = z.infer<typeof completeStepTaskSchema>;

interface EnrollConditions {
  industries?: string[];
  minScore?: number;
  sourceIds?: string[];
}

/**
 * Multi-channel Sales Cadences ("sequences" deepened into a full cadence
 * engine): extends the existing `EmailSequence`/`EmailSequenceStep` model
 * with a `channel` (EMAIL/CALL/TASK/LINKEDIN) per step, auto-enrollment
 * rules that watch new Leads/Contacts, and a due-step processor that either
 * queues the next email send (existing behaviour) or materializes a
 * `CadenceStepTask` for a rep to manually complete (call/task/LinkedIn
 * touchpoints) — mirroring Salesforce Sales Engagement / HubSpot Sequences.
 */
@Injectable()
export class CrmCadencesService {
  async createCadence(tenantId: string, orgId: string, dto: CreateCadenceInput, createdBy: string) {
    return prisma.emailSequence.create({
      data: {
        tenantId,
        orgId,
        name: dto.name,
        description: dto.description,
        createdBy,
        steps: {
          create: dto.steps.map((s) => ({
            channel: s.channel,
            templateId: s.channel === 'EMAIL' ? s.templateId ?? null : null,
            subject: s.subject,
            instructions: s.instructions,
            delayDays: s.delayDays,
            sortOrder: s.sortOrder,
          })),
        },
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getCadence(tenantId: string, id: string) {
    const cadence = await prisma.emailSequence.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { steps: { orderBy: { sortOrder: 'asc' } }, autoEnrollRules: true },
    });
    if (!cadence) throw new NotFoundException('Cadence not found');
    return cadence;
  }

  // ── Auto-enroll rules ─────────────────────────

  async listAutoEnrollRules(tenantId: string, sequenceId?: string) {
    return prisma.cadenceAutoEnrollRule.findMany({
      where: { tenantId, deletedAt: null, ...(sequenceId ? { sequenceId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAutoEnrollRule(tenantId: string, orgId: string, dto: CreateAutoEnrollRuleInput) {
    const sequence = await prisma.emailSequence.findFirst({ where: { id: dto.sequenceId, tenantId, deletedAt: null } });
    if (!sequence) throw new NotFoundException('Cadence not found');
    return prisma.cadenceAutoEnrollRule.create({
      data: {
        tenantId,
        orgId,
        sequenceId: dto.sequenceId,
        name: dto.name,
        entityType: dto.entityType ?? 'LEAD',
        conditions: dto.conditions ?? {},
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateAutoEnrollRule(tenantId: string, id: string, dto: UpdateAutoEnrollRuleInput) {
    const existing = await prisma.cadenceAutoEnrollRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Auto-enroll rule not found');
    return prisma.cadenceAutoEnrollRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.entityType !== undefined ? { entityType: dto.entityType } : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteAutoEnrollRule(tenantId: string, id: string) {
    const existing = await prisma.cadenceAutoEnrollRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Auto-enroll rule not found');
    return prisma.cadenceAutoEnrollRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private matchesLead(lead: { industry: string | null; score: number; sourceId: string | null }, conditions: EnrollConditions): boolean {
    if (conditions.industries?.length && (!lead.industry || !conditions.industries.includes(lead.industry))) return false;
    if (conditions.minScore !== undefined && lead.score < conditions.minScore) return false;
    if (conditions.sourceIds?.length && (!lead.sourceId || !conditions.sourceIds.includes(lead.sourceId))) return false;
    return true;
  }

  /** Evaluates all active LEAD auto-enroll rules against one lead and enrolls it in any matching, not-yet-enrolled cadence. */
  async evaluateAutoEnrollForLead(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');
    const rules = await prisma.cadenceAutoEnrollRule.findMany({ where: { tenantId, isActive: true, deletedAt: null, entityType: 'LEAD' } });
    const enrolled: string[] = [];
    for (const rule of rules) {
      if (!this.matchesLead(lead, (rule.conditions ?? {}) as EnrollConditions)) continue;
      const already = await prisma.emailSequenceEnrollment.findFirst({ where: { tenantId, sequenceId: rule.sequenceId, leadId, status: 'ACTIVE' } });
      if (already) continue;
      const firstStep = await prisma.emailSequenceStep.findFirst({ where: { sequenceId: rule.sequenceId }, orderBy: { sortOrder: 'asc' } });
      const nextSendAt = new Date();
      if (firstStep) nextSendAt.setDate(nextSendAt.getDate() + firstStep.delayDays);
      await prisma.emailSequenceEnrollment.create({ data: { tenantId, sequenceId: rule.sequenceId, leadId, nextSendAt } });
      enrolled.push(rule.sequenceId);
    }
    return { leadId, enrolledInSequenceIds: enrolled };
  }

  /**
   * Processes every enrollment whose current step is due (`nextSendAt <=
   * now`, status ACTIVE). EMAIL steps are marked ready for the existing
   * mailer to pick up (advances the cursor immediately, matching prior
   * behaviour); CALL/TASK/LINKEDIN steps instead materialize a
   * `CadenceStepTask` for a rep and only advance once that task is marked
   * COMPLETED or SKIPPED. Designed to be invoked by a scheduler; exposed here
   * as a plain callable (no `@Cron` elsewhere in apps/api/src — see
   * card-spend-limit.service.ts for the same convention) plus a manual
   * "run now" endpoint.
   */
  async processDueSteps(tenantId: string) {
    const due = await prisma.emailSequenceEnrollment.findMany({
      where: { tenantId, status: 'ACTIVE', nextSendAt: { lte: new Date() } },
      include: { sequence: { include: { steps: { orderBy: { sortOrder: 'asc' } } } } },
      take: 200,
    });

    let advanced = 0;
    let tasksCreated = 0;
    for (const enrollment of due) {
      const steps = enrollment.sequence.steps;
      const step = steps[enrollment.currentStep];
      if (!step) {
        await prisma.emailSequenceEnrollment.update({ where: { id: enrollment.id }, data: { status: 'COMPLETED', completedAt: new Date(), nextSendAt: null } });
        continue;
      }

      if (step.channel !== 'EMAIL') {
        const existingTask = await prisma.cadenceStepTask.findFirst({ where: { enrollmentId: enrollment.id, stepId: step.id } });
        if (!existingTask) {
          await prisma.cadenceStepTask.create({
            data: { tenantId, enrollmentId: enrollment.id, stepId: step.id, channel: step.channel, dueAt: new Date() },
          });
          tasksCreated++;
        }
        // Non-email steps pause the cursor until the rep completes the task (see completeStepTask()).
        continue;
      }

      const nextStep = steps[enrollment.currentStep + 1];
      const nextSendAt = nextStep ? new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000) : null;
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: enrollment.currentStep + 1,
          nextSendAt,
          status: nextStep ? 'ACTIVE' : 'COMPLETED',
          completedAt: nextStep ? null : new Date(),
        },
      });
      advanced++;
    }
    return { evaluated: due.length, emailStepsAdvanced: advanced, tasksCreated };
  }

  /** Rep marks a CALL/TASK/LINKEDIN step task done (or skipped), which advances the enrollment to the next step. */
  async completeStepTask(tenantId: string, taskId: string, dto: CompleteStepTaskInput, completedBy: string) {
    const task = await prisma.cadenceStepTask.findFirst({ where: { id: taskId, tenantId }, include: { enrollment: { include: { sequence: { include: { steps: { orderBy: { sortOrder: 'asc' } } } } } } } });
    if (!task) throw new NotFoundException('Cadence step task not found');
    if (task.status !== 'PENDING') throw new BadRequestException('Task already resolved');

    await prisma.cadenceStepTask.update({ where: { id: taskId }, data: { status: dto.status, completedAt: new Date(), completedBy, notes: dto.notes } });

    const enrollment = task.enrollment;
    const steps = enrollment.sequence.steps;
    const nextStep = steps[enrollment.currentStep + 1];
    const nextSendAt = nextStep ? new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000) : null;
    await prisma.emailSequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: enrollment.currentStep + 1,
        nextSendAt,
        status: nextStep ? 'ACTIVE' : 'COMPLETED',
        completedAt: nextStep ? null : new Date(),
      },
    });
    return { taskId, status: dto.status, enrollmentAdvancedToStep: enrollment.currentStep + 1 };
  }

  async listMyStepTasks(tenantId: string, status?: string) {
    return prisma.cadenceStepTask.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: { step: true, enrollment: { include: { sequence: { select: { name: true } } } } },
      orderBy: { dueAt: 'asc' },
      take: 200,
    });
  }
}
