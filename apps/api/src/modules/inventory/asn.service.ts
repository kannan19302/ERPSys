import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AsnDiscrepancyType } from '@prisma/client';

@Injectable()
export class AsnService {
  // ── ASN Lifecycle ─────────────────────────────────────────────────────────

  async createAsn(
    tenantId: string,
    _userId: string,
    data: {
      vendorId: string;
      warehouseId: string;
      purchaseOrderId?: string;
      carrierName?: string;
      trackingNumber?: string;
      shipDate?: Date;
      expectedArrival?: Date;
      notes?: string;
    },
  ) {
    const count = await prisma.advanceShippingNotice.count({ where: { tenantId } });
    const asnNumber = `ASN-${String(count + 1).padStart(6, '0')}`;

    return prisma.advanceShippingNotice.create({
      data: { tenantId, asnNumber, ...data, status: 'PENDING' },
      include: { lineItems: true },
    });
  }

  async addLineItem(
    tenantId: string,
    asnId: string,
    data: { productId: string; expectedQty: number; uom?: string; lotNumber?: string; serialNos?: string[]; notes?: string },
  ) {
    const asn = await this._getAsn(tenantId, asnId);
    if (asn.status === 'RECEIVED' || asn.status === 'CANCELLED')
      throw new BadRequestException('Cannot add items to a closed or cancelled ASN');
    if (data.expectedQty <= 0) throw new BadRequestException('Expected quantity must be positive');

    return prisma.aSNLineItem.create({
      data: {
        tenantId,
        asnId,
        productId: data.productId,
        expectedQty: data.expectedQty,
        uom: data.uom ?? 'EA',
        lotNumber: data.lotNumber,
        serialNos: data.serialNos ? JSON.stringify(data.serialNos) : undefined,
        notes: data.notes,
      },
    });
  }

  async markInTransit(tenantId: string, asnId: string, trackingNumber?: string) {
    const asn = await this._getAsn(tenantId, asnId);
    if (asn.status !== 'PENDING') throw new BadRequestException('ASN must be PENDING to mark in transit');

    return prisma.advanceShippingNotice.update({
      where: { id: asnId },
      data: { status: 'IN_TRANSIT', ...(trackingNumber ? { trackingNumber } : {}) },
    });
  }

  async markArrived(tenantId: string, asnId: string) {
    const asn = await this._getAsn(tenantId, asnId);
    if (!['PENDING', 'IN_TRANSIT'].includes(asn.status))
      throw new BadRequestException('ASN must be PENDING or IN_TRANSIT to mark arrived');

    return prisma.advanceShippingNotice.update({
      where: { id: asnId },
      data: { status: 'ARRIVED' },
    });
  }

  async receiveLineItem(
    tenantId: string,
    userId: string,
    asnId: string,
    lineItemId: string,
    receivedQty: number,
  ) {
    const asn = await this._getAsn(tenantId, asnId);
    if (!['ARRIVED', 'RECEIVING', 'PARTIALLY_RECEIVED'].includes(asn.status))
      throw new BadRequestException('ASN must be in ARRIVED or RECEIVING status to receive items');
    if (receivedQty < 0) throw new BadRequestException('Received quantity cannot be negative');

    const lineItem = await prisma.aSNLineItem.findFirst({ where: { id: lineItemId, tenantId, asnId } });
    if (!lineItem) throw new NotFoundException('Line item not found');

    const updatedItem = await prisma.aSNLineItem.update({
      where: { id: lineItemId },
      data: { receivedQty },
    });

    // Set ASN to RECEIVING on first receipt
    if (asn.status === 'ARRIVED') {
      await prisma.advanceShippingNotice.update({ where: { id: asnId }, data: { status: 'RECEIVING' } });
    }

    // Auto-create discrepancy if overage or shortage
    const expected = Number(lineItem.expectedQty);
    if (Math.abs(receivedQty - expected) > 0.0001) {
      const discrepancyType = receivedQty > expected ? AsnDiscrepancyType.OVERAGE : AsnDiscrepancyType.SHORTAGE;
      await prisma.asnDiscrepancy.create({
        data: {
          tenantId,
          asnId,
          lineItemId,
          discrepancyType,
          productId: lineItem.productId,
          expectedQty: expected,
          actualQty: receivedQty,
          reportedBy: userId,
        },
      });
    }

    return updatedItem;
  }

