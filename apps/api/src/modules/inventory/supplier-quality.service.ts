import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Input schemas ────────────────────────────────────────────────────────────

export const createScorecardSchema = z.object({
  vendorId: z.string().min(1),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  qualityScore: z.number().min(0).max(100).optional(),
  deliveryScore: z.number().min(0).max(100).optional(),
  fillRateScore: z.number().min(0).max(100).optional(),
  onTimeDeliveries: z.number().int().min(0).default(0),
  lateDeliveries: z.number().int().min(0).default(0),
  defectiveUnits: z.number().int().min(0).default(0),
  totalUnitsReceived: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});
export type CreateScorecardInput = z.infer<typeof createScorecardSchema>;

export const createNcrSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().optional(),
  warehouseId: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  defectType: z.enum(['DIMENSIONAL', 'COSMETIC', 'FUNCTIONAL', 'DOCUMENTATION', 'LABELING', 'QUANTITY']),
  severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']).default('MINOR'),
  defectQty: z.number().int().min(0).default(0),
  totalQty: z.number().int().min(0).default(0),
  description: z.string().min(1),
  raisedBy: z.string().optional(),
});
export type CreateNcrInput = z.infer<typeof createNcrSchema>;

export const closeNcrSchema = z.object({
  resolution: z.string().min(1),
});
export type CloseNcrInput = z.infer<typeof closeNcrSchema>;

export const createCarSchema = z.object({
  ncrId: z.string().min(1),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});
export type CreateCarInput = z.infer<typeof createCarSchema>;

