import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";
import {
  pipelines,
  configMaps,
  monitorDashboards,
  alertConfigs,
  logEntries,
  backupJobs,
  migrations,
  healthChecks,
  errorRecords,
  uptimeRecords,
  slaContracts,
  incidents,
  capacityPlans,
  createRecordId,
  findRecord,
  removeRecord,
  type PipelineRecord,
  type ConfigMapRecord,
  type MonitorDashboardRecord,
  type AlertConfigRecord,
  type LogEntryRecord,
  type BackupJobRecord,
  type MigrationRecord,
  type HealthCheckRecord,
  type ErrorRecord,
  type UptimeRecord,
  type SlaContractRecord,
  type IncidentRecord,
  type CapacityPlanRecord,
} from "./devops-deep.store";

@Injectable()
export class DevopsDeepService {
  private readonly logger = new Logger(DevopsDeepService.name);

  async listPipelines(tenantId: string) {
    return pipelines
      .filter((p) => p.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createPipeline(tenantId: string, userId: string, data: any) {
    const now = new Date();
    const record: PipelineRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      description: data.description ?? null,
      stages: data.stages ?? [],
      trigger: data.trigger ?? "MANUAL",
      isActive: true,
      lastRunAt: null,
      lastStatus: null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    pipelines.push(record);
    return record;
  }
  async updatePipeline(tenantId: string, id: string, data: any) {
    const p = findRecord(pipelines, tenantId, id);
    if (!p) throw new NotFoundException("Pipeline not found");
    Object.assign(p, data, { updatedAt: new Date() });
    return p;
  }
  async deletePipeline(tenantId: string, id: string) {
    const p = findRecord(pipelines, tenantId, id);
    if (!p) throw new NotFoundException("Pipeline not found");
    return removeRecord(pipelines, tenantId, id) as PipelineRecord;
  }
  async runPipeline(tenantId: string, id: string, userId: string) {
    const p = findRecord(pipelines, tenantId, id);
    if (!p) throw new NotFoundException("Pipeline not found");
    p.lastRunAt = new Date();
    p.lastStatus = "RUNNING";
    p.updatedAt = new Date();
    return prisma.deployment.create({
      data: {
        tenantId,
        name: p.name,
        application: "default",
        version: `run-${Date.now()}`,
        environmentId: "",
        status: "IN_PROGRESS",
        deployedBy: userId,
        startedAt: new Date(),
        metadata: { pipelineId: id },
      },
    });
  }

  async listDeployments(tenantId: string) {
    return prisma.deployment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { depEnvironment: true },
    });
  }
  async createDeployment(tenantId: string, userId: string, data: any) {
    return prisma.deployment.create({
      data: {
        tenantId,
        name: data.name ?? data.version,
        application: data.application ?? "default",
        version: data.version,
        environmentId: data.environmentId ?? "",
        commitSha: data.commitSha ?? null,
        branch: data.branch ?? null,
        status: "PENDING",
        deployedBy: userId,
        metadata: data.pipelineId ? { pipelineId: data.pipelineId } : {},
      },
    });
  }
  async rollbackDeployment(tenantId: string, id: string) {
    const d = await prisma.deployment.findFirst({ where: { id, tenantId } });
    if (!d) throw new NotFoundException("Deployment not found");
    return prisma.deployment.create({
      data: {
        tenantId,
        name: `rollback-${d.name}`,
        application: d.application,
        version: `rollback-${d.version}`,
        environmentId: d.environmentId,
        status: "ROLLED_BACK",
        deployedBy: "system",
        rollbackFrom: d.version,
      },
    });
  }

