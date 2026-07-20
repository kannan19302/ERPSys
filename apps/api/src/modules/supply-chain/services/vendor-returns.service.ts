import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { CreateVendorReturnDto, UpdateVendorReturnStatusDto } from '../dto/supply-chain.dto';

@Injectable()
export class VendorReturnsService {
  async list(tenantId: string, query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const where: Prisma.VendorReturnShipmentWhereInput = { tenantId };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      prisma.vendorReturnShipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { rmaRequest: true, warehouse: true },
      }),
      prisma.vendorReturnShipment.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(tenantId: string, id: string) {
    const item = await prisma.vendorReturnShipment.findFirst({
      where: { id, tenantId },
      include: { rmaRequest: true, warehouse: true },
    });
    if (!item) throw new NotFoundException('Vendor return shipment not found');
    return item;
  }

  async create(tenantId: string, dto: CreateVendorReturnDto) {
    return prisma.vendorReturnShipment.create({
      data: {
        tenantId,
        rmaRequestId: dto.rmaRequestId,
        warehouseId: dto.warehouseId,
        shipmentNumber: dto.shipmentNumber,
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        creditMemoRef: dto.creditMemoRef,
        creditAmount: dto.creditAmount !== undefined && dto.creditAmount !== null ? new Prisma.Decimal(dto.creditAmount) : null,
        notes: dto.notes,
        status: 'PENDING',
      },
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateVendorReturnStatusDto) {
    const existing = await prisma.vendorReturnShipment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Vendor return shipment not found');

    const now = new Date();
    const extra: Record<string, unknown> = {};
    if (dto.status === 'PACKED') extra.packedAt = now;
    if (dto.status === 'SHIPPED') extra.shippedAt = now;
    if (dto.status === 'DELIVERED') extra.deliveredAt = now;
    if (dto.trackingNumber !== undefined) extra.trackingNumber = dto.trackingNumber;
    if (dto.creditMemoRef !== undefined) extra.creditMemoRef = dto.creditMemoRef;
    if (dto.creditAmount !== undefined && dto.creditAmount !== null) extra.creditAmount = new Prisma.Decimal(dto.creditAmount);

    return prisma.vendorReturnShipment.update({
      where: { id },
      data: { status: dto.status, ...extra },
    });
  }

  async getStats(tenantId: string) {
    const all = await prisma.vendorReturnShipment.findMany({ where: { tenantId } });
    const totalReturns = all.length;
    const totalCreditAmount = all.reduce((sum, r) => sum + (r.creditAmount ? Number(r.creditAmount) : 0), 0);
    const statusCounts: Record<string, number> = {};
    for (const r of all) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }
    return { totalReturns, totalCreditAmount, statusCounts };
  }
}
