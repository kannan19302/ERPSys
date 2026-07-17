import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class LandedCostService {
  // ── Voucher CRUD ────────────────────────────────────────────────────────────

  async listVouchers(tenantId: string, status?: string) {
    return prisma.landedCostVoucher.findMany({
      where: { tenantId, ...(status ? { status: status as never } : {}) },
      include: { chargeLines: true, receiptLinks: true, _count: { select: { allocations: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVoucher(tenantId: string, id: string) {
    const v = await prisma.landedCostVoucher.findFirst({
      where: { tenantId, id },
      include: { chargeLines: true, receiptLinks: true, allocations: true },
    });
    if (!v) throw new NotFoundException('Landed cost voucher not found');
    return v;
  }

  async createVoucher(tenantId: string, createdBy: string, dto: {
    description?: string;
    allocationMethod: string;
    currency?: string;
    vendorId?: string;
    invoiceRef?: string;
    notes?: string;
  }) {
    const seq = await prisma.landedCostVoucher.count({ where: { tenantId } });
    const voucherNumber = `LCV-${String(seq + 1).padStart(5, '0')}`;
    return prisma.landedCostVoucher.create({
      data: {
        tenantId,
        voucherNumber,
        description: dto.description,
        allocationMethod: dto.allocationMethod as never,
        currency: dto.currency ?? 'USD',
        vendorId: dto.vendorId,
        invoiceRef: dto.invoiceRef,
        notes: dto.notes,
        createdBy,
        totalAmount: new Prisma.Decimal(0),
      },
    });
  }

  async updateVoucher(tenantId: string, id: string, dto: {
    description?: string;
    allocationMethod?: string;
    currency?: string;
    vendorId?: string;
    invoiceRef?: string;
    notes?: string;
  }) {
    await this.getVoucher(tenantId, id);
    return prisma.landedCostVoucher.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.allocationMethod && { allocationMethod: dto.allocationMethod as never }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.vendorId !== undefined && { vendorId: dto.vendorId }),
        ...(dto.invoiceRef !== undefined && { invoiceRef: dto.invoiceRef }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteVoucher(tenantId: string, id: string) {
    const v = await this.getVoucher(tenantId, id);
    if (v.status !== 'DRAFT') throw new BadRequestException('Only DRAFT vouchers can be deleted');
    await prisma.landedCostVoucher.delete({ where: { id } });
    return { deleted: true };
  }

  async submitVoucher(tenantId: string, id: string) {
    const v = await this.getVoucher(tenantId, id);
    if (v.status !== 'DRAFT') throw new BadRequestException('Voucher must be in DRAFT status');
    if (v.chargeLines.length === 0) throw new BadRequestException('Voucher must have at least one charge line');
    return prisma.landedCostVoucher.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
  }

  async cancelVoucher(tenantId: string, id: string) {
    const v = await this.getVoucher(tenantId, id);
    if (v.status === 'ALLOCATED') throw new BadRequestException('Allocated vouchers cannot be cancelled');
    return prisma.landedCostVoucher.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // ── Charge Lines ────────────────────────────────────────────────────────────

  async listChargeLines(tenantId: string, voucherId: string) {
    await this.getVoucher(tenantId, voucherId);
    return prisma.landedCostChargeLine.findMany({ where: { tenantId, voucherId } });
  }

  async addChargeLine(tenantId: string, voucherId: string, dto: {
    chargeType: string;
    description?: string;
    amount: number;
    currency?: string;
    accountCode?: string;
  }) {
    const v = await this.getVoucher(tenantId, voucherId);
    if (v.status !== 'DRAFT') throw new BadRequestException('Can only add charge lines to DRAFT vouchers');
    const line = await prisma.landedCostChargeLine.create({
      data: {
        tenantId,
        voucherId,
        chargeType: dto.chargeType as never,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'USD',
        accountCode: dto.accountCode,
      },
    });
    await this.recalcTotal(tenantId, voucherId);
    return line;
  }

  async updateChargeLine(tenantId: string, voucherId: string, lineId: string, dto: {
    chargeType?: string;
    description?: string;
    amount?: number;
    currency?: string;
    accountCode?: string;
  }) {
    await this.getVoucher(tenantId, voucherId);
    const updated = await prisma.landedCostChargeLine.update({
      where: { id: lineId },
      data: {
        ...(dto.chargeType && { chargeType: dto.chargeType as never }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.accountCode !== undefined && { accountCode: dto.accountCode }),
      },
    });
    await this.recalcTotal(tenantId, voucherId);
    return updated;
  }

  async removeChargeLine(tenantId: string, voucherId: string, lineId: string) {
    const v = await this.getVoucher(tenantId, voucherId);
    if (v.status !== 'DRAFT') throw new BadRequestException('Can only remove charge lines from DRAFT vouchers');
    await prisma.landedCostChargeLine.delete({ where: { id: lineId } });
    await this.recalcTotal(tenantId, voucherId);
    return { deleted: true };
  }

  private async recalcTotal(tenantId: string, voucherId: string) {
    const agg = await prisma.landedCostChargeLine.aggregate({
      where: { tenantId, voucherId },
      _sum: { amount: true },
    });
    await prisma.landedCostVoucher.update({
      where: { id: voucherId },
      data: { totalAmount: agg._sum.amount ?? new Prisma.Decimal(0) },
    });
  }

  // ── Receipt Links ────────────────────────────────────────────────────────────

  async listReceiptLinks(tenantId: string, voucherId: string) {
    await this.getVoucher(tenantId, voucherId);
    return prisma.landedCostReceiptLink.findMany({ where: { tenantId, voucherId } });
  }

  async linkReceipt(tenantId: string, voucherId: string, dto: {
    stockEntryId: string;
    totalQty: number;
    totalValue: number;
    totalWeight?: number;
    totalVolume?: number;
  }) {
    const v = await this.getVoucher(tenantId, voucherId);
    if (v.status !== 'DRAFT') throw new BadRequestException('Can only link receipts to DRAFT vouchers');
    return prisma.landedCostReceiptLink.create({
      data: {
        tenantId,
        voucherId,
        stockEntryId: dto.stockEntryId,
        totalQty: new Prisma.Decimal(dto.totalQty),
        totalValue: new Prisma.Decimal(dto.totalValue),
        totalWeight: dto.totalWeight != null ? new Prisma.Decimal(dto.totalWeight) : null,
        totalVolume: dto.totalVolume != null ? new Prisma.Decimal(dto.totalVolume) : null,
      },
    });
  }

  async unlinkReceipt(tenantId: string, voucherId: string, stockEntryId: string) {
    const v = await this.getVoucher(tenantId, voucherId);
    if (v.status !== 'DRAFT') throw new BadRequestException('Can only unlink receipts from DRAFT vouchers');
    await prisma.landedCostReceiptLink.deleteMany({ where: { tenantId, voucherId, stockEntryId } });
    return { deleted: true };
  }

  // ── Allocation ──────────────────────────────────────────────────────────────

  async allocate(tenantId: string, id: string) {
    const v = await this.getVoucher(tenantId, id);
    if (v.status !== 'SUBMITTED') throw new BadRequestException('Voucher must be SUBMITTED before allocation');
    if (v.receiptLinks.length === 0) throw new BadRequestException('No receipt links found');

    const receiptLinks = await prisma.landedCostReceiptLink.findMany({ where: { tenantId, voucherId: id } });
    const chargeLines = await prisma.landedCostChargeLine.findMany({ where: { tenantId, voucherId: id } });

    const method = v.allocationMethod;
    const basis = receiptLinks.map((r) => {
      switch (method) {
        case 'QTY': return Number(r.totalQty);
        case 'VALUE': return Number(r.totalValue);
        case 'WEIGHT': return Number(r.totalWeight ?? 0);
        case 'VOLUME': return Number(r.totalVolume ?? 0);
        default: return 1; // EQUAL
      }
    });

    const totalBasis = basis.reduce((s, b) => s + b, 0) || 1;

    // Delete prior allocations
    await prisma.landedCostAllocation.deleteMany({ where: { tenantId, voucherId: id } });

    const allocs: Prisma.LandedCostAllocationCreateManyInput[] = [];
    for (const line of chargeLines) {
      const lineAmt = Number(line.amount);
      receiptLinks.forEach((r, i) => {
        const pct = (basis[i] ?? 1) / totalBasis;
        const allocated = lineAmt * pct;
        allocs.push({
          tenantId,
          voucherId: id,
          chargeType: line.chargeType,
          stockEntryId: r.stockEntryId,
          productId: r.stockEntryId, // placeholder — real impl would join items
          allocationBasis: new Prisma.Decimal(basis[i] ?? 1),
          allocationPct: new Prisma.Decimal(pct * 100),
          allocatedAmount: new Prisma.Decimal(allocated),
          addedToItemCost: false,
        });
      });
    }

    await prisma.landedCostAllocation.createMany({ data: allocs });
    await prisma.landedCostVoucher.update({
      where: { id },
      data: { status: 'ALLOCATED', allocatedAt: new Date() },
    });

    return { allocated: allocs.length, voucherId: id };
  }

  async listAllocations(tenantId: string, voucherId: string) {
    await this.getVoucher(tenantId, voucherId);
    return prisma.landedCostAllocation.findMany({ where: { tenantId, voucherId } });
  }

  // ── Reports & Dashboard ──────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalVouchers, draftCount, submittedCount, allocatedCount, cancelledCount, totalAllocated] =
      await Promise.all([
        prisma.landedCostVoucher.count({ where: { tenantId } }),
        prisma.landedCostVoucher.count({ where: { tenantId, status: 'DRAFT' } }),
        prisma.landedCostVoucher.count({ where: { tenantId, status: 'SUBMITTED' } }),
        prisma.landedCostVoucher.count({ where: { tenantId, status: 'ALLOCATED' } }),
        prisma.landedCostVoucher.count({ where: { tenantId, status: 'CANCELLED' } }),
        prisma.landedCostVoucher.aggregate({
          where: { tenantId, status: 'ALLOCATED' },
          _sum: { totalAmount: true },
        }),
      ]);

    return {
      totalVouchers,
      byStatus: { draftCount, submittedCount, allocatedCount, cancelledCount },
      totalAllocatedAmount: Number(totalAllocated._sum.totalAmount ?? 0),
    };
  }

  async getAllocationReport(tenantId: string, voucherId?: string) {
    const where: Prisma.LandedCostAllocationWhereInput = {
      tenantId,
      ...(voucherId ? { voucherId } : {}),
    };
    const allocs = await prisma.landedCostAllocation.findMany({
      where,
      include: { voucher: { select: { voucherNumber: true, allocationMethod: true, currency: true } } },
      orderBy: [{ voucherId: 'asc' }, { chargeType: 'asc' }],
    });

    const byType: Record<string, number> = {};
    for (const a of allocs) {
      byType[a.chargeType] = (byType[a.chargeType] ?? 0) + Number(a.allocatedAmount);
    }
    return { allocations: allocs, byChargeType: byType };
  }

  async getChargeTypeSummary(tenantId: string) {
    const lines = await prisma.landedCostChargeLine.findMany({
      where: { tenantId },
      select: { chargeType: true, amount: true },
    });
    const summary: Record<string, number> = {};
    for (const l of lines) {
      summary[l.chargeType] = (summary[l.chargeType] ?? 0) + Number(l.amount);
    }
    return summary;
  }
}
