import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { PickTaskStatus } from '@prisma/client';

@Injectable()
export class PickWavesService {
  // ── Wave Lifecycle ────────────────────────────────────────────────────────

  async createWave(
    tenantId: string,
    userId: string,
    data: { warehouseId: string; orgId?: string; notes?: string },
  ) {
    const count = await prisma.pickWave.count({ where: { tenantId } });
    const waveNumber = `WV-${String(count + 1).padStart(6, '0')}`;

    return prisma.pickWave.create({
      data: {
        tenantId,
        orgId: data.orgId ?? tenantId,
        waveNumber,
        warehouseId: data.warehouseId,
        status: 'OPEN',
        notes: data.notes,
        createdBy: userId,
      },
    });
  }

  async addOrderToWave(tenantId: string, waveId: string, salesOrderId: string) {
    const wave = await this._getWave(tenantId, waveId);
    if (wave.status !== 'OPEN') throw new BadRequestException('Can only add orders to OPEN waves');

    const existing = await prisma.pickWaveOrder.findUnique({
      where: { tenantId_pickWaveId_salesOrderId: { tenantId, pickWaveId: waveId, salesOrderId } },
    });
    if (existing) throw new BadRequestException('Order already in this wave');

    return prisma.pickWaveOrder.create({ data: { tenantId, pickWaveId: waveId, salesOrderId } });
  }

  async addItemToWave(
    tenantId: string,
    waveId: string,
    data: { productId: string; quantity: number; binLocationId?: string },
  ) {
    await this._getWave(tenantId, waveId);
    if (data.quantity <= 0) throw new BadRequestException('Quantity must be positive');

    return prisma.pickWaveItem.create({
      data: {
        tenantId,
        pickWaveId: waveId,
        productId: data.productId,
        quantity: data.quantity,
        pickedQty: 0,
        status: 'PENDING',
        binLocationId: data.binLocationId,
      },
    });
  }

  async startWave(tenantId: string, waveId: string) {
    const wave = await this._getWave(tenantId, waveId);
    if (wave.status !== 'OPEN') throw new BadRequestException('Only OPEN waves can be started');

    const itemCount = await prisma.pickWaveItem.count({ where: { tenantId, pickWaveId: waveId } });
    if (itemCount === 0) throw new BadRequestException('Wave has no items to pick');

    return prisma.pickWave.update({ where: { id: waveId }, data: { status: 'PICKING' } });
  }

