import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus =
  | "OPEN"
  | "ACKNOWLEDGED"
  | "MITIGATED"
  | "RESOLVED"
  | "CLOSED";

export interface SupplyRiskEvent {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category:
    | "SUPPLIER_DISRUPTION"
    | "LOGISTICS"
    | "GEOPOLITICAL"
    | "DEMAND_SHOCK"
    | "QUALITY"
    | "CAPACITY"
    | "NATURAL_DISASTER"
    | "OTHER";
  severity: RiskSeverity;
  status: RiskStatus;
  affectedSupplierId?: string | null;
  affectedSupplierName?: string | null;
  estimatedImpact: number;
  currency: string;
  reportedBy: string;
  acknowledgedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkNode {
  id: string;
  type:
    | "PLANT"
    | "DISTRIBUTION_CENTER"
    | "SUPPLIER"
    | "CUSTOMER"
    | "PORT"
    | "WAREHOUSE";
  name: string;
  location: string;
  country: string;
  capacity?: number | null;
  isActive: boolean;
}

export interface DisruptionAlert {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  isAcknowledged: boolean;
  acknowledgedBy?: string | null;
  createdAt: string;
}

@Injectable()
export class SupplyNetworkRiskService {
  private _riskEvents: Map<string, SupplyRiskEvent[]> = new Map();
  private _alerts: Map<string, DisruptionAlert[]> = new Map();

  // ─── Risk Events ───────────────────────────────────────────────────

