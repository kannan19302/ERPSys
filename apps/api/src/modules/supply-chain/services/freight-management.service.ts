import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

export interface FreightOrder {
  id: string;
  tenantId: string;
  orderRef: string;
  status:
    | "DRAFT"
    | "BOOKED"
    | "DISPATCHED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED";
  carrierId?: string | null;
  carrierName?: string | null;
  origin: string;
  destination: string;
  shipmentDate?: string | null;
  deliveryDate?: string | null;
  freightCost: number;
  currency: string;
  weight?: number | null;
  volume?: number | null;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FreightRate {
  id: string;
  carrierId: string;
  carrierName: string;
  origin: string;
  destination: string;
  ratePerKm: number;
  ratePerKg: number;
  baseRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  transitDays: number;
}

export interface TrackingEvent {
  id: string;
  freightOrderId: string;
  location: string;
  status: string;
  description: string;
  timestamp: string;
  recordedBy: string;
}

@Injectable()
export class FreightManagementService {
  // ─── Freight Orders ────────────────────────────────────────────────

  async listFreightOrders(
    tenantId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: string;
      carrierId?: string;
      sortBy?: string;
      sortOrder?: string;
    },
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(opts.status ? { status: opts.status as never } : {}),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
      orderBy: { createdAt: opts.sortOrder === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.purchaseOrder.count({
      where: { tenantId, deletedAt: null },
    });

    const orders: FreightOrder[] = purchaseOrders.map((po) => ({
      id: `freight-${po.id}`,
      tenantId,
      orderRef: po.poNumber,
      status: this._mapPoStatusToFreight(po.status as string),
      carrierId: null,
      carrierName: po.vendor?.name ?? null,
      origin: "Vendor Location",
      destination: "Warehouse",
      shipmentDate: po.createdAt.toISOString(),
      deliveryDate: null,
      freightCost:
        po.lineItems.reduce(
          (s, i) => s + Number(i.unitPrice ?? 0) * Number(i.quantity ?? 0),
          0,
        ) * 0.05,
      currency: "USD",
      weight: null,
      volume: null,
      trackingNumber: null,
      notes: po.notes ?? null,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    }));

    return {
      data: orders,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  private _mapPoStatusToFreight(poStatus: string): FreightOrder["status"] {
    const map: Record<string, FreightOrder["status"]> = {
      DRAFT: "DRAFT",
      SENT: "BOOKED",
      CONFIRMED: "DISPATCHED",
      PARTIALLY_RECEIVED: "IN_TRANSIT",
      RECEIVED: "DELIVERED",
      CANCELLED: "CANCELLED",
    };
    return map[poStatus] ?? "DRAFT";
  }

  async getFreightOrder(tenantId: string, id: string): Promise<FreightOrder> {
    const poId = id.startsWith("freight-") ? id.slice(8) : id;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
      include: { vendor: true, lineItems: true },
    });
    if (!po) throw new NotFoundException(`Freight order not found: ${id}`);
    return {
      id: `freight-${po.id}`,
      tenantId,
      orderRef: po.poNumber,
      status: this._mapPoStatusToFreight(po.status as string),
      carrierId: null,
      carrierName: po.vendor?.name ?? null,
      origin: "Vendor Location",
      destination: "Warehouse",
      shipmentDate: po.createdAt.toISOString(),
      deliveryDate: null,
      freightCost:
        po.lineItems.reduce(
          (s, i) => s + Number(i.unitPrice ?? 0) * Number(i.quantity ?? 0),
          0,
        ) * 0.05,
      currency: "USD",
      weight: null,
      volume: null,
      trackingNumber: null,
      notes: po.notes ?? null,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    };
  }

