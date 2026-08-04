import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import type {
  CreateEvmForecastDto,
  SetEvmKpiTargetDto,
} from "../dto/projects-deep.dto";

@Injectable()
export class ProjectsAdvancedEvmService {
  async calculateAdvancedEVM(tenantId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: { tasks: { include: { timesheets: true } } },
    });
    if (!project) throw new NotFoundException("Project not found");
    const bac = Number(project.budget || 0);
    const totalTasks = project.tasks.length;
    const today = new Date();
    const plannedTasks = project.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) <= today,
    ).length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "DONE",
    ).length;
    const taskBudgetShare = totalTasks > 0 ? bac / totalTasks : 0;
    const pv = plannedTasks * taskBudgetShare;
    const ev = completedTasks * taskBudgetShare;
    let ac = 0;
    project.tasks.forEach((t) => {
      ac += t.timesheets.reduce((s, ts) => s + Number(ts.hours), 0) * 50;
    });
    const sv = ev - pv;
    const cv = ev - ac;
    const cpi = ac > 0 ? ev / ac : 1.0;
    const spi = pv > 0 ? ev / pv : 1.0;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const vac = bac - eac;
    const tcpi = (bac - ev) / (bac - ac || 1);
    const percentComplete = bac > 0 ? (ev / bac) * 100 : 0;
    return {
      projectId,
      pv,
      ev,
      ac,
      sv,
      cv,
      cpi,
      spi,
      eac,
      etc,
      vac,
      tcpi,
      bac,
      percentComplete,
    };
  }

  async createEvmForecast(tenantId: string, dto: CreateEvmForecastDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.evmForecast.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        forecastDate: new Date(),
        eac: new Prisma.Decimal(dto.eac),
        etc: new Prisma.Decimal(dto.etc),
        vac: new Prisma.Decimal(dto.vac),
        tcpi: new Prisma.Decimal(dto.tcpi),
        bac: new Prisma.Decimal(dto.bac),
        cpi: new Prisma.Decimal(dto.cpi),
        spi: new Prisma.Decimal(dto.spi),
        method: dto.method || "FORMULA",
        notes: dto.notes || null,
      },
    });
  }

  async getEVMForecast(tenantId: string, projectId: string) {
    return prisma.evmForecast.findMany({
      where: { tenantId, projectId },
      orderBy: { forecastDate: "desc" },
      take: 20,
    });
  }

  async getTCPI(tenantId: string, projectId: string) {
    const evm = await this.calculateAdvancedEVM(tenantId, projectId);
    const targets = await prisma.evmKpiTarget.findFirst({
      where: { tenantId, projectId, kpi: "TCPI_TARGET" },
    });
    return {
      projectId: evm.projectId,
      tcpi: evm.tcpi,
      tcpiBAC: evm.bac > 0 ? (evm.bac - evm.ev) / (evm.bac - evm.ac || 1) : 0,
      tcpiEAC: evm.eac > 0 ? (evm.bac - evm.ev) / (evm.eac - evm.ac || 1) : 0,
      targetMin: targets?.targetMin ? Number(targets.targetMin) : null,
      targetMax: targets?.targetMax ? Number(targets.targetMax) : null,
      isAchievable: targets
        ? evm.tcpi <= Number(targets.targetMax || 1.2)
        : evm.tcpi <= 1.1,
    };
  }

  async getEACBreakdown(tenantId: string, projectId: string) {
    const evm = await this.calculateAdvancedEVM(tenantId, projectId);
    return {
      projectId,
      eac: evm.eac,
      eacOptimistic: evm.eac * 0.9,
      eacPessimistic: evm.eac * 1.1,
      eacMostLikely: (evm.eac * 0.9 + evm.eac * 1.1 + evm.eac) / 3,
      varianceAtCompletion: evm.vac,
      tcpi: evm.tcpi,
      cpi: evm.cpi,
      spi: evm.spi,
      bac: evm.bac,
      etc: evm.etc,
      ac: evm.ac,
    };
  }

  async createEvmSnapshot(tenantId: string, projectId: string) {
    const evm = await this.calculateAdvancedEVM(tenantId, projectId);
    return prisma.evmSnapshot.create({
      data: {
        tenantId,
        projectId,
        snapshotDate: new Date(),
        pv: new Prisma.Decimal(evm.pv),
        ev: new Prisma.Decimal(evm.ev),
        ac: new Prisma.Decimal(evm.ac),
        sv: new Prisma.Decimal(evm.sv),
        cv: new Prisma.Decimal(evm.cv),
        cpi: new Prisma.Decimal(evm.cpi),
        spi: new Prisma.Decimal(evm.spi),
        eac: new Prisma.Decimal(evm.eac),
        etc: new Prisma.Decimal(evm.etc),
        vac: new Prisma.Decimal(evm.vac),
        tcpi: new Prisma.Decimal(evm.tcpi),
      },
    });
  }

  async getEvmSnapshots(tenantId: string, projectId: string) {
    return prisma.evmSnapshot.findMany({
      where: { tenantId, projectId },
      orderBy: { snapshotDate: "asc" },
    });
  }

  async setKpiTarget(tenantId: string, dto: SetEvmKpiTargetDto) {
    const project = await prisma.project.findFirst({
      where: { id: dto.projectId, tenantId },
    });
    if (!project) throw new NotFoundException("Project not found");
    return prisma.evmKpiTarget.upsert({
      where: {
        tenantId_projectId_kpi: {
          tenantId,
          projectId: dto.projectId,
          kpi: dto.kpi,
        },
      },
      update: {
        targetMin: dto.targetMin ? new Prisma.Decimal(dto.targetMin) : null,
        targetMax: dto.targetMax ? new Prisma.Decimal(dto.targetMax) : null,
        threshold: dto.threshold || "WARNING",
      },
      create: {
        tenantId,
        projectId: dto.projectId,
        kpi: dto.kpi,
        targetMin: dto.targetMin ? new Prisma.Decimal(dto.targetMin) : null,
        targetMax: dto.targetMax ? new Prisma.Decimal(dto.targetMax) : null,
        threshold: dto.threshold || "WARNING",
      },
    });
  }

  async getEVMDashboard(tenantId: string, projectId: string) {
    const evm = await this.calculateAdvancedEVM(tenantId, projectId);
    const forecasts = await prisma.evmForecast.findMany({
      where: { tenantId, projectId },
      orderBy: { forecastDate: "desc" },
      take: 5,
    });
    const snapshots = await prisma.evmSnapshot.findMany({
      where: { tenantId, projectId },
      orderBy: { snapshotDate: "asc" },
      take: 30,
    });
    const targets = await prisma.evmKpiTarget.findMany({
      where: { tenantId, projectId },
    });
    return { ...evm, forecasts, snapshots, targets };
  }
}
