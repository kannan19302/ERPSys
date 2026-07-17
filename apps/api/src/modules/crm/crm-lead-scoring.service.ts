import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const createLeadScoringRuleSchema = z.object({
  name: z.string().min(1),
  field: z.string().min(1),
  operator: z.enum(['eq', 'ne', 'contains', 'gt', 'gte', 'lt', 'lte', 'exists']),
  value: z.string(),
  points: z.number().int(),
  active: z.boolean().optional(),
});
export const updateLeadScoringRuleSchema = createLeadScoringRuleSchema.partial();
export type CreateLeadScoringRuleInput = z.infer<typeof createLeadScoringRuleSchema>;
export type UpdateLeadScoringRuleInput = z.infer<typeof updateLeadScoringRuleSchema>;

/**
 * Configurable lead-scoring rules. Rules are evaluated against Lead fields
 * (and simple derived signals) and points are summed to produce Lead.score.
 */
@Injectable()
export class CrmLeadScoringService {
  async listRules(tenantId: string) {
    return prisma.leadScoringRule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async getRule(tenantId: string, id: string) {
    const rule = await prisma.leadScoringRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Lead scoring rule not found');
    return rule;
  }

  async createRule(tenantId: string, dto: CreateLeadScoringRuleInput) {
    return prisma.leadScoringRule.create({
      data: {
        tenantId,
        name: dto.name,
        field: dto.field,
        operator: dto.operator,
        value: dto.value,
        points: dto.points,
        active: dto.active ?? true,
      },
    });
  }

  async updateRule(tenantId: string, id: string, dto: UpdateLeadScoringRuleInput) {
    await this.getRule(tenantId, id);
    return prisma.leadScoringRule.update({ where: { id }, data: dto });
  }

  async deleteRule(tenantId: string, id: string) {
    await this.getRule(tenantId, id);
    return prisma.leadScoringRule.delete({ where: { id } });
  }

  private evalRule(lead: Record<string, unknown>, rule: { field: string; operator: string; value: string; points: number }): number {
    const raw = lead[rule.field];
    const target = rule.value;
    switch (rule.operator) {
      case 'exists':
        return raw != null && raw !== '' ? rule.points : 0;
      case 'eq':
        return String(raw) === target ? rule.points : 0;
      case 'ne':
        return String(raw) !== target ? rule.points : 0;
      case 'contains':
        return raw != null && String(raw).toLowerCase().includes(target.toLowerCase()) ? rule.points : 0;
      case 'gt':
        return typeof raw === 'number' && raw > Number(target) ? rule.points : 0;
      case 'gte':
        return typeof raw === 'number' && raw >= Number(target) ? rule.points : 0;
      case 'lt':
        return typeof raw === 'number' && raw < Number(target) ? rule.points : 0;
      case 'lte':
        return typeof raw === 'number' && raw <= Number(target) ? rule.points : 0;
      default:
        return 0;
    }
  }

  async recalculateScore(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId, deletedAt: null } });
    if (!lead) return;
    const rules = await prisma.leadScoringRule.findMany({ where: { tenantId, active: true } });
    let score = 0;
    for (const rule of rules) {
      score += this.evalRule(lead as unknown as Record<string, unknown>, rule);
    }
    await prisma.lead.update({ where: { id: leadId }, data: { score } });
    return { leadId, score };
  }

  async recalculateAll(tenantId: string) {
    const leads = await prisma.lead.findMany({ where: { tenantId, deletedAt: null }, select: { id: true } });
    let processed = 0;
    for (const l of leads) {
      await this.recalculateScore(tenantId, l.id);
      processed++;
    }
    return { processed };
  }
}