  async confirmPick(
    tenantId: string,
    userId: string,
    waveId: string,
    itemId: string,
    pickedQty: number,
  ) {
    const wave = await this._getWave(tenantId, waveId);
    if (wave.status !== 'PICKING') throw new BadRequestException('Wave must be in PICKING status');
    if (pickedQty < 0) throw new BadRequestException('Picked quantity cannot be negative');

    const item = await prisma.pickWaveItem.findFirst({ where: { id: itemId, tenantId, pickWaveId: waveId } });
    if (!item) throw new NotFoundException('Pick item not found in wave');

    const expectedQty = Number(item.quantity);
    const newStatus = pickedQty >= expectedQty ? 'PICKED' : pickedQty > 0 ? 'IN_PROGRESS' : 'SHORT';

    await prisma.pickWaveItem.update({
      where: { id: itemId },
      data: { pickedQty, status: newStatus },
    });

    // Complete the task if one exists for this item
    await prisma.pickTask.updateMany({
      where: { tenantId, pickItemId: itemId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      data: { status: PickTaskStatus.COMPLETED, completedAt: new Date() },
    });

    // Auto-complete wave if all items resolved
    await this._checkWaveCompletion(tenantId, waveId, userId);

    return prisma.pickWaveItem.findFirst({ where: { id: itemId, tenantId } });
  }

  async packWave(tenantId: string, waveId: string) {
    const wave = await this._getWave(tenantId, waveId);
    if (wave.status !== 'PICKING') throw new BadRequestException('Wave must be in PICKING status to pack');

    const pendingItems = await prisma.pickWaveItem.count({
      where: { tenantId, pickWaveId: waveId, status: 'PENDING' },
    });
    if (pendingItems > 0) throw new BadRequestException(`${pendingItems} items still pending pick`);

    return prisma.pickWave.update({ where: { id: waveId }, data: { status: 'PACKED' } });
  }

  async completeWave(tenantId: string, waveId: string) {
    const wave = await this._getWave(tenantId, waveId);
    if (!['PICKING', 'PACKED'].includes(wave.status))
      throw new BadRequestException('Wave must be in PICKING or PACKED status to complete');

    return prisma.pickWave.update({
      where: { id: waveId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async cancelWave(tenantId: string, waveId: string) {
    const wave = await this._getWave(tenantId, waveId);
    if (wave.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed wave');
    if (wave.status === 'CANCELLED') throw new BadRequestException('Wave already cancelled');

    await prisma.pickTask.updateMany({
      where: { tenantId, pickWaveId: waveId, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      data: { status: PickTaskStatus.CANCELLED },
    });

    await prisma.pickWaveItem.updateMany({
      where: { tenantId, pickWaveId: waveId, status: { not: 'PICKED' } },
      data: { status: 'CANCELLED' },
    });

    return prisma.pickWave.update({ where: { id: waveId }, data: { status: 'CANCELLED' } });
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  async assignTask(
    tenantId: string,
    data: {
      pickWaveId: string;
      pickItemId: string;
      assignedTo: string;
      binLocation?: string;
      instructionNote?: string;
    },
  ) {
    await this._getWave(tenantId, data.pickWaveId);
    return prisma.pickTask.create({
      data: {
        tenantId,
        pickWaveId: data.pickWaveId,
        pickItemId: data.pickItemId,
        assignedTo: data.assignedTo,
        binLocation: data.binLocation,
        instructionNote: data.instructionNote,
      },
    });
  }

  async startTask(tenantId: string, taskId: string) {
    const task = await prisma.pickTask.findFirst({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== PickTaskStatus.ASSIGNED) throw new BadRequestException('Task must be ASSIGNED to start');
    return prisma.pickTask.update({
      where: { id: taskId },
      data: { status: PickTaskStatus.IN_PROGRESS, startedAt: new Date() },
    });
  }

  async getTasksForPicker(tenantId: string, assignedTo: string, waveId?: string) {
    return prisma.pickTask.findMany({
      where: {
        tenantId,
        assignedTo,
        ...(waveId ? { pickWaveId: waveId } : {}),
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  async listWaves(tenantId: string, status?: string, warehouseId?: string) {
    return prisma.pickWave.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        orders: true,
        items: true,
        _count: { select: { items: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWave(tenantId: string, waveId: string) {
    return prisma.pickWave.findFirst({
      where: { id: waveId, tenantId },
      include: {
        orders: true,
        items: true,
      },
    });
  }

  async getDashboard(tenantId: string) {
    const [byStatus, openWaves, recentCompleted] = await Promise.all([
      prisma.pickWave.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.pickWave.findMany({
        where: { tenantId, status: { in: ['OPEN', 'PICKING'] } },
        include: { _count: { select: { items: true, orders: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.pickWave.findMany({
        where: { tenantId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
    ]);

    const itemStats = await prisma.pickWaveItem.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    });

    return { byStatus, openWaves, recentCompleted, itemStats };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async _getWave(tenantId: string, waveId: string) {
    const wave = await prisma.pickWave.findFirst({ where: { id: waveId, tenantId } });
    if (!wave) throw new NotFoundException('Pick wave not found');
    return wave;
  }

  private async _checkWaveCompletion(tenantId: string, waveId: string, _userId: string) {
    const pendingCount = await prisma.pickWaveItem.count({
      where: { tenantId, pickWaveId: waveId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    if (pendingCount === 0) {
      await prisma.pickWave.update({
        where: { id: waveId },
        data: { status: 'PACKED', completedAt: new Date() },
      });
    }
  }
}
