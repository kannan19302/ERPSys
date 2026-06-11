import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdvancedFinanceService {
  async getExchangeRates(tenantId: string) {
    return prisma.exchangeRate.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
    });
  }

  async getAccounts(tenantId: string) {
    return prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(
    tenantId: string,
    orgId: string,
    dto: { code: string; name: string; type: string; parentId?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.account.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Account code ${dto.code} already exists.`);

    return prisma.account.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId || null,
      },
    });
  }

  async getJournals(tenantId: string) {
    return prisma.journal.findMany({
      where: { tenantId },
      include: { entries: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async createJournal(
    tenantId: string,
    orgId: string,
    dto: { entryNumber: string; notes?: string; entries: { accountId: string; debit: number; credit: number; description?: string }[] }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const debits = dto.entries.reduce((sum, e) => sum + e.debit, 0);
    const credits = dto.entries.reduce((sum, e) => sum + e.credit, 0);
    if (Math.abs(debits - credits) > 0.01) {
      throw new BadRequestException('Journal entries do not balance. Total debits must equal total credits.');
    }

    return prisma.$transaction(async (tx) => {
      const journal = await tx.journal.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          entryNumber: dto.entryNumber,
          notes: dto.notes || null,
          status: 'POSTED',
        },
      });

      for (const entry of dto.entries) {
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: journal.id,
            accountId: entry.accountId,
            debit: new Prisma.Decimal(entry.debit),
            credit: new Prisma.Decimal(entry.credit),
            description: entry.description || null,
          },
        });

        // Update Account Balance
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (!account) throw new NotFoundException(`Account ${entry.accountId} not found.`);

        let balanceDelta = entry.debit - entry.credit;
        // Asset and Expenses increase with debit, others increase with credit
        if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(account.type)) {
          balanceDelta = entry.credit - entry.debit;
        }

        await tx.account.update({
          where: { id: entry.accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }

      return tx.journal.findUnique({
        where: { id: journal.id },
        include: { entries: true },
      });
    });
  }

  async getBudgets(tenantId: string) {
    return prisma.budget.findMany({
      where: { tenantId },
      include: { account: true },
    });
  }

  async createBudget(
    tenantId: string,
    orgId: string,
    dto: { accountId: string; amount: number; startDate: string; endDate: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    return prisma.budget.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        accountId: dto.accountId,
        amount: new Prisma.Decimal(dto.amount),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async getBankReconciliations(tenantId: string) {
    return prisma.bankReconciliation.findMany({
      where: { tenantId },
      orderBy: { statementDate: 'desc' },
    });
  }

  async createBankReconciliation(
    tenantId: string,
    dto: { accountId: string; statementDate: string; statementBalance: number }
  ) {
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
}
