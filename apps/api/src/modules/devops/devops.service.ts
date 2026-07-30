// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import type {
  CreateDeploymentDto,
  UpdateDeploymentDto,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  CreateEnvironmentConfigDto,
  CreateReleaseDto,
  UpdateReleaseDto,
  CreateBuildLogDto,
} from "@unerp/shared";

@Injectable()
export class DevopsService {
  // Deployments
  async getDeployments(
    tenantId: string,
    environmentId?: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId };
    if (environmentId) where.environmentId = environmentId;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deployment.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getDeployment(tenantId: string, id: string) {
    const dep = await prisma.deployment.findFirst({
      where: { id, tenantId },
      include: {
        stages: { orderBy: { sequence: "asc" } },
        buildLogs: { orderBy: { timestamp: "desc" }, take: 50 },
        artifacts: true,
      },
    });
    if (!dep) throw new NotFoundException("Deployment not found");
    return dep;
  }

  async createDeployment(tenantId: string, dto: CreateDeploymentDto) {
    return prisma.deployment.create({ data: { ...dto, tenantId } });
  }

  async updateDeployment(
    tenantId: string,
    id: string,
    dto: UpdateDeploymentDto,
  ) {
    await this.getDeployment(tenantId, id);
    return prisma.deployment.update({ where: { id }, data: dto });
  }

  async deleteDeployment(tenantId: string, id: string) {
    await this.getDeployment(tenantId, id);
    return prisma.deployment.delete({ where: { id } });
  }

  async rollbackDeployment(tenantId: string, id: string, deployedBy: string) {
    const dep = await this.getDeployment(tenantId, id);
    if (dep.status !== "SUCCESS")
      throw new Error("Only successful deployments can be rolled back");
    return prisma.deployment.update({
      where: { id },
      data: {
        status: "ROLLED_BACK",
        rollbackFrom: dep.version,
        completedAt: new Date(),
        deployedBy,
      },
    });
  }

  // Stages
  async getDeploymentStages(tenantId: string, deploymentId: string) {
    await this.getDeployment(tenantId, deploymentId);
    return prisma.deploymentStage.findMany({
      where: { deploymentId },
      orderBy: { sequence: "asc" },
    });
  }

  async updateStageStatus(
    tenantId: string,
    stageId: string,
    status: string,
    errorMessage?: string,
  ) {
    const stage = await prisma.deploymentStage.findFirst({
      where: { id: stageId },
      include: { deployment: true },
    });
    if (!stage || stage.deployment.tenantId !== tenantId)
      throw new NotFoundException("Stage not found");
    const data: any = { status };
    if (status === "RUNNING") data.startedAt = new Date();
    if (status === "SUCCESS" || status === "FAILED")
      data.completedAt = new Date();
    if (errorMessage) data.errorMessage = errorMessage;
    return prisma.deploymentStage.update({ where: { id: stageId }, data });
  }

