import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Input schemas ────────────────────────────────────────────────────────────

export const createReplenishmentRuleSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().min(1),
  activeBinCode: z.string().min(1),
  reserveBinCode: z.string().min(1),
  triggerQty: z.number().positive(),
  replenishQty: z.number().positive(),
});
export type CreateReplenishmentRuleInput = z.infer<typeof createReplenishmentRuleSchema>;

export const createHoldSchema = z.object({
  warehouseId: z.string().min(1),
  productId: z.string().optional(),
  batchId: z.string().optional(),
  serialId: z.string().optional(),
  holdType: z.enum(['QUALITY', 'CUSTOMS', 'DAMAGE', 'RECALL', 'FINANCIAL']),
  reason: z.string().min(1),
  heldQty: z.number().positive(),
  raisedBy: z.string().optional(),
});
export type CreateHoldInput = z.infer<typeof createHoldSchema>;

export const releaseHoldSchema = z.object({
  releasedBy: z.string().min(1),
  releaseNotes: z.string().optional(),
});
export type ReleaseHoldInput = z.infer<typeof releaseHoldSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class InventoryAutomationService {

  // ─── Bin Replenishment Rules ──────────────────────────────────────────────

  async listReplenishmentRules(tenantId: string, warehouseId?: string) {
    const where: Prisma.BinReplenishmentRuleWhereInput = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    return prisma.binReplenishmentRule.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createReplenishmentRule(tenantId: string, dto: CreateReplenishmentRuleInput) {
    const existing = await prisma.binReplenishmentRule.findFirst({
      where: { tenantId, warehouseId: dto.warehouseId, productId: dto.productId, activeBinCode: dto.activeBinCode },
    });
    if (existing) {
      throw new BadRequestException('A replenishment rule for this product and bin already exists');
    }
    return prisma.binReplenishmentRule.create({
      data: {
        tenantId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        activeBinCode: dto.activeBinCode,
        reserveBinCode: dto.reserveBinCode,
        triggerQty: new Prisma.Decimal(dto.triggerQty.toFixed(4)),
        replenishQty: new Prisma.Decimal(dto.replenishQty.toFixed(4)),
      },
    });
  }

  async updateReplenishmentRule(
    tenantId: string,
    id: string,
    dto: Partial<Pick<CreateReplenishmentRuleInput, 'triggerQty' | 'replenishQty' | 'reserveBinCode'>>,
  ) {
    const rule = await prisma.binReplenishmentRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Replenishment rule not found');
    return prisma.binReplenishmentRule.update({
      where: { id },
      data: {
        ...(dto.triggerQty !== undefined && { triggerQty: new Prisma.Decimal(dto.triggerQty.toFixed(4)) }),
        ...(dto.replenishQty !== undefined && { replenishQty: new Prisma.Decimal(dto.replenishQty.toFixed(4)) }),
        ...(dto.reserveBinCode !== undefined && { reserveBinCode: dto.reserveBinCode }),
      },
    });
  }

  async deleteReplenishmentRule(tenantId: string, id: string) {
    const rule = await prisma.binReplenishmentRule.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('Replenishment rule not found');
    return prisma.binReplenishmentRule.update({ where: { id }, data: { isActive: false } });
  }

  async evaluateReplenishmentRules(tenantId: string, warehouseId: string) {
    const rules = await prisma.binReplenishmentRule.findMany({
      where: { tenantId, warehouseId, isActive: true },
    });

    const triggered: Array<{ ruleId: string; productId: string; activeBinCode: string; currentQty: number; triggerQty: number }> = [];

    for (const rule of rules) {
      // Check active bin stock level via InventoryItemBin
      const activeBin = await prisma.inventoryItemBin.findFirst({
        where: { tenantId, warehouseId, productId: rule.productId },
        include: { binLocation: { select: { code: true } } },
      });
      const currentQty = activeBin ? Number(activeBin.quantity) : 0;

      if (currentQty < Number(rule.triggerQty)) {
        triggered.push({
          ruleId: rule.id,
          productId: rule.productId,
          activeBinCode: rule.activeBinCode,
          currentQty,
          triggerQty: Number(rule.triggerQty),
        });
        await prisma.binReplenishmentRule.update({
          where: { id: rule.id },
          data: { lastTriggeredAt: new Date() },
        });
      }
    }

    return { evaluated: rules.length, triggered: triggered.length, details: triggered };
  }

  // ─── Inventory Holds ─────────────────────────────────────────────────────

  async listHolds(tenantId: string, query: { productId?: string; warehouseId?: string; status?: string }) {
    const where: Prisma.InventoryHoldWhereInput = { tenantId };
    if (query.productId) where.productId = query.productId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.status) where.status = query.status;
    return prisma.inventoryHold.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHold(tenantId: string, dto: CreateHoldInput) {
    const holdNumber = `HOLD-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.inventoryHold.create({
      data: {
        tenantId,
        holdNumber,
        warehouseId: dto.warehouseId,
        productId: dto.productId ?? null,
        batchId: dto.batchId ?? null,
        serialId: dto.serialId ?? null,
        holdType: dto.holdType,
        reason: dto.reason,
        heldQty: new Prisma.Decimal(dto.heldQty.toFixed(4)),
        raisedBy: dto.raisedBy ?? null,
      },
    });
  }

  async releaseHold(tenantId: string, id: string, dto: ReleaseHoldInput) {
    const hold = await prisma.inventoryHold.findFirst({ where: { id, tenantId } });
    if (!hold) throw new NotFoundException('Inventory hold not found');
    if (hold.status !== 'ACTIVE') throw new BadRequestException(`Hold is ${hold.status.toLowerCase()}, cannot release`);
    return prisma.inventoryHold.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedBy: dto.releasedBy,
        releasedAt: new Date(),
        releaseNotes: dto.releaseNotes ?? null,
      },
    });
  }

  async cancelHold(tenantId: string, id: string) {
    const hold = await prisma.inventoryHold.findFirst({ where: { id, tenantId } });
    if (!hold) throw new NotFoundException('Inventory hold not found');
    if (hold.status !== 'ACTIVE') throw new BadRequestException(`Hold is ${hold.status.toLowerCase()}, cannot cancel`);
    return prisma.inventoryHold.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ─── Automation Dashboard ─────────────────────────────────────────────────

  async getAutomationDashboard(tenantId: string) {
    const [totalRules, activeRules, activeHolds, pendingReplenishments, holdsByType] = await Promise.all([
      prisma.binReplenishmentRule.count({ where: { tenantId } }),
      prisma.binReplenishmentRule.count({ where: { tenantId, isActive: true } }),
      prisma.inventoryHold.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.binReplenishmentRule.count({
        where: { tenantId, isActive: true, lastTriggeredAt: { not: null } },
      }),
      prisma.inventoryHold.groupBy({
        by: ['holdType'],
        where: { tenantId, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

    return {
      totalRules,
      activeRules,
      activeHolds,
      pendingReplenishments,
      holdsByType: holdsByType.reduce(
        (acc, r) => ({ ...acc, [r.holdType]: r._count._all }),
        {} as Record<string, number>,
      ),
    };
  }
}
