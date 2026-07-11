import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

/**
 * 1099 / Vendor Tax Reporting
 *
 * Tracks vendor 1099 eligibility (W-9 on file, TIN match, backup withholding),
 * computes year-to-date reportable payments from purchase-order disbursements,
 * generates draft IRS Form 1099-NEC/MISC/INT/DIV records per vendor per tax year,
 * bundles them into e-file batches, and supports corrections/voids.
 *
 * Reference: NetSuite 1099 Reporting, Sage Intacct 1099 Processing, QuickBooks
 * Contractor Payments (peer capability for AP tax compliance).
 */
@Injectable()
export class Form1099Service {
  private static readonly IRS_THRESHOLD = 600;

  // ── Vendor 1099 Profiles ─────────────────────────────────────────────────

  /**
   * KNOWN LIMITATION: 1099 reporting is cash-basis (report the year a vendor was
   * actually PAID). This system has no dedicated AP disbursement/payment-date entity
   * tied to vendors (the `Payment` model is AR/customer-invoice-scoped only), so this
   * approximates YTD reportable amount from `PurchaseOrder.paidAmount` filtered by
   * `orderDate` within the tax year. A PO ordered near year-end but paid in the
   * following January (or vice versa) can be attributed to the wrong tax year. Logged
   * as a follow-up in MODULE_REGISTRY.md; a real AP disbursement/payment-date model
   * should replace this once Payables tracks vendor payment dates directly.
   */
  async listVendorsWithProfiles(tenantId: string, taxYear: number) {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
      include: { vendor1099Profile: true },
      orderBy: { name: 'asc' },
    });

    const yearStart = new Date(Date.UTC(taxYear, 0, 1));
    const yearEnd = new Date(Date.UTC(taxYear + 1, 0, 1));

    const ytdByVendor = await prisma.purchaseOrder.groupBy({
      by: ['vendorId'],
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
        orderDate: { gte: yearStart, lt: yearEnd },
      },
      _sum: { paidAmount: true },
    });
    const ytdMap = new Map(ytdByVendor.map((r) => [r.vendorId, Number(r._sum.paidAmount || 0)]));

    return vendors.map((v) => {
      const ytdPaid = ytdMap.get(v.id) || 0;
      return {
        vendorId: v.id,
        name: v.name,
        taxId: v.taxId,
        profile: v.vendor1099Profile,
        ytdPaid,
        crossesThreshold: ytdPaid >= Form1099Service.IRS_THRESHOLD,
      };
    });
  }

  async getVendorProfile(tenantId: string, vendorId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return prisma.vendor1099Profile.findUnique({ where: { vendorId } });
  }

  async upsertVendorProfile(
    tenantId: string,
    vendorId: string,
    dto: {
      is1099Vendor?: boolean;
      formType?: string;
      defaultBox?: string;
      taxIdType?: string;
      taxIdMasked?: string;
      w9OnFile?: boolean;
      w9ReceivedDate?: string;
      stateFilingRequired?: boolean;
      state?: string;
      stateTaxId?: string;
    },
  ) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return prisma.vendor1099Profile.upsert({
      where: { vendorId },
      create: {
        tenantId,
        vendorId,
        is1099Vendor: dto.is1099Vendor ?? false,
        formType: dto.formType ?? 'NEC',
        defaultBox: dto.defaultBox ?? '1',
        taxIdType: dto.taxIdType ?? 'EIN',
        taxIdMasked: dto.taxIdMasked,
        w9OnFile: dto.w9OnFile ?? false,
        w9ReceivedDate: dto.w9ReceivedDate ? new Date(dto.w9ReceivedDate) : undefined,
        stateFilingRequired: dto.stateFilingRequired ?? false,
        state: dto.state,
        stateTaxId: dto.stateTaxId,
      },
      update: {
        ...(dto.is1099Vendor !== undefined && { is1099Vendor: dto.is1099Vendor }),
        ...(dto.formType && { formType: dto.formType }),
        ...(dto.defaultBox && { defaultBox: dto.defaultBox }),
        ...(dto.taxIdType && { taxIdType: dto.taxIdType }),
        ...(dto.taxIdMasked !== undefined && { taxIdMasked: dto.taxIdMasked }),
        ...(dto.w9OnFile !== undefined && { w9OnFile: dto.w9OnFile }),
        ...(dto.w9ReceivedDate && { w9ReceivedDate: new Date(dto.w9ReceivedDate) }),
        ...(dto.stateFilingRequired !== undefined && { stateFilingRequired: dto.stateFilingRequired }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.stateTaxId !== undefined && { stateTaxId: dto.stateTaxId }),
      },
    });
  }

  async runTinMatch(tenantId: string, vendorId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const profile = await prisma.vendor1099Profile.findUnique({ where: { vendorId } });
    if (!profile) throw new BadRequestException('Vendor has no 1099 profile yet — create one first');

    // Simulated TIN-match: a masked TIN present + non-empty vendor name matches; real
    // integrations would call IRS e-Services TIN Matching or a vendor like Avalara 1099.
    const matched = Boolean(profile.taxIdMasked && vendor.name.trim().length > 0);
    return prisma.vendor1099Profile.update({
      where: { vendorId },
      data: {
        tinMatchStatus: matched ? 'MATCHED' : 'MISMATCH',
        tinMatchCheckedAt: new Date(),
      },
    });
  }

  async setBackupWithholding(tenantId: string, vendorId: string, active: boolean, rate?: number) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      throw new BadRequestException('Backup withholding rate must be between 0 and 100');
    }
    return prisma.vendor1099Profile.upsert({
      where: { vendorId },
      create: { tenantId, vendorId, backupWithholdingActive: active, backupWithholdingRate: new Prisma.Decimal(rate ?? 24) },
      update: { backupWithholdingActive: active, ...(rate !== undefined && { backupWithholdingRate: new Prisma.Decimal(rate) }) },
    });
  }

  async getW9Checklist(tenantId: string, vendorId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const profile = await prisma.vendor1099Profile.findUnique({ where: { vendorId } });

    return {
      vendorId,
      w9OnFile: profile?.w9OnFile ?? false,
      w9ReceivedDate: profile?.w9ReceivedDate ?? null,
      taxIdOnFile: Boolean(profile?.taxIdMasked),
      tinMatchStatus: profile?.tinMatchStatus ?? 'NOT_CHECKED',
      missingItems: [
        !profile?.w9OnFile && 'W-9 not on file',
        !profile?.taxIdMasked && 'Tax ID not recorded',
        (!profile || profile.tinMatchStatus !== 'MATCHED') && 'TIN not verified via TIN match',
      ].filter(Boolean),
    };
  }

  // ── Threshold reporting ──────────────────────────────────────────────────

  async getThresholdReport(tenantId: string, taxYear: number) {
    const vendors = await this.listVendorsWithProfiles(tenantId, taxYear);
    const eligible = vendors.filter((v) => v.profile?.is1099Vendor && v.crossesThreshold);
    const flagged = vendors.filter((v) => !v.profile?.is1099Vendor && v.crossesThreshold);
    return {
      taxYear,
      threshold: Form1099Service.IRS_THRESHOLD,
      eligibleCount: eligible.length,
      eligible,
      flaggedNotMarked: flagged, // paid over threshold but not flagged 1099 — compliance risk
    };
  }

  // ── Form generation ──────────────────────────────────────────────────────

  async generateForms(tenantId: string, userId: string, taxYear: number) {
    const report = await this.getThresholdReport(tenantId, taxYear);
    const created: string[] = [];
    const skipped: string[] = [];

    for (const v of report.eligible) {
      const existing = await prisma.form1099.findFirst({
        where: { tenantId, vendorId: v.vendorId, taxYear, formType: v.profile!.formType, isCorrection: false },
      });
      if (existing) {
        skipped.push(v.vendorId);
        continue;
      }
      const federalWithholding = v.profile!.backupWithholdingActive
        ? Math.round(v.ytdPaid * (Number(v.profile!.backupWithholdingRate) / 100) * 100) / 100
        : 0;
      const form = await prisma.form1099.create({
        data: {
          tenantId,
          vendorId: v.vendorId,
          taxYear,
          formType: v.profile!.formType,
          boxAmounts: { [v.profile!.defaultBox]: v.ytdPaid },
          totalAmount: new Prisma.Decimal(v.ytdPaid),
          federalWithholding: new Prisma.Decimal(federalWithholding),
          state: v.profile!.state ?? null,
          stateId: v.profile!.stateTaxId ?? null,
          status: 'DRAFT',
          createdBy: userId,
          updatedBy: userId,
        },
      });
      created.push(form.id);
    }

    return { taxYear, createdCount: created.length, createdIds: created, skippedExisting: skipped.length };
  }

  async listForms(tenantId: string, taxYear?: number, status?: string) {
    return prisma.form1099.findMany({
      where: { tenantId, ...(taxYear && { taxYear }), ...(status && { status }) },
      include: { vendor: { select: { name: true, taxId: true } } },
      orderBy: [{ taxYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getForm(tenantId: string, id: string) {
    const form = await prisma.form1099.findFirst({
      where: { id, tenantId },
      include: { vendor: true, batch: true, correctedFrom: true, correction: true },
    });
    if (!form) throw new NotFoundException('Form 1099 not found');
    return form;
  }

  async updateForm(
    tenantId: string,
    id: string,
    userId: string,
    dto: { boxAmounts?: Record<string, number>; federalWithholding?: number; state?: string; stateWithholding?: number; notes?: string },
  ) {
    const form = await this.getForm(tenantId, id);
    if (form.status !== 'DRAFT') throw new BadRequestException('Only DRAFT forms may be edited');

    const boxAmounts = dto.boxAmounts ?? (form.boxAmounts as Record<string, number>);
    const totalAmount = dto.boxAmounts
      ? Object.values(dto.boxAmounts).reduce((sum, v) => sum + Number(v), 0)
      : Number(form.totalAmount);

    return prisma.form1099.update({
      where: { id },
      data: {
        boxAmounts,
        totalAmount: new Prisma.Decimal(totalAmount),
        ...(dto.federalWithholding !== undefined && { federalWithholding: new Prisma.Decimal(dto.federalWithholding) }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.stateWithholding !== undefined && { stateWithholding: new Prisma.Decimal(dto.stateWithholding) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy: userId,
      },
    });
  }

  async markReady(tenantId: string, id: string, userId: string) {
    const form = await this.getForm(tenantId, id);
    if (form.status !== 'DRAFT') throw new BadRequestException('Only DRAFT forms can be marked ready');
    return prisma.form1099.update({ where: { id }, data: { status: 'READY', updatedBy: userId } });
  }

  async fileForm(tenantId: string, id: string, userId: string) {
    const form = await this.getForm(tenantId, id);
    if (form.status !== 'READY') throw new BadRequestException('Only READY forms can be filed');
    return prisma.form1099.update({
      where: { id },
      data: { status: 'FILED', filedAt: new Date(), updatedBy: userId },
    });
  }

  async voidForm(tenantId: string, id: string, userId: string) {
    const form = await this.getForm(tenantId, id);
    if (form.status === 'VOID') throw new BadRequestException('Form already void');
    return prisma.form1099.update({ where: { id }, data: { status: 'VOID', voidedAt: new Date(), updatedBy: userId } });
  }

  async correctForm(tenantId: string, id: string, userId: string, dto: { boxAmounts: Record<string, number>; notes?: string }) {
    const original = await this.getForm(tenantId, id);
    if (original.status !== 'FILED') throw new BadRequestException('Only FILED forms can be corrected');
    if (original.correction) throw new BadRequestException('A correction already exists for this form');

    const totalAmount = Object.values(dto.boxAmounts).reduce((sum, v) => sum + Number(v), 0);
    return prisma.form1099.create({
      data: {
        tenantId,
        vendorId: original.vendorId,
        taxYear: original.taxYear,
        formType: original.formType,
        boxAmounts: dto.boxAmounts,
        totalAmount: new Prisma.Decimal(totalAmount),
        federalWithholding: original.federalWithholding,
        state: original.state,
        stateId: original.stateId,
        status: 'DRAFT',
        isCorrection: true,
        correctedFromId: original.id,
        notes: dto.notes,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async getPrintableSummary(tenantId: string, id: string) {
    const form = await this.getForm(tenantId, id);
    return {
      formId: form.id,
      formType: form.formType,
      taxYear: form.taxYear,
      payer: { name: 'Tenant Organization', tin: 'ON FILE' },
      recipient: { name: form.vendor.name, tin: form.vendor.taxId ?? 'MISSING' },
      boxAmounts: form.boxAmounts,
      totalAmount: form.totalAmount,
      federalWithholding: form.federalWithholding,
      state: form.state,
      stateWithholding: form.stateWithholding,
      status: form.status,
      isCorrection: form.isCorrection,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Batches / e-filing ────────────────────────────────────────────────────

  async createBatch(tenantId: string, userId: string, dto: { taxYear: number; name: string; formIds: string[] }) {
    if (dto.formIds.length === 0) throw new BadRequestException('Batch must include at least one form');
    const forms = await prisma.form1099.findMany({
      where: { id: { in: dto.formIds }, tenantId, taxYear: dto.taxYear, status: 'READY' },
    });
    if (forms.length !== dto.formIds.length) {
      throw new BadRequestException('All forms must exist, belong to the tax year, and be in READY status');
    }
    const totalAmount = forms.reduce((sum, f) => sum + Number(f.totalAmount), 0);

    const batch = await prisma.form1099Batch.create({
      data: {
        tenantId,
        taxYear: dto.taxYear,
        name: dto.name,
        status: 'GENERATED',
        formCount: forms.length,
        totalAmount: new Prisma.Decimal(totalAmount),
        createdBy: userId,
      },
    });
    await prisma.form1099.updateMany({ where: { id: { in: dto.formIds }, tenantId }, data: { batchId: batch.id } });
    return batch;
  }

  async listBatches(tenantId: string, taxYear?: number) {
    return prisma.form1099Batch.findMany({
      where: { tenantId, ...(taxYear && { taxYear }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBatch(tenantId: string, id: string) {
    const batch = await prisma.form1099Batch.findFirst({
      where: { id, tenantId },
      include: { forms: { include: { vendor: { select: { name: true } } } } },
    });
    if (!batch) throw new NotFoundException('Form 1099 batch not found');
    return batch;
  }

  async efileBatch(tenantId: string, id: string, userId: string) {
    const batch = await this.getBatch(tenantId, id);
    if (batch.status !== 'GENERATED') throw new BadRequestException('Only GENERATED batches can be e-filed');

    const confirmation = `IRS-FIRE-${new Date().getUTCFullYear()}-${batch.id.slice(-8).toUpperCase()}`;
    const updated = await prisma.form1099Batch.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), efileConfirmation: confirmation },
    });
    await prisma.form1099.updateMany({
      where: { batchId: id, tenantId },
      data: { status: 'FILED', filedAt: new Date(), efileSubmissionId: confirmation, updatedBy: userId },
    });
    return updated;
  }

  // ── Dashboard & reference data ────────────────────────────────────────────

  async getSummary(tenantId: string, taxYear: number) {
    const [byStatus, byFormType, batches] = await Promise.all([
      prisma.form1099.groupBy({ by: ['status'], where: { tenantId, taxYear }, _count: true, _sum: { totalAmount: true } }),
      prisma.form1099.groupBy({ by: ['formType'], where: { tenantId, taxYear }, _count: true, _sum: { totalAmount: true } }),
      prisma.form1099Batch.count({ where: { tenantId, taxYear } }),
    ]);

    const totalForms = byStatus.reduce((sum, s) => sum + s._count, 0);
    const totalAmount = byStatus.reduce((sum, s) => sum + Number(s._sum.totalAmount || 0), 0);

    return {
      taxYear,
      totalForms,
      totalAmount,
      batchCount: batches,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count, amount: Number(s._sum.totalAmount || 0) })),
      byFormType: byFormType.map((f) => ({ formType: f.formType, count: f._count, amount: Number(f._sum.totalAmount || 0) })),
    };
  }

  getStateFilingRequirements() {
    // Static reference data: states participating in the IRS Combined Federal/State
    // Filing (CFS) Program don't require a separate state 1099 submission; others do.
    return {
      combinedFederalStateProgram: [
        'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'GA', 'HI', 'ID', 'IN', 'KS', 'LA',
        'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NJ', 'NM', 'NC', 'ND',
        'OH', 'OK', 'SC', 'WI',
      ],
      separateStateFilingRequired: ['OR', 'PA', 'VA'],
      noStateIncomeTax: ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'],
      note: 'Reference data for planning only — verify current-year requirements with each state department of revenue.',
    };
  }
}
