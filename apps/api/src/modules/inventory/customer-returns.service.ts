import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerReturnsService {

  // ── RMA Lifecycle ──────────────────────────────────────────────────────────

  async listRmas(tenantId: string, query: {
    customerId?: string; status?: string; limit?: number; offset?: number;
  }) {
    const where: Prisma.CustomerRmaWhereInput = {
      tenantId,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.customerRma.findMany({
        where, orderBy: { createdAt: 'desc' }, include: { lines: true, credit: true },
        take: query.limit ?? 20, skip: query.offset ?? 0,
      }),
      prisma.customerRma.count({ where }),
    ]);
    return { data, total };
  }

  async getRma(tenantId: string, rmaId: string) {
    const rma = await prisma.customerRma.findFirst({
      where: { id: rmaId, tenantId }, include: { lines: true, credit: true },
    });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    return rma;
  }

  async createRma(tenantId: string, dto: {
    customerId: string; salesOrderId?: string; returnReason: string;
    customerNotes?: string; warehouseId?: string; expiresAt?: string;
    requestedById: string;
    lines: Array<{ productId: string; lotNumber?: string; serialNumber?: string; quantityRequested: number; unitCost?: number }>;
  }) {
    const count = await prisma.customerRma.count({ where: { tenantId } });
    const rmaNumber = `RMA-${String(count + 1).padStart(6, '0')}`;
    return prisma.customerRma.create({
      data: {
        tenantId, rmaNumber,
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId ?? null,
        returnReason: dto.returnReason,
        customerNotes: dto.customerNotes,
        warehouseId: dto.warehouseId ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        requestedById: dto.requestedById,
        lines: {
          create: dto.lines.map(l => ({
            tenantId,
            productId: l.productId,
            lotNumber: l.lotNumber ?? null,
            serialNumber: l.serialNumber ?? null,
            quantityRequested: new Prisma.Decimal(l.quantityRequested),
            unitCost: l.unitCost !== undefined ? new Prisma.Decimal(l.unitCost) : null,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async approveRma(tenantId: string, rmaId: string, userId: string) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (rma.status !== 'REQUESTED') throw new BadRequestException(`RMA must be REQUESTED to approve; current: ${rma.status}`);
    return prisma.customerRma.update({
      where: { id: rmaId },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    });
  }

  async rejectRma(tenantId: string, rmaId: string, userId: string, reason: string) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (rma.status !== 'REQUESTED') throw new BadRequestException(`RMA must be REQUESTED to reject; current: ${rma.status}`);
    return prisma.customerRma.update({
      where: { id: rmaId },
      data: { status: 'REJECTED', rejectedById: userId, rejectionReason: reason },
    });
  }

  async receiveRma(tenantId: string, rmaId: string, dto: {
    receivedAt?: string; warehouseId?: string;
    lines: Array<{ lineId: string; quantityReceived: number }>;
  }) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (rma.status !== 'APPROVED') throw new BadRequestException(`RMA must be APPROVED to receive; current: ${rma.status}`);

    await Promise.all(dto.lines.map(l =>
      prisma.customerRmaLine.update({
        where: { id: l.lineId },
        data: { quantityReceived: new Prisma.Decimal(l.quantityReceived) },
      })
    ));

    return prisma.customerRma.update({
      where: { id: rmaId },
      data: {
        status: 'RECEIVED',
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        ...(dto.warehouseId ? { warehouseId: dto.warehouseId } : {}),
      },
      include: { lines: true },
    });
  }

  // ── Line Inspection ────────────────────────────────────────────────────────

  async inspectLine(tenantId: string, rmaId: string, lineId: string, dto: {
    disposition: string; inspectionNotes?: string; inspectedById: string;
  }) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (!['RECEIVED', 'INSPECTED'].includes(rma.status)) {
      throw new BadRequestException(`RMA must be RECEIVED or INSPECTED to inspect lines`);
    }

    const line = await prisma.customerRmaLine.findFirst({ where: { id: lineId, rmaId } });
    if (!line) throw new NotFoundException(`Line ${lineId} not found on RMA ${rmaId}`);

    const updatedLine = await prisma.customerRmaLine.update({
      where: { id: lineId },
      data: {
        disposition: dto.disposition as any,
        inspectionNotes: dto.inspectionNotes,
        inspectedById: dto.inspectedById,
        inspectedAt: new Date(),
      },
    });

    // Check if all lines inspected → auto-advance RMA to INSPECTED
    const uninspected = await prisma.customerRmaLine.count({ where: { rmaId, disposition: null } });
    if (uninspected === 0) {
      await prisma.customerRma.update({ where: { id: rmaId }, data: { status: 'INSPECTED' } });
    }

    return updatedLine;
  }

  async closeRma(tenantId: string, rmaId: string) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (rma.status !== 'INSPECTED') throw new BadRequestException(`RMA must be INSPECTED before closing`);
    return prisma.customerRma.update({ where: { id: rmaId }, data: { status: 'CLOSED' } });
  }

  // ── Credit Memos ───────────────────────────────────────────────────────────

  async listCredits(tenantId: string, query: { customerId?: string; status?: string; limit?: number; offset?: number }) {
    const where: Prisma.ReturnCreditWhereInput = {
      tenantId,
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.returnCredit.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: query.limit ?? 20, skip: query.offset ?? 0,
      }),
      prisma.returnCredit.count({ where }),
    ]);
    return { data, total };
  }

  async issueCredit(tenantId: string, rmaId: string, dto: {
    creditAmount: number; currency?: string; notes?: string; issuedById: string;
  }) {
    const rma = await prisma.customerRma.findFirst({ where: { id: rmaId, tenantId } });
    if (!rma) throw new NotFoundException(`RMA ${rmaId} not found`);
    if (dto.creditAmount <= 0) throw new BadRequestException('Credit amount must be positive');

    const existing = await prisma.returnCredit.findUnique({ where: { rmaId } });
    if (existing) throw new BadRequestException(`Credit already exists for RMA ${rmaId}`);

    const count = await prisma.returnCredit.count({ where: { tenantId } });
    const creditNumber = `CRM-${String(count + 1).padStart(6, '0')}`;

    return prisma.returnCredit.create({
      data: {
        tenantId, creditNumber, rmaId,
        customerId: rma.customerId,
        creditAmount: new Prisma.Decimal(dto.creditAmount),
        currency: dto.currency ?? 'USD',
        notes: dto.notes,
        status: 'ISSUED',
        issuedById: dto.issuedById,
        issuedAt: new Date(),
      },
    });
  }

  async voidCredit(tenantId: string, creditId: string, dto: { voidedById: string; voidReason: string }) {
    const credit = await prisma.returnCredit.findFirst({ where: { id: creditId, tenantId } });
    if (!credit) throw new NotFoundException(`Credit ${creditId} not found`);
    if (credit.status !== 'ISSUED') throw new BadRequestException('Only ISSUED credits can be voided');
    return prisma.returnCredit.update({
      where: { id: creditId },
      data: { status: 'VOIDED', voidedById: dto.voidedById, voidReason: dto.voidReason },
    });
  }

  // ── Restock ────────────────────────────────────────────────────────────────

  async restockLine(tenantId: string, dto: {
    rmaLineId: string; productId: string; warehouseId: string;
    binLocationId?: string; quantityRestocked: number;
    restockedById: string; notes?: string;
  }) {
    const line = await prisma.customerRmaLine.findFirst({ where: { id: dto.rmaLineId, tenantId } });
    if (!line) throw new NotFoundException(`RMA line ${dto.rmaLineId} not found`);
    if (line.disposition !== 'RESTOCK') throw new BadRequestException('Line disposition must be RESTOCK');

    return prisma.returnRestock.create({
      data: {
        tenantId,
        rmaLineId: dto.rmaLineId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        binLocationId: dto.binLocationId ?? null,
        quantityRestocked: new Prisma.Decimal(dto.quantityRestocked),
        restockedById: dto.restockedById,
        notes: dto.notes,
      },
    });
  }

  async listRestocks(tenantId: string, query: { rmaLineId?: string; productId?: string }) {
    return prisma.returnRestock.findMany({
      where: {
        tenantId,
        ...(query.rmaLineId ? { rmaLineId: query.rmaLineId } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
      },
      orderBy: { restockedAt: 'desc' },
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [totalRmas, requested, approved, received, inspected, totalCredits, pendingCredits] = await Promise.all([
      prisma.customerRma.count({ where: { tenantId } }),
      prisma.customerRma.count({ where: { tenantId, status: 'REQUESTED' } }),
      prisma.customerRma.count({ where: { tenantId, status: 'APPROVED' } }),
      prisma.customerRma.count({ where: { tenantId, status: 'RECEIVED' } }),
      prisma.customerRma.count({ where: { tenantId, status: 'INSPECTED' } }),
      prisma.returnCredit.count({ where: { tenantId } }),
      prisma.returnCredit.count({ where: { tenantId, status: 'PENDING' } }),
    ]);

    const creditAgg = await prisma.returnCredit.groupBy({
      by: ['status'],
      where: { tenantId },
      _sum: { creditAmount: true },
    });
    const totalCreditIssued = creditAgg.find(r => r.status === 'ISSUED')?._sum?.creditAmount ?? 0;

    return {
      totalRmas, requested, approved, received, inspected,
      totalCredits, pendingCredits,
      totalCreditIssued,
    };
  }
}
