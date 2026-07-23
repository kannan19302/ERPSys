import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

@Injectable()
export class Asc606DeepService {
  // ── Performance Obligations ───────────────────────────────────

  async getPerformanceObligations(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.performanceObligation.findMany({ where, orderBy: { startDate: "desc" } });
  }

  async getPerformanceObligationById(tenantId: string, id: string) {
    const ob = await prisma.performanceObligation.findFirst({ where: { id, tenantId } });
    if (!ob) throw new NotFoundException("Performance obligation not found");
    return ob;
  }

  async createPerformanceObligation(tenantId: string, orgId: string, dto: any) {
    return prisma.performanceObligation.create({
      data: { ...dto, tenantId, orgId, allocatedAmount: dto.allocatedAmount ?? dto.transactionPrice ?? 0 },
    });
  }

  async updatePerformanceObligation(tenantId: string, id: string, dto: any) {
    await this.getPerformanceObligationById(tenantId, id);
    return prisma.performanceObligation.update({ where: { id }, data: dto });
  }

  async deletePerformanceObligation(tenantId: string, id: string) {
    await this.getPerformanceObligationById(tenantId, id);
    return prisma.performanceObligation.delete({ where: { id } });
  }

  async satisfyPerformanceObligation(tenantId: string, id: string, satisfiedDate?: string) {
    const ob = await this.getPerformanceObligationById(tenantId, id);
    if (ob.status === "SATISFIED") throw new BadRequestException("Already satisfied");
    return prisma.performanceObligation.update({
      where: { id },
      data: { status: "SATISFIED", satisfiedDate: satisfiedDate ? new Date(satisfiedDate) : new Date() },
    });
  }

  async partiallySatisfyPerformanceObligation(tenantId: string, id: string, recognizedAmount: number) {
    const ob = await this.getPerformanceObligationById(tenantId, id);
    const newRecognized = Number(ob.revenueRecognized) + recognizedAmount;
    const totalAllocated = Number(ob.allocatedAmount);
    if (newRecognized > totalAllocated) throw new BadRequestException("Cannot recognize more than allocated amount");
    const status = Math.abs(newRecognized - totalAllocated) < 0.01 ? "SATISFIED" : "PARTIALLY_SATISFIED";
    return prisma.performanceObligation.update({
      where: { id },
      data: {
        revenueRecognized: new Prisma.Decimal(newRecognized),
        revenueDeferred: new Prisma.Decimal(Math.max(0, totalAllocated - newRecognized)),
        status,
        satisfiedDate: status === "SATISFIED" ? new Date() : undefined,
      },
    });
  }

  async allocateTransactionPrice(tenantId: string, orgId: string, contractRef: string) {
    const obligations = await prisma.performanceObligation.findMany({
      where: { tenantId, orgId, contractRef, status: { not: "CANCELLED" } },
    });
    if (obligations.length === 0) throw new NotFoundException("No active performance obligations found");

    const totalSsp = obligations.reduce((s, o) => s + Number(o.ssp || 0), 0);
    if (totalSsp === 0) throw new BadRequestException("No SSP values found for allocation");

    const transactionPrice = obligations.reduce((s, o) => s + Number(o.transactionPrice), 0);
    const results: any[] = [];

    for (const ob of obligations) {
      const ssp = Number(ob.ssp || 0);
      const allocated = (ssp / totalSsp) * transactionPrice;
      await prisma.performanceObligation.update({
        where: { id: ob.id },
        data: { allocatedAmount: new Prisma.Decimal(allocated) },
      });
      results.push({ obligationId: ob.id, description: ob.description, ssp, allocatedAmount: allocated });
    }
    return { contractRef, transactionPrice, totalSsp, allocations: results };
  }

  async getObligationsByContract(tenantId: string, contractRef: string) {
    return prisma.performanceObligation.findMany({
      where: { tenantId, contractRef },
      orderBy: { startDate: "asc" },
    });
  }

  async getObligationHierarchy(tenantId: string, parentId: string) {
    const parent = await this.getPerformanceObligationById(tenantId, parentId);
    const children = await prisma.performanceObligation.findMany({ where: { tenantId, parentId } });
    return { parent, children };
  }

  // ── Contract Modifications ────────────────────────────────────

  async getContractModifications(tenantId: string, contractRef?: string) {
    const where: any = { tenantId };
    if (contractRef) where.contractRef = contractRef;
    return prisma.asc606ContractModification.findMany({ where, orderBy: { modificationDate: "desc" } });
  }

