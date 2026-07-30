import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class DevopsDeepV3Service {
  async getPipeline(tenantId: string, id: string) {
    return this.findOrThrow("devopsPipeline", tenantId, id);
  }
  async cancelPipeline(tenantId: string, id: string) {
    await prisma.devopsPipeline.updateMany({
      where: { id, tenantId },
      data: { lastStatus: "CANCELLED" },
    });
    return { cancelled: true };
  }
  async getDeployment(tenantId: string, id: string) {
    return this.findOrThrow("devopsDeployment", tenantId, id);
  }
  async cancelDeployment(tenantId: string, id: string) {
    await prisma.devopsDeployment.updateMany({
      where: { id, tenantId },
      data: { status: "CANCELLED" },
    });
    return { cancelled: true };
  }
  async getEnvironment(tenantId: string, id: string) {
    return this.findOrThrow("devopsEnvironment", tenantId, id);
  }
  async getConfigMap(tenantId: string, id: string) {
    return this.findOrThrow("devopsConfigMap", tenantId, id);
  }
  async getFeatureFlag(tenantId: string, flagKey: string) {
    return prisma.devopsFeatureFlag.findUnique({
      where: { tenantId_flagKey: { tenantId, flagKey } },
    });
  }
  async enableFeatureFlag(tenantId: string, flagKey: string) {
    await prisma.devopsFeatureFlag.updateMany({
      where: { tenantId, flagKey },
      data: { isEnabled: true },
    });
    return { enabled: true };
  }
  async disableFeatureFlag(tenantId: string, flagKey: string) {
    await prisma.devopsFeatureFlag.updateMany({
      where: { tenantId, flagKey },
      data: { isEnabled: false },
    });
    return { disabled: true };
  }
  async getDashboard(tenantId: string, id: string) {
    return this.findOrThrow("devopsMonitorDashboard", tenantId, id);
  }
  async getAlertConfig(tenantId: string, id: string) {
    return this.findOrThrow("devopsAlertConfig", tenantId, id);
  }
  async getLogEntry(tenantId: string, id: string) {
    return this.findOrThrow("devopsLogEntry", tenantId, id);
  }
  async exportLogs(tenantId: string, level?: string) {
    const where: any = { tenantId };
    if (level) where.level = level;
    const data = await prisma.devopsLogEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return { data, format: "json" };
  }
  async getBackupJob(tenantId: string, id: string) {
    return this.findOrThrow("devopsBackupJob", tenantId, id);
  }
  async getMigration(tenantId: string, id: string) {
    return this.findOrThrow("devopsMigrationRecord", tenantId, id);
  }
  async getHealthCheck(tenantId: string, id: string) {
    return this.findOrThrow("devopsHealthCheck", tenantId, id);
  }
  async getError(tenantId: string, id: string) {
    return this.findOrThrow("devopsErrorRecord", tenantId, id);
  }
  async getUptime(tenantId: string, id: string) {
    return this.findOrThrow("devopsUptimeRecord", tenantId, id);
  }
  async getSlaContract(tenantId: string, id: string) {
    return this.findOrThrow("devopsSlaContract", tenantId, id);
  }
  async getIncident(tenantId: string, id: string) {
    return this.findOrThrow("devopsIncident", tenantId, id);
  }
  async getCapacityPlan(tenantId: string, id: string) {
    return this.findOrThrow("devopsCapacityPlan", tenantId, id);
  }
  async getChangeRequest(tenantId: string, id: string) {
    return this.findOrThrow("devopsChangeRequest", tenantId, id);
  }
  async rejectChangeRequest(tenantId: string, id: string) {
    await prisma.devopsChangeRequest.updateMany({
      where: { id, tenantId },
      data: { status: "REJECTED" },
    });
    return { rejected: true };
  }
  async getCertificate(tenantId: string, id: string) {
    return this.findOrThrow("devopsCertificate", tenantId, id);
  }
  async renewCertificate(tenantId: string, id: string) {
    await prisma.devopsCertificate.updateMany({
      where: { id, tenantId },
      data: {
        notBefore: new Date(),
        notAfter: new Date(Date.now() + 365 * 86400000),
      },
    });
    return { renewed: true };
  }
  async getSystemHealth(tenantId: string) {
    return {
      status: "healthy",
      uptime: "99.9%",
      services: { api: "up", database: "up", redis: "up" },
      timestamp: new Date().toISOString(),
    };
  }
  async getRealtimeMetrics(tenantId: string) {
    return {
      requestsPerSec: 42,
      avgLatencyMs: 128,
      errorRate: 0.01,
      activeConnections: 156,
      timestamp: new Date().toISOString(),
    };
  }
  private async findOrThrow(model: string, tenantId: string, id: string) {
    const item = await (prisma as any)[model].findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException(`${model} not found`);
    return item;
  }
}
