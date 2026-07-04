import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class PeriodManagementService {
  constructor(private readonly glService: GlAccountingService) {}

  async getFinancialPeriods(tenantId: string) {
    return prisma.financialPeriod.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getFinancialPeriodById(tenantId: string, periodId: string) {
    const period = await prisma.financialPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Financial period not found');
    return period;
  }

  async createFinancialPeriod(tenantId: string, orgId: string, dto: { name: string; startDate: string; endDate: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.financialPeriod.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'OPEN',
      },
    });
  }

  /**
   * Close a financial period after running validation checks.
   * Prevents posting to the GL during the closed period.
   */
  async closePeriod(tenantId: string, periodId: string) {
    const period = await prisma.financialPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Financial period not found');
    if (period.status === 'CLOSED') {
      throw new BadRequestException('Period is already closed.');
    }

    // Run validation checks
    const validationResults = await this.runPeriodCloseChecks(tenantId, period);
    const hasBlockingErrors = validationResults.some((v) => v.severity === 'ERROR' && !v.passed);

    if (hasBlockingErrors) {
      throw new BadRequestException({
        message: 'Period close validation failed. Fix the blocking errors before closing.',
        checks: validationResults,
      });
    }

    const updated = await prisma.financialPeriod.update({
      where: { id: periodId },
      data: { status: 'CLOSED' },
    });

    await this.glService.logAudit(prisma, tenantId, 'FinancialPeriod', periodId, 'CLOSE', { name: period.name }, 'system');
    return { ...updated, validationChecks: validationResults };
  }

  /**
   * Reopen a previously closed financial period (requires special permissions).
   */
  async reopenPeriod(tenantId: string, periodId: string, reason: string) {
    const period = await prisma.financialPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Financial period not found');
    if (period.status !== 'CLOSED') {
      throw new BadRequestException('Only CLOSED periods can be reopened.');
    }

    const updated = await prisma.financialPeriod.update({
      where: { id: periodId },
      data: { status: 'OPEN' },
    });

    await this.glService.logAudit(
      prisma,
      tenantId,
      'FinancialPeriod',
      periodId,
      'REOPEN',
      { reason },
      'system',
    );
    return updated;
  }

  /**
   * Run period-end validation checks (unposted journals, unbalanced accounts, etc.)
   */
  async getPeriodCloseChecklist(tenantId: string, periodId: string) {
    const period = await prisma.financialPeriod.findFirst({ where: { id: periodId, tenantId } });
    if (!period) throw new NotFoundException('Financial period not found');
    return this.runPeriodCloseChecks(tenantId, period);
  }

  private async runPeriodCloseChecks(
    tenantId: string,
    period: { startDate: Date; endDate: Date; orgId: string },
  ) {
    const checks: Array<{ check: string; passed: boolean; severity: 'ERROR' | 'WARNING'; detail: string }> = [];

    // Check 1: No unposted journals in the period
    const draftJournals = await prisma.journal.count({
      where: {
        tenantId,
        orgId: period.orgId,
        date: { gte: period.startDate, lte: period.endDate },
        status: { in: ['DRAFT', 'SUBMITTED'] },
      },
    });
    checks.push({
      check: 'No unposted journals',
      passed: draftJournals === 0,
      severity: 'ERROR',
      detail: draftJournals > 0 ? `${draftJournals} unposted journal(s) found.` : 'All journals are posted.',
    });

    // Check 2: Trial balance is balanced
    const entries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        journal: { orgId: period.orgId, date: { lte: period.endDate }, status: 'POSTED' },
      },
    });
    const totalDebits = entries.reduce((s, e) => s + Number(e.debit), 0);
    const totalCredits = entries.reduce((s, e) => s + Number(e.credit), 0);
    checks.push({
      check: 'Trial balance is balanced',
      passed: Math.abs(totalDebits - totalCredits) < 0.01,
      severity: 'ERROR',
      detail:
        Math.abs(totalDebits - totalCredits) < 0.01
          ? 'Trial balance is balanced.'
          : `Trial balance is off by ${(totalDebits - totalCredits).toFixed(2)}.`,
    });

    // Check 3: No open bank reconciliations
    const openReconciliations = await prisma.bankReconciliation.count({
      where: {
        tenantId,
        status: { in: ['DRAFT', 'IN_PROGRESS'] },
      },
    });
    checks.push({
      check: 'All bank reconciliations completed',
      passed: openReconciliations === 0,
      severity: 'WARNING',
      detail:
        openReconciliations > 0
          ? `${openReconciliations} open reconciliation(s).`
          : 'All reconciliations are complete.',
    });

    // Check 4: No unpaid expense reports
    const unpaidExpenses = await prisma.expenseReport.count({
      where: {
        tenantId,
        orgId: period.orgId,
        status: 'APPROVED',
      },
    });
    checks.push({
      check: 'All approved expenses paid',
      passed: unpaidExpenses === 0,
      severity: 'WARNING',
      detail:
        unpaidExpenses > 0
          ? `${unpaidExpenses} approved but unpaid expense report(s).`
          : 'All approved expenses are paid.',
    });

    return checks;
  }
}
