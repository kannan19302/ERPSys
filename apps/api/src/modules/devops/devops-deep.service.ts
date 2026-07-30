import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class DevopsDeepService {
  private readonly logger = new Logger(DevopsDeepService.name);

  async listPipelines(tenantId: string) {
    return prisma.devopsPipeline.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createPipeline(tenantId: string, userId: string, data: any) {
    return prisma.devopsPipeline.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        stages: data.stages ?? [],
        trigger: data.trigger ?? "MANUAL",
        createdBy: userId,
      },
    });
  }
  async updatePipeline(tenantId: string, id: string, data: any) {
    const p = await prisma.devopsPipeline.findFirst({
      where: { id, tenantId },
    });
    if (!p) throw new NotFoundException("Pipeline not found");
    return prisma.devopsPipeline.update({ where: { id }, data });
  }
  async deletePipeline(tenantId: string, id: string) {
    const p = await prisma.devopsPipeline.findFirst({
      where: { id, tenantId },
    });
    if (!p) throw new NotFoundException("Pipeline not found");
    return prisma.devopsPipeline.delete({ where: { id } });
  }
  async runPipeline(tenantId: string, id: string, userId: string) {
    const p = await prisma.devopsPipeline.findFirst({
      where: { id, tenantId },
    });
    if (!p) throw new NotFoundException("Pipeline not found");
    await prisma.devopsPipeline.update({
      where: { id },
      data: { lastRunAt: new Date(), lastStatus: "RUNNING" },
    });
    return prisma.devopsDeployment.create({
      data: {
        tenantId,
        pipelineId: id,
        version: `run-${Date.now()}`,
        status: "RUNNING",
        deployedBy: userId,
        startedAt: new Date(),
      },
    });
  }

  async listDeployments(tenantId: string) {
    return prisma.devopsDeployment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { pipeline: true, environment: true },
    });
  }
  async createDeployment(tenantId: string, userId: string, data: any) {
    return prisma.devopsDeployment.create({
      data: {
        tenantId,
        version: data.version,
        environmentId: data.environmentId,
        pipelineId: data.pipelineId,
        commitSha: data.commitSha,
        branch: data.branch,
        status: "PENDING",
        deployedBy: userId,
      },
    });
  }
  async rollbackDeployment(tenantId: string, id: string) {
    const d = await prisma.devopsDeployment.findFirst({
      where: { id, tenantId },
    });
    if (!d) throw new NotFoundException("Deployment not found");
    return prisma.devopsDeployment.create({
      data: {
        tenantId,
        version: `rollback-${d.version}`,
        environmentId: d.environmentId,
        status: "ROLLING_BACK",
        deployedBy: "system",
      },
    });
  }

  async listEnvironments(tenantId: string) {
    return prisma.devopsEnvironment.findMany({ where: { tenantId } });
  }
  async createEnvironment(tenantId: string, data: any) {
    return prisma.devopsEnvironment.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type ?? "DEVELOPMENT",
        url: data.url,
        isProtected: data.isProtected ?? false,
        config: data.config ?? {},
      },
    });
  }
  async updateEnvironment(tenantId: string, id: string, data: any) {
    const e = await prisma.devopsEnvironment.findFirst({
      where: { id, tenantId },
    });
    if (!e) throw new NotFoundException("Environment not found");
    return prisma.devopsEnvironment.update({ where: { id }, data });
  }
  async deleteEnvironment(tenantId: string, id: string) {
    const e = await prisma.devopsEnvironment.findFirst({
      where: { id, tenantId },
    });
    if (!e) throw new NotFoundException("Environment not found");
    return prisma.devopsEnvironment.delete({ where: { id } });
  }

  async listConfigMaps(tenantId: string) {
    return prisma.devopsConfigMap.findMany({ where: { tenantId } });
  }
  async createConfigMap(tenantId: string, data: any) {
    return prisma.devopsConfigMap.create({
      data: { tenantId, name: data.name, data: data.data },
    });
  }
  async updateConfigMap(tenantId: string, id: string, data: any) {
    const c = await prisma.devopsConfigMap.findFirst({
      where: { id, tenantId },
    });
    if (!c) throw new NotFoundException("Config map not found");
    return prisma.devopsConfigMap.update({
      where: { id },
      data: { ...data, version: c.version + 1 },
    });
  }
  async deleteConfigMap(tenantId: string, id: string) {
    const c = await prisma.devopsConfigMap.findFirst({
      where: { id, tenantId },
    });
    if (!c) throw new NotFoundException("Config map not found");
    return prisma.devopsConfigMap.delete({ where: { id } });
  }

  async listFeatureFlags(tenantId: string) {
    return prisma.devopsFeatureFlag.findMany({ where: { tenantId } });
  }
  async createFeatureFlag(tenantId: string, data: any) {
    return prisma.devopsFeatureFlag.create({
      data: {
        tenantId,
        flagKey: data.flagKey,
        name: data.name,
        description: data.description,
        rules: data.rules ?? [],
      },
    });
  }
  async updateFeatureFlag(tenantId: string, flagKey: string, data: any) {
    const f = await prisma.devopsFeatureFlag.findUnique({
      where: { tenantId_flagKey: { tenantId, flagKey } },
    });
    if (!f) throw new NotFoundException("Feature flag not found");
    return prisma.devopsFeatureFlag.update({
      where: { tenantId_flagKey: { tenantId, flagKey } },
      data,
    });
  }
  async deleteFeatureFlag(tenantId: string, flagKey: string) {
    const f = await prisma.devopsFeatureFlag.findUnique({
      where: { tenantId_flagKey: { tenantId, flagKey } },
    });
    if (!f) throw new NotFoundException("Feature flag not found");
    return prisma.devopsFeatureFlag.delete({
      where: { tenantId_flagKey: { tenantId, flagKey } },
    });
  }

  async listMonitorDashboards(tenantId: string) {
    return prisma.devopsMonitorDashboard.findMany({ where: { tenantId } });
  }
  async createMonitorDashboard(tenantId: string, data: any) {
    return prisma.devopsMonitorDashboard.create({
      data: {
        tenantId,
        name: data.name,
        widgets: data.widgets ?? [],
        isDefault: data.isDefault ?? false,
      },
    });
  }
  async deleteMonitorDashboard(tenantId: string, id: string) {
    const d = await prisma.devopsMonitorDashboard.findFirst({
      where: { id, tenantId },
    });
    if (!d) throw new NotFoundException("Monitor dashboard not found");
    return prisma.devopsMonitorDashboard.delete({ where: { id } });
  }

  async listAlertConfigs(tenantId: string) {
    return prisma.devopsAlertConfig.findMany({ where: { tenantId } });
  }
  async createAlertConfig(tenantId: string, data: any) {
    return prisma.devopsAlertConfig.create({
      data: {
        tenantId,
        name: data.name,
        metric: data.metric,
        condition: data.condition,
        threshold: data.threshold,
        severity: data.severity ?? "WARNING",
        channels: data.channels ?? ["in-app"],
      },
    });
  }
  async updateAlertConfig(tenantId: string, id: string, data: any) {
    const a = await prisma.devopsAlertConfig.findFirst({
      where: { id, tenantId },
    });
    if (!a) throw new NotFoundException("Alert config not found");
    return prisma.devopsAlertConfig.update({ where: { id }, data });
  }
  async deleteAlertConfig(tenantId: string, id: string) {
    const a = await prisma.devopsAlertConfig.findFirst({
      where: { id, tenantId },
    });
    if (!a) throw new NotFoundException("Alert config not found");
    return prisma.devopsAlertConfig.delete({ where: { id } });
  }

  async listLogs(
    tenantId: string,
    query: { page: number; limit: number; source?: string; level?: string },
  ) {
    const where: any = { tenantId };
    if (query.source) where.source = query.source;
    if (query.level) where.level = query.level;
    const [items, total] = await Promise.all([
      prisma.devopsLogEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.devopsLogEntry.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async exportLogs(tenantId: string, data: any) {
    const items = await prisma.devopsLogEntry.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return {
      data: items,
      format: data.format ?? "json",
      exportedAt: new Date().toISOString(),
    };
  }

  async listAuditLogs(
    tenantId: string,
    query: { page: number; limit: number },
  ) {
    const where = { tenantId };
    const [items, total] = await Promise.all([
      prisma.auditLogLog.findMany?.({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }) ?? Promise.resolve([]),
      prisma.auditLogLog.count?.({ where }) ?? Promise.resolve(0),
    ]);
    return {
      items: items ?? [],
      total: total ?? 0,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil((total ?? 0) / query.limit),
    };
  }
  async exportAuditLogs(tenantId: string) {
    const items =
      (await prisma.devopsLogEntry?.findMany?.({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      })) ?? [];
    return {
      data: items,
      format: "json",
      exportedAt: new Date().toISOString(),
    };
  }

  async listBackupJobs(tenantId: string) {
    return prisma.devopsBackupJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createBackupJob(tenantId: string, userId: string, data: any) {
    return prisma.devopsBackupJob.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type ?? "FULL",
        status: "PENDING",
        startedAt: new Date(),
        createdBy: userId,
      },
    });
  }
  async restoreBackup(tenantId: string, id: string) {
    const b = await prisma.devopsBackupJob.findFirst({
      where: { id, tenantId },
    });
    if (!b) throw new NotFoundException("Backup job not found");
    return { message: `Restore from backup ${b.name} initiated`, backupId: id };
  }

  async listMigrations(tenantId: string) {
    return prisma.devopsMigrationRecord.findMany({
      where: { tenantId },
      orderBy: { executedAt: "desc" },
    });
  }
  async runMigration(tenantId: string, userId: string, data: any) {
    return prisma.devopsMigrationRecord.create({
      data: {
        tenantId,
        name: data.name,
        direction: "UP",
        status: "COMPLETED",
        executedBy: userId,
        executedAt: new Date(),
      },
    });
  }
  async rollbackMigration(tenantId: string, userId: string, data: any) {
    return prisma.devopsMigrationRecord.create({
      data: {
        tenantId,
        name: data.name,
        direction: "DOWN",
        status: "COMPLETED",
        executedBy: userId,
        executedAt: new Date(),
      },
    });
  }

  async listHealthChecks(tenantId: string) {
    return prisma.devopsHealthCheck.findMany({ where: { tenantId } });
  }
  async createHealthCheck(tenantId: string, data: any) {
    return prisma.devopsHealthCheck.create({
      data: {
        tenantId,
        name: data.name,
        endpoint: data.endpoint,
        method: data.method ?? "GET",
        intervalSec: data.intervalSec ?? 300,
      },
    });
  }
  async deleteHealthCheck(tenantId: string, id: string) {
    const h = await prisma.devopsHealthCheck.findFirst({
      where: { id, tenantId },
    });
    if (!h) throw new NotFoundException("Health check not found");
    return prisma.devopsHealthCheck.delete({ where: { id } });
  }

  async getPerformance(tenantId: string, metric?: string) {
    return {
      tenantId,
      metric: metric ?? "all",
      data: { avgResponseMs: 120, errorRate: 0.5, throughput: 1500 },
      timestamp: new Date().toISOString(),
    };
  }

  async listErrors(tenantId: string, query: { page: number; limit: number }) {
    const where = { tenantId };
    const [items, total] = await Promise.all([
      prisma.devopsErrorRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.devopsErrorRecord.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async resolveError(tenantId: string, id: string, userId: string) {
    const e = await prisma.devopsErrorRecord.findFirst({
      where: { id, tenantId },
    });
    if (!e) throw new NotFoundException("Error record not found");
    return prisma.devopsErrorRecord.update({
      where: { id },
      data: { status: "RESOLVED", resolvedBy: userId, resolvedAt: new Date() },
    });
  }

  async listUptimeRecords(tenantId: string, checkId?: string) {
    const where: any = { tenantId };
    if (checkId) where.checkId = checkId;
    return prisma.devopsUptimeRecord.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      take: 100,
    });
  }

  async listSlaContracts(tenantId: string) {
    return prisma.devopsSlaContract.findMany({ where: { tenantId } });
  }
  async createSlaContract(tenantId: string, data: any) {
    return prisma.devopsSlaContract.create({
      data: {
        tenantId,
        name: data.name,
        uptimePct: data.uptimePct,
        responseTimeMs: data.responseTimeMs,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
  async updateSlaContract(tenantId: string, id: string, data: any) {
    const s = await prisma.devopsSlaContract.findFirst({
      where: { id, tenantId },
    });
    if (!s) throw new NotFoundException("SLA contract not found");
    return prisma.devopsSlaContract.update({ where: { id }, data });
  }
  async deleteSlaContract(tenantId: string, id: string) {
    const s = await prisma.devopsSlaContract.findFirst({
      where: { id, tenantId },
    });
    if (!s) throw new NotFoundException("SLA contract not found");
    return prisma.devopsSlaContract.delete({ where: { id } });
  }

  async listIncidents(tenantId: string) {
    return prisma.devopsIncident.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createIncident(tenantId: string, data: any) {
    return prisma.devopsIncident.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        severity: data.severity ?? "MINOR",
        source: data.source,
      },
    });
  }
  async updateIncident(tenantId: string, id: string, data: any) {
    const i = await prisma.devopsIncident.findFirst({
      where: { id, tenantId },
    });
    if (!i) throw new NotFoundException("Incident not found");
    return prisma.devopsIncident.update({ where: { id }, data });
  }
  async resolveIncident(tenantId: string, id: string, userId: string) {
    const i = await prisma.devopsIncident.findFirst({
      where: { id, tenantId },
    });
    if (!i) throw new NotFoundException("Incident not found");
    return prisma.devopsIncident.update({
      where: { id },
      data: { status: "RESOLVED", resolvedBy: userId, resolvedAt: new Date() },
    });
  }

  async listCapacityPlans(tenantId: string) {
    return prisma.devopsCapacityPlan.findMany({ where: { tenantId } });
  }
  async createCapacityPlan(tenantId: string, data: any) {
    return prisma.devopsCapacityPlan.create({
      data: {
        tenantId,
        name: data.name,
        resourceType: data.resourceType,
        currentValue: data.currentValue,
        projectedValue: data.projectedValue,
        thresholdPct: data.thresholdPct ?? 80,
      },
    });
  }

  async getResourceMetrics(tenantId: string) {
    return {
      tenantId,
      metrics: {
        cpu: { usage: 45, limit: 100 },
        memory: { usage: 60, limit: 100 },
        storage: { usage: 30, limit: 100 },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async listChangeRequests(tenantId: string) {
    return prisma.devopsChangeRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createChangeRequest(tenantId: string, userId: string, data: any) {
    return prisma.devopsChangeRequest.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        type: data.type ?? "STANDARD",
        riskLevel: data.riskLevel ?? "LOW",
        createdBy: userId,
      },
    });
  }
  async approveChangeRequest(tenantId: string, id: string, userId: string) {
    const c = await prisma.devopsChangeRequest.findFirst({
      where: { id, tenantId },
    });
    if (!c) throw new NotFoundException("Change request not found");
    return prisma.devopsChangeRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
  }
}
