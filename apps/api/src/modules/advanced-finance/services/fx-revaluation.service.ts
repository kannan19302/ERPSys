import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class FxRevaluationService {
  async getRevaluationRuns(tenantId: string) {
    return prisma.fxRevaluationRun.findMany({
      where: { tenantId },
      orderBy: { runDate: 'desc' },
    });
  }

  async getRevaluationRunDetails(tenantId: string, runId: string) {
    const run = await prisma.fxRevaluationRun.findFirst({
      where: { id: runId, tenantId },
      include: {
        details: {
          include: { account: true },
        },
      },
    });
    if (!run) throw new NotFoundException('Revaluation run not found');
    return run;
  }

  async createRevaluationRun(
    tenantId: string,
    orgId: string,
    dto: { runDate: string | Date; targetCurrency: string; notes?: string },
  ) {
    const runDate = new Date(dto.runDate);

    // 1. Fetch current exchange rate for targetCurrency to base (USD)
    // We search the exchangeRate logs or fallback to a standard rate
    const fxRateRecord = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        fromCurrency: dto.targetCurrency,
        toCurrency: 'USD',
      },
      orderBy: { date: 'desc' },
    });
    const newRate = fxRateRecord ? Number(fxRateRecord.rate) : this.getFallbackRate(dto.targetCurrency);

    // 2. Fetch Unrealized Gain/Loss account to map detail rows
    let unrealizedAcc = await prisma.account.findFirst({
      where: { tenantId, orgId, name: 'Unrealized Gain/Loss', isActive: true },
    });
    if (!unrealizedAcc) {
      unrealizedAcc = await prisma.account.create({
        data: {
          tenantId,
          orgId,
          code: '8100-UNR-FX',
          name: 'Unrealized Gain/Loss',
          type: 'REVENUE',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // 3. Scan open Receivables (Invoices) in targetCurrency
    const openInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        orgId,
        currency: dto.targetCurrency,
        status: { not: 'PAID' },
        dueDate: { lte: runDate },
      },
    });

    const calculatedDetails: any[] = [];

    for (const inv of openInvoices) {
      const balanceForeign = Number(inv.totalAmount) - Number(inv.paidAmount);
      const originalRate = Number(inv.exchangeRate || 1.0);
      const originalBase = balanceForeign * originalRate;
      const revaluedBase = balanceForeign * newRate;
      const gainLoss = revaluedBase - originalBase; // Receivable appreciates -> gain

      // Look up AR account in the invoice's org
      let invoiceAcc = await prisma.account.findFirst({
        where: { tenantId, orgId, type: 'ASSET', isActive: true },
      });
      if (!invoiceAcc) {
        invoiceAcc = unrealizedAcc; // Fallback
      }

      calculatedDetails.push({
        accountId: invoiceAcc.id,
        entityType: 'INVOICE',
        entityId: inv.id,
        balanceInForeign: new Prisma.Decimal(balanceForeign),
        originalAmountBase: new Prisma.Decimal(originalBase),
        revaluedAmountBase: new Prisma.Decimal(revaluedBase),
        unrealizedGainLoss: new Prisma.Decimal(gainLoss),
      });
    }

    // 4. Scan open Payables (PaymentSchedules) in targetCurrency
    const openSchedules = await prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        orgId,
        status: { not: 'PAID' },
        dueDate: { lte: runDate },
        purchaseOrder: { currency: dto.targetCurrency },
      },
      include: { purchaseOrder: true },
    });

    for (const sched of openSchedules) {
      const balanceForeign = Number(sched.amount);
      const originalRate = Number(sched.purchaseOrder?.exchangeRate || 1.0);
      const originalBase = balanceForeign * originalRate;
      const revaluedBase = balanceForeign * newRate;
      const gainLoss = originalBase - revaluedBase; // Payable appreciates -> loss (originalBase - revaluedBase)

      let payableAcc = await prisma.account.findFirst({
        where: { tenantId, orgId, type: 'LIABILITY', isActive: true },
      });
      if (!payableAcc) payableAcc = unrealizedAcc;

      calculatedDetails.push({
        accountId: payableAcc.id,
        entityType: 'PAYMENT_SCHEDULE',
        entityId: sched.id,
        balanceInForeign: new Prisma.Decimal(balanceForeign),
        originalAmountBase: new Prisma.Decimal(originalBase),
        revaluedAmountBase: new Prisma.Decimal(revaluedBase),
        unrealizedGainLoss: new Prisma.Decimal(gainLoss),
      });
    }

    // 5. Create Draft Run
    const run = await prisma.fxRevaluationRun.create({
      data: {
        tenantId,
        orgId,
        runDate,
        targetCurrency: dto.targetCurrency,
        status: 'DRAFT',
        notes: dto.notes,
        details: {
          create: calculatedDetails,
        },
      },
      include: { details: true },
    });

    return run;
  }

  async postRevaluationRun(tenantId: string, id: string) {
    const run = await prisma.fxRevaluationRun.findFirst({
      where: { id, tenantId },
      include: { details: true },
    });

    if (!run) throw new NotFoundException('Revaluation run not found');
    if (run.status === 'POSTED') {
      throw new BadRequestException('Revaluation run has already been posted');
    }

    // 1. Fetch Unrealized account to balance journal entries
    let unrealizedAcc = await prisma.account.findFirst({
      where: { tenantId, orgId: run.orgId, name: 'Unrealized Gain/Loss', isActive: true },
    });
    if (!unrealizedAcc) {
      unrealizedAcc = await prisma.account.create({
        data: {
          tenantId,
          orgId: run.orgId,
          code: '8100-UNR-FX',
          name: 'Unrealized Gain/Loss',
          type: 'REVENUE',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    const journalLines: any[] = [];

    // 2. Generate journal offset lines per detail adjustment
    for (const detail of run.details) {
      const gainLoss = Number(detail.unrealizedGainLoss);
      if (gainLoss > 0) {
        // Gain: Debit Asset/Liability adjustment, Credit Revenue
        journalLines.push({
          tenantId,
          accountId: detail.accountId,
          debit: new Prisma.Decimal(gainLoss),
          credit: new Prisma.Decimal(0),
          description: `FX Gain adjustment for ${detail.entityType} ${detail.entityId}`,
        });
        journalLines.push({
          tenantId,
          accountId: unrealizedAcc.id,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(gainLoss),
          description: `FX Gain offset to revenue for ${detail.entityType}`,
        });
      } else if (gainLoss < 0) {
        // Loss: Debit Expense/Revenue adjustment, Credit Asset/Liability
        const lossAbs = Math.abs(gainLoss);
        journalLines.push({
          tenantId,
          accountId: unrealizedAcc.id,
          debit: new Prisma.Decimal(lossAbs),
          credit: new Prisma.Decimal(0),
          description: `FX Loss offset to revenue for ${detail.entityType}`,
        });
        journalLines.push({
          tenantId,
          accountId: detail.accountId,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(lossAbs),
          description: `FX Loss adjustment for ${detail.entityType} ${detail.entityId}`,
        });
      }
    }

    // 3. Write Journal entries if there are calculations
    let journalId: string | null = null;

    if (journalLines.length > 0) {
      const journal = await prisma.journal.create({
        data: {
          tenantId,
          orgId: run.orgId,
          entryNumber: `FXREV-${run.id.substring(0, 8).toUpperCase()}`,
          date: run.runDate,
          status: 'POSTED',
          notes: `Posted FX Revaluation Entry for target currency ${run.targetCurrency}. Notes: ${run.notes || ''}`,
          entries: {
            create: journalLines,
          },
        },
      });
      journalId = journal.id;
    }

    // 4. Update run status
    return prisma.fxRevaluationRun.update({
      where: { id },
      data: {
        status: 'POSTED',
        journalId,
      },
    });
  }

  private getFallbackRate(currency: string): number {
    switch (currency.toUpperCase()) {
      case 'EUR': return 1.09;
      case 'GBP': return 1.27;
      case 'CAD': return 0.73;
      case 'AUD': return 0.66;
      case 'JPY': return 0.0064;
      default: return 1.0;
    }
  }
}
