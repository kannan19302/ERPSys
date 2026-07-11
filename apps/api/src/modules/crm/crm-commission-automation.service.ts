import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { resolveOrgId } from './crm-shared';

export const createPlanSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  effectiveStart: z.coerce.date(),
  effectiveEnd: z.coerce.date().optional(),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export const updatePlanSchema = createPlanSchema.partial().extend({ isActive: z.boolean().optional() });
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

export const createTierSchema = z.object({
  minAttainmentPct: z.number().min(0),
  maxAttainmentPct: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100),
  sortOrder: z.number().int().default(0),
});
export type CreateTierInput = z.infer<typeof createTierSchema>;

export const createSpiffSchema = z.object({
  planId: z.string().optional(),
  name: z.string().min(1).max(160),
  criteriaType: z.enum(['DEAL_SIZE_ABOVE', 'PRODUCT_LINE', 'NEW_LOGO', 'ATTAINMENT_ABOVE']),
  criteriaValue: z.record(z.any()).default({}),
  bonusType: z.enum(['FLAT', 'PERCENTAGE']).default('FLAT'),
  bonusAmount: z.number().min(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
export type CreateSpiffInput = z.infer<typeof createSpiffSchema>;
export const updateSpiffSchema = createSpiffSchema.partial().extend({ isActive: z.boolean().optional() });
export type UpdateSpiffInput = z.infer<typeof updateSpiffSchema>;

export const calculatePayoutsSchema = z.object({
  planId: z.string(),
  period: z.string().min(1),
});
export type CalculatePayoutsInput = z.infer<typeof calculatePayoutsSchema>;

const CLOSED_WON = ['CLOSED_WON', 'CLOSED WON'];

/** Resolves a payout "period" string ("2026-Q3", "2026-07", "2026") into a closed date range. */
function periodToRange(period: string): { start: Date; end: Date } {
  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]) - 1;
    return { start: new Date(Date.UTC(year, month, 1)), end: new Date(Date.UTC(year, month + 1, 1)) };
  }
  const quarterMatch = period.match(/^(\d{4})-Q([1-4])$/i);
  if (quarterMatch) {
    const year = Number(quarterMatch[1]);
    const q = Number(quarterMatch[2]);
    const startMonth = (q - 1) * 3;
    return { start: new Date(Date.UTC(year, startMonth, 1)), end: new Date(Date.UTC(year, startMonth + 3, 1)) };
  }
  const yearMatch = period.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
  }
  throw new BadRequestException(`Unrecognized period format: ${period}`);
}

/**
 * CRM Commission Plan Automation deepening (Up Next item 46).
 *
 * Additive to the pre-existing per-deal `CommissionRule`/`CommissionEntry`
 * (flat/percentage/tiered-by-deal-size, in `CrmSalesOpsService`). This service
 * adds the genuinely missing capability: quota-ATTAINMENT-based accelerator
 * tiers (a rep who blows past 100% of quota earns a higher rate on the whole
 * period's bookings, not just per-deal) plus SPIFF bonus rules — the Xactly/
 * CaptivateIQ/Spiff pattern.
 */
