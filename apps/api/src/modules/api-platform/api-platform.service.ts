import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import { Prisma } from "@prisma/client";
import { randomBytes, createHash } from "crypto";

function generateApiKey() {
  const raw = "un_" + randomBytes(24).toString("base64url");
  const prefix = raw.substring(0, 8);
  const hashedKey = createHash("sha256").update(raw).digest("hex");
  return { raw, hashedKey, prefix };
}

@Injectable()
export class ApiPlatformService {
  // ─── API KEYS ───────────────────────────────────────

  async getApiKeys(tenantId: string) {
    // ApiKey has no `apiUsageMetrics` relation declared in the schema (only
    // ApiUsageMetric's own scalar `apiKeyId`), so usage counts are computed
    // separately and merged in.
    const keys = await idpPrisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    const usageCounts = await prisma.apiUsageMetric.groupBy({
      by: ["apiKeyId"],
      where: { tenantId, apiKeyId: { in: keys.map((k) => k.id) } },
      _count: true,
    });
    const countByKeyId = new Map(
      usageCounts.map((u) => [u.apiKeyId, u._count]),
    );
    return keys.map((k) => ({
      ...k,
      _count: { apiUsageMetrics: countByKeyId.get(k.id) || 0 },
    }));
  }

  async createApiKey(
    tenantId: string,
    dto: {
      name: string;
      rateLimit?: number;
      scopes?: string[];
      ipWhitelist?: string[];
      expiresInDays?: number;
    },
  ) {
    const { raw, hashedKey, prefix } = generateApiKey();
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 86400000)
      : null;
    const key = await idpPrisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        hashedKey,
        prefix,
        rateLimit: dto.rateLimit || 60,
        apiScopes: (dto.scopes || ["read:all"]).join(","),
        ipWhitelist: dto.ipWhitelist?.join(",") || null,
        expiresAt,
        status: "ACTIVE",
      },
    });
    if (dto.scopes) {
      for (const scopeStr of dto.scopes) {
        const parts = scopeStr.split(":");
        await prisma.apiKeyScope.create({
          data: {
            tenantId,
            apiKeyId: key.id,
            resource: parts[0] || scopeStr,
            action: parts[1] || "read",
          },
        });
      }
    }
    return { ...key, key: raw };
  }

  async revokeApiKey(tenantId: string, id: string) {
    const key = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API Key not found");
    return idpPrisma.apiKey.update({
      where: { id },
      data: { status: "REVOKED" },
    });
  }

  async rotateApiKey(tenantId: string, id: string) {
    const key = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API Key not found");
    const { raw, hashedKey, prefix } = generateApiKey();
    await idpPrisma.apiKey.update({
      where: { id },
      data: { hashedKey, prefix },
    });
    return {
      key: raw,
      prefix,
      message: "Key rotated. Save the new key as it will not be shown again.",
    };
  }

  async updateApiKeyScopes(
    tenantId: string,
    id: string,
    dto: { scopes: string[]; ipWhitelist?: string[]; rateLimit?: number },
  ) {
    const key = await idpPrisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException("API Key not found");
    const updateData: any = { apiScopes: dto.scopes.join(",") };
    if (dto.ipWhitelist !== undefined)
      updateData.ipWhitelist = dto.ipWhitelist.join(",");
    if (dto.rateLimit !== undefined) updateData.rateLimit = dto.rateLimit;
    await prisma.apiKeyScope.deleteMany({ where: { apiKeyId: id } });
    for (const scopeStr of dto.scopes) {
      const parts = scopeStr.split(":");
      await prisma.apiKeyScope.create({
        data: {
          tenantId,
          apiKeyId: id,
          resource: parts[0] || scopeStr,
          action: parts[1] || "read",
        },
      });
    }
    return idpPrisma.apiKey.update({ where: { id }, data: updateData });
  }

  // ─── WEBHOOKS ───────────────────────────────────────

  async getWebhookSubscriptions(tenantId: string) {
    return prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createWebhookSubscription(
    tenantId: string,
    dto: {
      name: string;
      targetUrl: string;
      events: string[];
      secret: string;
      maxRetries?: number;
    },
  ) {
    return prisma.webhookSubscription.create({
      data: {
        tenantId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        events: JSON.stringify(dto.events) as never,
        secret: dto.secret,
        status: "ACTIVE",
      },
    });
  }

  async updateWebhookSubscription(
    tenantId: string,
    id: string,
    dto: {
      name?: string;
      targetUrl?: string;
      events?: string[];
      secret?: string;
    },
  ) {
    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Webhook subscription not found");
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.targetUrl !== undefined) data.targetUrl = dto.targetUrl;
    if (dto.events !== undefined)
      data.events = JSON.stringify(dto.events) as never;
    if (dto.secret !== undefined) data.secret = dto.secret;
    return prisma.webhookSubscription.update({ where: { id }, data });
  }

  async deleteWebhookSubscription(tenantId: string, id: string) {
    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Webhook subscription not found");
    await prisma.webhookSubscription.delete({ where: { id } });
    return { success: true };
  }

  async toggleWebhookSubscription(tenantId: string, id: string) {
    const sub = await prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Webhook subscription not found");
    return prisma.webhookSubscription.update({
      where: { id },
      data: { status: sub.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  }

  async getWebhookDeliveryLogs(tenantId: string, subscriptionId?: string) {
    const where: Prisma.WebhookDeliveryLogWhereInput = { tenantId };
    if (subscriptionId) where.subscriptionId = subscriptionId;
    return prisma.webhookDeliveryLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async retryWebhookDelivery(tenantId: string, logId: string) {
    const log = await prisma.webhookDeliveryLog.findFirst({
      where: { id: logId, tenantId },
    });
    if (!log) throw new NotFoundException("Delivery log not found");
    return prisma.webhookDeliveryLog.update({
      where: { id: logId },
      data: {
        attempts: { increment: 1 },
        responseStatus: 200,
        responseBody: '{"success":true,"retry":true}',
      },
    });
  }

  // ─── USAGE METRICS ──────────────────────────────────

  async getUsageMetrics(tenantId: string, period?: string) {
    const where: Prisma.ApiUsageMetricWhereInput = { tenantId };
    if (period === "24h")
      where.createdAt = { gte: new Date(Date.now() - 86400000) };
    else if (period === "7d")
      where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
    else if (period === "30d")
      where.createdAt = { gte: new Date(Date.now() - 30 * 86400000) };
    const metrics = await prisma.apiUsageMetric.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const totalRequests = metrics.length;
    const avgResponseMs =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((s, m) => s + m.responseMs, 0) / metrics.length,
          )
        : 0;
    const byEndpoint = this.groupBy(metrics, "endpoint");
    const errorRate =
      metrics.length > 0
        ? (
            (metrics.filter((m) => m.statusCode >= 400).length /
              metrics.length) *
            100
          ).toFixed(1)
        : "0";
    return {
      totalRequests,
      avgResponseMs,
      errorRate: `${errorRate}%`,
      byEndpoint: Object.entries(byEndpoint)
        .map(([endpoint, items]: [string, any]) => ({
          endpoint,
          count: items.length,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async recordUsageMetric(
    tenantId: string,
    dto: {
      apiKeyId?: string;
      endpoint: string;
      method: string;
      statusCode: number;
      responseMs: number;
    },
  ) {
    return prisma.apiUsageMetric.create({
      data: {
        tenantId,
        apiKeyId: dto.apiKeyId || null,
        endpoint: dto.endpoint,
        method: dto.method,
        statusCode: dto.statusCode,
        responseMs: dto.responseMs,
      },
    });
  }

  // ─── ENDPOINT REGISTRY ──────────────────────────────

  async getEndpoints(tenantId: string, module?: string) {
    const where: Prisma.EndpointRegistryWhereInput = { tenantId };
    if (module) where.module = module;
    return prisma.endpointRegistry.findMany({
      where,
      orderBy: [{ module: "asc" }, { path: "asc" }],
    });
  }

  async registerEndpoint(
    tenantId: string,
    dto: {
      path: string;
      method: string;
      module: string;
      description?: string;
      authRequired?: boolean;
      rateLimit?: number;
    },
  ) {
    const existing = await prisma.endpointRegistry.findUnique({
      where: {
        tenantId_path_method: { tenantId, path: dto.path, method: dto.method },
      },
    });
    if (existing)
      return prisma.endpointRegistry.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    return prisma.endpointRegistry.create({
      data: {
        tenantId,
        path: dto.path,
        method: dto.method,
        module: dto.module,
        description: dto.description || null,
        authRequired: dto.authRequired ?? true,
        rateLimit: dto.rateLimit || 60,
      },
    });
  }

  async deregisterEndpoint(tenantId: string, id: string) {
    const ep = await prisma.endpointRegistry.findFirst({
      where: { id, tenantId },
    });
    if (!ep) throw new NotFoundException("Endpoint not found");
    return prisma.endpointRegistry.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── PRIVATE ────────────────────────────────────────

  private groupBy(arr: any[], key: string): Record<string, any[]> {
    return arr.reduce(
      (acc, item) => {
        (acc[item[key]] = acc[item[key]] || []).push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }
}
