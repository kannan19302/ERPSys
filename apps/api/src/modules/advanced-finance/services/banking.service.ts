import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class BankingService {
  constructor(private readonly glService: GlAccountingService) {}

  // ── BANK ACCOUNTS ──────────────────────────────────

  async getBankAccounts(tenantId: string) {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    const accountIds = bankAccounts.map((ba) => ba.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, tenantId },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));
    return bankAccounts.map((ba) => ({
      ...ba,
      account: accountMap.get(ba.accountId) || null,
    }));
  }

  async getBankAccountById(tenantId: string, bankAccountId: string) {
    const ba = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, tenantId },
    });
    if (!ba) throw new NotFoundException('Bank account not found');
    const account = await prisma.account.findFirst({
      where: { id: ba.accountId, tenantId },
    });
    return {
      ...ba,
      account: account || null,
    };
  }

  async createBankAccount(tenantId: string, orgId: string, dto: Record<string, unknown>) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.bankAccount.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  async updateBankAccount(
    tenantId: string,
    bankAccountId: string,
    dto: { bankName?: string; accountName?: string; status?: string },
  ) {
    const ba = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, tenantId } });
    if (!ba) throw new NotFoundException('Bank account not found');

    const data: Record<string, unknown> = {};
    if (dto.bankName !== undefined) data.bankName = dto.bankName;
    if (dto.accountName !== undefined) data.accountName = dto.accountName;
    if (dto.status !== undefined) data.status = dto.status;

    return prisma.bankAccount.update({ where: { id: bankAccountId }, data });
  }

  // ── BANK RECONCILIATION ──────────────────────────────────

  async getBankReconciliations(tenantId: string) {
    const reconciliations = await prisma.bankReconciliation.findMany({
      where: { tenantId },
      orderBy: { statementDate: 'desc' },
    });
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { tenantId },
    });
    return reconciliations.map((recon) => {
      const bankAccount = bankAccounts.find((ba) => ba.accountId === recon.accountId);
      return {
        ...recon,
        bankAccount: bankAccount || null,
      };
    });
  }

  async createBankReconciliation(tenantId: string, dto: { accountId: string; statementDate: string; statementBalance: number }) {
    return prisma.bankReconciliation.create({
      data: {
        tenantId,
        accountId: dto.accountId,
        statementDate: new Date(dto.statementDate),
        statementBalance: new Prisma.Decimal(dto.statementBalance),
        status: 'RECONCILED',
      },
    });
  }

  async smartMatchBankTransactions(
    tenantId: string,
    reconciliationId: string,
    options: { fuzzyThreshold?: number; dateWindowDays?: number } = {},
  ) {
    const recon = await prisma.bankReconciliation.findFirst({
      where: { id: reconciliationId, tenantId },
    });
    if (!recon) throw new NotFoundException('Bank reconciliation not found');

    const threshold = options.fuzzyThreshold ?? 0.01;
    const dateWindow = options.dateWindowDays ?? 3;
    const statementDate = new Date(recon.statementDate);
    const minDate = new Date(statementDate);
    minDate.setDate(minDate.getDate() - dateWindow);
    const maxDate = new Date(statementDate);
    maxDate.setDate(maxDate.getDate() + dateWindow);

    // Find payments matching the statement amount
    const amount = Math.abs(Number(recon.statementBalance));
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        amount: { gte: new Prisma.Decimal(amount - threshold), lte: new Prisma.Decimal(amount + threshold) },
        paidAt: { gte: minDate, lte: maxDate },
      },
      include: { invoice: true },
    });

    const matches = payments.map((pay) => ({
      paymentId: pay.id,
      invoiceId: pay.invoiceId,
      amount: Number(pay.amount),
      date: pay.paidAt,
      reference: pay.reference,
      confidence: 0.95,
      invoiceNumber: pay.invoice.invoiceNumber,
    }));

    return {
      reconciliationId,
      statementBalance: amount,
      matches,
    };
  }

  async autoMatchBankReconciliation(tenantId: string, reconciliationId: string) {
    const recon = await prisma.bankReconciliation.findFirst({ where: { id: reconciliationId, tenantId } });
    if (!recon) throw new NotFoundException('Bank reconciliation not found');
    const account = await prisma.account.findFirst({ where: { id: recon.accountId, tenantId } });
    if (!account) throw new NotFoundException('Account not found');
    const bankBalance = Number(recon.statementBalance);
    const glBalance = Number(account.balance);
    const difference = bankBalance - glBalance;
    const unmatchedPayments = await prisma.payment.findMany({
      where: { tenantId, paidAt: { gte: recon.statementDate, lte: recon.statementDate }, method: { not: 'CASH' } },
      take: 10,
    });
    return { reconciliationId, bankBalance, glBalance, difference, status: Math.abs(difference) < 0.01 ? 'MATCHED' : 'UNMATCHED', potentialMatches: unmatchedPayments.length, unmatchedPayments };
  }

  async importBankStatement(tenantId: string, dto: { accountId: string; statementDate: string; statementBalance: number; transactions: Array<{ date: string; description: string; amount: number }> }) {
    const recon = await prisma.bankReconciliation.create({
      data: { tenantId, accountId: dto.accountId, statementDate: new Date(dto.statementDate), statementBalance: new Prisma.Decimal(dto.statementBalance), status: 'DRAFT' },
    });
    return { reconciliationId: recon.id, transactionsImported: dto.transactions.length, status: 'IMPORTED' };
  }

  async reconcileAccount(tenantId: string, orgId: string, accountId: string, asOfDate: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const account = await prisma.account.findFirst({ where: { id: accountId, tenantId, orgId: resolvedOrgId } });
    if (!account) throw new NotFoundException('Account not found');
    const asOf = new Date(asOfDate);
    const entries = await prisma.journalEntry.findMany({ where: { tenantId, accountId, journal: { orgId: resolvedOrgId, date: { lte: asOf }, status: 'POSTED' } } });
    const totalDebits = entries.reduce((s, e) => s + Number(e.debit), 0);
    const totalCredits = entries.reduce((s, e) => s + Number(e.credit), 0);
    const computedBalance = ['ASSET', 'EXPENSE'].includes(account.type) ? totalDebits - totalCredits : totalCredits - totalDebits;
    const glBalance = Number(account.balance);
    const difference = computedBalance - glBalance;
    return { accountId: account.id, accountName: account.name, accountCode: account.code, glBalance, computedBalance, difference, isReconciled: Math.abs(difference) < 0.01, entriesCount: entries.length, asOfDate };
  }
}
