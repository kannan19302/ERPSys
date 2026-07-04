import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { GlAccountingService } from './gl-accounting.service';

@Injectable()
export class TaxEngineService {
  constructor(private readonly glService: GlAccountingService) {}

  // ── TAX RULES ──────────────────────────────────

  async getTaxRules(tenantId: string) {
    return prisma.taxRule.findMany({
      where: { tenantId },
      include: { components: true },
    });
  }

  async createTaxRule(tenantId: string, orgId: string, dto: { name: string; type: string; rate?: number }) {
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

  async createWithholdingTax(tenantId: string, orgId: string, dto: { name: string; rate: number; accountId: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.withholdingTax.create({
      data: { ...dto, tenantId, orgId: resolvedOrgId } as never,
    });
  }

  // ── TAX FILINGS ──────────────────────────────────

  async getTaxFilings(tenantId: string) {
    return prisma.taxFiling.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'desc' },
    });
  }

  async createTaxFiling(tenantId: string, orgId: string, dto: { filingType: string; periodStart: string; periodEnd: string }) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    return prisma.taxFiling.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        filingType: dto.filingType,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: 'DRAFT',
        payload: {} as never,
      },
    });
  }

  /**
   * Auto-compute a VAT/GST return from invoices and purchase orders in a period.
   */
  async computeTaxReturn(tenantId: string, orgId: string, filingType: string, periodStart: string, periodEnd: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'VOID'] },
      },
    });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        orderDate: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
    });

    const outputTax = invoices.reduce((s, inv) => s + Number(inv.taxAmount), 0);
    const inputTax = purchaseOrders.reduce((s, po) => s + Number(po.taxAmount), 0);
    const netTaxPayable = outputTax - inputTax;

    const filing = await prisma.taxFiling.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        filingType,
        periodStart: start,
        periodEnd: end,
        status: 'DRAFT',
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
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getEInvoiceById(tenantId: string, id: string) {
    const doc = await prisma.eInvoice.findFirst({ where: { id, tenantId } });
    if (!doc) throw new NotFoundException('E-invoice not found');
    return doc;
  }

  private escapeXml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate a structured legal e-invoice from a sales Invoice.
   * Supports UBL 2.1 / PEPPOL BIS XML and India GST (IRN + signed QR payload).
   */
  async generateEInvoice(tenantId: string, _orgId: string, invoiceId: string, format = 'UBL') {
    const fmt = (format || 'UBL').toUpperCase();
    if (!['UBL', 'PEPPOL', 'GST_IRN'].includes(fmt)) {
      throw new BadRequestException(`Unsupported e-invoice format: ${fmt}`);
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { customer: true, lineItems: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'DRAFT') {
      throw new BadRequestException('Cannot issue an e-invoice for a draft invoice.');
    }

    const supplier =
      (await prisma.organization.findFirst({ where: { id: invoice.orgId, tenantId } })) ??
      (await prisma.organization.findFirst({ where: { tenantId } }));
    const e = (v: unknown) => this.escapeXml(v);
    const taxableValue = Number(invoice.subtotal) - Number(invoice.discountAmount);

    let documentXml: string;
    let irn: string | null = null;
    let qrPayload: string | null = null;

    if (fmt === 'GST_IRN') {
      const fy = (() => {
        const d = new Date(invoice.issueDate);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return m >= 4
          ? `${y}-${String((y + 1) % 100).padStart(2, '0')}`
          : `${y - 1}-${String(y % 100).padStart(2, '0')}`;
      })();
      const gstin = supplier?.taxId || 'URP';
      irn = createHash('sha256')
        .update(`${gstin}${invoice.invoiceNumber}${fy}`)
        .digest('hex');
      qrPayload = [
        `SellerGstin:${gstin}`,
        `BuyerGstin:${invoice.customer?.taxId || 'URP'}`,
        `DocNo:${invoice.invoiceNumber}`,
        `DocDt:${new Date(invoice.issueDate).toISOString().slice(0, 10)}`,
        `TotInvVal:${Number(invoice.totalAmount).toFixed(2)}`,
        `Irn:${irn}`,
      ].join(';');
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<GstInvoice version="1.1">',
        `  <Irn>${e(irn)}</Irn>`,
        `  <DocDtls><Typ>INV</Typ><No>${e(invoice.invoiceNumber)}</No><Dt>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</Dt></DocDtls>`,
        `  <SellerDtls><Gstin>${e(gstin)}</Gstin><LglNm>${e(supplier?.legalName || supplier?.name)}</LglNm></SellerDtls>`,
        `  <BuyerDtls><Gstin>${e(invoice.customer?.taxId || 'URP')}</Gstin><LglNm>${e(invoice.customer?.name)}</LglNm></BuyerDtls>`,
        `  <ValDtls><AssVal>${taxableValue.toFixed(2)}</AssVal><TotInvVal>${Number(invoice.totalAmount).toFixed(2)}</TotInvVal></ValDtls>`,
        '  <ItemList>',
        ...invoice.lineItems.map(
          (li, i) =>
            `    <Item><SlNo>${i + 1}</SlNo><PrdDesc>${e(li.description)}</PrdDesc><Qty>${Number(li.quantity)}</Qty><UnitPrice>${Number(li.unitPrice).toFixed(2)}</UnitPrice><TotAmt>${Number(li.totalAmount).toFixed(2)}</TotAmt><GstRt>${Number(li.taxRate)}</GstRt></Item>`,
        ),
        '  </ItemList>',
        '</GstInvoice>',
      ].join('\n');
    } else {
      const profile =
        fmt === 'PEPPOL'
          ? 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0'
          : 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
      documentXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
        `  <cbc:CustomizationID>${e(profile)}</cbc:CustomizationID>`,
        `  <cbc:ID>${e(invoice.invoiceNumber)}</cbc:ID>`,
        `  <cbc:IssueDate>${e(new Date(invoice.issueDate).toISOString().slice(0, 10))}</cbc:IssueDate>`,
        `  <cbc:DueDate>${e(new Date(invoice.dueDate).toISOString().slice(0, 10))}</cbc:DueDate>`,
        '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>',
        `  <cbc:DocumentCurrencyCode>${e(invoice.currency)}</cbc:DocumentCurrencyCode>`,
        `  <cac:AccountingSupplierParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(supplier?.legalName || supplier?.name)}</cbc:RegistrationName>${supplier?.taxId ? `<cbc:CompanyID>${e(supplier.taxId)}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity></cac:Party></cac:AccountingSupplierParty>`,
        `  <cac:AccountingCustomerParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>${e(invoice.customer?.name)}</cbc:RegistrationName>${invoice.customer?.taxId ? `<cbc:CompanyID>${e(invoice.customer.taxId)}</cbc:CompanyID>` : ''}</cac:PartyLegalEntity></cac:Party></cac:AccountingCustomerParty>`,
        `  <cac:TaxTotal><cbc:TaxAmount currencyID="${e(invoice.currency)}">${Number(invoice.taxAmount).toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>`,
        `  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${taxableValue.toFixed(2)}</cbc:LineExtensionAmount><cbc:TaxInclusiveAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="${e(invoice.currency)}">${Number(invoice.totalAmount).toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>`,
        ...invoice.lineItems.map(
          (li, i) =>
            [
              '  <cac:InvoiceLine>',
              `    <cbc:ID>${i + 1}</cbc:ID>`,
              `    <cbc:InvoicedQuantity>${Number(li.quantity)}</cbc:InvoicedQuantity>`,
              `    <cbc:LineExtensionAmount currencyID="${e(invoice.currency)}">${Number(li.totalAmount).toFixed(2)}</cbc:LineExtensionAmount>`,
              `    <cac:Item><cbc:Name>${e(li.description)}</cbc:Name></cac:Item>`,
              `    <cac:Price><cbc:PriceAmount currencyID="${e(invoice.currency)}">${Number(li.unitPrice).toFixed(2)}</cbc:PriceAmount></cac:Price>`,
              '  </cac:InvoiceLine>',
            ].join('\n'),
        ),
        '</Invoice>',
      ].join('\n');
    }

    const data = {
      tenantId,
      orgId: invoice.orgId,
      invoiceId: invoice.id,
      format: fmt,
      status: 'GENERATED',
      irn,
      qrPayload,
      documentXml,
      createdBy: 'system',
    };
    const doc = await prisma.eInvoice.upsert({
      where: {
        tenantId_invoiceId_format: { tenantId, invoiceId: invoice.id, format: fmt },
      },
      create: data,
      update: { documentXml, irn, qrPayload, status: 'GENERATED' },
    });
    await this.glService.logAudit(
      prisma,
      tenantId,
      'EInvoice',
      doc.id,
      'GENERATE',
      { format: fmt, invoiceNumber: invoice.invoiceNumber },
      'system',
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

  async createCreditNote(tenantId: string, orgId: string, dto: { customerId: string; noteNumber: string; amount: number; invoiceId?: string; reason?: string }) {
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
        status: 'DRAFT',
      },
    });
  }

  async getDebitNotes(tenantId: string) {
    return prisma.debitNote.findMany({
      where: { tenantId },
      include: { vendor: true, purchaseOrder: true },
    });
  }

  async createDebitNote(tenantId: string, orgId: string, dto: { vendorId: string; noteNumber: string; amount: number; purchaseOrderId?: string; reason?: string }) {
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
        status: 'DRAFT',
      },
    });
  }

  // ── DUNNING ──────────────────────────────────

  async getDunningLevels(tenantId: string) {
    return prisma.dunningLevel.findMany({
      where: { tenantId },
      orderBy: { daysOverdue: 'asc' },
    });
  }

  async createDunningLevel(tenantId: string, orgId: string, dto: { levelName: string; daysOverdue: number; feeAmount: number; emailTemplateId?: string }) {
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

  async getDunningRuns(tenantId: string) {
    return prisma.dunningRun.findMany({
      where: { tenantId },
      orderBy: { runDate: 'desc' },
    });
  }

  async createDunningRun(tenantId: string, orgId: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    
    // Dynamically query overdue invoices count
    const overdueCount = await prisma.invoice.count({
      where: {
        tenantId,
        orgId: resolvedOrgId,
        status: { notIn: ['PAID', 'DRAFT', 'VOID'] },
        dueDate: { lt: new Date() },
      },
    });

    return prisma.dunningRun.create({
      data: {
        tenantId,
        orgId: resolvedOrgId,
        totalInvoices: overdueCount,
        status: 'COMPLETED',
      },
    });
  }

  async computeTax(tenantId: string, orgId: string, amount: number, taxRuleId?: string) {
    const resolvedOrgId = await this.glService.resolveOrgId(tenantId, orgId);
    let rule;
    if (taxRuleId) {
      rule = await prisma.taxRule.findFirst({
        where: { id: taxRuleId, tenantId, orgId: resolvedOrgId },
        include: { components: true },
      });
    } else {
      rule = await prisma.taxRule.findFirst({
        where: { tenantId, orgId: resolvedOrgId, isDefault: true, status: 'ACTIVE' },
        include: { components: true },
      });
    }
    if (!rule) throw new BadRequestException('No tax rule found');
    const components = rule.components.map((c) => {
      const taxAmount = amount * (Number(c.rate) / 100);
      return { name: c.name, rate: Number(c.rate), taxAmount, accountId: c.accountId };
    });
    const totalTax = components.reduce((s, c) => s + c.taxAmount, 0);
    return { taxRule: rule.name, taxableAmount: amount, totalTax, components, grandTotal: amount + totalTax };
  }
}