  async listEnvironments(tenantId: string) {
    return prisma.environment.findMany({ where: { tenantId } });
  }
  async createEnvironment(tenantId: string, data: any) {
    return prisma.environment.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug ?? data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: data.type ?? "DEVELOPMENT",
        baseUrl: data.url ?? null,
        metadata: data.config ?? {},
      },
    });
  }
  async updateEnvironment(tenantId: string, id: string, data: any) {
    const e = await prisma.environment.findFirst({ where: { id, tenantId } });
    if (!e) throw new NotFoundException("Environment not found");
    return prisma.environment.update({
      where: { id },
      data: {
        ...(data.url !== undefined ? { baseUrl: data.url } : {}),
        ...(data.config !== undefined || data.isProtected !== undefined
          ? {
              metadata: {
                ...(data.config ?? {}),
                ...(data.isProtected !== undefined
                  ? { isProtected: data.isProtected }
                  : {}),
              },
            }
          : {}),
      },
    });
  }
  async deleteEnvironment(tenantId: string, id: string) {
    const e = await prisma.environment.findFirst({ where: { id, tenantId } });
    if (!e) throw new NotFoundException("Environment not found");
    return prisma.environment.delete({ where: { id } });
  }

  async listConfigMaps(tenantId: string) {
    return configMaps.filter((c) => c.tenantId === tenantId);
  }
  async createConfigMap(tenantId: string, data: any) {
    const now = new Date();
    const record: ConfigMapRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      data: data.data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    configMaps.push(record);
    return record;
  }
  async updateConfigMap(tenantId: string, id: string, data: any) {
    const c = findRecord(configMaps, tenantId, id);
    if (!c) throw new NotFoundException("Config map not found");
    Object.assign(c, data, { version: c.version + 1, updatedAt: new Date() });
    return c;
  }
  async deleteConfigMap(tenantId: string, id: string) {
    const c = findRecord(configMaps, tenantId, id);
    if (!c) throw new NotFoundException("Config map not found");
    return removeRecord(configMaps, tenantId, id) as ConfigMapRecord;
  }

  async listFeatureFlags(tenantId: string) {
    return prisma.saasFeatureFlag.findMany({ where: { tenantId } });
  }
  async createFeatureFlag(tenantId: string, data: any) {
    return prisma.saasFeatureFlag.create({
      data: {
        tenantId,
        slug: data.flagKey,
        name: data.name,
        description: data.description ?? null,
        conditions: data.rules ?? [],
      },
    });
  }
  async updateFeatureFlag(tenantId: string, flagKey: string, data: any) {
    const f = await prisma.saasFeatureFlag.findFirst({
      where: { tenantId, slug: flagKey },
    });
    if (!f) throw new NotFoundException("Feature flag not found");
    return prisma.saasFeatureFlag.update({
      where: { id: f.id },
      data: {
        ...(data.isEnabled !== undefined ? { isEnabled: data.isEnabled } : {}),
        ...(data.rules !== undefined ? { conditions: data.rules } : {}),
      },
    });
  }
  async deleteFeatureFlag(tenantId: string, flagKey: string) {
    const f = await prisma.saasFeatureFlag.findFirst({
      where: { tenantId, slug: flagKey },
    });
    if (!f) throw new NotFoundException("Feature flag not found");
    return prisma.saasFeatureFlag.delete({ where: { id: f.id } });
  }

  async listMonitorDashboards(tenantId: string) {
    return monitorDashboards.filter((d) => d.tenantId === tenantId);
  }
  async createMonitorDashboard(tenantId: string, data: any) {
    const now = new Date();
    const record: MonitorDashboardRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      widgets: data.widgets ?? [],
      isDefault: data.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };
    monitorDashboards.push(record);
    return record;
  }
  async deleteMonitorDashboard(tenantId: string, id: string) {
    const d = findRecord(monitorDashboards, tenantId, id);
    if (!d) throw new NotFoundException("Monitor dashboard not found");
    return removeRecord(
      monitorDashboards,
      tenantId,
      id,
    ) as MonitorDashboardRecord;
  }

  async listAlertConfigs(tenantId: string) {
    return alertConfigs.filter((a) => a.tenantId === tenantId);
  }
  async createAlertConfig(tenantId: string, data: any) {
    const now = new Date();
    const record: AlertConfigRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      metric: data.metric,
      condition: data.condition,
      threshold: data.threshold,
      severity: data.severity ?? "WARNING",
      channels: data.channels ?? ["in-app"],
      isActive: true,
      lastTriggeredAt: null,
      createdAt: now,
      updatedAt: now,
    };
    alertConfigs.push(record);
    return record;
  }
  async updateAlertConfig(tenantId: string, id: string, data: any) {
    const a = findRecord(alertConfigs, tenantId, id);
    if (!a) throw new NotFoundException("Alert config not found");
    Object.assign(a, data, { updatedAt: new Date() });
    return a;
  }
  async deleteAlertConfig(tenantId: string, id: string) {
    const a = findRecord(alertConfigs, tenantId, id);
    if (!a) throw new NotFoundException("Alert config not found");
    return removeRecord(alertConfigs, tenantId, id) as AlertConfigRecord;
  }

  async listLogs(
    tenantId: string,
    query: { page: number; limit: number; source?: string; level?: string },
  ) {
    const filtered = logEntries
      .filter((l) => l.tenantId === tenantId)
      .filter((l) => (query.source ? l.source === query.source : true))
      .filter((l) => (query.level ? l.level === query.level : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const items = filtered.slice(
      (query.page - 1) * query.limit,
      (query.page - 1) * query.limit + query.limit,
    );
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async exportLogs(tenantId: string, data: any) {
    const items = logEntries
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async exportAuditLogs(tenantId: string) {
    const items = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return {
      data: items,
      format: "json",
      exportedAt: new Date().toISOString(),
    };
  }

  async listBackupJobs(tenantId: string) {
    return backupJobs
      .filter((b) => b.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createBackupJob(tenantId: string, userId: string, data: any) {
    const now = new Date();
    const record: BackupJobRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      type: data.type ?? "FULL",
      status: "PENDING",
      startedAt: now,
      createdBy: userId,
      createdAt: now,
    };
    backupJobs.push(record);
    return record;
  }
  async restoreBackup(tenantId: string, id: string) {
    const b = findRecord(backupJobs, tenantId, id);
    if (!b) throw new NotFoundException("Backup job not found");
    return { message: `Restore from backup ${b.name} initiated`, backupId: id };
  }

  async listMigrations(tenantId: string) {
    return migrations
      .filter((m) => m.tenantId === tenantId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }
  async runMigration(tenantId: string, userId: string, data: any) {
    const now = new Date();
    const record: MigrationRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      direction: "UP",
      status: "COMPLETED",
      executedBy: userId,
      executedAt: now,
      createdAt: now,
    };
    migrations.push(record);
    return record;
  }
  async rollbackMigration(tenantId: string, userId: string, data: any) {
    const now = new Date();
    const record: MigrationRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      direction: "DOWN",
      status: "COMPLETED",
      executedBy: userId,
      executedAt: now,
      createdAt: now,
    };
    migrations.push(record);
    return record;
  }

  async listHealthChecks(tenantId: string) {
    return healthChecks.filter((h) => h.tenantId === tenantId);
  }
  async createHealthCheck(tenantId: string, data: any) {
    const now = new Date();
    const record: HealthCheckRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      endpoint: data.endpoint,
      method: data.method ?? "GET",
      intervalSec: data.intervalSec ?? 300,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    healthChecks.push(record);
    return record;
  }
  async deleteHealthCheck(tenantId: string, id: string) {
    const h = findRecord(healthChecks, tenantId, id);
    if (!h) throw new NotFoundException("Health check not found");
    return removeRecord(healthChecks, tenantId, id) as HealthCheckRecord;
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
    const filtered = errorRecords
      .filter((e) => e.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const items = filtered.slice(
      (query.page - 1) * query.limit,
      (query.page - 1) * query.limit + query.limit,
    );
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async resolveError(tenantId: string, id: string, userId: string) {
    const e = findRecord(errorRecords, tenantId, id);
    if (!e) throw new NotFoundException("Error record not found");
    e.status = "RESOLVED";
    e.resolvedBy = userId;
    e.resolvedAt = new Date();
    return e;
  }

  async listUptimeRecords(tenantId: string, checkId?: string) {
    return uptimeRecords
      .filter((u) => u.tenantId === tenantId)
      .filter((u) => (checkId ? u.checkId === checkId : true))
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, 100);
  }

  async listSlaContracts(tenantId: string) {
    return slaContracts.filter((s) => s.tenantId === tenantId);
  }
  async createSlaContract(tenantId: string, data: any) {
    const now = new Date();
    const record: SlaContractRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      uptimePct: data.uptimePct,
      responseTimeMs: data.responseTimeMs ?? 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    slaContracts.push(record);
    return record;
  }
  async updateSlaContract(tenantId: string, id: string, data: any) {
    const s = findRecord(slaContracts, tenantId, id);
    if (!s) throw new NotFoundException("SLA contract not found");
    Object.assign(s, data, { updatedAt: new Date() });
    return s;
  }
  async deleteSlaContract(tenantId: string, id: string) {
    const s = findRecord(slaContracts, tenantId, id);
    if (!s) throw new NotFoundException("SLA contract not found");
    return removeRecord(slaContracts, tenantId, id) as SlaContractRecord;
  }

  async listIncidents(tenantId: string) {
    return incidents
      .filter((i) => i.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createIncident(tenantId: string, data: any) {
    const now = new Date();
    const record: IncidentRecord = {
      id: createRecordId(),
      tenantId,
      title: data.title,
      description: data.description ?? null,
      severity: data.severity ?? "MINOR",
      source: data.source ?? null,
      status: "OPEN",
      resolvedBy: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    incidents.push(record);
    return record;
  }
  async updateIncident(tenantId: string, id: string, data: any) {
    const i = findRecord(incidents, tenantId, id);
    if (!i) throw new NotFoundException("Incident not found");
    Object.assign(i, data, { updatedAt: new Date() });
    return i;
  }
  async resolveIncident(tenantId: string, id: string, userId: string) {
    const i = findRecord(incidents, tenantId, id);
    if (!i) throw new NotFoundException("Incident not found");
    i.status = "RESOLVED";
    i.resolvedBy = userId;
    i.resolvedAt = new Date();
    i.updatedAt = new Date();
    return i;
  }

  async listCapacityPlans(tenantId: string) {
    return capacityPlans.filter((c) => c.tenantId === tenantId);
  }
  async createCapacityPlan(tenantId: string, data: any) {
    const now = new Date();
    const record: CapacityPlanRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      resourceType: data.resourceType,
      currentValue: data.currentValue,
      projectedValue: data.projectedValue ?? null,
      thresholdPct: data.thresholdPct ?? 80,
      createdAt: now,
      updatedAt: now,
    };
    capacityPlans.push(record);
    return record;
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
    return prisma.changeRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createChangeRequest(tenantId: string, userId: string, data: any) {
    return prisma.changeRequest.create({
      data: {
        tenantId,
        projectId: data.projectId ?? "",
        title: data.title,
        description: data.description ?? null,
        requestedAmount: data.requestedAmount ?? 0,
        requestedScheduleDays: data.requestedScheduleDays ?? 0,
      },
    });
  }
  async approveChangeRequest(tenantId: string, id: string, userId: string) {
    const c = await prisma.changeRequest.findFirst({ where: { id, tenantId } });
    if (!c) throw new NotFoundException("Change request not found");
    return prisma.changeRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedBy: userId, approvedAt: new Date() },
    });
  }
}
