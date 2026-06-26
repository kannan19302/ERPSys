import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class DemandPlanningService {

  async generateForecast(
    tenantId: string,
    productId: string,
    options: { periods?: number; smoothingFactor?: number } = {},
  ) {
    const periods = options.periods || 6;
    const alpha = options.smoothingFactor || 0.3;

    // Get historical sales data
    const salesHistory = await prisma.salesOrder.findMany({
      where: { tenantId, deletedAt: null, status: { in: ['CONFIRMED', 'DELIVERED'] } },
      include: { lineItems: { where: { productId } } },
      orderBy: { orderDate: 'asc' },
    });

    // Aggregate by month
    const monthlyDemand = new Map<string, number>();
    for (const order of salesHistory) {
      const monthKey = new Date(order.orderDate).toISOString().slice(0, 7);
      const qty = order.lineItems.reduce((s, li) => s + Number(li.quantity), 0);
      monthlyDemand.set(monthKey, (monthlyDemand.get(monthKey) || 0) + qty);
    }

    const historicalData = [...monthlyDemand.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, quantity]) => ({ month, quantity }));

    if (historicalData.length === 0) {
      return { productId, historicalData: [], forecast: [], method: 'EXPONENTIAL_SMOOTHING', message: 'No historical data available' };
    }

    // Exponential smoothing forecast
    let smoothed = historicalData[0]!.quantity;
    const forecast: Array<{ month: string; predicted: number; confidence: { low: number; high: number } }> = [];

    for (const point of historicalData) {
      smoothed = alpha * point.quantity + (1 - alpha) * smoothed;
    }

    const lastMonth = new Date(historicalData[historicalData.length - 1]!.month + '-01');
    const variance = historicalData.length > 1
      ? Math.sqrt(historicalData.reduce((s, p) => s + Math.pow(p.quantity - smoothed, 2), 0) / historicalData.length)
      : smoothed * 0.2;

    for (let i = 1; i <= periods; i++) {
      const futureMonth = new Date(lastMonth);
      futureMonth.setMonth(futureMonth.getMonth() + i);
      const predicted = Math.round(smoothed);

      forecast.push({
        month: futureMonth.toISOString().slice(0, 7),
        predicted,
        confidence: {
          low: Math.max(0, Math.round(predicted - 1.96 * variance)),
          high: Math.round(predicted + 1.96 * variance),
        },
      });
    }

    return {
      productId,
      method: 'EXPONENTIAL_SMOOTHING',
      smoothingFactor: alpha,
      historicalData,
      forecast,
    };
  }

  async getReorderSuggestions(tenantId: string) {
    const items = await prisma.inventoryItem.findMany({
      where: { tenantId },
      include: { product: true, warehouse: true },
    });

    const suggestions = items
      .filter((item) => {
        const onHand = Number(item.quantity);
        const reorderPoint = Number(item.reorderPoint || 0);
        return reorderPoint > 0 && onHand <= reorderPoint;
      })
      .map((item) => ({
        productId: item.productId,
        productName: item.product?.name,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name,
        currentStock: Number(item.quantity),
        reorderPoint: Number(item.reorderPoint),
        suggestedQty: Number(item.reorderQty || item.reorderPoint),
        urgency: Number(item.quantity) === 0 ? 'CRITICAL' : Number(item.quantity) < Number(item.reorderPoint) * 0.5 ? 'HIGH' : 'MEDIUM',
      }));

    return {
      totalSuggestions: suggestions.length,
      critical: suggestions.filter((s) => s.urgency === 'CRITICAL').length,
      suggestions: suggestions.sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
        return (order[a.urgency as keyof typeof order] || 2) - (order[b.urgency as keyof typeof order] || 2);
      }),
    };
  }
}
