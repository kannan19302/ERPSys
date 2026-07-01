import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import {
  CreateSalesTargetInput, UpdateSalesTargetInput,
  CreateSalesTerritoryInput, UpdateSalesTerritoryInput, AddTeamMemberInput,
  CreateCommissionRuleInput, UpdateCommissionRuleInput, CalculateCommissionsInput,
} from '@unerp/shared';
import { resolveOrgId } from './crm-shared';

/**
 * Sales operations: quota/targets, territories & team assignments, and
 * commission rules plus their periodic calculation.
 */
@Injectable()
export class CrmSalesOpsService {
  // ── SALES TARGETS ─────────────────────────────

  async getSalesTargets(tenantId: string) {
    return prisma.salesTarget.findMany({ where: { tenantId }, orderBy: { period: 'desc' } });
  }

  async createSalesTarget(tenantId: string, orgId: string, dto: CreateSalesTargetInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.salesTarget.create({
      data: { tenantId, orgId: resolvedOrgId, userId: dto.userId || null, period: dto.period, targetType: dto.targetType || 'REVENUE', target: new Prisma.Decimal(dto.target) },
    });
  }

  async updateSalesTarget(tenantId: string, id: string, dto: UpdateSalesTargetInput) {
    const existing = await prisma.salesTarget.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Sales target not found');
    return prisma.salesTarget.update({
      where: { id },
      data: {
        ...(dto.target !== undefined && { target: new Prisma.Decimal(dto.target) }),
        ...(dto.period !== undefined && { period: dto.period }),
        ...(dto.targetType !== undefined && { targetType: dto.targetType }),
        ...(dto.userId !== undefined && { userId: dto.userId }),
      },
    });
  }

  async deleteSalesTarget(tenantId: string, id: string) {
    const existing = await prisma.salesTarget.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Sales target not found');
    return prisma.salesTarget.delete({ where: { id } });
  }

  // ── TERRITORIES ───────────────────────────────

  async getTerritories(tenantId: string) {
    return prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { members: true, children: { select: { id: true, name: true } }, parent: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createTerritory(tenantId: string, orgId: string, dto: CreateSalesTerritoryInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.salesTerritory.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name,
        description: dto.description || null,
        criteria: dto.criteria as Prisma.InputJsonValue || {},
        parentId: dto.parentId || null, managerId: dto.managerId || null,
      },
    });
  }

  async updateTerritory(tenantId: string, id: string, dto: UpdateSalesTerritoryInput) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Territory not found');
    return prisma.salesTerritory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.criteria !== undefined && { criteria: dto.criteria as Prisma.InputJsonValue }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
      },
    });
  }

  async deleteTerritory(tenantId: string, id: string) {
    const existing = await prisma.salesTerritory.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Territory not found');
    return prisma.salesTerritory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addTeamMember(tenantId: string, territoryId: string, dto: AddTeamMemberInput) {
    const territory = await prisma.salesTerritory.findFirst({ where: { id: territoryId, tenantId, deletedAt: null } });
    if (!territory) throw new NotFoundException('Territory not found');
    return prisma.salesTeamMember.create({ data: { tenantId, territoryId, userId: dto.userId, role: dto.role || 'REP' } });
  }

  async removeTeamMember(tenantId: string, territoryId: string, userId: string) {
    const member = await prisma.salesTeamMember.findFirst({ where: { territoryId, userId, tenantId } });
    if (!member) throw new NotFoundException('Team member not found');
    return prisma.salesTeamMember.delete({ where: { id: member.id } });
  }

  async getTerritoryPerformance(tenantId: string) {
    const territories = await prisma.salesTerritory.findMany({
      where: { tenantId, deletedAt: null },
      include: { members: true },
    });
    const results = [];
    for (const t of territories) {
      const memberIds = t.members.map((m) => m.userId);
      if (memberIds.length === 0) { results.push({ territoryId: t.id, name: t.name, deals: 0, revenue: 0, members: 0 }); continue; }
      const wonOpps = await prisma.opportunity.findMany({
        where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', assignedToId: { in: memberIds } },
        select: { amount: true },
      });
      results.push({
        territoryId: t.id, name: t.name, members: memberIds.length,
        deals: wonOpps.length, revenue: wonOpps.reduce((s, o) => s + Number(o.amount || 0), 0),
      });
    }
    return results.sort((a, b) => b.revenue - a.revenue);
  }

  // ── COMMISSIONS ───────────────────────────────

  async getCommissionRules(tenantId: string) {
    return prisma.commissionRule.findMany({ where: { tenantId }, include: { _count: { select: { entries: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createCommissionRule(tenantId: string, orgId: string, dto: CreateCommissionRuleInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.commissionRule.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, type: dto.type || 'PERCENTAGE',
        rate: new Prisma.Decimal(dto.rate), tiers: dto.tiers as Prisma.InputJsonValue,
        appliesToAll: dto.appliesToAll ?? true, productIds: dto.productIds as Prisma.InputJsonValue,
      },
    });
  }

  async updateCommissionRule(tenantId: string, id: string, dto: UpdateCommissionRuleInput) {
    const existing = await prisma.commissionRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    return prisma.commissionRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.rate !== undefined && { rate: new Prisma.Decimal(dto.rate) }),
        ...(dto.tiers !== undefined && { tiers: dto.tiers as Prisma.InputJsonValue }),
        ...(dto.appliesToAll !== undefined && { appliesToAll: dto.appliesToAll }),
        ...(dto.productIds !== undefined && { productIds: dto.productIds as Prisma.InputJsonValue }),
      },
    });
  }

  async deleteCommissionRule(tenantId: string, id: string) {
    const existing = await prisma.commissionRule.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Commission rule not found');
    return prisma.commissionRule.delete({ where: { id } });
  }

  async getCommissionEntries(tenantId: string, userId?: string) {
    const where: Prisma.CommissionEntryWhereInput = { tenantId };
    if (userId) where.userId = userId;
    return prisma.commissionEntry.findMany({ where, include: { rule: { select: { name: true, type: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async calculateCommissions(tenantId: string, dto: CalculateCommissionsInput) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);
    const rules = await prisma.commissionRule.findMany({ where: { tenantId, isActive: true } });
    const wonOpps = await prisma.opportunity.findMany({
      where: { tenantId, deletedAt: null, stage: 'CLOSED_WON', actualCloseDate: { gte: start, lte: end }, assignedToId: { not: null } },
      select: { id: true, amount: true, assignedToId: true },
    });
    const entries = [];
    for (const opp of wonOpps) {
      for (const rule of rules) {
        const amount = Number(opp.amount || 0);
        let commission = 0;
        if (rule.type === 'PERCENTAGE') commission = amount * Number(rule.rate) / 100;
        else if (rule.type === 'FLAT') commission = Number(rule.rate);
        else if (rule.type === 'TIERED') {
          const tiers = rule.tiers as Array<{ min: number; max: number; rate: number }>;
          for (const tier of tiers) { if (amount >= tier.min && amount <= tier.max) { commission = amount * tier.rate / 100; break; } }
        }
        if (commission > 0) {
          entries.push(await prisma.commissionEntry.create({
            data: { tenantId, userId: opp.assignedToId!, opportunityId: opp.id, ruleId: rule.id, amount: new Prisma.Decimal(commission), periodStart: start, periodEnd: end },
          }));
        }
      }
    }
    return { calculated: entries.length, entries };
  }
}
