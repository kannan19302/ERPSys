import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class SubcontractingService {
  async list(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [orders, total] = await Promise.all([
      prisma.subcontractingOrder.findMany({
        where, skip, take, orderBy: orderBy as any,
        include: { vendor: { select: { name: true, id: true } }, product: { select: { name: true, sku: true } }, materials: { include: { product: { select: { name: true, sku: true } } } } },
      }),
      prisma.subcontractingOrder.count({ where }),
    ]);
    return paginatedResult(orders, total, params);
  }

  async getById(tenantId: string, id: string) {
    const order = await prisma.subcontractingOrder.findFirst({
      where: { id, tenantId },
      include: { vendor: true, product: true, materials: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Subcontracting order not found');
    return order;
  }

  async create(tenantId: string, dto: { vendorId: string; productId: string; quantity: number; unitCost: number; bomId?: string; deliveryDate?: string; materials?: Array<{ productId: string; requiredQty: number }> }) {
    const vendor = await prisma.vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const product = await prisma.product.findFirst({ where: { id: dto.productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');

    const totalCost = new Prisma.Decimal(dto.unitCost).mul(dto.quantity);

    return prisma.subcontractingOrder.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        totalCost,
        bomId: dto.bomId,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        materials: dto.materials ? {
          create: dto.materials.map(m => ({ tenantId, productId: m.productId, requiredQty: m.requiredQty })),
        } : undefined,
      },
      include: { vendor: true, product: true, materials: { include: { product: true } } },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const order = await prisma.subcontractingOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Subcontracting order not found');

    const validTransitions: Record<string, string[]> = { SENT: ['MATERIALS_SHIPPED', 'CANCELLED'], MATERIALS_SHIPPED: ['RECEIVED', 'CANCELLED'], RECEIVED: ['COMPLETED', 'CANCELLED'] };
    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
    }

    return prisma.subcontractingOrder.update({
      where: { id },
      data: { status },
      include: { vendor: { select: { name: true } }, product: { select: { name: true } } },
    });
  }

  async issueMaterial(tenantId: string, id: string, materialId: string, issuedQty: number) {
    const order = await prisma.subcontractingOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Subcontracting order not found');

    const material = await prisma.subcontractingMaterial.findFirst({ where: { id: materialId, subcontractingOrderId: id } });
    if (!material) throw new NotFoundException('Material line not found');

    return prisma.subcontractingMaterial.update({ where: { id: materialId }, data: { issuedQty: new Prisma.Decimal(issuedQty) } });
  }

  async recordConsumption(tenantId: string, id: string, materialId: string, consumedQty: number) {
    const order = await prisma.subcontractingOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Subcontracting order not found');

    return prisma.subcontractingMaterial.update({ where: { id: materialId }, data: { consumedQty: new Prisma.Decimal(consumedQty) } });
  }

  async getStats(tenantId: string) {
    const orders = await prisma.subcontractingOrder.findMany({ where: { tenantId } });
    return {
      total: orders.length,
      byStatus: orders.reduce((acc: Record<string, number>, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}),
      totalCost: orders.reduce((sum, o) => sum + Number(o.totalCost), 0),
    };
  }
}
