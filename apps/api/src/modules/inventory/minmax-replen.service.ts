import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class MinMaxReplenService {

  // ── Min-Max Level Config ──────────────────────────────────────────────────

  async listLevels(tenantId: string, query: { warehouseId?: string; productId?: string; active?: boolean; limit?: number; offset?: number }) {
    const where: Prisma.MinMaxLevelWhereInput = {
      tenantId,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.minMaxLevel.findMany({ where, orderBy: { updatedAt: 'desc' }, take: query.limit ?? 20, skip: query.offset ?? 0 }),
      prisma.minMaxLevel.count({ where }),
    ]);
    return { data, total };
  }

  async upsertLevel(tenantId: string, userId: string, dto: {
    productId: string; warehouseId: string;
    minQty: number; maxQty: number; reorderQty?: number;
    method?: string; preferredVendorId?: string;
    leadTimeDays?: number; notes?: string;
  }) {
    if (dto.minQty >= dto.maxQty) throw new BadRequestException('minQty must be less than maxQty');
    if (dto.minQty < 0) throw new BadRequestException('minQty cannot be negative');

    const existing = await prisma.minMaxLevel.findUnique({
      where: { tenantId_productId_warehouseId: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId } },
    });

    const data = {
      minQty: new Prisma.Decimal(dto.minQty),
      maxQty: new Prisma.Decimal(dto.maxQty),
      reorderQty: dto.reorderQty !== undefined ? new Prisma.Decimal(dto.reorderQty) : null,
      method: dto.method as any ?? 'PURCHASE_ORDER',
      preferredVendorId: dto.preferredVendorId ?? null,
      leadTimeDays: dto.leadTimeDays ?? 0,
      notes: dto.notes ?? null,
      updatedById: userId,
      active: true,
    };

    if (existing) {
      return prisma.minMaxLevel.update({ where: { id: existing.id }, data });
    }
    return prisma.minMaxLevel.create({
      data: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId, ...data },
    });
  }

  async deactivateLevel(tenantId: string, levelId: string, userId: string) {
    const level = await prisma.minMaxLevel.findFirst({ where: { id: levelId, tenantId } });
    if (!level) throw new NotFoundException(`Min-max level ${levelId} not found`);
    return prisma.minMaxLevel.update({ where: { id: levelId }, data: { active: false, updatedById: userId } });
  }

  // ── Replenishment Run ─────────────────────────────────────────────────────

  /**
   * Scan all active min-max levels for a warehouse (or all), compare against
   * the supplied currentStock map, and generate OPEN suggestions for items below min.
   */
  async runReplenishment(tenantId: string, userId: string, dto: {
    warehouseId?: string;
    // map of "productId:warehouseId" → current stock qty (caller provides real-time stock)
    stockSnapshot: Record<string, number>;
    notes?: string;
  }) {
    const runCount = await prisma.replenRunLog.count({ where: { tenantId } });
    const runNumber = `RRL-${String(runCount + 1).padStart(6, '0')}`;

    const levels = await prisma.minMaxLevel.findMany({
      where: {
        tenantId, active: true,
        ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
      },
    });

    let sugCount = 0;
    const existingCount = await prisma.replenSuggestion.count({ where: { tenantId } });
    let suggNum = existingCount;

    for (const level of levels) {
      const key = `${level.productId}:${level.warehouseId}`;
      const currentStock = dto.stockSnapshot[key] ?? 0;

      if (currentStock < Number(level.minQty)) {
        // Suggest order-up-to max, or use fixed reorderQty if set
        const orderQty = level.reorderQty !== null
          ? Number(level.reorderQty)
          : Number(level.maxQty) - currentStock;

        if (orderQty <= 0) continue;

        suggNum++;
        const sNum = `RS-${String(suggNum).padStart(6, '0')}`;

        await prisma.replenSuggestion.create({
          data: {
            tenantId,
            suggestionNumber: sNum,
            levelId: level.id,
            productId: level.productId,
            warehouseId: level.warehouseId,
            currentStock: new Prisma.Decimal(currentStock),
            suggestedQty: new Prisma.Decimal(orderQty),
            method: level.method,
            vendorId: level.preferredVendorId ?? null,
            neededByDate: level.leadTimeDays > 0
              ? new Date(Date.now() + level.leadTimeDays * 86400000)
              : null,
          },
        });
        sugCount++;
      }
    }

    return prisma.replenRunLog.create({
      data: {
        tenantId, runNumber,
        warehouseId: dto.warehouseId ?? null,
        levelsScanned: levels.length,
        suggestionsCreated: sugCount,
        triggeredById: userId,
        completedAt: new Date(),
        notes: dto.notes,
      },
    });
  }

  // ── Suggestion Lifecycle ──────────────────────────────────────────────────

  async listSuggestions(tenantId: string, query: {
    status?: string; warehouseId?: string; productId?: string;
    limit?: number; offset?: number;
  }) {
    const where: Prisma.ReplenSuggestionWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status as any } : {}),
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.productId ? { productId: query.productId } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.replenSuggestion.findMany({ where, orderBy: { generatedAt: 'desc' }, take: query.limit ?? 20, skip: query.offset ?? 0 }),
      prisma.replenSuggestion.count({ where }),
    ]);
    return { data, total };
  }

  async approveSuggestion(tenantId: string, suggId: string, userId: string) {
    const sugg = await prisma.replenSuggestion.findFirst({ where: { id: suggId, tenantId } });
    if (!sugg) throw new NotFoundException(`Suggestion ${suggId} not found`);
    if (sugg.status !== 'OPEN') throw new BadRequestException(`Suggestion must be OPEN to approve; current: ${sugg.status}`);
    return prisma.replenSuggestion.update({
      where: { id: suggId },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    });
  }

  async markOrdered(tenantId: string, suggId: string) {
    const sugg = await prisma.replenSuggestion.findFirst({ where: { id: suggId, tenantId } });
    if (!sugg) throw new NotFoundException(`Suggestion ${suggId} not found`);
    if (sugg.status !== 'APPROVED') throw new BadRequestException(`Suggestion must be APPROVED to mark as ordered`);
    return prisma.replenSuggestion.update({ where: { id: suggId }, data: { status: 'ORDERED', orderedAt: new Date() } });
  }

  async markReceived(tenantId: string, suggId: string) {
    const sugg = await prisma.replenSuggestion.findFirst({ where: { id: suggId, tenantId } });
    if (!sugg) throw new NotFoundException(`Suggestion ${suggId} not found`);
    if (sugg.status !== 'ORDERED') throw new BadRequestException(`Suggestion must be ORDERED to mark as received`);
    return prisma.replenSuggestion.update({ where: { id: suggId }, data: { status: 'RECEIVED', receivedAt: new Date() } });
  }

  async cancelSuggestion(tenantId: string, suggId: string, userId: string, reason: string) {
    const sugg = await prisma.replenSuggestion.findFirst({ where: { id: suggId, tenantId } });
    if (!sugg) throw new NotFoundException(`Suggestion ${suggId} not found`);
    if (['RECEIVED', 'CANCELLED'].includes(sugg.status)) {
      throw new BadRequestException(`Cannot cancel a ${sugg.status} suggestion`);
    }
    return prisma.replenSuggestion.update({
      where: { id: suggId },
      data: { status: 'CANCELLED', cancelledById: userId, cancellationReason: reason },
    });
  }

  // ── Run Logs ──────────────────────────────────────────────────────────────

  async listRunLogs(tenantId: string, query: { limit?: number; offset?: number }) {
    const where = { tenantId };
    const [data, total] = await Promise.all([
      prisma.replenRunLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: query.limit ?? 20, skip: query.offset ?? 0 }),
      prisma.replenRunLog.count({ where }),
    ]);
    return { data, total };
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [activeLevels, totalLevels, openSugg, approvedSugg, orderedSugg, totalRuns] = await Promise.all([
      prisma.minMaxLevel.count({ where: { tenantId, active: true } }),
      prisma.minMaxLevel.count({ where: { tenantId } }),
      prisma.replenSuggestion.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.replenSuggestion.count({ where: { tenantId, status: 'APPROVED' } }),
      prisma.replenSuggestion.count({ where: { tenantId, status: 'ORDERED' } }),
      prisma.replenRunLog.count({ where: { tenantId } }),
    ]);

    const lastRun = await prisma.replenRunLog.findFirst({
      where: { tenantId }, orderBy: { createdAt: 'desc' },
    });

    return { activeLevels, totalLevels, openSugg, approvedSugg, orderedSugg, totalRuns, lastRun };
  }
}