  async listRiskEvents(tenantId: string): Promise<SupplyRiskEvent[]> {
    const stored = this._riskEvents.get(tenantId) ?? [];
    if (stored.length > 0) return stored;

    // Seed with synthetic data derived from real vendor counts
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
      take: 3,
    });
    const synthetic: SupplyRiskEvent[] = vendors.map((v, i) => ({
      id: `risk-${v.id}`,
      tenantId,
      title:
        i === 0
          ? "Raw Material Lead Time Spike"
          : i === 1
            ? "Port Congestion Delay"
            : "Supplier Financial Stress Warning",
      description: `Risk event affecting ${v.name} operations and supply chain flow`,
      category:
        i === 0 ? "SUPPLIER_DISRUPTION" : i === 1 ? "LOGISTICS" : "CAPACITY",
      severity: i === 0 ? "HIGH" : i === 1 ? "MEDIUM" : "LOW",
      status: "OPEN",
      affectedSupplierId: v.id,
      affectedSupplierName: v.name,
      estimatedImpact: 15000 * (i + 1),
      currency: "USD",
      reportedBy: "SCM Risk Engine",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    this._riskEvents.set(tenantId, synthetic);
    return synthetic;
  }

  async getRiskEvent(
    tenantId: string,
    eventId: string,
  ): Promise<SupplyRiskEvent> {
    const events = await this.listRiskEvents(tenantId);
    const event = events.find((e) => e.id === eventId);
    if (!event) throw new NotFoundException(`Risk event not found: ${eventId}`);
    return event;
  }

  async createRiskEvent(
    tenantId: string,
    data: {
      title: string;
      description: string;
      category:
        | "SUPPLIER_DISRUPTION"
        | "LOGISTICS"
        | "GEOPOLITICAL"
        | "DEMAND_SHOCK"
        | "QUALITY"
        | "CAPACITY"
        | "NATURAL_DISASTER"
        | "OTHER";
      severity: RiskSeverity;
      affectedSupplierId?: string;
      estimatedImpact?: number;
      currency?: string;
      reportedBy: string;
    },
  ): Promise<SupplyRiskEvent> {
    const events = await this.listRiskEvents(tenantId);
    let supplierName: string | null = null;
    if (data.affectedSupplierId) {
      const v = await prisma.vendor.findFirst({
        where: { id: data.affectedSupplierId, tenantId, deletedAt: null },
      });
      supplierName = v?.name ?? null;
    }

    const newEvent: SupplyRiskEvent = {
      id: `risk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: "OPEN",
      affectedSupplierId: data.affectedSupplierId ?? null,
      affectedSupplierName: supplierName,
      estimatedImpact: data.estimatedImpact ?? 0,
      currency: data.currency ?? "USD",
      reportedBy: data.reportedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.unshift(newEvent);
    this._riskEvents.set(tenantId, events);
    return newEvent;
  }

  async acknowledgeRiskEvent(
    tenantId: string,
    eventId: string,
    userId: string,
  ): Promise<SupplyRiskEvent> {
    const event = await this.getRiskEvent(tenantId, eventId);
    event.status = "ACKNOWLEDGED";
    event.acknowledgedBy = userId;
    event.updatedAt = new Date().toISOString();
    return event;
  }

  async updateRiskStatus(
    tenantId: string,
    eventId: string,
    status: RiskStatus,
  ): Promise<SupplyRiskEvent> {
    const event = await this.getRiskEvent(tenantId, eventId);
    event.status = status;
    event.updatedAt = new Date().toISOString();
    return event;
  }

  async reportRiskEvent(
    tenantId: string,
    data: {
      title: string;
      description: string;
      category:
        | "SUPPLIER_DISRUPTION"
        | "LOGISTICS"
        | "GEOPOLITICAL"
        | "DEMAND_SHOCK"
        | "QUALITY"
        | "CAPACITY"
        | "NATURAL_DISASTER"
        | "OTHER";
      severity: RiskSeverity;
      affectedSupplierId?: string;
      estimatedImpact?: number;
      currency?: string;
      reportedBy: string;
    },
  ) {
    return this.createRiskEvent(tenantId, data);
  }

  async updateRiskEventStatus(
    tenantId: string,
    eventId: string,
    status: RiskStatus,
    userId: string,
  ): Promise<SupplyRiskEvent> {
    const event = await this.getRiskEvent(tenantId, eventId);
    event.status = status;
    event.acknowledgedBy = userId;
    event.updatedAt = new Date().toISOString();
    return event;
  }

  async getRiskImpact(tenantId: string, eventId: string) {
    const event = await this.getRiskEvent(tenantId, eventId);
    return {
      eventId,
      title: event.title,
      estimatedImpact: event.estimatedImpact,
      currency: event.currency,
      severity: event.severity,
      impactedPurchaseOrdersCount: 3,
      impactedInventoryUnits: 450,
      mitigationRecommendation:
        "Source alternative supply from regional carrier or secondary supplier",
    };
  }

  // ─── Network Mapping ───────────────────────────────────────────────

  async getNetworkNodes(tenantId: string): Promise<NetworkNode[]> {
    const vendors = await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true },
      take: 10,
    });

    const nodes: NetworkNode[] = [
      {
        id: "node-dc-1",
        type: "DISTRIBUTION_CENTER",
        name: "Central Logistics Hub",
        location: "Chicago, IL",
        country: "USA",
        capacity: 100000,
        isActive: true,
      },
      {
        id: "node-plant-1",
        type: "PLANT",
        name: "Primary Manufacturing Facility",
        location: "Detroit, MI",
        country: "USA",
        capacity: 50000,
        isActive: true,
      },
      {
        id: "node-port-1",
        type: "PORT",
        name: "Port of Long Beach",
        location: "Long Beach, CA",
        country: "USA",
        capacity: null,
        isActive: true,
      },
    ];

    vendors.forEach((v) => {
      nodes.push({
        id: `node-v-${v.id}`,
        type: "SUPPLIER",
        name: v.name,
        location: "Vendor Location",
        country: "Global",
        capacity: 10000,
        isActive: true,
      });
    });

    return nodes;
  }

  async getNetworkMap(tenantId: string) {
    const nodes = await this.getNetworkNodes(tenantId);
    const edges = nodes.slice(1).map((n, i) => ({
      id: `edge-${i}`,
      source: n.id,
      target: nodes[0]!.id,
      volume: 5000 + i * 1000,
      status: "ACTIVE",
    }));
    return { nodes, edges };
  }

  async addNetworkNode(
    tenantId: string,
    data: {
      type:
        | "PLANT"
        | "DISTRIBUTION_CENTER"
        | "SUPPLIER"
        | "CUSTOMER"
        | "PORT"
        | "WAREHOUSE";
      name: string;
      location: string;
      country?: string;
      capacity?: number;
    },
  ) {
    return {
      id: `node-${Date.now()}`,
      tenantId,
      ...data,
      country: data.country ?? "USA",
      capacity: data.capacity ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }

  async getDisruptionAlerts(tenantId: string): Promise<DisruptionAlert[]> {
    const stored = this._alerts.get(tenantId) ?? [];
    if (stored.length > 0) return stored;

    const initial: DisruptionAlert[] = [
      {
        id: "alert-1",
        title: "Tier-1 Supplier Bottleneck",
        description:
          "Components shipment delayed by 5 days due to factory maintenance",
        severity: "HIGH",
        isAcknowledged: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "alert-2",
        title: "Severe Weather Warning - Midwest Corridor",
        description:
          "Freight transit delays expected across Illinois & Indiana",
        severity: "MEDIUM",
        isAcknowledged: false,
        createdAt: new Date().toISOString(),
      },
    ];

    this._alerts.set(tenantId, initial);
    return initial;
  }

  async acknowledgeDisruptionAlert(
    tenantId: string,
    alertId: string,
    userId: string,
  ): Promise<DisruptionAlert> {
    return this.acknowledgeAlert(tenantId, alertId, userId);
  }

  async getSupplyResilience(tenantId: string) {
    return this.getRiskMetrics(tenantId);
  }

  async getAlternativeSuppliers(tenantId: string, categoryId?: string) {
    return this.getAlternativeSources(tenantId, categoryId);
  }

  async acknowledgeAlert(
    tenantId: string,
    alertId: string,
    userId: string,
  ): Promise<DisruptionAlert> {
    const alerts = await this.getDisruptionAlerts(tenantId);
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) throw new NotFoundException(`Alert not found: ${alertId}`);
    alert.isAcknowledged = true;
    alert.acknowledgedBy = userId;
    return alert;
  }

  // ─── Supply Resilience & Risk Metrics ─────────────────────────────

  async getRiskMetrics(tenantId: string) {
    const [events, alerts, nodes] = await Promise.all([
      this.listRiskEvents(tenantId),
      this.getDisruptionAlerts(tenantId),
      this.getNetworkNodes(tenantId),
    ]);

    const activeEvents = events.filter(
      (e) => e.status === "OPEN" || e.status === "ACKNOWLEDGED",
    );
    const criticalCount = activeEvents.filter(
      (e) => e.severity === "HIGH" || e.severity === "CRITICAL",
    ).length;
    const totalImpact = activeEvents.reduce((s, e) => s + e.estimatedImpact, 0);

    const [vendorCount, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.vendor.count({
        where: { tenantId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.inventoryItem.count({
        where: { tenantId, reorderPoint: { gt: 0 } },
      }),
      prisma.inventoryItem.count({ where: { tenantId, quantity: 0 } }),
    ]);

    // Composite resilience score (0-100)
    const baseScore = 85;
    const penalty =
      criticalCount * 10 +
      (outOfStockCount > 0 ? 15 : 0) +
      (lowStockCount > 5 ? 10 : 0);
    const resilienceScore = Math.max(20, Math.min(100, baseScore - penalty));

    return {
      resilienceScore,
      riskLevel:
        resilienceScore >= 80
          ? "LOW"
          : resilienceScore >= 50
            ? "MEDIUM"
            : "HIGH",
      activeRiskEventsCount: activeEvents.length,
      criticalEventsCount: criticalCount,
      totalFinancialRisk: totalImpact,
      unacknowledgedAlertsCount: alerts.filter((a) => !a.isAcknowledged).length,
      networkNodeCount: nodes.length,
      supplierConcentrationRisk:
        vendorCount < 3 ? "HIGH" : vendorCount < 8 ? "MEDIUM" : "LOW",
    };
  }

  async getAlternativeSources(tenantId: string, _categoryId?: string) {
    const vendors = await prisma.vendor.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 5,
    });

    return vendors.map((v, i) => ({
      vendorId: v.id,
      vendorName: v.name,
      contactEmail: v.email ?? null,
      contactPhone: v.phone ?? null,
      capacityRating: i === 0 ? "HIGH" : "MEDIUM",
      reliabilityScore: Math.round((80 + Math.random() * 20) * 10) / 10,
      leadTimeDays: 5 + i * 2,
      isPrimary: i === 0,
    }));
  }
}
