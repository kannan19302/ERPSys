import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { GlAccountingService } from './gl-accounting.service';
import { CardSpendLimitService } from './card-spend-limit.service';
import { BudgetControlService } from './budget-control.service';

const SECOND_APPROVAL_THRESHOLD = 2000;

@Injectable()
export class ExpenseManagementService {
  constructor(
    private readonly glService: GlAccountingService,
    private readonly cardSpendLimitService: CardSpendLimitService,
    private readonly budgetControlService?: BudgetControlService,
  ) {}

  // ── Expense Reports ──────────────────────────────────────────

  async getExpenseReports(tenantId: string) {
    const reports = await prisma.expenseReport.findMany({
      where: { tenantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    const employeeIds = reports.map((r) => r.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });
    const employeeMap = new Map(employees.map((e) => [e.id, e]));
    return reports.map((r) => ({
      ...r,
      employee: employeeMap.get(r.employeeId) || null,
    }));
  }

  async getExpenseReportById(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({
      where: { id: reportId, tenantId },
      include: { items: { include: { cardTransaction: true } } },
    });
    if (!report) throw new NotFoundException('Expense report not found');
    const employee = await prisma.employee.findFirst({
      where: { id: report.employeeId, tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    return {
      ...report,
      employee: employee || null,
    };
  }

  async createExpenseReport(tenantId: string, orgId: string, dto: Record<string, unknown>) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.expenseReport.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId, status: 'DRAFT' } as never,
    });
  }

  private async recalcReportTotal(reportId: string) {
    const items = await prisma.expenseReportItem.findMany({ where: { expenseReportId: reportId } });
    const total = items.reduce((sum, i) => sum + Number(i.amount) + Number(i.taxAmount), 0);
    const hasPolicyViolation = items.some((i) => i.policyViolation);
    await prisma.expenseReport.update({
      where: { id: reportId },
      data: {
        totalAmount: new Prisma.Decimal(total.toFixed(2)),
        hasPolicyViolation,
        requiresSecondApproval: total > SECOND_APPROVAL_THRESHOLD,
      },
    });
    return total;
  }

  private assertDraft(report: { status: string } | null) {
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'DRAFT') {
      throw new BadRequestException('Expense items can only be modified while the report is DRAFT.');
    }
  }

  // ── Expense Items (CRUD + policy checks) ─────────────────────

  async addExpenseItem(
    tenantId: string,
    reportId: string,
    dto: {
      category: string;
      description: string;
      merchant?: string;
      amount: number;
      taxAmount?: number;
      receiptUrl?: string;
      expenseDate: string;
      billable?: boolean;
      isMileage?: boolean;
      mileageDistance?: number;
      isPerDiem?: boolean;
      perDiemDays?: number;
      perDiemLocation?: string;
    },
  ) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    this.assertDraft(report);

    let amount = dto.amount;
    let mileageRateApplied: number | null = null;
    let perDiemRateApplied: number | null = null;

    if (dto.isMileage) {
      const rate = await prisma.mileageRate.findFirst({
        where: { tenantId, effectiveDate: { lte: new Date(dto.expenseDate) } },
        orderBy: { effectiveDate: 'desc' },
      });
      if (!rate) throw new BadRequestException('No mileage rate configured for this date.');
      mileageRateApplied = Number(rate.ratePerMile);
      amount = Number((mileageRateApplied * (dto.mileageDistance || 0)).toFixed(2));
    }

    if (dto.isPerDiem) {
      const rate = await prisma.perDiemRate.findFirst({
        where: { tenantId, location: dto.perDiemLocation || 'DEFAULT', isActive: true },
      });
      if (!rate) throw new BadRequestException('No per-diem rate configured for this location.');
      perDiemRateApplied = Number(rate.dailyRate);
      amount = Number((perDiemRateApplied * (dto.perDiemDays || 0)).toFixed(2));
    }

    const { violation, reason } = await this.checkPolicy(tenantId, dto.category, amount, !!dto.receiptUrl);

