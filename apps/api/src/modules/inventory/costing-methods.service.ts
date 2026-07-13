import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class CostingMethodsService {
  // ── Cost Profiles ─────────────────────────────────────────────────────────

  async upsertProfile(tenantId: string, userId: string, dto: {
    productId: string; warehouseId: string; method?: string;
    standardCost?: number; currency?: string; notes?: string;
  }) {
    const existing = await prisma.inventoryCostProfile.findUnique({
      where: { tenantId_productId_warehouseId: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId } },
    });
    if (existing) {
      return prisma.inventoryCostProfile.update({
        where: { id: existing.id },
        data: {
          method: (dto.method as any) ?? existing.method,
          standardCost: dto.standardCost != null ? dto.standardCost : existing.standardCost,
          currency: dto.currency ?? existing.currency,
          notes: dto.notes ?? existing.notes,
        },
      });
    }
    return prisma.inventoryCostProfile.create({
      data: {
        tenantId, productId: dto.productId, warehouseId: dto.warehouseId,
        method: (dto.method as any) ?? 'WAC',
        standardCost: dto.standardCost,
        currency: dto.currency ?? 'USD', notes: dto.notes, createdById: userId,
      },
    });
  }

  async listProfiles(tenantId: string, params: { productId?: string; method?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.productId) where.productId = params.productId;
    if (params.method) where.method = params.method;
    const [items, total] = await Promise.all([
      prisma.inventoryCostProfile.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { createdAt: 'desc' } }),
      prisma.inventoryCostProfile.count({ where }),
    ]);
    return { items, total };
  }

  async getProfile(tenantId: string, id: string) {
    const p = await prisma.inventoryCostProfile.findFirst({ where: { tenantId, id } });
    if (!p) throw new NotFoundException('Cost profile not found');
    return p;
  }

  // ── Cost Layers (FIFO/LIFO receipts) ─────────────────────────────────────

  async addCostLayer(tenantId: string, dto: {
    profileId: string; receiptDate: Date; receiptRef?: string; unitCost: number; qty: number; currency?: string;
  }) {
    if (dto.unitCost <= 0) throw new BadRequestException('unitCost must be positive');
    if (dto.qty <= 0) throw new BadRequestException('qty must be positive');
    const profile = await prisma.inventoryCostProfile.findFirst({ where: { tenantId, id: dto.profileId } });
    if (!profile) throw new NotFoundException('Cost profile not found');

    const layer = await prisma.inventoryCostLayer.create({
      data: {
        tenantId, profileId: dto.profileId, receiptDate: dto.receiptDate,
        receiptRef: dto.receiptRef, unitCost: dto.unitCost,
        qtyReceived: dto.qty, qtyRemaining: dto.qty,
        currency: dto.currency ?? profile.currency,
      },
    });

    // For WAC: update standardCost field to reflect new weighted average
    if (profile.method === 'WAC') {
      const openLayers = await prisma.inventoryCostLayer.findMany({
        where: { tenantId, profileId: dto.profileId, status: { not: 'FULLY_CONSUMED' } },
      });
      const totalQty = openLayers.reduce((sum, l) => sum + Number(l.qtyRemaining), 0);
      const totalValue = openLayers.reduce((sum, l) => sum + Number(l.qtyRemaining) * Number(l.unitCost), 0);
      const wac = totalQty > 0 ? totalValue / totalQty : dto.unitCost;
      await prisma.inventoryCostProfile.update({ where: { id: dto.profileId }, data: { standardCost: wac } });
    }
    return layer;
  }

  async listCostLayers(tenantId: string, profileId: string, onlyOpen = false) {
    const where: any = { tenantId, profileId };
    if (onlyOpen) where.status = { not: 'FULLY_CONSUMED' };
    return prisma.inventoryCostLayer.findMany({ where, orderBy: { receiptDate: 'asc' } });
  }

  async consumeLayer(tenantId: string, profileId: string, qtyToConsume: number, method?: string) {
    if (qtyToConsume <= 0) throw new BadRequestException('qtyToConsume must be positive');
    const profile = await prisma.inventoryCostProfile.findFirst({ where: { tenantId, id: profileId } });
    if (!profile) throw new NotFoundException('Cost profile not found');

    const effectiveMethod = method ?? profile.method;
    const openLayers = await prisma.inventoryCostLayer.findMany({
      where: { tenantId, profileId, status: { not: 'FULLY_CONSUMED' } },
      orderBy: { receiptDate: effectiveMethod === 'LIFO' ? 'desc' : 'asc' },
    });

    let remaining = qtyToConsume;
    let totalCost = 0;
    const consumed: { layerId: string; qty: number; cost: number }[] = [];

    for (const layer of openLayers) {
      if (remaining <= 0) break;
      const available = Number(layer.qtyRemaining);
      const take = Math.min(available, remaining);
      totalCost += take * Number(layer.unitCost);
      consumed.push({ layerId: layer.id, qty: take, cost: take * Number(layer.unitCost) });
      const newRemaining = available - take;
      await prisma.inventoryCostLayer.update({
        where: { id: layer.id },
        data: {
          qtyRemaining: newRemaining,
          status: newRemaining === 0 ? 'FULLY_CONSUMED' : 'PARTIALLY_CONSUMED',
        },
      });
      remaining -= take;
    }

    if (remaining > 0) throw new BadRequestException(`Insufficient cost layers — short by ${remaining}`);
    return { qtyConsumed: qtyToConsume, totalCost, avgCost: totalCost / qtyToConsume, layers: consumed };
  }

  // ── Cost Adjustments ──────────────────────────────────────────────────────

  async createAdjustment(tenantId: string, userId: string, dto: {
    profileId: string; adjustmentType: string; amount: number; currency?: string; reason: string;
  }) {
    const profile = await prisma.inventoryCostProfile.findFirst({ where: { tenantId, id: dto.profileId } });
    if (!profile) throw new NotFoundException('Cost profile not found');
    const count = await prisma.inventoryCostAdjustment.count({ where: { tenantId } });
    const adjustmentNumber = `ICA-${String(count + 1).padStart(6, '0')}`;
    return prisma.inventoryCostAdjustment.create({
      data: {
        tenantId, adjustmentNumber, profileId: dto.profileId,
        adjustmentType: dto.adjustmentType as any,
        amount: dto.amount, currency: dto.currency ?? profile.currency,
        reason: dto.reason, adjustedById: userId,
      },
    });
  }

  async listAdjustments(tenantId: string, params: { profileId?: string; adjustmentType?: string; skip?: number; take?: number }) {
    const where: any = { tenantId };
    if (params.profileId) where.profileId = params.profileId;
    if (params.adjustmentType) where.adjustmentType = params.adjustmentType;
    const [items, total] = await Promise.all([
      prisma.inventoryCostAdjustment.findMany({ where, skip: params.skip ?? 0, take: params.take ?? 20, orderBy: { adjustedAt: 'desc' } }),
      prisma.inventoryCostAdjustment.count({ where }),
    ]);
    return { items, total };
  }

  // ── Valuation ─────────────────────────────────────────────────────────────

  async getValuation(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const profiles = await prisma.inventoryCostProfile.findMany({ where });
    const rows = await Promise.all(profiles.map(async p => {
      const layers = await prisma.inventoryCostLayer.findMany({
        where: { tenantId, profileId: p.id, status: { not: 'FULLY_CONSUMED' } },
      });
      const totalQty = layers.reduce((sum, l) => sum + Number(l.qtyRemaining), 0);
      const totalValue = layers.reduce((sum, l) => sum + Number(l.qtyRemaining) * Number(l.unitCost), 0);
      return { profileId: p.id, productId: p.productId, warehouseId: p.warehouseId, method: p.method, totalQty, totalValue, currency: p.currency };
    }));
    return rows;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalProfiles, fifoProfiles, wacProfiles, lifoProfiles, totalAdjustments] = await Promise.all([
      prisma.inventoryCostProfile.count({ where: { tenantId } }),
      prisma.inventoryCostProfile.count({ where: { tenantId, method: 'FIFO' } }),
      prisma.inventoryCostProfile.count({ where: { tenantId, method: 'WAC' } }),
      prisma.inventoryCostProfile.count({ where: { tenantId, method: 'LIFO' } }),
      prisma.inventoryCostAdjustment.count({ where: { tenantId } }),
    ]);
    return { totalProfiles, fifoProfiles, wacProfiles, lifoProfiles, totalAdjustments };
  }
}
