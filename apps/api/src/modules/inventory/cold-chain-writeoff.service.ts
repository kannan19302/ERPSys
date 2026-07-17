import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class ColdChainWriteoffService {

  // ── Cold Chain Requirements ────────────────────────────────────

  async listRequirements(tenantId: string, productId?: string) {
    return prisma.coldChainRequirement.findMany({
      where: { tenantId, active: true, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertRequirement(tenantId: string, data: {
    productId: string;
    minTempCelsius: number;
    maxTempCelsius: number;
    minHumidityPct?: number;
    maxHumidityPct?: number;
    maxExcursionMins?: number;
    specialHandling?: string;
  }) {
    const d = (v: number | undefined) => v !== undefined ? new Prisma.Decimal(v) : undefined;
    const existing = await prisma.coldChainRequirement.findUnique({
      where: { tenantId_productId: { tenantId, productId: data.productId } },
    });
    if (existing) {
      return prisma.coldChainRequirement.update({
        where: { tenantId_productId: { tenantId, productId: data.productId } },
        data: {
          minTempCelsius: new Prisma.Decimal(data.minTempCelsius),
          maxTempCelsius: new Prisma.Decimal(data.maxTempCelsius),
          minHumidityPct: d(data.minHumidityPct),
          maxHumidityPct: d(data.maxHumidityPct),
          maxExcursionMins: data.maxExcursionMins,
          specialHandling: data.specialHandling,
          active: true,
        },
      });
    }
    return prisma.coldChainRequirement.create({
      data: {
        tenantId,
        productId: data.productId,
        minTempCelsius: new Prisma.Decimal(data.minTempCelsius),
        maxTempCelsius: new Prisma.Decimal(data.maxTempCelsius),
        minHumidityPct: d(data.minHumidityPct),
        maxHumidityPct: d(data.maxHumidityPct),
        maxExcursionMins: data.maxExcursionMins,
        specialHandling: data.specialHandling,
      },
    });
  }

  async deactivateRequirement(tenantId: string, productId: string) {
    const req = await prisma.coldChainRequirement.findUnique({
      where: { tenantId_productId: { tenantId, productId } },
    });
    if (!req) throw new NotFoundException(`No cold-chain requirement for product ${productId}`);
    return prisma.coldChainRequirement.update({
      where: { tenantId_productId: { tenantId, productId } },
      data: { active: false },
    });
  }

  // ── Temperature Excursions ─────────────────────────────────────

  async listExcursions(tenantId: string, status?: string, warehouseId?: string) {
    return prisma.temperatureExcursion.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { requirement: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async logExcursion(tenantId: string, data: {
    productId: string;
    warehouseId: string;
    batchId?: string;
    recordedTempC: number;
    recordedHumidityPct?: number;
    excursionStartAt: string;
    excursionEndAt?: string;
    loggedById: string;
  }) {
    const req = await prisma.coldChainRequirement.findUnique({
      where: { tenantId_productId: { tenantId, productId: data.productId } },
    });
    if (!req) throw new NotFoundException(`No cold-chain requirement for product ${data.productId}`);

    const startAt = new Date(data.excursionStartAt);
    const endAt = data.excursionEndAt ? new Date(data.excursionEndAt) : undefined;
    const durationMins = endAt ? Math.round((endAt.getTime() - startAt.getTime()) / 60000) : undefined;

    const tempDiff = Math.max(
      Number(data.recordedTempC) - Number(req.maxTempCelsius),
      Number(req.minTempCelsius) - Number(data.recordedTempC),
      0,
    );
    const severity = tempDiff > 10 ? 'CRITICAL' : tempDiff > 5 ? 'MODERATE' : 'MINOR';

    return prisma.temperatureExcursion.create({
      data: {
        tenantId,
        requirementId: req.id,
        warehouseId: data.warehouseId,
        batchId: data.batchId,
        recordedTempC: new Prisma.Decimal(data.recordedTempC),
        recordedHumidityPct: data.recordedHumidityPct ? new Prisma.Decimal(data.recordedHumidityPct) : undefined,
        excursionStartAt: startAt,
        excursionEndAt: endAt,
        durationMins,
        severity: severity as any,
        loggedById: data.loggedById,
      },
    });
  }

  async reviewExcursion(tenantId: string, id: string, data: {
    status: string;
    reviewedById: string;
    dispositionNotes?: string;
  }) {
    const exc = await prisma.temperatureExcursion.findFirst({ where: { tenantId, id } });
    if (!exc) throw new NotFoundException(`Excursion ${id} not found`);
    return prisma.temperatureExcursion.update({
      where: { id },
      data: {
        status: data.status as any,
        reviewedById: data.reviewedById,
        dispositionNotes: data.dispositionNotes,
      },
    });
  }

  async getExcursionSummary(tenantId: string) {
    const [open, underReview, quarantined, total] = await Promise.all([
      prisma.temperatureExcursion.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.temperatureExcursion.count({ where: { tenantId, status: 'UNDER_REVIEW' } }),
      prisma.temperatureExcursion.count({ where: { tenantId, status: 'QUARANTINED' } }),
      prisma.temperatureExcursion.count({ where: { tenantId } }),
    ]);
    const critical = await prisma.temperatureExcursion.count({ where: { tenantId, severity: 'CRITICAL' } });
    return { open, underReview, quarantined, total, critical };
  }

  async checkProductCompliance(tenantId: string, productId: string) {
    const req = await prisma.coldChainRequirement.findUnique({
      where: { tenantId_productId: { tenantId, productId } },
    });
    if (!req) return { hasColdChain: false };
    const openExcursions = await prisma.temperatureExcursion.count({
      where: { tenantId, requirementId: req.id, status: { in: ['OPEN', 'QUARANTINED'] } },
    });
    return {
      hasColdChain: true,
      minTempCelsius: req.minTempCelsius,
      maxTempCelsius: req.maxTempCelsius,
      openExcursions,
      compliant: openExcursions === 0,
    };
  }

  // ── Stock Write-Down Requests ──────────────────────────────────

  async listWriteDowns(tenantId: string, status?: string) {
    return prisma.stockWriteDownRequest.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWriteDown(tenantId: string, data: {
    warehouseId: string;
    productId: string;
    batchId?: string;
    quantity: number;
    originalValuePerUnit: number;
    proposedValuePerUnit: number;
    writeDownReason: string;
    requestedById: string;
  }) {
    if (data.proposedValuePerUnit >= data.originalValuePerUnit) {
      throw new BadRequestException('Proposed value must be less than original value for a write-down');
    }
    const count = await prisma.stockWriteDownRequest.count({ where: { tenantId } });
    const requestNumber = `WD-${String(count + 1).padStart(6, '0')}`;
    return prisma.stockWriteDownRequest.create({
      data: {
        tenantId,
        requestNumber,
        warehouseId: data.warehouseId,
        productId: data.productId,
        batchId: data.batchId,
        quantity: new Prisma.Decimal(data.quantity),
        originalValuePerUnit: new Prisma.Decimal(data.originalValuePerUnit),
        proposedValuePerUnit: new Prisma.Decimal(data.proposedValuePerUnit),
        writeDownReason: data.writeDownReason,
        requestedById: data.requestedById,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async approveWriteDown(tenantId: string, id: string, approvedById: string) {
    const req = await prisma.stockWriteDownRequest.findFirst({ where: { tenantId, id } });
    if (!req) throw new NotFoundException(`Write-down ${id} not found`);
    if (req.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Cannot approve a ${req.status} write-down`);
    return prisma.stockWriteDownRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async rejectWriteDown(tenantId: string, id: string, rejectionNotes: string) {
    const req = await prisma.stockWriteDownRequest.findFirst({ where: { tenantId, id } });
    if (!req) throw new NotFoundException(`Write-down ${id} not found`);
    if (req.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Cannot reject a ${req.status} write-down`);
    return prisma.stockWriteDownRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionNotes },
    });
  }

  async applyWriteDown(tenantId: string, id: string) {
    const req = await prisma.stockWriteDownRequest.findFirst({ where: { tenantId, id } });
    if (!req) throw new NotFoundException(`Write-down ${id} not found`);
    if (req.status !== 'APPROVED') throw new BadRequestException(`Cannot apply a ${req.status} write-down`);
    return prisma.stockWriteDownRequest.update({
      where: { id },
      data: { status: 'WRITTEN_DOWN', appliedAt: new Date() },
    });
  }

  // ── Stock Write-Off Records ────────────────────────────────────

  async listWriteOffs(tenantId: string, status?: string) {
    return prisma.stockWriteOffRecord.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWriteOff(tenantId: string, data: {
    warehouseId: string;
    productId: string;
    batchId?: string;
    quantity: number;
    bookValuePerUnit: number;
    disposalMethod: string;
    writeOffReason: string;
    requestedById: string;
  }) {
    const totalWriteOff = data.quantity * data.bookValuePerUnit;
    const count = await prisma.stockWriteOffRecord.count({ where: { tenantId } });
    const writeOffNumber = `WO-${String(count + 1).padStart(6, '0')}`;
    return prisma.stockWriteOffRecord.create({
      data: {
        tenantId,
        writeOffNumber,
        warehouseId: data.warehouseId,
        productId: data.productId,
        batchId: data.batchId,
        quantity: new Prisma.Decimal(data.quantity),
        bookValuePerUnit: new Prisma.Decimal(data.bookValuePerUnit),
        totalWriteOff: new Prisma.Decimal(totalWriteOff),
        disposalMethod: data.disposalMethod,
        writeOffReason: data.writeOffReason,
        requestedById: data.requestedById,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async approveWriteOff(tenantId: string, id: string, approvedById: string) {
    const rec = await prisma.stockWriteOffRecord.findFirst({ where: { tenantId, id } });
    if (!rec) throw new NotFoundException(`Write-off ${id} not found`);
    if (rec.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Cannot approve a ${rec.status} write-off`);
    return prisma.stockWriteOffRecord.update({
      where: { id },
      data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
    });
  }

  async rejectWriteOff(tenantId: string, id: string, rejectionNotes: string) {
    const rec = await prisma.stockWriteOffRecord.findFirst({ where: { tenantId, id } });
    if (!rec) throw new NotFoundException(`Write-off ${id} not found`);
    if (rec.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Cannot reject a ${rec.status} write-off`);
    return prisma.stockWriteOffRecord.update({
      where: { id },
      data: { status: 'REJECTED', rejectionNotes },
    });
  }

  async completeWriteOff(tenantId: string, id: string) {
    const rec = await prisma.stockWriteOffRecord.findFirst({ where: { tenantId, id } });
    if (!rec) throw new NotFoundException(`Write-off ${id} not found`);
    if (rec.status !== 'APPROVED') throw new BadRequestException(`Cannot complete a ${rec.status} write-off`);
    return prisma.stockWriteOffRecord.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const [coldChainProducts, openExcursions, criticalExcursions,
           pendingWriteDowns, pendingWriteOffs, totalWriteOffValue] = await Promise.all([
      prisma.coldChainRequirement.count({ where: { tenantId, active: true } }),
      prisma.temperatureExcursion.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.temperatureExcursion.count({ where: { tenantId, severity: 'CRITICAL', status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.stockWriteDownRequest.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
      prisma.stockWriteOffRecord.count({ where: { tenantId, status: 'PENDING_APPROVAL' } }),
      prisma.stockWriteOffRecord.groupBy({
        by: ['tenantId'],
        where: { tenantId, status: 'COMPLETED' },
        _sum: { totalWriteOff: true },
      }),
    ]);
    return {
      coldChainProducts,
      openExcursions,
      criticalExcursions,
      pendingWriteDowns,
      pendingWriteOffs,
      totalWriteOffValue: Number(totalWriteOffValue[0]?._sum?.totalWriteOff ?? 0),
    };
  }
}
