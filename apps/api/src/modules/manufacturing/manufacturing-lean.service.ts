// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ManufacturingLeanService {
  async createKanbanBoard(
    tenantId: string,
    data: {
      name: string;
      code: string;
      boardType?: string;
      columns?: string[];
      wipLimits?: Record<string, number>;
    },
  ) {
    return prisma.kanbanBoard.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        boardType: data.boardType || "PRODUCTION",
        columns: data.columns || ["To Do", "In Progress", "Done"],
        wipLimits: data.wipLimits || {},
      },
    });
  }

  async getKanbanBoards(tenantId: string) {
    return prisma.kanbanBoard.findMany({
      where: { tenantId },
      include: { cards: { orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async moveKanbanCard(
    tenantId: string,
    cardId: string,
    data: { columnName: string; position?: number },
  ) {
    const card = await prisma.kanbanCard.findFirst({
      where: { id: cardId, tenantId },
    });
    if (!card) throw new NotFoundException("Kanban card not found");
    return prisma.kanbanCard.update({
      where: { id: cardId },
      data: {
        columnName: data.columnName,
        position: data.position ?? card.position,
      },
    });
  }

  async addKanbanCard(
    tenantId: string,
    data: {
      boardId: string;
      title: string;
      description?: string;
      cardType?: string;
      productId?: string;
      quantity?: number;
      priority?: string;
      assignedTo?: string;
      dueDate?: string;
    },
  ) {
    const board = await prisma.kanbanBoard.findFirst({
      where: { id: data.boardId, tenantId },
    });
    if (!board) throw new NotFoundException("Kanban board not found");
    const cardCount = await prisma.kanbanCard.count({
      where: { boardId: data.boardId },
    });
    const columns = board.columns as any;
    const firstColumn: string =
      Array.isArray(columns) && columns.length > 0
        ? String(columns[0])
        : "To Do";
    return prisma.kanbanCard.create({
      data: {
        tenantId,
        boardId: data.boardId,
        cardNo: `KCB-${board.code}-${cardCount + 1}`,
        title: data.title,
        description: data.description,
        cardType: data.cardType || "PRODUCTION",
        columnName: firstColumn,
        productId: data.productId ?? undefined,
        quantity: data.quantity ?? undefined,
        priority: data.priority || "MEDIUM",
        assignedTo: data.assignedTo ?? undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      } as any,
    });
  }

  async logImprovementIdea(
    tenantId: string,
    data: {
      title: string;
      description?: string;
      category?: string;
      ideaType?: string;
      benefit?: string;
      estimatedSavings?: number;
      submittedBy?: string;
    },
  ) {
    return prisma.leanImprovement.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        category: data.category || "PROCESS",
        ideaType: data.ideaType || "KAIZEN",
        benefit: data.benefit,
        estimatedSavings: data.estimatedSavings,
        submittedBy: data.submittedBy,
      },
    });
  }

  async getImprovements(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return prisma.leanImprovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async logWaste(
    tenantId: string,
    data: {
      workOrderId?: string;
      wasteType: string;
      description: string;
      quantity?: number;
      impactCost?: number;
      rootCause?: string;
      actionTaken?: string;
      reportedBy?: string;
    },
  ) {
    return prisma.wasteLog.create({
      data: {
        tenantId,
        workOrderId: data.workOrderId,
        wasteType: data.wasteType,
        description: data.description,
        quantity: data.quantity,
        impactCost: data.impactCost,
        rootCause: data.rootCause,
        actionTaken: data.actionTaken,
        reportedBy: data.reportedBy,
      },
    });
  }

  async getWasteAnalysis(tenantId: string) {
    const logs = await prisma.wasteLog.findMany({ where: { tenantId } });
    const byType: Record<string, { count: number; totalCost: number }> = {};
    for (const log of logs) {
      const entry = byType[log.wasteType] || { count: 0, totalCost: 0 };
      entry.count++;
      entry.totalCost += Number(log.impactCost || 0);
      byType[log.wasteType] = entry;
    }
    const totalCost = logs.reduce(
      (sum, l) => sum + Number(l.impactCost || 0),
      0,
    );
    return { totalLogs: logs.length, totalCost, byType };
  }

  async createValueStreamMap(
    tenantId: string,
    data: {
      productId: string;
      mapName: string;
      steps: Array<{
        stepNo: number;
        stepName: string;
        stepType?: string;
        cycleTimeMin?: number;
        changeoverMin?: number;
        uptimePct?: number;
        inventoryQty?: number;
        operators?: number;
        isValueAdd?: boolean;
      }>;
    },
  ) {
    await prisma.valueStreamMapItem.deleteMany({
      where: { tenantId, productId: data.productId, mapName: data.mapName },
    });
    if (data.steps.length > 0) {
      await prisma.valueStreamMapItem.createMany({
        data: data.steps.map((s) => ({
          tenantId,
          productId: data.productId,
          mapName: data.mapName,
          stepNo: s.stepNo,
          stepName: s.stepName,
          stepType: s.stepType || "PROCESS",
          cycleTimeMin: s.cycleTimeMin,
          changeoverMin: s.changeoverMin,
          uptimePct: s.uptimePct,
          inventoryQty: s.inventoryQty,
          operators: s.operators,
          isValueAdd: s.isValueAdd ?? true,
        })),
      });
    }
    return prisma.valueStreamMapItem.findMany({
      where: { tenantId, productId: data.productId, mapName: data.mapName },
      orderBy: { stepNo: "asc" },
    });
  }

  async getValueStreamMaps(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    const items = await prisma.valueStreamMapItem.findMany({
      where,
      orderBy: [{ mapName: "asc" }, { stepNo: "asc" }],
    });
    const maps: Record<string, Array<(typeof items)[0]>> = {};
    for (const item of items) {
      const key = `${item.productId}::${item.mapName}`;
      if (!maps[key]) maps[key] = [];
      maps[key].push(item);
    }
    return Object.entries(maps).map(([key, steps]) => {
      const [productId, mapName] = key.split("::");
      const totalLeadTime = steps.reduce(
        (sum, s) => sum + Number(s.cycleTimeMin || 0),
        0,
      );
      const valueAddTime = steps
        .filter((s) => s.isValueAdd)
        .reduce((sum, s) => sum + Number(s.cycleTimeMin || 0), 0);
      return {
        productId,
        mapName,
        totalLeadTime,
        valueAddTime,
        efficiency:
          totalLeadTime > 0
            ? Math.round((valueAddTime / totalLeadTime) * 100)
            : 0,
        steps,
      };
    });
  }

  async getLeanDashboard(tenantId: string) {
    const [boardCount, improvementCount, wasteCount, wasteAnalysis] =
      await Promise.all([
        prisma.kanbanBoard.count({ where: { tenantId, status: "ACTIVE" } }),
        prisma.leanImprovement.count({ where: { tenantId } }),
        prisma.wasteLog.count({ where: { tenantId } }),
        this.getWasteAnalysis(tenantId),
      ]);
    const implemented = await prisma.leanImprovement.count({
      where: { tenantId, status: "IMPLEMENTED" },
    });
    return {
      activeBoards: boardCount,
      totalImprovements: improvementCount,
      implemented,
      wasteLogs: wasteCount,
      wasteCost: wasteAnalysis.totalCost,
      wasteByType: wasteAnalysis.byType,
    };
  }
}
