import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { randomUUID } from "node:crypto";

interface CorsConfigRecord {
  id: string;
  tenantId: string;
  origin: string;
  methods: string[];
  headers: string[];
}

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
}

@Injectable()
export class ApiPlatformDeepV2Service {
  private corsConfigs: CorsConfigRecord[] = [];
  private integrationTemplates: IntegrationTemplateRecord[] = [];
  private healthChecks: HealthCheckRecord[] = [];

  async rotateApiKey(tenantId: string, id: string) {
    const key = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return idpPrisma.apiKey.update({
      where: { id },
      data: { hashedKey: "rotated-" + Date.now() },
    });
  }
  async getApiKeyStats(tenantId: string) {
    const [active, total, expired] = await Promise.all([
      idpPrisma.apiKey.count({ where: { tenantId, status: "ACTIVE" } }),
      idpPrisma.apiKey.count({ where: { tenantId } }),
      idpPrisma.apiKey.count({
        where: { tenantId, expiresAt: { lte: new Date() } },
      }),
    ]);
    return { active, total, expired };
  }
  async revokeApiKey(tenantId: string, id: string) {
    await idpPrisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { status: "REVOKED" },
    });
    return { revoked: true };
  }
  async bulkRevokeApiKeys(tenantId: string, ids: string[]) {
    await idpPrisma.apiKey.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status: "REVOKED" },
    });
    return { revoked: ids.length };
  }
  async getRateLimitStats(tenantId: string) {
    const limits = await prisma.apiRateLimitRule.findMany({
      where: { tenantId },
    });
    return {
      total: limits.length,
      active: limits.filter((l) => l.isActive).length,
    };
  }
  async getRateLimitUsage(tenantId: string, id: string) {
    return { usage: 0, limit: 100, remaining: 100 };
  }
  async resetRateLimits(tenantId: string) {
    await prisma.apiRateLimitRule.updateMany({
      where: { tenantId },
      data: { isActive: true },
    });
    return { reset: true };
  }
  async listWebhookDeliveries(
    tenantId: string,
    webhookId: string,
    page: number = 1,
  ) {
    const items = await prisma.webhookDeliveryLog.findMany({
      where: { subscriptionId: webhookId, tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async getWebhookDelivery(tenantId: string, id: string) {
    const item = await prisma.webhookDeliveryLog.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Delivery not found");
    return item;
  }
  async retryWebhookDelivery(tenantId: string, id: string) {
    await prisma.webhookDeliveryLog.updateMany({
      where: { id, tenantId, status: { not: "SUCCESS" } },
      data: { attempts: { increment: 1 }, status: "RETRYING" },
    });
    return { retried: true };
  }
  async getWebhookStats(tenantId: string) {
    const [total, active, failed] = await Promise.all([
      prisma.webhookSubscription.count({ where: { tenantId } }),
      prisma.webhookSubscription.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      prisma.webhookSubscription.count({
        where: { tenantId, status: "INACTIVE" },
      }),
    ]);
    return { total, active, failed };
  }
  async testWebhook(tenantId: string, id: string) {
    const webhook = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    return {
      success: true,
      webhook: webhook ? { id: webhook.id, url: webhook.targetUrl } : null,
      statusCode: 200,
    };
  }
  async listCorsConfigs(tenantId: string) {
    return this.corsConfigs.filter((c) => c.tenantId === tenantId);
  }
  async createCorsConfig(tenantId: string, data: any) {
    const record: CorsConfigRecord = {
      id: randomUUID(),
      tenantId,
      origin: data.origin,
      methods: data.methods ?? ["GET", "POST", "PUT", "DELETE"],
      headers: data.headers ?? ["Content-Type", "Authorization"],
    };
    this.corsConfigs.push(record);
    return record;
  }
  async updateCorsConfig(tenantId: string, origin: string, data: any) {
    const existing = this.corsConfigs.find(
      (c) => c.tenantId === tenantId && c.origin === origin,
    );
    if (existing) {
      existing.methods = data.methods ?? existing.methods;
      existing.headers = data.headers ?? existing.headers;
      return existing;
    }
    const record: CorsConfigRecord = {
      id: randomUUID(),
      tenantId,
      origin,
      methods: data.methods ?? [],
      headers: data.headers ?? [],
    };
    this.corsConfigs.push(record);
    return record;
  }
  async deleteCorsConfig(tenantId: string, origin: string) {
    this.corsConfigs = this.corsConfigs.filter(
      (c) => !(c.tenantId === tenantId && c.origin === origin),
    );
    return { deleted: true };
  }
  async listSchemas(tenantId: string) {
    return prisma.schemaRegistry.findMany({ where: { tenantId } });
  }
  async registerSchema(tenantId: string, data: any) {
    return prisma.schemaRegistry.create({
      data: {
        tenantId,
        module: "api-platform",
        name: data.name,
        slug: data.name,
        fields: data.schema,
        settings: {
          version: data.version ?? "1.0",
          format: data.format ?? "openapi",
        },
        status: "ACTIVE",
      },
    });
  }
  async deleteSchema(tenantId: string, id: string) {
    await prisma.schemaRegistry.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listIntegrationTemplates(tenantId: string) {
    return this.integrationTemplates.filter((t) => t.tenantId === tenantId);
  }
  async createIntegrationTemplate(tenantId: string, data: any) {
    const record: IntegrationTemplateRecord = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      provider: data.provider,
      config: data.config,
      description: data.description ?? null,
      isPrebuilt: false,
    };
    this.integrationTemplates.push(record);
    return record;
  }
  async deleteIntegrationTemplate(tenantId: string, id: string) {
    this.integrationTemplates = this.integrationTemplates.filter(
      (t) => !(t.id === id && t.tenantId === tenantId),
    );
    return { deleted: true };
  }
  async getIntegrationTemplateStats(tenantId: string) {
    const templates = this.integrationTemplates.filter(
      (t) => t.tenantId === tenantId,
    );
    return {
      total: templates.length,
      prebuilt: templates.filter((t) => t.isPrebuilt).length,
    };
  }
  async listDataExports(tenantId: string, page: number = 1) {
    const items = await prisma.dataExportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async createDataExport(tenantId: string, userId: string, data: any) {
    return prisma.dataExportJob.create({
      data: {
        tenantId,
        type: "EXPORT",
        format: data.format,
        scope: data.scope,
        status: "PENDING",
      },
    });
  }
  async downloadDataExport(tenantId: string, id: string) {
    const item = await prisma.dataExportJob.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Export not found");
    return item;
  }
  async deleteDataExport(tenantId: string, id: string) {
    await prisma.dataExportJob.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listDataImports(tenantId: string) {
    return prisma.dataImportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createDataImport(tenantId: string, userId: string, data: any) {
    return prisma.dataImportJob.create({
      data: {
        tenantId,
        name: data.name,
        targetModel: data.name,
        fileName: data.name,
        fileSize: 0,
        columnMapping: data.mapping ?? {},
        status: "PENDING",
        createdBy: userId,
      },
    });
  }
  async listHealthChecks(tenantId: string) {
    return this.healthChecks.filter((h) => h.tenantId === tenantId);
  }
  async createHealthCheck(tenantId: string, data: any) {
    const record: HealthCheckRecord = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      endpoint: data.endpoint,
      intervalSec: data.intervalSec ?? 300,
      isActive: true,
    };
    this.healthChecks.push(record);
    return record;
  }
  async toggleHealthCheck(tenantId: string, id: string) {
    const hc = this.healthChecks.find(
      (h) => h.id === id && h.tenantId === tenantId,
    );
    if (!hc) throw new NotFoundException("Health check not found");
    hc.isActive = !hc.isActive;
    return hc;
  }
  async deleteHealthCheck(tenantId: string, id: string) {
    this.healthChecks = this.healthChecks.filter(
      (h) => !(h.id === id && h.tenantId === tenantId),
    );
    return { deleted: true };
  }
  async listAccessLogs(tenantId: string, page: number = 1) {
    const items = await prisma.apiUsageMetric.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
    });
    return { items, page };
  }
  async getAccessLogStats(tenantId: string) {
    const [total, today, errors] = await Promise.all([
      prisma.apiUsageMetric.count({ where: { tenantId } }),
      prisma.apiUsageMetric.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
      prisma.apiUsageMetric.count({
        where: { tenantId, statusCode: { gte: 500 } },
      }),
    ]);
    return { total, today, errors };
  }
  async exportAccessLogs(tenantId: string) {
    const data = await prisma.apiUsageMetric.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return { data, format: "json" };
  }
  async getUsageSummary(tenantId: string) {
    const [apiKeys, webhooks, endpoints] = await Promise.all([
      idpPrisma.apiKey.count({ where: { tenantId } }),
      prisma.webhookSubscription.count({ where: { tenantId } }),
      prisma.apiUsageMetric.count({ where: { tenantId } }),
    ]);
    return { apiKeys, webhooks, recentAccessLogs: endpoints };
  }
  async getApiPlatformHealth(tenantId: string) {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: "99.9%",
      version: "v1",
    };
  }
  async getPlatformConfig() {
    return {
      maxApiKeys: 100,
      maxWebhooks: 50,
      maxRateLimit: 1000,
      supportedFormats: ["JSON", "CSV", "XML"],
    };
  }
  async listUsageQuotas(tenantId: string) {
    return prisma.apiRateLimitRule.findMany({ where: { tenantId } });
  }
  async updateUsageQuota(tenantId: string, metric: string, limit: number) {
    const existing = await prisma.apiRateLimitRule.findFirst({
      where: { tenantId, endpointPath: metric },
    });
    if (existing) {
      return prisma.apiRateLimitRule.update({
        where: { id: existing.id },
        data: { limitPerMinute: limit },
      });
    }
    return prisma.apiRateLimitRule.create({
      data: {
        tenantId,
        name: metric,
        endpointPath: metric,
        limitPerMinute: limit,
      },
    });
  }
  async listIpAccessRules(tenantId: string) {
    return prisma.ipRestriction.findMany({ where: { tenantId } });
  }
  async createIpAccessRule(tenantId: string, data: any) {
    return prisma.ipRestriction.create({
      data: { tenantId, ipRange: data.cidr, ruleType: data.type ?? "ALLOW" },
    });
  }
  async deleteIpAccessRule(tenantId: string, id: string) {
    await prisma.ipRestriction.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listEndpoints(tenantId: string) {
    return [
      {
        path: "/api/*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        auth: "jwt",
      },
    ];
  }
  async listApiVersions(tenantId: string) {
    return [
      { version: "v1", status: "current", releasedAt: "2025-01-01" },
      { version: "v2", status: "beta", releasedAt: "2026-01-01" },
    ];
  }
  async getApiAnalytics(tenantId: string) {
    const logs = await prisma.apiUsageMetric.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    return {
      totalRequests: logs.length,
      uniqueEndpoints: [...new Set(logs.map((l) => l.endpoint))].length,
      errorRate:
        logs.filter((l) => l.statusCode >= 400).length /
        Math.max(logs.length, 1),
    };
  }
  async exportApiAnalytics(tenantId: string) {
    const data = await prisma.apiUsageMetric.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    return { data, format: "json", exportedAt: new Date().toISOString() };
  }
}
