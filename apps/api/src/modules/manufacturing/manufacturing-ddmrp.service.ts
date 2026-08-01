import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingDdmrpService {
  async getDDMRPParameters(tenantId: string, productId?: string): Promise<any> {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const parts = await prisma.ddmrpPart.findMany({
      where,
      include: { buffer: true },
    });
    if (parts.length === 0 && productId) {
      await this.initializePart(tenantId, productId);
      return this.getDDMRPParameters(tenantId, productId);
    }
    return parts.map((p) => ({
      id: p.id,
      productId: p.productId,
      leadTimeDays: p.leadTimeDays,
      ddmrpType: p.ddmrpType,
      zone: p.buffer?.zoneStatus || "GREEN",
      buffer: p.buffer
        ? {
            greenZone: p.buffer.greenZone,
            yellowZone: p.buffer.yellowZone,
            redZone: p.buffer.redZone,
            topOfGreen: p.buffer.topOfGreen,
            topOfYellow: p.buffer.topOfYellow,
            topOfRed: p.buffer.topOfRed,
            currentStock: p.buffer.currentStock,
            netFlowPosition: p.buffer.netFlowPosition,
          }
        : null,
    }));
  }

  private async initializePart(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    if (!product) throw new NotFoundException("Product not found");
    const avgDailyDemand = 10;
    const leadTimeDays = 7;
    const part = await prisma.ddmrpPart.create({
      data: { tenantId, productId, leadTimeDays, ddmrpType: "STOCKED" },
    });
    const green = avgDailyDemand * leadTimeDays * 0.5;
    const yellow = avgDailyDemand * leadTimeDays;
    const red = avgDailyDemand * leadTimeDays * 1.5;
    await prisma.ddmrpBuffer.create({
      data: {
        tenantId,
        partId: part.id,
        greenZone: green,
        yellowZone: yellow,
        redZone: red,
        topOfGreen: green,
        topOfYellow: green + yellow,
        topOfRed: green + yellow + red,
        currentStock: 0,
        onHand: 0,
        onOrder: 0,
        qualifiedDemand: 0,
      },
    });
    return part;
  }

  async calculateBufferLevels(tenantId: string, partId: string) {
    const part = await prisma.ddmrpPart.findFirst({
      where: { id: partId, tenantId },
      include: { buffer: true },
    });
    if (!part) throw new NotFoundException("DDMRP Part not found");
    if (!part.buffer) throw new NotFoundException("Buffer not configured");
    const dailyDemandRate = 10;
    const leadTimeDays = part.leadTimeDays;
    const dlt = leadTimeDays;
    const green = dailyDemandRate * dlt * 0.5;
    const yellow = dailyDemandRate * dlt;
    const red = dailyDemandRate * dlt * 1.5;
    const topOfGreen = green;
    const topOfYellow = green + yellow;
    const topOfRed = green + yellow + red;
    const stock = await this.getCurrentStock(tenantId, part.productId);
    const onHand = stock.onHand;
    const onOrder = stock.onOrder;
    const currentStock = onHand + onOrder;
    const qualifiedDemand = stock.qualifiedDemand;
    const netFlowPosition = currentStock + onOrder - qualifiedDemand;
    let zoneStatus = "GREEN";
    if (netFlowPosition <= topOfGreen) zoneStatus = "GREEN";
    if (netFlowPosition <= topOfYellow) zoneStatus = "YELLOW";
    if (netFlowPosition <= topOfRed) zoneStatus = "RED";
    if (netFlowPosition <= 0) zoneStatus = "RED_ALERT";
    await prisma.ddmrpBuffer.update({
      where: { id: part.buffer.id },
      data: {
        greenZone: green,
        yellowZone: yellow,
        redZone: red,
        topOfGreen,
        topOfYellow,
        topOfRed,
        currentStock,
        onHand,
        onOrder,
        qualifiedDemand,
        netFlowPosition,
        zoneStatus,
        calculatedAt: new Date(),
      },
    });
    return {
      partId,
      productId: part.productId,
      greenZone: green,
      yellowZone: yellow,
      redZone: red,
      topOfGreen,
      topOfYellow,
      topOfRed,
      currentStock,
      onHand,
      onOrder,
      qualifiedDemand,
      netFlowPosition: Math.round(netFlowPosition * 100) / 100,
      zoneStatus,
    };
  }

  private async getCurrentStock(tenantId: string, productId: string) {
    const inventory = await prisma.inventoryItem.findFirst({
      where: { tenantId, productId },
    });
    const onHand = inventory ? Number(inventory.quantity) : 0;
    const purchaseOrderItems = await prisma.purchaseOrderItem.findMany({
      where: { productId },
      include: { purchaseOrder: true },
    });
    const onOrder = purchaseOrderItems
      .filter((i) => ["ORDERED", "CONFIRMED"].includes(i.purchaseOrder.status))
      .reduce((sum, i) => sum + Number(i.quantity), 0);
    const salesOrderItems = await prisma.salesOrderItem.findMany({
      where: { productId },
      include: { salesOrder: true },
    });
    const qualifiedDemand = salesOrderItems
      .filter((i) => ["DRAFT", "CONFIRMED"].includes(i.salesOrder.status))
      .reduce((sum, i) => sum + Number(i.quantity), 0);
    return { onHand, onOrder, qualifiedDemand };
  }

  async runDDMRP(tenantId: string) {
    const parts = await prisma.ddmrpPart.findMany({
      where: { tenantId },
      include: { buffer: true },
    });
    const results: Array<{
      productId: string;
      zoneStatus: string;
      netFlowPosition: number;
    }> = [];
    for (const part of parts) {
      const result = await this.calculateBufferLevels(tenantId, part.id);
      results.push({
        productId: part.productId,
        zoneStatus: result.zoneStatus,
        netFlowPosition: result.netFlowPosition,
      });
      const netFlow = result.netFlowPosition;
      let recommendation = "NO_ACTION";
      let priority = "MEDIUM";
      let quantity: number | null = null;
      if (netFlow < result.topOfRed) {
        recommendation = "ORDER";
        priority = "CRITICAL";
        quantity = Math.ceil(result.topOfGreen - netFlow);
      } else if (netFlow < result.topOfYellow) {
        recommendation = "ORDER";
        priority = "HIGH";
        quantity = Math.ceil(result.topOfGreen - netFlow);
      }
      if (recommendation !== "NO_ACTION") {
        await prisma.ddmrpRecommendation.create({
          data: {
            tenantId,
            partId: part.id,
            recommendation,
            priority,
            quantity,
            reason: `Net flow position ${netFlow} is in ${result.zoneStatus} zone`,
            createdAt: new Date(),
          },
        });
      }
      const oldStatus = await prisma.ddmrpNetFlowStatus.findFirst({
        where: { tenantId, partId: part.id },
        orderBy: { recordedAt: "desc" },
      });
      if (!oldStatus || oldStatus.zone !== result.zoneStatus) {
        await prisma.ddmrpNetFlowStatus.create({
          data: {
            tenantId,
            partId: part.id,
            netFlow: netFlow,
            onHand: result.onHand,
            onOrder: result.onOrder,
            qualifiedDemand: result.qualifiedDemand,
            zone: result.zoneStatus,
          },
        });
      }
    }
    return { totalParts: parts.length, results };
  }

  async getDDMRPDashboard(tenantId: string) {
    const [parts, recommendations, recentStatuses] = await Promise.all([
      prisma.ddmrpPart.findMany({
        where: { tenantId },
        include: { buffer: true },
      }),
      prisma.ddmrpRecommendation.findMany({
        where: { tenantId, acknowledged: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.ddmrpNetFlowStatus.findMany({
        where: { tenantId },
        orderBy: { recordedAt: "desc" },
        take: 50,
      }),
    ]);
    const zoneCounts = { GREEN: 0, YELLOW: 0, RED: 0, RED_ALERT: 0 };
    for (const p of parts) {
      const zone = p.buffer?.zoneStatus || "GREEN";
      zoneCounts[zone as keyof typeof zoneCounts] =
        (zoneCounts[zone as keyof typeof zoneCounts] || 0) + 1;
    }
    const criticalRecs = recommendations.filter(
      (r) => r.priority === "CRITICAL",
    ).length;
    return {
      totalParts: parts.length,
      zoneDistribution: zoneCounts,
      openRecommendations: recommendations.length,
      criticalRecommendations: criticalRecs,
      recommendations,
      recentStatusChanges: recentStatuses,
    };
  }

  async getNetFlowEquation(tenantId: string, partId: string) {
    const part = await prisma.ddmrpPart.findFirst({
      where: { id: partId, tenantId },
      include: { buffer: true },
    });
    if (!part) throw new NotFoundException("DDMRP Part not found");
    const stock = await this.getCurrentStock(tenantId, part.productId);
    return {
      partId,
      productId: part.productId,
      onHand: stock.onHand,
      onOrder: stock.onOrder,
      qualifiedDemand: stock.qualifiedDemand,
      netFlow: stock.onHand + stock.onOrder - stock.qualifiedDemand,
      formula: "Net Flow = On Hand + On Order - Qualified Demand",
      components: {
        onHand: stock.onHand,
        onOrder: stock.onOrder,
        qualifiedSalesDemand: stock.qualifiedDemand,
      },
    };
  }

  async createDdmrpPart(
    tenantId: string,
    data: { productId: string; leadTimeDays: number; ddmrpType?: string },
  ) {
    const existing = await prisma.ddmrpPart.findFirst({
      where: { tenantId, productId: data.productId },
    });
    if (existing) return existing;
    const part = await prisma.ddmrpPart.create({
      data: {
        tenantId,
        productId: data.productId,
        leadTimeDays: data.leadTimeDays,
        ddmrpType: data.ddmrpType || "STOCKED",
      },
    });
    const dailyDemand = 10;
    const lt = data.leadTimeDays;
    await prisma.ddmrpBuffer.create({
      data: {
        tenantId,
        partId: part.id,
        greenZone: dailyDemand * lt * 0.5,
        yellowZone: dailyDemand * lt,
        redZone: dailyDemand * lt * 1.5,
        topOfGreen: dailyDemand * lt * 0.5,
        topOfYellow: dailyDemand * lt * 1.5,
        topOfRed: dailyDemand * lt * 3,
        currentStock: 0,
        onHand: 0,
        onOrder: 0,
        qualifiedDemand: 0,
      },
    });
    return part;
  }

  async acknowledgeRecommendation(
    tenantId: string,
    recId: string,
    userId: string,
  ) {
    const rec = await prisma.ddmrpRecommendation.findFirst({
      where: { id: recId, tenantId },
    });
    if (!rec) throw new NotFoundException("Recommendation not found");
    return prisma.ddmrpRecommendation.update({
      where: { id: recId },
      data: {
        acknowledged: true,
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });
  }
}
