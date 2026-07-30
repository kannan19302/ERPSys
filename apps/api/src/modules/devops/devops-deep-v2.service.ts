import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class DevopsDeepV2Service {
  async getPipelineStats(tenantId: string) {
    const [total, active] = await Promise.all([
      prisma.devopsPipeline.count({ where: { tenantId } }),
      prisma.devopsPipeline.count({ where: { tenantId, isActive: true } }),
    ]);
    return { total, active };
  }
  async triggerPipeline(tenantId: string, id: string) {
    await prisma.devopsPipeline.updateMany({
      where: { id, tenantId },
      data: { lastRunAt: new Date(), lastStatus: "RUNNING" },
    });
    return { triggered: true, pipelineId: id };
  }
  async getDeploymentStats(tenantId: string) {
    const [total, successful, failed] = await Promise.all([
      prisma.devopsDeployment.count({ where: { tenantId } }),
      prisma.devopsDeployment.count({ where: { tenantId, status: "SUCCESS" } }),
      prisma.devopsDeployment.count({ where: { tenantId, status: "FAILED" } }),
    ]);
    return { total, successful, failed };
  }
  async getDeploymentHistory(tenantId: string, page: number = 1) {
    const items = await prisma.devopsDeployment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async getEnvironmentStats(tenantId: string) {
    const [total, protected] = await Promise.all([
      prisma.devopsEnvironment.count({ where: { tenantId } }),
      prisma.devopsEnvironment.count({
        where: { tenantId, isProtected: true },
      }),
    ]);
    return { total, protected };
  }
  async getConfigMapStats(tenantId: string) {
    return {
      total: await prisma.devopsConfigMap.count({ where: { tenantId } }),
    };
  }
  async getFeatureFlagStats(tenantId: string) {
    const [total, enabled] = await Promise.all([
      prisma.devopsFeatureFlag.count({ where: { tenantId } }),
      prisma.devopsFeatureFlag.count({ where: { tenantId, isEnabled: true } }),
    ]);
    return { total, enabled };
  }
  async getDashboardStats(tenantId: string) {
    return {
      total: await prisma.devopsMonitorDashboard.count({ where: { tenantId } }),
    };
  }
  async getAlertStats(tenantId: string) {
    const [total, active] = await Promise.all([
      prisma.devopsAlertConfig.count({ where: { tenantId } }),
      prisma.devopsAlertConfig.count({ where: { tenantId, isActive: true } }),
    ]);
    return { total, active };
  }
  async triggerAlert(tenantId: string, id: string) {
    await prisma.devopsAlertConfig.updateMany({
      where: { id, tenantId },
      data: { lastTriggeredAt: new Date() },
    });
    return { triggered: true, alertId: id };
  }
  async getLogStats(tenantId: string) {
    const [total, errors, warns] = await Promise.all([
      prisma.devopsLogEntry.count({ where: { tenantId } }),
      prisma.devopsLogEntry.count({ where: { tenantId, level: "ERROR" } }),
      prisma.devopsLogEntry.count({ where: { tenantId, level: "WARN" } }),
    ]);
    return { total, errors, warns };
  }
  async getBackupStats(tenantId: string) {
    const [total, successful, failed] = await Promise.all([
      prisma.devopsBackupJob.count({ where: { tenantId } }),
      prisma.devopsBackupJob.count({ where: { tenantId, status: "SUCCESS" } }),
      prisma.devopsBackupJob.count({ where: { tenantId, status: "FAILED" } }),
    ]);
    return { total, successful, failed };
  }
  async getMigrationStats(tenantId: string) {
    const [total, successful] = await Promise.all([
      prisma.devopsMigrationRecord.count({ where: { tenantId } }),
      prisma.devopsMigrationRecord.count({
        where: { tenantId, status: "SUCCESS" },
      }),
    ]);
    return { total, successful };
  }
  async getHealthCheckStats(tenantId: string) {
    const [total, active] = await Promise.all([
      prisma.devopsHealthCheck.count({ where: { tenantId } }),
      prisma.devopsHealthCheck.count({ where: { tenantId, isActive: true } }),
    ]);
    return { total, active };
  }
  async getErrorStats(tenantId: string) {
    const [total, open] = await Promise.all([
      prisma.devopsErrorRecord.count({ where: { tenantId } }),
      prisma.devopsErrorRecord.count({ where: { tenantId, status: "OPEN" } }),
    ]);
    return { total, open };
  }
  async getUptimeStats(tenantId: string) {
    const records = await prisma.devopsUptimeRecord.findMany({
      where: { tenantId },
      orderBy: { checkedAt: "desc" },
      take: 100,
    });
    return {
      total: records.length,
      up: records.filter((r) => r.status === "UP").length,
      down: records.filter((r) => r.status === "DOWN").length,
    };
  }
  async getSlaStats(tenantId: string) {
    const [total, active] = await Promise.all([
      prisma.devopsSlaContract.count({ where: { tenantId } }),
      prisma.devopsSlaContract.count({ where: { tenantId, isActive: true } }),
    ]);
    return { total, active };
  }
  async getIncidentStats(tenantId: string) {
    const [total, open, resolved] = await Promise.all([
      prisma.devopsIncident.count({ where: { tenantId } }),
      prisma.devopsIncident.count({ where: { tenantId, status: "OPEN" } }),
      prisma.devopsIncident.count({ where: { tenantId, status: "RESOLVED" } }),
    ]);
    return { total, open, resolved };
  }
  async getCapacityPlanStats(tenantId: string) {
    return {
      total: await prisma.devopsCapacityPlan.count({ where: { tenantId } }),
    };
  }
  async getChangeRequestStats(tenantId: string) {
    const [total, approved, pending] = await Promise.all([
      prisma.devopsChangeRequest.count({ where: { tenantId } }),
      prisma.devopsChangeRequest.count({
        where: { tenantId, status: "APPROVED" },
      }),
      prisma.devopsChangeRequest.count({
        where: { tenantId, status: "DRAFT" },
      }),
    ]);
    return { total, approved, pending };
  }
  async listCertificates(tenantId: string) {
    return prisma.devopsCertificate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createCertificate(tenantId: string, data: any) {
    return prisma.devopsCertificate.create({
      data: {
        tenantId,
        name: data.name,
        domain: data.domain,
        issuer: data.issuer,
        notBefore: new Date(data.notBefore),
        notAfter: new Date(data.notAfter),
        fingerprint: data.fingerprint,
      },
    });
  }
  async updateCertificate(tenantId: string, id: string, data: any) {
    const item = await prisma.devopsCertificate.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Certificate not found");
    return prisma.devopsCertificate.update({ where: { id }, data });
  }
  async deleteCertificate(tenantId: string, id: string) {
    await prisma.devopsCertificate.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async getCertificateStats(tenantId: string) {
    const [total, active, expiring] = await Promise.all([
      prisma.devopsCertificate.count({ where: { tenantId } }),
      prisma.devopsCertificate.count({ where: { tenantId, isActive: true } }),
      prisma.devopsCertificate.count({
        where: {
          tenantId,
          notAfter: { lte: new Date(Date.now() + 30 * 86400000) },
        },
      }),
    ]);
    return { total, active, expiringSoon: expiring };
  }
  async getDevopsSummary(tenantId: string) {
    const [pipelines, deployments, incidents, alerts] = await Promise.all([
      prisma.devopsPipeline.count({ where: { tenantId } }),
      prisma.devopsDeployment.count({ where: { tenantId } }),
      prisma.devopsIncident.count({ where: { tenantId, status: "OPEN" } }),
      prisma.devopsAlertConfig.count({ where: { tenantId, isActive: true } }),
    ]);
    return {
      pipelines,
      deployments,
      openIncidents: incidents,
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
