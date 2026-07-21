import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GlAccountingService } from "./gl-accounting.service";

@Injectable()
export class TaxEngineService {
  constructor(
    private readonly glService: GlAccountingService,
    private readonly eventEmitter?: EventEmitter2,
  ) {}

  // ── TAX RULES ──────────────────────────────────

  async getTaxRules(tenantId: string) {
    return prisma.taxRule.findMany({
      where: { tenantId },
      include: { components: true },
    });
  }

  async createTaxRule(
    tenantId: string,
    orgId: string,
    dto: { name: string; type: string; rate?: number },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.taxRule.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  // ── WITHHOLDING TAX ──────────────────────────────────

  async getWithholdingTaxes(tenantId: string) {
    return prisma.withholdingTax.findMany({
      where: { tenantId },
      include: { account: true },
    });
  }

  async createWithholdingTax(
    tenantId: string,
    orgId: string,
    dto: { name: string; rate: number; accountId: string },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.withholdingTax.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  // ── TAX FILINGS ──────────────────────────────────

  async getTaxFilings(tenantId: string) {
    return prisma.taxFiling.findMany({
      where: { tenantId },
      orderBy: { periodStart: "desc" },
    });
  }

  async createTaxFiling(
    tenantId: string,
    orgId: string,
    dto: { filingType: string; periodStart: string; periodEnd: string },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.taxFiling.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        filingType: dto.filingType,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: "DRAFT",
        payload: {} as never,
      },
    });
  }

  /**
   * Auto-compute a VAT/GST return from invoices and purchase orders in a period.
   */
  async computeTaxReturn(
    tenantId: string,
    orgId: string,
    filingType: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "VOID"] },
      },
    });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        orderDate: { gte: start, lte: end },
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
    });

    const outputTax = invoices.reduce((s, inv) => s + Number(inv.taxAmount), 0);
    const inputTax = purchaseOrders.reduce(
      (s, po) => s + Number(po.taxAmount),
      0,
    );
    const netTaxPayable = outputTax - inputTax;

    const filing = await prisma.taxFiling.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        filingType,
        periodStart: start,
        periodEnd: end,
        status: "DRAFT",
        payload: {
          outputTax,
          inputTax,
          netTaxPayable,
          invoiceCount: invoices.length,
          purchaseCount: purchaseOrders.length,
        } as never,
      },
    });

    return {
      filingId: filing.id,
      filingType,
      periodStart,
      periodEnd,
      outputTax,
      inputTax,
      netTaxPayable: Math.max(0, netTaxPayable),
      netTaxRefund: Math.abs(Math.min(0, netTaxPayable)),
      invoiceCount: invoices.length,
      purchaseCount: purchaseOrders.length,
    };
  }

  // ── E-INVOICING ──────────────────────────────────

  async getEInvoices(tenantId: string, invoiceId?: string) {
    return prisma.eInvoice.findMany({
      where: { tenantId, ...(invoiceId ? { invoiceId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async getEInvoiceById(tenantId: string, id: string) {
    const doc = await prisma.eInvoice.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException("E-invoice not found");
    return doc;
  }

  private escapeXml(value: unknown): string {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Generate a structured legal e-invoice from a sales Invoice.
   * Supports UBL 2.1 / PEPPOL BIS XML and India GST (IRN + signed QR payload).
   */
  async generateEInvoice(
    tenantId: string,
    _orgId: string,
    invoiceId: string,
    format = "UBL",
  ) {
    const fmt = (format || "UBL").toUpperCase();
    if (!["UBL", "PEPPOL", "GST_IRN"].includes(fmt)) {
      throw new BadRequestException(`Unsupported e-invoice format: ${fmt}`);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { customer: true, lineItems: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status === "DRAFT") {
      throw new BadRequestException(
        "Cannot issue an e-invoice for a draft invoice.",
      );
    }

    const supplier =
      (await prisma.organization.findFirst({
        where: { id: invoice.orgId, tenantId },
      })) ?? (await prisma.organization.findFirst({ where: { tenantId } }));
    const e = (v: unknown) => this.escapeXml(v);
    const taxableValue =
      Number(invoice.subtotal) - Number(invoice.discountAmount);

    let documentXml: string;
    let irn: string | null = null;
    let qrPayload: string | null = null;

    if (fmt === "GST_IRN") {
      const fy = (() => {
        const d = new Date(invoice.issueDate);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return m >= 4
          ? `${y}-${String((y + 1) % 100).padStart(2, "0")}`
          : `${y - 1}-${String(y % 100).padStart(2, "0")}`;
      })();
      const gstin = supplier?.taxId || "URP";
      irn = createHash("sha256")
        .update(`${gstin}${invoice.invoiceNumber}${fy}`)
        .digest("hex");
      qrPayload = [
        `SellerGstin:${gstin}`,
        `BuyerGstin:${invoice.customer?.taxId || "URP"}`,
        `DocNo:${invoice.invoiceNumber}`,
        `DocDt:${new Date(invoice.issueDate).toISOString().slice(0, 10)}`,
        `TotInvVal:${Number(invoice.totalAmount).toFixed(2)}`,
        `Irn:${irn}`,
      ].join(";");
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<GstInvoice version="1.1">',
        `  <Irn>${e(irn)}</Irn>`,
        `  <DocDtls><Typ>INV</Typ><No>${e(invoice.invoiceNumber)}</No><Dt>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</Dt></DocDtls>`,
        `  <SellerDtls><Gstin>${e(gstin)}</Gstin><LglNm>${e(supplier?.legalName || supplier?.name)}</LglNm></SellerDtls>`,
        `  <BuyerDtls><Gstin>${e(invoice.customer?.taxId || "URP")}</Gstin><LglNm>${e(invoice.customer?.name)}</LglNm></BuyerDtls>`,
        `  <ValDtls><AssVal>${taxableValue.toFixed(2)}</AssVal><TotInvVal>${Number(invoice.totalAmount).toFixed(2)}</TotInvVal></ValDtls>`,
        "  <ItemList>",
        ...invoice.lineItems.map(
          (li, i) =>
            `    <Item><SlNo>${i + 1}</SlNo><PrdDesc>${e(li.description)}</PrdDesc><Qty>${Number(li.quantity)}</Qty><UnitPrice>${Number(li.unitPrice).toFixed(2)}</UnitPrice><TotAmt>${Number(li.totalAmount).toFixed(2)}</TotAmt><GstRt>${Number(li.taxRate)}</GstRt></Item>`,
        ),
        "  </ItemList>",
        "</GstInvoice>",
      ].join("\n");
    } else {
      const profile =
        fmt === "PEPPOL"
          ? "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"
          : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
        `  <cbc:CustomizationID>${e(profile)}</cbc:CustomizationID>`,
        `  <cbc:ID>${e(invoice.invoiceNumber)}</cbc:ID>`,
        `  <cbc:IssueDate>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</cbc:IssueDate>`,
        `  <cbc:DueDate>${e(new Date(invoice.dueDate).toISOString().slice(0, 10))}</cbc:DueDate>`,
        "  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>",
        `  <cbc:DocumentCurrencyCode>${e(invoice.currency)}</cbc:DocumentCurrencyCode>`,
        `  <cac:AccountingSupplierParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(supplier?.legalName || supplier?.name)}</cbc:RegistrationName>${supplier?.taxId ? `<cbc:CompanyID>${e(supplier.taxId)}</cbc:CompanyID>` : ""}</cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>`,
        `  <cac:AccountingCustomerParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(invoice.customer?.name)}</cbc:RegistrationName>${invoice.customer?.taxId ? `<cbc:CompanyID>${e(invoice.customer.taxId)}</cbc:CompanyID>` : ""}</cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>`,
        `  <cac:TaxTotal><cbc:TaxAmount currencyID="${e(invoice.currency)}">${Number(invoice.taxAmount).toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>`,
        `  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${taxableValue.toFixed(2)}</cbc:LineExtensionAmount><cbc:TaxInclusiveAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`,
        ...invoice.lineItems.map((li, i) =>
          [
            "  <cac:InvoiceLine>",
            `    <cbc:ID>${i + 1}</cbc:ID>`,
            `    <cbc:InvoicedQuantity>${Number(li.quantity)}</cbc:InvoicedQuantity>`,
            `    <cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${Number(li.totalAmount).toFixed(2)}</cbc:LineExtensionAmount>`,
            `    <cac:Item><cbc:Name>${e(li.description)}</cbc:Name></cac:Item>`,
            `    <cac:Price><cbc:PriceAmount currencyID="${e(invoice.currency)}">${Number(li.unitPrice).toFixed(2)}</cbc:PriceAmount></cac:Price>`,
            "  </cac:InvoiceLine>",
          ].join("\n"),
        ),
        "</Invoice>",
      ].join("\n");
    }

    const data = {
      tenantId,
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      format: fmt,
      status: "GENERATED",
      irn,
      qrPayload,
      documentXml,
      createdBy: "system",
    };
    const doc = await prisma.eInvoice.upsert({
      where: {
        tenantId_invoiceId_format: {
          tenantId,
          invoiceId: invoice.id,
          format: fmt,
        },
      },
      create: data,
      update: { documentXml, irn, qrPayload, status: "GENERATED" },
    });
    await this.glService.logAudit(
      prisma,
      tenantId,
      "EInvoice",
      doc.id,
      "GENERATE",
      { format: fmt, invoiceNumber: invoice.invoiceNumber },
      "system",
    );
    return doc;
  }

  // ── CREDIT & DEBIT NOTES ──────────────────────────────────

  async getCreditNotes(tenantId: string) {
    return prisma.creditNote.findMany({
      where: { tenantId },
      include: { customer: true, invoice: true },
    });
  }

  async createCreditNote(
    tenantId: string,
    orgId: string,
    dto: {
      customerId: string;
      noteNumber: string;
      amount: number;
      invoiceId?: string;
      reason?: string;
    },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.creditNote.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        customerId: dto.customerId,
        invoiceId: dto.invoiceId || null,
        noteNumber: dto.noteNumber,
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason || null,
        status: "DRAFT",
      },
    });
  }

  async getDebitNotes(tenantId: string) {
    return prisma.debitNote.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true },
    });
  }

  async createDebitNote(
    tenantId: string,
    orgId: string,
    dto: {
      vendorId: string;
      noteNumber: string;
      amount: number;
      purchaseOrderId?: string;
      reason?: string;
    },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.debitNote.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId || null,
        noteNumber: dto.noteNumber,
        amount: new Prisma.Decimal(dto.amount),
        reason: dto.reason || null,
        status: "DRAFT",
      },
    });
  }

  // ── DUNNING ──────────────────────────────────

  async getDunningLevels(tenantId: string) {
    return prisma.dunningLevel.findMany({
      where: { tenantId },
      orderBy: { daysOverdue: "asc" },
    });
  }

  async getDunningLevelById(tenantId: string, id: string) {
    const level = await prisma.dunningLevel.findFirst({
      where: { id, tenantId },
    });
    if (!level) throw new NotFoundException("Dunning level not found");
    return level;
  }

  async createDunningLevel(
    tenantId: string,
    orgId: string,
    dto: {
      levelName: string;
      daysOverdue: number;
      feeAmount: number;
      emailTemplateId?: string;
    },
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.dunningLevel.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        levelName: dto.levelName,
        daysOverdue: dto.daysOverdue,
        feeAmount: new Prisma.Decimal(dto.feeAmount),
        emailTemplateId: dto.emailTemplateId || null,
      },
    });
  }

  async updateDunningLevel(
    tenantId: string,
    id: string,
    dto: {
      levelName?: string;
      daysOverdue?: number;
      feeAmount?: number;
      status?: string;
    },
  ) {
    await this.getDunningLevelById(tenantId, id);
    return prisma.dunningLevel.update({
      where: { id },
      data: {
        ...(dto.levelName !== undefined && { levelName: dto.levelName }),
        ...(dto.daysOverdue !== undefined && { daysOverdue: dto.daysOverdue }),
        ...(dto.feeAmount !== undefined && {
          feeAmount: new Prisma.Decimal(dto.feeAmount),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async deleteDunningLevel(tenantId: string, id: string) {
    await this.getDunningLevelById(tenantId, id);
    await prisma.dunningLevel.delete({ where: { id } });
    return { deleted: true };
  }

  async getDunningRuns(tenantId: string) {
    return prisma.dunningRun.findMany({
      where: { tenantId },
      orderBy: { runDate: "desc" },
    });
  }

  async getDunningLevelLogs(
    tenantId: string,
    levelId: string,
    page = 1,
    limit = 20,
  ) {
    await this.getDunningLevelById(tenantId, levelId);
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.invoiceDunningLog.findMany({
        where: { tenantId, dunningLevelId: levelId },
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
        include: { invoice: { include: { customer: true } } },
      }),
      prisma.invoiceDunningLog.count({
        where: { tenantId, dunningLevelId: levelId },
      }),
    ]);
    return { data: logs, total, page, limit };
  }

  async getDunningStats(tenantId: string) {
    const runs = await prisma.dunningRun.findMany({ where: { tenantId } });
    const logs = await prisma.invoiceDunningLog.findMany({
      where: { tenantId },
      include: { dunningLevel: true },
    });

    const totalRuns = runs.length;
    const completedRuns = runs.filter((r) => r.status === "COMPLETED").length;
    const totalFeeCollected = logs.reduce(
      (s, l) => s + Number(l.feeApplied),
      0,
    );
    const totalEmailsSent = logs.filter((l) => l.emailSentTo).length;
    const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

    const byLevel: Record<string, { count: number; fees: number }> = {};
    for (const log of logs) {
      const key = log.dunningLevel?.levelName ?? log.dunningLevelId;
      if (!byLevel[key]) byLevel[key] = { count: 0, fees: 0 };
      byLevel[key].count++;
      byLevel[key].fees += Number(log.feeApplied);
    }

    return {
      totalRuns,
      completedRuns,
      successRate: Math.round(successRate * 10) / 10,
      totalFeeCollected,
      totalEmailsSent,
      byLevel: Object.entries(byLevel).map(([level, stats]) => ({
        level,
        ...stats,
      })),
    };
  }

  async pauseDunningForInvoice(tenantId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    // Store pause status as a metadata tag in the invoice's notes (lightweight pattern — no schema change needed)
    const notes = ((invoice as any).notes || "") as string;
    const pauseTag = "[dunning:paused]";
    if (notes.includes(pauseTag)) return { paused: true, invoiceId };
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { notes: `${notes} ${pauseTag}`.trim() } as never,
    });
    return { paused: true, invoiceId };
  }

  async resumeDunningForInvoice(tenantId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    const notes = ((invoice as any).notes || "") as string;
    const updatedNotes = notes.replace("[dunning:paused]", "").trim();
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { notes: updatedNotes } as never,
    });
    return { paused: false, invoiceId };
  }

  // ── AR AGING ──────────────────────────────────

  async getArAgingReport(tenantId: string, orgId?: string) {
    const where: Record<string, unknown> = {
      tenantId,
      status: { notIn: ["PAID", "VOID", "DRAFT"] },
    };
    if (orgId) where["orgId"] = orgId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true },
      orderBy: { dueDate: "asc" },
    });

    const now = Date.now();
    const buckets = {
      current: { total: 0, count: 0, invoices: [] as unknown[] },
      "1-30": { total: 0, count: 0, invoices: [] as unknown[] },
      "31-60": { total: 0, count: 0, invoices: [] as unknown[] },
      "61-90": { total: 0, count: 0, invoices: [] as unknown[] },
      "90+": { total: 0, count: 0, invoices: [] as unknown[] },
    };

    for (const inv of invoices) {
      const daysOverdue = Math.floor(
        (now - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const amount = Number(inv.totalAmount);
      const entry = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer?.name,
        dueDate: inv.dueDate,
        amount,
        daysOverdue,
      };

      if (daysOverdue <= 0) {
        buckets["current"].total += amount;
        buckets["current"].count++;
        buckets["current"].invoices.push(entry);
      } else if (daysOverdue <= 30) {
        buckets["1-30"].total += amount;
        buckets["1-30"].count++;
        buckets["1-30"].invoices.push(entry);
      } else if (daysOverdue <= 60) {
        buckets["31-60"].total += amount;
        buckets["31-60"].count++;
        buckets["31-60"].invoices.push(entry);
      } else if (daysOverdue <= 90) {
        buckets["61-90"].total += amount;
        buckets["61-90"].count++;
        buckets["61-90"].invoices.push(entry);
      } else {
        buckets["90+"].total += amount;
        buckets["90+"].count++;
        buckets["90+"].invoices.push(entry);
      }
    }

    const grandTotal = Object.values(buckets).reduce((s, b) => s + b.total, 0);
    return { buckets, grandTotal, generatedAt: new Date().toISOString() };
  }

  // ── CUSTOMER STATEMENT ──────────────────────────────────

  async getCustomerStatement(
    tenantId: string,
    customerId: string,
    periodStart?: string,
    periodEnd?: string,
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const dateFilter: Record<string, unknown> = {};
    if (periodStart) dateFilter["gte"] = new Date(periodStart);
    if (periodEnd) dateFilter["lte"] = new Date(periodEnd);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        customerId,
        ...(Object.keys(dateFilter).length ? { issueDate: dateFilter } : {}),
      },
      include: { payments: true },
      orderBy: { issueDate: "asc" },
    });

    let openingBalance = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;

    const lines = invoices.map((inv) => {
      const invoiceAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const balance = invoiceAmount - paidAmount;
      totalInvoiced += invoiceAmount;
      totalPaid += paidAmount;
      return {
        date: inv.issueDate,
        invoiceNumber: inv.invoiceNumber,
        description: `Invoice ${inv.invoiceNumber}`,
        debit: invoiceAmount,
        credit: paidAmount,
        balance,
        status: inv.status,
        dueDate: inv.dueDate,
      };
    });

    const closingBalance = openingBalance + totalInvoiced - totalPaid;

    return {
      customer: { id: customer.id, name: customer.name, email: customer.email },
      periodStart: periodStart || null,
      periodEnd: periodEnd || null,
      openingBalance,
      totalInvoiced,
      totalPaid,
      closingBalance,
      lines,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── OVERDUE SUMMARY ──────────────────────────────────

  async getOverdueInvoiceSummary(tenantId: string) {
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ["PAID", "VOID", "DRAFT"] },
        dueDate: { lt: now },
      },
      include: { customer: true },
    });

    const total = invoices.reduce((s, inv) => s + Number(inv.totalAmount), 0);
    const byCustomer: Record<
      string,
      { name: string; count: number; total: number }
    > = {};

    for (const inv of invoices) {
      const custId = inv.customerId || "unknown";
      if (!byCustomer[custId])
        byCustomer[custId] = {
          name: inv.customer?.name ?? "Unknown",
          count: 0,
          total: 0,
        };
      byCustomer[custId].count++;
      byCustomer[custId].total += Number(inv.totalAmount);
    }

    const topDebtors = Object.values(byCustomer)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      totalOverdueInvoices: invoices.length,
      totalOverdueAmount: total,
      topDebtors,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── CASH APPLICATION ──────────────────────────────────

  async applyCashToInvoice(
    tenantId: string,
    orgId: string,
    dto: {
      invoiceId: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
    },
  ) {
    await this.glService.resolveOrgId(tenantId, orgId);
    const invoice = await prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    // Fetch existing payments to compute outstanding balance
    const existingPayments = await prisma.payment.findMany({
      where: { tenantId, invoiceId: dto.invoiceId },
    });
    const totalPaid = existingPayments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const outstanding = Number(invoice.totalAmount) - totalPaid;

    if (dto.amount > outstanding + 0.01) {
      throw new BadRequestException(
        `Payment amount $${dto.amount} exceeds outstanding balance $${outstanding.toFixed(2)}`,
      );
    }

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: dto.invoiceId,
        amount: new Prisma.Decimal(dto.amount),
        paidAt: new Date(dto.paymentDate),
        method: dto.paymentMethod,
        reference: dto.reference || null,
      },
    });

    // Update invoice status
    const newTotalPaid = totalPaid + dto.amount;
    const newStatus =
      newTotalPaid >= Number(invoice.totalAmount) - 0.01 ? "PAID" : "PARTIAL";
    await prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: { status: newStatus } as never,
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.payment.received", {
        tenantId,
        paymentId: payment.id,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.paymentMethod,
      });
    }

    return {
      payment,
      invoiceStatus: newStatus,
      remainingBalance: Math.max(0, Number(invoice.totalAmount) - newTotalPaid),
    };
  }

  // ── CUSTOMER CREDIT MANAGEMENT ──────────────────────────────────

  async getCustomerCreditSummary(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const invoices = await prisma.invoice.findMany({
      where: { tenantId, customerId, status: { notIn: ["VOID", "DRAFT"] } },
      include: { payments: true },
    });

    let totalOutstanding = 0;
    let totalOverdue = 0;
    const now = Date.now();

    for (const inv of invoices) {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      const balance = Number(inv.totalAmount) - paid;
      if (balance > 0) {
        totalOutstanding += balance;
        if (inv.dueDate.getTime() < now) totalOverdue += balance;
      }
    }

    const creditAvailable = customer.creditLimit
      ? Number(customer.creditLimit) - totalOutstanding
      : null;

    return {
      customerId,
      customerName: customer.name,
      creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
      creditUsed: totalOutstanding,
      creditAvailable,
      creditHold: customer.creditHold,
      creditHoldReason: customer.creditHoldReason,
      riskRating: customer.riskRating,
      paymentTerms: customer.paymentTerms,
      totalOutstanding,
      totalOverdue,
    };
  }

  async updateCustomerCredit(
    tenantId: string,
    customerId: string,
    dto: {
      creditLimit?: number;
      paymentTerms?: number;
      creditHold?: boolean;
      creditHoldReason?: string;
      riskRating?: string;
    },
  ) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    return prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(dto.creditLimit !== undefined && {
          creditLimit: new Prisma.Decimal(dto.creditLimit),
        }),
        ...(dto.paymentTerms !== undefined && {
          paymentTerms: dto.paymentTerms,
        }),
        ...(dto.creditHold !== undefined && { creditHold: dto.creditHold }),
        ...(dto.creditHoldReason !== undefined && {
          creditHoldReason: dto.creditHoldReason,
        }),
        ...(dto.riskRating !== undefined && { riskRating: dto.riskRating }),
      } as never,
    });
  }

  async getCustomersCreditRisk(tenantId: string) {
    const customers = await prisma.customer.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    const result = [];
    for (const c of customers) {
      const invoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          customerId: c.id,
          status: { notIn: ["VOID", "DRAFT", "PAID"] },
        },
      });
      const outstanding = invoices.reduce(
        (s, inv) => s + Number(inv.totalAmount),
        0,
      );
      result.push({
        customerId: c.id,
        name: c.name,
        creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
        outstanding,
        creditUtilization: c.creditLimit
          ? (outstanding / Number(c.creditLimit)) * 100
          : null,
        creditHold: c.creditHold,
        riskRating: c.riskRating,
      });
    }

    return result.sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0));
  }

  async createDunningRun(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);

    // 1. Fetch active dunning levels sorted by daysOverdue asc
    const activeLevels = await prisma.dunningLevel.findMany({
      where: { tenantId, orgId: resolvedOrgId, status: "ACTIVE" },
      orderBy: { daysOverdue: "asc" },
    });

    if (activeLevels.length === 0) {
      return prisma.dunningRun.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          totalInvoices: 0,
          status: "COMPLETED",
        } as any,
      });
    }

    // 2. Fetch all unpaid/overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        status: { notIn: ["PAID", "DRAFT", "VOID"] },
        dueDate: { lt: new Date() },
      },
      include: {
        customer: true,
      },
    });

    // 3. Create the DunningRun record in status IN_PROGRESS first
    const dunningRun = await prisma.dunningRun.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        totalInvoices: 0,
        status: "IN_PROGRESS",
      } as any,
    });

    let processedCount = 0;

    // 4. Process each invoice
    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysOverdue < 0) continue;

      let matchingLevel: (typeof activeLevels)[number] | null = null;
      for (const level of activeLevels) {
        if (daysOverdue >= level.daysOverdue) {
          matchingLevel = level;
        }
      }

      if (!matchingLevel) continue;

      const existingLog = await prisma.invoiceDunningLog.findFirst({
        where: {
          tenantId,
          invoiceId: invoice.id,
          dunningLevelId: matchingLevel.id,
        },
      });

      if (existingLog) continue;

      const fee = matchingLevel.feeAmount;

      try {
        await prisma.$transaction(async (tx) => {
          if (fee.gt(0)) {
            const lineItems = await tx.invoiceLineItem.findMany({
              where: { invoiceId: invoice.id },
              orderBy: { sortOrder: "desc" },
              take: 1,
            });
            const firstItem = lineItems[0];
            const nextSortOrder = firstItem ? firstItem.sortOrder + 1 : 1;

            await tx.invoiceLineItem.create({
              data: {
                tenantId,
                invoiceId: invoice.id,
                description: `Late Payment Fee - ${matchingLevel.levelName}`,
                quantity: new Prisma.Decimal(1),
                unitPrice: fee,
                totalAmount: fee,
                sortOrder: nextSortOrder,
              },
            });

            const updatedSubtotal = invoice.subtotal.add(fee);
            const updatedTotal = invoice.totalAmount.add(fee);

            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                subtotal: updatedSubtotal,
                totalAmount: updatedTotal,
              },
            });
          }

          await tx.invoiceDunningLog.create({
            data: {
              tenantId,
              orgId: resolvedOrgId,
              invoiceId: invoice.id,
              dunningLevelId: matchingLevel.id,
              dunningRunId: dunningRun.id,
              feeApplied: fee,
              status: "SENT",
              emailSentTo: invoice.customer?.email || null,
            },
          });
        });

        if (this.eventEmitter) {
          this.eventEmitter.emit("finance.invoice.overdue", {
            tenantId,
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            dunningLevelId: matchingLevel.id,
            daysOverdue,
            feeApplied: fee.toNumber(),
          });

          if (invoice.customer?.email) {
            this.eventEmitter.emit("notification.send", {
              tenantId,
              userId: invoice.customer.id,
              type: "DUNNING_REMINDER",
              title: `Overdue Invoice Payment Reminder: Invoice #${invoice.invoiceNumber}`,
              body: `Hello ${invoice.customer.name},\n\nYour payment for invoice #${invoice.invoiceNumber} is overdue by ${daysOverdue} days. A late payment fee of $${fee.toFixed(2)} has been applied (${matchingLevel.levelName}). Please complete your payment as soon as possible.\n\nThank you.`,
              channel: "EMAIL",
            });
          }
        }

        processedCount++;
      } catch (err) {
        const { pinoLogger } =
          await import("../../../common/services/logger.service");
        pinoLogger.error(
          { invoiceId: invoice.id, err },
          "Failed to process dunning for invoice",
        );
      }
    }

    return prisma.dunningRun.update({
      where: { id: dunningRun.id },
      data: {
        totalInvoices: processedCount,
        status: "COMPLETED",
      },
    });
  }

  async computeTax(
    tenantId: string,
    orgId: string,
    amount: number,
    taxRuleId?: string,
  ) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    let rule;
    if (taxRuleId) {
      rule = await prisma.taxRule.findFirst({
        where: { id: taxRuleId, tenantId, orgId: resolvedOrgId },
        include: { components: true },
      });
    } else {
      rule = await prisma.taxRule.findFirst({
        where: {
          tenantId,
          orgId: resolvedOrgId,
          isDefault: true,
          status: "ACTIVE",
        },
        include: { components: true },
      });
    }
    if (!rule) throw new BadRequestException("No tax rule found");
    const components = rule.components.map((c) => {
      const taxAmount = amount * (Number(c.rate) / 100);
      return {
        name: c.name,
        rate: Number(c.rate),
        taxAmount,
        accountId: c.accountId,
      };
    });
    const totalTax = components.reduce((s, c) => s + c.taxAmount, 0);
    return {
      taxRule: rule.name,
      taxableAmount: amount,
      totalTax,
      components,
      grandTotal: amount + totalTax,
    };
  }
}
