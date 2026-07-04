import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

const ruleSchema = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'ne', 'contains']),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
export const segmentCriteriaSchema = z.object({
  combinator: z.enum(['AND', 'OR']).default('AND'),
  rules: z.array(ruleSchema).min(1),
});
export const createSegmentSchema = z.object({
  name: z.string().min(1),
  entity: z.enum(['CONTACT', 'LEAD', 'ACCOUNT']),
  criteria: segmentCriteriaSchema,
  isDynamic: z.boolean().optional(),
});
export const updateSegmentSchema = createSegmentSchema.partial();
export type CreateSegmentInput = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentInput = z.infer<typeof updateSegmentSchema>;
type Criteria = z.infer<typeof segmentCriteriaSchema>;

type Entity = 'CONTACT' | 'LEAD' | 'ACCOUNT';

/**
 * Dynamic segments: run a simple {combinator, rules[]} predicate against the
 * target entity and materialize matched ids into SegmentMember.
 */
@Injectable()
export class CrmSegmentsService {
  async listSegments(tenantId: string) {
    return prisma.segment.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getSegment(tenantId: string, id: string) {
    const seg = await prisma.segment.findFirst({ where: { id, tenantId } });
    if (!seg) throw new NotFoundException('Segment not found');
    return seg;
  }

  async createSegment(tenantId: string, dto: CreateSegmentInput) {
    return prisma.segment.create({
      data: {
        tenantId,
        name: dto.name,
        entity: dto.entity,
        criteria: dto.criteria as unknown as never,
        isDynamic: dto.isDynamic ?? true,
      },
    });
  }

  async updateSegment(tenantId: string, id: string, dto: UpdateSegmentInput) {
    await this.getSegment(tenantId, id);
    return prisma.segment.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.entity !== undefined ? { entity: dto.entity } : {}),
        ...(dto.isDynamic !== undefined ? { isDynamic: dto.isDynamic } : {}),
        ...(dto.criteria !== undefined ? { criteria: dto.criteria as unknown as never } : {}),
      },
    });
  }

  async deleteSegment(tenantId: string, id: string) {
    await this.getSegment(tenantId, id);
    return prisma.segment.delete({ where: { id } });
  }

  private matches(record: Record<string, unknown>, criteria: Criteria): boolean {
    const evalRule = (r: { field: string; op: string; value: unknown }): boolean => {
      const raw = record[r.field];
      switch (r.op) {
        case 'eq':
          return String(raw ?? '') === String(r.value ?? '');
        case 'ne':
          return String(raw ?? '') !== String(r.value ?? '');
        case 'contains':
          return raw != null && String(raw).toLowerCase().includes(String(r.value ?? '').toLowerCase());
        default:
          return false;
      }
    };
    if (criteria.combinator === 'OR') return criteria.rules.some(evalRule);
    return criteria.rules.every(evalRule);
  }

  private async fetchAll(tenantId: string, entity: Entity): Promise<Array<Record<string, unknown>>> {
    if (entity === 'LEAD') return prisma.lead.findMany({ where: { tenantId, deletedAt: null } }) as unknown as Promise<Array<Record<string, unknown>>>;
    if (entity === 'CONTACT') return prisma.contact.findMany({ where: { tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>;
    return prisma.customer.findMany({ where: { tenantId } }) as unknown as Promise<Array<Record<string, unknown>>>;
  }

  async evaluate(tenantId: string, segmentId: string) {
    const seg = await this.getSegment(tenantId, segmentId);
    const parsed = segmentCriteriaSchema.safeParse(seg.criteria);
    if (!parsed.success) throw new BadRequestException('Segment criteria are invalid');
    const criteria = parsed.data;

    const all = await this.fetchAll(tenantId, seg.entity as Entity);
    const matched = all.filter((r) => this.matches(r, criteria));

    await prisma.$transaction([
      prisma.segmentMember.deleteMany({ where: { segmentId } }),
      ...(matched.length > 0
        ? [
            prisma.segmentMember.createMany({
              data: matched.map((m) => ({ segmentId, entityId: String(m.id) })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return { segmentId, count: matched.length };
  }

  async listMembers(tenantId: string, segmentId: string) {
    await this.getSegment(tenantId, segmentId);
    return prisma.segmentMember.findMany({ where: { segmentId }, orderBy: { addedAt: 'desc' } });
  }
}
