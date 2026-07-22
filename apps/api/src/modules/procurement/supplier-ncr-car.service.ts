import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { buildPaginationValues, buildOrderBy, paginatedResult, PaginatedResult, PaginationParams } from '../../common/utils/pagination.util';

@Injectable()
export class SupplierNcrCarService {
  async listNcrs(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string; severity?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.severity) where.severity = params.severity;
    if (params.search) {
      where.OR = [{ ncrNumber: { contains: params.search, mode: 'insensitive' } }, { vendor: { name: { contains: params.search, mode: 'insensitive' } } }];
    }

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.supplierNcr.findMany({
        where, skip, take, orderBy: orderBy as any,
        include: { vendor: { select: { name: true } }, carRequests: { select: { id: true, carNumber: true, status: true } } },
      }),
      prisma.supplierNcr.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getNcrById(tenantId: string, id: string) {
    const ncr = await prisma.supplierNcr.findFirst({
      where: { id, tenantId },
      include: { vendor: true, carRequests: { include: { vendor: { select: { name: true } } } } },
    });
    if (!ncr) throw new NotFoundException('NCR not found');
    return ncr;
  }

  async createNcr(tenantId: string, dto: { vendorId: string; productId?: string; warehouseId?: string; referenceId?: string; referenceType?: string; defectType: string; severity?: string; defectQty: number; totalQty: number; description: string }, raisedBy: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: dto.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const count = await prisma.supplierNcr.count({ where: { tenantId } });
    const ncrNumber = `NCR-${String(count + 1).padStart(5, '0')}`;

    return prisma.supplierNcr.create({
      data: {
        tenantId,
        ncrNumber,
        vendorId: dto.vendorId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        defectType: dto.defectType,
        severity: dto.severity || 'MINOR',
        defectQty: dto.defectQty,
        totalQty: dto.totalQty,
        description: dto.description,
        status: 'OPEN',
        raisedBy,
      },
      include: { vendor: { select: { name: true } } },
    });
  }

  async updateNcrStatus(tenantId: string, id: string, status: string, resolution?: string) {
    const ncr = await prisma.supplierNcr.findFirst({ where: { id, tenantId } });
    if (!ncr) throw new NotFoundException('NCR not found');

    const validTransitions: Record<string, string[]> = { OPEN: ['UNDER_REVIEW', 'CLOSED'], UNDER_REVIEW: ['CAR_RAISED', 'CLOSED'], CAR_RAISED: ['CLOSED'], CLOSED: ['OPEN'] };
    const allowed = validTransitions[ncr.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition NCR from ${ncr.status} to ${status}`);
    }

    const updateData: any = { status };
    if (status === 'CLOSED') { updateData.closedAt = new Date(); if (resolution) updateData.resolution = resolution; }
    return prisma.supplierNcr.update({ where: { id }, data: updateData });
  }

  async listCars(tenantId: string, params: PaginationParams & { status?: string; vendorId?: string; ncrId?: string } = {}): Promise<PaginatedResult<any>> {
    const where: any = { tenantId };
    if (params.status) where.status = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.ncrId) where.ncrId = params.ncrId;

    const { skip, take } = buildPaginationValues(params);
    const orderBy = buildOrderBy(params.sort);

    const [items, total] = await Promise.all([
      prisma.supplierCarRequest.findMany({ where, skip, take, orderBy: orderBy as any, include: { vendor: { select: { name: true } }, ncr: { select: { ncrNumber: true, defectType: true } } } }),
      prisma.supplierCarRequest.count({ where }),
    ]);
    return paginatedResult(items, total, params);
  }

  async getCarById(tenantId: string, id: string) {
    const car = await prisma.supplierCarRequest.findFirst({ where: { id, tenantId }, include: { vendor: true, ncr: true } });
    if (!car) throw new NotFoundException('CAR not found');
    return car;
  }

  async createCarFromNcr(tenantId: string, ncrId: string, dto: { rootCause: string; correctiveAction: string; dueDate?: string }) {
    const ncr = await prisma.supplierNcr.findFirst({ where: { id: ncrId, tenantId } });
    if (!ncr) throw new NotFoundException('NCR not found');

    const carCount = await prisma.supplierCarRequest.count({ where: { tenantId } });
    const carNumber = `CAR-${String(carCount + 1).padStart(5, '0')}`;

    await prisma.supplierNcr.update({ where: { id: ncrId }, data: { status: 'CAR_RAISED' } });

    return prisma.supplierCarRequest.create({
      data: {
        tenantId, carNumber, ncrId, vendorId: ncr.vendorId,
        rootCause: dto.rootCause,
        correctiveAction: dto.correctiveAction,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        status: 'PENDING',
      },
      include: { vendor: { select: { name: true } }, ncr: { select: { ncrNumber: true } } },
    });
  }

  async updateCarStatus(tenantId: string, id: string, status: string, vendorResponse?: string) {
    const car = await prisma.supplierCarRequest.findFirst({ where: { id, tenantId } });
    if (!car) throw new NotFoundException('CAR not found');

    const validTransitions: Record<string, string[]> = { PENDING: ['SUBMITTED'], SUBMITTED: ['ACCEPTED', 'REJECTED'], ACCEPTED: ['CLOSED'], REJECTED: ['SUBMITTED'] };
    const allowed = validTransitions[car.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`Cannot transition CAR from ${car.status} to ${status}`);
    }

    const updateData: any = { status };
    if (status === 'SUBMITTED' && vendorResponse) { updateData.vendorResponse = vendorResponse; updateData.respondedAt = new Date(); }
    if (status === 'CLOSED') updateData.closedAt = new Date();
    return prisma.supplierCarRequest.update({ where: { id }, data: updateData });
  }

  async getStats(tenantId: string) {
    const ncrs = await prisma.supplierNcr.findMany({ where: { tenantId } });
    const cars = await prisma.supplierCarRequest.findMany({ where: { tenantId } });
    return {
      totalNcrs: ncrs.length,
      ncrByStatus: ncrs.reduce((acc: Record<string, number>, n) => { acc[n.status] = (acc[n.status] || 0) + 1; return acc; }, {}),
      ncrBySeverity: ncrs.reduce((acc: Record<string, number>, n) => { acc[n.severity] = (acc[n.severity] || 0) + 1; return acc; }, {}),
      totalCars: cars.length,
      carByStatus: cars.reduce((acc: Record<string, number>, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {}),
      openCritical: ncrs.filter(n => n.severity === 'CRITICAL' && n.status !== 'CLOSED').length,
    };
  }
}
