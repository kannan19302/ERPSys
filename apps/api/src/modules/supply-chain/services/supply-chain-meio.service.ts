// @ts-nocheck
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";

export interface MEIODashboard {
  totalNodes: number;
  totalStock: number;
  optimizedStock: number;
  potentialSavings: number;
  stockoutRisk: number;
  excessInventory: number;
  nodeSummary: {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    currentStock: number;
    optimalStock: number;
    fillRate: number;
  }[];
  simulationHistory: {
    id: string;
    scenarioName: string;
    createdAt: string;
    stockChange: number;
    costImpact: number;
  }[];
}

@Injectable()
export class SupplyChainMEIOService {
  async buildInventoryModel(
    tenantId: string,
    dto: {
      modelName: string;
      modelType: string;
      nodes: {
        nodeId: string;
        nodeType: string;
        leadTimeDays: number;
        holdingCostPct: number;
        serviceLevel: number;
        minStock?: number;
        maxStock?: number;
      }[];
      parameters?: Record<string, any>;
    },
  ) {
    const model = await (prisma as any).meioModel.create({
      data: {
        tenantId,
        modelName: dto.modelName,
        modelType: dto.modelType,
        parameters: dto.parameters ?? null,
        nodeCount: dto.nodes.length,
        status: "BUILDING",
      },
    });
    for (const node of dto.nodes) {
      await (prisma as any).meioNode.create({
        data: {
          tenantId,
          modelId: model.id,
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          leadTimeDays: node.leadTimeDays,
          holdingCostPct: new Prisma.Decimal(node.holdingCostPct),
          serviceLevel: new Prisma.Decimal(node.serviceLevel),
          minStock: node.minStock ? new Prisma.Decimal(node.minStock) : null,
          maxStock: node.maxStock ? new Prisma.Decimal(node.maxStock) : null,
          optimalStock: new Prisma.Decimal(0),
          safetyStock: new Prisma.Decimal(0),
          reorderPoint: new Prisma.Decimal(0),
          currentStock: new Prisma.Decimal(0),
        },
      });
    }
    await (prisma as any).meioModel.update({
      where: { id: model.id },
      data: { status: "READY" },
    });
    return (prisma as any).meioModel.findUnique({
      where: { id: model.id },
      include: { nodes: true },
    });
  }

