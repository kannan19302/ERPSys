import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class PayablesService {
  // ── AP Match Rules ──────────────────────────────────────────────────────────

  async listMatchRules(tenantId: string) {
    return prisma.aPMatchRule.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async getMatchRule(tenantId: string, id: string) {
    const rule = await prisma.aPMatchRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('AP match rule not found');
    return rule;
  }

  async createMatchRule(
    tenantId: string,
    userId: string,
    dto: {
      vendorId?: string;
      quantityTolerancePercent: number;
      priceTolerancePercent: number;
      effectiveDate: string;
    },
  ) {
    if (dto.quantityTolerancePercent < 0 || dto.priceTolerancePercent < 0) {
      throw new BadRequestException('Tolerance percentages must be non-negative');
    }
    return prisma.aPMatchRule.create({
      data: {
        tenantId,
        vendorId: dto.vendorId || null,
        quantityTolerancePercent: new Prisma.Decimal(dto.quantityTolerancePercent),
        priceTolerancePercent: new Prisma.Decimal(dto.priceTolerancePercent),
        effectiveDate: new Date(dto.effectiveDate),
        status: 'ACTIVE',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async updateMatchRule(
    tenantId: string,
    id: string,
    userId: string,
    dto: {
      quantityTolerancePercent?: number;
      priceTolerancePercent?: number;
      effectiveDate?: string;
      status?: string;
    },
  ) {
    await this.getMatchRule(tenantId, id);
    const data: Prisma.APMatchRuleUpdateInput = { updatedBy: userId };
    if (dto.quantityTolerancePercent !== undefined)
      data.quantityTolerancePercent = new Prisma.Decimal(dto.quantityTolerancePercent);
    if (dto.priceTolerancePercent !== undefined)
      data.priceTolerancePercent = new Prisma.Decimal(dto.priceTolerancePercent);
    if (dto.effectiveDate !== undefined) data.effectiveDate = new Date(dto.effectiveDate);
    if (dto.status !== undefined) data.status = dto.status;
    return prisma.aPMatchRule.update({ where: { id }, data });
  }

  async deleteMatchRule(tenantId: string, id: string, userId: string) {
    await this.getMatchRule(tenantId, id);
    return prisma.aPMatchRule.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  // ── Three-Way Match Engine ──────────────────────────────────────────────────

  async runMatch(
    tenantId: string,
    userId: string,
    dto: { purchaseOrderId: string; notes?: string },
  ) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: dto.purchaseOrderId, tenantId },
      include: { lineItems: true, receipts: { include: { lineItems: true } } },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    // Get applicable match rule (vendor-specific first, then global)
    const rule = await prisma.aPMatchRule.findFirst({
      where: {
        tenantId,
        OR: [{ vendorId: po.vendorId }, { vendorId: null }],
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: [{ vendorId: 'desc' }, { effectiveDate: 'desc' }],
    });

    const poAmount = Number(po.totalAmount);
    const receivedQty = po.receipts.reduce(
      (sum, r) => sum + r.lineItems.reduce((s, li) => s + Number(li.acceptedQty), 0),
      0,
    );
    const orderedQty = po.lineItems.reduce((sum, li) => sum + Number(li.quantity), 0);

    const qtyTolerance = rule ? Number(rule.quantityTolerancePercent) : 0;
    const priceTolerance = rule ? Number(rule.priceTolerancePercent) : 5;

    // Compute variance
    const qtyVariancePct = orderedQty > 0 ? Math.abs((receivedQty - orderedQty) / orderedQty) * 100 : 0;
    // Estimate received amount as received_qty / ordered_qty * po_amount
    const receivedAmount = orderedQty > 0 ? (receivedQty / orderedQty) * poAmount : 0;
    const priceVariancePct = poAmount > 0 ? Math.abs((receivedAmount - poAmount) / poAmount) * 100 : 0;
    const varianceAmount = Math.abs(receivedAmount - poAmount);

    const isWithinQtyTolerance = qtyVariancePct <= qtyTolerance;
    const isWithinPriceTolerance = priceVariancePct <= priceTolerance;
    const isMatched = receivedQty > 0 && isWithinQtyTolerance && isWithinPriceTolerance;

    const status = receivedQty === 0
      ? 'PENDING'
      : isMatched
      ? 'MATCHED'
      : 'EXCEPTION';

    // If exception, record it
    if (status === 'EXCEPTION') {
      const exceptionType = !isWithinQtyTolerance ? 'QUANTITY_VARIANCE' : 'PRICE_VARIANCE';
      const existingException = await prisma.aPMatchException.findFirst({
        where: { tenantId, invoiceId: dto.purchaseOrderId, poLineId: dto.purchaseOrderId },
      });
      if (!existingException) {
        await prisma.aPMatchException.create({
          data: {
            tenantId,
            invoiceId: dto.purchaseOrderId,
            poLineId: dto.purchaseOrderId,
            varianceType: exceptionType,
            varianceAmount: new Prisma.Decimal(varianceAmount),
            variancePercent: new Prisma.Decimal(
              exceptionType === 'QUANTITY_VARIANCE' ? qtyVariancePct : priceVariancePct,
            ),
            expectedValue: String(orderedQty),
            actualValue: String(receivedQty),
            status: 'PENDING',
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }

    return {
      purchaseOrderId: dto.purchaseOrderId,
      status,
      poAmount,
      receivedAmount,
      orderedQty,
      receivedQty,
      qtyVariancePct: Math.round(qtyVariancePct * 100) / 100,
      priceVariancePct: Math.round(priceVariancePct * 100) / 100,
      varianceAmount: Math.round(varianceAmount * 100) / 100,
      appliedRule: rule ? { id: rule.id, priceTolerance, qtyTolerance } : null,
      autoPost: rule?.status === 'ACTIVE' && isMatched,
    };
  }

  // ── Exception Queue ─────────────────────────────────────────────────────────

  async listExceptions(tenantId: string, status?: string) {
    return prisma.aPMatchException.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveException(tenantId: string, id: string, userId: string, notes?: string) {
    const exc = await prisma.aPMatchException.findFirst({ where: { id, tenantId } });
    if (!exc) throw new NotFoundException('Exception not found');
    if (exc.status !== 'PENDING') {
      throw new BadRequestException(`Exception is already ${exc.status}`);
    }
    return prisma.aPMatchException.update({
      where: { id },
      data: { status: 'APPROVED', resolvedBy: userId, resolvedAt: new Date(), resolutionNotes: notes || null, updatedBy: userId },
    });
  }

  async rejectException(tenantId: string, id: string, userId: string, notes?: string) {
    const exc = await prisma.aPMatchException.findFirst({ where: { id, tenantId } });
    if (!exc) throw new NotFoundException('Exception not found');
    if (exc.status !== 'PENDING') {
      throw new BadRequestException(`Exception is already ${exc.status}`);
    }
    return prisma.aPMatchException.update({
      where: { id },
      data: { status: 'REJECTED', resolvedBy: userId, resolvedAt: new Date(), resolutionNotes: notes || null, updatedBy: userId },
    });
  }

  // ── Payment Batches ─────────────────────────────────────────────────────────

  async listPaymentBatches(tenantId: string, status?: string) {
    return prisma.paymentBatch.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: { lines: true, _count: { select: { lines: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentBatch(tenantId: string, id: string) {
    const batch = await prisma.paymentBatch.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!batch) throw new NotFoundException('Payment batch not found');
    return batch;
  }

  async createPaymentBatch(
    tenantId: string,
    userId: string,
    dto: {
      paymentMethod: string;
      settlementDate?: string;
      bankAccountId?: string;
      currency?: string;
      notes?: string;
    },
  ) {
    const count = await prisma.paymentBatch.count({ where: { tenantId } });
    const batchNumber = `PB-${String(count + 1).padStart(5, '0')}`;
    return prisma.paymentBatch.create({
      data: {
        tenantId,
        batchNumber,
        status: 'DRAFT',
        paymentMethod: dto.paymentMethod,
        currency: dto.currency || 'USD',
        totalAmount: new Prisma.Decimal(0),
        bankAccountId: dto.bankAccountId || null,
        settlementDate: dto.settlementDate ? new Date(dto.settlementDate) : null,
        notes: dto.notes || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async addLineToBatch(
    tenantId: string,
    batchId: string,
    userId: string,
    dto: { referenceId: string; amount: number; scheduledPaymentDate: string; notes?: string },
  ) {
    const batch = await this.getPaymentBatch(tenantId, batchId);
    if (!['DRAFT', 'READY'].includes(batch.status)) {
      throw new BadRequestException('Can only add lines to DRAFT or READY batches');
    }
    const line = await prisma.paymentBatchLine.create({
      data: {
        tenantId,
        batchId,
        invoiceId: dto.referenceId,
        amount: new Prisma.Decimal(dto.amount),
        scheduledPaymentDate: new Date(dto.scheduledPaymentDate),
        status: 'INCLUDED',
      },
    });
    // Recalculate batch total
    const totalResult = await prisma.paymentBatchLine.aggregate({
      where: { batchId, status: 'INCLUDED' },
      _sum: { amount: true },
    });
    await prisma.paymentBatch.update({
      where: { id: batchId },
      data: { totalAmount: totalResult._sum.amount ?? new Prisma.Decimal(0), updatedBy: userId },
    });
    return line;
  }

  async removeLineFromBatch(tenantId: string, batchId: string, lineId: string, userId: string) {
    const batch = await this.getPaymentBatch(tenantId, batchId);
    if (!['DRAFT', 'READY'].includes(batch.status)) {
      throw new BadRequestException('Cannot modify a submitted or completed batch');
    }
    const line = await prisma.paymentBatchLine.findFirst({ where: { id: lineId, batchId, tenantId } });
    if (!line) throw new NotFoundException('Batch line not found');
    await prisma.paymentBatchLine.delete({ where: { id: lineId } });
    const totalResult = await prisma.paymentBatchLine.aggregate({
      where: { batchId, status: 'INCLUDED' },
      _sum: { amount: true },
    });
    await prisma.paymentBatch.update({
      where: { id: batchId },
      data: { totalAmount: totalResult._sum.amount ?? new Prisma.Decimal(0), updatedBy: userId },
    });
    return { success: true };
  }

  async runPaymentBatch(tenantId: string, batchId: string, userId: string, orgId: string) {
    const batch = await this.getPaymentBatch(tenantId, batchId);
    if (batch.status !== 'DRAFT' && batch.status !== 'READY') {
      throw new BadRequestException('Only DRAFT or READY batches can be run');
    }
    if (batch.lines.length === 0) {
      throw new BadRequestException('Batch has no lines');
    }

    // Post GL journal entry for the payment run (use system AP/bank accounts if configured)
    const apAccount = await prisma.account.findFirst({
      where: { tenantId, type: 'LIABILITY', isActive: true },
      orderBy: { code: 'asc' },
    });
    const bankAccount = await prisma.account.findFirst({
      where: { tenantId, type: 'ASSET', isActive: true },
      orderBy: { code: 'asc' },
    });

    const journalCount = await prisma.journal.count({ where: { tenantId } });
    const entryNumber = `PAY-${String(journalCount + 1).padStart(6, '0')}`;

    const journalEntries: Prisma.JournalEntryCreateWithoutJournalInput[] = [];
    if (apAccount && bankAccount) {
      journalEntries.push(
        { tenantId, account: { connect: { id: apAccount.id } }, description: `AP clearing — batch ${batch.batchNumber}`, debit: batch.totalAmount, credit: new Prisma.Decimal(0) },
        { tenantId, account: { connect: { id: bankAccount.id } }, description: `Bank payment — batch ${batch.batchNumber}`, debit: new Prisma.Decimal(0), credit: batch.totalAmount },
      );
    }

    const journal = await prisma.journal.create({
      data: {
        tenantId,
        orgId: orgId || 'org-system-default',
        entryNumber,
        date: new Date(),
        status: 'POSTED',
        notes: `Vendor payment run — batch ${batch.batchNumber}`,
        createdBy: userId,
        ...(journalEntries.length > 0 ? { entries: { create: journalEntries } } : {}),
      },
    });

    // Mark all lines as settled
    await prisma.paymentBatchLine.updateMany({
      where: { batchId, status: 'INCLUDED' },
      data: { status: 'SETTLED', settledAt: new Date() },
    });

    // Mark batch as completed
    const updated = await prisma.paymentBatch.update({
      where: { id: batchId },
      data: {
        status: 'COMPLETED',
        submittedAt: new Date(),
        submittedBy: userId,
        updatedBy: userId,
      },
    });

    return { batch: updated, journalId: journal.id, linesSettled: batch.lines.length };
  }

  async exportPaymentBatch(tenantId: string, batchId: string, format: string) {
    const batch = await this.getPaymentBatch(tenantId, batchId);
    const lines = batch.lines;

    if (format === 'NACHA') {
      // NACHA ACH fixed-width format (simplified representative output)
      const fileDate = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const header = `101 ${fileDate}${batch.batchNumber.padEnd(23)}ACH Payment Batch`.slice(0, 94);
      const detail = lines
        .map(
          (l, i) =>
            `6 ${String(i + 1).padStart(7, '0')} ${Number(l.amount).toFixed(2).padStart(12, '0')} ${l.invoiceId.slice(0, 15).padEnd(15)} ${l.status}`,
        )
        .join('\n');
      const footer = `9${String(lines.length).padStart(6, '0')}${Number(batch.totalAmount).toFixed(2).padStart(12, '0')}`;
      return { format: 'NACHA', content: [header, detail, footer].join('\n') };
    }

    if (format === 'SEPA_XML') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${batch.batchNumber}</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${lines.length}</NbOfTxs>
      <CtrlSum>${batch.totalAmount}</CtrlSum>
    </GrpHdr>
    ${lines
      .map(
        (l) => `<PmtInf>
      <EndToEndId>${l.id}</EndToEndId>
      <Amt Ccy="${batch.currency}">${Number(l.amount).toFixed(2)}</Amt>
      <Ref>${l.invoiceId}</Ref>
    </PmtInf>`,
      )
      .join('\n    ')}
  </CstmrCdtTrfInitn>
</Document>`;
      return { format: 'SEPA_XML', content: xml };
    }

    // Default CSV
    const rows = [
      'batch_id,line_id,reference_id,amount,currency,scheduled_date,status',
      ...lines.map(
        (l) =>
          `${batchId},${l.id},${l.invoiceId},${l.amount},${batch.currency},${l.scheduledPaymentDate.toISOString()},${l.status}`,
      ),
    ];
    return { format: 'CSV', content: rows.join('\n') };
  }

  // ── Report Drill-Through ────────────────────────────────────────────────────

  async reportDrilldown(
    tenantId: string,
    reportType: string,
    query: { accountId?: string; period?: string; limit?: string },
  ) {
    const limit = Math.min(parseInt(query.limit || '50', 10), 200);

    // Map report type to a filter strategy
    const where: Prisma.JournalEntryWhereInput = { tenantId };
    if (query.accountId) where.accountId = query.accountId;
    if (query.period) {
      const parts = query.period.split('-');
      const y = parseInt(parts[0] ?? '2024', 10);
      const m = parseInt(parts[1] ?? '1', 10);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.journal = { date: { gte: start, lt: end } };
    }
    let accountTypeFilter: string[] | undefined;
    if (reportType === 'profit_loss') accountTypeFilter = ['REVENUE', 'EXPENSE'];
    else if (reportType === 'balance_sheet') accountTypeFilter = ['ASSET', 'LIABILITY', 'EQUITY'];

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        journal: { select: { entryNumber: true, notes: true, status: true, date: true } },
        account: { select: { code: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const filteredEntries = accountTypeFilter
      ? entries.filter((e) => e.account && accountTypeFilter!.includes(e.account.type))
      : entries;

    const total = await prisma.journalEntry.count({ where });

    return {
      reportType,
      filters: query,
      total,
      entries: filteredEntries.map((e) => ({
        id: e.id,
        journalRef: e.journal.entryNumber,
        journalDesc: e.journal.notes,
        journalStatus: e.journal.status,
        postedAt: e.journal.date,
        account: e.account ? { code: e.account.code, name: e.account.name, type: e.account.type } : null,
        debit: e.debit,
        credit: e.credit,
        description: e.description,
        date: e.createdAt,
      })),
    };
  }

  // ── AP Payables Dashboard Stats ─────────────────────────────────────────────

  async getPayablesStats(tenantId: string) {
    const [openPOs, exceptionCount, batchStats, matchRuleCount] = await Promise.all([
      prisma.purchaseOrder.count({ where: { tenantId, status: { notIn: ['CANCELLED', 'RECEIVED'] } } }),
      prisma.aPMatchException.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.paymentBatch.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.aPMatchRule.count({ where: { tenantId, status: 'ACTIVE', deletedAt: null } }),
    ]);

    const draftBatches = batchStats.find((b) => b.status === 'DRAFT');
    const completedBatches = batchStats.find((b) => b.status === 'COMPLETED');

    return {
      openPurchaseOrders: openPOs,
      pendingExceptions: exceptionCount,
      draftBatches: draftBatches ? { count: draftBatches._count, total: draftBatches._sum.totalAmount } : { count: 0, total: 0 },
      completedBatches: completedBatches ? { count: completedBatches._count, total: completedBatches._sum.totalAmount } : { count: 0, total: 0 },
      activeMatchRules: matchRuleCount,
    };
  }
}