export const respondCarSchema = z.object({
  vendorResponse: z.string().min(1),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
});
export type RespondCarInput = z.infer<typeof respondCarSchema>;

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SupplierQualityService {

  // ─── Scorecards ──────────────────────────────────────────────────────────

  async listScorecards(tenantId: string, vendorId?: string) {
    const where: Prisma.SupplierScorecardWhereInput = { tenantId };
    if (vendorId) where.vendorId = vendorId;
    return prisma.supplierScorecard.findMany({
      where,
      include: { vendor: { select: { id: true, name: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async createScorecard(tenantId: string, dto: CreateScorecardInput) {
    const periodStart = new Date(dto.periodStart);
    const existing = await prisma.supplierScorecard.findFirst({
      where: { tenantId, vendorId: dto.vendorId, periodStart },
    });
    if (existing) throw new BadRequestException('Scorecard for this vendor and period already exists');

    // Compute overall score as weighted average of provided dimensions
    const scores = [dto.qualityScore, dto.deliveryScore, dto.fillRateScore].filter(
      (s): s is number => s !== undefined,
    );
    const overallScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

    return prisma.supplierScorecard.create({
      data: {
        tenantId,
        vendorId: dto.vendorId,
        periodStart,
        periodEnd: new Date(dto.periodEnd),
        qualityScore: dto.qualityScore != null ? new Prisma.Decimal(dto.qualityScore.toFixed(2)) : null,
        deliveryScore: dto.deliveryScore != null ? new Prisma.Decimal(dto.deliveryScore.toFixed(2)) : null,
        fillRateScore: dto.fillRateScore != null ? new Prisma.Decimal(dto.fillRateScore.toFixed(2)) : null,
        overallScore: overallScore != null ? new Prisma.Decimal(overallScore.toFixed(2)) : null,
        onTimeDeliveries: dto.onTimeDeliveries,
        lateDeliveries: dto.lateDeliveries,
        defectiveUnits: dto.defectiveUnits,
        totalUnitsReceived: dto.totalUnitsReceived,
        notes: dto.notes ?? null,
      },
      include: { vendor: { select: { id: true, name: true } } },
    });
  }

  async getVendorScoreHistory(tenantId: string, vendorId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const scorecards = await prisma.supplierScorecard.findMany({
      where: { tenantId, vendorId },
      orderBy: { periodStart: 'asc' },
    });
    const latest = scorecards[scorecards.length - 1];
    return { vendor: { id: vendor.id, name: vendor.name }, scorecards, latestOverallScore: latest?.overallScore ?? null };
  }

  // ─── NCRs ────────────────────────────────────────────────────────────────

  async listNcrs(tenantId: string, query: { vendorId?: string; severity?: string; status?: string }) {
    const where: Prisma.SupplierNcrWhereInput = { tenantId };
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;
    return prisma.supplierNcr.findMany({
      where,
      include: {
        vendor: { select: { id: true, name: true } },
        _count: { select: { carRequests: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNcr(tenantId: string, dto: CreateNcrInput) {
    const ncrNumber = `NCR-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return prisma.supplierNcr.create({
      data: {
        tenantId,
        ncrNumber,
        vendorId: dto.vendorId,
        productId: dto.productId ?? null,
        warehouseId: dto.warehouseId ?? null,
        referenceId: dto.referenceId ?? null,
        referenceType: dto.referenceType ?? null,
        defectType: dto.defectType,
        severity: dto.severity,
        defectQty: dto.defectQty,
        totalQty: dto.totalQty,
        description: dto.description,
        raisedBy: dto.raisedBy ?? null,
      },
      include: { vendor: { select: { id: true, name: true } } },
    });
  }

  async closeNcr(tenantId: string, id: string, dto: CloseNcrInput) {
    const ncr = await prisma.supplierNcr.findFirst({ where: { id, tenantId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('NCR is already closed');
    return prisma.supplierNcr.update({
      where: { id },
      data: { status: 'CLOSED', resolution: dto.resolution, closedAt: new Date() },
    });
  }

  // ─── CAR Requests ────────────────────────────────────────────────────────

  async listCars(tenantId: string, ncrId?: string) {
    const where: Prisma.SupplierCarRequestWhereInput = { tenantId };
    if (ncrId) where.ncrId = ncrId;
    return prisma.supplierCarRequest.findMany({
      where,
      include: {
        ncr: { select: { id: true, ncrNumber: true, severity: true } },
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCar(tenantId: string, dto: CreateCarInput) {
    const ncr = await prisma.supplierNcr.findFirst({ where: { id: dto.ncrId, tenantId } });
    if (!ncr) throw new NotFoundException('NCR not found');
    if (ncr.status === 'CLOSED') throw new BadRequestException('Cannot raise CAR on a closed NCR');

    const carNumber = `CAR-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const [car] = await prisma.$transaction([
      prisma.supplierCarRequest.create({
        data: {
          tenantId,
          carNumber,
          ncrId: dto.ncrId,
          vendorId: ncr.vendorId,
          rootCause: dto.rootCause ?? null,
          correctiveAction: dto.correctiveAction ?? null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
      }),
      prisma.supplierNcr.update({ where: { id: dto.ncrId }, data: { status: 'CAR_RAISED' } }),
    ]);
    return car;
  }

  async respondToCar(tenantId: string, id: string, dto: RespondCarInput) {
    const car = await prisma.supplierCarRequest.findFirst({ where: { id, tenantId } });
    if (!car) throw new NotFoundException('CAR not found');
    if (!['PENDING', 'SUBMITTED'].includes(car.status)) {
      throw new BadRequestException(`CAR is ${car.status.toLowerCase()}, cannot respond`);
    }
    return prisma.supplierCarRequest.update({
      where: { id },
      data: {
        vendorResponse: dto.vendorResponse,
        rootCause: dto.rootCause ?? car.rootCause,
        correctiveAction: dto.correctiveAction ?? car.correctiveAction,
        status: 'SUBMITTED',
        respondedAt: new Date(),
      },
    });
  }

  async acceptCar(tenantId: string, id: string) {
    const car = await prisma.supplierCarRequest.findFirst({ where: { id, tenantId } });
    if (!car) throw new NotFoundException('CAR not found');
    if (car.status !== 'SUBMITTED') throw new BadRequestException('CAR must be SUBMITTED to accept');
    return prisma.supplierCarRequest.update({
      where: { id },
      data: { status: 'ACCEPTED', closedAt: new Date() },
    });
  }

  async rejectCar(tenantId: string, id: string) {
    const car = await prisma.supplierCarRequest.findFirst({ where: { id, tenantId } });
    if (!car) throw new NotFoundException('CAR not found');
    if (car.status !== 'SUBMITTED') throw new BadRequestException('CAR must be SUBMITTED to reject');
    return prisma.supplierCarRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  // ─── Quality Dashboard ────────────────────────────────────────────────────

  async getQualityDashboard(tenantId: string) {
    const [totalNcrs, openNcrs, criticalNcrs, pendingCars, recentScorecards] = await Promise.all([
      prisma.supplierNcr.count({ where: { tenantId } }),
      prisma.supplierNcr.count({ where: { tenantId, status: { not: 'CLOSED' } } }),
      prisma.supplierNcr.count({ where: { tenantId, severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
      prisma.supplierCarRequest.count({ where: { tenantId, status: { in: ['PENDING', 'SUBMITTED'] } } }),
      prisma.supplierScorecard.findMany({
        where: { tenantId },
        orderBy: { periodStart: 'desc' },
        take: 5,
        include: { vendor: { select: { id: true, name: true } } },
      }),
    ]);

    return { totalNcrs, openNcrs, criticalNcrs, pendingCars, recentScorecards };
  }
}
