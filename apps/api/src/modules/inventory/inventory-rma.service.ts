import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryRmaService {
  async getRmas(tenantId: string, params?: { status?: string; source?: string; page?: number; limit?: number }) {
    const where: any = { tenantId, isActive: true };
    if (params?.status) where.status = params.status;
    if (params?.source) where.source = params.source;
    const data = await prisma.returnMerchandiseAuthorization.findMany({ where, include: { lines: true, inspection: true }, orderBy: { createdAt: 'desc' }, skip: params?.page ? (params.page - 1) * (params.limit || 20) : 0, take: params?.limit || 20 });
    const total = await prisma.returnMerchandiseAuthorization.count({ where });
    return { data, total, page: params?.page || 1, limit: params?.limit || 20 };
  }

  async getRmaById(tenantId: string, id: string) {
    const rma = await prisma.returnMerchandiseAuthorization.findFirst({ where: { id, tenantId }, include: { lines: true, inspection: true } });
    if (!rma) throw new NotFoundException('RMA not found');
    return rma;
  }

  async createRma(tenantId: string, dto: any, userId?: string) {
    return prisma.$transaction(async (tx) => {
      const totalQty = dto.lines?.reduce((s: number, l: any) => s + l.expectedQty, 0) || 0;
      const totalValue = dto.lines?.reduce((s: number, l: any) => s + ((l.unitValue || 0) * l.expectedQty), 0) || 0;
      const rma = await tx.returnMerchandiseAuthorization.create({
        data: {
          tenantId, rmaNumber: dto.rmaNumber, source: dto.source, customerId: dto.customerId || null,
          customerName: dto.customerName || null, vendorId: dto.vendorId || null, vendorName: dto.vendorName || null,
          salesOrderId: dto.salesOrderId || null, salesOrderNumber: dto.salesOrderNumber || null,
          purchaseOrderId: dto.purchaseOrderId || null, returnReason: dto.returnReason || null,
          returnType: dto.returnType || null, priority: dto.priority || 'MEDIUM', warehouseId: dto.warehouseId || null,
          totalQty: new Prisma.Decimal(totalQty), totalValue: new Prisma.Decimal(totalValue), notes: dto.notes || null, createdBy: userId || null,
        },
      });
      if (dto.lines?.length) {
        await tx.rMALine.createMany({
          data: dto.lines.map((l: any) => ({ tenantId, rmaId: rma.id, productId: l.productId || null, productSku: l.productSku || null, productName: l.productName || null, expectedQty: new Prisma.Decimal(l.expectedQty), uom: l.uom || 'EA', lotNumber: l.lotNumber || null, serialNumbers: l.serialNumbers || null, unitValue: l.unitValue ? new Prisma.Decimal(l.unitValue) : null, totalValue: l.unitValue ? new Prisma.Decimal(l.unitValue * l.expectedQty) : null })),
        });
      }
      return tx.returnMerchandiseAuthorization.findUnique({ where: { id: rma.id }, include: { lines: true } });
    });
  }

  async updateRmaStatus(tenantId: string, id: string, status: string) {
    const rma = await prisma.returnMerchandiseAuthorization.findFirst({ where: { id, tenantId } });
    if (!rma) throw new NotFoundException('RMA not found');
    const updateData: any = { status };
    if (status === 'APPROVED') updateData.approvedAt = new Date();
    if (status === 'RECEIVED') updateData.receivedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    return prisma.returnMerchandiseAuthorization.update({ where: { id }, data: updateData });
  }

  async receiveRma(tenantId: string, id: string, dto: any) {
    const rma = await prisma.returnMerchandiseAuthorization.findFirst({ where: { id, tenantId }, include: { lines: true } });
    if (!rma) throw new NotFoundException('RMA not found');
    return prisma.$transaction(async (tx) => {
      for (const line of dto.lines || []) {
        const rmaLine = rma.lines.find(l => l.id === line.lineId);
        if (rmaLine) {
          await tx.rMALine.update({ where: { id: rmaLine.id }, data: { receivedQty: line.receivedQty ? new Prisma.Decimal(line.receivedQty) : undefined, condition: line.condition || undefined } });
        }
      }
      const totalQty = dto.lines?.reduce((s: number, l: any) => s + (l.receivedQty || 0), 0) || 0;
      await tx.returnMerchandiseAuthorization.update({ where: { id }, data: { status: 'RECEIVED', receivedAt: new Date(), totalQty: new Prisma.Decimal(totalQty) } });
      return tx.returnMerchandiseAuthorization.findUnique({ where: { id }, include: { lines: true } });
    });
  }

  async inspectRma(tenantId: string, id: string, dto: any) {
    const rma = await prisma.returnMerchandiseAuthorization.findFirst({ where: { id, tenantId } });
    if (!rma) throw new NotFoundException('RMA not found');
    return prisma.$transaction(async (tx) => {
      const inspection = await tx.rMAInspection.create({
        data: { tenantId, rmaId: id, inspectorId: dto.inspectorId || null, inspectionDate: new Date(), result: dto.result, overallCondition: dto.overallCondition || null, defects: dto.defects || Prisma.JsonNull, notes: dto.notes || null },
      });
      for (const line of dto.lines || []) {
        await tx.rMALine.update({ where: { id: line.lineId }, data: { disposition: line.disposition, acceptedQty: line.acceptedQty ? new Prisma.Decimal(line.acceptedQty) : undefined, rejectedQty: line.rejectedQty ? new Prisma.Decimal(line.rejectedQty) : undefined, condition: line.condition || undefined, inspectedQty: new Prisma.Decimal(line.acceptedQty || 0 + (line.rejectedQty || 0)) } });
      }
      const result = dto.result === 'PASS' ? 'COMPLETED' : 'INSPECTED';
      await tx.returnMerchandiseAuthorization.update({ where: { id }, data: { status: result, inspectedAt: new Date() } });
      return tx.returnMerchandiseAuthorization.findUnique({ where: { id }, include: { lines: true, inspection: true } });
    });
  }

  async getRmaAnalytics(tenantId: string) {
    const [totalRmas, bySource, byStatus, byReason] = await Promise.all([
      prisma.returnMerchandiseAuthorization.count({ where: { tenantId } }),
      prisma.returnMerchandiseAuthorization.groupBy({ by: ['source'], where: { tenantId }, _count: { id: true } }),
      prisma.returnMerchandiseAuthorization.groupBy({ by: ['status'], where: { tenantId }, _count: { id: true } }),
      prisma.returnMerchandiseAuthorization.groupBy({ by: ['returnReason'], where: { tenantId, returnReason: { not: null } }, _count: { id: true } }),
    ]);
    return { totalRmas, bySource: bySource.map(s => ({ source: s.source, count: s._count.id })), byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })), byReason: byReason.map(r => ({ reason: r.returnReason, count: r._count.id })) };
  }
}