@Injectable()
export class CrmCommissionAutomationService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ── PLANS ──────────────────────────────────────

  async listPlans(tenantId: string) {
    return prisma.commissionPlan.findMany({
      where: { tenantId, deletedAt: null },
      include: { tiers: { orderBy: { sortOrder: 'asc' } }, _count: { select: { payouts: true, spiffs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlan(tenantId: string, id: string) {
    const plan = await prisma.commissionPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { tiers: { orderBy: { sortOrder: 'asc' } }, spiffs: true },
    });
    if (!plan) throw new NotFoundException('Commission plan not found');
    return plan;
  }

  async createPlan(tenantId: string, orgId: string, dto: CreatePlanInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    return prisma.commissionPlan.create({
      data: {
        tenantId, orgId: resolvedOrgId, name: dto.name, description: dto.description,
        effectiveStart: dto.effectiveStart, effectiveEnd: dto.effectiveEnd,
      },
    });
  }

  async updatePlan(tenantId: string, id: string, dto: UpdatePlanInput) {
    const existing = await prisma.commissionPlan.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Commission plan not found');
    return prisma.commissionPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.effectiveStart !== undefined && { effectiveStart: dto.effectiveStart }),
        ...(dto.effectiveEnd !== undefined && { effectiveEnd: dto.effectiveEnd }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deletePlan(tenantId: string, id: string) {
    const existing = await prisma.commissionPlan.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundException('Commission plan not found');
    return prisma.commissionPlan.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  // ── TIERS ──────────────────────────────────────

  async addTier(tenantId: string, planId: string, dto: CreateTierInput) {
    const plan = await prisma.commissionPlan.findFirst({ where: { id: planId, tenantId, deletedAt: null } });
    if (!plan) throw new NotFoundException('Commission plan not found');
    if (dto.maxAttainmentPct !== undefined && dto.maxAttainmentPct <= dto.minAttainmentPct) {
      throw new BadRequestException('maxAttainmentPct must be greater than minAttainmentPct');
    }
    return prisma.commissionPlanTier.create({
      data: {
        tenantId, planId,
        minAttainmentPct: new Prisma.Decimal(dto.minAttainmentPct),
        maxAttainmentPct: dto.maxAttainmentPct !== undefined ? new Prisma.Decimal(dto.maxAttainmentPct) : null,
        commissionRate: new Prisma.Decimal(dto.commissionRate),
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeTier(tenantId: string, tierId: string) {
    const existing = await prisma.commissionPlanTier.findFirst({ where: { id: tierId, tenantId } });
    if (!existing) throw new NotFoundException('Commission tier not found');
    return prisma.commissionPlanTier.delete({ where: { id: tierId } });
  }

  // ── SPIFFS ─────────────────────────────────────

  async listSpiffs(tenantId: string) {
    return prisma.commissionSpiff.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createSpiff(tenantId: string, orgId: string, dto: CreateSpiffInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    if (dto.planId) {
      const plan = await prisma.commissionPlan.findFirst({ where: { id: dto.planId, tenantId, deletedAt: null } });
      if (!plan) throw new NotFoundException('Commission plan not found');
    }
    return prisma.commissionSpiff.create({
      data: {
        tenantId, orgId: resolvedOrgId, planId: dto.planId, name: dto.name,
        criteriaType: dto.criteriaType, criteriaValue: dto.criteriaValue as Prisma.InputJsonValue,
        bonusType: dto.bonusType, bonusAmount: new Prisma.Decimal(dto.bonusAmount),
        startDate: dto.startDate, endDate: dto.endDate,
      },
    });
  }

  async updateSpiff(tenantId: string, id: string, dto: UpdateSpiffInput) {
    const existing = await prisma.commissionSpiff.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('SPIFF not found');
    return prisma.commissionSpiff.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.criteriaType !== undefined && { criteriaType: dto.criteriaType }),
        ...(dto.criteriaValue !== undefined && { criteriaValue: dto.criteriaValue as Prisma.InputJsonValue }),
        ...(dto.bonusType !== undefined && { bonusType: dto.bonusType }),
        ...(dto.bonusAmount !== undefined && { bonusAmount: new Prisma.Decimal(dto.bonusAmount) }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteSpiff(tenantId: string, id: string) {
    const existing = await prisma.commissionSpiff.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('SPIFF not found');
    return prisma.commissionSpiff.delete({ where: { id } });
  }

  // ── PAYOUT CALCULATION ─────────────────────────

  /** Calculate quota-attainment-tiered payouts (+ SPIFF bonuses) for every rep with a Quota row in this period. */
  async calculatePayouts(tenantId: string, orgId: string, dto: CalculatePayoutsInput) {
    const resolvedOrgId = await resolveOrgId(tenantId, orgId);
    const plan = await prisma.commissionPlan.findFirst({
      where: { id: dto.planId, tenantId, deletedAt: null },
      include: { tiers: { orderBy: { sortOrder: 'asc' } }, spiffs: { where: { isActive: true } } },
    });
    if (!plan) throw new NotFoundException('Commission plan not found');
    if (plan.tiers.length === 0) throw new BadRequestException('Plan has no attainment tiers configured');

    const { start, end } = periodToRange(dto.period);
    const quotas = await prisma.quota.findMany({ where: { tenantId, period: dto.period } });
    if (quotas.length === 0) throw new BadRequestException(`No Quota rows found for period "${dto.period}" — set rep quotas first`);

    const results = [];
    for (const quota of quotas) {
      const wonOpps = await prisma.opportunity.findMany({
        where: {
          tenantId, deletedAt: null, stage: { in: CLOSED_WON },
          assignedToId: quota.userId, actualCloseDate: { gte: start, lt: end },
        },
        select: { id: true, amount: true, name: true, customerId: true },
      });
      const attained = wonOpps.reduce((s, o) => s + Number(o.amount || 0), 0);
      const quotaAmount = Number(quota.amount);
      const attainmentPct = quotaAmount > 0 ? (attained / quotaAmount) * 100 : 0;

      const tier = plan.tiers.find((t) => {
        const min = Number(t.minAttainmentPct);
        const max = t.maxAttainmentPct !== null ? Number(t.maxAttainmentPct) : Infinity;
        return attainmentPct >= min && attainmentPct < max;
      }) ?? plan.tiers[plan.tiers.length - 1]!;
      const appliedRate = Number(tier.commissionRate);
      const tieredCommission = attained * (appliedRate / 100);

      // Evaluate SPIFFs against this rep's won deals for the period.
      let spiffBonus = 0;
      const spiffLines: Array<{ spiffId: string; amount: number; reason: string }> = [];
      for (const spiff of plan.spiffs) {
        if (spiff.startDate && spiff.startDate > end) continue;
        if (spiff.endDate && spiff.endDate < start) continue;
        if (spiff.criteriaType === 'ATTAINMENT_ABOVE') {
          const threshold = Number((spiff.criteriaValue as { pct?: number })?.pct ?? 0);
          if (attainmentPct >= threshold) {
            const amount = spiff.bonusType === 'FLAT' ? Number(spiff.bonusAmount) : attained * (Number(spiff.bonusAmount) / 100);
            spiffBonus += amount;
            spiffLines.push({ spiffId: spiff.id, amount, reason: `Attainment ${attainmentPct.toFixed(1)}% >= ${threshold}%` });
          }
        } else if (spiff.criteriaType === 'DEAL_SIZE_ABOVE') {
          const threshold = Number((spiff.criteriaValue as { amount?: number })?.amount ?? 0);
          for (const opp of wonOpps) {
            if (Number(opp.amount || 0) >= threshold) {
              const amount = spiff.bonusType === 'FLAT' ? Number(spiff.bonusAmount) : Number(opp.amount) * (Number(spiff.bonusAmount) / 100);
              spiffBonus += amount;
              spiffLines.push({ spiffId: spiff.id, amount, reason: `Deal "${opp.name}" >= ${threshold}` });
            }
          }
        } else if (spiff.criteriaType === 'NEW_LOGO') {
          for (const opp of wonOpps) {
            if (!opp.customerId) continue;
            const priorWins = await prisma.opportunity.count({
              where: { tenantId, customerId: opp.customerId, stage: { in: CLOSED_WON }, id: { not: opp.id }, actualCloseDate: { lt: start } },
            });
            if (priorWins === 0) {
              const amount = spiff.bonusType === 'FLAT' ? Number(spiff.bonusAmount) : Number(opp.amount || 0) * (Number(spiff.bonusAmount) / 100);
              spiffBonus += amount;
              spiffLines.push({ spiffId: spiff.id, amount, reason: `New-logo deal "${opp.name}"` });
            }
          }
        }
        // PRODUCT_LINE criteria intentionally left for a future line-item join (Opportunity has no product-line field yet).
      }

      const totalPayout = tieredCommission + spiffBonus;
      const payout = await prisma.commissionPayout.upsert({
        where: { tenantId_planId_userId_period: { tenantId, planId: plan.id, userId: quota.userId, period: dto.period } },
        create: {
          tenantId, orgId: resolvedOrgId, planId: plan.id, userId: quota.userId, period: dto.period,
          quotaAmount: new Prisma.Decimal(quotaAmount), attainedAmount: new Prisma.Decimal(attained),
          attainmentPct: new Prisma.Decimal(attainmentPct), appliedTierRate: new Prisma.Decimal(appliedRate),
          tieredCommission: new Prisma.Decimal(tieredCommission), spiffBonus: new Prisma.Decimal(spiffBonus),
          totalPayout: new Prisma.Decimal(totalPayout), status: 'DRAFT',
        },
        update: {
          quotaAmount: new Prisma.Decimal(quotaAmount), attainedAmount: new Prisma.Decimal(attained),
          attainmentPct: new Prisma.Decimal(attainmentPct), appliedTierRate: new Prisma.Decimal(appliedRate),
          tieredCommission: new Prisma.Decimal(tieredCommission), spiffBonus: new Prisma.Decimal(spiffBonus),
          totalPayout: new Prisma.Decimal(totalPayout), calculatedAt: new Date(), status: 'DRAFT',
        },
      });

      await prisma.commissionPayoutSpiffLine.deleteMany({ where: { tenantId, payoutId: payout.id } });
      if (spiffLines.length > 0) {
        await prisma.commissionPayoutSpiffLine.createMany({
          data: spiffLines.map((l) => ({ tenantId, payoutId: payout.id, spiffId: l.spiffId, amount: new Prisma.Decimal(l.amount), reason: l.reason })),
        });
      }
      results.push(payout);
      this.eventEmitter.emit('crm.commission.payout_calculated', { tenantId, userId: quota.userId, planId: plan.id, period: dto.period, totalPayout });
    }
    return results;
  }

  async listPayouts(tenantId: string, filters?: { planId?: string; period?: string; userId?: string }) {
    const rows = await prisma.commissionPayout.findMany({
      where: { tenantId, ...(filters?.planId ? { planId: filters.planId } : {}), ...(filters?.period ? { period: filters.period } : {}), ...(filters?.userId ? { userId: filters.userId } : {}) },
      include: { plan: { select: { name: true } }, spiffLines: true },
      orderBy: { calculatedAt: 'desc' },
    });
    const userIds = Array.from(new Set(rows.map((r) => r.userId)));
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true } });
    const userMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    return rows.map((r) => ({ ...r, userName: userMap.get(r.userId) ?? 'Unknown' }));
  }

  async getPayout(tenantId: string, id: string) {
    const payout = await prisma.commissionPayout.findFirst({
      where: { id, tenantId },
      include: { plan: true, spiffLines: { include: { spiff: true } } },
    });
    if (!payout) throw new NotFoundException('Payout not found');
    return payout;
  }

  async approvePayout(tenantId: string, id: string, approvedBy: string) {
    const payout = await prisma.commissionPayout.findFirst({ where: { id, tenantId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'DRAFT') throw new BadRequestException('Only DRAFT payouts can be approved');
    return prisma.commissionPayout.update({ where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } });
  }

  async markPaid(tenantId: string, id: string) {
    const payout = await prisma.commissionPayout.findFirst({ where: { id, tenantId } });
    if (!payout) throw new NotFoundException('Payout not found');
    if (payout.status !== 'APPROVED') throw new BadRequestException('Only APPROVED payouts can be marked paid');
    return prisma.commissionPayout.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
  }
}
