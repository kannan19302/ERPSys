// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ScmDeepExpansionService {
  private get prisma() {
    return prisma as any;
  }

  // 1. Letters of Credit & Trade Finance
  async createLetterOfCredit(tenantId: string, data: any) {
    return this.prisma.letterOfCredit.create({
      data: { ...data, tenantId },
      include: { documents: true, amendments: true, presentations: true },
    });
  }

  async getLettersOfCredit(tenantId: string, filter?: any) {
    return this.prisma.letterOfCredit.findMany({
      where: { tenantId, ...filter },
      include: { documents: true, amendments: true, presentations: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLetterOfCreditById(tenantId: string, id: string) {
    const lc = await this.prisma.letterOfCredit.findFirst({
      where: { id, tenantId },
      include: { documents: true, amendments: true, presentations: true },
    });
    if (!lc) throw new NotFoundException(`Letter of Credit #${id} not found`);
    return lc;
  }

  async addLcDocument(tenantId: string, lcId: string, data: any) {
    return this.prisma.lcDocument.create({
      data: { ...data, lcId, tenantId },
    });
  }

  async addLcAmendment(tenantId: string, lcId: string, data: any) {
    return this.prisma.lcAmendment.create({
      data: { ...data, lcId, tenantId },
    });
  }

  async submitLcPresentation(tenantId: string, lcId: string, data: any) {
    return this.prisma.lcPresentation.create({
      data: { ...data, lcId, tenantId },
    });
  }

  // 2. S&OP Cycle & Planning
  async createSopCycle(tenantId: string, data: any) {
    return this.prisma.sopCycle.create({
      data: { ...data, tenantId },
      include: { demandPlans: true, supplyPlans: true, consensusPlans: true },
    });
  }

  async getSopCycles(tenantId: string) {
    return this.prisma.sopCycle.findMany({
      where: { tenantId },
      include: { demandPlans: true, supplyPlans: true, consensusPlans: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSopDemandPlan(tenantId: string, cycleId: string, data: any) {
    return this.prisma.sopDemandPlan.create({
      data: { ...data, sopCycleId: cycleId, tenantId },
    });
  }

  async createSopSupplyPlan(tenantId: string, cycleId: string, data: any) {
    return this.prisma.sopSupplyPlan.create({
      data: { ...data, sopCycleId: cycleId, tenantId },
    });
  }

  async createSopConsensusPlan(tenantId: string, cycleId: string, data: any) {
    return this.prisma.sopConsensusPlan.create({
      data: { ...data, sopCycleId: cycleId, tenantId },
    });
  }

  // 3. 4PL/3PL Logistics Provider Management
  async createLogisticsProvider(tenantId: string, data: any) {
    return this.prisma.logisticsProvider.create({
      data: { ...data, tenantId },
    });
  }

  async getLogisticsProviders(tenantId: string) {
    return this.prisma.logisticsProvider.findMany({
      where: { tenantId },
      include: { providerInvoices: true, performanceLogs: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async logProviderPerformance(
    tenantId: string,
    providerId: string,
    data: any,
  ) {
    return this.prisma.logisticsProviderPerformance.create({
      data: { ...data, providerId, tenantId },
    });
  }

  // 4. Cold Chain Tracking & Excursion Mgmt
  async createColdChainShipment(tenantId: string, data: any) {
    return this.prisma.coldChainShipment.create({
      data: { ...data, tenantId },
    });
  }

  async recordTemperatureLog(tenantId: string, shipmentId: string, data: any) {
    const log = await this.prisma.coldChainTemperatureLog.create({
      data: { ...data, shipmentId, tenantId },
    });
    // Auto-check for excursion
    const shipment = await this.prisma.coldChainShipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (
      shipment &&
      shipment.requiredTempMax &&
      data.temperature > shipment.requiredTempMax
    ) {
      await this.prisma.coldChainExcursion.create({
        data: {
          tenantId,
          shipmentId,
          excursionType: "HIGH_TEMP",
          detectedAt: new Date(),
          maxDeviation: data.temperature - shipment.requiredTempMax,
          severity: "HIGH",
        },
      });
      await this.prisma.coldChainShipment.update({
        where: { id: shipmentId },
        data: { totalExcursions: { increment: 1 } },
      });
    }
    return log;
  }

  async getColdChainShipments(tenantId: string) {
    return this.prisma.coldChainShipment.findMany({
      where: { tenantId },
      include: { temperatureLogs: { take: 50 }, ccExcursions: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 5. SCEM Alerts & Risk Events
  async createScemAlert(tenantId: string, data: any) {
    return this.prisma.scemAlert.create({
      data: { ...data, tenantId },
    });
  }

  async getScemAlerts(tenantId: string, status?: string) {
    return this.prisma.scemAlert.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSupplyChainRiskEvent(tenantId: string, data: any) {
    return this.prisma.supplyChainRiskEvent.create({
      data: { ...data, tenantId },
    });
  }

  async addRiskMitigation(tenantId: string, riskEventId: string, data: any) {
    return this.prisma.scmRiskMitigation.create({
      data: { ...data, riskEventId, tenantId },
    });
  }

  // 6. Trade Compliance & Export Licensing
  async performTradeComplianceCheck(tenantId: string, data: any) {
    const matches = await this.prisma.deniedPartyEntry.findMany({
      where: {
        entityName: { contains: data.entityName, mode: "insensitive" },
        isActive: true,
      },
    });

    const result = matches.length > 0 ? "FLAGGED" : "CLEARED";
    return this.prisma.tradeComplianceCheck.create({
      data: {
        tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        checkType: data.checkType || "DENIED_PARTY",
        result,
        matchScore: matches.length > 0 ? 0.95 : 0.0,
        matchedEntry: matches.length > 0 ? (matches[0] as any) : null,
      },
    });
  }

  async createExportLicense(tenantId: string, data: any) {
    return this.prisma.exportLicense.create({
      data: { ...data, tenantId },
    });
  }

  async classifyHsCode(tenantId: string, data: any) {
    return this.prisma.hsCodeClassification.create({
      data: { ...data, tenantId },
    });
  }

  // 7. Multi-Modal Transport Orders
  async createMultimodalOrder(tenantId: string, data: any) {
    return this.prisma.multiModalTransportOrder.create({
      data: {
        ...data,
        tenantId,
        legs: data.legs
          ? {
              createMany: {
                data: data.legs.map((leg: any) => ({ ...leg, tenantId })),
              },
            }
          : undefined,
      },
      include: { legs: true, events: true },
    });
  }

  async getMultimodalOrders(tenantId: string) {
    return this.prisma.multiModalTransportOrder.findMany({
      where: { tenantId },
      include: { legs: true, events: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 8. Last-Mile Delivery & Time Slots
  async createDeliveryZone(tenantId: string, data: any) {
    return this.prisma.deliveryZone.create({
      data: { ...data, tenantId },
      include: { slots: true },
    });
  }

  async createLastMileDelivery(tenantId: string, data: any) {
    return this.prisma.lastMileDelivery.create({
      data: { ...data, tenantId },
    });
  }

  // 9. Reverse Logistics Orders
  async createReverseLogisticsOrder(tenantId: string, data: any) {
    return this.prisma.reverseLogisticsOrder.create({
      data: {
        ...data,
        tenantId,
        items: data.items
          ? {
              createMany: {
                data: data.items.map((item: any) => ({ ...item, tenantId })),
              },
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  // 10. IoT Replenishment & Network Design
  async recordIotReading(tenantId: string, deviceId: string, data: any) {
    return this.prisma.scmIotReading.create({
      data: { ...data, deviceId, tenantId },
    });
  }

  async createNetworkDesign(tenantId: string, data: any) {
    return this.prisma.warehouseNetworkDesign.create({
      data: {
        ...data,
        tenantId,
        nodes: data.nodes
          ? {
              createMany: {
                data: data.nodes.map((node: any) => ({ ...node, tenantId })),
              },
            }
          : undefined,
      },
      include: { nodes: true },
    });
  }
}
