import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SupplyChainAnalyticsService {
  async getDashboard(tenantId: string) {
    const [shipments, inbound, outbound, carriers, exceptions, returns] = await Promise.all([
      prisma.shipment.findMany({ where: { tenantId } }),
      prisma.inboundShipment.findMany({ where: { tenantId } }),
      prisma.outboundShipment.findMany({ where: { tenantId } }),
      prisma.shippingCarrier.findMany({ where: { tenantId } }),
      prisma.shipmentException.findMany({ where: { tenantId } }),
      prisma.vendorReturnShipment.findMany({ where: { tenantId } }),
    ]);

    const totalShipments = shipments.length + inbound.length + outbound.length;
    const inTransit =
      shipments.filter(s => s.status === 'IN_TRANSIT').length +
      inbound.filter(s => s.status === 'IN_TRANSIT').length +
      outbound.filter(s => s.status === 'IN_TRANSIT').length;
    const delivered =
      shipments.filter(s => s.status === 'DELIVERED').length +
      inbound.filter(s => s.status === 'COMPLETE').length +
      outbound.filter(s => s.status === 'DELIVERED').length;
    const totalWeight = [...shipments, ...inbound, ...outbound]
      .reduce((sum, s) => sum + Number((s as any).weight || (s as any).totalWeight || 0), 0);
    const openExceptions = exceptions.filter(e => e.status === 'OPEN').length;
    const pendingReturns = returns.filter(r => r.status === 'PENDING' || r.status === 'PACKED').length;

    return {
      totalShipments,
      inTransit,
      delivered,
      totalWeight,
      activeCarriers: carriers.filter(c => c.isActive).length,
      openExceptions,
      pendingReturns,
      totalCarriers: carriers.length,
      totalReturns: returns.length,
    };
  }

  async getCarrierPerformance(tenantId: string) {
    const carriers = await prisma.shippingCarrier.findMany({ where: { tenantId } });
    const inboundShipments = await prisma.inboundShipment.findMany({ where: { tenantId } });
    const outboundShipments = await prisma.outboundShipment.findMany({ where: { tenantId } });

    const allShipments = [...inboundShipments, ...outboundShipments];
    const carrierMap = new Map(carriers.map(c => [c.id, c.name]));

    const perfMap = new Map<string, { total: number; delivered: number; onTime: number }>();
    for (const s of allShipments) {
      if (!(s as any).carrierId) continue;
      const key = (s as any).carrierId;
      if (!perfMap.has(key)) perfMap.set(key, { total: 0, delivered: 0, onTime: 0 });
      const p = perfMap.get(key)!;
      p.total++;
      if (s.status === 'DELIVERED' || s.status === 'COMPLETE' || s.status === 'COMPLETED') {
        p.delivered++;
        if ((s as any).arrivedAt && (s as any).expectedArrival) {
          const actual = new Date((s as any).arrivedAt).getTime();
          const expected = new Date((s as any).expectedArrival).getTime();
          if (actual <= expected) p.onTime++;
        }
        if ((s as any).actualDelivery && (s as any).estimatedDelivery) {
          const actual = new Date((s as any).actualDelivery).getTime();
          const expected = new Date((s as any).estimatedDelivery).getTime();
          if (actual <= expected) p.onTime++;
        }
      }
    }

    return Array.from(perfMap.entries()).map(([carrierId, stats]) => ({
      carrierId,
      carrierName: carrierMap.get(carrierId) || 'Unknown',
      ...stats,
      onTimeRate: stats.delivered > 0 ? Math.round((stats.onTime / stats.delivered) * 100) : 0,
    }));
  }

  async getOnTimeDelivery(tenantId: string) {
    const outbound = await prisma.outboundShipment.findMany({ where: { tenantId } });
    const delivered = outbound.filter(s =>
      s.status === 'DELIVERED' && (s as any).actualDelivery && (s as any).estimatedDelivery
    );
    const onTime = delivered.filter(s => {
      const actual = new Date((s as any).actualDelivery).getTime();
      const expected = new Date((s as any).estimatedDelivery).getTime();
      return actual <= expected;
    });
    const late = delivered.filter(s => {
      const actual = new Date((s as any).actualDelivery).getTime();
      const expected = new Date((s as any).estimatedDelivery).getTime();
      return actual > expected;
    });

    return {
      totalDelivered: delivered.length,
      onTime: onTime.length,
      late: late.length,
      onTimeRate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 0,
    };
  }

  async getCostAnalysis(tenantId: string) {
    const shipments = await prisma.shipment.findMany({ where: { tenantId, shippingCost: { not: null } } });
    const totalShippingCost = shipments.reduce((sum, s) => sum + Number(s.shippingCost), 0);
    const avgCostPerShipment = shipments.length > 0 ? totalShippingCost / shipments.length : 0;

    return {
      totalShippingCost,
      avgCostPerShipment: Math.round(avgCostPerShipment * 100) / 100,
      shipmentCount: shipments.length,
      currency: shipments[0]?.currency || 'USD',
    };
  }

  async getLeadTime(tenantId: string) {
    const inbound = await prisma.inboundShipment.findMany({
      where: { tenantId, status: 'COMPLETE' },
    });

    const leadTimes = inbound
      .filter(s => s.expectedArrival && s.arrivedAt)
      .map(s => {
        const diffMs = s.arrivedAt!.getTime() - s.expectedArrival!.getTime();
        return { id: s.id, diffDays: Math.round(diffMs / (1000 * 60 * 60 * 24)) };
      });

    const totalLeadDays = leadTimes.reduce((sum, l) => sum + l.diffDays, 0);
    const avgLeadTime = leadTimes.length > 0 ? Math.round((totalLeadDays / leadTimes.length) * 10) / 10 : 0;
    const early = leadTimes.filter(l => l.diffDays < 0).length;
    const onTime = leadTimes.filter(l => l.diffDays === 0).length;
    const late = leadTimes.filter(l => l.diffDays > 0).length;

    return { totalTracked: leadTimes.length, avgLeadTimeDays: avgLeadTime, early, onTime, late };
  }
}
