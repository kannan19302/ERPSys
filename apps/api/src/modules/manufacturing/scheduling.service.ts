import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SchedulingService {

  async scheduleWorkOrders(
    tenantId: string,
    options: { algorithm?: 'FORWARD' | 'BACKWARD'; startDate?: string } = {},
  ) {
    const algorithm = options.algorithm || 'FORWARD';
    const baseDate = options.startDate ? new Date(options.startDate) : new Date();

    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId, status: { in: ['DRAFT', 'PLANNED'] } },
      include: { operations: true, bom: true },
      orderBy: { createdAt: 'desc' },
    });

    const workstations = await prisma.workstation.findMany({
      where: { tenantId },
    });

    const workstationAvailability: Record<string, Date> = {};
    for (const ws of workstations) {
      workstationAvailability[ws.id] = new Date(baseDate);
    }

    const schedule: Array<{ workOrderId: string; workstationId: string; startTime: Date; endTime: Date; operationName: string }> = [];
    const unscheduled: string[] = [];

    for (const wo of workOrders) {
      const operations = (wo.operations || []).sort((a, b) => a.sequence - b.sequence);

      if (operations.length === 0) {
        unscheduled.push(wo.id);
        continue;
      }

      let currentTime = new Date(baseDate);

      for (const op of operations) {
        const wsCode = op.workstationCode;
        const ws = workstations.find((w) => w.code === wsCode) || workstations[0];
        if (!ws) { unscheduled.push(wo.id); break; }

        const wsAvail = workstationAvailability[ws.id] || baseDate;
        const startTime = new Date(Math.max(currentTime.getTime(), new Date(wsAvail).getTime()));
        const durationMinutes = op.durationMinutes || 60;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        schedule.push({
          workOrderId: wo.id,
          workstationId: ws.id,
          startTime,
          endTime,
          operationName: op.name,
        });

        workstationAvailability[ws.id] = endTime;
        currentTime = endTime;
      }

      await prisma.workOrder.update({
        where: { id: wo.id },
        data: { status: 'PLANNED' },
      });
    }

    return {
      algorithm,
      scheduledOrders: workOrders.length - unscheduled.length,
      unscheduledOrders: unscheduled.length,
      totalOperations: schedule.length,
      schedule,
      unscheduled,
    };
  }

  async calculateBomCost(tenantId: string, bomId: string) {
    const bom = await prisma.bOM.findFirst({
      where: { id: bomId, tenantId },
      include: { items: true },
    });
    if (!bom) throw new NotFoundException('BOM not found');

    let materialCost = 0;
    const itemCosts: Array<{ productId: string; quantity: number; unitCost: number; totalCost: number }> = [];

    for (const item of bom.items) {
      const qty = Number(item.quantity);
      const product = await prisma.product.findFirst({ where: { id: item.productId, tenantId } });
      const unitCost = Number(product?.sellPrice || product?.costPrice || 0);
      const totalCost = qty * unitCost;
      materialCost += totalCost;

      itemCosts.push({
        productId: item.productId,
        quantity: qty,
        unitCost,
        totalCost: Math.round(totalCost * 100) / 100,
      });
    }

    const laborCost = 0; // calculated from work order operations when available
    const overheadRate = 0.15;
    const overheadCost = materialCost * overheadRate;
    const totalCost = materialCost + laborCost + overheadCost;

    return {
      bomId,
      bomName: bom.name,
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      itemCosts,
    };
  }
}