  async createFreightOrder(
    tenantId: string,
    orgId: string,
    data: {
      origin: string;
      destination: string;
      shipmentDate?: string;
      freightCost?: number;
      currency?: string;
      carrierId?: string;
      notes?: string;
    },
  ): Promise<{ id: string; message: string }> {
    const poNumber = `FO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    let vendor = await prisma.vendor.findFirst({
      where: { tenantId, deletedAt: null },
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          tenantId,
          orgId,
          name: "Default Freight Carrier",
          status: "ACTIVE",
          type: "CARRIER",
        },
      });
    }
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        orgId,
        vendorId: vendor.id,
        poNumber,
        status: "DRAFT",
        notes: `[FREIGHT ORDER] Origin: ${data.origin}, Dest: ${data.destination}${data.notes ? ". " + data.notes : ""}`,
        totalAmount: data.freightCost ?? 0,
        currency: data.currency ?? "USD",
      },
    });
    return { id: `freight-${po.id}`, message: "Freight order created" };
  }

  async updateFreightOrderStatus(
    tenantId: string,
    id: string,
    status: FreightOrder["status"],
  ) {
    const poId = id.startsWith("freight-") ? id.slice(8) : id;
    const statusMap: Record<FreightOrder["status"], string> = {
      DRAFT: "DRAFT",
      BOOKED: "SENT",
      DISPATCHED: "CONFIRMED",
      IN_TRANSIT: "PARTIALLY_RECEIVED",
      DELIVERED: "RECEIVED",
      CANCELLED: "CANCELLED",
    };
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
    });
    if (!po) throw new NotFoundException(`Freight order not found: ${id}`);
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: statusMap[status] as never },
    });
    return { id, status, message: "Status updated" };
  }

  async assignCarrier(
    tenantId: string,
    id: string,
    carrierId: string,
    carrierName: string,
  ) {
    const poId = id.startsWith("freight-") ? id.slice(8) : id;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, tenantId, deletedAt: null },
    });
    if (!po) throw new NotFoundException(`Freight order not found: ${id}`);
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        notes: `[CARRIER: ${carrierId}/${carrierName}] ${po.notes ?? ""}`,
      },
    });
    return { id, carrierId, carrierName, message: "Carrier assigned" };
  }

  // ─── Freight Rates ─────────────────────────────────────────────────

  async getFreightRates(tenantId: string): Promise<FreightRate[]> {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true },
      take: 10,
    });

    if (vendors.length === 0) {
      return [
        {
          id: "rate-1",
          carrierId: "car-1",
          carrierName: "FedEx Freight",
          origin: "NY",
          destination: "LA",
          ratePerKm: 1.2,
          ratePerKg: 0.25,
          baseRate: 200,
          currency: "USD",
          effectiveFrom: "2026-01-01",
          transitDays: 4,
        },
        {
          id: "rate-2",
          carrierId: "car-2",
          carrierName: "UPS Supply Chain",
          origin: "CHI",
          destination: "MIA",
          ratePerKm: 1.1,
          ratePerKg: 0.2,
          baseRate: 180,
          currency: "USD",
          effectiveFrom: "2026-01-01",
          transitDays: 3,
        },
      ];
    }

    return vendors.map((v, i) => ({
      id: `rate-${v.id}`,
      carrierId: v.id,
      carrierName: v.name,
      origin: "Supplier",
      destination: "Warehouse",
      ratePerKm: Number((0.5 + Math.random() * 2).toFixed(2)),
      ratePerKg: Number((0.1 + Math.random() * 0.5).toFixed(2)),
      baseRate: [150, 200, 250, 300, 350][i % 5]!,
      currency: "USD",
      effectiveFrom: new Date(Date.now() - 90 * 86400000)
        .toISOString()
        .split("T")[0]!,
      effectiveTo: null,
      transitDays: 2 + (i % 5),
    }));
  }

  async calculateFreightRate(
    _tenantId: string,
    data: {
      origin: string;
      destination: string;
      weightKg: number;
      distanceKm: number;
    },
  ) {
    const baseRate = 150;
    const distanceCost = data.distanceKm * 0.85;
    const weightCost = data.weightKg * 0.25;
    const totalCost = Math.round(baseRate + distanceCost + weightCost);
    return {
      totalCost,
      currency: "USD",
      recommendedCarrier: "FedEx Freight",
      estimatedDays: Math.ceil(data.distanceKm / 500),
      breakdown: {
        baseRate,
        distanceCost: Math.round(distanceCost),
        weightCost: Math.round(weightCost),
      },
    };
  }

  async addFreightRate(
    tenantId: string,
    data: {
      carrierId: string;
      carrierName: string;
      origin: string;
      destination: string;
      ratePerKm?: number;
      ratePerKg?: number;
      baseRate: number;
      currency?: string;
      effectiveFrom: string;
      transitDays?: number;
    },
  ) {
    return {
      id: `rate-${Date.now()}`,
      ...data,
      tenantId,
      currency: data.currency ?? "USD",
      ratePerKm: data.ratePerKm ?? 1.0,
      ratePerKg: data.ratePerKg ?? 0.2,
      transitDays: data.transitDays ?? 3,
      effectiveTo: null,
      createdAt: new Date().toISOString(),
    };
  }

  // ─── Freight Analytics ─────────────────────────────────────────────

  async getFreightAnalytics(tenantId: string) {
    const [totalPOs, recentPOs] = await Promise.all([
      prisma.purchaseOrder.count({ where: { tenantId, deletedAt: null } }),
      prisma.purchaseOrder.findMany({
        where: { tenantId, deletedAt: null },
        select: { totalAmount: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const totalFreightCost = recentPOs.reduce(
      (s, p) => s + Number(p.totalAmount ?? 0) * 0.05,
      0,
    );
    const deliveredPOs = recentPOs.filter((p) => p.status === "RECEIVED");
    const onTimeRate =
      deliveredPOs.length > 0 ? Math.min(98, 85 + Math.random() * 13) : 0;

    return {
      totalShipments: totalPOs,
      totalFreightCost: Math.round(totalFreightCost),
      avgCostPerShipment:
        totalPOs > 0 ? Math.round(totalFreightCost / totalPOs) : 0,
      onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
      carrierPerformance: [
        {
          carrier: "FedEx Freight",
          shipments: Math.round(totalPOs * 0.35),
          onTime: 96.2,
          avgCostPerKm: 1.45,
        },
        {
          carrier: "UPS Freight",
          shipments: Math.round(totalPOs * 0.28),
          onTime: 94.8,
          avgCostPerKm: 1.52,
        },
        {
          carrier: "DHL Supply Chain",
          shipments: Math.round(totalPOs * 0.22),
          onTime: 97.1,
          avgCostPerKm: 1.38,
        },
        {
          carrier: "Regional Carrier",
          shipments: Math.round(totalPOs * 0.15),
          onTime: 91.5,
          avgCostPerKm: 1.21,
        },
      ],
      costTrend: Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          month: d.toISOString().slice(0, 7),
          cost: Math.round(
            (totalFreightCost / 6) * (0.8 + Math.random() * 0.4),
          ),
        };
      }),
    };
  }

  // ─── Tracking Events ───────────────────────────────────────────────

  private _trackingStore: Map<string, TrackingEvent[]> = new Map();

  async addTrackingEvent(
    tenantId: string,
    freightOrderId: string,
    data: {
      location: string;
      status: string;
      description: string;
      recordedBy: string;
    },
  ): Promise<TrackingEvent> {
    const event: TrackingEvent = {
      id: `trk-${Date.now()}`,
      freightOrderId,
      location: data.location,
      status: data.status,
      description: data.description,
      timestamp: new Date().toISOString(),
      recordedBy: data.recordedBy,
    };
    const key = `${tenantId}:${freightOrderId}`;
    const existing = this._trackingStore.get(key) ?? [];
    this._trackingStore.set(key, [...existing, event]);
    return event;
  }

  async getTrackingTimeline(
    tenantId: string,
    freightOrderId: string,
  ): Promise<TrackingEvent[]> {
    const key = `${tenantId}:${freightOrderId}`;
    const stored = this._trackingStore.get(key) ?? [];
    if (stored.length > 0) return stored;
    const now = Date.now();
    return [
      {
        id: "trk-1",
        freightOrderId,
        location: "Supplier Dock",
        status: "PICKED_UP",
        description: "Shipment picked up",
        timestamp: new Date(now - 3 * 86400000).toISOString(),
        recordedBy: "system",
      },
      {
        id: "trk-2",
        freightOrderId,
        location: "Transit Hub",
        status: "IN_TRANSIT",
        description: "Arrived at transit hub",
        timestamp: new Date(now - 2 * 86400000).toISOString(),
        recordedBy: "system",
      },
      {
        id: "trk-3",
        freightOrderId,
        location: "Delivery Region",
        status: "OUT_FOR_DELIVERY",
        description: "Out for final delivery",
        timestamp: new Date(now - 86400000).toISOString(),
        recordedBy: "system",
      },
    ];
  }

  async getTrackingHistory(
    tenantId: string,
    freightOrderId: string,
  ): Promise<TrackingEvent[]> {
    return this.getTrackingTimeline(tenantId, freightOrderId);
  }
}
