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

  async getCostCenters(tenantId: string) {
    return prisma.costCenter.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  async createCostCenter(
    tenantId: string,
    orgId: string,
    dto: { code: string; name: string; parentId?: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    const existing = await prisma.costCenter.findFirst({
      where: { tenantId, orgId: resolvedOrgId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`Cost Center code ${dto.code} already exists.`);

    return prisma.costCenter.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        code: dto.code,
        name: dto.name,
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
    dto: { entryNumber: string; notes?: string; entries: { accountId: string; debit: number; credit: number; description?: string; departmentId?: string; costCenterId?: string; projectId?: string }[] }
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
            departmentId: entry.departmentId || null,
            costCenterId: entry.costCenterId || null,
            projectId: entry.projectId || null,
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

  // --- STAGE 1: FINANCIAL CORE ENHANCEMENTS ---

  async getFinancialPeriods(tenantId: string) {
    // @ts-ignore Prisma types may not be updated until DB is up
    return prisma.financialPeriod.findMany({
      where: { tenantId },
      orderBy: { startDate: 'desc' },
    });
  }

  async createFinancialPeriod(
    tenantId: string,
    orgId: string,
    dto: { name: string; startDate: string; endDate: string; status: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    // @ts-ignore
    return prisma.financialPeriod.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: dto.status || 'OPEN',
      },
    });
  }

  async updateFinancialPeriodStatus(tenantId: string, periodId: string, status: string) {
    // @ts-ignore
    return prisma.financialPeriod.update({
      where: { id: periodId, tenantId },
      data: { status },
    });
  }

  async getFixedAssets(tenantId: string) {
    // @ts-ignore
    return prisma.fixedAsset.findMany({
      where: { tenantId },
      orderBy: { purchaseDate: 'desc' },
    });
  }

  async createFixedAsset(
    tenantId: string,
    orgId: string,
    dto: { assetCode: string; name: string; purchaseDate: string; purchaseValue: number; salvageValue: number; usefulLifeYears: number; depreciationMethod: string; accountId: string; accumDepAccountId: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    // @ts-ignore
    return prisma.fixedAsset.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        assetCode: dto.assetCode,
        name: dto.name,
        purchaseDate: new Date(dto.purchaseDate),
        purchaseValue: new Prisma.Decimal(dto.purchaseValue),
        salvageValue: new Prisma.Decimal(dto.salvageValue),
        currentValue: new Prisma.Decimal(dto.purchaseValue),
        usefulLifeYears: dto.usefulLifeYears,
        depreciationMethod: dto.depreciationMethod,
        accountId: dto.accountId,
        accumDepAccountId: dto.accumDepAccountId,
        status: 'ACTIVE',
      },
    });
  }

  async getBankAccounts(tenantId: string) {
    // @ts-ignore
    return prisma.bankAccount.findMany({
      where: { tenantId },
      orderBy: { bankName: 'asc' },
    });
  }

  async createBankAccount(
    tenantId: string,
    orgId: string,
    dto: { accountId: string; bankName: string; accountNumber: string; currency: string }
  ) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (!org) throw new BadRequestException('No Organization found.');
      resolvedOrgId = org.id;
    }

    // @ts-ignore
    return prisma.bankAccount.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        accountId: dto.accountId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        currency: dto.currency || 'USD',
        status: 'ACTIVE',
      },
    });
  }

  // AP/AR Automation: Credit & Debit Notes
  async getCreditNotes(tenantId: string) {
    return prisma.creditNote.findMany({
      where: { tenantId },
      include: { customer: true, invoice: true }
    });
  }

  async createCreditNote(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.creditNote.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async getDebitNotes(tenantId: string) {
    return prisma.debitNote.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true }
    });
  }

  async createDebitNote(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.debitNote.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  // AP/AR Automation: Dunning (Reminders)
  async getDunningLevels(tenantId: string) {
    return prisma.dunningLevel.findMany({
      where: { tenantId },
      orderBy: { daysOverdue: 'asc' }
    });
  }

  async createDunningLevel(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.dunningLevel.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async getDunningRuns(tenantId: string) {
    return prisma.dunningRun.findMany({
      where: { tenantId },
      orderBy: { runDate: 'desc' }
    });
  }

  async createDunningRun(tenantId: string, orgId: string) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId || resolvedOrgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.dunningRun.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        totalInvoices: 3,
        status: 'COMPLETED'
      }
    });
  }

  // AP/AR Automation: Payments
  async getPaymentSchedules(tenantId: string) {
    return prisma.paymentSchedule.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true },
      orderBy: { dueDate: 'asc' }
    });
  }

  async createPaymentSchedule(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.paymentSchedule.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async getPaymentRuns(tenantId: string) {
    return prisma.paymentRun.findMany({
      where: { tenantId },
      include: { bankAccount: true },
      orderBy: { runDate: 'desc' }
    });
  }

  async createPaymentRun(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.paymentRun.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }




  async getForecastScenarios(tenantId: string) {
    return prisma.forecastScenario.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createForecastScenario(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.forecastScenario.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  // Financial Reporting Engine
  async getProfitAndLoss(_tenantId: string, _orgId: string, startDate: string, endDate: string) {
    // Advanced dimensional P&L placeholder
    return {
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      period: { startDate, endDate }
    };
  }

  async getBalanceSheet(_tenantId: string, _orgId: string, asOfDate: string) {
    // Advanced balance sheet placeholder
    return {
      assets: 0,
      liabilities: 0,
      equity: 0,
      asOfDate
    };
  }

  async getCashFlow(_tenantId: string, _orgId: string, startDate: string, endDate: string) {
    // Advanced cash flow statement placeholder
    return {
      operatingActivities: 0,
      investingActivities: 0,
      financingActivities: 0,
      netIncreaseInCash: 0,
      period: { startDate, endDate }
    };
  }


  // Tax Engine & Statutory Compliance
  async getTaxRules(tenantId: string) {
    return prisma.taxRule.findMany({
      where: { tenantId },
      include: { components: true }
    });
  }

  async createTaxRule(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.taxRule.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async getWithholdingTaxes(tenantId: string) {
    return prisma.withholdingTax.findMany({
      where: { tenantId },
      include: { account: true }
    });
  }

  async createWithholdingTax(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.withholdingTax.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async getTaxFilings(tenantId: string) {
    return prisma.taxFiling.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'desc' }
    });
  }

  async createTaxFiling(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.taxFiling.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }


  // Treasury & Investments
  async getInvestmentPortfolios(tenantId: string) {
    return prisma.investmentPortfolio.findMany({
      where: { tenantId },
      include: { account: true }
    });
  }

  async getTreasuryTransactions(tenantId: string) {
    return prisma.treasuryTransaction.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      include: { bankAccount: true }
    });
  }

  async getInterCompanyTransfers(tenantId: string) {
    return prisma.interCompanyTransfer.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' }
    });
  }

  async createInvestmentPortfolio(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.investmentPortfolio.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

  async createTreasuryTransaction(tenantId: string, orgId: string, dto: unknown) {
    let resolvedOrgId = orgId;
    if (!resolvedOrgId) {
      const org = await prisma.organization.findFirst({ where: { tenantId } });
      if (org) resolvedOrgId = org.id;
    }
    return prisma.treasuryTransaction.create({
      data: { ...(dto as Record<string, unknown>), tenantId, orgId: resolvedOrgId } as never
    });
  }

}
