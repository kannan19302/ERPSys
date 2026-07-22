import { Injectable } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class SalesForecastingService {
  async getForecast(tenantId: string, period?: string) {
    const periodStr = period || this.getCurrentPeriod();
    const { startDate, endDate } = this.parsePeriod(periodStr);
    const [openQuotations, winLoss, historicalRevenue] = await Promise.all([
      prisma.quotation.findMany({
        where: { tenantId, deletedAt: null, status: "SENT" },
        select: { totalAmount: true },
      }),
      this.getWinRate(tenantId),
      this.getHistoricalAverageRevenue(tenantId, startDate, endDate),
    ]);
    const pipelineValue = openQuotations.reduce(
      (sum, q) => sum + Number(q.totalAmount),
      0,
    );
    const winRate = winLoss.winRate / 100;
    const expectedValue = pipelineValue * winRate;
    const confidence =
      openQuotations.length > 0
        ? Math.min(Math.round(winRate * 100 + openQuotations.length * 2), 95)
        : 0;
    return {
      period: periodStr,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      expectedValue: Math.round(expectedValue * 100) / 100,
      historicalAverage: Math.round(historicalRevenue * 100) / 100,
      winRate: Math.round(winLoss.winRate * 100) / 100,
      confidence,
    };
  }

  async getForecastVsActual(tenantId: string, period?: string) {
    const periodStr = period || this.getCurrentPeriod();
    const { startDate, endDate } = this.parsePeriod(periodStr);
    const [_closedQuotations, confirmedOrders] = await Promise.all([
      prisma.quotation.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: { in: ["ACCEPTED", "CONVERTED"] },
          issueDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      prisma.salesOrder.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: { notIn: ["DRAFT", "CANCELLED"] },
          orderDate: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
    ]);
    const actualValue = Number(confirmedOrders._sum.totalAmount || 0);
    const forecast = await this.getForecast(tenantId, periodStr);
    const forecastedValue = forecast.expectedValue;
    const variance = actualValue - forecastedValue;
    const variancePercent =
      forecastedValue > 0
        ? (variance / forecastedValue) * 100
        : actualValue > 0
          ? 100
          : 0;
    return {
      period: periodStr,
      forecastedValue: Math.round(forecastedValue * 100) / 100,
      actualValue: Math.round(actualValue * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      variancePercent: Math.round(variancePercent * 100) / 100,
    };
  }

  async getPipelineForecast(tenantId: string) {
    const stages = ["DRAFT", "SENT", "ACCEPTED"];
    const stageProbability: Record<string, number> = {
      DRAFT: 0.1,
      SENT: 0.3,
      ACCEPTED: 0.7,
    };
    const quotations = await prisma.quotation.findMany({
      where: { tenantId, deletedAt: null, status: { in: stages } },
      select: { status: true, totalAmount: true },
    });
    const stageMap = new Map<string, { count: number; totalValue: number }>();
    for (const q of quotations) {
      const current = stageMap.get(q.status) || { count: 0, totalValue: 0 };
      current.count++;
      current.totalValue += Number(q.totalAmount);
      stageMap.set(q.status, current);
    }
    const stagesResult = stages.map((stage) => {
      const data = stageMap.get(stage) || { count: 0, totalValue: 0 };
      const prob = stageProbability[stage] ?? 0;
      return {
        stage,
        count: data.count,
        totalValue: Math.round(data.totalValue * 100) / 100,
        weightedValue: Math.round(data.totalValue * prob * 100) / 100,
        probability: prob,
      };
    });
    return {
      stages: stagesResult,
      totalWeightedValue:
        Math.round(
          stagesResult.reduce((sum, s) => sum + s.weightedValue, 0) * 100,
        ) / 100,
    };
  }

  async getForecastHistory(tenantId: string, periods = 4) {
    const history: Array<{
      period: string;
      forecasted: number;
      actual: number;
      accuracy: number;
    }> = [];
    for (let i = periods; i >= 1; i--) {
      const periodStr = this.getPastPeriod(i);
      const vsActual = await this.getForecastVsActual(tenantId, periodStr);
      const accuracy =
        vsActual.forecastedValue > 0
          ? Math.max(0, 100 - Math.abs(vsActual.variancePercent))
          : 0;
      history.push({
        period: periodStr,
        forecasted: vsActual.forecastedValue,
        actual: vsActual.actualValue,
        accuracy: Math.round(accuracy * 100) / 100,
      });
    }
    return history;
  }

  async getForecastDashboard(tenantId: string) {
    const [
      currentForecast,
      pipelineForecast,
      forecastVsActual,
      forecastHistory,
    ] = await Promise.all([
      this.getForecast(tenantId),
      this.getPipelineForecast(tenantId),
      this.getForecastVsActual(tenantId),
      this.getForecastHistory(tenantId),
    ]);
    return {
      currentForecast,
      pipelineForecast,
      forecastVsActual,
      forecastHistory,
    };
  }

  private async getWinRate(tenantId: string) {
    const groups = await prisma.quotation.groupBy({
      by: ["status"],
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ["ACCEPTED", "CONVERTED", "REJECTED"] },
      },
      _count: { id: true },
    });
    const won = groups
      .filter((g) => g.status === "ACCEPTED" || g.status === "CONVERTED")
      .reduce((sum, g) => sum + g._count.id, 0);
    const lost = groups.find((g) => g.status === "REJECTED");
    const lostCount = lost?._count.id || 0;
    return {
      won,
      lost: lostCount,
      totalDecided: won + lostCount,
      winRate: won + lostCount > 0 ? (won / (won + lostCount)) * 100 : 0,
    };
  }

  private async getHistoricalAverageRevenue(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await prisma.salesOrder.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        status: { notIn: ["DRAFT", "CANCELLED"] },
        orderDate: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });
    return Number(result._sum.totalAmount || 0);
  }

  private getCurrentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
  }

  private getPastPeriod(offset: number): string {
    const d = new Date();
    const totalMonths = d.getFullYear() * 12 + d.getMonth() - offset * 3;
    const year = Math.floor(totalMonths / 12);
    const quarter = (totalMonths % 12) / 3 + 1;
    return `${year}-Q${Math.floor(quarter)}`;
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const match = period.match(/^(\d{4})-Q([1-4])$/);
    if (!match) {
      const d = new Date();
      const q = Math.floor(d.getMonth() / 3) + 1;
      return {
        startDate: new Date(d.getFullYear(), (q - 1) * 3, 1),
        endDate: new Date(d.getFullYear(), q * 3, 0, 23, 59, 59, 999),
      };
    }
    const year = parseInt(match[1]!, 10);
    const quarter = parseInt(match[2]!, 10);
    return {
      startDate: new Date(year, (quarter - 1) * 3, 1),
      endDate: new Date(year, quarter * 3, 0, 23, 59, 59, 999),
    };
  }
}
