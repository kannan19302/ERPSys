import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

const BREACH_FREEZE_THRESHOLD = 3;
const WARNING_THRESHOLD_PCT = 80;

function computePeriodEnd(start: Date, period: string): Date {
  const end = new Date(start);
  if (period === 'WEEKLY') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

@Injectable()
export class CardSpendLimitService {
  // ── Spend Limits (per card/employee/department) ────────────────

  async getCard(tenantId: string, cardId: string) {
    const card = await prisma.corporateCard.findFirst({ where: { id: cardId, tenantId } });
    if (!card) throw new NotFoundException('Corporate card not found');
    return card;
  }

  async createSpendLimit(
    tenantId: string,
    cardId: string,
    userId: string,
    dto: {
      scopeType: 'CARD' | 'EMPLOYEE' | 'DEPARTMENT';
      scopeId?: string;
      period: 'WEEKLY' | 'MONTHLY';
      amountCap: number;
    },
  ) {
    await this.getCard(tenantId, cardId);
    const periodStart = new Date();
    const periodEnd = computePeriodEnd(periodStart, dto.period);

    const limit = await prisma.cardSpendLimit.create({
      data: {
        tenantId,
        cardId,
        scopeType: dto.scopeType,
        scopeId: dto.scopeId || null,
        period: dto.period,
        amountCap: new Prisma.Decimal(dto.amountCap),
        currentSpend: new Prisma.Decimal(0),
        periodStart,
        periodEnd,
      },
    });
    await this.writeAuditLog(tenantId, limit.id, 'SPEND', userId, null, limit, 'CREATE');
    return limit;
  }

  async getSpendLimits(tenantId: string, cardId: string) {
    await this.getCard(tenantId, cardId);
    return prisma.cardSpendLimit.findMany({ where: { tenantId, cardId }, orderBy: { createdAt: 'desc' } });
  }

  async updateSpendLimit(
    tenantId: string,
    limitId: string,
    userId: string,
    dto: { amountCap?: number; isActive?: boolean },
  ) {
    const existing = await prisma.cardSpendLimit.findFirst({ where: { id: limitId, tenantId } });
    if (!existing) throw new NotFoundException('Spend limit not found');
    const updated = await prisma.cardSpendLimit.update({
      where: { id: limitId },
      data: {
        ...(dto.amountCap != null && { amountCap: new Prisma.Decimal(dto.amountCap) }),
        ...(dto.isActive != null && { isActive: dto.isActive }),
      },
    });
    await this.writeAuditLog(tenantId, limitId, 'SPEND', userId, existing, updated, 'UPDATE');
    return updated;
  }

  async deleteSpendLimit(tenantId: string, limitId: string, userId: string) {
    const existing = await prisma.cardSpendLimit.findFirst({ where: { id: limitId, tenantId } });
    if (!existing) throw new NotFoundException('Spend limit not found');
    await prisma.cardSpendLimit.delete({ where: { id: limitId } });
    await this.writeAuditLog(tenantId, limitId, 'SPEND', userId, existing, null, 'DELETE');
    return { deleted: true };
  }

  // ── Category (MCC) Limits ───────────────────────────────────────

  async createCategoryLimit(
    tenantId: string,
    cardId: string,
    userId: string,
    dto: { mccCategory: string; amountCap: number; period: 'WEEKLY' | 'MONTHLY' },
  ) {
    await this.getCard(tenantId, cardId);
    const periodStart = new Date();
    const periodEnd = computePeriodEnd(periodStart, dto.period);

    const limit = await prisma.cardCategoryLimit.create({
      data: {
        tenantId,
        cardId,
        mccCategory: dto.mccCategory,
        amountCap: new Prisma.Decimal(dto.amountCap),
        currentSpend: new Prisma.Decimal(0),
        period: dto.period,
        periodStart,
        periodEnd,
      },
    });
    await this.writeAuditLog(tenantId, limit.id, 'CATEGORY', userId, null, limit, 'CREATE');
    return limit;
  }

  async getCategoryLimits(tenantId: string, cardId: string) {
    await this.getCard(tenantId, cardId);
    return prisma.cardCategoryLimit.findMany({ where: { tenantId, cardId }, orderBy: { createdAt: 'desc' } });
  }

  async updateCategoryLimit(
    tenantId: string,
    limitId: string,
    userId: string,
    dto: { amountCap?: number; isActive?: boolean },
  ) {
    const existing = await prisma.cardCategoryLimit.findFirst({ where: { id: limitId, tenantId } });
    if (!existing) throw new NotFoundException('Category limit not found');
    const updated = await prisma.cardCategoryLimit.update({
      where: { id: limitId },
      data: {
        ...(dto.amountCap != null && { amountCap: new Prisma.Decimal(dto.amountCap) }),
        ...(dto.isActive != null && { isActive: dto.isActive }),
      },
    });
    await this.writeAuditLog(tenantId, limitId, 'CATEGORY', userId, existing, updated, 'UPDATE');
    return updated;
  }

  async deleteCategoryLimit(tenantId: string, limitId: string, userId: string) {
    const existing = await prisma.cardCategoryLimit.findFirst({ where: { id: limitId, tenantId } });
    if (!existing) throw new NotFoundException('Category limit not found');
    await prisma.cardCategoryLimit.delete({ where: { id: limitId } });
    await this.writeAuditLog(tenantId, limitId, 'CATEGORY', userId, existing, null, 'DELETE');
    return { deleted: true };
  }

  // ── Pre-Authorization Check ──────────────────────────────────────

  /**
   * Called before posting a corporate card transaction. Checks all active
   * spend limits (card-scoped) and category limits for the card against the
   * proposed amount. Denies if any cap would be exceeded; logs a BREACH audit
   * row and auto-freezes the card after 3+ breaches within the period.
   */
  async checkAuthorization(
    tenantId: string,
    cardId: string,
    amount: number,
    mccCategory?: string,
  ): Promise<{ allowed: boolean; reason: string | null }> {
    const card = await prisma.corporateCard.findFirst({ where: { id: cardId, tenantId } });
    if (!card) return { allowed: false, reason: 'Card not found' };
    if (card.isFrozen) return { allowed: false, reason: 'Card is frozen' };

    const employee = await prisma.employee.findFirst({ where: { id: card.employeeId, tenantId } });

    const now = new Date();
    // Only enforce limits whose scope actually applies to this card/transaction:
    // CARD-scoped limits always apply; EMPLOYEE-scoped only for the card's holder;
    // DEPARTMENT-scoped only for the card holder's department.
    const scopeFilter = {
      OR: [
        { scopeType: 'CARD' },
        { scopeType: 'EMPLOYEE', scopeId: card.employeeId },
        ...(employee?.departmentId ? [{ scopeType: 'DEPARTMENT', scopeId: employee.departmentId }] : []),
      ],
    };
    const spendLimits = await prisma.cardSpendLimit.findMany({
      where: {
        tenantId,
        cardId,
        isActive: true,
        periodStart: { lte: now },
        periodEnd: { gte: now },
        ...scopeFilter,
      },
    });
    for (const limit of spendLimits) {
      const reserved = await this.tryReserveSpend('cardSpendLimit', limit.id, amount);
      if (!reserved) {
        await this.recordBreach(tenantId, limit.id, 'SPEND', cardId);
        return { allowed: false, reason: `Exceeds ${limit.period} spend limit of ${limit.amountCap} for scope ${limit.scopeType}` };
      }
      await this.alertIfOverThreshold(tenantId, 'Card Spend Limit', Number(limit.currentSpend) + amount, Number(limit.amountCap));
    }

    let categoryLimits: Awaited<ReturnType<typeof prisma.cardCategoryLimit.findMany>> = [];
    if (mccCategory) {
      categoryLimits = await prisma.cardCategoryLimit.findMany({
        where: { tenantId, cardId, mccCategory, isActive: true, periodStart: { lte: now }, periodEnd: { gte: now } },
      });
      for (const limit of categoryLimits) {
        const reserved = await this.tryReserveSpend('cardCategoryLimit', limit.id, amount);
        if (!reserved) {
          // Roll back any spend-limit reservations already committed above for this transaction.
          for (const spendLimit of spendLimits) {
            await this.tryReserveSpend('cardSpendLimit', spendLimit.id, -amount);
          }
          await this.recordBreach(tenantId, limit.id, 'CATEGORY', cardId);
          return { allowed: false, reason: `Exceeds ${limit.period} category limit of ${limit.amountCap} for ${mccCategory}` };
        }
        await this.alertIfOverThreshold(tenantId, `Category Limit (${mccCategory})`, Number(limit.currentSpend) + amount, Number(limit.amountCap));
      }
    }

    return { allowed: true, reason: null };
  }

  /**
   * Atomically reserves `amount` against a limit's currentSpend, only if the
   * resulting spend does not exceed the cap. Uses a single conditional UPDATE
   * so concurrent calls against the same limit cannot both pass the check
   * and overshoot the cap (avoids the read-then-write TOCTOU race).
   * A negative `amount` releases a previously reserved amount (rollback).
   */
  private async tryReserveSpend(
    model: 'cardSpendLimit' | 'cardCategoryLimit',
    limitId: string,
    amount: number,
  ): Promise<boolean> {
    const table = model === 'cardSpendLimit' ? 'card_spend_limits' : 'card_category_limits';
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `UPDATE "${table}" SET current_spend = current_spend + $1, updated_at = now()
       WHERE id = $2 AND (current_spend + $1) <= amount_cap AND (current_spend + $1) >= 0
       RETURNING id`,
      amount,
      limitId,
    );
    return rows.length > 0;
  }

  private async alertIfOverThreshold(tenantId: string, label: string, newSpend: number, cap: number) {
    const pct = cap > 0 ? (newSpend / cap) * 100 : 0;
    if (pct >= 100) {
      await this.raiseThresholdAlert(tenantId, label, newSpend, cap, 'CRITICAL', 'reached/exceeded 100%');
    } else if (pct >= WARNING_THRESHOLD_PCT) {
      await this.raiseThresholdAlert(tenantId, label, newSpend, cap, 'WARNING', `crossed ${WARNING_THRESHOLD_PCT}%`);
    }
  }

  private async raiseThresholdAlert(
    tenantId: string,
    label: string,
    spend: number,
    cap: number,
    severity: 'WARNING' | 'CRITICAL',
    note: string,
  ) {
    try {
      await prisma.adminAlert.create({
        data: {
          tenantId,
          type: 'CARD_SPEND_THRESHOLD',
          severity,
          title: `${label} ${note}`,
          message: `Spend of ${spend.toFixed(2)} has ${note} of cap ${cap.toFixed(2)}.`,
          metadata: { label, spend, cap },
        },
      });
    } catch {
      /* alert creation should never block business operations */
    }
  }

  private async recordBreach(tenantId: string, limitId: string, limitType: 'SPEND' | 'CATEGORY', cardId: string) {
    await prisma.cardLimitAuditLog.create({
      data: { tenantId, limitId, limitType, action: 'BREACH', oldValue: Prisma.JsonNull, newValue: Prisma.JsonNull },
    });

    const model = limitType === 'SPEND' ? prisma.cardSpendLimit : prisma.cardCategoryLimit;
    const updated = await (model as { update: (args: unknown) => Promise<{ breachCount: number }> }).update({
      where: { id: limitId },
      data: { breachCount: { increment: 1 } },
    });

    if (updated.breachCount >= BREACH_FREEZE_THRESHOLD) {
      await prisma.corporateCard.update({ where: { id: cardId }, data: { isFrozen: true } });
      await this.raiseThresholdAlert(tenantId, 'Corporate Card', updated.breachCount, BREACH_FREEZE_THRESHOLD, 'CRITICAL', 'exceeded repeated breach threshold — card auto-frozen');
    }
  }

  // ── Utilization ───────────────────────────────────────────────

  async getUtilization(tenantId: string, cardId: string) {
    await this.getCard(tenantId, cardId);
    const [spendLimits, categoryLimits] = await Promise.all([
      prisma.cardSpendLimit.findMany({ where: { tenantId, cardId, isActive: true } }),
      prisma.cardCategoryLimit.findMany({ where: { tenantId, cardId, isActive: true } }),
    ]);

    const toUtil = (cap: Prisma.Decimal, spend: Prisma.Decimal) => {
      const capNum = Number(cap);
      const spendNum = Number(spend);
      return { spend: spendNum, cap: capNum, utilizationPct: capNum > 0 ? Number(((spendNum / capNum) * 100).toFixed(2)) : 0 };
    };

    return {
      spendLimits: spendLimits.map((l) => ({
        id: l.id,
        scopeType: l.scopeType,
        scopeId: l.scopeId,
        period: l.period,
        periodStart: l.periodStart,
        periodEnd: l.periodEnd,
        ...toUtil(l.amountCap, l.currentSpend),
      })),
      categoryLimits: categoryLimits.map((l) => ({
        id: l.id,
        mccCategory: l.mccCategory,
        period: l.period,
        periodStart: l.periodStart,
        periodEnd: l.periodEnd,
        ...toUtil(l.amountCap, l.currentSpend),
      })),
    };
  }

  // ── Freeze / Unfreeze ─────────────────────────────────────────

  async freezeCard(tenantId: string, cardId: string) {
    const card = await this.getCard(tenantId, cardId);
    if (card.isFrozen) return card;
    return prisma.corporateCard.update({ where: { id: cardId }, data: { isFrozen: true } });
  }

  async unfreezeCard(tenantId: string, cardId: string) {
    const card = await this.getCard(tenantId, cardId);
    if (!card.isFrozen) return card;
    return prisma.corporateCard.update({ where: { id: cardId }, data: { isFrozen: false } });
  }

  // ── Increase Requests ────────────────────────────────────────

  async requestLimitIncrease(
    tenantId: string,
    limitId: string,
    userId: string,
    dto: { requestedCap: number; reason?: string },
  ) {
    const limit = await prisma.cardSpendLimit.findFirst({ where: { id: limitId, tenantId } });
    if (!limit) throw new NotFoundException('Spend limit not found');
    if (dto.requestedCap <= Number(limit.amountCap)) {
      throw new BadRequestException('Requested cap must be greater than the current cap.');
    }
    return prisma.cardLimitIncreaseRequest.create({
      data: {
        tenantId,
        limitId,
        requestedByUserId: userId,
        currentCap: limit.amountCap,
        requestedCap: new Prisma.Decimal(dto.requestedCap),
        reason: dto.reason || null,
      },
    });
  }

  async approveLimitIncrease(tenantId: string, requestId: string, approverId: string) {
    const request = await prisma.cardLimitIncreaseRequest.findFirst({ where: { id: requestId, tenantId } });
    if (!request) throw new NotFoundException('Increase request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be approved.');
    }

    const limit = await prisma.cardSpendLimit.findFirst({ where: { id: request.limitId, tenantId } });
    if (!limit) throw new NotFoundException('Spend limit not found');

    const updatedLimit = await prisma.cardSpendLimit.update({
      where: { id: limit.id },
      data: { amountCap: request.requestedCap },
    });
    await this.writeAuditLog(tenantId, limit.id, 'SPEND', approverId, limit, updatedLimit, 'UPDATE');

    return prisma.cardLimitIncreaseRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedByUserId: approverId, approvedAt: new Date() },
    });
  }

  // ── Audit Trail ───────────────────────────────────────────────

  async getAuditTrail(tenantId: string, limitId: string) {
    return prisma.cardLimitAuditLog.findMany({
      where: { tenantId, limitId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async writeAuditLog(
    tenantId: string,
    limitId: string,
    limitType: 'SPEND' | 'CATEGORY',
    changedByUserId: string,
    oldValue: unknown,
    newValue: unknown,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
  ) {
    try {
      await prisma.cardLimitAuditLog.create({
        data: {
          tenantId,
          limitId,
          limitType,
          changedByUserId,
          oldValue: (oldValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: (newValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          action,
        },
      });
    } catch {
      /* audit log should never block the primary operation */
    }
  }

  // ── Period Auto-Reset ─────────────────────────────────────────

  /**
   * Zeroes currentSpend and rolls periodStart/periodEnd forward for limits
   * whose period has expired. Designed to be invoked by the existing
   * scheduler pattern (no @Cron usage currently exists elsewhere in
   * apps/api/src — exposed here as a callable service method so a future
   * scheduler module can wire it in without a cross-module import).
   *
   * Intentionally cross-tenant: this is a system batch job (not a request
   * handler), so it scans all tenants' expired limits in one pass; every
   * write below is still scoped to the row's own tenantId, so no tenant's
   * data is read or mutated using another tenant's context.
   */
  async resetExpiredPeriods(): Promise<{ spendLimitsReset: number; categoryLimitsReset: number }> {
    const now = new Date();
    const expiredSpendLimits = await prisma.cardSpendLimit.findMany({ where: { isActive: true, periodEnd: { lt: now } } });
    for (const limit of expiredSpendLimits) {
      const newStart = limit.periodEnd;
      const newEnd = computePeriodEnd(newStart, limit.period);
      await prisma.cardSpendLimit.update({
        where: { id: limit.id },
        data: { currentSpend: new Prisma.Decimal(0), periodStart: newStart, periodEnd: newEnd, breachCount: 0 },
      });
      await this.writeAuditLog(limit.tenantId, limit.id, 'SPEND', 'system', null, { periodStart: newStart, periodEnd: newEnd }, 'UPDATE');
    }

    const expiredCategoryLimits = await prisma.cardCategoryLimit.findMany({ where: { isActive: true, periodEnd: { lt: now } } });
    for (const limit of expiredCategoryLimits) {
      const newStart = limit.periodEnd;
      const newEnd = computePeriodEnd(newStart, limit.period);
      await prisma.cardCategoryLimit.update({
        where: { id: limit.id },
        data: { currentSpend: new Prisma.Decimal(0), periodStart: newStart, periodEnd: newEnd, breachCount: 0 },
      });
      await this.writeAuditLog(limit.tenantId, limit.id, 'CATEGORY', 'system', null, { periodStart: newStart, periodEnd: newEnd }, 'UPDATE');
    }

    return { spendLimitsReset: expiredSpendLimits.length, categoryLimitsReset: expiredCategoryLimits.length };
  }
}