  async finalizeReceiving(tenantId: string, asnId: string) {
    const asn = await this._getAsn(tenantId, asnId);
    if (!['RECEIVING', 'ARRIVED'].includes(asn.status))
      throw new BadRequestException('ASN must be in RECEIVING or ARRIVED status to finalize');

    const items = await prisma.aSNLineItem.findMany({ where: { tenantId, asnId } });
    const allReceived = items.every(i => Number(i.receivedQty) >= Number(i.expectedQty));
    const newStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    return prisma.advanceShippingNotice.update({
      where: { id: asnId },
      data: { status: newStatus, receivedAt: new Date() },
    });
  }

  async cancelAsn(tenantId: string, asnId: string) {
    const asn = await this._getAsn(tenantId, asnId);
    if (asn.status === 'RECEIVED') throw new BadRequestException('Cannot cancel a fully received ASN');
    if (asn.status === 'CANCELLED') throw new BadRequestException('ASN already cancelled');

    return prisma.advanceShippingNotice.update({ where: { id: asnId }, data: { status: 'CANCELLED' } });
  }

  // ── Discrepancies ─────────────────────────────────────────────────────────

  async reportDiscrepancy(
    tenantId: string,
    userId: string,
    asnId: string,
    data: {
      discrepancyType: AsnDiscrepancyType;
      productId: string;
      expectedQty: number;
      actualQty: number;
      lineItemId?: string;
      notes?: string;
    },
  ) {
    await this._getAsn(tenantId, asnId);
    return prisma.asnDiscrepancy.create({
      data: {
        tenantId,
        asnId,
        ...data,
        reportedBy: userId,
      },
    });
  }

  async resolveDiscrepancy(
    tenantId: string,
    userId: string,
    discrepancyId: string,
    resolutionNote: string,
  ) {
    const disc = await prisma.asnDiscrepancy.findFirst({ where: { id: discrepancyId, tenantId } });
    if (!disc) throw new NotFoundException('Discrepancy not found');
    if (disc.resolvedAt) throw new BadRequestException('Discrepancy already resolved');

    return prisma.asnDiscrepancy.update({
      where: { id: discrepancyId },
      data: { resolvedAt: new Date(), resolvedBy: userId, resolutionNote },
    });
  }

  async listDiscrepancies(tenantId: string, asnId?: string, discrepancyType?: AsnDiscrepancyType) {
    return prisma.asnDiscrepancy.findMany({
      where: {
        tenantId,
        ...(asnId ? { asnId } : {}),
        ...(discrepancyType ? { discrepancyType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  async listAsns(tenantId: string, status?: string, vendorId?: string) {
    return prisma.advanceShippingNotice.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(vendorId ? { vendorId } : {}),
      },
      include: { lineItems: true, _count: { select: { lineItems: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsn(tenantId: string, asnId: string) {
    return prisma.advanceShippingNotice.findFirst({
      where: { id: asnId, tenantId },
      include: { lineItems: true },
    });
  }

  async getDashboard(tenantId: string) {
    const [byStatus, discrepancyStats, recentAsns] = await Promise.all([
      prisma.advanceShippingNotice.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.asnDiscrepancy.groupBy({
        by: ['discrepancyType'],
        where: { tenantId, resolvedAt: null },
        _count: { id: true },
      }),
      prisma.advanceShippingNotice.findMany({
        where: { tenantId, status: { in: ['PENDING', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING'] } },
        orderBy: { expectedArrival: 'asc' },
        take: 10,
        include: { _count: { select: { lineItems: true } } },
      }),
    ]);

    return { byStatus, discrepancyStats, recentAsns };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async _getAsn(tenantId: string, asnId: string) {
    const asn = await prisma.advanceShippingNotice.findFirst({ where: { id: asnId, tenantId } });
    if (!asn) throw new NotFoundException('ASN not found');
    return asn;
  }
}
