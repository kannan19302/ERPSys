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
  changeRequests,
  certificates,
  createRecordId,
  findRecord,
  removeRecord,
  type CertificateRecord,
} from "./devops-deep.store";

@Injectable()
export class DevopsDeepV2Service {
  private readonly logger = new Logger(DevopsDeepV2Service.name);

  async getPipelineStats(tenantId: string) {
    const total = pipelines.filter((p) => p.tenantId === tenantId).length;
    const active = pipelines.filter(
      (p) => p.tenantId === tenantId && p.isActive,
    ).length;
    return { total, active };
  }
  async triggerPipeline(tenantId: string, id: string) {
    const p = findRecord(pipelines, tenantId, id);
    if (!p) throw new NotFoundException("Pipeline not found");
    p.lastRunAt = new Date();
    p.lastStatus = "RUNNING";
    p.updatedAt = new Date();
    return { triggered: true, pipelineId: id };
  }
  async getDeploymentStats(tenantId: string) {
    const [total, successful, failed] = await Promise.all([
      prisma.deployment.count({ where: { tenantId } }),
      prisma.deployment.count({ where: { tenantId, status: "SUCCESS" } }),
      prisma.deployment.count({ where: { tenantId, status: "FAILED" } }),
    ]);
    return { total, successful, failed };
  }
  async getDeploymentHistory(tenantId: string, page: number = 1) {
    const items = await prisma.deployment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async getEnvironmentStats(tenantId: string) {
    const environments = await prisma.environment.findMany({
      where: { tenantId },
    });
    const total = environments.length;
    const protectedCount = environments.filter(
      (e) => (e.metadata as Record<string, unknown>)?.isProtected === true,
    ).length;
    return { total, protected: protectedCount };
  }
  async getConfigMapStats(tenantId: string) {
    return {
      total: configMaps.filter((c) => c.tenantId === tenantId).length,
    };
  }
  async getFeatureFlagStats(tenantId: string) {
    const [total, enabled] = await Promise.all([
      prisma.saasFeatureFlag.count({ where: { tenantId } }),
      prisma.saasFeatureFlag.count({ where: { tenantId, isEnabled: true } }),
    ]);
    return { total, enabled };
  }
  async getDashboardStats(tenantId: string) {
    return {
      total: monitorDashboards.filter((d) => d.tenantId === tenantId).length,
    };
  }
  async getAlertStats(tenantId: string) {
    const total = alertConfigs.filter((a) => a.tenantId === tenantId).length;
    const active = alertConfigs.filter(
      (a) => a.tenantId === tenantId && a.isActive,
    ).length;
    return { total, active };
  }
  async triggerAlert(tenantId: string, id: string) {
    const a = findRecord(alertConfigs, tenantId, id);
    if (!a) throw new NotFoundException("Alert config not found");
    a.lastTriggeredAt = new Date();
    a.updatedAt = new Date();
    return { triggered: true, alertId: id };
  }
  async getLogStats(tenantId: string) {
    const logs = logEntries.filter((l) => l.tenantId === tenantId);
    const total = logs.length;
    const errors = logs.filter((l) => l.level === "ERROR").length;
    const warns = logs.filter((l) => l.level === "WARN").length;
    return { total, errors, warns };
  }
  async getBackupStats(tenantId: string) {
    const jobs = backupJobs.filter((b) => b.tenantId === tenantId);
    const total = jobs.length;
    const successful = jobs.filter((b) => b.status === "SUCCESS").length;
    const failed = jobs.filter((b) => b.status === "FAILED").length;
    return { total, successful, failed };
  }
  async getMigrationStats(tenantId: string) {
    const records = migrations.filter((m) => m.tenantId === tenantId);
    const total = records.length;
    const successful = records.filter((m) => m.status === "SUCCESS").length;
    return { total, successful };
  }
  async getHealthCheckStats(tenantId: string) {
    const total = healthChecks.filter((h) => h.tenantId === tenantId).length;
    const active = healthChecks.filter(
      (h) => h.tenantId === tenantId && h.isActive,
    ).length;
    return { total, active };
  }
  async getErrorStats(tenantId: string) {
    const records = errorRecords.filter((e) => e.tenantId === tenantId);
    const total = records.length;
    const open = records.filter((e) => e.status === "OPEN").length;
    return { total, open };
  }
  async getUptimeStats(tenantId: string) {
    const records = uptimeRecords
      .filter((u) => u.tenantId === tenantId)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, 100);
    return {
      total: records.length,
      up: records.filter((r) => r.status === "UP").length,
      down: records.filter((r) => r.status === "DOWN").length,
    };
  }
  async getSlaStats(tenantId: string) {
    const total = slaContracts.filter((s) => s.tenantId === tenantId).length;
    const active = slaContracts.filter(
      (s) => s.tenantId === tenantId && s.isActive,
    ).length;
    return { total, active };
  }
  async getIncidentStats(tenantId: string) {
    const records = incidents.filter((i) => i.tenantId === tenantId);
    const total = records.length;
    const open = records.filter((i) => i.status === "OPEN").length;
    const resolved = records.filter((i) => i.status === "RESOLVED").length;
    return { total, open, resolved };
  }
  async getCapacityPlanStats(tenantId: string) {
    return {
      total: capacityPlans.filter((c) => c.tenantId === tenantId).length,
    };
  }
  async getChangeRequestStats(tenantId: string) {
    const records = changeRequests.filter((c) => c.tenantId === tenantId);
    const total = records.length;
    const approved = records.filter((c) => c.status === "APPROVED").length;
    const pending = records.filter((c) => c.status === "DRAFT").length;
    return { total, approved, pending };
  }
  async listCertificates(tenantId: string) {
    return certificates
      .filter((c) => c.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async createCertificate(tenantId: string, data: any) {
    const now = new Date();
    const record: CertificateRecord = {
      id: createRecordId(),
      tenantId,
      name: data.name,
      domain: data.domain,
      issuer: data.issuer ?? null,
      notBefore: new Date(data.notBefore),
      notAfter: new Date(data.notAfter),
      fingerprint: data.fingerprint ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    certificates.push(record);
    return record;
  }
  async updateCertificate(tenantId: string, id: string, data: any) {
    const item = findRecord(certificates, tenantId, id);
    if (!item) throw new NotFoundException("Certificate not found");
    Object.assign(item, data, { updatedAt: new Date() });
    return item;
  }
  async deleteCertificate(tenantId: string, id: string) {
    const item = findRecord(certificates, tenantId, id);
    if (!item) throw new NotFoundException("Certificate not found");
    return removeRecord(certificates, tenantId, id) as CertificateRecord;
  }
  async getCertificateStats(tenantId: string) {
    const records = certificates.filter((c) => c.tenantId === tenantId);
    const total = records.length;
    const active = records.filter((c) => c.isActive).length;
    const expiring = records.filter(
      (c) => c.notAfter.getTime() <= Date.now() + 30 * 86400000,
    ).length;
    return { total, active, expiringSoon: expiring };
  }
  async getDevopsSummary(tenantId: string) {
    const [pipelinesCount, deployments, incidentsCount, alerts] =
      await Promise.all([
        Promise.resolve(
          pipelines.filter((p) => p.tenantId === tenantId).length,
        ),
        prisma.deployment.count({ where: { tenantId } }),
        Promise.resolve(
          incidents.filter(
            (i) => i.tenantId === tenantId && i.status === "OPEN",
          ).length,
        ),
        Promise.resolve(
          alertConfigs.filter((a) => a.tenantId === tenantId && a.isActive)
            .length,
        ),
      ]);
    return {
      pipelines: pipelinesCount,
      deployments,
      openIncidents: incidentsCount,
      activeAlerts: alerts,
    };
  }
  async getPerformanceMetrics(tenantId: string) {
    return {
      cpu: "45%",
      memory: "62%",
      disk: "78%",
      avgResponseMs: 245,
      timestamp: new Date().toISOString(),
    };
  }
  async getResourceMetrics(tenantId: string) {
    return {
      pods: 12,
      nodes: 3,
      cpuTotal: 8,
      memoryTotal: "32GB",
      cpuUsed: "3.6",
      memoryUsed: "19.8GB",
      timestamp: new Date().toISOString(),
    };
  }
}
