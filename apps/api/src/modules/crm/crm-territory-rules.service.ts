import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { z } from 'zod';

export const createTerritoryRuleSchema = z.object({
  territoryId: z.string().min(1),
  name: z.string().min(1).max(150),
  ruleType: z.enum(['GEOGRAPHY', 'INDUSTRY', 'COMPANY_SIZE', 'ROUND_ROBIN']),
  priority: z.number().int().min(0).default(0),
  conditions: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});
export const updateTerritoryRuleSchema = createTerritoryRuleSchema.partial();
export type CreateTerritoryRuleInput = z.infer<typeof createTerritoryRuleSchema>;
export type UpdateTerritoryRuleInput = z.infer<typeof updateTerritoryRuleSchema>;

export const assignLeadSchema = z.object({
  leadId: z.string().min(1),
});
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

interface RuleConditions {
  countries?: string[];
  regions?: string[];
  industries?: string[];
  minEmployees?: number;
  maxEmployees?: number;
  minRevenue?: number;
  maxRevenue?: number;
}

/**
 * Territory Assignment Rules Engine.
 *
 * Auto-routes Leads to a `SalesTerritory` (and, where a round-robin rule
 * applies, to a specific `SalesTeamMember`) based on ordered, prioritized
 * rules matching geography, industry, or company-size criteria. Every
 * assignment decision is written to `TerritoryAssignmentLog` for auditability
 * (mirrors how Salesforce/Dynamics territory management explains "why was
 * this routed here").
 */
@Injectable()
export class CrmTerritoryRulesService {
  async listRules(tenantId: string, territoryId?: string) {
    return prisma.territoryAssignmentRule.findMany({
      where: { tenantId, deletedAt: null, ...(territoryId ? { territoryId } : {}) },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: { territory: { select: { id: true, name: true } } },
    });
  }

