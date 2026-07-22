import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class SupplierPerformanceService {
  async listKpis(tenantId: string) {
    return prisma.supplierPerformanceKpi.findMany({ where: { tenantId }, orderBy: { name: "asc" } });
  }

  async createKpi(tenantId: string, dto: Prisma.SupplierPerformanceKpiCreateInput) {
    const existing = await prisma.supplierPerformanceKpi.findFirst({ where: { tenantId, kpiCode: dto.kpiCode } });
    if (existing) throw new BadRequestException(`KPI code already exists: ${dto.kpiCode}`);
    return prisma.supplierPerformanceKpi.create({ data: { ...dto, tenantId } });
  }

  async updateKpi(tenantId: string, id: string, dto: Prisma.SupplierPerformanceKpiUpdateInput) {
    const kpi = await prisma.supplierPerformanceKpi.findFirst({ where: { id, tenantId } });
    if (!kpi) throw new NotFoundException(`KPI not found: ${id}`);
    return prisma.supplierPerformanceKpi.update({ where: { id }, data: dto });
  }

  async deleteKpi(tenantId: string, id: string) {
    const kpi = await prisma.supplierPerformanceKpi.findFirst({ where: { id, tenantId } });
    if (!kpi) throw new NotFoundException(`KPI not found: ${id}`);
    return prisma.supplierPerformanceKpi.delete({ where: { id } });
  }

  async getScorecards(tenantId: string, opts: { vendorId?: string; periodStart?: string; periodEnd?: string }) {
    const where: Prisma.SupplierScorecardWhereInput = { tenantId, ...(opts.vendorId ? { vendorId: opts.vendorId } : {}), ...(opts.periodStart ? { periodStart: { gte: new Date(opts.periodStart) } } : {}), ...(opts.periodEnd ? { periodEnd: { lte: new Date(opts.periodEnd) } } : {}) };
    return prisma.supplierScorecard.findMany({ where, orderBy: { periodStart: "desc" }, include: { vendor: { select: { id: true, name: true } } } });
  }

  async calculateScorecard(tenantId: string, vendorId: string, periodStart: string, periodEnd: string) {
    const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, tenantId, deletedAt: null } });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${vendorId}`);
    const [orders, receipts] = await Promise.all([
      prisma.purchaseOrder.findMany({ where: { tenantId, vendorId, deletedAt: null, createdAt: { gte: new Date(periodStart), lte: new Date(periodEnd) } }, select: { id: true, status: true, createdAt: true } }),
      prisma.purchaseReceiptLineItem.findMany({ where: { purchaseOrder: { tenantId, vendorId } }, include: { purchaseOrder: { select: { id: true, createdAt: true } } } }),
    ]);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "RECEIVED" || o.status === "CLOSED").length;
    const totalUnits = receipts.reduce((s, r) => s + Number(r.quantityReceived ?? 0), 0);
    const defectiveUnits = 0;
    const qualityScore = totalUnits > 0 ? Math.max(0, 100 - (defectiveUnits / totalUnits) * 100) : 100;
    const deliveryScore = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;
    const overallScore = Math.round((qualityScore + deliveryScore) / 2);
    return prisma.$transaction(async (tx) => {
      return tx.supplierScorecard.upsert({
        where: { tenantId_vendorId_periodStart: { tenantId, vendorId, periodStart: new Date(periodStart) } },
        create: { tenantId, vendorId, periodStart: new Date(periodStart), periodEnd: new Date(periodEnd), qualityScore: new Prisma.Decimal(qualityScore), deliveryScore: new Prisma.Decimal(deliveryScore), fillRateScore: new Prisma.Decimal(100), overallScore: new Prisma.Decimal(overallScore), onTimeDeliveries: completedOrders, lateDeliveries: totalOrders - completedOrders, defectiveUnits, totalUnitsReceived: totalUnits },
        update: { periodEnd: new Date(periodEnd), qualityScore: new Prisma.Decimal(qualityScore), deliveryScore: new Prisma.Decimal(deliveryScore), overallScore: new Prisma.Decimal(overallScore), onTimeDeliveries: completedOrders, lateDeliveries: totalOrders - completedOrders, defectiveUnits, totalUnitsReceived: totalUnits },
      });
    });
  }

  async getVendorTrend(tenantId: string, vendorId: string) {
    const scorecards = await prisma.supplierScorecard.findMany({ where: { tenantId, vendorId }, orderBy: { periodStart: "desc" }, take: 6 });
    return scorecards.reverse().map((s) => ({
      period: s.periodStart.toISOString().slice(0, 7),
      qualityScore: Number(s.qualityScore ?? 0),
      deliveryScore: Number(s.deliveryScore ?? 0),
      fillRateScore: Number(s.fillRateScore ?? 0),
      overallScore: Number(s.overallScore ?? 0),
      onTimeDeliveries: s.onTimeDeliveries,
      lateDeliveries: s.lateDeliveries,
    }));
  }
}
