import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const createSlaPolicySchema = z.object({
  name: z.string().min(1),
  entity: z.enum(['CASE']).default('CASE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  firstResponseMins: z.number().int().min(1),
  resolutionMins: z.number().int().min(1),
  businessHoursId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});
export const updateSlaPolicySchema = createSlaPolicySchema.partial();
export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;
export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;

/**
 * SLA policies + breach detection. On case create/priority-change we resolve
 * the matching policy and stamp response/resolution deadlines. A scheduled
 * scan writes SlaBreach rows for any deadline that has passed on an open case.
 */
@Injectable()
export class CrmSlaService {
  async listPolicies(tenantId: string) {
    return prisma.slaPolicy.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getPolicy(tenantId: string, id: string) {
    const p = await prisma.slaPolicy.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('SLA policy not found');
    return p;
  }

  async createPolicy(tenantId: string, dto: CreateSlaPolicyInput) {
    return prisma.slaPolicy.create({
      data: {
        tenantId,
        name: dto.name,
        entity: dto.entity ?? 'CASE',
        priority: dto.priority,
        firstResponseMins: dto.firstResponseMins,
        resolutionMins: dto.resolutionMins,
        businessHoursId: dto.businessHoursId ?? null,
        active: dto.active ?? true,
      },
    });
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdateSlaPolicyInput) {
    await this.getPolicy(tenantId, id);
    return prisma.slaPolicy.update({ where: { id }, data: dto });
  }

  async deletePolicy(tenantId: string, id: string) {
    await this.getPolicy(tenantId, id);
    return prisma.slaPolicy.delete({ where: { id } });
  }

  async applyToCase(tenantId: string, caseId: string) {
    const kase = await prisma.case.findFirst({ where: { id: caseId, tenantId } });
    if (!kase) return null;
    const policy = await prisma.slaPolicy.findFirst({
      where: { tenantId, entity: 'CASE', priority: kase.priority, active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!policy) return null;

    const base = kase.createdAt.getTime();
    const firstResp = new Date(base + policy.firstResponseMins * 60_000);
    const resolveBy = new Date(base + policy.resolutionMins * 60_000);

    await prisma.case.update({
      where: { id: caseId },
      data: {
        slaFirstResponseAt: firstResp,
        slaResolveBy: resolveBy,
        slaBreached: false,
      },
    });
    return { caseId, policyId: policy.id, slaFirstResponseAt: firstResp, slaResolveBy: resolveBy };
  }

  async listBreaches(tenantId: string) {
    return prisma.slaBreach.findMany({ where: { tenantId }, orderBy: { breachedAt: 'desc' } });
  }

  async detectBreaches(tenantId: string) {
    const now = new Date();
    const openCases = await prisma.case.findMany({
      where: { tenantId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
      select: {
        id: true,
        priority: true,
        firstResponseAt: true,
        slaFirstResponseAt: true,
        slaResolveBy: true,
        slaBreached: true,
      },
    });

    let created = 0;
    let markedBreached = 0;

    for (const kase of openCases) {
      const policy = await prisma.slaPolicy.findFirst({
        where: { tenantId, entity: 'CASE', priority: kase.priority, active: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!policy) continue;

      const events: Array<'FIRST_RESPONSE' | 'RESOLUTION'> = [];
      if (kase.slaFirstResponseAt && !kase.firstResponseAt && kase.slaFirstResponseAt < now) events.push('FIRST_RESPONSE');
      if (kase.slaResolveBy && kase.slaResolveBy < now) events.push('RESOLUTION');

      for (const breachType of events) {
        const existing = await prisma.slaBreach.findFirst({
          where: { tenantId, entity: 'CASE', entityId: kase.id, policyId: policy.id, breachType },
        });
        if (!existing) {
          await prisma.slaBreach.create({
            data: {
              tenantId,
              entity: 'CASE',
              entityId: kase.id,
              policyId: policy.id,
              breachType,
              breachedAt: now,
            },
          });
          created++;
        }
      }

      if (events.length > 0 && !kase.slaBreached) {
        await prisma.case.update({ where: { id: kase.id }, data: { slaBreached: true } });
        markedBreached++;
      }
    }

    return { scanned: openCases.length, breachesCreated: created, casesMarked: markedBreached };
  }
}
