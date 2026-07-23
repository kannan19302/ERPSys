import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryWavePlanningService {
  async getWavePlans(tenantId: string, params?: { status?: string; warehouseId?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.warehouseId) where.warehouseId = params.warehouseId;
    const data = await prisma.wavePlan.findMany({ where, include: { _count: { select: { tasks: true } } }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.wavePlan.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getWavePlanById(tenantId: string, id: string) {
    const plan = await prisma.wavePlan.findFirst({ where: { id, tenantId }, include: { tasks: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] } } });
    if (!plan) throw new NotFoundException('Wave plan not found');
    return plan;
  }

  async createWavePlan(tenantId: string, dto: any, userId?: string) {
    const planNumber = `WP-${Date.now()}`;
    return prisma.$transaction(async (tx) => {
      const totalLines = dto.tasks?.length || 0;
      const totalItems = dto.tasks?.reduce((s: number, t: any) => s + t.quantity, 0) || 0;
      const plan = await tx.wavePlan.create({
        data: {
          tenantId, planNumber, warehouseId: dto.warehouseId || null, planType: dto.planType || 'PICK',
          optimizationStrategy: dto.optimizationStrategy || 'BATCH', sortMethod: dto.sortMethod || 'ORDER',
          totalOrders: 0, totalLines, totalItems: new Prisma.Decimal(totalItems), notes: dto.notes || null, createdBy: userId || null,
        },
      });
      if (dto.tasks?.length) {
        await tx.wavePlanTask.createMany({
          data: dto.tasks.map((t: any) => ({ tenantId, wavePlanId: plan.id, taskType: t.taskType, sourceLocation: t.sourceLocation || null, destLocation: t.destLocation || null, productId: t.productId || null, productSku: t.productSku || null, productName: t.productName || null, quantity: new Prisma.Decimal(t.quantity), uom: t.uom || 'EA', priority: t.priority || 5, orderRef: t.orderRef || null })).sort((a: any, b: any) => (a.priority || 5) - (b.priority || 5)),
        });
      }
      return tx.wavePlan.findUnique({ where: { id: plan.id }, include: { tasks: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] } } });
    });
  }

  async releaseWavePlan(tenantId: string, id: string) {
    const plan = await prisma.wavePlan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException('Wave plan not found');
    return prisma.wavePlan.update({ where: { id }, data: { status: 'RELEASED', startTime: new Date() } });
  }

  async assignTask(tenantId: string, taskId: string, assignee: string) {
    const task = await prisma.wavePlanTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    return prisma.wavePlanTask.update({ where: { id: taskId }, data: { assignee, status: 'ASSIGNED' } });
  }

  async completeTask(tenantId: string, taskId: string, pickedQty?: number) {
    const task = await prisma.wavePlanTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    return prisma.wavePlanTask.update({ where: { id: taskId }, data: { status: 'COMPLETED', completedAt: new Date(), pickedQty: pickedQty ? new Prisma.Decimal(pickedQty) : task.quantity } });
  }

  async completeWavePlan(tenantId: string, id: string) {
    const plan = await prisma.wavePlan.findFirst({ where: { id, tenantId }, include: { tasks: true } });
    if (!plan) throw new NotFoundException('Wave plan not found');
    const totalDuration = plan.startTime ? Math.round((Date.now() - plan.startTime.getTime()) / 60000) : 0;
    return prisma.wavePlan.update({ where: { id }, data: { status: 'COMPLETED', endTime: new Date(), actualDurationMin: totalDuration, totalPickers: [...new Set(plan.tasks.filter(t => t.assignee).map(t => t.assignee))].length } });
  }

  async getWarehouseKpis(tenantId: string, warehouseId?: string, sinceDays?: number) {
    const where: any = { tenantId };
    if (warehouseId) where.warehouseId = warehouseId;
    if (sinceDays) where.kpiDate = { gte: new Date(Date.now() - sinceDays * 86400000) };
    return prisma.warehouseKpi.findMany({ where, orderBy: { kpiDate: 'desc' } });
  }

  async recordWarehouseKpi(tenantId: string, dto: any) {
    return prisma.warehouseKpi.create({ data: { tenantId, warehouseId: dto.warehouseId || null, kpiDate: dto.kpiDate ? new Date(dto.kpiDate) : new Date(), linesPicked: dto.linesPicked || null, linesPutaway: dto.linesPutaway || null, ordersShipped: dto.ordersShipped || null, ordersReceived: dto.ordersReceived || null, picksPerHour: dto.picksPerHour ? new Prisma.Decimal(dto.picksPerHour) : null, putawayPerHour: dto.putawayPerHour ? new Prisma.Decimal(dto.putawayPerHour) : null, orderAccuracyPct: dto.orderAccuracyPct ? new Prisma.Decimal(dto.orderAccuracyPct) : null, totalLaborHours: dto.totalLaborHours ? new Prisma.Decimal(dto.totalLaborHours) : null, activeWorkers: dto.activeWorkers || null, laborCostPerOrder: dto.laborCostPerOrder ? new Prisma.Decimal(dto.laborCostPerOrder) : null } });
  }

  async getSafetyStockOptimizations(tenantId: string, productId?: string) {
    const where: any = { tenantId, isActive: true };
    if (productId) where.productId = productId;
    return prisma.safetyStockOptimization.findMany({ where, orderBy: { potentialSavings: 'desc' } });
  }

  async optimizeSafetyStock(tenantId: string, dto: any) {
    const product = await prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    const salesItems = await prisma.salesOrderItem.findMany({ where: { productId: dto.productId, tenantId, salesOrder: { status: { in: ['CONFIRMED', 'DELIVERED'] } } } });
    const qtyArr = salesItems.map(i => Number(i.quantity));
    const mean = qtyArr.length ? qtyArr.reduce((s, v) => s + v, 0) / qtyArr.length : 10;
    const stdDev = qtyArr.length > 1 ? Math.sqrt(qtyArr.reduce((s, v) => s + (v - mean) ** 2, 0) / qtyArr.length) : mean * 0.3;
    const serviceLevel = dto.serviceLevel || 0.95;
    const zScore = serviceLevel >= 0.99 ? 2.33 : serviceLevel >= 0.98 ? 2.05 : serviceLevel >= 0.95 ? 1.65 : serviceLevel >= 0.90 ? 1.28 : 0.84;
    const leadTimeDays = dto.leadTimeDays || (product as any).leadTimeDays || 7;
    const leadTimeVariance = Math.max(1, leadTimeDays * 0.2);
    const safetyStock = Math.round(zScore * Math.sqrt((leadTimeDays * stdDev ** 2) + (mean ** 2 * leadTimeVariance)) || mean * 0.5);
    const reorderPoint = Math.round(mean * leadTimeDays + safetyStock);
    const eoq = Math.round(Math.sqrt((2 * mean * 12 * (dto.stockoutCost || 50)) / (dto.holdingCostPct || 0.25)));
    const holdingCostPct = dto.holdingCostPct || 0.25;
    const unitCost = Number((product as any).unitCost || 10);
    const currentSafetyStock = dto.currentSafetyStock || safetyStock;
    const currentTotalCost = (currentSafetyStock * unitCost * holdingCostPct) + ((mean * 12 / eoq) * (dto.stockoutCost || 50));
    const optimizedTotalCost = (safetyStock * unitCost * holdingCostPct) + ((mean * 12 / eoq) * (dto.stockoutCost || 50));
    return prisma.safetyStockOptimization.upsert({
      where: { tenantId_productId_warehouseId: { tenantId, productId: dto.productId, warehouseId: dto.warehouseId || '__default__' } } as any,
      create: {
        tenantId, productId: dto.productId, productSku: product.sku, productName: product.name, warehouseId: dto.warehouseId || null,
        currentSafetyStock: currentSafetyStock, recommendedSafetyStock: safetyStock, leadTimeDays, leadTimeVariance,
        demandMean: Math.round(mean), demandStdDev: Math.round(stdDev), serviceLevel, zScore, reorderPoint,
        economicOrderQty: eoq, holdingCostPct, stockoutCost: dto.stockoutCost || 50,
        totalCostCurrent: new Prisma.Decimal(currentTotalCost), totalCostOptimized: new Prisma.Decimal(optimizedTotalCost),
        potentialSavings: new Prisma.Decimal(currentTotalCost - optimizedTotalCost), lastCalculated: new Date(),
      },
      update: {
        currentSafetyStock, recommendedSafetyStock: safetyStock, leadTimeDays, demandMean: Math.round(mean),
        demandStdDev: Math.round(stdDev), serviceLevel, zScore, reorderPoint, economicOrderQty: eoq,
        totalCostCurrent: new Prisma.Decimal(currentTotalCost), totalCostOptimized: new Prisma.Decimal(optimizedTotalCost),
        potentialSavings: new Prisma.Decimal(currentTotalCost - optimizedTotalCost), lastCalculated: new Date(),
      },
    });
  }

  async getGlobalInventory(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const views = await prisma.globalInventoryView.findMany({ where, include: { details: true }, orderBy: { lastUpdated: 'desc' } });
    if (!views.length) {
      const products = await prisma.product.findMany({ where: { tenantId, isActive: true }, take: 50 });
      for (const product of products) {
        const items = await prisma.inventoryItem.findMany({ where: { productId: product.id, tenantId }, include: { warehouse: true } });
        const totalOnHand = items.reduce((s, i) => s + Number(i.quantity), 0);
        await prisma.globalInventoryView.upsert({
          where: { tenantId_productId: { tenantId, productId: product.id } } as any,
          create: { tenantId, productId: product.id, productSku: product.sku, productName: product.name, totalOnHand, totalAvailable: totalOnHand, warehouseCount: [...new Set(items.map(i => i.warehouseId))].length, totalReserved: 0 },
          update: { totalOnHand, totalAvailable: totalOnHand, warehouseCount: [...new Set(items.map(i => i.warehouseId))].length },
        });
      }
      return prisma.globalInventoryView.findMany({ where: { tenantId }, include: { details: true }, orderBy: { totalOnHand: 'desc' } });
    }
    return views;
  }
}
