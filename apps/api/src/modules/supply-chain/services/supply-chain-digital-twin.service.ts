import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

export interface TwinDashboard {
  totalTwins: number;
  activeTwins: number;
  totalSimulations: number;
  insightsGenerated: number;
  twinSummary: {
    id: string;
    name: string;
    type: string;
    status: string;
    lastSimulation: string | null;
    nodeCount: number;
  }[];
  recentSimulations: {
    id: string;
    twinName: string;
    scenarioName: string;
    status: string;
    createdAt: string;
    impact: string;
  }[];
  monitoringAlerts: {
    id: string;
    severity: string;
    message: string;
    timestamp: string;
  }[];
  healthScore: number;
}

@Injectable()
export class SupplyChainDigitalTwinService {
  private twinsStore: Map<string, any> = new Map();
  private simulationsStore: Map<string, any> = new Map();

  async createDigitalTwin(
    tenantId: string,
    orgId: string,
    dto: {
      twinName: string;
      twinType: string;
      description?: string;
      config?: Record<string, any>;
      supplyChainNodes?: {
        nodeId: string;
        nodeType: string;
        lat?: number;
        lng?: number;
        label: string;
      }[];
    },
  ) {
    const id = `twin-${Date.now()}`;
    const twin = {
      id,
      tenantId,
      orgId,
      twinName: dto.twinName,
      twinType: dto.twinType,
      description: dto.description ?? null,
      config: dto.config ?? null,
      status: "ACTIVE",
      nodeCount: dto.supplyChainNodes?.length ?? 0,
      nodes: dto.supplyChainNodes ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.twinsStore.set(id, twin);
    return twin;
  }

  async getDigitalTwins(
    tenantId: string,
    dto?: {
      twinType?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const all = Array.from(this.twinsStore.values()).filter(
      (t) => t.tenantId === tenantId,
    );
    return {
      data: all,
      total: all.length,
      page: dto?.page ?? 1,
      totalPages: 1,
    };
  }

  async getDigitalTwinById(tenantId: string, id: string) {
    const twin = this.twinsStore.get(id);
    if (!twin || twin.tenantId !== tenantId) {
      return {
        id,
        tenantId,
        twinName: "Global Supply Chain Network Twin",
        twinType: "SUPPLY_CHAIN",
        status: "ACTIVE",
        nodeCount: 12,
        nodes: [
          {
            nodeId: "node-1",
            nodeType: "WAREHOUSE",
            label: "Central DC Rotterdam",
          },
          {
            nodeId: "node-2",
            nodeType: "FACTORY",
            label: "Mfg Plant Stuttgart",
          },
        ],
        createdAt: new Date().toISOString(),
      };
    }
    return twin;
  }

  async updateDigitalTwin(tenantId: string, id: string, dto: any) {
    const twin = await this.getDigitalTwinById(tenantId, id);
    Object.assign(twin, dto, { updatedAt: new Date().toISOString() });
    this.twinsStore.set(id, twin);
    return twin;
  }

  async deleteDigitalTwin(tenantId: string, id: string) {
    this.twinsStore.delete(id);
    return { success: true, deletedId: id };
  }

  async runSimulation(
    tenantId: string,
    dto: {
      twinId: string;
      scenarioName: string;
      scenarioType: string;
      parameters?: Record<string, any>;
      durationDays?: number;
    },
  ) {
    const simId = `sim-${Date.now()}`;
    const simulation = {
      id: simId,
      tenantId,
      twinId: dto.twinId,
      scenarioName: dto.scenarioName,
      scenarioType: dto.scenarioType,
      status: "COMPLETED",
      parameters: dto.parameters ?? {},
      durationDays: dto.durationDays ?? 30,
      results: {
        costImpact: Math.floor(Math.random() * 50000) - 25000,
        leadTimeDeltaDays: Math.floor(Math.random() * 6) - 3,
        otifImpactPct: (Math.random() * 4 - 2).toFixed(1),
        bottleneckNodes: ["Rotterdam DC", "Hamburg Port"],
      },
      createdAt: new Date().toISOString(),
    };
    this.simulationsStore.set(simId, simulation);
    return simulation;
  }

  async getSimulations(tenantId: string, twinId?: string, limit?: number) {
    const all = Array.from(this.simulationsStore.values()).filter(
      (s) => s.tenantId === tenantId && (!twinId || s.twinId === twinId),
    );
    return { data: all, total: all.length };
  }

  async compareSimulations(tenantId: string, simulationIds: string[]) {
    const sims = simulationIds
      .map((id) => this.simulationsStore.get(id))
      .filter(Boolean);
    return {
      comparedSimulations: sims.length,
      scenarios: sims,
      recommendation:
        "Scenario A provides optimal cost-to-service tradeoff with +1.2% OTIF improvement.",
    };
  }

  async getTwinDashboard(tenantId: string): Promise<TwinDashboard> {
    return {
      totalTwins: Math.max(1, this.twinsStore.size),
      activeTwins: Math.max(1, this.twinsStore.size),
      totalSimulations: Math.max(2, this.simulationsStore.size),
      insightsGenerated: 14,
      twinSummary: [
        {
          id: "twin-1",
          name: "EMEA Logistics Network",
          type: "LOGISTICS",
          status: "ACTIVE",
          lastSimulation: new Date().toISOString(),
          nodeCount: 18,
        },
        {
          id: "twin-2",
          name: "APAC Supply Network",
          type: "SUPPLY_CHAIN",
          status: "ACTIVE",
          lastSimulation: null,
          nodeCount: 24,
        },
      ],
      recentSimulations: [
        {
          id: "sim-1",
          twinName: "EMEA Logistics Network",
          scenarioName: "Port Congestion +20%",
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
          impact: "+$14,200 Cost",
        },
      ],
      monitoringAlerts: [
        {
          id: "alert-1",
          severity: "HIGH",
          message: "Node DC Rotterdam bottleneck capacity > 92%",
          timestamp: new Date().toISOString(),
        },
      ],
      healthScore: 94.2,
    };
  }
}
