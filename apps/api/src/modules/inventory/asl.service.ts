import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class AslService {

  // ── Approved Suppliers ───────────────────────────────────────────────────

  async listApprovedSuppliers(tenantId: string, productId?: string, vendorId?: string, status?: string) {
    return prisma.approvedSupplier.findMany({
      where: {
        tenantId,
        ...(productId && { productId }),
        ...(vendorId && { vendorId }),
        ...(status && { status: status as never }),
      },
      include: { priceTiers: true },
      orderBy: [{ preferenceRank: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getApprovedSupplier(tenantId: string, id: string) {
    const asl = await prisma.approvedSupplier.findFirst({
      where: { tenantId, id },
      include: { priceTiers: true, changeLog: { orderBy: { changedAt: 'desc' }, take: 20 } },
    });
    if (!asl) throw new NotFoundException('Approved supplier record not found');
    return asl;
  }

  async createApprovedSupplier(tenantId: string, createdBy: string, dto: {
    productId: string; vendorId: string; vendorProductRef?: string; vendorProductName?: string;
    unitPrice?: number; currency?: string; moq?: number; leadTimeDays?: number;
    maxOrderQty?: number; uom?: string; packSize?: number;
    qualificationDate?: string; expiryDate?: string; conditionalNote?: string;
  }) {
    const existing = await prisma.approvedSupplier.findFirst({
      where: { tenantId, productId: dto.productId, vendorId: dto.vendorId },
    });
    if (existing) throw new BadRequestException('Vendor is already in ASL for this product');

    const asl = await prisma.approvedSupplier.create({
      data: {
        tenantId,
        productId: dto.productId,
        vendorId: dto.vendorId,
        vendorProductRef: dto.vendorProductRef ?? null,
        vendorProductName: dto.vendorProductName ?? null,
        unitPrice: dto.unitPrice ?? null,
        currency: dto.currency ?? 'USD',
        moq: dto.moq ?? null,
        leadTimeDays: dto.leadTimeDays ?? null,
        maxOrderQty: dto.maxOrderQty ?? null,
        uom: dto.uom ?? 'UNIT',
        packSize: dto.packSize ?? null,
        qualificationDate: dto.qualificationDate ? new Date(dto.qualificationDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        conditionalNote: dto.conditionalNote ?? null,
        createdBy,
      },
      include: { priceTiers: true },
    });

    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: asl.id,
        changeType: 'APPROVED', newValue: 'PENDING_APPROVAL',
        reason: 'Initial creation', changedBy: createdBy,
      },
    });

    return asl;
  }

  async updateApprovedSupplier(tenantId: string, id: string, changedBy: string, dto: Partial<{
    vendorProductRef: string; vendorProductName: string; unitPrice: number; currency: string;
    moq: number; leadTimeDays: number; maxOrderQty: number; uom: string; packSize: number;
    expiryDate: string; conditionalNote: string;
  }>) {
    const asl = await this.getApprovedSupplier(tenantId, id);

    if (dto.unitPrice !== undefined && asl.unitPrice !== null) {
      await prisma.aslChangeLog.create({
        data: {
          tenantId, approvedSupplierId: id, changeType: 'PRICE_UPDATE',
          previousValue: String(asl.unitPrice), newValue: String(dto.unitPrice),
          changedBy,
        },
      });
    }
    if (dto.leadTimeDays !== undefined && asl.leadTimeDays !== null) {
      await prisma.aslChangeLog.create({
        data: {
          tenantId, approvedSupplierId: id, changeType: 'LEAD_TIME_UPDATE',
          previousValue: String(asl.leadTimeDays), newValue: String(dto.leadTimeDays),
          changedBy,
        },
      });
    }

    return prisma.approvedSupplier.update({
      where: { id },
      data: {
        ...(dto.vendorProductRef !== undefined && { vendorProductRef: dto.vendorProductRef }),
        ...(dto.vendorProductName !== undefined && { vendorProductName: dto.vendorProductName }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.moq !== undefined && { moq: dto.moq }),
        ...(dto.leadTimeDays !== undefined && { leadTimeDays: dto.leadTimeDays }),
        ...(dto.maxOrderQty !== undefined && { maxOrderQty: dto.maxOrderQty }),
        ...(dto.uom !== undefined && { uom: dto.uom }),
        ...(dto.packSize !== undefined && { packSize: dto.packSize }),
        ...(dto.expiryDate !== undefined && { expiryDate: new Date(dto.expiryDate) }),
        ...(dto.conditionalNote !== undefined && { conditionalNote: dto.conditionalNote }),
      },
    });
  }

  async approveSupplier(tenantId: string, id: string, approvedBy: string, qualificationDate?: string) {
    const asl = await this.getApprovedSupplier(tenantId, id);
    if (asl.status === 'APPROVED') throw new BadRequestException('Supplier is already approved');

    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: id, changeType: 'APPROVED',
        previousValue: asl.status, newValue: 'APPROVED', changedBy: approvedBy,
      },
    });

    return prisma.approvedSupplier.update({
      where: { id },
      data: {
        status: 'APPROVED', approvedBy,
        qualificationDate: qualificationDate ? new Date(qualificationDate) : new Date(),
      },
    });
  }

  async disqualifySupplier(tenantId: string, id: string, changedBy: string, reason: string) {
    const asl = await this.getApprovedSupplier(tenantId, id);
    if (asl.status === 'DISQUALIFIED') throw new BadRequestException('Supplier is already disqualified');

    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: id, changeType: 'DISQUALIFIED',
        previousValue: asl.status, newValue: 'DISQUALIFIED', reason, changedBy,
      },
    });

    return prisma.approvedSupplier.update({
      where: { id },
      data: { status: 'DISQUALIFIED', disqualifiedReason: reason, isPreferred: false, preferenceRank: 999 },
    });
  }

  async setConditional(tenantId: string, id: string, changedBy: string, note: string) {
    const asl = await this.getApprovedSupplier(tenantId, id);
    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: id, changeType: 'CONDITIONAL',
        previousValue: asl.status, newValue: 'CONDITIONAL', reason: note, changedBy,
      },
    });
    return prisma.approvedSupplier.update({
      where: { id },
      data: { status: 'CONDITIONAL', conditionalNote: note },
    });
  }

  async setPreferred(tenantId: string, id: string, changedBy: string, rank?: number) {
    const asl = await this.getApprovedSupplier(tenantId, id);
    if (asl.status !== 'APPROVED') throw new BadRequestException('Only APPROVED suppliers can be set as preferred');

    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: id, changeType: 'PREFERRED_UPDATE',
        previousValue: String(asl.preferenceRank), newValue: String(rank ?? 1), changedBy,
      },
    });

    return prisma.approvedSupplier.update({
      where: { id },
      data: { isPreferred: true, preferenceRank: rank ?? 1 },
    });
  }

  async unsetPreferred(tenantId: string, id: string, changedBy: string) {
    await this.getApprovedSupplier(tenantId, id);
    await prisma.aslChangeLog.create({
      data: {
        tenantId, approvedSupplierId: id, changeType: 'PREFERRED_UPDATE',
        newValue: 'not-preferred', changedBy,
      },
    });
    return prisma.approvedSupplier.update({
      where: { id },
      data: { isPreferred: false, preferenceRank: 999 },
    });
  }

  // ── Price Tiers ──────────────────────────────────────────────────────────

  async addPriceTier(tenantId: string, approvedSupplierId: string, dto: {
    fromQty: number; toQty?: number; unitPrice: number;
    effectiveFrom: string; effectiveTo?: string;
  }) {
    await this.getApprovedSupplier(tenantId, approvedSupplierId);
    return prisma.supplierPriceTier.create({
      data: {
        tenantId,
        approvedSupplierId,
        fromQty: dto.fromQty,
        toQty: dto.toQty ?? null,
        unitPrice: dto.unitPrice,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async deletePriceTier(tenantId: string, tierId: string) {
    const tier = await prisma.supplierPriceTier.findFirst({ where: { tenantId, id: tierId } });
    if (!tier) throw new NotFoundException('Price tier not found');
    await prisma.supplierPriceTier.delete({ where: { id: tierId } });
    return { deleted: true };
  }

  async getEffectivePrice(tenantId: string, approvedSupplierId: string, qty: number) {
    const now = new Date();
    const tiers = await prisma.supplierPriceTier.findMany({
      where: {
        tenantId, approvedSupplierId,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { fromQty: 'asc' },
    });

    let applicableTier = tiers.find((t) => {
      const from = Number(t.fromQty);
      const to = t.toQty != null ? Number(t.toQty) : Infinity;
      return qty >= from && qty <= to;
    });

    if (!applicableTier && tiers.length > 0) {
      applicableTier = tiers[tiers.length - 1];
    }

    const asl = await this.getApprovedSupplier(tenantId, approvedSupplierId);
    return {
      approvedSupplierId,
      qty,
      effectivePrice: applicableTier ? Number(applicableTier.unitPrice) : Number(asl.unitPrice ?? 0),
      tierId: applicableTier?.id ?? null,
      currency: asl.currency,
    };
  }

  // ── Vendor Item Attributes ───────────────────────────────────────────────

  async listAttributes(tenantId: string, productId: string, vendorId?: string) {
    return prisma.vendorItemAttribute.findMany({
      where: { tenantId, productId, ...(vendorId && { vendorId }) },
    });
  }

  async upsertAttribute(tenantId: string, dto: {
    productId: string; vendorId: string; attributeKey: string; attributeValue: string;
  }) {
    return prisma.vendorItemAttribute.upsert({
      where: {
        tenantId_productId_vendorId_attributeKey: {
          tenantId, productId: dto.productId, vendorId: dto.vendorId, attributeKey: dto.attributeKey,
        },
      },
      update: { attributeValue: dto.attributeValue },
      create: { tenantId, ...dto },
    });
  }

  async deleteAttribute(tenantId: string, id: string) {
    const attr = await prisma.vendorItemAttribute.findFirst({ where: { tenantId, id } });
    if (!attr) throw new NotFoundException('Attribute not found');
    await prisma.vendorItemAttribute.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Compliance Rules ─────────────────────────────────────────────────────

  async listComplianceRules(tenantId: string) {
    return prisma.aslComplianceRule.findMany({ where: { tenantId } });
  }

  async upsertComplianceRule(tenantId: string, dto: {
    productCategory?: string; minApprovedVendors?: number;
    requiresQualification?: boolean; qualificationValidityDays?: number;
    requiresPreferred?: boolean; notes?: string;
  }) {
    const key = dto.productCategory ?? null;
    return prisma.aslComplianceRule.upsert({
      where: { tenantId_productCategory: { tenantId, productCategory: key as string } },
      update: {
        minApprovedVendors: dto.minApprovedVendors ?? 1,
        requiresQualification: dto.requiresQualification ?? false,
        qualificationValidityDays: dto.qualificationValidityDays ?? null,
        requiresPreferred: dto.requiresPreferred ?? false,
        notes: dto.notes ?? null,
      },
      create: {
        tenantId, productCategory: key,
        minApprovedVendors: dto.minApprovedVendors ?? 1,
        requiresQualification: dto.requiresQualification ?? false,
        qualificationValidityDays: dto.qualificationValidityDays ?? null,
        requiresPreferred: dto.requiresPreferred ?? false,
        notes: dto.notes ?? null,
      },
    });
  }

  async checkProductCompliance(tenantId: string, productId: string, productCategory?: string) {
    const approvedCount = await prisma.approvedSupplier.count({
      where: { tenantId, productId, status: 'APPROVED' },
    });
    const preferredCount = await prisma.approvedSupplier.count({
      where: { tenantId, productId, status: 'APPROVED', isPreferred: true },
    });

    const rule = await prisma.aslComplianceRule.findFirst({
      where: {
        tenantId,
        OR: [{ productCategory }, { productCategory: null }],
      },
      orderBy: { productCategory: 'desc' },
    });

    const now = new Date();
    const expiredCount = await prisma.approvedSupplier.count({
      where: { tenantId, productId, status: 'APPROVED', expiryDate: { lt: now } },
    });

    const issues: string[] = [];
    if (rule) {
      if (approvedCount < rule.minApprovedVendors) issues.push(`Requires at least ${rule.minApprovedVendors} approved vendors (have ${approvedCount})`);
      if (rule.requiresPreferred && preferredCount === 0) issues.push('Requires a preferred vendor');
    }
    if (expiredCount > 0) issues.push(`${expiredCount} approved supplier(s) have expired qualifications`);

    return { productId, approvedCount, preferredCount, expiredCount, compliant: issues.length === 0, issues };
  }

  // ── Change Log ───────────────────────────────────────────────────────────

  async getChangeLog(tenantId: string, approvedSupplierId: string) {
    await this.getApprovedSupplier(tenantId, approvedSupplierId);
    return prisma.aslChangeLog.findMany({
      where: { tenantId, approvedSupplierId },
      orderBy: { changedAt: 'desc' },
    });
  }

  // ── Dashboard & Reports ──────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [total, approved, conditional, disqualified, pending, preferred] = await Promise.all([
      prisma.approvedSupplier.count({ where: { tenantId } }),
      prisma.approvedSupplier.count({ where: { tenantId, status: 'APPROVED' } }),
      prisma.approvedSupplier.count({ where: { tenantId, status: 'CONDITIONAL' } }),
      prisma.approvedSupplier.count({ where: { tenantId, status: 'DISQUALIFIED' } }),
      prisma.approvedSupplier.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
      prisma.approvedSupplier.count({ where: { tenantId, isPreferred: true } }),
    ]);

    const now = new Date();
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() + 30);

    const [expiring, expired] = await Promise.all([
      prisma.approvedSupplier.count({ where: { tenantId, status: 'APPROVED', expiryDate: { gte: now, lte: cutoff30 } } }),
      prisma.approvedSupplier.count({ where: { tenantId, status: 'APPROVED', expiryDate: { lt: now } } }),
    ]);

    return { total, approved, conditional, disqualified, pending, preferred, expiring, expired };
  }

  async getVendorSourcingReport(tenantId: string, productId: string) {
    const suppliers = await prisma.approvedSupplier.findMany({
      where: { tenantId, productId, status: { in: ['APPROVED', 'CONDITIONAL'] } },
      include: { priceTiers: true },
      orderBy: { preferenceRank: 'asc' },
    });

    return {
      productId,
      supplierCount: suppliers.length,
      hasPreferred: suppliers.some((s) => s.isPreferred),
      lowestPrice: suppliers.reduce((min, s) => {
        const p = Number(s.unitPrice ?? Infinity);
        return p < min ? p : min;
      }, Infinity),
      shortestLeadTime: suppliers.reduce((min, s) => {
        const lt = s.leadTimeDays ?? Infinity;
        return lt < min ? lt : min;
      }, Infinity),
      suppliers: suppliers.map((s) => ({
        vendorId: s.vendorId,
        isPreferred: s.isPreferred,
        rank: s.preferenceRank,
        unitPrice: s.unitPrice,
        currency: s.currency,
        moq: s.moq,
        leadTimeDays: s.leadTimeDays,
        status: s.status,
      })),
    };
  }

  async getExpiringSuppliers(tenantId: string, daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    return prisma.approvedSupplier.findMany({
      where: { tenantId, status: 'APPROVED', expiryDate: { lte: cutoff, gte: new Date() } },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
