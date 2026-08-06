import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { randomBytes, createHash, randomUUID } from "node:crypto";

interface CorsConfigRecord {
  id: string;
  tenantId: string;
  origin: string;
  methods: string[];
  headers: string[];
  allowCredentials: boolean;
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
  method: string;
  intervalSec: number;
  timeoutMs: number;
  isActive: boolean;
  lastCheckedAt: Date | null;
  lastStatus: string;
}

@Injectable()
export class ApiPlatformDeepService {
  private readonly logger = new Logger(ApiPlatformDeepService.name);
  private corsConfigs: CorsConfigRecord[] = [];
  private integrationTemplates: IntegrationTemplateRecord[] = [];
  private healthChecks: HealthCheckRecord[] = [];

  async listApiKeys(tenantId: string) {
    return idpPrisma.apiKey.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        prefix: true,
        apiScopes: true,
        status: true,
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
    const record = await idpPrisma.apiKey.create({
      data: {
        tenantId,
        name: data.name,
        prefix,
        hashedKey: hash,
        apiScopes: (data.scopes ?? ["*"]).join(","),
        rateLimit: data.rateLimitPerMin ?? 60,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    return {
      id: record.id,
      name: record.name,
      key: plainKey,
      prefix,
      scopes: record.apiScopes ? record.apiScopes.split(",") : [],
    };
  }
  async updateApiKey(tenantId: string, id: string, data: any) {
    const k = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!k) throw new NotFoundException("API key not found");
    return idpPrisma.apiKey.update({ where: { id }, data });
  }
  async deleteApiKey(tenantId: string, id: string) {
    const k = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!k) throw new NotFoundException("API key not found");
    return idpPrisma.apiKey.delete({ where: { id } });
  }

  async listRateLimits(tenantId: string) {
    return prisma.apiRateLimitRule.findMany({ where: { tenantId } });
  }
  async createRateLimit(tenantId: string, data: any) {
    return prisma.apiRateLimitRule.create({
      data: {
        tenantId,
        name: data.endpoint,
        endpointPath: data.endpoint,
        limitPerMinute: data.maxRequests,
        burstLimit: data.maxRequests,
      },
    });
  }
  async updateRateLimit(tenantId: string, id: string, data: any) {
    const r = await prisma.apiRateLimitRule.findFirst({
      where: { id, tenantId },
    });
    if (!r) throw new NotFoundException("Rate limit not found");
    return prisma.apiRateLimitRule.update({ where: { id }, data });
  }
  async deleteRateLimit(tenantId: string, id: string) {
    const r = await prisma.apiRateLimitRule.findFirst({
      where: { id, tenantId },
    });
    if (!r) throw new NotFoundException("Rate limit not found");
    return prisma.apiRateLimitRule.delete({ where: { id } });
  }

  async listWebhooks(tenantId: string) {
    return prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createWebhook(tenantId: string, userId: string, data: any) {
    const secret = randomBytes(24).toString("hex");
    return prisma.webhookSubscription.create({
      data: {
        tenantId,
        name: data.name,
        targetUrl: data.url,
        secret,
        events: data.events,
        status: "ACTIVE",
      },
    });
  }
  async updateWebhook(tenantId: string, id: string, data: any) {
    const w = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!w) throw new NotFoundException("Webhook not found");
    return prisma.webhookSubscription.update({ where: { id }, data });
  }
  async deleteWebhook(tenantId: string, id: string) {
    const w = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!w) throw new NotFoundException("Webhook not found");
    return prisma.webhookSubscription.delete({ where: { id } });
  }
  async listWebhookDeliveries(tenantId: string, webhookId: string) {
    return prisma.webhookDeliveryLog.findMany({
      where: { subscriptionId: webhookId, tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async retryWebhookDelivery(tenantId: string, id: string) {
    const d = await prisma.webhookDeliveryLog.findFirst({
      where: { id, tenantId },
    });
    if (!d) throw new NotFoundException("Webhook delivery not found");
    return prisma.webhookDeliveryLog.update({
      where: { id },
      data: { status: "PENDING", attempts: d.attempts + 1 },
    });
  }

  async getAnalytics(tenantId: string, from?: string, to?: string) {
    const where: any = { tenantId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const totalCalls = await prisma.apiUsageMetric.count({ where });
    const methodDist = await prisma.apiUsageMetric.groupBy({
      by: ["method"],
      where,
      _count: true,
    });
    const statusDist = await prisma.apiUsageMetric.groupBy({
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
    return this.corsConfigs.filter((c) => c.tenantId === tenantId);
  }
  async upsertCorsConfig(tenantId: string, origin: string, data: any) {
    const existing = this.corsConfigs.find(
      (c) => c.tenantId === tenantId && c.origin === origin,
    );
    if (existing) {
      existing.methods = data.methods ?? existing.methods;
      existing.headers = data.headers ?? existing.headers;
      existing.allowCredentials =
        data.allowCredentials ?? existing.allowCredentials;
      return existing;
    }
    const record: CorsConfigRecord = {
      id: randomUUID(),
      tenantId,
      origin,
      methods: data.methods ?? ["GET", "POST", "PUT", "DELETE", "PATCH"],
      headers: data.headers ?? ["Content-Type", "Authorization"],
      allowCredentials: data.allowCredentials ?? false,
    };
    this.corsConfigs.push(record);
    return record;
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
    const s = await prisma.schemaRegistry.findFirst({
      where: { id, tenantId },
    });
    if (!s) throw new NotFoundException("Schema not found");
    return prisma.schemaRegistry.delete({ where: { id } });
  }

  async listIntegrationTemplates(tenantId: string) {
    return this.integrationTemplates.filter((t) => t.tenantId === tenantId);
  }
  async createIntegrationTemplate(tenantId: string, data: any) {
    const record: IntegrationTemplateRecord = {
      id: randomUUID(),
      tenantId,
      name: data.name,
      description: data.description ?? null,
      provider: data.provider,
      config: data.config,
      isPrebuilt: false,
    };
    this.integrationTemplates.push(record);
    return record;
  }
  async deleteIntegrationTemplate(tenantId: string, id: string) {
    const idx = this.integrationTemplates.findIndex(
      (t) => t.id === id && t.tenantId === tenantId,
    );
    if (idx === -1)
      throw new NotFoundException("Integration template not found");
    this.integrationTemplates.splice(idx, 1);
    return { deleted: true };
  }

  async listDataExports(tenantId: string) {
    return prisma.dataExportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }
  async createDataExport(tenantId: string, userId: string, data: any) {
    return prisma.dataExportJob.create({
      data: {
        tenantId,
        type: "EXPORT",
        format: data.format ?? "CSV",
        scope: data.scope ?? {},
        status: "PENDING",
      },
    });
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
      method: data.method ?? "GET",
      intervalSec: data.intervalSec ?? 300,
      timeoutMs: data.timeoutMs ?? 5000,
      isActive: true,
      lastCheckedAt: null,
      lastStatus: "UNKNOWN",
    };
    this.healthChecks.push(record);
    return record;
  }

  async listUsageQuotas(tenantId: string) {
    return prisma.apiUsageMetric.groupBy({
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
    return prisma.ipRestriction.findMany({ where: { tenantId } });
  }
  async createIpAccessRule(tenantId: string, data: any) {
    return prisma.ipRestriction.create({
      data: {
        tenantId,
        ipRange: data.cidr,
        ruleType: data.type ?? "ALLOW",
        description: data.reason ?? null,
      },
    });
  }
  async deleteIpAccessRule(tenantId: string, id: string) {
    const r = await prisma.ipRestriction.findFirst({
      where: { id, tenantId },
    });
    if (!r) throw new NotFoundException("IP access rule not found");
    return prisma.ipRestriction.delete({ where: { id } });
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
      prisma.apiUsageMetric.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.apiUsageMetric.count({ where }),
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
