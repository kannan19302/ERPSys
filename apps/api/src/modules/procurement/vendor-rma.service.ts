import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class VendorRmaService {
  async listRmas(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.search) {
      where.OR = [{ rmaNumber: { contains: params.search, mode: 'insensitive' } }, { vendor: { name: { contains: params.search, mode: 'insensitive' } } }];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.vendorRmaRequest.findMany({
        where, skip, take, orderBy: orderBy as any,
        include: { vendor: { select: { name: true } }, shipments: { select: { id: true, status: true, shipmentNumber: true } } },
      }),
      prisma.vendorRmaRequest.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getRmaById(tenantId: string, id: string) {
    const rma = await prisma.vendorRmaRequest.findFirst({
      where: { id, tenantId },
      include: { vendor: true, reasonCode: true, shipments: { include: { warehouse: { select: { name: true } } } } },
    });
    if (!rma) throw new NotFoundException('RMA request not found');
    return rma;
  }

  async createRma(tenantId: string, orgId: string, dto: { purchaseReturnId: string; vendorId: string; reasonCodeId?: string; notes?: string; vendorRmaRef?: string }, createdBy: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const count = await prisma.vendorRmaRequest.count({ where: { tenantId, orgId } });
    const rmaNumber = `RMA-${orgId.substring(0, 4).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;

    return prisma.vendorRmaRequest.create({
      data: {
        tenantId, orgId,
        purchaseReturnId: dto.purchaseReturnId,
        vendorId: dto.vendorId,
        rmaNumber,
        reasonCodeId: dto.reasonCodeId,
        notes: dto.notes,
        vendorRmaRef: dto.vendorRmaRef,
        status: 'PENDING',
        createdBy,
      },
      include: { vendor: { select: { name: true } } },
    });
  }

  async updateRmaStatus(tenantId: string, id: string, status: string, rejectionReason?: string) {
    const rma = await prisma.vendorRmaRequest.findFirst({ where: { id, tenantId } });
    if (!rma) throw new NotFoundException('RMA request not found');

    const validTransitions: Record<string, string[]> = { PENDING: ['SUBMITTED', 'CANCELLED'], SUBMITTED: ['AUTHORIZED', 'REJECTED'], AUTHORIZED: ['COMPLETED', 'CANCELLED'], REJECTED: ['SUBMITTED'] };
    const allowed = validTransitions[rma.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition RMA from ${rma.status} to ${status}`);
    }

    const updateData: any = { status };
    if (status === 'SUBMITTED') updateData.submittedAt = new Date();
    if (status === 'AUTHORIZED') updateData.authorizedAt = new Date();
    if (status === 'REJECTED') { updateData.rejectedAt = new Date(); updateData.rejectionReason = rejectionReason; }

    return prisma.vendorRmaRequest.update({ where: { id }, data: updateData, include: { vendor: { select: { name: true } } } });
  }

  async listShipments(tenantId: string, rmaId: string, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId, rmaRequestId: rmaId };
    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.vendorReturnShipment.findMany({ where, skip, take, orderBy: orderBy as any, include: { warehouse: { select: { name: true } } } }),
      prisma.vendorReturnShipment.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async createShipment(tenantId: string, dto: { rmaRequestId: string; warehouseId: string; carrier?: string; trackingNumber?: string; notes?: string }) {
    const rma = await prisma.vendorRmaRequest.findFirst({ where: { id: dto.rmaRequestId, tenantId } });
    if (!rma) throw new NotFoundException('RMA request not found');

    const count = await prisma.vendorReturnShipment.count({ where: { tenantId } });
    const shipmentNumber = `RMA-SHP-${String(count + 1).padStart(4, '0')}`;

    return prisma.vendorReturnShipment.create({
      data: { tenantId, rmaRequestId: dto.rmaRequestId, warehouseId: dto.warehouseId, shipmentNumber, carrier: dto.carrier, trackingNumber: dto.trackingNumber, notes: dto.notes, status: 'PENDING' },
      include: { warehouse: { select: { name: true } } },
    });
  }

  async updateShipmentStatus(tenantId: string, id: string, status: string, creditMemoRef?: string, creditAmount?: number) {
    const shipment = await prisma.vendorReturnShipment.findFirst({ where: { id, tenantId } });
    if (!shipment) throw new NotFoundException('Return shipment not found');

    const updateData: any = { status };
    if (status === 'PACKED') updateData.packedAt = new Date();
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'DELIVERED') { updateData.deliveredAt = new Date(); if (creditMemoRef) updateData.creditMemoRef = creditMemoRef; if (creditAmount) updateData.creditAmount = creditAmount; }

    return prisma.vendorReturnShipment.update({ where: { id }, data: updateData, include: { warehouse: { select: { name: true } } } });
  }

  async getStats(tenantId: string) {
    const rmas = await prisma.vendorRmaRequest.findMany({ where: { tenantId } });
    const shipments = await prisma.vendorReturnShipment.findMany({ where: { tenantId } });
    return {
      totalRmas: rmas.length,
      rmaByStatus: rmas.reduce((acc: Record<string, number>, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {}),
      totalShipments: shipments.length,
      shipmentByStatus: shipments.reduce((acc: Record<string, number>, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {}),
      totalCredits: shipments.filter(s => s.creditAmount).reduce((sum, s) => sum + Number(s.creditAmount), 0),
    };
  }
}