  async getContractModificationById(tenantId: string, id: string) {
    const mod = await prisma.asc606ContractModification.findFirst({ where: { id, tenantId } });
    if (!mod) throw new NotFoundException("Contract modification not found");
    return mod;
  }

  async createContractModification(tenantId: string, orgId: string, dto: any) {
    return prisma.asc606ContractModification.create({ data: { ...dto, tenantId, orgId } });
  }

  async updateContractModification(tenantId: string, id: string, dto: any) {
    await this.getContractModificationById(tenantId, id);
    return prisma.asc606ContractModification.update({ where: { id }, data: dto });
  }

  async approveContractModification(tenantId: string, id: string, approvedBy: string) {
    const mod = await this.getContractModificationById(tenantId, id);
    if (mod.status !== "DRAFT") throw new BadRequestException("Only draft modifications can be approved");
    return prisma.asc606ContractModification.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async applyContractModification(tenantId: string, id: string) {
    const mod = await this.getContractModificationById(tenantId, id);
    if (mod.status !== "APPROVED") throw new BadRequestException("Modification must be approved first");
    return prisma.asc606ContractModification.update({
      where: { id },
      data: { status: "APPLIED" },
    });
  }

  async getModificationsByContract(tenantId: string, contractRef: string) {
    return prisma.asc606ContractModification.findMany({
      where: { tenantId, contractRef },
      orderBy: { modificationDate: "desc" },
    });
  }

  async computeCumulativeCatchUp(tenantId: string, id: string) {
    const mod = await this.getContractModificationById(tenantId, id);
    const original = Number(mod.originalConsideration);
    const modified = Number(mod.modifiedConsideration);
    const difference = modified - original;
    const catchUp = difference * 0.5; // simplified: 50% of difference as catch-up
    return prisma.asc606ContractModification.update({
      where: { id },
      data: { cumulativeCatchUp: new Prisma.Decimal(catchUp) },
    });
  }

  async deleteContractModification(tenantId: string, id: string) {
    await this.getContractModificationById(tenantId, id);
    return prisma.asc606ContractModification.delete({ where: { id } });
  }

  // ── Deferred Revenue Roll-Forward ─────────────────────────────

  async getDeferredRevenueRollForwards(tenantId: string, period?: string) {
    const where: any = { tenantId };
    if (period) where.period = period;
    return prisma.asc606DeferredRevenueRollForward.findMany({ where, orderBy: { period: "desc" } });
  }

  async getDeferredRevenueRollForwardById(tenantId: string, id: string) {
    const rf = await prisma.asc606DeferredRevenueRollForward.findFirst({ where: { id, tenantId } });
    if (!rf) throw new NotFoundException("Deferred revenue roll-forward not found");
    return rf;
  }

  async createDeferredRevenueRollForward(tenantId: string, orgId: string, dto: any) {
    const opening = Number(dto.openingBalance || 0);
    const additions = Number(dto.additions || 0);
    const recognized = Number(dto.recognized || 0);
    const writeOffs = Number(dto.writeOffs || 0);
    const closing = opening + additions - recognized - writeOffs;
    const currentPortion = closing * 0.6;
    const nonCurrent = closing - currentPortion;
    return prisma.asc606DeferredRevenueRollForward.create({
      data: {
        ...dto, tenantId, orgId,
        openingBalance: new Prisma.Decimal(opening),
        additions: new Prisma.Decimal(additions),
        recognized: new Prisma.Decimal(recognized),
        writeOffs: new Prisma.Decimal(writeOffs),
        closingBalance: new Prisma.Decimal(closing),
        currentPortion: new Prisma.Decimal(currentPortion),
        nonCurrentPortion: new Prisma.Decimal(nonCurrent),
      },
    });
  }

  async updateDeferredRevenueRollForward(tenantId: string, id: string, dto: any) {
    await this.getDeferredRevenueRollForwardById(tenantId, id);
    const updateData: any = { ...dto };
    if (dto.openingBalance !== undefined) updateData.openingBalance = new Prisma.Decimal(dto.openingBalance);
    if (dto.additions !== undefined) updateData.additions = new Prisma.Decimal(dto.additions);
    if (dto.recognized !== undefined) updateData.recognized = new Prisma.Decimal(dto.recognized);
    if (dto.writeOffs !== undefined) updateData.writeOffs = new Prisma.Decimal(dto.writeOffs);
    if (dto.openingBalance !== undefined || dto.additions !== undefined || dto.recognized !== undefined || dto.writeOffs !== undefined) {
      const existing = await this.getDeferredRevenueRollForwardById(tenantId, id);
      const opening = dto.openingBalance !== undefined ? Number(dto.openingBalance) : Number(existing.openingBalance);
      const additions = dto.additions !== undefined ? Number(dto.additions) : Number(existing.additions);
      const recognized = dto.recognized !== undefined ? Number(dto.recognized) : Number(existing.recognized);
      const writeOffs = dto.writeOffs !== undefined ? Number(dto.writeOffs) : Number(existing.writeOffs);
      const closing = opening + additions - recognized - writeOffs;
      updateData.closingBalance = new Prisma.Decimal(closing);
      updateData.currentPortion = new Prisma.Decimal(closing * 0.6);
      updateData.nonCurrentPortion = new Prisma.Decimal(closing * 0.4);
    }
    return prisma.asc606DeferredRevenueRollForward.update({ where: { id }, data: updateData });
  }

  async finalizeRollForward(tenantId: string, id: string) {
    await this.getDeferredRevenueRollForwardById(tenantId, id);
    return prisma.asc606DeferredRevenueRollForward.update({ where: { id }, data: { status: "FINALIZED" } });
  }

  async deleteDeferredRevenueRollForward(tenantId: string, id: string) {
    await this.getDeferredRevenueRollForwardById(tenantId, id);
    return prisma.asc606DeferredRevenueRollForward.delete({ where: { id } });
  }

  async getRollForwardByPeriod(tenantId: string, orgId: string, period: string) {
    const rf = await prisma.asc606DeferredRevenueRollForward.findUnique({
      where: { tenantId_orgId_period: { tenantId, orgId, period } },
    });
    if (!rf) throw new NotFoundException("Roll-forward not found for this period");
    return rf;
  }

  async computeRollForwardFromSchedules(tenantId: string, orgId: string, period: string) {
    const parts = period.split("-").map(Number);
    const year = parts[0] ?? 2026;
    const month = parts[1] ?? 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId, orgId, status: "ACTIVE" },
    });

    const openingBalance = schedules.reduce((s, sch) => s + Number(sch.deferredAmount), 0);

    const newSchedulesInPeriod = await prisma.revenueSchedule.findMany({
      where: { tenantId, orgId, startDate: { gte: startDate, lte: endDate } },
    });
    const additions = newSchedulesInPeriod.reduce((s, sch) => s + Number(sch.totalAmount), 0);

    const completedInPeriod = await prisma.revenueSchedule.findMany({
      where: { tenantId, orgId, status: "COMPLETED", startDate: { lte: endDate } },
    });
    const recognized = completedInPeriod.reduce((s, sch) => s + Number(sch.recognizedAmount), 0);

    const closing = openingBalance + additions - recognized;
    const currentPortion = closing * 0.6;
    const nonCurrent = closing - currentPortion;

    return prisma.asc606DeferredRevenueRollForward.upsert({
      where: { tenantId_orgId_period: { tenantId, orgId, period } },
      create: {
        tenantId, orgId, period,
        openingBalance: new Prisma.Decimal(openingBalance),
        additions: new Prisma.Decimal(additions),
        recognized: new Prisma.Decimal(recognized),
        writeOffs: new Prisma.Decimal(0),
        closingBalance: new Prisma.Decimal(closing),
        currentPortion: new Prisma.Decimal(currentPortion),
        nonCurrentPortion: new Prisma.Decimal(nonCurrent),
      },
      update: {
        openingBalance: new Prisma.Decimal(openingBalance),
        additions: new Prisma.Decimal(additions),
        recognized: new Prisma.Decimal(recognized),
        closingBalance: new Prisma.Decimal(closing),
        currentPortion: new Prisma.Decimal(currentPortion),
        nonCurrentPortion: new Prisma.Decimal(nonCurrent),
      },
    });
  }

  // ── Multi-Element Arrangement Analysis ───────────────────────

  async getMultiElementSummary(tenantId: string, contractRef?: string) {
    const where: any = { tenantId };
    if (contractRef) where.contractRef = contractRef;
    const obligations = await prisma.performanceObligation.findMany({ where });
    const totalPrice = obligations.reduce((s, o) => s + Number(o.transactionPrice), 0);
    const totalAllocated = obligations.reduce((s, o) => s + Number(o.allocatedAmount), 0);
    const totalRecognized = obligations.reduce((s, o) => s + Number(o.revenueRecognized), 0);
    const totalDeferred = obligations.reduce((s, o) => s + Number(o.revenueDeferred), 0);
    const byStatus = {
      active: obligations.filter((o) => o.status === "ACTIVE").length,
      satisfied: obligations.filter((o) => o.status === "SATISFIED").length,
      partiallySatisfied: obligations.filter((o) => o.status === "PARTIALLY_SATISFIED").length,
      cancelled: obligations.filter((o) => o.status === "CANCELLED").length,
    };
    return { totalObligations: obligations.length, totalPrice, totalAllocated, totalRecognized, totalDeferred, byStatus };
  }

  async getVariableConsiderationEstimate(tenantId: string, contractRef: string) {
      const mods = (await prisma.asc606ContractModification.findMany({
      where: { tenantId, contractRef, status: "APPROVED" },
    })) ?? [];
    const totalCatchUp = mods.reduce((s, m) => s + Number(m.cumulativeCatchUp), 0);
    const totalModified = mods.reduce((s, m) => s + Number(m.modifiedConsideration), 0);
    const totalOriginal = mods.reduce((s, m) => s + Number(m.originalConsideration), 0);
    return { contractRef, modificationCount: mods.length, totalCatchUp, totalModified, totalOriginal, estimatedVariableConsideration: totalCatchUp };
  }

  async getRevenueAging(tenantId: string, orgId: string) {
    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId, orgId, status: "ACTIVE" },
      orderBy: { startDate: "asc" },
    });
    const now = new Date();
    const aging: any = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlus: 0 };
    for (const sch of schedules) {
      const deferred = Number(sch.deferredAmount);
      const daysSinceEnd = Math.max(0, Math.floor((now.getTime() - new Date(sch.endDate).getTime()) / (1000 * 86400)));
      if (daysSinceEnd <= 0) aging.current += deferred;
      else if (daysSinceEnd <= 30) aging.thirtyDays += deferred;
      else if (daysSinceEnd <= 60) aging.sixtyDays += deferred;
      else aging.ninetyPlus += deferred;
    }
    return { agingBuckets: aging, totalDeferred: Object.values(aging).reduce((s: number, v: any) => s + v, 0) };
  }

  async getRevenueForecast(tenantId: string, orgId: string, months: number = 12) {
    const schedules = await prisma.revenueSchedule.findMany({
      where: { tenantId, orgId, status: "ACTIVE" },
    });
    const now = new Date();
    const forecast: any[] = [];
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59, 999);
      let expectedRecognition = 0;
      for (const sch of schedules) {
        const total = Number(sch.totalAmount);
        const schStart = new Date(sch.startDate);
        const schEnd = new Date(sch.endDate);
        const totalMonths = Math.max(1, (schEnd.getFullYear() - schStart.getFullYear()) * 12 + (schEnd.getMonth() - schStart.getMonth()) + 1);
        const monthly = total / totalMonths;
        if (monthStart >= schStart && monthStart <= schEnd) expectedRecognition += monthly;
      }
      void monthEnd;
      forecast.push({ period: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`, expectedRecognition });
    }
    return forecast;
  }

  async getContractRevenueSummary(tenantId: string, contractRef: string) {
    const obligations = await prisma.performanceObligation.findMany({ where: { tenantId, contractRef } });
    const mods = await prisma.asc606ContractModification.findMany({ where: { tenantId, contractRef } });
    const lastMod = mods.length > 0 ? mods[0]?.modificationDate : null;
    return {
      contractRef,
      totalObligations: obligations.length,
      totalRevenue: obligations.reduce((s, o) => s + Number(o.transactionPrice), 0),
      totalRecognized: obligations.reduce((s, o) => s + Number(o.revenueRecognized), 0),
      totalDeferred: obligations.reduce((s, o) => s + Number(o.revenueDeferred), 0),
      modificationCount: mods.length,
      lastModified: lastMod,
    };
  }

  async getAsc606Dashboard(tenantId: string, orgId: string) {
    const obligations = await prisma.performanceObligation.findMany({ where: { tenantId, orgId } });
    const rollForwards = await prisma.asc606DeferredRevenueRollForward.findMany({
      where: { tenantId, orgId },
      orderBy: { period: "desc" },
      take: 3,
    });
    const totalDeferred = obligations.reduce((s, o) => s + Number(o.revenueDeferred), 0);
    const totalRecognized = obligations.reduce((s, o) => s + Number(o.revenueRecognized), 0);
    const activeCount = obligations.filter((o) => o.status === "ACTIVE" || o.status === "PARTIALLY_SATISFIED").length;
    return { totalObligations: obligations.length, activeObligations: activeCount, totalDeferred, totalRecognized, recentRollForwards: rollForwards };
  }
}
