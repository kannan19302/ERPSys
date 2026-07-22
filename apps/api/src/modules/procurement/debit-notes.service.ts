import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class DebitNotesService {
  async list(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.search) {
      where.OR = [{ noteNumber: { contains: params.search, mode: 'insensitive' } }, { vendor: { name: { contains: params.search, mode: 'insensitive' } } }];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.debitNote.findMany({
        where, skip, take, orderBy: orderBy as any,
        include: { vendor: { select: { name: true, id: true } }, purchaseOrder: { select: { poNumber: true } } },
      }),
      prisma.debitNote.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getById(tenantId: string, id: string) {
    const note = await prisma.debitNote.findFirst({ where: { id, tenantId }, include: { vendor: true, purchaseOrder: { select: { poNumber: true } } } });
    if (!note) throw new NotFoundException('Debit note not found');
    return note;
  }

  async create(tenantId: string, orgId: string, dto: { vendorId: string; purchaseOrderId?: string; billId?: string; amount: number; reason?: string; lineItems?: any }, createdBy: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const count = await prisma.debitNote.count({ where: { tenantId, orgId } });
    const noteNumber = `DN-${orgId.substring(0, 4).toUpperCase()}-${String(count + 1).padStart(4, '0')}`;

    return prisma.debitNote.create({
      data: {
        tenantId, orgId,
        vendorId: dto.vendorId,
        purchaseOrderId: dto.purchaseOrderId,
        billId: dto.billId,
        noteNumber,
        amount: dto.amount,
        reason: dto.reason,
        lineItems: dto.lineItems || null,
        status: 'DRAFT',
        createdBy,
      },
      include: { vendor: { select: { name: true } } },
    });
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const note = await prisma.debitNote.findFirst({ where: { id, tenantId } });
    if (!note) throw new NotFoundException('Debit note not found');

    const validTransitions: Record<string, string[]> = { DRAFT: ['ISSUED', 'CANCELLED'], ISSUED: ['RECEIVED', 'DISPUTED', 'CANCELLED'], RECEIVED: ['SETTLED'], DISPUTED: ['ISSUED', 'CANCELLED'] };
    const allowed = validTransitions[note.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition debit note from ${note.status} to ${status}`);
    }

    return prisma.debitNote.update({ where: { id }, data: { status } });
  }

  async update(tenantId: string, id: string, dto: { amount?: number; reason?: string; lineItems?: any }) {
    const note = await prisma.debitNote.findFirst({ where: { id, tenantId, status: 'DRAFT' } });
    if (!note) throw new NotFoundException('Debit note not found or not in DRAFT status');

    return prisma.debitNote.update({ where: { id }, data: { amount: dto.amount, reason: dto.reason, lineItems: dto.lineItems } });
  }

  async getStats(tenantId: string) {
    const notes = await prisma.debitNote.findMany({ where: { tenantId } });
    const totalAmount = notes.reduce((s, n) => s + Number(n.amount), 0);
    const pendingAmount = notes.filter(n => !['SETTLED', 'CANCELLED'].includes(n.status)).reduce((s, n) => s + Number(n.amount), 0);
    return { total: notes.length, totalAmount, pendingAmount, byStatus: notes.reduce((acc: Record<string, number>, n) => { acc[n.status] = (acc[n.status] || 0) + 1; return acc; }, {}) };
  }
}
