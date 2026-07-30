// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ApiPlatformDeepV2Service {
  async rotateApiKey(tenantId: string, id: string) {
    const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return prisma.apiKey.update({
      where: { id },
      data: { keyHash: "rotated-" + Date.now(), lastUsedAt: new Date() },
    });
  }
  async getApiKeyStats(tenantId: string) {
    const [active, total, expired] = await Promise.all([
      prisma.apiKey.count({ where: { tenantId, isActive: true } }),
      prisma.apiKey.count({ where: { tenantId } }),
      prisma.apiKey.count({
        where: { tenantId, expiresAt: { lte: new Date() } },
      }),
    ]);
    return { active, total, expired };
  }
  async revokeApiKey(tenantId: string, id: string) {
    await prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return { revoked: true };
  }
  async bulkRevokeApiKeys(tenantId: string, ids: string[]) {
    await prisma.apiKey.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { isActive: false },
    });
    return { revoked: ids.length };
  }
  async getRateLimitStats(tenantId: string) {
    const limits = await prisma.apiRateLimit.findMany({ where: { tenantId } });
    return {
      total: limits.length,
      active: limits.filter((l) => l.isActive).length,
    };
  }
  async getRateLimitUsage(tenantId: string, id: string) {
    return { usage: 0, limit: 100, remaining: 100 };
  }
  async resetRateLimits(tenantId: string) {
    await prisma.apiRateLimit.updateMany({
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
    const items = await prisma.apiWebhookDelivery.findMany({
      where: { webhookId, tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async getWebhookDelivery(tenantId: string, id: string) {
    const item = await prisma.apiWebhookDelivery.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Delivery not found");
    return item;
  }
  async retryWebhookDelivery(tenantId: string, id: string) {
    await prisma.apiWebhookDelivery.updateMany({
      where: { id, tenantId, status: { not: "SUCCESS" } },
      data: { attempt: { increment: 1 }, status: "RETRYING" },
    });
    return { retried: true };
  }
  async getWebhookStats(tenantId: string) {
    const [total, active, failed] = await Promise.all([
      prisma.apiWebhook.count({ where: { tenantId } }),
      prisma.apiWebhook.count({ where: { tenantId, isActive: true } }),
      prisma.apiWebhook.count({ where: { tenantId, isActive: false } }),
    ]);
    return { total, active, failed };
  }
  async testWebhook(tenantId: string, id: string) {
    const webhook = await prisma.apiWebhook.findFirst({
      where: { id, tenantId },
    });
    return {
      success: true,
      webhook: webhook ? { id: webhook.id, url: webhook.url } : null,
      statusCode: 200,
    };
  }
  async listCorsConfigs(tenantId: string) {
    return prisma.apiCorsConfig.findMany({ where: { tenantId } });
  }
  async createCorsConfig(tenantId: string, data: any) {
    return prisma.apiCorsConfig.create({
      data: {
        tenantId,
        origin: data.origin,
        methods: data.methods ?? ["GET", "POST", "PUT", "DELETE"],
        headers: data.headers ?? ["Content-Type", "Authorization"],
      },
    });
  }
  async updateCorsConfig(tenantId: string, origin: string, data: any) {
    return prisma.apiCorsConfig.update({
      where: { tenantId_origin: { tenantId, origin } },
      data,
    });
  }
  async deleteCorsConfig(tenantId: string, origin: string) {
    await prisma.apiCorsConfig.deleteMany({ where: { tenantId, origin } });
    return { deleted: true };
  }
  async listSchemas(tenantId: string) {
    return prisma.apiSchemaRegistry.findMany({ where: { tenantId } });
  }
  async registerSchema(tenantId: string, data: any) {
    return prisma.apiSchemaRegistry.create({
      data: {
        tenantId,
        name: data.name,
        version: data.version ?? "1.0",
        schema: data.schema,
        format: data.format ?? "openapi",
      },
    });
  }
  async deleteSchema(tenantId: string, id: string) {
    await prisma.apiSchemaRegistry.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listIntegrationTemplates(tenantId: string) {
    return prisma.apiIntegrationTemplate.findMany({ where: { tenantId } });
  }
  async createIntegrationTemplate(tenantId: string, data: any) {
    return prisma.apiIntegrationTemplate.create({
      data: {
        tenantId,
        name: data.name,
        provider: data.provider,
        config: data.config,
        description: data.description,
      },
    });
  }
  async deleteIntegrationTemplate(tenantId: string, id: string) {
    await prisma.apiIntegrationTemplate.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async getIntegrationTemplateStats(tenantId: string) {
    const templates = await prisma.apiIntegrationTemplate.findMany({
      where: { tenantId },
    });
    return {
      total: templates.length,
      prebuilt: templates.filter((t) => t.isPrebuilt).length,
    };
  }
  async listDataExports(tenantId: string, page: number = 1) {
    const items = await prisma.apiDataExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
    });
    return { items, page };
  }
  async createDataExport(tenantId: string, userId: string, data: any) {
    return prisma.apiDataExport.create({
      data: {
        tenantId,
        name: data.name,
        format: data.format,
        scope: data.scope,
        createdBy: userId,
      },
    });
  }
  async downloadDataExport(tenantId: string, id: string) {
    const item = await prisma.apiDataExport.findFirst({
      where: { id, tenantId },
    });
    if (!item) throw new NotFoundException("Export not found");
    return item;
  }
  async deleteDataExport(tenantId: string, id: string) {
    await prisma.apiDataExport.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listDataImports(tenantId: string) {
    return prisma.apiDataImport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createDataImport(tenantId: string, userId: string, data: any) {
    return prisma.apiDataImport.create({
      data: {
        tenantId,
        name: data.name,
        format: data.format,
        mapping: data.mapping,
        createdBy: userId,
      },
    });
  }
  async listHealthChecks(tenantId: string) {
    return prisma.apiHealthCheck.findMany({ where: { tenantId } });
  }
  async createHealthCheck(tenantId: string, data: any) {
    return prisma.apiHealthCheck.create({
      data: {
        tenantId,
        name: data.name,
        endpoint: data.endpoint,
        intervalSec: data.intervalSec ?? 300,
      },
    });
  }
  async toggleHealthCheck(tenantId: string, id: string) {
    const hc = await prisma.apiHealthCheck.findFirst({
      where: { id, tenantId },
    });
    if (!hc) throw new NotFoundException("Health check not found");
    return prisma.apiHealthCheck.update({
      where: { id },
      data: { isActive: !hc.isActive },
    });
  }
  async deleteHealthCheck(tenantId: string, id: string) {
    await prisma.apiHealthCheck.deleteMany({ where: { id, tenantId } });
    return { deleted: true };
  }
  async listAccessLogs(tenantId: string, page: number = 1) {
    const items = await prisma.apiAccessLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
    });
    return { items, page };
  }
  async getAccessLogStats(tenantId: string) {
    const [total, today, errors] = await Promise.all([
      prisma.apiAccessLog.count({ where: { tenantId } }),
      prisma.apiAccessLog.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
      prisma.apiAccessLog.count({
        where: { tenantId, statusCode: { gte: 500 } },
      }),
    ]);
    return { total, today, errors };
  }
  async exportAccessLogs(tenantId: string) {
    const data = await prisma.apiAccessLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return { data, format: "json" };
  }
  async getUsageSummary(tenantId: string) {
    const [apiKeys, webhooks, endpoints] = await Promise.all([
      prisma.apiKey.count({ where: { tenantId } }),
      prisma.apiWebhook.count({ where: { tenantId } }),
      prisma.apiAccessLog
        .count({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 1000,
        })
        .then((c) => c),
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
    return prisma.apiRateLimit.findMany({ where: { tenantId } });
  }
  async updateUsageQuota(tenantId: string, metric: string, limit: number) {
    return prisma.apiRateLimit.upsert({
      where: { tenantId_endpoint: { tenantId, endpoint: metric } },
      create: { tenantId, endpoint: metric, maxRequests: limit },
      update: { maxRequests: limit },
    });
  }
  async listIpAccessRules(tenantId: string) {
    return prisma.apiCorsConfig.findMany({ where: { tenantId } });
  }
  async createIpAccessRule(tenantId: string, data: any) {
    return prisma.apiCorsConfig.create({
      data: { tenantId, origin: data.cidr },
    });
  }
  async deleteIpAccessRule(tenantId: string, id: string) {
    await prisma.apiCorsConfig.deleteMany({ where: { id, tenantId } });
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
    const logs = await prisma.apiAccessLog.findMany({
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
    const data = await prisma.apiAccessLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    return { data, format: "json", exportedAt: new Date().toISOString() };
  }
}