  async getRule(tenantId: string, id: string) {
    const rule = await prisma.territoryAssignmentRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!rule) throw new NotFoundException('Territory assignment rule not found');
    return rule;
  }

  async createRule(tenantId: string, orgId: string, dto: CreateTerritoryRuleInput, createdBy: string) {
    const territory = await prisma.salesTerritory.findFirst({ where: { id: dto.territoryId, tenantId, deletedAt: null } });
    if (!territory) throw new NotFoundException('Territory not found');
    return prisma.territoryAssignmentRule.create({
      data: {
        tenantId,
        orgId,
        territoryId: dto.territoryId,
        name: dto.name,
        ruleType: dto.ruleType,
        priority: dto.priority ?? 0,
        conditions: dto.conditions ?? {},
        isActive: dto.isActive ?? true,
        createdBy,
      },
    });
  }

  async updateRule(tenantId: string, id: string, dto: UpdateTerritoryRuleInput) {
    const existing = await prisma.territoryAssignmentRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Territory assignment rule not found');
    return prisma.territoryAssignmentRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.ruleType !== undefined ? { ruleType: dto.ruleType } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.conditions !== undefined ? { conditions: dto.conditions } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.territoryId !== undefined ? { territoryId: dto.territoryId } : {}),
      },
    });
  }

  async deleteRule(tenantId: string, id: string) {
    const existing = await prisma.territoryAssignmentRule.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Territory assignment rule not found');
    return prisma.territoryAssignmentRule.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getAssignmentLog(tenantId: string, entityType?: string, entityId?: string) {
    return prisma.territoryAssignmentLog.findMany({
      where: { tenantId, ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private matchesConditions(lead: { industry: string | null; employeeCount: number | null; annualRevenue: unknown; country: string | null; region: string | null }, ruleType: string, conditions: RuleConditions): boolean {
    if (ruleType === 'ROUND_ROBIN') return true;
    if (ruleType === 'GEOGRAPHY') {
      const countryOk = !conditions.countries?.length || (lead.country != null && conditions.countries.includes(lead.country));
      const regionOk = !conditions.regions?.length || (lead.region != null && conditions.regions.includes(lead.region));
      if (!conditions.countries?.length && !conditions.regions?.length) return false;
      return countryOk && regionOk;
    }
    if (ruleType === 'INDUSTRY') {
      if (!conditions.industries?.length) return false;
      return lead.industry != null && conditions.industries.includes(lead.industry);
    }
    if (ruleType === 'COMPANY_SIZE') {
      const emp = lead.employeeCount;
      const rev = lead.annualRevenue != null ? Number(lead.annualRevenue) : null;
      let ok = false;
      if (conditions.minEmployees !== undefined || conditions.maxEmployees !== undefined) {
        if (emp == null) return false;
        if (conditions.minEmployees !== undefined && emp < conditions.minEmployees) return false;
        if (conditions.maxEmployees !== undefined && emp > conditions.maxEmployees) return false;
        ok = true;
      }
      if (conditions.minRevenue !== undefined || conditions.maxRevenue !== undefined) {
        if (rev == null) return false;
        if (conditions.minRevenue !== undefined && rev < conditions.minRevenue) return false;
        if (conditions.maxRevenue !== undefined && rev > conditions.maxRevenue) return false;
        ok = true;
      }
      return ok;
    }
    return false;
  }

  /** Picks the next territory member using a persisted round-robin cursor. */
  private async nextRoundRobinMember(tenantId: string, territoryId: string): Promise<string | null> {
    const members = await prisma.salesTeamMember.findMany({ where: { tenantId, territoryId }, orderBy: { createdAt: 'asc' } });
    if (members.length === 0) return null;
    const state = await prisma.territoryRoundRobinState.findUnique({ where: { tenantId_territoryId: { tenantId, territoryId } } });
    const nextIndex = ((state?.lastMemberIndex ?? -1) + 1) % members.length;
    await prisma.territoryRoundRobinState.upsert({
      where: { tenantId_territoryId: { tenantId, territoryId } },
      create: { tenantId, territoryId, lastMemberIndex: nextIndex },
      update: { lastMemberIndex: nextIndex },
    });
    return members[nextIndex]?.userId ?? null;
  }

  /**
   * Evaluates active rules for a Lead in priority order (highest first),
   * assigns the Lead to the first matching territory (and a specific rep if
   * the matching rule is ROUND_ROBIN), and writes an audit log row. Returns
   * `{ matched: false }` if no rule matched (Lead is left unassigned).
   */
  async assignLead(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, tenantId, deletedAt: null } });
    if (!lead) throw new NotFoundException('Lead not found');

    const rules = await prisma.territoryAssignmentRule.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    for (const rule of rules) {
      const conditions = (rule.conditions ?? {}) as RuleConditions;
      if (!this.matchesConditions(lead, rule.ruleType, conditions)) continue;

      let assignedToId: string | null = lead.assignedToId;
      let reason = `Matched rule "${rule.name}" (${rule.ruleType})`;
      if (rule.ruleType === 'ROUND_ROBIN') {
        const memberId = await this.nextRoundRobinMember(tenantId, rule.territoryId);
        if (memberId) {
          assignedToId = memberId;
          reason += ` — round-robin assigned to team member ${memberId}`;
        }
      }

      await prisma.lead.update({ where: { id: leadId }, data: { assignedToId } });
      await prisma.territoryAssignmentLog.create({
        data: {
          tenantId,
          entityType: 'LEAD',
          entityId: leadId,
          territoryId: rule.territoryId,
          ruleId: rule.id,
          assignedToId,
          reason,
        },
      });
      return { matched: true, territoryId: rule.territoryId, ruleId: rule.id, assignedToId };
    }

    await prisma.territoryAssignmentLog.create({
      data: { tenantId, entityType: 'LEAD', entityId: leadId, reason: 'No territory rule matched' },
    });
    return { matched: false };
  }

  /** Bulk re-runs assignment for every open (non-converted) lead — used after rule changes. */
  async reassignAllOpenLeads(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId, deletedAt: null, status: { notIn: ['CONVERTED', 'DISQUALIFIED'] } },
      select: { id: true },
    });
    if (leads.length > 500) throw new BadRequestException('Too many open leads for a synchronous bulk reassignment (limit 500); narrow the query.');
    const results = [];
    for (const l of leads) {
      results.push(await this.assignLead(tenantId, l.id));
    }
    return { processed: results.length, matched: results.filter((r) => r.matched).length };
  }
}
