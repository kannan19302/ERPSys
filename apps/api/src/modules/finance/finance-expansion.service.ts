import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CreditNote {
  id: string;
  tenantId: string;
  orgId: string;
  customerId: string;
  customerName?: string;
  invoiceId?: string;
  creditNoteNumber: string;
  reason: string;
  status: "DRAFT" | "APPLIED" | "VOID";
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: Date;
  createdAt: Date;
  createdBy: string;
}

export interface DebitNote {
  id: string;
  tenantId: string;
  orgId: string;
  vendorId: string;
  vendorName?: string;
  purchaseOrderId?: string;
  billId?: string;
  debitNoteNumber: string;
  reason: string;
  status: "DRAFT" | "APPLIED" | "VOID";
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  issueDate: Date;
  createdAt: Date;
  createdBy: string;
}

export interface RecurringInvoiceTemplate {
  id: string;
  tenantId: string;
  orgId: string;
  customerId: string;
  templateName: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  interval: number;
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  lineItems: LineItem[];
  notes?: string;
  lastGeneratedDate?: Date;
  createdAt: Date;
}

export interface GeneratedInvoice {
  id: string;
  templateId: string;
  tenantId: string;
  invoiceId: string;
  generatedDate: Date;
  invoiceNumber: string;
  totalAmount: number;
}

export interface ExpenseReport {
  id: string;
  tenantId: string;
  orgId: string;
  title: string;
  description?: string;
  employeeId: string;
  expenseDate: Date;
  categoryId?: string;
  amount: number;
  currency: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REIMBURSED";
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface ExpenseCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  maxReimbursable?: number;
  requiresReceipt: boolean;
}

export interface DunningRunResult {
  customerId: string;
  level: number;
  amount: number;
  daysOverdue: number;
}

export interface DunningRun {
  id: string;
  tenantId: string;
  title: string;
  asOfDate: Date;
  status: "DRAFT" | "SENT";
  levelIds: string[];
  customerIds: string[];
  minOverdueDays: number;
  results: DunningRunResult[];
  totalLetters: number;
  totalAmount: number;
  createdAt: Date;
}

export interface DunningLevel {
  id: string;
  tenantId: string;
  name: string;
  levelNumber: number;
  minOverdueDays: number;
  maxOverdueDays?: number;
  feeAmount: number;
  feePercentage: number;
  emailTemplate?: string;
  interestRate: number;
}

export interface StatementLineItem {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
}

export interface CustomerStatement {
  id: string;
  tenantId: string;
  customerId: string;
  asOfDate: Date;
  status: "DRAFT" | "SENT";
  includePaidInvoices: boolean;
  notes?: string;
  lineItems: StatementLineItem[];
  totalDue: number;
  generatedAt: Date;
  sentAt?: Date;
}

export interface StatementTemplate {
  id: string;
  tenantId: string;
  name: string;
  headerText?: string;
  footerText?: string;
  includePaymentHistory: boolean;
  includeAgingBreakdown: boolean;
  showDueAmount: boolean;
}

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

