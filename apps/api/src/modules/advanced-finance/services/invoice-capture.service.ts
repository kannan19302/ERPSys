import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoiceCaptureService {
  // ── Capture Header CRUD ───────────────────────────────────────────────────

  async listCaptures(tenantId: string, status?: string) {
    return prisma.aPInvoiceCapture.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { lines: true } },
      },
    });
  }

  async getCapture(tenantId: string, id: string) {
    const capture = await prisma.aPInvoiceCapture.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!capture) throw new NotFoundException('Invoice capture record not found');
    return capture;
  }

  async createCapture(
    tenantId: string,
    userId: string,
    dto: { fileName: string; rawText?: string },
  ) {
    // 1. Initial Draft Record Creation
    const capture = await prisma.aPInvoiceCapture.create({
      data: {
        tenantId,
        fileName: dto.fileName,
        rawText: dto.rawText || null,
        status: 'QUEUED',
        confidenceScore: new Prisma.Decimal(0.0),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // 2. Trigger parsing (OCR Simulation)
    if (dto.rawText) {
      return this.processOcrParser(tenantId, capture.id, dto.rawText, userId);
    }

    return capture;
  }

  async updateCapture(
    tenantId: string,
    id: string,
    userId: string,
    dto: {
      vendorName?: string;
      invoiceNumber?: string;
      invoiceDate?: string;
      dueDate?: string;
      totalAmount?: number;
      currency?: string;
      matchingPurchaseOrderId?: string;
      notes?: string;
      status?: string;
    },
  ) {
    await this.getCapture(tenantId, id);
    return prisma.aPInvoiceCapture.update({
      where: { id },
      data: {
        ...(dto.vendorName !== undefined ? { vendorName: dto.vendorName } : {}),
        ...(dto.invoiceNumber !== undefined ? { invoiceNumber: dto.invoiceNumber } : {}),
        ...(dto.invoiceDate ? { invoiceDate: new Date(dto.invoiceDate) } : {}),
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.totalAmount !== undefined
          ? { totalAmount: new Prisma.Decimal(dto.totalAmount) }
          : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.matchingPurchaseOrderId !== undefined
          ? { matchingPurchaseOrderId: dto.matchingPurchaseOrderId }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        updatedBy: userId,
      },
    });
  }

  async deleteCapture(tenantId: string, id: string) {
    const capture = await this.getCapture(tenantId, id);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('Cannot delete an already processed invoice capture record');
    }
    return prisma.aPInvoiceCapture.delete({ where: { id } });
  }

  // ── OCR Simulated Extraction ──────────────────────────────────────────────

  private async processOcrParser(
    tenantId: string,
    id: string,
    text: string,
    userId: string,
  ) {
    // Simulated Regex & Keyword Parsing
    // Try to extract: Vendor Name, Invoice Number, Invoice Date, Total Amount, PO references
    let vendorName = 'Acme Corp';
    let invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    let invoiceDate = new Date();
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    let totalAmount = 1500.0;
    let matchingPOId: string | null = null;
    let confidence = 0.85;

    // Look for keywords
    if (text.toLowerCase().includes('globex')) {
      vendorName = 'Globex Corporation';
    } else if (text.toLowerCase().includes('initech')) {
      vendorName = 'Initech Inc';
    }

    const invNumMatch = text.match(/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (invNumMatch && invNumMatch[1]) {
      invoiceNumber = invNumMatch[1];
      confidence += 0.05;
    }

    const totalMatch = text.match(/(?:total|amount|due)\s*:?\s*\$?\s*([\d,]+\.?\d*)/i);
    if (totalMatch && totalMatch[1]) {
      totalAmount = parseFloat(totalMatch[1].replace(/,/g, ''));
      confidence += 0.05;
    }

    const poMatch = text.match(/po\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (poMatch && poMatch[1]) {
      const poNum = poMatch[1];
      // Try to find matching PO in DB
      const po = await prisma.purchaseOrder.findFirst({
        where: { tenantId, poNumber: poNum },
      });
      if (po) {
        matchingPOId = po.id;
        confidence += 0.05;
      }
    }

    // Set high confidence if everything looks clean
    if (confidence > 0.95) confidence = 0.98;

    // Create lines
    const lineItems = [
      { description: 'Cloud Subscription Services', quantity: 1, unitPrice: totalAmount, amount: totalAmount },
    ];

    await prisma.$transaction(async (tx) => {
      await tx.aPInvoiceCapture.update({
        where: { id },
        data: {
          vendorName,
          invoiceNumber,
          invoiceDate,
          dueDate,
          totalAmount: new Prisma.Decimal(totalAmount),
          matchingPurchaseOrderId: matchingPOId,
          confidenceScore: new Prisma.Decimal(confidence),
          status: confidence >= 0.95 ? 'QUEUED' : 'REVIEW_REQUIRED',
        },
      });

      await tx.aPInvoiceCaptureLine.createMany({
        data: lineItems.map((item) => ({
          tenantId,
          captureId: id,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          amount: new Prisma.Decimal(item.amount),
        })),
      });
    });

    // Auto-approve if score is very high and matches PO
    if (confidence >= 0.95 && matchingPOId) {
      try {
        await this.approveCapture(tenantId, id, userId);
      } catch {
        // Fallback to manual review if auto-posting fails
        await prisma.aPInvoiceCapture.update({
          where: { id },
          data: { status: 'REVIEW_REQUIRED' },
        });
      }
    }

    return this.getCapture(tenantId, id);
  }

  // ── Auto Coding ──

  async autoCode(tenantId: string, id: string) {
    const capture = await this.getCapture(tenantId, id);
    
    // Look up historical matches for this vendor to auto-code the suggest GL accounts
    let suggestedAccountId: string | null = null;
    let suggestedCostCenterId: string | null = null;

    if (capture.vendorName) {
      // Find the most recent matched invoice capture or manual invoice for this vendor
      const historicalMatch = await prisma.aPInvoiceCaptureLine.findFirst({
        where: {
          tenantId,
          capture: {
            tenantId,
            vendorName: capture.vendorName,
            status: 'PROCESSED',
          },
          suggestedAccountId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (historicalMatch) {
        suggestedAccountId = historicalMatch.suggestedAccountId;
        suggestedCostCenterId = historicalMatch.suggestedCostCenterId;
      }
    }

    // Default fallbacks if no history exists (e.g. general expense account)
    if (!suggestedAccountId) {
      const defaultExpAcc = await prisma.account.findFirst({
        where: { tenantId, type: 'EXPENSE' },
        orderBy: { code: 'asc' },
      });
      if (defaultExpAcc) suggestedAccountId = defaultExpAcc.id;
    }

    // Update lines suggestions
    if (capture.lines.length > 0 && suggestedAccountId) {
      await prisma.aPInvoiceCaptureLine.updateMany({
        where: { captureId: id },
        data: {
          suggestedAccountId,
          suggestedCostCenterId,
        },
      });
    }

    return this.getCapture(tenantId, id);
  }

  // ── Approval and Posting ──

  async approveCapture(tenantId: string, id: string, userId: string) {
    const capture = await this.getCapture(tenantId, id);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('This capture is already processed');
    }

    // Verify suggested accounts are filled for all lines
    const missingAccounts = capture.lines.some((l) => !l.suggestedAccountId);
    if (missingAccounts) {
      throw new BadRequestException('All invoice lines must have a suggested GL Account before approval');
    }

    // Process approval
    await prisma.$transaction(async (tx) => {
      // 1. Mark status PROCESSED
      await tx.aPInvoiceCapture.update({
        where: { id },
        data: { status: 'PROCESSED', updatedBy: userId },
      });

      // 2. Generate double-entry journal postings (Accrued Liabilities / Expenses)
      const journalNumber = `AP-OCR-${Date.now().toString().slice(-6)}`;
      const totalAmt = Number(capture.totalAmount || 0);

      // Find an accounts payable liability account
      const apLiabilityAcc = await tx.account.findFirst({
        where: { tenantId, type: 'LIABILITY', name: { contains: 'Payable' } },
      });
      const liabilityAccountId = apLiabilityAcc?.id;

      if (liabilityAccountId && totalAmt > 0) {
        // Create GL Journal
        const journal = await tx.journal.create({
          data: {
            tenantId,
            orgId: 'org-system-default',
            entryNumber: journalNumber,
            date: new Date(),
            status: 'POSTED',
            notes: `Auto-posted via AI Invoice Capture OCR. Reference: ${capture.invoiceNumber || 'N/A'} (Vendor: ${capture.vendorName || 'N/A'})`,
            createdBy: userId,
          },
        });

        // Debit Expenses (from suggestions)
        for (const line of capture.lines) {
          if (line.suggestedAccountId) {
            await tx.journalEntry.create({
              data: {
                tenantId,
                journalId: journal.id,
                accountId: line.suggestedAccountId,
                costCenterId: line.suggestedCostCenterId || null,
                debit: line.amount,
                credit: new Prisma.Decimal(0.0),
                description: line.description,
              },
            });
          }
        }

        // Credit Accounts Payable
        await tx.journalEntry.create({
          data: {
            tenantId,
            journalId: journal.id,
            accountId: liabilityAccountId,
            debit: new Prisma.Decimal(0.0),
            credit: new Prisma.Decimal(totalAmt),
            description: `AP recognition for invoice ${capture.invoiceNumber || 'N/A'}`,
          },
        });
      }

      // 3. Mark PO as closed/billed if referenced
      if (capture.matchingPurchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: capture.matchingPurchaseOrderId },
          data: { status: 'BILLED' },
        });
      }
    });

    return this.getCapture(tenantId, id);
  }

  async rejectCapture(tenantId: string, id: string, userId: string, notes?: string) {
    const capture = await this.getCapture(tenantId, id);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('Cannot reject an already processed record');
    }
    return prisma.aPInvoiceCapture.update({
      where: { id },
      data: { status: 'REJECTED', notes: notes || capture.notes, updatedBy: userId },
    });
  }

  // ── Line Items Operations ─────────────────────────────────────────────────

  async createLine(
    tenantId: string,
    captureId: string,
    dto: {
      description: string;
      quantity: number;
      unitPrice: number;
      suggestedAccountId?: string;
      suggestedCostCenterId?: string;
    },
  ) {
    const capture = await this.getCapture(tenantId, captureId);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('Cannot add lines to a processed invoice record');
    }

    const amount = new Prisma.Decimal((dto.quantity * dto.unitPrice).toFixed(2));

    const line = await prisma.aPInvoiceCaptureLine.create({
      data: {
        tenantId,
        captureId,
        description: dto.description,
        quantity: new Prisma.Decimal(dto.quantity),
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        amount,
        suggestedAccountId: dto.suggestedAccountId || null,
        suggestedCostCenterId: dto.suggestedCostCenterId || null,
      },
    });

    // Update total amount on header
    const currentTotal = Number(capture.totalAmount || 0);
    await prisma.aPInvoiceCapture.update({
      where: { id: captureId },
      data: { totalAmount: new Prisma.Decimal((currentTotal + Number(amount)).toFixed(2)) },
    });

    return line;
  }

  async updateLine(
    tenantId: string,
    captureId: string,
    lineId: string,
    dto: {
      description?: string;
      quantity?: number;
      unitPrice?: number;
      suggestedAccountId?: string;
      suggestedCostCenterId?: string;
    },
  ) {
    const capture = await this.getCapture(tenantId, captureId);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('Cannot modify lines of a processed invoice record');
    }

    const line = await prisma.aPInvoiceCaptureLine.findFirst({
      where: { id: lineId, captureId, tenantId },
    });
    if (!line) throw new NotFoundException('Invoice capture line not found');

    const nextQty = dto.quantity !== undefined ? dto.quantity : Number(line.quantity);
    const nextPrice = dto.unitPrice !== undefined ? dto.unitPrice : Number(line.unitPrice);
    const amount = new Prisma.Decimal((nextQty * nextPrice).toFixed(2));

    const updatedLine = await prisma.aPInvoiceCaptureLine.update({
      where: { id: lineId },
      data: {
        ...(dto.description ? { description: dto.description } : {}),
        quantity: new Prisma.Decimal(nextQty),
        unitPrice: new Prisma.Decimal(nextPrice),
        amount,
        ...(dto.suggestedAccountId !== undefined ? { suggestedAccountId: dto.suggestedAccountId } : {}),
        ...(dto.suggestedCostCenterId !== undefined ? { suggestedCostCenterId: dto.suggestedCostCenterId } : {}),
      },
    });

    // Recalculate header total
    const allLines = await prisma.aPInvoiceCaptureLine.findMany({ where: { captureId } });
    const nextTotal = allLines.reduce((s, l) => s + Number(l.amount), 0);
    await prisma.aPInvoiceCapture.update({
      where: { id: captureId },
      data: { totalAmount: new Prisma.Decimal(nextTotal.toFixed(2)) },
    });

    return updatedLine;
  }

  async deleteLine(tenantId: string, captureId: string, lineId: string) {
    const capture = await this.getCapture(tenantId, captureId);
    if (capture.status === 'PROCESSED') {
      throw new BadRequestException('Cannot delete lines of a processed invoice record');
    }

    const line = await prisma.aPInvoiceCaptureLine.findFirst({
      where: { id: lineId, captureId, tenantId },
    });
    if (!line) throw new NotFoundException('Invoice capture line not found');

    await prisma.aPInvoiceCaptureLine.delete({ where: { id: lineId } });

    // Recalculate header total
    const allLines = await prisma.aPInvoiceCaptureLine.findMany({ where: { captureId } });
    const nextTotal = allLines.reduce((s, l) => s + Number(l.amount), 0);
    await prisma.aPInvoiceCapture.update({
      where: { id: captureId },
      data: { totalAmount: new Prisma.Decimal(nextTotal.toFixed(2)) },
    });

    return { deleted: true, lineId };
  }
}
