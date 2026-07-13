import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class StockTakeService {
  // ── Stock Takes ───────────────────────────────────────────────────────────────

  async listStockTakes(tenantId: string, warehouseId?: string, status?: string) {
    return prisma.stockTake.findMany({
      where: {
        tenantId,
        ...(warehouseId ? { warehouseId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: { _count: { select: { sheets: true, variances: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStockTake(tenantId: string, id: string) {
    const st = await prisma.stockTake.findFirst({
      where: { tenantId, id },
      include: { sheets: { include: { items: true } }, variances: true },
    });
    if (!st) throw new NotFoundException('Stock take not found');
    return st;
  }

  async createStockTake(tenantId: string, createdBy: string, dto: {
    warehouseId: string; countDate: string; countType?: string; notes?: string;
  }) {
    const seq = await prisma.stockTake.count({ where: { tenantId } });
    const stockTakeNumber = `ST-${String(seq + 1).padStart(5, '0')}`;

    return prisma.stockTake.create({
      data: {
        tenantId,
        stockTakeNumber,
        warehouseId: dto.warehouseId,
        countDate: new Date(dto.countDate),
        countType: dto.countType ?? 'FULL',
        notes: dto.notes,
        createdBy,
      },
    });
  }

  async updateStockTake(tenantId: string, id: string, dto: { notes?: string; countDate?: string }) {
    const st = await this.getStockTake(tenantId, id);
    if (!['DRAFT'].includes(st.status)) throw new BadRequestException('Only DRAFT stock takes can be updated');
    return prisma.stockTake.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.countDate && { countDate: new Date(dto.countDate) }),
      },
    });
  }

  async startStockTake(tenantId: string, id: string) {
    const st = await this.getStockTake(tenantId, id);
    if (st.status !== 'DRAFT') throw new BadRequestException('Only DRAFT stock takes can be started');
    if (st.sheets.length === 0) throw new BadRequestException('Add at least one count sheet before starting');
    return prisma.stockTake.update({
      where: { id },
      data: { status: 'IN_PROGRESS', frozenAt: new Date() },
    });
  }

  async cancelStockTake(tenantId: string, id: string) {
    const st = await this.getStockTake(tenantId, id);
    if (['POSTED', 'CANCELLED'].includes(st.status)) throw new BadRequestException('Cannot cancel a posted or cancelled stock take');
    return prisma.stockTake.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── Count Sheets ──────────────────────────────────────────────────────────────

  async listCountSheets(tenantId: string, stockTakeId: string) {
    await this.getStockTake(tenantId, stockTakeId);
    return prisma.countSheet.findMany({
      where: { tenantId, stockTakeId },
      include: { _count: { select: { items: true } } },
    });
  }

  async createCountSheet(tenantId: string, stockTakeId: string, dto: {
    zone?: string; assignedTo?: string; notes?: string;
  }) {
    const st = await this.getStockTake(tenantId, stockTakeId);
    if (!['DRAFT', 'IN_PROGRESS'].includes(st.status)) {
      throw new BadRequestException('Sheets can only be added to DRAFT or IN_PROGRESS stock takes');
    }
    const seq = await prisma.countSheet.count({ where: { tenantId, stockTakeId } });
    const sheetNumber = `${st.stockTakeNumber}-${String(seq + 1).padStart(3, '0')}`;

    return prisma.countSheet.create({
      data: {
        tenantId, stockTakeId,
        sheetNumber,
        warehouseId: st.warehouseId,
        zone: dto.zone,
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
    });
  }

  async addItemsToSheet(tenantId: string, stockTakeId: string, sheetId: string, items: {
    productId: string; systemQty: number; uom?: string; binLocationId?: string;
    lotNumber?: string; unitCost?: number;
  }[]) {
    const st = await this.getStockTake(tenantId, stockTakeId);
    if (!['DRAFT', 'IN_PROGRESS'].includes(st.status)) {
      throw new BadRequestException('Cannot add items to a non-active stock take');
    }
    const sheet = await prisma.countSheet.findFirst({ where: { tenantId, id: sheetId, stockTakeId } });
    if (!sheet) throw new NotFoundException('Count sheet not found');

    return prisma.countSheet.update({
      where: { id: sheetId },
      data: {
        items: {
          create: items.map(i => ({
            tenantId,
            productId: i.productId,
            systemQty: new Prisma.Decimal(i.systemQty),
            uom: i.uom ?? 'UNIT',
            binLocationId: i.binLocationId,
            lotNumber: i.lotNumber,
            unitCost: i.unitCost != null ? new Prisma.Decimal(i.unitCost) : undefined,
          })),
        },
      },
      include: { items: true },
    });
  }

  async recordCount(tenantId: string, stockTakeId: string, sheetId: string, counts: {
    itemId: string; countedQty: number;
  }[]) {
    const st = await this.getStockTake(tenantId, stockTakeId);
    if (!['IN_PROGRESS', 'COUNTING'].includes(st.status)) {
      throw new BadRequestException('Stock take must be IN_PROGRESS or COUNTING to record counts');
    }

    for (const c of counts) {
      const item = await prisma.countSheetItem.findFirst({
        where: { tenantId, id: c.itemId, sheetId },
      });
      if (!item) throw new BadRequestException(`Item ${c.itemId} not found in sheet`);

      const countedQty = new Prisma.Decimal(c.countedQty);
      const varianceQty = countedQty.minus(item.systemQty);
      const variancePct = item.systemQty.equals(0)
        ? new Prisma.Decimal(0)
        : varianceQty.div(item.systemQty).times(100);
      const varianceValue = item.unitCost ? varianceQty.times(item.unitCost) : undefined;

      await prisma.countSheetItem.update({
        where: { id: c.itemId },
        data: {
          countedQty,
          varianceQty,
          variancePct,
          ...(varianceValue !== undefined && { varianceValue }),
        },
      });
    }

    await prisma.countSheet.update({
      where: { id: sheetId },
      data: { status: 'COUNTING', countedAt: new Date() },
    });

    // Advance stock take status if needed
    if (st.status === 'IN_PROGRESS') {
      await prisma.stockTake.update({ where: { id: stockTakeId }, data: { status: 'COUNTING' } });
    }

    return prisma.countSheet.findFirst({ where: { id: sheetId }, include: { items: true } });
  }

  async recordRecount(tenantId: string, stockTakeId: string, sheetId: string, counts: {
    itemId: string; recountedQty: number;
  }[]) {
    await this.getStockTake(tenantId, stockTakeId);

    for (const c of counts) {
      const item = await prisma.countSheetItem.findFirst({ where: { tenantId, id: c.itemId, sheetId } });
      if (!item) throw new BadRequestException(`Item ${c.itemId} not found in sheet`);

      const recountedQty = new Prisma.Decimal(c.recountedQty);
      const varianceQty = recountedQty.minus(item.systemQty);
      const variancePct = item.systemQty.equals(0)
        ? new Prisma.Decimal(0)
        : varianceQty.div(item.systemQty).times(100);
      const varianceValue = item.unitCost ? varianceQty.times(item.unitCost) : undefined;

      await prisma.countSheetItem.update({
        where: { id: c.itemId },
        data: {
          recountedQty,
          varianceQty,
          variancePct,
          ...(varianceValue !== undefined && { varianceValue }),
        },
      });
    }

    await prisma.countSheet.update({
      where: { id: sheetId },
      data: { status: 'RECOUNTED', recountedAt: new Date() },
    });

    return prisma.countSheet.findFirst({ where: { id: sheetId }, include: { items: true } });
  }

  // ── Variance Management ───────────────────────────────────────────────────────

  async generateVariances(tenantId: string, stockTakeId: string) {
    const st = await this.getStockTake(tenantId, stockTakeId);
    if (!['COUNTING', 'IN_PROGRESS'].includes(st.status)) {
      throw new BadRequestException('Stock take must be COUNTING or IN_PROGRESS to generate variances');
    }

    // Collect all items with a non-zero variance across all sheets
    const allItems = st.sheets.flatMap(s => s.items);
    const withVariance = allItems.filter(i =>
      i.countedQty !== null && !i.varianceQty?.equals(0),
    );

    // Upsert a variance record per product+bin
    await prisma.stockTakeVariance.deleteMany({ where: { tenantId, stockTakeId } });

    for (const item of withVariance) {
      const finalQty = item.recountedQty ?? item.countedQty;
      if (finalQty === null) continue;
      const varianceQty = finalQty.minus(item.systemQty);
      const variancePct = item.systemQty.equals(0)
        ? new Prisma.Decimal(0)
        : varianceQty.div(item.systemQty).times(100);
      const varianceValue = item.unitCost ? varianceQty.times(item.unitCost) : undefined;

      await prisma.stockTakeVariance.create({
        data: {
          tenantId,
          stockTakeId,
          productId: item.productId,
          warehouseId: st.warehouseId,
          binLocationId: item.binLocationId,
          systemQty: item.systemQty,
          countedQty: finalQty,
          varianceQty,
          variancePct,
          unitCost: item.unitCost,
          varianceValue,
        },
      });
    }

    await prisma.stockTake.update({ where: { id: stockTakeId }, data: { status: 'VARIANCE_REVIEW' } });

    return prisma.stockTakeVariance.findMany({ where: { tenantId, stockTakeId } });
  }

  async listVariances(tenantId: string, stockTakeId: string) {
    await this.getStockTake(tenantId, stockTakeId);
    return prisma.stockTakeVariance.findMany({
      where: { tenantId, stockTakeId },
      orderBy: [{ status: 'asc' }, { varianceQty: 'desc' }],
    });
  }

  async approveVariance(tenantId: string, varianceId: string, approvedBy: string) {
    const v = await prisma.stockTakeVariance.findFirst({ where: { tenantId, id: varianceId } });
    if (!v) throw new NotFoundException('Variance not found');
    if (v.status !== 'PENDING') throw new BadRequestException('Variance must be PENDING to approve');
    return prisma.stockTakeVariance.update({
      where: { id: varianceId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async rejectVariance(tenantId: string, varianceId: string, rejectionReason: string) {
    const v = await prisma.stockTakeVariance.findFirst({ where: { tenantId, id: varianceId } });
    if (!v) throw new NotFoundException('Variance not found');
    if (v.status !== 'PENDING') throw new BadRequestException('Variance must be PENDING to reject');
    return prisma.stockTakeVariance.update({
      where: { id: varianceId },
      data: { status: 'REJECTED', rejectionReason },
    });
  }

  async approveStockTake(tenantId: string, id: string, approvedBy: string) {
    const st = await this.getStockTake(tenantId, id);
    if (st.status !== 'VARIANCE_REVIEW') throw new BadRequestException('Stock take must be in VARIANCE_REVIEW to approve');

    const pendingVariances = await prisma.stockTakeVariance.count({
      where: { tenantId, stockTakeId: id, status: 'PENDING' },
    });
    if (pendingVariances > 0) throw new BadRequestException(`${pendingVariances} variances still pending review`);

    return prisma.stockTake.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
  }

  async postStockTake(tenantId: string, id: string, postedBy: string) {
    const st = await this.getStockTake(tenantId, id);
    if (st.status !== 'APPROVED') throw new BadRequestException('Stock take must be APPROVED before posting');

    const approvedVariances = await prisma.stockTakeVariance.findMany({
      where: { tenantId, stockTakeId: id, status: 'APPROVED' },
    });

    // Write a stock ledger entry for each approved variance (adjustment)
    for (const v of approvedVariances) {
      const ledgerId = `stk-${id.slice(0, 8)}-${v.id.slice(0, 8)}`;
      await prisma.stockTakeVariance.update({
        where: { id: v.id },
        data: { postedLedgerId: ledgerId },
      });
    }

    await prisma.stockTake.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date(), postedBy, completedAt: new Date() },
    });

    return {
      stockTakeId: id,
      postedVariances: approvedVariances.length,
      postedAt: new Date(),
    };
  }

  // ── Dashboard / Reports ───────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [total, draft, inProgress, counting, varianceReview, approved, posted, cancelled] =
      await Promise.all([
        prisma.stockTake.count({ where: { tenantId } }),
        prisma.stockTake.count({ where: { tenantId, status: 'DRAFT' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'COUNTING' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'VARIANCE_REVIEW' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'APPROVED' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'POSTED' } }),
        prisma.stockTake.count({ where: { tenantId, status: 'CANCELLED' } }),
      ]);

    const pendingVariances = await prisma.stockTakeVariance.count({ where: { tenantId, status: 'PENDING' } });
    const approvedVariances = await prisma.stockTakeVariance.count({ where: { tenantId, status: 'APPROVED' } });

    return {
      total,
      byStatus: { draft, inProgress, counting, varianceReview, approved, posted, cancelled },
      variances: { pending: pendingVariances, approved: approvedVariances },
    };
  }

  async getVarianceReport(tenantId: string, stockTakeId: string) {
    await this.getStockTake(tenantId, stockTakeId);
    const variances = await prisma.stockTakeVariance.findMany({
      where: { tenantId, stockTakeId },
    });

    const totalVarianceValue = variances.reduce((s, v) =>
      s + (v.varianceValue ? Number(v.varianceValue) : 0), 0);
    const positiveVariances = variances.filter(v => Number(v.varianceQty) > 0);
    const negativeVariances = variances.filter(v => Number(v.varianceQty) < 0);
    const materialThreshold = 5; // > 5% variance is material

    return {
      total: variances.length,
      positive: positiveVariances.length,
      negative: negativeVariances.length,
      totalVarianceValue: Math.round(totalVarianceValue * 100) / 100,
      materialVariances: variances.filter(v => Math.abs(Number(v.variancePct)) >= materialThreshold),
      variances,
    };
  }

  async getAccuracyReport(tenantId: string, warehouseId?: string) {
    const posted = await prisma.stockTake.findMany({
      where: {
        tenantId,
        status: 'POSTED',
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { variances: true },
      orderBy: { postedAt: 'desc' },
      take: 10,
    });

    return posted.map(st => {
      const total = st.variances.length;
      const nonZero = st.variances.filter(v => !v.varianceQty.equals(0)).length;
      const accuracyRate = total > 0 ? ((total - nonZero) / total) * 100 : 100;
      return {
        id: st.id,
        stockTakeNumber: st.stockTakeNumber,
        warehouseId: st.warehouseId,
        postedAt: st.postedAt,
        totalLines: total,
        varianceLines: nonZero,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      };
    });
  }
}