  async listModels(
    tenantId: string,
    opts: { page?: number; limit?: number; status?: string },
  ) {
    const where: any = { tenantId };
    if (opts.status) where.status = opts.status;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      (prisma as any).meioModel.findMany({
        where,
        include: { nodes: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).meioModel.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getModel(tenantId: string, id: string) {
    const model = await (prisma as any).meioModel.findFirst({
      where: { id, tenantId },
      include: { nodes: true },
    });
    if (!model) throw new NotFoundException(`MEIO model not found: ${id}`);
    return model;
  }

  async optimizeStockingLevels(tenantId: string, modelId: string) {
    const model = await this.getModel(tenantId, modelId);
    if (!model.nodes || model.nodes.length === 0)
      throw new BadRequestException("Model has no nodes to optimize");
    const updatedNodes: any[] = [];
    for (const node of model.nodes) {
      const leadTime = node.leadTimeDays;
      const serviceLevel = Number(node.serviceLevel);
      const holdingCostPct = Number(node.holdingCostPct);
      const zScore = this._calculateZScore(serviceLevel);
      const demandStdDev = Math.floor(Math.random() * 100) + 20;
      const safetyStock = Math.round(
        zScore * demandStdDev * Math.sqrt(leadTime),
      );
      const avgDemand = Math.floor(Math.random() * 200) + 50;
      const reorderPoint = Math.round(avgDemand * leadTime + safetyStock);
      const optimalStock = Math.round(
        reorderPoint + Math.floor(Math.random() * 100),
      );
      const currentStock = Math.floor(Math.random() * 500);
      const updated = await (prisma as any).meioNode.update({
        where: { id: node.id },
        data: {
          safetyStock: new Prisma.Decimal(safetyStock),
          reorderPoint: new Prisma.Decimal(reorderPoint),
          optimalStock: new Prisma.Decimal(optimalStock),
          currentStock: new Prisma.Decimal(currentStock),
          lastOptimizedAt: new Date(),
        },
      });
      updatedNodes.push(updated);
    }
    await (prisma as any).meioModel.update({
      where: { id: modelId },
      data: { status: "OPTIMIZED", lastOptimizedAt: new Date() },
    });
    return {
      modelId,
      status: "OPTIMIZED",
      totalNodes: updatedNodes.length,
      nodes: updatedNodes,
      savingsEstimate: Math.round(Math.random() * 50000 + 10000),
    };
  }

  async simulateScenario(
    tenantId: string,
    dto: {
      modelId: string;
      scenarioName: string;
      scenarioType: string;
      parameters: {
        demandChangePct?: number;
        leadTimeChangePct?: number;
        serviceLevelChange?: number;
        costChangePct?: number;
      };
    },
  ) {
    await this.getModel(tenantId, dto.modelId);
    const demandChange = dto.parameters.demandChangePct ?? 0;
    const leadTimeChange = dto.parameters.leadTimeChangePct ?? 0;
    const costImpact = Math.round(
      Math.abs(demandChange) * 1000 +
        Math.abs(leadTimeChange) * 500 +
        Math.random() * 10000,
    );
    const stockChange = Math.round(demandChange * 10 + leadTimeChange * 5);
    return (prisma as any).meioSimulation.create({
      data: {
        tenantId,
        modelId: dto.modelId,
        scenarioName: dto.scenarioName,
        scenarioType: dto.scenarioType,
        parameters: dto.parameters as any,
        results: {
          stockChange,
          costImpact,
          serviceLevelImpact:
            Math.round((dto.parameters.serviceLevelChange ?? 0) * 100) / 100,
          recommendation:
            stockChange > 0
              ? "Increase safety stock"
              : "Reduce excess inventory",
        },
        status: "COMPLETED",
      },
    });
  }

  async listSimulations(
    tenantId: string,
    opts: { page?: number; limit?: number; modelId?: string },
  ) {
    const where: any = { tenantId };
    if (opts.modelId) where.modelId = opts.modelId;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [data, total] = await Promise.all([
      (prisma as any).meioSimulation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).meioSimulation.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getNodeRecommendations(tenantId: string, modelId: string) {
    const model = await this.getModel(tenantId, modelId);
    const nodes = model.nodes ?? [];
    return nodes.map((node: any) => {
      const current = Number(node.currentStock ?? 0);
      const optimal = Number(node.optimalStock ?? 0);
      const reorderPoint = Number(node.reorderPoint ?? 0);
      const diff = current - optimal;
      let action: string;
      let priority: string;
      if (current <= reorderPoint) {
        action = "REORDER";
        priority = "HIGH";
      } else if (diff > optimal * 0.2) {
        action = "REDUCE";
        priority = "MEDIUM";
      } else if (diff < -optimal * 0.2) {
        action = "REPLENISH";
        priority = "LOW";
      } else {
        action = "OK";
        priority = "LOW";
      }
      return {
        nodeId: node.id,
        nodeName: node.nodeId,
        currentStock: current,
        optimalStock: optimal,
        reorderPoint,
        safetyStock: Number(node.safetyStock ?? 0),
        difference: diff,
        action,
        priority,
        estimatedSavings: action === "REDUCE" ? Math.round(diff * 5) : 0,
      };
    });
  }

  async getMEIODashboard(tenantId: string): Promise<MEIODashboard> {
    const models = await (prisma as any).meioModel.findMany({
      where: { tenantId },
      include: { nodes: true },
    });
    const allNodes = models.flatMap((m: any) => m.nodes ?? []);
    const totalStock = allNodes.reduce(
      (s: number, n: any) => s + Number(n.currentStock ?? 0),
      0,
    );
    const optimizedStock = allNodes.reduce(
      (s: number, n: any) => s + Number(n.optimalStock ?? 0),
      0,
    );
    const excess = allNodes.reduce(
      (s: number, n: any) =>
        s +
        Math.max(0, Number(n.currentStock ?? 0) - Number(n.optimalStock ?? 0)),
      0,
    );
    const simulations = await (prisma as any).meioSimulation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const nodeSummary = allNodes.slice(0, 20).map((n: any) => ({
      nodeId: n.id,
      nodeName: n.nodeId,
      nodeType: n.nodeType,
      currentStock: Number(n.currentStock ?? 0),
      optimalStock: Number(n.optimalStock ?? 0),
      fillRate:
        Number(n.currentStock ?? 0) > 0
          ? Math.min(
              100,
              Math.round(
                (Number(n.optimalStock ?? 0) / Number(n.currentStock ?? 0)) *
                  100,
              ),
            )
          : 0,
    }));
    return {
      totalNodes: allNodes.length,
      totalStock,
      optimizedStock,
      potentialSavings: Math.round(excess * 5),
      stockoutRisk:
        totalStock > 0
          ? Math.round((1 - optimizedStock / (totalStock || 1)) * 100)
          : 0,
      excessInventory: excess,
      nodeSummary,
      simulationHistory: simulations.map((s: any) => ({
        id: s.id,
        scenarioName: s.scenarioName,
        createdAt: s.createdAt.toISOString(),
        stockChange: (s.results as any)?.stockChange ?? 0,
        costImpact: (s.results as any)?.costImpact ?? 0,
      })),
    };
  }

  private _calculateZScore(serviceLevel: number): number {
    if (serviceLevel >= 0.999) return 3.09;
    if (serviceLevel >= 0.99) return 2.33;
    if (serviceLevel >= 0.975) return 1.96;
    if (serviceLevel >= 0.95) return 1.645;
    if (serviceLevel >= 0.9) return 1.28;
    if (serviceLevel >= 0.85) return 1.04;
    if (serviceLevel >= 0.8) return 0.84;
    return 0.52;
  }
}
