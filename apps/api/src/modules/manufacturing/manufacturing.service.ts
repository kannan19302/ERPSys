import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ManufacturingService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  async getBOMs(tenantId: string) {
    return prisma.bOM.findMany({
      where: { tenantId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBOMById(tenantId: string, id: string) {
    const bom = await prisma.bOM.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });
    if (!bom) throw new NotFoundException('BOM not found');
    return bom;
  }

  async createBOM(
    tenantId: string,
    dto: { productId: string; name: string; code: string; items: Array<{ productId: string; quantity: number }> }
  ) {
    const existing = await prisma.bOM.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) throw new BadRequestException(`BOM code ${dto.code} already exists.`);

    return prisma.$transaction(async (tx) => {
      const bom = await tx.bOM.create({
        data: {
          tenantId,
          productId: dto.productId,
          name: dto.name,
          code: dto.code,
        },
      });

      for (const item of dto.items) {
        await tx.bOMItem.create({
          data: {
            tenantId,
            bomId: bom.id,
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
          },
        });
      }

      return bom;
    });
  }

  async getWorkOrders(tenantId: string) {
    return prisma.workOrder.findMany({
      where: { tenantId },
      include: {
        bom: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWorkOrder(
    tenantId: string,
    dto: { bomId: string; workOrderNumber: string; quantity: number; startDate?: string }
  ) {
    const bom = await prisma.bOM.findFirst({ where: { id: dto.bomId, tenantId } });
    if (!bom) throw new NotFoundException('BOM not found');

    const existing = await prisma.workOrder.findFirst({
      where: { tenantId, workOrderNumber: dto.workOrderNumber },
    });
    if (existing) throw new BadRequestException(`Work order ${dto.workOrderNumber} already exists.`);

    return prisma.workOrder.create({
      data: {
        tenantId,
        bomId: dto.bomId,
        workOrderNumber: dto.workOrderNumber,
        quantity: new Prisma.Decimal(dto.quantity),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        status: 'DRAFT',
      },
    });
  }

  async updateWorkOrderStatus(tenantId: string, id: string, status: string) {
    const wo = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        bom: {
          include: {
            items: true,
          },
        },
      },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status,
        endDate: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    if (status === 'COMPLETED' && this.eventEmitter) {
      // Find a warehouse in organization to perform inventory transactions
      const warehouse = await prisma.warehouse.findFirst({ where: { tenantId } });
      const warehouseId = warehouse ? warehouse.id : null;

      this.eventEmitter.emit('manufacturing.workorder.completed', {
        tenantId,
        workOrderId: id,
        productId: wo.bom.productId,
        quantity: Number(wo.quantity),
        warehouseId,
        items: wo.bom.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity) * Number(wo.quantity), // Total quantity consumed
        })),
      });
    }

    return updated;
  }
}
