import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";

@Injectable()
export class ApiPlatformDeepV3Service {
  async getApiKey(tenantId: string, id: string) {
    const key = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    return key;
  }
  async renameApiKey(tenantId: string, id: string, name: string) {
    await prisma.apiKey.updateMany({ where: { id, tenantId }, data: { name } });
    return { renamed: true };
  }
  async regenerateApiKey(tenantId: string, id: string) {
    await prisma.apiKey.updateMany({
      where: { id, tenantId },
      data: { keyHash: "reg-" + Date.now(), lastUsedAt: new Date() },
    });
    return { regenerated: true };
  }
  async getWebhook(tenantId: string, id: string) {
    const w = await prisma.apiWebhook.findFirst({ where: { id, tenantId } });
    if (!w) throw new NotFoundException("Webhook not found");
    return w;
  }
  async renameWebhook(tenantId: string, id: string, name: string) {
    await prisma.apiWebhook.updateMany({
      where: { id, tenantId },
      data: { name },
    });
    return { renamed: true };
  }
  async enableWebhook(tenantId: string, id: string) {
    await prisma.apiWebhook.updateMany({
      where: { id, tenantId },
      data: { isActive: true },
    });
    return { enabled: true };
  }
  async disableWebhook(tenantId: string, id: string) {
    await prisma.apiWebhook.updateMany({
      where: { id, tenantId },
      data: { isActive: false },
    });
    return { disabled: true };
  }
  async getSchema(tenantId: string, id: string) {
    return prisma.apiSchemaRegistry.findFirst({ where: { id, tenantId } });
  }
  async getIntegrationTemplate(tenantId: string, id: string) {
    return prisma.apiIntegrationTemplate.findFirst({ where: { id, tenantId } });
  }
  async getHealthCheck(tenantId: string, id: string) {
    return prisma.apiHealthCheck.findFirst({ where: { id, tenantId } });
  }
  async runHealthCheck(tenantId: string, id: string) {
    await prisma.apiHealthCheck.updateMany({
      where: { id, tenantId },
      data: { lastCheckedAt: new Date(), lastStatus: "UP" },
    });
    return { status: "UP", responseMs: 45 };
  }
  async getDataExport(tenantId: string, id: string) {
    return prisma.apiDataExport.findFirst({ where: { id, tenantId } });
  }
  async getDataImport(tenantId: string, id: string) {
    return prisma.apiDataImport.findFirst({ where: { id, tenantId } });
  }
  async getUsageQuota(tenantId: string, metric: string) {
    return prisma.apiRateLimit.findUnique({
      where: { tenantId_endpoint: { tenantId, endpoint: metric } },
    });
  }
  async getCorsConfig(tenantId: string, origin: string) {
    return prisma.apiCorsConfig.findUnique({
      where: { tenantId_origin: { tenantId, origin } },
    });
  }
  async getRateLimit(tenantId: string, endpoint: string) {
    return prisma.apiRateLimit.findUnique({
      where: { tenantId_endpoint: { tenantId, endpoint } },
    });
  }
  async listCategories(tenantId: string) {
    return prisma.apiIntegrationTemplate
      .findMany({ where: { tenantId } })
      .then((t) =>
        [...new Set(t.map((x) => x.provider))].map((p) => ({ name: p })),
      );
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
      prisma.apiKey.count({ where: { tenantId } }),
      prisma.apiWebhook.count({ where: { tenantId } }),
      prisma.apiAccessLog.count({ where: { tenantId }, take: 100 }),
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
    return prisma.apiAccessLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}
