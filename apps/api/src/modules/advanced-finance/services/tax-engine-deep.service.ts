import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class TaxEngineDeepService {
  // ── TAX JURISDICTIONS ──────────────────────────────────

  async listJurisdictions(tenantId: string, country?: string, taxType?: string) {
    return prisma.taxJurisdiction.findMany({
      where: {
        tenantId,
        ...(country && { country }),
        ...(taxType && { taxType }),
        isActive: true,
      },
      orderBy: [{ country: 'asc' }, { state: 'asc' }],
    });
  }

  async getJurisdiction(tenantId: string, id: string) {
    const j = await prisma.taxJurisdiction.findFirst({ where: { id, tenantId }, include: { exemptionCertificates: true } });
    if (!j) throw new NotFoundException('Tax jurisdiction not found');
    return j;
  }

  async createJurisdiction(tenantId: string, dto: {
    name: string; code: string; country: string; state?: string; county?: string;
    taxType: string; rate: number; effectiveFrom: string; effectiveTo?: string; description?: string;
  }) {
    return prisma.taxJurisdiction.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        country: dto.country,
        state: dto.state,
        county: dto.county,
        taxType: dto.taxType,
        rate: dto.rate,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        description: dto.description,
      },
    });
  }

  async updateJurisdiction(tenantId: string, id: string, dto: Partial<{
    name: string; rate: number; effectiveTo: string; isActive: boolean; description: string;
  }>) {
    await this.getJurisdiction(tenantId, id);
    return prisma.taxJurisdiction.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.effectiveTo ? { effectiveTo: new Date(dto.effectiveTo) } : {}),
      },
    });
  }

  async deleteJurisdiction(tenantId: string, id: string) {
    await this.getJurisdiction(tenantId, id);
    return prisma.taxJurisdiction.delete({ where: { id } });
  }

  // ── TAX EXEMPTION CERTIFICATES ──────────────────────────────────

  async listExemptionCertificates(tenantId: string, entityType?: string, entityId?: string) {
    return prisma.taxExemptionCertificate.findMany({
      where: {
        tenantId,
        ...(entityType && { entityType }),
        ...(entityId && { entityId }),
      },
      include: { jurisdiction: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExemptionCertificate(tenantId: string, id: string) {
    const c = await prisma.taxExemptionCertificate.findFirst({ where: { id, tenantId }, include: { jurisdiction: true } });
    if (!c) throw new NotFoundException('Exemption certificate not found');
    return c;
  }

  async createExemptionCertificate(tenantId: string, dto: {
    entityType: string; entityId: string; jurisdictionId: string; certificateNumber: string;
    exemptionType: string; exemptionPct?: number; validFrom: string; validTo?: string;
    documentUrl?: string; notes?: string;
  }) {
    return prisma.taxExemptionCertificate.create({
      data: {
        tenantId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        jurisdictionId: dto.jurisdictionId,
        certificateNumber: dto.certificateNumber,
        exemptionType: dto.exemptionType,
        exemptionPct: dto.exemptionPct,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        documentUrl: dto.documentUrl,
        notes: dto.notes,
      },
    });
  }

  async updateExemptionCertificate(tenantId: string, id: string, dto: Partial<{
    status: string; validTo: string; documentUrl: string; notes: string;
  }>) {
    await this.getExemptionCertificate(tenantId, id);
    return prisma.taxExemptionCertificate.update({
      where: { id },
      data: { ...dto, ...(dto.validTo ? { validTo: new Date(dto.validTo) } : {}) },
    });
  }

  async revokeExemptionCertificate(tenantId: string, id: string) {
    await this.getExemptionCertificate(tenantId, id);
    return prisma.taxExemptionCertificate.update({ where: { id }, data: { status: 'REVOKED' } });
  }

  // ── TAX RECONCILIATION ──────────────────────────────────

  async listTaxReconciliations(tenantId: string) {
    return prisma.taxReconciliation.findMany({
      where: { tenantId },
      orderBy: { periodStart: 'desc' },
    });
  }

  async computeTaxReconciliation(tenantId: string, orgId: string, dto: {
    periodStart: string; periodEnd: string; taxType: string;
  }) {
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);

    // Output tax: sum of tax on invoices
    const invoiceAgg = await prisma.invoice.aggregate({
      where: {
        tenantId,
        issueDate: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      _sum: { taxAmount: true },
    });

    // Input tax: sum of tax on purchase orders
    const poAgg = await prisma.purchaseOrder.aggregate({
      where: {
        tenantId,
        orderDate: { gte: start, lte: end },
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      _sum: { totalTax: true },
    });

    const outputTax = Number(invoiceAgg._sum.taxAmount ?? 0);
    const inputTax = Number(poAgg._sum.totalTax ?? 0);
    const netLiability = outputTax - inputTax;

    return prisma.taxReconciliation.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        taxType: dto.taxType,
        outputTax,
        inputTax,
        netLiability,
        paymentsMade: 0,
        difference: netLiability,
        status: 'DRAFT',
      },
    });
  }

  async updateTaxReconciliation(tenantId: string, id: string, dto: Partial<{
    paymentsMade: number; status: string; notes: string;
  }>) {
    const rec = await prisma.taxReconciliation.findFirst({ where: { id, tenantId } });
    if (!rec) throw new NotFoundException('Tax reconciliation not found');
    const paymentsMade = dto.paymentsMade ?? Number(rec.paymentsMade);
    const difference = Number(rec.netLiability) - paymentsMade;
    return prisma.taxReconciliation.update({
      where: { id },
      data: { ...dto, paymentsMade, difference },
    });
  }

  // ── WITHHOLDING CERTIFICATES ──────────────────────────────────

  async listWithholdingCertificates(tenantId: string, vendorId?: string, year?: number) {
    return prisma.withholdingCertificate.findMany({
      where: {
        tenantId,
        ...(vendorId && { vendorId }),
        ...(year && { year }),
      },
      orderBy: { year: 'desc' },
    });
  }

  async getWithholdingCertificate(tenantId: string, id: string) {
    const c = await prisma.withholdingCertificate.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException('Withholding certificate not found');
    return c;
  }

  async createWithholdingCertificate(tenantId: string, dto: {
    vendorId: string; year: number; grossAmount: number; taxWithheld: number;
    withholdingTaxId?: string; certificateNumber?: string;
  }) {
    return prisma.withholdingCertificate.create({
      data: { tenantId, ...dto, status: 'DRAFT' },
    });
  }

  async issueWithholdingCertificate(tenantId: string, id: string) {
    await this.getWithholdingCertificate(tenantId, id);
    const certNo = `WHT-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
    return prisma.withholdingCertificate.update({
      where: { id },
      data: { status: 'ISSUED', issuedAt: new Date(), certificateNumber: certNo },
    });
  }

  async fileWithholdingCertificate(tenantId: string, id: string) {
    await this.getWithholdingCertificate(tenantId, id);
    return prisma.withholdingCertificate.update({
      where: { id },
      data: { status: 'FILED', filedAt: new Date() },
    });
  }

  async bulkGenerateWithholdingCertificates(tenantId: string, year: number) {
    // Group withholding tax payments by vendor for the given year
    const payments = await prisma.payment.findMany({
      where: { tenantId, paymentDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
    });
    const vendorMap: Record<string, { gross: number; tax: number }> = {};
    for (const p of payments) {
      if (!p.customerId) continue; // only vendor payments for WHT
      const key = p.customerId;
      if (!vendorMap[key]) vendorMap[key] = { gross: 0, tax: 0 };
      vendorMap[key].gross += Number(p.amount);
    }
    const created = [];
    for (const [vendorId, totals] of Object.entries(vendorMap)) {
      if (totals.gross > 0) {
        const cert = await prisma.withholdingCertificate.create({
          data: {
            tenantId,
            vendorId,
            year,
            grossAmount: totals.gross,
            taxWithheld: totals.tax,
            status: 'DRAFT',
          },
        });
        created.push(cert);
      }
    }
    return { generated: created.length, certificates: created };
  }

  // ── AMENDED TAX FILINGS ──────────────────────────────────

  async listAmendedFilings(tenantId: string) {
    return prisma.amendedTaxFiling.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createAmendedFiling(tenantId: string, dto: {
    originalFilingId: string; amendedReason: string; changes?: object;
    refundAmount?: number; additionalTax?: number;
  }) {
    return prisma.amendedTaxFiling.create({
      data: {
        tenantId,
        originalFilingId: dto.originalFilingId,
        amendedReason: dto.amendedReason,
        changes: (dto.changes ?? {}) as never,
        refundAmount: dto.refundAmount,
        additionalTax: dto.additionalTax,
        status: 'DRAFT',
      },
    });
  }

  async submitAmendedFiling(tenantId: string, id: string) {
    const filing = await prisma.amendedTaxFiling.findFirst({ where: { id, tenantId } });
    if (!filing) throw new NotFoundException('Amended filing not found');
    if (filing.status !== 'DRAFT') throw new BadRequestException('Only DRAFT filings can be submitted');
    return prisma.amendedTaxFiling.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });
  }

  async updateAmendedFilingStatus(tenantId: string, id: string, status: string) {
    if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new BadRequestException('Invalid status');
    return prisma.amendedTaxFiling.update({ where: { id }, data: { status } });
  }

  // ── VAT RETURN PREVIEW (pulls from existing TaxFiling computeTaxReturn) ──────────────────────────────────

  async previewVatReturn(tenantId: string, orgId: string, periodStart: string, periodEnd: string) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const invoiceAgg = await prisma.invoice.aggregate({
      where: { tenantId, issueDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      _sum: { taxAmount: true, totalAmount: true },
    });
    const poAgg = await prisma.purchaseOrder.aggregate({
      where: { tenantId, orderDate: { gte: start, lte: end }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
      _sum: { totalTax: true, totalAmount: true },
    });

    const outputTax = Number(invoiceAgg._sum.taxAmount ?? 0);
    const outputTaxableSupplies = Number(invoiceAgg._sum.totalAmount ?? 0) - outputTax;
    const inputTax = Number(poAgg._sum.totalTax ?? 0);
    const inputTaxablePurchases = Number(poAgg._sum.totalAmount ?? 0) - inputTax;
    const netLiability = outputTax - inputTax;

    return {
      period: { start: periodStart, end: periodEnd },
      outputTax,
      outputTaxableSupplies,
      inputTax,
      inputTaxablePurchases,
      netLiability,
      refundDue: netLiability < 0 ? Math.abs(netLiability) : 0,
      paymentDue: netLiability > 0 ? netLiability : 0,
    };
  }

  async getTaxDashboard(tenantId: string) {
    const [jurisdictions, certificates, reconciliations, withholdingCerts, amendedFilings] = await Promise.all([
      prisma.taxJurisdiction.count({ where: { tenantId, isActive: true } }),
      prisma.taxExemptionCertificate.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.taxReconciliation.count({ where: { tenantId } }),
      prisma.withholdingCertificate.count({ where: { tenantId } }),
      prisma.amendedTaxFiling.count({ where: { tenantId } }),
    ]);
    return { jurisdictions, certificates, reconciliations, withholdingCerts, amendedFilings };
  }
}
