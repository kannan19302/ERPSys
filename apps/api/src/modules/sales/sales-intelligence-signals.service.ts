import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesIntelligenceSignalsService {
  async getSignals(
    tenantId: string,
    options?: { customerId?: string; severity?: string; isActioned?: boolean },
  ) {
    const where: any = { tenantId };
    if (options?.customerId) where.customerId = options.customerId;
    if (options?.severity) where.severity = options.severity;
    if (options?.isActioned !== undefined)
      where.isActioned = options.isActioned;

    return prisma.salesIntelligenceSignal.findMany({
      where,
      orderBy: { detectedAt: "desc" },
    });
  }

  async getSignalById(tenantId: string, id: string) {
    const signal = await prisma.salesIntelligenceSignal.findFirst({
      where: { id, tenantId },
    });
    if (!signal) throw new NotFoundException("Intelligence signal not found");
    return signal;
  }

  async createSignal(tenantId: string, dto: any) {
    return prisma.salesIntelligenceSignal.create({
      data: {
        tenantId,
        customerId: dto.customerId || null,
        opportunityId: dto.opportunityId || null,
        signalType: dto.signalType,
        severity: dto.severity || "MEDIUM",
        source: dto.source || "CRM_ACTIVITY",
        headline: dto.headline,
        payload: dto.payload || null,
        isActioned: false,
        detectedAt: dto.detectedAt ? new Date(dto.detectedAt) : new Date(),
      },
    });
  }

  async markActioned(tenantId: string, id: string) {
    await this.getSignalById(tenantId, id);

    return prisma.salesIntelligenceSignal.update({
      where: { id },
      data: { isActioned: true },
    });
  }

  async getSummary(tenantId: string) {
    const signals = await prisma.salesIntelligenceSignal.findMany({
      where: { tenantId, isActioned: false },
    });

    const criticalCount = signals.filter(
      (s) => s.severity === "CRITICAL",
    ).length;
    const highCount = signals.filter((s) => s.severity === "HIGH").length;
    const mediumCount = signals.filter((s) => s.severity === "MEDIUM").length;
    const lowCount = signals.filter((s) => s.severity === "LOW").length;

    return {
      totalPendingSignals: signals.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      signals: signals.slice(0, 10),
    };
  }
}
