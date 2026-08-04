import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

@Injectable()
export class PpmDeepExpansionService {
  private get prisma() {
    return prisma as any;
  }

  // 1. Portfolio Management (PPM)
  async createPortfolio(tenantId: string, data: any) {
    return this.prisma.ppmPortfolio.create({
      data: {
        ...data,
        tenantId,
        ppmProjects: data.ppmProjects
          ? {
              createMany: {
                data: data.ppmProjects.map((p: any) => ({ ...p, tenantId })),
              },
            }
          : undefined,
      },
      include: { ppmProjects: true },
    });
  }

  async getPortfolios(tenantId: string) {
    return this.prisma.ppmPortfolio.findMany({
      where: { tenantId },
      include: { ppmProjects: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. Risk & Issue Management (PPM Risk Register)
  async createRiskRegister(tenantId: string, data: any) {
    const probability = data.probability || 0.5;
    const impact = data.impact || 0.5;
    const riskScore = probability * impact * 100;

    return this.prisma.ppmRiskRegister.create({
      data: {
        ...data,
        tenantId,
        riskScore,
      },
    });
  }

  async getRiskRegisters(tenantId: string, projectId: string) {
    return this.prisma.ppmRiskRegister.findMany({
      where: { tenantId, projectId },
      orderBy: { riskScore: "desc" },
    });
  }

  async createIssueLog(tenantId: string, data: any) {
    return this.prisma.projectIssueLog.create({
      data: { ...data, tenantId },
    });
  }

  // 3. Earned Value Management (EVM)
  async createEvmBaseline(tenantId: string, data: any) {
    return this.prisma.evmBaseline.create({
      data: { ...data, tenantId },
      include: { evmMeasurements: true },
    });
  }

  async recordEvmMeasurement(tenantId: string, baselineId: string, data: any) {
    const baseline = await this.prisma.evmBaseline.findFirst({
      where: { id: baselineId, tenantId },
    });
    if (!baseline)
      throw new NotFoundException(`EVM Baseline #${baselineId} not found`);

    const plannedValue = data.plannedValue;
    const earnedValue = data.earnedValue;
    const actualCost = data.actualCost;

    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1.0;

    const bac = baseline.budgetAtCompletion;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - actualCost;
    const tcpi =
      bac - earnedValue > 0 && bac - actualCost > 0
        ? (bac - earnedValue) / (bac - actualCost)
        : 1.0;
    const percentComplete = bac > 0 ? (earnedValue / bac) * 100 : 0;

    return this.prisma.evmMeasurement.create({
      data: {
        ...data,
        baselineId,
        tenantId,
        scheduleVariance,
        costVariance,
        spi,
        cpi,
        eac,
        etc,
        tcpi,
        percentComplete,
      },
    });
  }

  // 4. Project Kanban Boards & WIP Limits
  async createKanbanBoard(tenantId: string, data: any) {
    return this.prisma.ppmKanbanBoard.create({
      data: {
        ...data,
        tenantId,
        ppmColumns: data.columns
          ? {
              createMany: {
                data: data.columns.map((c: any) => ({ ...c, tenantId })),
              },
            }
          : undefined,
      },
      include: { ppmColumns: { include: { ppmCards: true } } },
    });
  }

  async getKanbanBoards(tenantId: string, projectId?: string) {
    return this.prisma.ppmKanbanBoard.findMany({
      where: { tenantId, ...(projectId ? { projectId } : {}) },
      include: { ppmColumns: { include: { ppmCards: true } } },
    });
  }

  async createKanbanCard(tenantId: string, columnId: string, data: any) {
    return this.prisma.ppmKanbanCard.create({
      data: { ...data, columnId, tenantId },
    });
  }

  // 5. Change Management (PPM Change Requests)
  async createChangeRequest(tenantId: string, data: any) {
    return this.prisma.ppmChangeRequest.create({
      data: { ...data, tenantId },
    });
  }

  async getChangeRequests(tenantId: string, projectId: string) {
    return this.prisma.ppmChangeRequest.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  // 6. Project Timesheets & Billing
  async createTimesheet(tenantId: string, data: any) {
    return this.prisma.ppmTimesheet.create({
      data: {
        ...data,
        tenantId,
        timesheetEntries: data.entries
          ? {
              createMany: {
                data: data.entries.map((e: any) => ({ ...e, tenantId })),
              },
            }
          : undefined,
      },
      include: { timesheetEntries: true },
    });
  }

  async getTimesheets(tenantId: string, userId?: string) {
    return this.prisma.ppmTimesheet.findMany({
      where: { tenantId, ...(userId ? { userId } : {}) },
      include: { timesheetEntries: true },
      orderBy: { weekStart: "desc" },
    });
  }

  // 7. Project Subcontractors & Deliverables
  async createSubcontractor(tenantId: string, data: any) {
    return this.prisma.projectSubcontractor.create({
      data: {
        ...data,
        tenantId,
        subDeliverables: data.deliverables
          ? {
              createMany: {
                data: data.deliverables.map((d: any) => ({ ...d, tenantId })),
              },
            }
          : undefined,
      },
      include: { subDeliverables: true, paymentMilestones: true },
    });
  }

  // 8. Quality Plans & Inspections
  async createQualityPlan(tenantId: string, data: any) {
    return this.prisma.ppmQualityPlan.create({
      data: { ...data, tenantId },
      include: { ppmInspections: true },
    });
  }

  // 9. Benefits Realization Management
  async createProjectBenefit(tenantId: string, data: any) {
    return this.prisma.projectBenefit.create({
      data: { ...data, tenantId },
    });
  }

  // 10. Client Portal & Deliverable Approvals
  async createClientApproval(tenantId: string, data: any) {
    return this.prisma.ppmClientApproval.create({
      data: { ...data, tenantId },
    });
  }
}
