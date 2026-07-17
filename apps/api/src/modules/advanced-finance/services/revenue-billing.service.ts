import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class RevenueBillingService {
  private async resolveOrgId(tenantId: string): Promise<string> {
    const org = await prisma.organization.findFirst({ where: { tenantId } });
    return org?.id ?? 'org-system-default';
  }

  // ── BILLING RULES ──────────────────────────────────

  async listBillingRules(tenantId: string) {
    return prisma.billingRule.findMany({
      where: { tenantId, isActive: true },
      include: { milestones: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBillingRule(tenantId: string, id: string) {
    const r = await prisma.billingRule.findFirst({ where: { id, tenantId }, include: { milestones: true } });
    if (!r) throw new NotFoundException('Billing rule not found');
    return r;
  }

  async createBillingRule(tenantId: string, dto: {
    name: string; ruleType: string; customerId?: string; projectId?: string;
    contractId?: string; currency?: string; billingCycle?: string;
    fixedAmount?: number; hourlyRate?: number; glRevenueAccountId?: string;
    notes?: string;
  }) {
    return prisma.billingRule.create({ data: { tenantId, ...dto, isActive: true } });
  }

  async updateBillingRule(tenantId: string, id: string, dto: Partial<{
    name: string; isActive: boolean; fixedAmount: number; hourlyRate: number; notes: string;
  }>) {
    await this.getBillingRule(tenantId, id);
    return prisma.billingRule.update({ where: { id }, data: dto });
  }

  async deleteBillingRule(tenantId: string, id: string) {
    await this.getBillingRule(tenantId, id);
    return prisma.billingRule.delete({ where: { id } });
  }

  // ── BILLING MILESTONES ──────────────────────────────────

  async listMilestones(tenantId: string, billingRuleId?: string) {
    return prisma.billingMilestone.findMany({
      where: { tenantId, ...(billingRuleId && { billingRuleId }) },
      orderBy: { dueDate: 'asc' },
    });
  }

  async addMilestone(tenantId: string, billingRuleId: string, dto: {
    name: string; description?: string; dueDate?: string; amount: number;
  }) {
    await this.getBillingRule(tenantId, billingRuleId);
    return prisma.billingMilestone.create({
      data: {
        tenantId, billingRuleId,
        name: dto.name, description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        amount: dto.amount, status: 'PENDING',
      },
    });
  }

  async completeMilestone(tenantId: string, id: string) {
    const m = await prisma.billingMilestone.findFirst({ where: { id, tenantId } });
    if (!m) throw new NotFoundException('Milestone not found');
    return prisma.billingMilestone.update({ where: { id }, data: { status: 'COMPLETED', completionPct: 100, completedAt: new Date() } });
  }

  async triggerMilestoneInvoice(tenantId: string, id: string) {
    const m = await prisma.billingMilestone.findFirst({ where: { id, tenantId }, include: { billingRule: true } });
    if (!m) throw new NotFoundException('Milestone not found');
    if (m.status !== 'COMPLETED') throw new BadRequestException('Milestone must be COMPLETED before invoicing');
    if (!m.billingRule.customerId) throw new BadRequestException('Billing rule has no customer');
    // Create invoice
    const orgId = await this.resolveOrgId(tenantId);
    const invoiceNumber = `INV-MILE-${Date.now()}`;
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orgId,
        customerId: m.billingRule.customerId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        currency: m.billingRule.currency,
        totalAmount: Number(m.amount),
        taxAmount: 0,
        status: 'DRAFT',
      },
    });
    await prisma.billingMilestone.update({ where: { id }, data: { status: 'INVOICED', invoiceId: invoice.id } });
    return invoice;
  }

  // ── CONTRACT MODIFICATIONS ──────────────────────────────────

  async listContractModifications(tenantId: string, contractId?: string) {
    return prisma.contractModification.findMany({
      where: { tenantId, ...(contractId && { contractId }) },
      orderBy: { modificationDate: 'desc' },
    });
  }

  async createContractModification(tenantId: string, dto: {
    contractId: string; modificationDate: string; modType: string;
    originalValue: number; newValue: number; notes?: string;
  }) {
    const adjustment = dto.newValue - dto.originalValue;
    return prisma.contractModification.create({
      data: {
        tenantId,
        contractId: dto.contractId,
        modificationDate: new Date(dto.modificationDate),
        modType: dto.modType,
        originalValue: dto.originalValue,
        newValue: dto.newValue,
        cumulativeAdjustment: adjustment,
        notes: dto.notes,
        status: 'DRAFT',
      },
    });
  }

  async approveContractModification(tenantId: string, id: string) {
    const mod = await prisma.contractModification.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException('Contract modification not found');
    return prisma.contractModification.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  // ── DEFERRED REVENUE ROLL-FORWARD ──────────────────────────────────

  private calculateRecognizedAsOf(s: { totalAmount: unknown; startDate: Date; endDate: Date; recognitionType?: string }, date: Date): number {
    const total = Number(s.totalAmount);
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    
    if (date < start) return 0;
    if (date >= end) return total;
    
    const recType = (s.recognitionType || 'STRAIGHT_LINE').toUpperCase();
    const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
    const elapsedMonths = Math.min(totalMonths, Math.max(1, (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth()) + 1));
    
    if (recType === 'POINT_IN_TIME') {
      return date >= end ? total : 0;
    } else if (recType === 'PERCENTAGE_COMPLETION') {
      const pct = Math.min(1, elapsedMonths / totalMonths);
      return Math.round(total * pct * 100) / 100;
    } else {
      // STRAIGHT_LINE
      const monthlyAmount = total / totalMonths;
      return Math.min(total, Math.round(monthlyAmount * elapsedMonths * 100) / 100);
    }
  }

  async listDeferredRevenueRollForwards(tenantId: string) {
    return prisma.deferredRevenueRollForward.findMany({ where: { tenantId }, orderBy: { period: 'desc' } });
  }

  async computeDeferredRevenueRollForward(tenantId: string, period: string) {
    const orgId = await this.resolveOrgId(tenantId);
    const parts = (period || '').split('-');
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const month = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId },
    });

    let openingBalance = 0, addedAmount = 0, recognizedAmount = 0;
    for (const s of schedules) {
      const scheduleStart = new Date(s.startDate);
      if (scheduleStart >= start && scheduleStart <= end) {
        addedAmount += Number(s.totalAmount);
      }
      const recognizedAtStart = this.calculateRecognizedAsOf(s, start);
      const recognizedAtEnd = this.calculateRecognizedAsOf(s, end);
      
      const deferredAtStart = Number(s.totalAmount) - recognizedAtStart;
      const recognizedInPeriod = recognizedAtEnd - recognizedAtStart;
      
      openingBalance += deferredAtStart;
      recognizedAmount += recognizedInPeriod;
    }
    const closingBalance = openingBalance - recognizedAmount;

    return prisma.deferredRevenueRollForward.upsert({
      where: { tenantId_orgId_period: { tenantId, orgId, period } },
      create: { tenantId, orgId, period, openingBalance, addedAmount, recognizedAmount, closingBalance },
      update: { openingBalance, addedAmount, recognizedAmount, closingBalance },
    });
  }

  // ── TIERED PRICING TABLES ──────────────────────────────────

  async listTieredPricingTables(tenantId: string) {
    return prisma.tieredPricingTable.findMany({ where: { tenantId, isActive: true } });
  }

  async createTieredPricingTable(tenantId: string, dto: {
    name: string; currency?: string; unit?: string; tiers: { from: number; to?: number; ratePerUnit: number }[];
  }) {
    return prisma.tieredPricingTable.create({ data: { tenantId, ...dto, tiers: dto.tiers as never } });
  }

  async rateUsage(tenantId: string, tableId: string, usage: number) {
    const table = await prisma.tieredPricingTable.findFirst({ where: { id: tableId, tenantId } });
    if (!table) throw new NotFoundException('Pricing table not found');
    const tiers = table.tiers as { from: number; to?: number; ratePerUnit: number }[];
    let totalCost = 0;
    let remaining = usage;
    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierMax = tier.to !== undefined ? tier.to - tier.from : Infinity;
      const applicable = Math.min(remaining, tierMax);
      totalCost += applicable * tier.ratePerUnit;
      remaining -= applicable;
    }
    return { usage, totalCost: Math.round(totalCost * 100) / 100, currency: table.currency };
  }

  // ── REVENUE BACKLOG ──────────────────────────────────

  async getRevenueBacklog(tenantId: string) {
    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId, status: { not: 'COMPLETED' } },
    });
    const backlog = schedules.map(s => ({
      scheduleId: s.id,
      description: s.description,
      remainingObligation: Number(s.deferredAmount),
    }));
    return {
      totalContracts: backlog.length,
      totalRemainingObligation: backlog.reduce((s, b) => s + b.remainingObligation, 0),
      contracts: backlog,
    };
  }

  async getRevenueForecastVsActual(tenantId: string, periods: string[]) {
    const schedules = await prisma.revenueSchedule.findMany({ where: { tenantId } });
    const result = [];
    for (const period of periods) {
      const parts = period.split('-');
      const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
      const month = parts[1] ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      
      let scheduled = 0;
      let recognized = 0;
      for (const s of schedules) {
        const startRec = this.calculateRecognizedAsOf(s, start);
        const endRec = this.calculateRecognizedAsOf(s, end);
        recognized += (endRec - startRec);
        
        const scheduleStart = new Date(s.startDate);
        const scheduleEnd = new Date(s.endDate);
        if (scheduleStart <= end && scheduleEnd >= start) {
          const totalMonths = Math.max(1, (scheduleEnd.getFullYear() - scheduleStart.getFullYear()) * 12 + (scheduleEnd.getMonth() - scheduleStart.getMonth()) + 1);
          scheduled += Number(s.totalAmount) / totalMonths;
        }
      }
      
      result.push({
        period,
        scheduled: Math.round(scheduled * 100) / 100,
        recognized: Math.round(recognized * 100) / 100,
        variance: Math.round((recognized - scheduled) * 100) / 100,
      });
    }
    return result;
  }
}

