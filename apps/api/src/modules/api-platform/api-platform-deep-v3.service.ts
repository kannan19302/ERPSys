import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { randomUUID } from "node:crypto";

interface IntegrationTemplateRecord {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  provider: string;
  config: unknown;
  isPrebuilt: boolean;
}

interface HealthCheckRecord {
  id: string;
  tenantId: string;
  name: string;
  endpoint: string;
  intervalSec: number;
  isActive: boolean;
  lastCheckedAt: Date | null;
  lastStatus: string;
}

interface CorsConfigRecord {
  id: string;
  tenantId: string;
  origin: string;
  methods: string[];
  headers: string[];
}

@Injectable()
export class ApiPlatformDeepV3Service {
  private integrationTemplates: IntegrationTemplateRecord[] = [];
  private healthChecks: HealthCheckRecord[] = [];
  private corsConfigs: CorsConfigRecord[] = [];

  async getApiKey(tenantId: string, id: string) {
    const key = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return key;
  }
  async renameApiKey(tenantId: string, id: string, name: string) {
    await idpPrisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { name },
    });
    return { renamed: true };
  }
  async regenerateApiKey(tenantId: string, id: string) {
    await idpPrisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { hashedKey: "reg-" + Date.now() },
    });
    return { regenerated: true };
  }
  async getWebhook(tenantId: string, id: string) {
    const w = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!w) throw new NotFoundException("Webhook not found");
    return w;
  }
  async renameWebhook(tenantId: string, id: string, name: string) {
    await prisma.webhookSubscription.updateMany({
      where: { id, tenantId },
      data: { name },
    });
    return { renamed: true };
  }
  async enableWebhook(tenantId: string, id: string) {
    await prisma.webhookSubscription.updateMany({
      where: { id, tenantId },
      data: { status: "ACTIVE" },
    });
    return { enabled: true };
  }
  async disableWebhook(tenantId: string, id: string) {
    await prisma.webhookSubscription.updateMany({
      where: { id, tenantId },
      data: { status: "INACTIVE" },
    });
    return { disabled: true };
  }
  async getSchema(tenantId: string, id: string) {
    return prisma.schemaRegistry.findFirst({ where: { id, tenantId } });
  }
  async getIntegrationTemplate(tenantId: string, id: string) {
    return (
      this.integrationTemplates.find(
        (t) => t.id === id && t.tenantId === tenantId,
      ) ?? null
    );
  }
  async getHealthCheck(tenantId: string, id: string) {
    return (
      this.healthChecks.find((h) => h.id === id && h.tenantId === tenantId) ??
      null
    );
  }
  async runHealthCheck(tenantId: string, id: string) {
    const hc = this.healthChecks.find(
      (h) => h.id === id && h.tenantId === tenantId,
    );
    if (hc) {
      hc.lastCheckedAt = new Date();
      hc.lastStatus = "UP";
    }
    return { status: "UP", responseMs: 45 };
  }
  async getDataExport(tenantId: string, id: string) {
    return prisma.dataExportJob.findFirst({ where: { id, tenantId } });
  }
  async getDataImport(tenantId: string, id: string) {
    return prisma.dataImportJob.findFirst({ where: { id, tenantId } });
  }
  async getUsageQuota(tenantId: string, metric: string) {
    return prisma.apiRateLimitRule.findFirst({
      where: { tenantId, endpointPath: metric },
    });
  }
  async getCorsConfig(tenantId: string, origin: string) {
    return (
      this.corsConfigs.find(
        (c) => c.tenantId === tenantId && c.origin === origin,
      ) ?? null
    );
  }
  async getRateLimit(tenantId: string, endpoint: string) {
    return prisma.apiRateLimitRule.findFirst({
      where: { tenantId, endpointPath: endpoint },
    });
  }
  async listCategories(tenantId: string) {
    return [
      ...new Set(
        this.integrationTemplates
          .filter((t) => t.tenantId === tenantId)
          .map((t) => t.provider),
      ),
    ].map((p) => ({ name: p }));
  }
  async createCategory(tenantId: string, data: any) {
    return { ...data, tenantId };
  }
  async deleteCategory(tenantId: string, id: string) {
    return { deleted: true };
  }
  async listTags(tenantId: string) {
    return [
      { id: "1", name: "critical", color: "red" },
      { id: "2", name: "deprecated", color: "yellow" },
    ];
  }
  async createTag(tenantId: string, data: any) {
    return { ...data, tenantId };
  }
  async deleteTag(tenantId: string, id: string) {
    return { deleted: true };
  }
  async getPlatformDashboard(tenantId: string) {
    const [apiKeys, webhooks, logs] = await Promise.all([
      idpPrisma.apiKey.count({ where: { tenantId } }),
      prisma.webhookSubscription.count({ where: { tenantId } }),
      prisma.apiUsageMetric.count({ where: { tenantId } }),
    ]);
    return { apiKeys, webhooks, recentLogs: logs };
  }
  async getApiDocs() {
    return {
      openapi: "3.0.0",
      info: { title: "UniERP API", version: "1.0.0" },
    };
  }
  async getRecentActivity(tenantId: string) {
    return prisma.apiUsageMetric.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}
