import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContainerPalletService {
  // ── Pallet Types ──────────────────────────────────────────────

  async listPalletTypes(tenantId: string) {
    return prisma.palletType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createPalletType(tenantId: string, data: {
    code: string; name: string; category: string;
    lengthMm?: number; widthMm?: number; heightMm?: number;
    maxWeightKg?: number; description?: string;
  }) {
    return prisma.palletType.create({
      data: { tenantId, ...data } as any,
    });
  }

  async updatePalletType(tenantId: string, id: string, data: Record<string, unknown>) {
    await this.requirePalletType(tenantId, id);
    return prisma.palletType.update({ where: { id }, data });
  }

  async deletePalletType(tenantId: string, id: string) {
    await this.requirePalletType(tenantId, id);
    await prisma.palletType.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Container Types ───────────────────────────────────────────

  async listContainerTypes(tenantId: string) {
    return prisma.containerType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createContainerType(tenantId: string, data: {
    code: string; name: string; category: string;
    isoCode?: string; lengthMm?: number; widthMm?: number; heightMm?: number;
    maxPayloadKg?: number; cubicMeters?: number; description?: string;
  }) {
    return prisma.containerType.create({
      data: { tenantId, ...data } as any,
    });
  }

  async updateContainerType(tenantId: string, id: string, data: Record<string, unknown>) {
    await this.requireContainerType(tenantId, id);
    return prisma.containerType.update({ where: { id }, data });
  }

  async deleteContainerType(tenantId: string, id: string) {
    await this.requireContainerType(tenantId, id);
    await prisma.containerType.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Load Plans ────────────────────────────────────────────────

  async listLoadPlans(tenantId: string, status?: string) {
    return prisma.loadPlan.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: {
        pallets: { select: { id: true, palletTypeId: true, positionX: true, positionY: true, positionZ: true } },
        items: { select: { id: true, productId: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getLoadPlan(tenantId: string, id: string) {
    const plan = await prisma.loadPlan.findFirst({
      where: { tenantId, id },
      include: {
        pallets: true,
        items: true,
      },
    });
    if (!plan) throw new NotFoundException(`Load plan ${id} not found`);
    return plan;
  }

  async createLoadPlan(tenantId: string, createdBy: string, data: {
    planNumber: string; containerTypeId: string; shipmentRef?: string;
    originWarehouseId: string; destinationRef?: string; plannedLoadDate?: string;
    notes?: string;
  }) {
    return prisma.loadPlan.create({
      data: {
        tenantId,
        createdBy,
        status: 'DRAFT',
        utilizationPct: new Prisma.Decimal(0),
        totalWeightKg: new Prisma.Decimal(0),
        totalVolumeM3: new Prisma.Decimal(0),
        ...data,
        plannedLoadDate: data.plannedLoadDate ? new Date(data.plannedLoadDate) : null,
      } as any,
    });
  }

  async transitionLoadPlan(tenantId: string, id: string, action: string, _userId: string) {
    const plan = await this.requireLoadPlan(tenantId, id);
    const transitions: Record<string, { from: string[]; to: string }> = {
      optimize:   { from: ['DRAFT'], to: 'OPTIMIZING' },
      ready:      { from: ['OPTIMIZING'], to: 'READY' },
      startLoad:  { from: ['READY'], to: 'IN_LOADING' },
      completeLoad: { from: ['IN_LOADING'], to: 'LOADED' },
      ship:       { from: ['LOADED'], to: 'SHIPPED' },
      cancel:     { from: ['DRAFT','OPTIMIZING','READY','IN_LOADING'], to: 'CANCELLED' },
    };
    const t = transitions[action];
    if (!t) throw new BadRequestException(`Unknown action: ${action}`);
    if (!t.from.includes(plan.status)) {
      throw new BadRequestException(`Cannot ${action} a plan in status ${plan.status}`);
    }
    return prisma.loadPlan.update({
      where: { id },
      data: {
        status: t.to as any,
        ...(t.to === 'SHIPPED' ? { shippedAt: new Date() } : {}),
      },
    });
  }

  async addPalletToLoadPlan(tenantId: string, planId: string, data: {
    palletTypeId: string; palletRef?: string;
    positionX?: number; positionY?: number; positionZ?: number;
    grossWeightKg?: number;
  }) {
    await this.requireLoadPlan(tenantId, planId);
    const pallet = await prisma.loadPlanPallet.create({
      data: { tenantId, loadPlanId: planId, ...data } as any,
    });
    await this.recalcLoadPlanStats(planId);
    return pallet;
  }

  async removePalletFromLoadPlan(tenantId: string, planId: string, palletId: string) {
    await this.requireLoadPlan(tenantId, planId);
    await prisma.loadPlanPallet.deleteMany({ where: { id: palletId, loadPlanId: planId } });
    await this.recalcLoadPlanStats(planId);
    return { removed: true };
  }

  async addItemToLoadPlan(tenantId: string, planId: string, data: {
    productId: string; quantity: number; uom: string;
    lotNumber?: string; serialNumber?: string; palletId?: string;
  }) {
    await this.requireLoadPlan(tenantId, planId);
    const { quantity, ...rest } = data;
    const item = await prisma.loadPlanItem.create({
      data: { tenantId, loadPlanId: planId, quantity: new Prisma.Decimal(quantity), ...rest } as any,
    });
    await this.recalcLoadPlanStats(planId);
    return item;
  }

  async getLoadPlanUtilization(tenantId: string, id: string) {
    const plan = await this.getLoadPlan(tenantId, id);
    const containerType = await prisma.containerType.findFirst({
      where: { tenantId, id: (plan as any).containerTypeId },
    });
    const maxPayload = containerType ? Number((containerType as any).maxPayloadKg ?? 0) : 0;
    const maxVolume = containerType ? Number((containerType as any).cubicMeters ?? 0) : 0;
    const weightPct = maxPayload > 0 ? (Number(plan.totalWeightKg) / maxPayload) * 100 : 0;
    const volumePct = maxVolume > 0 ? (Number(plan.totalVolumeM3) / maxVolume) * 100 : 0;
    return {
      planId: id,
      planNumber: plan.planNumber,
      containerType: containerType?.name ?? 'Unknown',
      totalWeightKg: plan.totalWeightKg,
      maxPayloadKg: maxPayload,
      weightUtilizationPct: weightPct.toFixed(1),
      totalVolumeM3: plan.totalVolumeM3,
      maxVolumeCbm: maxVolume,
      volumeUtilizationPct: volumePct.toFixed(1),
      palletCount: plan.pallets.length,
      itemCount: plan.items.length,
    };
  }

  // ── Packing Plans ─────────────────────────────────────────────

  async listPackingPlans(tenantId: string, status?: string) {
    return prisma.packingPlan.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: {
        cartons: { select: { id: true, cartonNumber: true, sealed: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getPackingPlan(tenantId: string, id: string) {
    const plan = await prisma.packingPlan.findFirst({
      where: { tenantId, id },
      include: {
        cartons: { include: { items: true } },
      },
    });
    if (!plan) throw new NotFoundException(`Packing plan ${id} not found`);
    return plan;
  }

  async createPackingPlan(tenantId: string, createdBy: string, data: {
    planNumber: string; salesOrderRef?: string; warehouseId: string;
    plannedDate?: string; instructions?: string;
  }) {
    return prisma.packingPlan.create({
      data: {
        tenantId,
        createdBy,
        status: 'DRAFT',
        totalCartons: 0,
        totalWeightKg: new Prisma.Decimal(0),
        ...data,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
      } as any,
    });
  }

  async transitionPackingPlan(tenantId: string, id: string, action: string) {
    const plan = await this.requirePackingPlan(tenantId, id);
    const transitions: Record<string, { from: string[]; to: string }> = {
      confirm:   { from: ['DRAFT'], to: 'CONFIRMED' },
      startPack: { from: ['CONFIRMED'], to: 'PACKING' },
      complete:  { from: ['PACKING'], to: 'COMPLETED' },
      cancel:    { from: ['DRAFT','CONFIRMED','PACKING'], to: 'CANCELLED' },
    };
    const t = transitions[action];
    if (!t) throw new BadRequestException(`Unknown action: ${action}`);
    if (!t.from.includes(plan.status)) {
      throw new BadRequestException(`Cannot ${action} a plan in status ${plan.status}`);
    }
    return prisma.packingPlan.update({
      where: { id },
      data: {
        status: t.to as any,
        ...(t.to === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async addCartonToPackingPlan(tenantId: string, planId: string, data: {
    cartonNumber: string; lengthMm?: number; widthMm?: number; heightMm?: number;
    grossWeightKg?: number;
  }) {
    await this.requirePackingPlan(tenantId, planId);
    const carton = await prisma.loadCarton.create({
      data: { tenantId, packingPlanId: planId, sealed: false, labelPrinted: false, ...data } as any,
    });
    await this.recalcPackingPlanStats(planId);
    return carton;
  }

  async sealCarton(tenantId: string, planId: string, cartonId: string) {
    const carton = await prisma.loadCarton.findFirst({
      where: { id: cartonId, packingPlanId: planId, tenantId },
    });
    if (!carton) throw new NotFoundException(`Carton ${cartonId} not found`);
    return prisma.loadCarton.update({ where: { id: cartonId }, data: { sealed: true } as any });
  }

  async printCartonLabel(tenantId: string, planId: string, cartonId: string) {
    const carton = await prisma.loadCarton.findFirst({
      where: { id: cartonId, packingPlanId: planId, tenantId },
    });
    if (!carton) throw new NotFoundException(`Carton ${cartonId} not found`);
    return prisma.loadCarton.update({ where: { id: cartonId }, data: { labelPrinted: true } as any });
  }

  async addItemToCarton(tenantId: string, planId: string, cartonId: string, data: {
    productId: string; quantity: number; uom: string;
  }) {
    const carton = await prisma.loadCarton.findFirst({
      where: { id: cartonId, packingPlanId: planId, tenantId },
    });
    if (!carton) throw new NotFoundException(`Carton ${cartonId} not found`);
    if ((carton as any).sealed) throw new BadRequestException('Carton is already sealed');
    const { quantity, ...rest } = data;
    return prisma.loadCartonItem.create({
      data: { tenantId, cartonId, quantity: new Prisma.Decimal(quantity), ...rest } as any,
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [palletTypes, containerTypes, loadStats, packingStats] = await Promise.all([
      prisma.palletType.count({ where: { tenantId } }),
      prisma.containerType.count({ where: { tenantId } }),
      prisma.loadPlan.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.packingPlan.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
    ]);

    const loadByStatus = Object.fromEntries(loadStats.map(r => [r.status, r._count]));
    const packByStatus = Object.fromEntries(packingStats.map(r => [r.status, r._count]));

    return {
      palletTypes,
      containerTypes,
      loadPlans: {
        draft: loadByStatus['DRAFT'] ?? 0,
        inProgress: (loadByStatus['OPTIMIZING'] ?? 0) + (loadByStatus['READY'] ?? 0) + (loadByStatus['IN_LOADING'] ?? 0),
        loaded: loadByStatus['LOADED'] ?? 0,
        shipped: loadByStatus['SHIPPED'] ?? 0,
      },
      packingPlans: {
        draft: packByStatus['DRAFT'] ?? 0,
        active: (packByStatus['CONFIRMED'] ?? 0) + (packByStatus['PACKING'] ?? 0),
        completed: packByStatus['COMPLETED'] ?? 0,
      },
    };
  }

  // ── Private helpers ───────────────────────────────────────────

  private async requirePalletType(tenantId: string, id: string) {
    const r = await prisma.palletType.findFirst({ where: { tenantId, id } });
    if (!r) throw new NotFoundException(`PalletType ${id} not found`);
    return r;
  }

  private async requireContainerType(tenantId: string, id: string) {
    const r = await prisma.containerType.findFirst({ where: { tenantId, id } });
    if (!r) throw new NotFoundException(`ContainerType ${id} not found`);
    return r;
  }

  private async requireLoadPlan(tenantId: string, id: string) {
    const r = await prisma.loadPlan.findFirst({ where: { tenantId, id } });
    if (!r) throw new NotFoundException(`LoadPlan ${id} not found`);
    return r;
  }

  private async requirePackingPlan(tenantId: string, id: string) {
    const r = await prisma.packingPlan.findFirst({ where: { tenantId, id } });
    if (!r) throw new NotFoundException(`PackingPlan ${id} not found`);
    return r;
  }

  private async recalcLoadPlanStats(planId: string) {
    const pallets = await prisma.loadPlanPallet.findMany({ where: { loadPlanId: planId } });
    const totalWeightKg = pallets.reduce((s, p) => s + Number((p as any).grossWeightKg ?? 0), 0);
    await prisma.loadPlan.update({
      where: { id: planId },
      data: { totalWeightKg: new Prisma.Decimal(totalWeightKg) } as any,
    });
  }

  private async recalcPackingPlanStats(planId: string) {
    const cartons = await prisma.loadCarton.findMany({ where: { packingPlanId: planId } });
    const totalWeightKg = cartons.reduce((s, c) => s + Number((c as any).grossWeightKg ?? 0), 0);
    await prisma.packingPlan.update({
      where: { id: planId },
      data: { totalCartons: cartons.length, totalWeightKg: new Prisma.Decimal(totalWeightKg) } as any,
    });
  }
}