    const item = await prisma.expenseReportItem.create({
      data: {
        tenantId,
        expenseReportId: reportId,
        category: dto.category,
        description: dto.description,
        merchant: dto.merchant || null,
        amount: new Prisma.Decimal(amount),
        taxAmount: new Prisma.Decimal(dto.taxAmount || 0),
        receiptUrl: dto.receiptUrl || null,
        expenseDate: new Date(dto.expenseDate),
        billable: !!dto.billable,
        isMileage: !!dto.isMileage,
        mileageDistance: dto.mileageDistance != null ? new Prisma.Decimal(dto.mileageDistance) : null,
        mileageRateApplied: mileageRateApplied != null ? new Prisma.Decimal(mileageRateApplied) : null,
        isPerDiem: !!dto.isPerDiem,
        perDiemDays: dto.perDiemDays != null ? new Prisma.Decimal(dto.perDiemDays) : null,
        perDiemRateApplied: perDiemRateApplied != null ? new Prisma.Decimal(perDiemRateApplied) : null,
        policyViolation: violation,
        policyViolationReason: reason,
      },
    });
    await this.recalcReportTotal(reportId);
    return item;
  }

  async updateExpenseItem(tenantId: string, itemId: string, dto: Record<string, unknown>) {
    const item = await prisma.expenseReportItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new NotFoundException('Expense item not found');
    const report = await prisma.expenseReport.findFirst({ where: { id: item.expenseReportId, tenantId } });
    this.assertDraft(report);

    const nextAmount = dto.amount != null ? Number(dto.amount) : Number(item.amount);
    const nextCategory = (dto.category as string) || item.category;
    const nextReceipt = dto.receiptUrl != null ? String(dto.receiptUrl) : item.receiptUrl;
    const { violation, reason } = await this.checkPolicy(tenantId, nextCategory, nextAmount, !!nextReceipt);

    const updated = await prisma.expenseReportItem.update({
      where: { id: itemId },
      data: {
        ...(dto as Prisma.ExpenseReportItemUpdateInput),
        policyViolation: violation,
        policyViolationReason: reason,
      },
    });
    await this.recalcReportTotal(item.expenseReportId);
    return updated;
  }

  async deleteExpenseItem(tenantId: string, itemId: string) {
    const item = await prisma.expenseReportItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new NotFoundException('Expense item not found');
    const report = await prisma.expenseReport.findFirst({ where: { id: item.expenseReportId, tenantId } });
    this.assertDraft(report);
    await prisma.expenseReportItem.delete({ where: { id: itemId } });
    await this.recalcReportTotal(item.expenseReportId);
    return { deleted: true };
  }

  private async checkPolicy(
    tenantId: string,
    category: string,
    amount: number,
    hasReceipt: boolean,
  ): Promise<{ violation: boolean; reason: string | null }> {
    const policy = await prisma.expenseCategoryPolicy.findFirst({
      where: { tenantId, category, isActive: true },
    });
    if (!policy) return { violation: false, reason: null };
    const reasons: string[] = [];
    if (policy.maxAmountPerItem != null && amount > Number(policy.maxAmountPerItem)) {
      reasons.push(`Exceeds per-item limit of ${policy.maxAmountPerItem} for ${category}`);
    }
    if (Number(policy.receiptRequiredAbove) > 0 && amount > Number(policy.receiptRequiredAbove) && !hasReceipt) {
      reasons.push(`Receipt required for ${category} expenses above ${policy.receiptRequiredAbove}`);
    }
    return { violation: reasons.length > 0, reason: reasons.length ? reasons.join('; ') : null };
  }

  // ── OCR Receipt Capture (simulated extraction pipeline) ──────

  async scanReceipt(_tenantId: string, dto: { fileName: string; rawText?: string }) {
    const text = dto.rawText || '';
    const amountMatch = text.match(/(?:total|amount)\s*[:$]?\s*\$?([0-9]+\.[0-9]{2})/i) || text.match(/\$\s?([0-9]+\.[0-9]{2})/);
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/) || text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    const merchantMatch = text.split('\n').find((l) => l.trim().length > 2) || dto.fileName.replace(/\.[a-z]+$/i, '');

    const extracted = {
      merchant: merchantMatch?.trim().slice(0, 100) || 'Unknown Merchant',
      amount: amountMatch ? Number(amountMatch[1]) : null,
      date: dateMatch ? dateMatch[1] : null,
      suggestedCategory: this.guessCategory(text),
    };
    const confidence = [extracted.merchant !== 'Unknown Merchant', extracted.amount != null, extracted.date != null].filter(Boolean).length / 3;

    return {
      fileName: dto.fileName,
      extracted,
      ocrConfidence: Number(confidence.toFixed(2)),
      ocrRaw: { rawText: text, scannedAt: new Date().toISOString() },
    };
  }

  private guessCategory(text: string): string {
    const lower = text.toLowerCase();
    if (/hotel|lodging|inn|resort/.test(lower)) return 'TRAVEL';
    if (/restaurant|cafe|coffee|meal|diner/.test(lower)) return 'MEALS';
    if (/uber|lyft|taxi|flight|airline|train/.test(lower)) return 'TRAVEL';
    if (/office|staples|supplies/.test(lower)) return 'OFFICE';
    if (/electric|water|utility|utilities/.test(lower)) return 'UTILITIES';
    return 'OTHER';
  }

  async attachOcrToItem(tenantId: string, itemId: string, ocrRaw: Record<string, unknown>, ocrConfidence: number) {
    const item = await prisma.expenseReportItem.findFirst({ where: { id: itemId, tenantId: tenantId } });
    if (!item) throw new NotFoundException('Expense item not found');
    return prisma.expenseReportItem.update({
      where: { id: itemId },
      data: { ocrRaw: ocrRaw as never, ocrConfidence },
    });
  }

  // ── Approval Workflow ─────────────────────────────────────────

  async submitExpenseReport(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT expense reports can be submitted.');
    }
    const itemCount = await prisma.expenseReportItem.count({ where: { expenseReportId: reportId } });
    if (itemCount === 0) {
      throw new BadRequestException('Cannot submit an expense report with no line items.');
    }

    // Budget checking
    if (this.budgetControlService) {
      const config = await this.budgetControlService.getControlConfig(tenantId);
      if (config.checkExpenses) {
        let expenseAccount = await prisma.account.findFirst({
          where: { tenantId, code: '6100-EXP-REIMB', isActive: true },
        });
        if (expenseAccount) {
          await this.budgetControlService.checkBudgetLimit(
            tenantId,
            report.orgId,
            expenseAccount.id,
            Number(report.totalAmount),
            new Date(),
          );
        }
      }
    }

    return prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'SUBMITTED' },
    });
  }

  async approveExpenseReport(tenantId: string, reportId: string, approvedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED expense reports can be approved.');
    }
    const nextStatus = report.requiresSecondApproval ? 'PENDING_SECOND_APPROVAL' : 'APPROVED';
    const updated = await prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: nextStatus, approvedBy, approvedAt: new Date() },
    });
    await this.glService.logAudit(prisma, tenantId, 'ExpenseReport', reportId, 'APPROVE', { approvedBy, nextStatus }, approvedBy);
    return updated;
  }

  async secondApproveExpenseReport(tenantId: string, reportId: string, approvedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'PENDING_SECOND_APPROVAL') {
      throw new BadRequestException('Only reports PENDING_SECOND_APPROVAL can receive second-level approval.');
    }
    const updated = await prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'APPROVED', secondApprovedBy: approvedBy, secondApprovedAt: new Date() },
    });
    await this.glService.logAudit(prisma, tenantId, 'ExpenseReport', reportId, 'SECOND_APPROVE', { approvedBy }, approvedBy);
    return updated;
  }

  async rejectExpenseReport(tenantId: string, reportId: string, reason: string, rejectedBy: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'SUBMITTED' && report.status !== 'PENDING_SECOND_APPROVAL') {
      throw new BadRequestException('Only SUBMITTED or PENDING_SECOND_APPROVAL expense reports can be rejected.');
    }
    const updated = await prisma.expenseReport.update({
      where: { id: reportId },
      data: {
        status: 'REJECTED',
        description: `${report.description || ''}\n[REJECTED by ${rejectedBy}]: ${reason}`.trim(),
        approvedBy: rejectedBy,
        approvedAt: new Date(),
      },
    });
    await this.glService.logAudit(prisma, tenantId, 'ExpenseReport', reportId, 'REJECT', { reason, rejectedBy }, rejectedBy);
    return updated;
  }

  async markExpenseReportPaid(tenantId: string, reportId: string) {
    const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
    if (!report) throw new NotFoundException('Expense report not found');
    if (report.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED expense reports can be marked as paid.');
    }

    const journal = await this.postReimbursementJournal(tenantId, report);
    if (!journal) throw new BadRequestException('Failed to post reimbursement journal.');

    return prisma.expenseReport.update({
      where: { id: reportId },
      data: { status: 'PAID', paidAt: new Date(), glJournalId: journal.id },
    });
  }

  private async postReimbursementJournal(
    tenantId: string,
    report: { id: string; orgId: string; totalAmount: Prisma.Decimal; reportNumber: string },
  ) {
    let expenseAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: report.orgId, code: '6100-EXP-REIMB', isActive: true },
    });
    if (!expenseAccount) {
      expenseAccount = await prisma.account.create({
        data: {
          tenantId,
          orgId: report.orgId,
          code: '6100-EXP-REIMB',
          name: 'Employee Expense Reimbursements',
          type: 'EXPENSE',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }
    let cashAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: report.orgId, type: 'ASSET', name: 'Cash' },
    });
    if (!cashAccount) {
      cashAccount = await prisma.account.create({
        data: {
          tenantId,
          orgId: report.orgId,
          code: '1000-CASH',
          name: 'Cash',
          type: 'ASSET',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    return this.glService.createJournal(tenantId, report.orgId, {
      entryNumber: `EXP-REIMB-${report.reportNumber}`,
      notes: `Expense reimbursement for report ${report.reportNumber}`,
      entries: [
        { accountId: expenseAccount.id, debit: Number(report.totalAmount), credit: 0, description: 'Expense reimbursement' },
        { accountId: cashAccount.id, debit: 0, credit: Number(report.totalAmount), description: 'Cash paid out' },
      ],
    });
  }

  // ── Category Policies ──────────────────────────────────────────

  async getPolicies(tenantId: string) {
    return prisma.expenseCategoryPolicy.findMany({ where: { tenantId }, orderBy: { category: 'asc' } });
  }

  async upsertPolicy(
    tenantId: string,
    dto: { category: string; maxAmountPerItem?: number | null; receiptRequiredAbove?: number; isActive?: boolean },
  ) {
    return prisma.expenseCategoryPolicy.upsert({
      where: { tenantId_category: { tenantId, category: dto.category } },
      create: {
        tenantId,
        category: dto.category,
        maxAmountPerItem: dto.maxAmountPerItem != null ? new Prisma.Decimal(dto.maxAmountPerItem) : null,
        receiptRequiredAbove: new Prisma.Decimal(dto.receiptRequiredAbove ?? 0),
        isActive: dto.isActive ?? true,
      },
      update: {
        maxAmountPerItem: dto.maxAmountPerItem != null ? new Prisma.Decimal(dto.maxAmountPerItem) : null,
        receiptRequiredAbove: dto.receiptRequiredAbove != null ? new Prisma.Decimal(dto.receiptRequiredAbove) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deletePolicy(tenantId: string, id: string) {
    const policy = await prisma.expenseCategoryPolicy.findFirst({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException('Expense category policy not found');
    await prisma.expenseCategoryPolicy.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Mileage Rates ────────────────────────────────────────────

  async getMileageRates(tenantId: string) {
    return prisma.mileageRate.findMany({ where: { tenantId }, orderBy: { effectiveDate: 'desc' } });
  }

  async createMileageRate(tenantId: string, dto: { ratePerMile: number; effectiveDate: string; endDate?: string; notes?: string }) {
    return prisma.mileageRate.create({
      data: {
        tenantId,
        ratePerMile: new Prisma.Decimal(dto.ratePerMile),
        effectiveDate: new Date(dto.effectiveDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes || null,
      },
    });
  }

  // ── Per Diem Rates ───────────────────────────────────────────

  async getPerDiemRates(tenantId: string) {
    return prisma.perDiemRate.findMany({ where: { tenantId }, orderBy: { location: 'asc' } });
  }

  async upsertPerDiemRate(tenantId: string, dto: { location: string; dailyRate: number; currency?: string; isActive?: boolean }) {
    return prisma.perDiemRate.upsert({
      where: { tenantId_location: { tenantId, location: dto.location } },
      create: {
        tenantId,
        location: dto.location,
        dailyRate: new Prisma.Decimal(dto.dailyRate),
        currency: dto.currency || 'USD',
        isActive: dto.isActive ?? true,
      },
      update: {
        dailyRate: new Prisma.Decimal(dto.dailyRate),
        currency: dto.currency,
        isActive: dto.isActive,
      },
    });
  }

  // ── Corporate Cards ──────────────────────────────────────────

  async getCorporateCards(tenantId: string) {
    return prisma.corporateCard.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createCorporateCard(tenantId: string, dto: { employeeId: string; provider: string; last4: string; nickname?: string }) {
    return prisma.corporateCard.create({
      data: {
        tenantId,
        employeeId: dto.employeeId,
        provider: dto.provider,
        last4: dto.last4,
        nickname: dto.nickname || null,
      },
    });
  }

  async importCardTransactions(
    tenantId: string,
    cardId: string,
    transactions: Array<{ transactionDate: string; merchant: string; amount: number; mccCategory?: string }>,
  ) {
    const card = await prisma.corporateCard.findFirst({ where: { id: cardId, tenantId } });
    if (!card) throw new NotFoundException('Corporate card not found');

    const imported: unknown[] = [];
    const denied: Array<{ merchant: string; amount: number; reason: string | null }> = [];

    for (const t of transactions) {
      const auth = await this.cardSpendLimitService.checkAuthorization(tenantId, cardId, t.amount, t.mccCategory);
      if (!auth.allowed) {
        denied.push({ merchant: t.merchant, amount: t.amount, reason: auth.reason });
        continue;
      }
      const record = await prisma.corporateCardTransaction.create({
        data: {
          tenantId,
          cardId,
          transactionDate: new Date(t.transactionDate),
          merchant: t.merchant,
          amount: new Prisma.Decimal(t.amount),
        },
      });
      imported.push(record);
    }

    return { imported: imported.length, transactions: imported, denied };
  }

  async getUnmatchedCardTransactions(tenantId: string) {
    return prisma.corporateCardTransaction.findMany({
      where: { tenantId, status: 'UNMATCHED' },
      include: { card: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async matchCardTransactionToItem(tenantId: string, transactionId: string, itemId: string) {
    const transaction = await prisma.corporateCardTransaction.findFirst({ where: { id: transactionId, tenantId } });
    if (!transaction) throw new NotFoundException('Card transaction not found');
    const item = await prisma.expenseReportItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new NotFoundException('Expense item not found');

    await prisma.expenseReportItem.update({
      where: { id: itemId },
      data: { corporateCardTransactionId: transactionId },
    });
    return prisma.corporateCardTransaction.update({
      where: { id: transactionId },
      data: { status: 'MATCHED' },
    });
  }

  async ignoreCardTransaction(tenantId: string, transactionId: string) {
    const transaction = await prisma.corporateCardTransaction.findFirst({ where: { id: transactionId, tenantId } });
    if (!transaction) throw new NotFoundException('Card transaction not found');
    return prisma.corporateCardTransaction.update({
      where: { id: transactionId },
      data: { status: 'IGNORED' },
    });
  }

  // ── Analytics ────────────────────────────────────────────────

  async getExpenseAnalytics(tenantId: string) {
    const items = await prisma.expenseReportItem.findMany({
      where: { tenantId },
      select: { category: true, amount: true, taxAmount: true, policyViolation: true },
    });
    const byCategory = new Map<string, { total: number; count: number }>();
    let violations = 0;
    let totalSpend = 0;
    for (const item of items) {
      const amt = Number(item.amount) + Number(item.taxAmount);
      totalSpend += amt;
      if (item.policyViolation) violations += 1;
      const bucket = byCategory.get(item.category) || { total: 0, count: 0 };
      bucket.total += amt;
      bucket.count += 1;
      byCategory.set(item.category, bucket);
    }

    const reports = await prisma.expenseReport.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });

    return {
      totalSpend: Number(totalSpend.toFixed(2)),
      totalItems: items.length,
      policyViolations: violations,
      byCategory: Array.from(byCategory.entries()).map(([category, v]) => ({
        category,
        total: Number(v.total.toFixed(2)),
        count: v.count,
      })),
      byStatus: reports.map((r) => ({
        status: r.status,
        count: r._count._all,
        total: Number(r._sum.totalAmount || 0),
      })),
    };
  }
}
