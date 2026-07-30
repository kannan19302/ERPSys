// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupplierPerformanceService {
  async listScorecards(tenantId: string, supplierId?: string, period?: string) {
    const where: any = { tenantId };
    if (supplierId) where.vendorId = supplierId;
    if (period) {
      const [start, end] = period.split(',');
      if (start) where.periodStart = { gte: new Date(start) };
      if (end) where.periodEnd = { lte: new Date(end) };
    }
    return prisma.supplierScorecard.findMany({
      where,
      include: { vendor: { select: { name: true, email: true } } },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getScorecard(tenantId: string, id: string) {
    const scorecard = await prisma.supplierScorecard.findFirst({
      where: { id, tenantId },
      include: { vendor: true },
    });
    if (!scorecard) throw new NotFoundException('Supplier scorecard not found');
    return scorecard;
  }

  async createScorecard(tenantId: string, data: {
    vendorId: string;
    periodStart: string;
    periodEnd: string;
    qualityScore?: number;
    deliveryScore?: number;
    fillRateScore?: number;
    overallScore?: number;
    onTimeDeliveries?: number;
    lateDeliveries?: number;
    defectiveUnits?: number;
    totalUnitsReceived?: number;
    notes?: string;
  }, userId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: data.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found in this tenant');

    const existing = await prisma.supplierScorecard.findFirst({
      where: { tenantId, vendorId: data.vendorId, periodStart: new Date(data.periodStart) },
    });
    if (existing) throw new BadRequestException('Scorecard already exists for this vendor and period');

    return prisma.supplierScorecard.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        qualityScore: data.qualityScore ?? null,
        deliveryScore: data.deliveryScore ?? null,
        fillRateScore: data.fillRateScore ?? null,
        overallScore: data.overallScore ?? null,
        onTimeDeliveries: data.onTimeDeliveries ?? 0,
        lateDeliveries: data.lateDeliveries ?? 0,
        defectiveUnits: data.defectiveUnits ?? 0,
        totalUnitsReceived: data.totalUnitsReceived ?? 0,
        notes: data.notes ?? null,
      } as any,
      include: { vendor: { select: { name: true } } },
    });
  }

  async updateScorecard(tenantId: string, id: string, data: Partial<{
    periodStart: string;
    periodEnd: string;
    qualityScore: number;
    deliveryScore: number;
    fillRateScore: number;
    overallScore: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    defectiveUnits: number;
    totalUnitsReceived: number;
    notes: string;
  }>, userId: string) {
    const existing = await prisma.supplierScorecard.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Supplier scorecard not found');

    const updateData: any = {};
    if (data.periodStart !== undefined) updateData.periodStart = new Date(data.periodStart);
    if (data.periodEnd !== undefined) updateData.periodEnd = new Date(data.periodEnd);
    if (data.qualityScore !== undefined) updateData.qualityScore = data.qualityScore;
    if (data.deliveryScore !== undefined) updateData.deliveryScore = data.deliveryScore;
    if (data.fillRateScore !== undefined) updateData.fillRateScore = data.fillRateScore;
    if (data.overallScore !== undefined) updateData.overallScore = data.overallScore;
    if (data.onTimeDeliveries !== undefined) updateData.onTimeDeliveries = data.onTimeDeliveries;
    if (data.lateDeliveries !== undefined) updateData.lateDeliveries = data.lateDeliveries;
    if (data.defectiveUnits !== undefined) updateData.defectiveUnits = data.defectiveUnits;
    if (data.totalUnitsReceived !== undefined) updateData.totalUnitsReceived = data.totalUnitsReceived;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.supplierScorecard.update({ where: { id }, data: updateData });
  }

  async listKpis(tenantId: string, scorecardId?: string) {
    const where: any = { tenantId };
    if (scorecardId) where.scorecardId = scorecardId;
    return prisma.supplierPerformanceKpi.findMany({ where, orderBy: { name: 'asc' } });
  }

  async recordKpiValue(tenantId: string, data: {
    kpiCode: string;
    name: string;
    category?: string;
    unit?: string;
    weight?: number;
    isActive?: boolean;
    description?: string;
  }, userId: string) {
    const existing = await prisma.supplierPerformanceKpi.findFirst({
      where: { tenantId, kpiCode: data.kpiCode },
    });
    if (existing) {
      return prisma.supplierPerformanceKpi.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          category: data.category ?? existing.category,
          unit: data.unit ?? existing.unit,
          weight: data.weight ?? existing.weight,
          isActive: data.isActive ?? existing.isActive,
          description: data.description ?? existing.description,
        },
      });
    }
    return prisma.supplierPerformanceKpi.create({
      data: {
        tenantId,
        kpiCode: data.kpiCode,
        name: data.name,
        category: data.category ?? 'QUALITY',
        unit: data.unit ?? 'SCORE',
        weight: data.weight ?? 1.0,
        isActive: data.isActive ?? true,
        description: data.description ?? null,
      } as any,
    });
  }

  async listAssessments(tenantId: string, supplierId?: string) {
    const where: any = { tenantId };
    if (supplierId) where.vendorId = supplierId;
    return prisma.supplierAssessment.findMany({
      where,
      include: { vendor: { select: { name: true } } },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async createAssessment(tenantId: string, data: {
    assessmentNumber: string;
    vendorId: string;
    assessmentType?: string;
    status?: string;
    maxScore?: number;
    scheduledDate?: string;
    assessedBy?: string;
    findings?: string;
    recommendations?: string;
    notes?: string;
  }, userId: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: data.vendorId, tenantId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const existing = await prisma.supplierAssessment.findFirst({
      where: { tenantId, assessmentNumber: data.assessmentNumber },
    });
    if (existing) throw new BadRequestException('Assessment number already exists');

    return prisma.supplierAssessment.create({
      data: {
        tenantId,
        assessmentNumber: data.assessmentNumber,
        vendorId: data.vendorId,
        assessmentType: data.assessmentType ?? 'QUALITY',
        status: data.status ?? 'PLANNED',
        maxScore: data.maxScore ?? 100,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        assessedBy: data.assessedBy ?? null,
        findings: data.findings ?? null,
        recommendations: data.recommendations ?? null,
        notes: data.notes ?? null,
      } as any,
      include: { vendor: { select: { name: true } } },
    });
  }

  async getSupplierRiskProfile(tenantId: string, supplierId: string) {
    const profile = await prisma.supplierRiskProfile.findFirst({
      where: { tenantId, vendorId: supplierId },
      include: {
        factors: true,
        alerts: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!profile) throw new NotFoundException('Risk profile not found for this supplier');
    return profile;
  }

  async listSupplierNcrs(tenantId: string, supplierId?: string, status?: string) {
    const where: any = { tenantId };
    if (supplierId) where.vendorId = supplierId;
    if (status) where.status = status;
    return prisma.supplierNcr.findMany({
      where,
      include: { vendor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTopSuppliers(tenantId: string, limit: number = 10) {
    const scorecards = await prisma.supplierScorecard.findMany({
      where: { tenantId },
      include: { vendor: { select: { name: true, email: true } } },
      orderBy: { overallScore: 'desc' },
      take: limit,
    });

    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    return Array.from(latestByVendor.values())
      .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0))
      .slice(0, limit)
      .map(sc => ({
        vendorId: sc.vendorId,
        vendorName: sc.vendor.name,
        overallScore: Number(sc.overallScore || 0),
        qualityScore: Number(sc.qualityScore || 0),
        deliveryScore: Number(sc.deliveryScore || 0),
        fillRateScore: Number(sc.fillRateScore || 0),
        periodStart: sc.periodStart,
        periodEnd: sc.periodEnd,
      }));
  }

  async getSupplierComparison(tenantId: string, supplierIds: string[]) {
    if (!supplierIds.length) throw new BadRequestException('At least one supplier ID is required');

    const scorecards = await prisma.supplierScorecard.findMany({
      where: { tenantId, vendorId: { in: supplierIds } },
      include: { vendor: { select: { name: true } } },
      orderBy: { periodStart: 'desc' },
    });

    const latestByVendor = new Map<string, typeof scorecards[0]>();
    for (const sc of scorecards) {
      const existing = latestByVendor.get(sc.vendorId);
      if (!existing || sc.periodStart > existing.periodStart) {
        latestByVendor.set(sc.vendorId, sc);
      }
    }

    return {
      comparison: Array.from(latestByVendor.entries()).map(([vendorId, sc]) => ({
        vendorId,
        vendorName: sc.vendor.name,
        overallScore: Number(sc.overallScore || 0),
        qualityScore: Number(sc.qualityScore || 0),
        deliveryScore: Number(sc.deliveryScore || 0),
        fillRateScore: Number(sc.fillRateScore || 0),
        onTimeDeliveries: sc.onTimeDeliveries,
        lateDeliveries: sc.lateDeliveries,
        defectiveUnits: sc.defectiveUnits,
        totalUnitsReceived: sc.totalUnitsReceived,
        periodStart: sc.periodStart,
        periodEnd: sc.periodEnd,
      })).sort((a, b) => b.overallScore - a.overallScore),
      count: latestByVendor.size,
    };
  }
}