@Injectable()
export class FinanceExpansionService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  // ── Mapping helpers ──

  private toCreditNote(row: any): CreditNote {
    const items = (row.lineItems as unknown as LineItem[]) ?? [];
    return {
      id: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      customerId: row.customerId,
      customerName: row.customer?.name,
      invoiceId: row.invoiceId ?? undefined,
      creditNoteNumber: row.noteNumber,
      reason: row.reason ?? "",
      status: row.status as CreditNote["status"],
      lineItems: items,
      subtotal: items.reduce((s, i) => s + i.subtotal, 0),
      taxAmount: items.reduce((s, i) => s + i.taxAmount, 0),
      totalAmount: Number(row.amount),
      issueDate: row.issueDate,
      createdAt: row.createdAt,
      createdBy: row.createdBy ?? "",
    };
  }

  private toDebitNote(row: any): DebitNote {
    const items = (row.lineItems as unknown as LineItem[]) ?? [];
    return {
      id: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      vendorId: row.vendorId,
      vendorName: row.vendor?.name,
      purchaseOrderId: row.purchaseOrderId ?? undefined,
      billId: row.billId ?? undefined,
      debitNoteNumber: row.noteNumber,
      reason: row.reason ?? "",
      status: row.status as DebitNote["status"],
      lineItems: items,
      subtotal: items.reduce((s, i) => s + i.subtotal, 0),
      taxAmount: items.reduce((s, i) => s + i.taxAmount, 0),
      totalAmount: Number(row.amount),
      issueDate: row.issueDate,
      createdAt: row.createdAt,
      createdBy: row.createdBy ?? "",
    };
  }

  private toRecurringTemplate(row: any): RecurringInvoiceTemplate {
    return {
      id: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      customerId: row.customerId,
      templateName: row.templateName,
      frequency: row.frequency as RecurringInvoiceTemplate["frequency"],
      interval: row.intervalCount,
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      nextRunDate: row.nextRunDate,
      status: row.status as RecurringInvoiceTemplate["status"],
      lineItems: (row.lineItems as unknown as LineItem[]) ?? [],
      notes: row.notes ?? undefined,
      lastGeneratedDate: row.lastRunDate ?? undefined,
      createdAt: row.createdAt,
    };
  }

  private toGeneratedInvoice(row: any): GeneratedInvoice {
    return {
      id: row.id,
      templateId: row.templateId,
      tenantId: row.tenantId,
      invoiceId: row.invoiceId,
      generatedDate: row.generatedAt,
      invoiceNumber: row.invoiceNumber,
      totalAmount: Number(row.totalAmount),
    };
  }

  private toExpenseReport(row: any): ExpenseReport {
    return {
      id: row.id,
      tenantId: row.tenantId,
      orgId: row.orgId,
      title: row.title,
      description: row.description ?? undefined,
      employeeId: row.employeeId,
      expenseDate: row.expenseDate,
      categoryId: row.categoryId ?? undefined,
      amount: Number(row.totalAmount),
      currency: row.currency,
      status: row.status as ExpenseReport["status"],
      receiptUrl: row.receiptUrl ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      createdBy: row.createdBy ?? "",
    };
  }

  private toExpenseCategory(row: any): ExpenseCategory {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.category,
      description: row.description ?? undefined,
      maxReimbursable: row.maxAmountPerItem
        ? Number(row.maxAmountPerItem)
        : undefined,
      requiresReceipt: Number(row.receiptRequiredAbove) > 0,
    };
  }

  private toDunningLevel(row: any): DunningLevel {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.levelName,
      levelNumber: row.levelNumber,
      minOverdueDays: row.daysOverdue,
      maxOverdueDays: row.maxOverdueDays ?? undefined,
      feeAmount: Number(row.feeAmount),
      feePercentage: Number(row.feePercentage),
      emailTemplate: row.emailTemplate ?? undefined,
      interestRate: Number(row.interestRate),
    };
  }

  private toDunningRun(row: any): DunningRun {
    return {
      id: row.id,
      tenantId: row.tenantId,
      title: row.title,
      asOfDate: row.runDate,
      status: row.status as DunningRun["status"],
      levelIds: (row.levelIds ?? []) as string[],
      customerIds: (row.customerIds ?? []) as string[],
      minOverdueDays: row.minOverdueDays,
      results: (row.results ?? []) as DunningRunResult[],
      totalLetters: row.totalLetters,
      totalAmount: Number(row.totalAmount),
      createdAt: row.createdAt,
    };
  }

  private toCustomerStatement(row: any): CustomerStatement {
    const items = (row.lineItems ?? []) as StatementLineItem[];
    return {
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      asOfDate: row.periodEnd,
      status: row.status as CustomerStatement["status"],
      includePaidInvoices: row.includePaidInvoices,
      notes: row.notes ?? undefined,
      lineItems: items,
      totalDue: items.reduce((s, i) => s + i.outstandingAmount, 0),
      generatedAt: row.generatedAt,
      sentAt: row.sentAt ?? undefined,
    };
  }

  private toStatementTemplate(row: any): StatementTemplate {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.templateName,
      headerText: row.headerText ?? undefined,
      footerText: row.footerText ?? undefined,
      includePaymentHistory: row.includePaymentHistory,
      includeAgingBreakdown: row.includeAgingBreakdown,
      showDueAmount: row.showDueAmount,
    };
  }

  // ──────────────────────────────────────────────
  // 1. Credit Notes
  // ──────────────────────────────────────────────

  async createCreditNote(
    tenantId: string,
    orgId: string,
    dto: {
      customerId: string;
      invoiceId?: string;
      creditNoteNumber: string;
      reason: string;
      issueDate: string;
      amount?: number;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
    },
    createdBy: string,
  ): Promise<CreditNote> {
    const existing = await prisma.creditNote.findFirst({
      where: { tenantId, noteNumber: dto.creditNoteNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Credit note number ${dto.creditNoteNumber} already exists.`,
      );
    }

    if (dto.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: dto.invoiceId, tenantId, deletedAt: null },
      });
      if (!invoice) throw new NotFoundException("Invoice not found");
    }

    // A caller passing a flat `amount` (no line-item breakdown) gets a single
    // synthesized line item for it — this is the common case for simple
    // credit adjustments from the UI, which has no line-item editor.
    const lineItemsInput =
      dto.amount !== undefined
        ? [
            {
              description: dto.reason || "Credit Adjustment",
              quantity: 1,
              unitPrice: dto.amount,
              taxRate: 0,
            },
          ]
        : dto.lineItems;

    let subtotal = 0;
    let totalTax = 0;
    const lines: LineItem[] = lineItemsInput.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      totalTax += lineTax;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: lineSubtotal,
        taxAmount: lineTax,
        totalAmount: lineTotal,
      };
    });

    const totalAmount = subtotal + totalTax;
    const id = crypto.randomUUID();

    await prisma.creditNote.create({
      data: {
        id,
        tenantId,
        orgId,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId ?? null,
        noteNumber: dto.creditNoteNumber,
        reason: dto.reason,
        status: "DRAFT",
        lineItems: lines as unknown as Prisma.InputJsonValue,
        amount: new Prisma.Decimal(totalAmount),
        issueDate: new Date(dto.issueDate),
        createdBy,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.credit-note.created", {
        creditNoteId: id,
        tenantId,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId,
        totalAmount,
      });
    }

    return this.toCreditNote({
      id,
      tenantId,
      orgId,
      customerId: dto.customerId,
      invoiceId: dto.invoiceId ?? null,
      noteNumber: dto.creditNoteNumber,
      reason: dto.reason,
      status: "DRAFT",
      lineItems: lines,
      amount: new Prisma.Decimal(totalAmount),
      issueDate: new Date(dto.issueDate),
      createdAt: new Date(),
      createdBy,
    });
  }

  async getCreditNotes(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<CreditNote[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rows = await prisma.creditNote.findMany({
      where: { tenantId },
      include: { customer: { select: { name: true } } },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toCreditNote(r));
  }

  async getCreditNoteById(tenantId: string, id: string): Promise<CreditNote> {
    const row = await prisma.creditNote.findFirst({
      where: { id, tenantId },
      include: { customer: { select: { name: true } } },
    });
    if (!row) {
      throw new NotFoundException("Credit note not found");
    }
    return this.toCreditNote(row);
  }

  async updateCreditNote(
    tenantId: string,
    id: string,
    dto: {
      reason?: string;
      lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
    },
  ): Promise<CreditNote> {
    const row = await prisma.creditNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Credit note not found");
    }
    if (row.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT credit notes can be edited.");
    }

    const updateData: any = {};
    if (dto.reason !== undefined) {
      updateData.reason = dto.reason;
    }

    if (dto.lineItems) {
      let subtotal = 0;
      let totalTax = 0;
      const lines: LineItem[] = dto.lineItems.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        totalTax += lineTax;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          subtotal: lineSubtotal,
          taxAmount: lineTax,
          totalAmount: lineTotal,
        };
      });
      updateData.lineItems = lines as unknown as Prisma.InputJsonValue;
      updateData.amount = new Prisma.Decimal(subtotal + totalTax);
    }

    const updated = await prisma.creditNote.update({
      where: { id },
      data: updateData,
    });
    return this.toCreditNote(updated);
  }

  async deleteCreditNote(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.creditNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Credit note not found");
    }
    if (row.status === "APPLIED") {
      throw new BadRequestException("Cannot delete an applied credit note.");
    }
    await prisma.creditNote.delete({ where: { id } });
    return { success: true };
  }

  async applyCreditNote(tenantId: string, id: string): Promise<CreditNote> {
    const row = await prisma.creditNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Credit note not found");
    }
    if (row.status !== "DRAFT") {
      throw new BadRequestException(
        `Credit note cannot be applied from status ${row.status}.`,
      );
    }

    if (row.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: row.invoiceId, tenantId, deletedAt: null },
      });
      if (invoice) {
        const currentPaid = Number(invoice.paidAmount);
        const newPaid = Math.max(0, currentPaid - Number(row.amount));
        await prisma.invoice.update({
          where: { id: row.invoiceId },
          data: {
            paidAmount: new Prisma.Decimal(newPaid),
          },
        });
      }
    }

    const updated = await prisma.creditNote.update({
      where: { id },
      data: { status: "APPLIED" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.credit-note.applied", {
        creditNoteId: id,
        tenantId,
        customerId: row.customerId,
        invoiceId: row.invoiceId,
        totalAmount: Number(row.amount),
      });
    }

    return this.toCreditNote(updated);
  }

  async voidCreditNote(tenantId: string, id: string): Promise<CreditNote> {
    const row = await prisma.creditNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Credit note not found");
    }
    if (row.status === "VOID") {
      throw new BadRequestException("Credit note is already void.");
    }

    const updated = await prisma.creditNote.update({
      where: { id },
      data: { status: "VOID" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.credit-note.voided", {
        creditNoteId: id,
        tenantId,
      });
    }

    return this.toCreditNote(updated);
  }

  // ──────────────────────────────────────────────
  // 2. Debit Notes
  // ──────────────────────────────────────────────

  async createDebitNote(
    tenantId: string,
    orgId: string,
    dto: {
      vendorId: string;
      purchaseOrderId?: string;
      billId?: string;
      debitNoteNumber: string;
      reason: string;
      issueDate: string;
      amount?: number;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
    },
    createdBy: string,
  ): Promise<DebitNote> {
    const existing = await prisma.debitNote.findFirst({
      where: { tenantId, noteNumber: dto.debitNoteNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Debit note number ${dto.debitNoteNumber} already exists.`,
      );
    }

    const lineItemsInput =
      dto.amount !== undefined
        ? [
            {
              description: dto.reason || "Debit Adjustment",
              quantity: 1,
              unitPrice: dto.amount,
              taxRate: 0,
            },
          ]
        : dto.lineItems;

    let subtotal = 0;
    let totalTax = 0;
    const lines: LineItem[] = lineItemsInput.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      totalTax += lineTax;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: lineSubtotal,
        taxAmount: lineTax,
        totalAmount: lineTotal,
      };
    });

    const totalAmount = subtotal + totalTax;
    const id = crypto.randomUUID();

    await prisma.debitNote.create({
      data: {
        id,
        tenantId,
        orgId,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId ?? null,
        billId: dto.billId ?? null,
        noteNumber: dto.debitNoteNumber,
        reason: dto.reason,
        status: "DRAFT",
        lineItems: lines as unknown as Prisma.InputJsonValue,
        amount: new Prisma.Decimal(totalAmount),
        issueDate: new Date(dto.issueDate),
        createdBy,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.debit-note.created", {
        debitNoteId: id,
        tenantId,
        vendorId: dto.vendorId,
        totalAmount,
      });
    }

    return this.toDebitNote({
      id,
      tenantId,
      orgId,
      vendorId: dto.vendorId,
      purchaseOrderId: dto.purchaseOrderId ?? null,
      billId: dto.billId ?? null,
      noteNumber: dto.debitNoteNumber,
      reason: dto.reason,
      status: "DRAFT",
      lineItems: lines,
      amount: new Prisma.Decimal(totalAmount),
      issueDate: new Date(dto.issueDate),
      createdAt: new Date(),
      createdBy,
    });
  }

  async getDebitNotes(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<DebitNote[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rows = await prisma.debitNote.findMany({
      where: { tenantId },
      include: { vendor: { select: { name: true } } },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toDebitNote(r));
  }

  async getDebitNoteById(tenantId: string, id: string): Promise<DebitNote> {
    const row = await prisma.debitNote.findFirst({
      where: { id, tenantId },
      include: { vendor: { select: { name: true } } },
    });
    if (!row) {
      throw new NotFoundException("Debit note not found");
    }
    return this.toDebitNote(row);
  }

  async updateDebitNote(
    tenantId: string,
    id: string,
    dto: {
      reason?: string;
      lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
    },
  ): Promise<DebitNote> {
    const row = await prisma.debitNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Debit note not found");
    }
    if (row.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT debit notes can be edited.");
    }

    const updateData: any = {};
    if (dto.reason !== undefined) {
      updateData.reason = dto.reason;
    }

    if (dto.lineItems) {
      let subtotal = 0;
      let totalTax = 0;
      const lines: LineItem[] = dto.lineItems.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;
        subtotal += lineSubtotal;
        totalTax += lineTax;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          subtotal: lineSubtotal,
          taxAmount: lineTax,
          totalAmount: lineTotal,
        };
      });
      updateData.lineItems = lines as unknown as Prisma.InputJsonValue;
      updateData.amount = new Prisma.Decimal(subtotal + totalTax);
    }

    const updated = await prisma.debitNote.update({
      where: { id },
      data: updateData,
    });
    return this.toDebitNote(updated);
  }

  async deleteDebitNote(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.debitNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Debit note not found");
    }
    if (row.status === "APPLIED") {
      throw new BadRequestException("Cannot delete an applied debit note.");
    }
    await prisma.debitNote.delete({ where: { id } });
    return { success: true };
  }

  async applyDebitNote(tenantId: string, id: string): Promise<DebitNote> {
    const row = await prisma.debitNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Debit note not found");
    }
    if (row.status !== "DRAFT") {
      throw new BadRequestException(
        `Debit note cannot be applied from status ${row.status}.`,
      );
    }

    const updated = await prisma.debitNote.update({
      where: { id },
      data: { status: "APPLIED" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.debit-note.applied", {
        debitNoteId: id,
        tenantId,
        vendorId: row.vendorId,
        totalAmount: Number(row.amount),
      });
    }

    return this.toDebitNote(updated);
  }

  async voidDebitNote(tenantId: string, id: string): Promise<DebitNote> {
    const row = await prisma.debitNote.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Debit note not found");
    }
    if (row.status === "VOID") {
      throw new BadRequestException("Debit note is already void.");
    }

    const updated = await prisma.debitNote.update({
      where: { id },
      data: { status: "VOID" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.debit-note.voided", {
        debitNoteId: id,
        tenantId,
      });
    }

    return this.toDebitNote(updated);
  }

  // ──────────────────────────────────────────────
  // 3. Recurring Invoices
  // ──────────────────────────────────────────────

  async createRecurringInvoice(
    tenantId: string,
    orgId: string,
    dto: {
      customerId: string;
      templateName: string;
      frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
      interval: number;
      startDate: string;
      endDate?: string;
      nextRunDate?: string;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
      notes?: string;
    },
  ): Promise<RecurringInvoiceTemplate> {
    const existing = await prisma.recurringInvoiceTemplate.findFirst({
      where: { tenantId, orgId, templateName: dto.templateName },
    });
    if (existing) {
      throw new BadRequestException(
        `Recurring template "${dto.templateName}" already exists.`,
      );
    }

    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const startDate = new Date(dto.startDate);
    const nextRunDate = dto.nextRunDate ? new Date(dto.nextRunDate) : startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const id = crypto.randomUUID();

    await prisma.recurringInvoiceTemplate.create({
      data: {
        id,
        tenantId,
        orgId,
        customerId: dto.customerId,
        templateName: dto.templateName,
        startDate,
        endDate,
        frequency: dto.frequency,
        intervalCount: dto.interval,
        nextRunDate,
        status: "ACTIVE",
        lineItems: dto.lineItems.map((item) => {
          const subtotal = item.quantity * item.unitPrice;
          const taxAmount = subtotal * (item.taxRate / 100);
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal,
            taxAmount,
            totalAmount: subtotal + taxAmount,
          };
        }) as unknown as Prisma.InputJsonValue,
        notes: dto.notes ?? null,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.recurring-invoice.created", {
        templateId: id,
        tenantId,
        customerId: dto.customerId,
        templateName: dto.templateName,
        frequency: dto.frequency,
        nextRunDate,
      });
    }

    return this.toRecurringTemplate({
      id,
      tenantId,
      orgId,
      customerId: dto.customerId,
      templateName: dto.templateName,
      startDate,
      endDate,
      frequency: dto.frequency,
      intervalCount: dto.interval,
      nextRunDate,
      status: "ACTIVE",
      lineItems: dto.lineItems.map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        const taxAmount = subtotal * (item.taxRate / 100);
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount,
        };
      }),
      notes: dto.notes ?? null,
      lastRunDate: null,
      createdAt: new Date(),
    });
  }

  async updateRecurringInvoice(
    tenantId: string,
    id: string,
    dto: {
      templateName?: string;
      frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
      interval?: number;
      endDate?: string;
      lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
      notes?: string;
    },
  ): Promise<RecurringInvoiceTemplate> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }

    const updateData: any = {};
    if (dto.templateName !== undefined)
      updateData.templateName = dto.templateName;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.interval !== undefined) updateData.intervalCount = dto.interval;
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.lineItems) {
      updateData.lineItems = dto.lineItems.map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        const taxAmount = subtotal * (item.taxRate / 100);
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount,
        };
      }) as unknown as Prisma.InputJsonValue;
    }

    const updated = await prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: updateData,
    });
    return this.toRecurringTemplate(updated);
  }

  async getRecurringInvoices(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<RecurringInvoiceTemplate[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rows = await prisma.recurringInvoiceTemplate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toRecurringTemplate(r));
  }

  async getRecurringInvoiceById(
    tenantId: string,
    id: string,
  ): Promise<RecurringInvoiceTemplate> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }
    return this.toRecurringTemplate(row);
  }

  async deleteRecurringInvoice(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }
    await prisma.recurringInvoiceTemplate.delete({ where: { id } });
    return { success: true };
  }

  async activateRecurringInvoice(
    tenantId: string,
    id: string,
  ): Promise<RecurringInvoiceTemplate> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }
    if (row.status === "COMPLETED") {
      throw new BadRequestException("Cannot activate a completed template.");
    }

    const updated = await prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.recurring-invoice.activated", {
        templateId: id,
        tenantId,
        templateName: row.templateName,
        nextRunDate: row.nextRunDate,
      });
    }

    return this.toRecurringTemplate(updated);
  }

  async pauseRecurringInvoice(
    tenantId: string,
    id: string,
  ): Promise<RecurringInvoiceTemplate> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }

    const updated = await prisma.recurringInvoiceTemplate.update({
      where: { id },
      data: { status: "PAUSED" },
    });
    return this.toRecurringTemplate(updated);
  }

  private computeNextRunDate(
    frequency: string,
    interval: number,
    from: Date,
  ): Date {
    const next = new Date(from);
    switch (frequency) {
      case "DAILY":
        next.setDate(next.getDate() + interval);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7 * interval);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + interval);
        break;
      case "QUARTERLY":
        next.setMonth(next.getMonth() + 3 * interval);
        break;
      case "YEARLY":
        next.setFullYear(next.getFullYear() + interval);
        break;
    }
    return next;
  }

  async generateNextInvoice(
    tenantId: string,
    templateId: string,
  ): Promise<{ generatedInvoice: GeneratedInvoice; invoiceId: string }> {
    const row = await prisma.recurringInvoiceTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Recurring invoice template not found");
    }
    if (row.status !== "ACTIVE") {
      throw new BadRequestException(
        "Template must be ACTIVE to generate an invoice.",
      );
    }

    const now = new Date();
    if (row.nextRunDate > now) {
      throw new BadRequestException("Next run date has not been reached yet.");
    }

    if (row.endDate && now > row.endDate) {
      await prisma.recurringInvoiceTemplate.update({
        where: { id: templateId },
        data: { status: "COMPLETED" },
      });
      throw new BadRequestException("Template has passed its end date.");
    }

    const lineItems = (row.lineItems as unknown as LineItem[]) ?? [];
    let subtotal = 0;
    let totalTax = 0;
    for (const item of lineItems) {
      subtotal += item.subtotal;
      totalTax += item.taxAmount;
    }
    const totalAmount = subtotal + totalTax;

    const invoiceNumber = `REC-${row.templateName.toUpperCase().replace(/\s+/g, "-")}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6)}`;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        orgId: row.orgId,
        customerId: row.customerId,
        invoiceNumber,
        dueDate: new Date(now.getTime() + 30 * 86400000),
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(totalTax),
        totalAmount: new Prisma.Decimal(totalAmount),
        paidAmount: new Prisma.Decimal(0),
        status: "DRAFT",
        notes: `Auto-generated from recurring template: ${row.templateName}`,
        createdBy: "system",
      },
    });

    for (const item of lineItems) {
      await prisma.invoiceLineItem.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(item.taxAmount),
          totalAmount: new Prisma.Decimal(item.totalAmount),
          sortOrder: 0,
        },
      });
    }

    const nextRun = this.computeNextRunDate(
      row.frequency,
      row.intervalCount,
      row.nextRunDate,
    );

    const templateUpdateData: any = {
      lastRunDate: now,
      nextRunDate: nextRun,
    };

    if (row.endDate && nextRun > row.endDate) {
      templateUpdateData.status = "COMPLETED";
    }

    await prisma.recurringInvoiceTemplate.update({
      where: { id: templateId },
      data: templateUpdateData,
    });

    const generatedId = crypto.randomUUID();
    await prisma.generatedInvoice.create({
      data: {
        id: generatedId,
        templateId,
        tenantId,
        invoiceId: invoice.id,
        invoiceNumber,
        totalAmount: new Prisma.Decimal(totalAmount),
        generatedAt: now,
      },
    });

    const generatedRecord: GeneratedInvoice = {
      id: generatedId,
      templateId,
      tenantId,
      invoiceId: invoice.id,
      generatedDate: now,
      invoiceNumber,
      totalAmount,
    };

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.recurring-invoice.generated", {
        templateId,
        invoiceId: invoice.id,
        tenantId,
        invoiceNumber,
        totalAmount,
        customerId: row.customerId,
      });
    }

    return { generatedInvoice: generatedRecord, invoiceId: invoice.id };
  }

  async getGeneratedInvoices(
    tenantId: string,
    templateId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<GeneratedInvoice[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { generatedAt: "desc" as const };
    const rows = await prisma.generatedInvoice.findMany({
      where: { tenantId, templateId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toGeneratedInvoice(r));
  }

  async getUpcomingInvoices(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<RecurringInvoiceTemplate[]> {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 86400000);
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { nextRunDate: "asc" as const };
    const rows = await prisma.recurringInvoiceTemplate.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        nextRunDate: { gte: now, lte: thirtyDays },
      },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toRecurringTemplate(r));
  }

  async bulkGenerate(
    tenantId: string,
  ): Promise<Array<{ templateId: string; invoiceId: string; status: string }>> {
    const now = new Date();
    const dueRows = await prisma.recurringInvoiceTemplate.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        nextRunDate: { lte: now },
      },
    });

    const results: Array<{
      templateId: string;
      invoiceId: string;
      status: string;
    }> = [];
    for (const row of dueRows) {
      try {
        if (row.endDate && row.nextRunDate > row.endDate) continue;
        const { invoiceId } = await this.generateNextInvoice(tenantId, row.id);
        results.push({ templateId: row.id, invoiceId, status: "success" });
      } catch {
        results.push({ templateId: row.id, invoiceId: "", status: "failed" });
      }
    }
    return results;
  }

  // ──────────────────────────────────────────────
  // 4. Expense Reports
  // ──────────────────────────────────────────────

  async createExpenseReport(
    tenantId: string,
    orgId: string,
    dto: {
      title: string;
      description?: string;
      employeeId: string;
      expenseDate: string;
      categoryId?: string;
      amount: number;
      currency?: string;
      receiptUrl?: string;
      notes?: string;
    },
    createdBy: string,
  ): Promise<ExpenseReport> {
    if (dto.categoryId) {
      const category = await prisma.expenseCategoryPolicy.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException("Expense category not found");
      }
      if (
        category.maxAmountPerItem !== null &&
        dto.amount > Number(category.maxAmountPerItem)
      ) {
        throw new BadRequestException(
          `Amount ${dto.amount} exceeds category maximum of ${category.maxAmountPerItem}.`,
        );
      }
    }

    const reportNumber = `EXP-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const id = crypto.randomUUID();

    await prisma.expenseReport.create({
      data: {
        id,
        tenantId,
        orgId,
        employeeId: dto.employeeId,
        reportNumber,
        title: dto.title,
        description: dto.description ?? null,
        totalAmount: new Prisma.Decimal(dto.amount),
        expenseDate: new Date(dto.expenseDate),
        categoryId: dto.categoryId ?? null,
        currency: dto.currency ?? "USD",
        receiptUrl: dto.receiptUrl ?? null,
        notes: dto.notes ?? null,
        status: "DRAFT",
        createdBy,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.expense.created", {
        expenseId: id,
        tenantId,
        employeeId: dto.employeeId,
        amount: dto.amount,
        categoryId: dto.categoryId,
      });
    }

    return this.toExpenseReport({
      id,
      tenantId,
      orgId,
      title: dto.title,
      description: dto.description ?? null,
      employeeId: dto.employeeId,
      totalAmount: new Prisma.Decimal(dto.amount),
      expenseDate: new Date(dto.expenseDate),
      categoryId: dto.categoryId ?? null,
      currency: dto.currency ?? "USD",
      receiptUrl: dto.receiptUrl ?? null,
      notes: dto.notes ?? null,
      status: "DRAFT",
      createdAt: new Date(),
      createdBy,
    });
  }

  async updateExpenseReport(
    tenantId: string,
    id: string,
    dto: {
      title?: string;
      description?: string;
      categoryId?: string;
      amount?: number;
      receiptUrl?: string;
      notes?: string;
    },
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status !== "DRAFT" && row.status !== "SUBMITTED") {
      throw new BadRequestException(
        "Only DRAFT or SUBMITTED expenses can be edited.",
      );
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.amount !== undefined)
      updateData.totalAmount = new Prisma.Decimal(dto.amount);
    if (dto.receiptUrl !== undefined) updateData.receiptUrl = dto.receiptUrl;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await prisma.expenseReport.update({
      where: { id },
      data: updateData,
    });
    return this.toExpenseReport(updated);
  }

  async getExpenseReports(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<ExpenseReport[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rows = await prisma.expenseReport.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toExpenseReport(r));
  }

  async getExpenseReportById(
    tenantId: string,
    id: string,
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    return this.toExpenseReport(row);
  }

  async deleteExpenseReport(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status === "APPROVED" || row.status === "REIMBURSED") {
      throw new BadRequestException(
        "Cannot delete an approved or reimbursed expense.",
      );
    }
    await prisma.expenseReport.delete({ where: { id } });
    return { success: true };
  }

  async submitExpenseReport(
    tenantId: string,
    id: string,
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status !== "DRAFT") {
      throw new BadRequestException("Only DRAFT expenses can be submitted.");
    }

    const updated = await prisma.expenseReport.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.expense.submitted", {
        expenseId: id,
        tenantId,
        employeeId: row.employeeId,
        amount: Number(row.totalAmount),
      });
    }

    return this.toExpenseReport(updated);
  }

  async approveExpenseReport(
    tenantId: string,
    id: string,
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status !== "SUBMITTED") {
      throw new BadRequestException("Only SUBMITTED expenses can be approved.");
    }

    const updated = await prisma.expenseReport.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.expense.approved", {
        expenseId: id,
        tenantId,
        employeeId: row.employeeId,
        amount: Number(row.totalAmount),
      });
    }

    return this.toExpenseReport(updated);
  }

  async rejectExpenseReport(
    tenantId: string,
    id: string,
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status !== "SUBMITTED") {
      throw new BadRequestException("Only SUBMITTED expenses can be rejected.");
    }

    const updated = await prisma.expenseReport.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return this.toExpenseReport(updated);
  }

  async reimburseExpenseReport(
    tenantId: string,
    id: string,
  ): Promise<ExpenseReport> {
    const row = await prisma.expenseReport.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense report not found");
    }
    if (row.status !== "APPROVED") {
      throw new BadRequestException(
        "Only APPROVED expenses can be reimbursed.",
      );
    }

    const updated = await prisma.expenseReport.update({
      where: { id },
      data: { status: "REIMBURSED" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.expense.reimbursed", {
        expenseId: id,
        tenantId,
        employeeId: row.employeeId,
        amount: Number(row.totalAmount),
      });
    }

    return this.toExpenseReport(updated);
  }

  async getPendingReimbursements(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<{ total: number; count: number; expenses: ExpenseReport[] }> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rows = await prisma.expenseReport.findMany({
      where: { tenantId, status: "APPROVED" },
      skip,
      take,
      orderBy,
    });
    const expenses = rows.map((r) => this.toExpenseReport(r));
    const total = expenses.reduce((sum, er) => sum + er.amount, 0);
    return { total, count: expenses.length, expenses };
  }

  // ── Expense Categories ──

  async createExpenseCategory(
    tenantId: string,
    dto: {
      name: string;
      description?: string;
      maxReimbursable?: number;
      requiresReceipt?: boolean;
    },
  ): Promise<ExpenseCategory> {
    const existing = await prisma.expenseCategoryPolicy.findFirst({
      where: { tenantId, category: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Category "${dto.name}" already exists.`);
    }

    const row = await prisma.expenseCategoryPolicy.create({
      data: {
        tenantId,
        category: dto.name,
        description: dto.description ?? null,
        maxAmountPerItem:
          dto.maxReimbursable !== undefined
            ? new Prisma.Decimal(dto.maxReimbursable)
            : null,
        receiptRequiredAbove: new Prisma.Decimal(dto.requiresReceipt ? 0 : -1),
      },
    });
    return this.toExpenseCategory(row);
  }

  async getExpenseCategories(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<ExpenseCategory[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { category: "asc" as const };
    const rows = await prisma.expenseCategoryPolicy.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toExpenseCategory(r));
  }

  async deleteExpenseCategory(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.expenseCategoryPolicy.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Expense category not found");
    }

    const inUse = await prisma.expenseReport.findFirst({
      where: { tenantId, categoryId: id },
    });
    if (inUse) {
      throw new BadRequestException(
        "Cannot delete category that is in use by expense reports.",
      );
    }

    await prisma.expenseCategoryPolicy.delete({ where: { id } });
    return { success: true };
  }

  // ──────────────────────────────────────────────
  // 5. Dunning
  // ──────────────────────────────────────────────

  async createDunningLevel(
    tenantId: string,
    dto: {
      name: string;
      levelNumber: number;
      minOverdueDays: number;
      maxOverdueDays?: number;
      feeAmount?: number;
      feePercentage?: number;
      emailTemplate?: string;
      interestRate?: number;
    },
  ): Promise<DunningLevel> {
    const existing = await prisma.dunningLevel.findFirst({
      where: { tenantId, levelNumber: dto.levelNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Dunning level ${dto.levelNumber} already exists.`,
      );
    }

    const row = await prisma.dunningLevel.create({
      data: {
        tenantId,
        orgId: null,
        levelName: dto.name,
        levelNumber: dto.levelNumber,
        daysOverdue: dto.minOverdueDays,
        maxOverdueDays: dto.maxOverdueDays ?? null,
        feeAmount: new Prisma.Decimal(dto.feeAmount ?? 0),
        feePercentage: new Prisma.Decimal(dto.feePercentage ?? 0),
        emailTemplate: dto.emailTemplate ?? null,
        interestRate: new Prisma.Decimal(dto.interestRate ?? 0),
        status: "ACTIVE",
      },
    });
    return this.toDunningLevel(row);
  }

  async updateDunningLevel(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      minOverdueDays?: number;
      maxOverdueDays?: number;
      feeAmount?: number;
      feePercentage?: number;
      emailTemplate?: string;
      interestRate?: number;
    },
  ): Promise<DunningLevel> {
    const row = await prisma.dunningLevel.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Dunning level not found");
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.levelName = dto.name;
    if (dto.minOverdueDays !== undefined)
      updateData.daysOverdue = dto.minOverdueDays;
    if (dto.maxOverdueDays !== undefined)
      updateData.maxOverdueDays = dto.maxOverdueDays;
    if (dto.feeAmount !== undefined)
      updateData.feeAmount = new Prisma.Decimal(dto.feeAmount);
    if (dto.feePercentage !== undefined)
      updateData.feePercentage = new Prisma.Decimal(dto.feePercentage);
    if (dto.emailTemplate !== undefined)
      updateData.emailTemplate = dto.emailTemplate;
    if (dto.interestRate !== undefined)
      updateData.interestRate = new Prisma.Decimal(dto.interestRate);

    const updated = await prisma.dunningLevel.update({
      where: { id },
      data: updateData,
    });
    return this.toDunningLevel(updated);
  }
  async getDunningLevels(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<DunningLevel[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = (
      sortBy
        ? { [sortBy]: sortOrder ?? "asc" }
        : { levelNumber: "asc" as const }
    ) as any;
    const rows = await prisma.dunningLevel.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toDunningLevel(r));
  }

  async getDunningLevelById(
    tenantId: string,
    id: string,
  ): Promise<DunningLevel> {
    const row = await prisma.dunningLevel.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Dunning level not found");
    }
    return this.toDunningLevel(row);
  }

  async deleteDunningLevel(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.dunningLevel.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Dunning level not found");
    }

    const inUse = await prisma.dunningRun.findFirst({
      where: { tenantId },
    });
    if (inUse) {
      const run = this.toDunningRun(inUse);
      if (run.levelIds.includes(id)) {
        throw new BadRequestException(
          "Cannot delete a dunning level that is in use by existing runs.",
        );
      }
    }

    await prisma.dunningLevel.delete({ where: { id } });
    return { success: true };
  }

  async createDunningRun(
    tenantId: string,
    dto: {
      title: string;
      asOfDate: string;
      levelIds?: string[];
      customerIds?: string[];
      minOverdueDays?: number;
    },
  ): Promise<DunningRun> {
    const asOfDate = new Date(dto.asOfDate);

    const resolvedLevelIds = dto.levelIds || [];
    if (resolvedLevelIds.length > 0) {
      const existingLevels = await prisma.dunningLevel.findMany({
        where: { id: { in: resolvedLevelIds }, tenantId },
      });
      const foundIds = new Set(existingLevels.map((l) => l.id));
      for (const lid of resolvedLevelIds) {
        if (!foundIds.has(lid)) {
          throw new NotFoundException(`Dunning level ${lid} not found`);
        }
      }
    }

    let pendingInvoices: any[] = [];
    try {
      pendingInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
          dueDate: { lt: asOfDate },
          ...(dto.customerIds && dto.customerIds.length > 0
            ? { customerId: { in: dto.customerIds } }
            : {}),
        },
        select: {
          id: true,
          customerId: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          customer: { select: { name: true } },
        },
      });
    } catch {
      pendingInvoices = [];
    }

    const minOverdueDays = dto.minOverdueDays ?? 1;
    const results: DunningRunResult[] = [];
    let totalAmount = 0;

    const allLevels = await prisma.dunningLevel.findMany({
      where: { tenantId },
      orderBy: { daysOverdue: "asc" },
    });
    const sortedLevels = allLevels.map((l) => this.toDunningLevel(l));

    for (const inv of pendingInvoices) {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor(
        (asOfDate.getTime() - dueDate.getTime()) / 86400000,
      );

      if (daysOverdue < minOverdueDays) continue;

      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount || 0);
      if (outstanding <= 0) continue;

      let applicableLevel = 0;
      for (const level of sortedLevels) {
        if (daysOverdue >= level.minOverdueDays) {
          if (
            level.maxOverdueDays === undefined ||
            daysOverdue <= level.maxOverdueDays
          ) {
            applicableLevel = level.levelNumber;
            break;
          }
        }
      }

      if (resolvedLevelIds.length > 0 && applicableLevel === 0) continue;

      const feePct =
        resolvedLevelIds.length > 0
          ? (() => {
              const matchedLevel = sortedLevels.find(
                (l) => l.levelNumber === applicableLevel,
              );
              return matchedLevel ? matchedLevel.feePercentage : 0;
            })()
          : 0;

      const amount = outstanding + outstanding * (feePct / 100);
      totalAmount += amount;

      results.push({
        customerId: inv.customerId,
        level: applicableLevel,
        amount,
        daysOverdue,
      });
    }

    const id = crypto.randomUUID();

    const row = await prisma.dunningRun.create({
      data: {
        id,
        tenantId,
        orgId: null,
        title: dto.title,
        runDate: asOfDate,
        status: "DRAFT",
        levelIds: resolvedLevelIds as unknown as Prisma.InputJsonValue,
        customerIds: (dto.customerIds ||
          []) as unknown as Prisma.InputJsonValue,
        minOverdueDays,
        results: results as unknown as Prisma.InputJsonValue,
        totalInvoices: results.length,
        totalLetters: results.length,
        totalAmount: new Prisma.Decimal(totalAmount),
      },
    });

    return this.toDunningRun(row);
  }

  async getDunningRuns(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<DunningRun[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = (
      sortBy ? { [sortBy]: sortOrder ?? "asc" } : { createdAt: "desc" as const }
    ) as any;
    const rows = await prisma.dunningRun.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toDunningRun(r));
  }

  async getDunningRunById(tenantId: string, id: string): Promise<DunningRun> {
    const row = await prisma.dunningRun.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Dunning run not found");
    }
    return this.toDunningRun(row);
  }

  async sendDunningReminders(
    tenantId: string,
    runId: string,
  ): Promise<DunningRun> {
    const row = await prisma.dunningRun.findFirst({
      where: { id: runId, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Dunning run not found");
    }
    if (row.status === "SENT") {
      throw new BadRequestException(
        "Dunning reminders have already been sent for this run.",
      );
    }

    const updated = await prisma.dunningRun.update({
      where: { id: runId },
      data: { status: "SENT" },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.dunning.sent", {
        runId,
        tenantId,
        totalLetters: row.totalLetters,
        totalAmount: Number(row.totalAmount),
        customerIds: (row.results as unknown as DunningRunResult[]).map(
          (r) => r.customerId,
        ),
      });
    }

    return this.toDunningRun(updated);
  }

  async getOverdueSummary(tenantId: string): Promise<{
    totalOverdue: number;
    totalOverdueAmount: number;
    agingBuckets: Array<{ bucket: string; amount: number; count: number }>;
  }> {
    let invoices: any[] = [];
    try {
      invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
        },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          status: true,
        },
      });
    } catch {
      invoices = [];
    }

    const now = new Date();
    const buckets = [
      { bucket: "1-30 days", min: 1, max: 30, amount: 0, count: 0 },
      { bucket: "31-60 days", min: 31, max: 60, amount: 0, count: 0 },
      { bucket: "61-90 days", min: 61, max: 90, amount: 0, count: 0 },
      { bucket: "90+ days", min: 91, max: Infinity, amount: 0, count: 0 },
    ];

    let totalOverdueAmount = 0;
    let totalOverdue = 0;

    for (const inv of invoices) {
      if (!inv.dueDate) continue;
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor(
        (now.getTime() - dueDate.getTime()) / 86400000,
      );
      if (daysOverdue <= 0) continue;

      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount || 0);
      if (outstanding <= 0) continue;

      totalOverdue++;
      totalOverdueAmount += outstanding;

      for (const bucket of buckets) {
        if (daysOverdue >= bucket.min && daysOverdue <= bucket.max) {
          bucket.amount += outstanding;
          bucket.count++;
          break;
        }
      }
    }

    return {
      totalOverdue,
      totalOverdueAmount,
      agingBuckets: buckets,
    };
  }

  // ──────────────────────────────────────────────
  // 6. Customer Statements
  // ──────────────────────────────────────────────

  async generateStatement(
    tenantId: string,
    dto: {
      customerId: string;
      asOfDate: string;
      includePaidInvoices?: boolean;
      notes?: string;
    },
  ): Promise<CustomerStatement> {
    const asOfDate = new Date(dto.asOfDate);

    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    let invoices: any[] = [];
    try {
      const whereClause: any = {
        tenantId,
        customerId: dto.customerId,
        deletedAt: null,
        issueDate: { lte: asOfDate },
      };

      if (!dto.includePaidInvoices) {
        whereClause.status = { not: "PAID" };
      }

      invoices = await prisma.invoice.findMany({
        where: whereClause,
        select: {
          id: true,
          invoiceNumber: true,
          issueDate: true,
          dueDate: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
        orderBy: { issueDate: "desc" },
      });
    } catch {
      invoices = [];
    }

    const lineItems: StatementLineItem[] = invoices.map((inv) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount || 0),
      outstandingAmount: Number(inv.totalAmount) - Number(inv.paidAmount || 0),
      status: inv.status,
    }));

    const totalDue = lineItems.reduce(
      (sum, li) => sum + li.outstandingAmount,
      0,
    );

    const id = crypto.randomUUID();

    await prisma.customerStatement.create({
      data: {
        id,
        tenantId,
        orgId: "",
        customerId: dto.customerId,
        periodStart: asOfDate,
        periodEnd: asOfDate,
        openingBalance: new Prisma.Decimal(0),
        closingBalance: new Prisma.Decimal(totalDue),
        totalCharged: new Prisma.Decimal(totalDue),
        totalPaid: new Prisma.Decimal(0),
        lineItems: lineItems as unknown as Prisma.InputJsonValue,
        status: "DRAFT",
        includePaidInvoices: dto.includePaidInvoices ?? false,
        notes: dto.notes ?? null,
      },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.statement.generated", {
        statementId: id,
        tenantId,
        customerId: dto.customerId,
        totalDue,
        invoiceCount: lineItems.length,
      });
    }

    return this.toCustomerStatement({
      id,
      tenantId,
      customerId: dto.customerId,
      periodStart: asOfDate,
      periodEnd: asOfDate,
      openingBalance: new Prisma.Decimal(0),
      closingBalance: new Prisma.Decimal(totalDue),
      totalCharged: new Prisma.Decimal(totalDue),
      totalPaid: new Prisma.Decimal(0),
      lineItems,
      status: "DRAFT",
      includePaidInvoices: dto.includePaidInvoices ?? false,
      notes: dto.notes ?? null,
      generatedAt: new Date(),
      sentAt: null,
      createdAt: new Date(),
    });
  }

  async sendStatement(
    tenantId: string,
    id: string,
  ): Promise<CustomerStatement> {
    const row = await prisma.customerStatement.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Customer statement not found");
    }
    if (row.status === "SENT") {
      throw new BadRequestException("Statement has already been sent.");
    }

    const updated = await prisma.customerStatement.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.statement.sent", {
        statementId: id,
        tenantId,
        customerId: row.customerId,
        totalDue: Number(row.closingBalance),
      });
    }

    return this.toCustomerStatement(updated);
  }

  async getStatements(
    tenantId: string,
    customerId?: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<CustomerStatement[]> {
    const where: any = { tenantId };
    if (customerId) {
      where.customerId = customerId;
    }
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { generatedAt: "desc" as const };
    const rows = await prisma.customerStatement.findMany({
      where,
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toCustomerStatement(r));
  }

  async getStatementById(
    tenantId: string,
    id: string,
  ): Promise<CustomerStatement> {
    const row = await prisma.customerStatement.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Statement not found");
    }
    return this.toCustomerStatement(row);
  }

  // ── Statement Templates ──

  async createStatementTemplate(
    tenantId: string,
    dto: {
      name: string;
      headerText?: string;
      footerText?: string;
      includePaymentHistory?: boolean;
      includeAgingBreakdown?: boolean;
      showDueAmount?: boolean;
    },
  ): Promise<StatementTemplate> {
    const existing = await prisma.statementTemplate.findFirst({
      where: { tenantId, templateName: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Statement template "${dto.name}" already exists.`,
      );
    }

    const row = await prisma.statementTemplate.create({
      data: {
        tenantId,
        orgId: null,
        templateName: dto.name,
        headerText: dto.headerText ?? null,
        footerText: dto.footerText ?? null,
        includePaymentHistory: dto.includePaymentHistory ?? true,
        includeAgingBreakdown: dto.includeAgingBreakdown ?? true,
        showDueAmount: dto.showDueAmount ?? true,
      },
    });
    return this.toStatementTemplate(row);
  }

  async getStatementTemplates(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<StatementTemplate[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { templateName: "asc" as const };
    const rows = await prisma.statementTemplate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rows.map((r) => this.toStatementTemplate(r));
  }

  async updateStatementTemplate(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      headerText?: string;
      footerText?: string;
      includePaymentHistory?: boolean;
      includeAgingBreakdown?: boolean;
      showDueAmount?: boolean;
    },
  ): Promise<StatementTemplate> {
    const row = await prisma.statementTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Statement template not found");
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.templateName = dto.name;
    if (dto.headerText !== undefined) updateData.headerText = dto.headerText;
    if (dto.footerText !== undefined) updateData.footerText = dto.footerText;
    if (dto.includePaymentHistory !== undefined)
      updateData.includePaymentHistory = dto.includePaymentHistory;
    if (dto.includeAgingBreakdown !== undefined)
      updateData.includeAgingBreakdown = dto.includeAgingBreakdown;
    if (dto.showDueAmount !== undefined)
      updateData.showDueAmount = dto.showDueAmount;

    const updated = await prisma.statementTemplate.update({
      where: { id },
      data: updateData,
    });
    return this.toStatementTemplate(updated);
  }

  async deleteStatementTemplate(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const row = await prisma.statementTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new NotFoundException("Statement template not found");
    }
    await prisma.statementTemplate.delete({ where: { id } });
    return { success: true };
  }
}
