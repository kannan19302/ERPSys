// @ts-nocheck
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { randomBytes, createHash } from "node:crypto";

@Injectable()
export class ApiPlatformDeepService {
  private readonly logger = new Logger(ApiPlatformDeepService.name);

  async listApiKeys(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async createApiKey(tenantId: string, userId: string, data: any) {
    const plainKey = randomBytes(24).toString("hex");
    const prefix = plainKey.substring(0, 8);
    const hash = createHash("sha256").update(plainKey).digest("hex");
    const record = await prisma.apiKey.create({
      data: {
        tenantId,
        name: data.name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: data.scopes ?? ["*"],
        rateLimitPerMin: data.rateLimitPerMin,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: userId,
      },
    });
    return {
      id: record.id,
      name: record.name,
      key: plainKey,
      prefix,
      scopes: record.scopes,
    };
  }
  async updateApiKey(tenantId: string, id: string, data: any) {
    const k = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!k) throw new NotFoundException("API key not found");
    return prisma.apiKey.update({ where: { id }, data });
  }
  async deleteApiKey(tenantId: string, id: string) {
    const k = await prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!k) throw new NotFoundException("API key not found");
    return prisma.apiKey.delete({ where: { id } });
  }

  async listRateLimits(tenantId: string) {
    return prisma.apiRateLimit.findMany({ where: { tenantId } });
  }
  async createRateLimit(tenantId: string, data: any) {
    return prisma.apiRateLimit.create({
      data: {
        tenantId,
        endpoint: data.endpoint,
        maxRequests: data.maxRequests,
        windowSec: data.windowSec ?? 60,
      },
    });
  }
  async updateRateLimit(tenantId: string, id: string, data: any) {
    const r = await prisma.apiRateLimit.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Rate limit not found");
    return prisma.apiRateLimit.update({ where: { id }, data });
  }
  async deleteRateLimit(tenantId: string, id: string) {
    const r = await prisma.apiRateLimit.findFirst({ where: { id, tenantId } });
    if (!r) throw new NotFoundException("Rate limit not found");
    return prisma.apiRateLimit.delete({ where: { id } });
  }

  async listWebhooks(tenantId: string) {
    return prisma.apiWebhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createWebhook(tenantId: string, userId: string, data: any) {
    const secret = randomBytes(24).toString("hex");
    return prisma.apiWebhook.create({
      data: {
        tenantId,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        retryCount: data.retryCount ?? 3,
        timeoutMs: data.timeoutMs ?? 5000,
        createdBy: userId,
      },
    });
  }
  async updateWebhook(tenantId: string, id: string, data: any) {
    const w = await prisma.apiWebhook.findFirst({ where: { id, tenantId } });
    if (!w) throw new NotFoundException("Webhook not found");
    return prisma.apiWebhook.update({ where: { id }, data });
  }
  async deleteWebhook(tenantId: string, id: string) {
    const w = await prisma.apiWebhook.findFirst({ where: { id, tenantId } });
    if (!w) throw new NotFoundException("Webhook not found");
    return prisma.apiWebhook.delete({ where: { id } });
  }
  async listWebhookDeliveries(tenantId: string, webhookId: string) {
    return prisma.apiWebhookDelivery.findMany({
      where: { webhookId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async retryWebhookDelivery(tenantId: string, id: string) {
    const d = await prisma.apiWebhookDelivery.findFirst({
      where: { id, tenantId },
    });
    if (!d) throw new NotFoundException("Webhook delivery not found");
    return prisma.apiWebhookDelivery.update({
      where: { id },
      data: { status: "PENDING", attempt: d.attempt + 1 },
    });
  }

  async getAnalytics(tenantId: string, from?: string, to?: string) {
    const where: any = { tenantId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const totalCalls = await prisma.apiAccessLog.count({ where });
    const methodDist = await prisma.apiAccessLog.groupBy({
      by: ["method"],
      where,
      _count: true,
    });
    const statusDist = await prisma.apiAccessLog.groupBy({
      by: ["statusCode"],
      where,
      _count: true,
    });
    return {
      totalCalls,
      methodDistribution: methodDist,
      statusDistribution: statusDist,
    };
  }
  async exportAnalytics(tenantId: string, data: any) {
    const analytics = await this.getAnalytics(tenantId, data.from, data.to);
    return {
      data: analytics,
      format: data.format ?? "json",
      exportedAt: new Date().toISOString(),
    };
  }

  async listCorsConfigs(tenantId: string) {
    return prisma.apiCorsConfig.findMany({ where: { tenantId } });
  }
  async upsertCorsConfig(tenantId: string, origin: string, data: any) {
    return prisma.apiCorsConfig.upsert({
      where: { tenantId_origin: { tenantId, origin } },
      create: {
        tenantId,
        origin,
        methods: data.methods ?? ["GET", "POST", "PUT", "DELETE", "PATCH"],
        headers: data.headers ?? ["Content-Type", "Authorization"],
        allowCredentials: data.allowCredentials ?? false,
      },
      update: {
        methods: data.methods,
        headers: data.headers,
        allowCredentials: data.allowCredentials,
      },
    });
  }

  async listSchemas(tenantId: string) {
    return prisma.apiSchemaRegistry.findMany({ where: { tenantId } });
  }
  async registerSchema(tenantId: string, data: any) {
    return prisma.apiSchemaRegistry.create({
      data: {
        tenantId,
        name: data.name,
        schema: data.schema,
        version: data.version ?? "1.0",
        format: data.format ?? "openapi",
      },
    });
  }
  async deleteSchema(tenantId: string, id: string) {
    const s = await prisma.apiSchemaRegistry.findFirst({
      where: { id, tenantId },
    });
    if (!s) throw new NotFoundException("Schema not found");
    return prisma.apiSchemaRegistry.delete({ where: { id } });
  }

  async listIntegrationTemplates(tenantId: string) {
    return prisma.apiIntegrationTemplate.findMany({ where: { tenantId } });
  }
  async createIntegrationTemplate(tenantId: string, data: any) {
    return prisma.apiIntegrationTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        provider: data.provider,
        config: data.config,
      },
    });
  }
  async deleteIntegrationTemplate(tenantId: string, id: string) {
    const t = await prisma.apiIntegrationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!t) throw new NotFoundException("Integration template not found");
    return prisma.apiIntegrationTemplate.delete({ where: { id } });
  }

  async listDataExports(tenantId: string) {
    return prisma.apiDataExport.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createDataExport(tenantId: string, userId: string, data: any) {
    return prisma.apiDataExport.create({
      data: {
        tenantId,
        name: data.name,
        format: data.format ?? "CSV",
        scope: data.scope ?? {},
        createdBy: userId,
      },
    });
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
        format: data.format ?? "CSV",
        mapping: data.mapping ?? {},
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
        method: data.method ?? "GET",
        intervalSec: data.intervalSec ?? 300,
        timeoutMs: data.timeoutMs ?? 5000,
      },
    });
  }

  async listUsageQuotas(tenantId: string) {
    return prisma.apiAccessLog.groupBy({
      by: ["endpoint"],
      where: { tenantId },
      _count: { id: true },
    });
  }
  async updateUsageQuota(tenantId: string, metric: string, data: any) {
    return {
      metric,
      maxValue: data.maxValue,
      windowSec: data.windowSec ?? 3600,
      updated: true,
    };
  }

  async listIpAccessRules(tenantId: string) {
    return prisma.adminIpRestriction.findMany({ where: { tenantId } });
  }
  async createIpAccessRule(tenantId: string, data: any) {
    return prisma.adminIpRestriction.create({
      data: {
        tenantId,
        cidr: data.cidr,
        type: data.type ?? "ALLOW",
        reason: data.reason,
      },
    });
  }
  async deleteIpAccessRule(tenantId: string, id: string) {
    const r = await prisma.adminIpRestriction.findFirst({
      where: { id, tenantId },
    });
    if (!r) throw new NotFoundException("IP access rule not found");
    return prisma.adminIpRestriction.delete({ where: { id } });
  }

  async listEndpoints(tenantId: string) {
    return [
      {
        module: "api-platform",
        endpoints: [
          "api-keys",
          "rate-limits",
          "webhooks",
          "analytics",
          "cors-configs",
          "schemas",
          "integration-templates",
          "data-exports",
          "data-imports",
          "health-checks",
          "usage-quotas",
          "ip-access-rules",
          "versions",
          "access-logs",
        ],
        total: 14,
      },
    ];
  }

  async listVersions(tenantId: string) {
    return [
      { version: "v1", status: "ACTIVE", releasedAt: "2026-01-01" },
      { version: "v2", status: "BETA", releasedAt: "2026-07-01" },
    ];
  }

  async listAccessLogs(
    tenantId: string,
    query: { page: number; limit: number },
  ) {
    const where = { tenantId };
    const [items, total] = await Promise.all([
      prisma.apiAccessLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.apiAccessLog.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}
