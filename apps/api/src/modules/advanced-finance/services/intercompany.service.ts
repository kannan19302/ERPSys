import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InterCompanyService {
  async getTransactions(
    tenantId: string,
    filters: { status?: string; fromOrgId?: string; toOrgId?: string; page?: number; limit?: number },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.InterCompanyTransactionWhereInput = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.fromOrgId) where.fromOrgId = filters.fromOrgId;
    if (filters.toOrgId) where.toOrgId = filters.toOrgId;

    const [items, total] = await Promise.all([
      prisma.interCompanyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.interCompanyTransaction.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async autoMatchTransactions(tenantId: string) {
    // 1. Fetch unpaid AR Invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { not: 'PAID' },
      },
    });

    // 2. Fetch unpaid AP payment schedules
    const unpaidSchedules = await prisma.paymentSchedule.findMany({
      where: {
        tenantId,
        status: { not: 'PAID' },
      },
    });

    let matchCount = 0;

    // 3. Match rules:
    // Invoice (Sale from Org A) matched to PaymentSchedule (Purchase in Org B)
    // If invoice.totalAmount === schedule.amount AND invoice.orgId !== schedule.orgId AND dates within 10 days
    for (const inv of unpaidInvoices) {
      const matchedSchedule = unpaidSchedules.find(sched => {
        if (!inv.dueDate || !sched.dueDate) return false;
        const amtMatch = Math.abs(Number(inv.totalAmount) - Number(sched.amount)) < 0.01;
        const orgMismatch = inv.orgId !== sched.orgId;
        const dateDiff = Math.abs(inv.dueDate.getTime() - sched.dueDate.getTime()) <= 10 * 24 * 60 * 60 * 1000;
        return amtMatch && orgMismatch && dateDiff;
      });

      if (matchedSchedule) {
        // Check if already matched in db
        const existing = await prisma.interCompanyTransaction.findFirst({
          where: {
            tenantId,
            fromInvoiceId: inv.id,
            toInvoiceId: matchedSchedule.id,
          },
        });

        if (!existing) {
          await prisma.interCompanyTransaction.create({
            data: {
              tenantId,
              fromOrgId: inv.orgId,
              toOrgId: matchedSchedule.orgId,
              date: inv.dueDate || new Date(),
              description: `Auto-matched Intercompany Invoice ${inv.invoiceNumber} to Purchase Schedule`,
              amount: inv.totalAmount,
              currency: inv.currency || 'USD',
              status: 'MATCHED',
              fromInvoiceId: inv.id,
              toInvoiceId: matchedSchedule.id,
            },
          });
          matchCount++;
        }
      }
    }

    return { matchCount };
  }

  async manualMatchTransactions(
    tenantId: string,
    dto: { fromInvoiceId: string; toInvoiceId: string; description?: string },
  ) {
    const [invoice, schedule] = await Promise.all([
      prisma.invoice.findFirst({
        where: { id: dto.fromInvoiceId, tenantId },
      }),
      prisma.paymentSchedule.findFirst({
        where: { id: dto.toInvoiceId, tenantId },
      }),
    ]);

    if (!invoice) throw new NotFoundException('AR Invoice not found');
    if (!schedule) throw new NotFoundException('AP Payment Schedule not found');
    if (invoice.orgId === schedule.orgId) {
      throw new BadRequestException('Intercompany transactions must be between different organizations');
    }

    const existing = await prisma.interCompanyTransaction.findFirst({
      where: {
        tenantId,
        fromInvoiceId: invoice.id,
        toInvoiceId: schedule.id,
      },
    });
    if (existing) throw new BadRequestException('These transactions are already matched');

    return prisma.interCompanyTransaction.create({
      data: {
        tenantId,
        fromOrgId: invoice.orgId,
        toOrgId: schedule.orgId,
        date: invoice.dueDate || new Date(),
        description: dto.description || `Manually matched Intercompany Invoice ${invoice.invoiceNumber} to AP Schedule`,
        amount: invoice.totalAmount,
        currency: invoice.currency || 'USD',
        status: 'MATCHED',
        fromInvoiceId: invoice.id,
        toInvoiceId: schedule.id,
      },
    });
  }

  async eliminateTransaction(tenantId: string, id: string) {
    const tx = await prisma.interCompanyTransaction.findFirst({
      where: { id, tenantId },
    });
    if (!tx) throw new NotFoundException('Intercompany transaction not found');
    if (tx.status === 'ELIMINATED') {
      throw new BadRequestException('Transaction has already been eliminated');
    }
    if (tx.status !== 'MATCHED') {
      throw new BadRequestException('Transaction must be MATCHED before elimination');
    }

    // 1. Find or create Account IDs for posting
    // In Org A (Seller):
    let arAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: tx.fromOrgId, type: 'ASSET', isActive: true },
    });
    if (!arAccount) {
      arAccount = await prisma.account.create({
        data: {
          tenantId,
          orgId: tx.fromOrgId,
          code: '1200-IC-AR',
          name: 'Intercompany Receivables',
          type: 'ASSET',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // In Org B (Buyer):
    let apAccount = await prisma.account.findFirst({
      where: { tenantId, orgId: tx.toOrgId, type: 'LIABILITY', isActive: true },
    });
    if (!apAccount) {
      apAccount = await prisma.account.create({
        data: {
          tenantId,
          orgId: tx.toOrgId,
          code: '2100-IC-AP',
          name: 'Intercompany Payables',
          type: 'LIABILITY',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // Intercompany clearing accounts in both orgs
    let clearingA = await prisma.account.findFirst({
      where: { tenantId, orgId: tx.fromOrgId, name: 'Intercompany Clearing', isActive: true },
    });
    if (!clearingA) {
      clearingA = await prisma.account.create({
        data: {
          tenantId,
          orgId: tx.fromOrgId,
          code: '1999-IC-CLR',
          name: 'Intercompany Clearing',
          type: 'ASSET',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    let clearingB = await prisma.account.findFirst({
      where: { tenantId, orgId: tx.toOrgId, name: 'Intercompany Clearing', isActive: true },
    });
    if (!clearingB) {
      clearingB = await prisma.account.create({
        data: {
          tenantId,
          orgId: tx.toOrgId,
          code: '1999-IC-CLR',
          name: 'Intercompany Clearing',
          type: 'ASSET',
          isActive: true,
          balance: new Prisma.Decimal(0),
        },
      });
    }

    // 2. Generate consolidated elimination Journal posting
    // In real ERP, this creates Journal entries in both orgs or a consolidated elimination book.
    // We will create a Journal record in the tenant's primary book for Org A to model this posting.
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: tx.fromOrgId,
        entryNumber: `ELIM-${tx.id.substring(0, 8).toUpperCase()}`,
        date: new Date(),
        status: 'POSTED',
        notes: `Elimination entry for Intercompany Tx ${tx.id}. Description: ${tx.description}`,
        entries: {
          create: [
            // Org A offset
            {
              tenantId,
              accountId: clearingA.id,
              debit: tx.amount,
              credit: new Prisma.Decimal(0),
              description: 'Debit Intercompany Clearing to offset AP/AR',
            },
            {
              tenantId,
              accountId: arAccount.id,
              debit: new Prisma.Decimal(0),
              credit: tx.amount,
              description: 'Credit Accounts Receivable to eliminate intercompany sales',
            },
          ],
        },
      },
    });

    // 3. Mark invoice and payment schedule as paid/closed
    if (tx.fromInvoiceId) {
      await prisma.invoice.update({
        where: { id: tx.fromInvoiceId },
        data: { status: 'PAID', paidAmount: tx.amount, paidAt: new Date() },
      });
    }
    if (tx.toInvoiceId) {
      await prisma.paymentSchedule.update({
        where: { id: tx.toInvoiceId },
        data: { status: 'PAID' },
      });
    }

    // 4. Update transaction status
    return prisma.interCompanyTransaction.update({
      where: { id },
      data: {
        status: 'ELIMINATED',
        eliminationJournalId: journal.id,
      },
    });
  }

  async getConsolidatedStats(tenantId: string) {
    const txs = await prisma.interCompanyTransaction.findMany({
      where: { tenantId },
    });

    const totalNettedVolume = txs
      .filter(t => t.status === 'ELIMINATED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingNettingVolume = txs
      .filter(t => t.status === 'MATCHED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingMatchVolume = txs
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalTransactionsCount: txs.length,
      eliminatedCount: txs.filter(t => t.status === 'ELIMINATED').length,
      matchedCount: txs.filter(t => t.status === 'MATCHED').length,
      pendingCount: txs.filter(t => t.status === 'PENDING').length,
      totalNettedVolume,
      pendingNettingVolume,
      pendingMatchVolume,
    };
  }

  // ── Auto-Elimination Rules & Runs ──────────────────────────────────────────

  async getEliminationRules(tenantId: string) {
    return prisma.eliminationRule.findMany({
      where: { tenantId },
      include: { sourceAccount: true, destinationAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEliminationRuleById(tenantId: string, id: string) {
    const rule = await prisma.eliminationRule.findFirst({
      where: { id, tenantId },
      include: { sourceAccount: true, destinationAccount: true },
    });
    if (!rule) throw new NotFoundException('Elimination rule not found');
    return rule;
  }

  async createEliminationRule(tenantId: string, dto: any, userId?: string) {
    const rule = await prisma.eliminationRule.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        isActive: dto.isActive !== false,
        sourceOrgId: dto.sourceOrgId || null,
        destinationOrgId: dto.destinationOrgId || null,
        matchingCriteria: dto.matchingCriteria || 'AMOUNT_CURRENCY_DATE',
        toleranceDays: dto.toleranceDays !== undefined ? Number(dto.toleranceDays) : 10,
        sourceAccountId: dto.sourceAccountId,
        destinationAccountId: dto.destinationAccountId,
        createdBy: userId || 'system',
        updatedBy: userId || 'system',
      },
    });
    return rule;
  }

  async updateEliminationRule(tenantId: string, id: string, dto: any, userId?: string) {
    const rule = await this.getEliminationRuleById(tenantId, id);
    return prisma.eliminationRule.update({
      where: { id: rule.id },
      data: {
        name: dto.name !== undefined ? dto.name : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        sourceOrgId: dto.sourceOrgId !== undefined ? dto.sourceOrgId : undefined,
        destinationOrgId: dto.destinationOrgId !== undefined ? dto.destinationOrgId : undefined,
        matchingCriteria: dto.matchingCriteria !== undefined ? dto.matchingCriteria : undefined,
        toleranceDays: dto.toleranceDays !== undefined ? Number(dto.toleranceDays) : undefined,
        sourceAccountId: dto.sourceAccountId !== undefined ? dto.sourceAccountId : undefined,
        destinationAccountId: dto.destinationAccountId !== undefined ? dto.destinationAccountId : undefined,
        updatedBy: userId || 'system',
      },
    });
  }

  async deleteEliminationRule(tenantId: string, id: string, _userId?: string) {
    const rule = await this.getEliminationRuleById(tenantId, id);
    return prisma.eliminationRule.delete({
      where: { id: rule.id },
    });
  }

  async getEliminationRuns(tenantId: string) {
    return prisma.eliminationRun.findMany({
      where: { tenantId },
      include: {
        journal: true,
        details: {
          include: {
            rule: true,
            transaction: true,
          },
        },
      },
      orderBy: { runDate: 'desc' },
    });
  }

  async executeEliminationRun(tenantId: string, periodStart: string, periodEnd: string, userId?: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // 1. Fetch active rules
    const rules = await prisma.eliminationRule.findMany({
      where: { tenantId, isActive: true },
    });
    if (rules.length === 0) {
      throw new BadRequestException('No active intercompany elimination rules found.');
    }

    // 2. Perform auto match to match unmatched AR/AP pairs in database
    await this.autoMatchTransactions(tenantId);

    // 3. Find matched intercompany transactions in this period
    const matchedTxs = await prisma.interCompanyTransaction.findMany({
      where: {
        tenantId,
        status: 'MATCHED',
        date: { gte: start, lte: end },
      },
    });

    if (matchedTxs.length === 0) {
      throw new BadRequestException('No matched intercompany transactions found for this period.');
    }

    // 4. Apply rules to filter transactions that can be auto-eliminated
    const eligibleDetails: Array<{ ruleId: string; tx: any }> = [];
    for (const tx of matchedTxs) {
      const matchingRule = rules.find(r => {
        const orgMatch = (!r.sourceOrgId || r.sourceOrgId === tx.fromOrgId) &&
                         (!r.destinationOrgId || r.destinationOrgId === tx.toOrgId);
        return orgMatch;
      });

      if (matchingRule) {
        eligibleDetails.push({ ruleId: matchingRule.id, tx });
      }
    }

    if (eligibleDetails.length === 0) {
      throw new BadRequestException('No intercompany transactions matched the active elimination rules.');
    }

    // 5. Build consolidated draft elimination Journal entries
    const totalEliminated = eligibleDetails.reduce((sum, item) => sum + Number(item.tx.amount), 0);

    const journalEntries: any[] = [];
    for (const item of eligibleDetails) {
      const rule = rules.find(r => r.id === item.ruleId)!;
      journalEntries.push({
        tenantId,
        accountId: rule.destinationAccountId,
        debit: item.tx.amount,
        credit: new Prisma.Decimal(0),
        description: `Eliminate Intercompany Payables/Clearing for Tx ${item.tx.id}`,
      });
      journalEntries.push({
        tenantId,
        accountId: rule.sourceAccountId,
        debit: new Prisma.Decimal(0),
        credit: item.tx.amount,
        description: `Eliminate Intercompany Receivables for Tx ${item.tx.id}`,
      });
    }

    const primaryOrgId = eligibleDetails[0]!.tx.fromOrgId;

    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: primaryOrgId,
        entryNumber: `AUTO-ELIM-${Date.now().toString().slice(-6)}`,
        date: new Date(),
        status: 'DRAFT',
        notes: `Consolidated Intercompany Auto-Elimination Run from ${periodStart} to ${periodEnd}`,
        entries: {
          create: journalEntries,
        },
      },
    });

    const run = await prisma.eliminationRun.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        status: 'DRAFT',
        totalEliminated: new Prisma.Decimal(totalEliminated),
        rulesAppliedCount: Array.from(new Set(eligibleDetails.map(d => d.ruleId))).length,
        journalId: journal.id,
        createdBy: userId || 'system',
        details: {
          create: eligibleDetails.map(item => ({
            ruleId: item.ruleId,
            transactionId: item.tx.id,
            amount: item.tx.amount,
            currency: item.tx.currency,
          })),
        },
      },
      include: {
        details: true,
      },
    });

    return run;
  }

  async postEliminationRun(tenantId: string, runId: string, _userId?: string) {
    const run = await prisma.eliminationRun.findFirst({
      where: { id: runId, tenantId },
      include: { details: true },
    });
    if (!run) throw new NotFoundException('Elimination run not found');
    if (run.status === 'POSTED') {
      throw new BadRequestException('Elimination run has already been posted');
    }

    if (run.journalId) {
      await prisma.journal.update({
        where: { id: run.journalId },
        data: { status: 'POSTED' },
      });
    }

    for (const detail of run.details) {
      const tx = await prisma.interCompanyTransaction.findFirst({
        where: { id: detail.transactionId },
      });

      if (tx) {
        if (tx.fromInvoiceId) {
          await prisma.invoice.update({
            where: { id: tx.fromInvoiceId },
            data: { status: 'PAID', paidAmount: tx.amount, paidAt: new Date() },
          });
        }
        if (tx.toInvoiceId) {
          await prisma.paymentSchedule.update({
            where: { id: tx.toInvoiceId },
            data: { status: 'PAID' },
          });
        }

        await prisma.interCompanyTransaction.update({
          where: { id: tx.id },
          data: { status: 'ELIMINATED', eliminationJournalId: run.journalId },
        });
      }
    }

    return prisma.eliminationRun.update({
      where: { id: runId },
      data: { status: 'POSTED' },
      include: { journal: true },
    });
  }
}
