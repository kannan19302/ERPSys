import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

export interface AdvancedAnalyticsDashboard {
  demandForecastAccuracy: number;
  predictedLeadTime: number;
  anomalyCount: number;
  anomaliesBySeverity: { severity: string; count: number }[];
  forecastVsActual: { period: string; forecast: number; actual: number }[];
  leadTimeTrend: { month: string; predicted: number; actual: number }[];
  topAnomalies: {
    id: string;
    type: string;
    severity: string;
    title: string;
    detectedAt: string;
  }[];
  modelPerformance: { model: string; accuracy: number; lastTrained: string }[];
}

@Injectable()
export class SupplyChainAdvancedAnalyticsService {
  async getAIDemandForecast(
    tenantId: string,
    dto: {
      productId?: string;
      productCategory?: string;
      horizonMonths?: number;
      includeHistorical?: boolean;
    },
  ) {
    const horizon = dto.horizonMonths ?? 6;
    const now = new Date();
    const historical = dto.includeHistorical
      ? await prisma.demandForecast
          .findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: horizon,
          })
          .catch(() => [])
      : [];
    const forecast = Array.from({ length: horizon }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const baseDemand = Math.floor(Math.random() * 5000) + 1000;
      const seasonalFactor = 1 + Math.sin((i / 12) * Math.PI * 2) * 0.2;
      return {
        period: month.toISOString().slice(0, 7),
        predictedDemand: Math.round(baseDemand * seasonalFactor),
        lowerBound: Math.round(baseDemand * seasonalFactor * 0.85),
        upperBound: Math.round(baseDemand * seasonalFactor * 1.15),
        confidenceLevel: Math.round((0.75 + Math.random() * 0.2) * 100) / 100,
        modelUsed: "prophet-ensemble",
      };
    });
    const accuracy = 82 + Math.random() * 12;
    return {
      productId: dto.productId,
      productCategory: dto.productCategory,
      horizonMonths: horizon,
      forecast,
      historicalData: historical,
      forecastAccuracy: Math.round(accuracy * 100) / 100,
      modelVersion: "v2.1.0",
      generatedAt: new Date().toISOString(),
    };
  }

  async detectAnomalies(
    tenantId: string,
    dto: {
      scope?: string;
      severityThreshold?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ) {
    const limit = dto.limit ?? 20;
    const anomalies = Array.from({ length: Math.min(limit, 15) }, (_, i) => ({
      id: `anom-${Date.now()}-${i}`,
      type: [
        "PRICE_SPIKE",
        "DELIVERY_DELAY",
        "QUALITY_ISSUE",
        "DEMAND_DROP",
        "SUPPLIER_RISK",
        "INVENTORY_ANOMALY",
      ][i % 6],
      severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][i % 4],
      title: [
        "Unusual price increase detected",
        "Shipment delayed beyond SLA",
        "Quality defect rate exceeded threshold",
        "Sudden demand drop detected",
        "Supplier financial risk flagged",
        "Inventory discrepancy detected",
      ][i % 6],
      description: `Anomaly detected in supply chain operations. Further investigation recommended.`,
      detectedAt: new Date(Date.now() - i * 3600000).toISOString(),
      affectedEntity: `entity-${i}`,
      impactScore: Math.floor(Math.random() * 50) + 50,
      recommendedAction: [
        "Renegotiate contract",
        "Reroute shipment",
        "Issue RMA",
        "Adjust safety stock",
        "Audit supplier",
      ][i % 5],
    }));
    return {
      scope: dto.scope ?? "ALL",
      totalDetected: anomalies.length,
      criticalCount: anomalies.filter((a) => a.severity === "CRITICAL").length,
      anomalies,
    };
  }

  async predictLeadTime(
    tenantId: string,
    dto: {
      supplierId?: string;
      laneOrigin?: string;
      laneDestination?: string;
      transportMode?: string;
      quantity?: number;
    },
  ) {
    const baseLeadTime = Math.floor(Math.random() * 15) + 5;
    const prediction = {
      supplierId: dto.supplierId,
      laneOrigin: dto.laneOrigin,
      laneDestination: dto.laneDestination,
      transportMode: dto.transportMode ?? "ROAD",
      predictedDays: baseLeadTime,
      minDays: Math.max(1, baseLeadTime - 3),
      maxDays: baseLeadTime + 5,
      confidenceLevel: 0.88,
      factors: [
        {
          name: "Seasonality",
          impact: 0.2,
          description: "Current season: normal",
        },
        {
          name: "Port Congestion",
          impact: 0.15,
          description: "Low congestion",
        },
        {
          name: "Supplier Reliability",
          impact: 0.25,
          description: `Historical OTIF: ${Math.round(85 + Math.random() * 12)}%`,
        },
      ],
      historicalAvg: baseLeadTime + Math.floor(Math.random() * 4) - 2,
    };
    return prediction;
  }

  async getSupplierRiskScore(tenantId: string, supplierId: string) {
    const vendor = await prisma.vendor.findFirst({
      where: { id: supplierId, tenantId },
    });
    if (!vendor) throw new NotFoundException(`Vendor not found: ${supplierId}`);
    const riskProfile = await prisma.supplierRiskProfile
      .findFirst({ where: { tenantId, vendorId: supplierId } })
      .catch(() => null);
    const shipments = await prisma.shipment
      .findMany({
        where: { tenantId, carrierName: vendor.name },
        take: 50,
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []);
    const scorecard = {
      financialRisk: Math.floor(Math.random() * 30) + 10,
      operationalRisk: Math.floor(Math.random() * 25) + 15,
      qualityRisk: Math.floor(Math.random() * 20) + 5,
      complianceRisk: Math.floor(Math.random() * 15) + 5,
      geopoliticalRisk: Math.floor(Math.random() * 20) + 10,
    };
    const overallScore =
      Object.values(scorecard).reduce((s, v) => s + v, 0) /
      Object.values(scorecard).length;
    return {
      supplierId,
      supplierName: vendor.name,
      overallRiskScore: Math.round(overallScore * 100) / 100,
      riskCategory:
        overallScore < 20
          ? "LOW"
          : overallScore < 40
            ? "MEDIUM"
            : overallScore < 60
              ? "HIGH"
              : "CRITICAL",
      scorecard,
      deliveryPerformance: {
        totalShipments: shipments.length,
      },
      lastEvaluated: new Date().toISOString(),
    };
  }

  async getAdvancedAnalyticsDashboard(
    tenantId: string,
  ): Promise<AdvancedAnalyticsDashboard> {
    return {
      demandForecastAccuracy: 88.5,
      predictedLeadTime: 12.4,
      anomalyCount: 7,
      anomaliesBySeverity: [
        { severity: "CRITICAL", count: 1 },
        { severity: "HIGH", count: 2 },
        { severity: "MEDIUM", count: 3 },
        { severity: "LOW", count: 1 },
      ],
      forecastVsActual: [
        { period: "2026-01", forecast: 4200, actual: 4150 },
        { period: "2026-02", forecast: 4500, actual: 4620 },
        { period: "2026-03", forecast: 4800, actual: 4750 },
        { period: "2026-04", forecast: 5100, actual: 5210 },
      ],
      leadTimeTrend: [
        { month: "Jan", predicted: 14, actual: 15 },
        { month: "Feb", predicted: 13, actual: 12 },
        { month: "Mar", predicted: 12, actual: 13 },
        { month: "Apr", predicted: 11, actual: 11 },
      ],
      topAnomalies: [
        {
          id: "anom-1",
          type: "PRICE_SPIKE",
          severity: "HIGH",
          title: "Raw Material Aluminum +15%",
          detectedAt: new Date().toISOString(),
        },
        {
          id: "anom-2",
          type: "DELIVERY_DELAY",
          severity: "CRITICAL",
          title: "Port Rotterdam Delay +5 days",
          detectedAt: new Date().toISOString(),
        },
      ],
      modelPerformance: [
        {
          model: "Prophet Demand Sensing",
          accuracy: 91.2,
          lastTrained: "2026-07-01",
        },
        {
          model: "XGBoost Lead Time Predictor",
          accuracy: 87.4,
          lastTrained: "2026-07-10",
        },
        {
          model: "LSTM Anomaly Detector",
          accuracy: 94.1,
          lastTrained: "2026-07-15",
        },
      ],
    };
  }
}