  // Environments
  async getEnvironments(tenantId: string) {
    return prisma.environment.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async getEnvironment(tenantId: string, id: string) {
    const env = await prisma.environment.findFirst({
      where: { id, tenantId },
      include: { configs: true },
    });
    if (!env) throw new NotFoundException("Environment not found");
    return env;
  }

  async createEnvironment(tenantId: string, dto: CreateEnvironmentDto) {
    return prisma.environment.create({ data: { ...dto, tenantId } });
  }

  async updateEnvironment(
    tenantId: string,
    id: string,
    dto: UpdateEnvironmentDto,
  ) {
    await this.getEnvironment(tenantId, id);
    return prisma.environment.update({ where: { id }, data: dto });
  }

  async deleteEnvironment(tenantId: string, id: string) {
    await this.getEnvironment(tenantId, id);
    return prisma.environment.delete({ where: { id } });
  }

  async updateHealthStatus(tenantId: string, id: string, healthStatus: string) {
    await this.getEnvironment(tenantId, id);
    return prisma.environment.update({
      where: { id },
      data: { healthStatus, lastHealthCheckAt: new Date() },
    });
  }

  // Configs
  async getEnvironmentConfigs(tenantId: string, environmentId: string) {
    await this.getEnvironment(tenantId, environmentId);
    return prisma.environmentConfig.findMany({ where: { environmentId } });
  }

  async upsertConfig(tenantId: string, dto: CreateEnvironmentConfigDto) {
    await this.getEnvironment(tenantId, dto.environmentId);
    const existing = await prisma.environmentConfig.findFirst({
      where: { tenantId, environmentId: dto.environmentId, key: dto.key },
    });
    if (existing) {
      return prisma.environmentConfig.update({
        where: { id: existing.id },
        data: { ...dto, version: existing.version + 1 },
      });
    }
    return prisma.environmentConfig.create({ data: { ...dto, tenantId } });
  }

  async deleteConfig(tenantId: string, id: string) {
    const cfg = await prisma.environmentConfig.findFirst({
      where: { id, tenantId },
    });
    if (!cfg) throw new NotFoundException("Config not found");
    return prisma.environmentConfig.delete({ where: { id } });
  }

  // Releases
  async getReleases(
    tenantId: string,
    application?: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId };
    if (application) where.application = application;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.release.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.release.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getRelease(tenantId: string, id: string) {
    const rel = await prisma.release.findFirst({
      where: { id, tenantId },
      include: { artifacts: true },
    });
    if (!rel) throw new NotFoundException("Release not found");
    return rel;
  }

  async createRelease(tenantId: string, dto: CreateReleaseDto) {
    return prisma.release.create({ data: { ...dto, tenantId } });
  }

  async updateRelease(tenantId: string, id: string, dto: UpdateReleaseDto) {
    await this.getRelease(tenantId, id);
    return prisma.release.update({ where: { id }, data: dto });
  }

  async deleteRelease(tenantId: string, id: string) {
    await this.getRelease(tenantId, id);
    return prisma.release.delete({ where: { id } });
  }

  async approveRelease(tenantId: string, id: string, approvedBy: string) {
    await this.getRelease(tenantId, id);
    return prisma.release.update({
      where: { id },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  }

  async deployRelease(tenantId: string, id: string, releasedBy: string) {
    await this.getRelease(tenantId, id);
    return prisma.release.update({
      where: { id },
      data: { status: "RELEASED", releasedBy, releasedAt: new Date() },
    });
  }

  // Build Logs
  async getBuildLogs(
    tenantId: string,
    deploymentId: string,
    level?: string,
    page = 1,
    limit = 50,
  ) {
    const where: any = { tenantId, deploymentId };
    if (level) where.level = level;
    const [items, total] = await Promise.all([
      prisma.buildLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.buildLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async createBuildLog(tenantId: string, dto: CreateBuildLogDto) {
    return prisma.buildLog.create({ data: { ...dto, tenantId } });
  }

  // Analytics
  async getAnalytics(tenantId: string, period = "WEEKLY") {
    return prisma.deploymentAnalytics.findMany({
      where: { tenantId, period },
      orderBy: { periodStart: "desc" },
      take: 12,
    });
  }

  async computeAnalytics(tenantId: string) {
    const now = new Date();
    const periodStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
    );
    const periodEnd = now;
    const deployments = await prisma.deployment.findMany({
      where: { tenantId, createdAt: { gte: periodStart } },
    });
    const total = deployments.length;
    const successful = deployments.filter((d) => d.status === "SUCCESS").length;
    const failed = deployments.filter((d) => d.status === "FAILED").length;
    const rollbacks = deployments.filter(
      (d) => d.status === "ROLLED_BACK",
    ).length;
    const durations = deployments
      .filter((d) => d.startedAt && d.completedAt)
      .map((d) => (d.completedAt!.getTime() - d.startedAt!.getTime()) / 1000);
    const avg = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;
    const sorted = [...durations].sort((a, b) => a - b);
    const p95 = sorted.length
      ? sorted[Math.ceil(sorted.length * 0.95) - 1]
      : null;
    const byEnv: Record<string, number> = {};
    const byApp: Record<string, number> = {};
    const reasons: string[] = [];
    for (const d of deployments) {
      byEnv[d.environmentId] = (byEnv[d.environmentId] || 0) + 1;
      byApp[d.application] = (byApp[d.application] || 0) + 1;
    }
    return prisma.deploymentAnalytics.upsert({
      where: {
        tenantId_period_periodStart: {
          tenantId,
          period: "WEEKLY",
          periodStart,
        },
      },
      create: {
        tenantId,
        period: "WEEKLY",
        periodStart,
        periodEnd,
        totalDeployments: total,
        successfulDeployments: successful,
        failedDeployments: failed,
        rollbackCount: rollbacks,
        avgDuration: avg,
        p95Duration: p95,
        deploymentsByEnv: byEnv,
        deploymentsByApp: byApp,
        failureReasons: reasons,
      },
      update: {
        periodEnd,
        totalDeployments: total,
        successfulDeployments: successful,
        failedDeployments: failed,
        rollbackCount: rollbacks,
        avgDuration: avg,
        p95Duration: p95,
        deploymentsByEnv: byEnv,
        deploymentsByApp: byApp,
        failureReasons: reasons,
      },
    });
  }
}
