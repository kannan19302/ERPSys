import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";
import type {
  CreateConnectionDto,
  UpdateConnectionDto,
  CreateWebhookConfigDto,
  UpdateWebhookConfigDto,
  CreateRateLimitConfigDto,
  UpdateRateLimitConfigDto,
  CreateIntegrationTemplateDto,
  UpdateIntegrationTemplateDto,
} from "@unerp/shared";

@Injectable()
export class ExtGatewayDeepService {
  // Connections
  async getConnections(
    tenantId: string,
    provider?: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId };
    if (provider) where.provider = provider;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.extConnection.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.extConnection.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getConnection(tenantId: string, id: string) {
    const conn = await prisma.extConnection.findFirst({
      where: { id, tenantId },
      include: {
        webhooks: true,
        rateLimits: true,
        logs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!conn) throw new NotFoundException("Connection not found");
    return conn;
  }

  async createConnection(tenantId: string, dto: CreateConnectionDto) {
    // dto's `metadata`/config fields are typed as plain Record<string, unknown>
    // in @unerp/shared, which doesn't structurally match Prisma's JSON input
    // type — the shapes agree at runtime, only the JSON typing disagrees.
    return prisma.extConnection.create({ data: { ...dto, tenantId } as any });
  }

  async updateConnection(
    tenantId: string,
    id: string,
    dto: UpdateConnectionDto,
  ) {
    await this.getConnection(tenantId, id);
    return prisma.extConnection.update({ where: { id }, data: dto as any });
  }

  async deleteConnection(tenantId: string, id: string) {
    await this.getConnection(tenantId, id);
    return prisma.extConnection.delete({ where: { id } });
  }

  async testConnection(tenantId: string, id: string) {
    const conn = await this.getConnection(tenantId, id);
    let testResult = false;
    let errorMessage: string | null = null;
    try {
      if (conn.baseUrl) {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          conn.timeout || 10000,
        );
        const response = await fetch(conn.baseUrl + "/health", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        testResult = response.ok;
        if (!response.ok) errorMessage = `HTTP ${response.status}`;
      } else {
        testResult = true;
      }
    } catch (err: any) {
      testResult = false;
      errorMessage = err.message || "Connection test failed";
    }
    const status = testResult ? "ACTIVE" : "ERROR";
    await prisma.extConnection.update({
      where: { id },
      data: {
        status,
        lastTestedAt: new Date(),
        lastTestStatus: testResult ? "OK" : "FAIL",
        errorCount: testResult ? 0 : conn.errorCount + 1,
      },
    });
    return { success: testResult, error: errorMessage, testedAt: new Date() };
  }

  async getConnectionStatus(tenantId: string) {
    const [active, inactive, error, expired] = await Promise.all([
      prisma.extConnection.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.extConnection.count({ where: { tenantId, status: "INACTIVE" } }),
      prisma.extConnection.count({ where: { tenantId, status: "ERROR" } }),
      prisma.extConnection.count({ where: { tenantId, status: "EXPIRED" } }),
    ]);
    return {
      total: active + inactive + error + expired,
      active,
      inactive,
      error,
      expired,
    };
  }

  // Connection Logs
  async getConnectionLogs(
    tenantId: string,
    connectionId: string,
    page = 1,
    limit = 50,
  ) {
    await this.getConnection(tenantId, connectionId);
    const [items, total] = await Promise.all([
      prisma.extConnectionLog.findMany({
        where: { connectionId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.extConnectionLog.count({ where: { connectionId } }),
    ]);
    return { items, total, page, limit };
  }

  // Webhooks
  async getWebhookConfigs(
    tenantId: string,
    connectionId?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId };
    if (connectionId) where.connectionId = connectionId;
    const [items, total] = await Promise.all([
      prisma.extWebhookConfig.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.extWebhookConfig.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getWebhookConfig(tenantId: string, id: string) {
    const config = await prisma.extWebhookConfig.findFirst({
      where: { id, tenantId },
      include: { deliveries: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!config) throw new NotFoundException("Webhook config not found");
    return config;
  }

  async createWebhookConfig(tenantId: string, dto: CreateWebhookConfigDto) {
    await this.getConnection(tenantId, dto.connectionId);
    return prisma.extWebhookConfig.create({ data: { ...dto, tenantId } });
  }

  async updateWebhookConfig(
    tenantId: string,
    id: string,
    dto: UpdateWebhookConfigDto,
  ) {
    await this.getWebhookConfig(tenantId, id);
    return prisma.extWebhookConfig.update({ where: { id }, data: dto });
  }

  async deleteWebhookConfig(tenantId: string, id: string) {
    await this.getWebhookConfig(tenantId, id);
    return prisma.extWebhookConfig.delete({ where: { id } });
  }

  async getWebhookDeliveries(
    tenantId: string,
    webhookConfigId: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { tenantId, webhookConfigId };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      prisma.extWebhookDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.extWebhookDelivery.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async retryWebhookDelivery(tenantId: string, deliveryId: string) {
    const delivery = await prisma.extWebhookDelivery.findFirst({
      where: { id: deliveryId, tenantId },
    });
    if (!delivery) throw new NotFoundException("Webhook delivery not found");
    return prisma.extWebhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "PENDING",
        attemptCount: 0,
        errorMessage: null,
        scheduledAt: new Date(),
      },
    });
  }

  async getWebhookStats(tenantId: string) {
    const [total, success, failed, pending, retrying] = await Promise.all([
      prisma.extWebhookConfig.count({ where: { tenantId } }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: "SUCCESS" },
      }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: "FAILED" },
      }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: "RETRYING" },
      }),
    ]);
    return {
      totalConfigs: total,
      totalDeliveries: success + failed + pending + retrying,
      success,
      failed,
      pending,
      retrying,
    };
  }

  // Rate Limits
  async getRateLimitConfigs(tenantId: string, connectionId?: string) {
    const where: any = { tenantId };
    if (connectionId) where.connectionId = connectionId;
    return prisma.extRateLimitConfig.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async createRateLimitConfig(tenantId: string, dto: CreateRateLimitConfigDto) {
    await this.getConnection(tenantId, dto.connectionId);
    return prisma.extRateLimitConfig.create({ data: { ...dto, tenantId } });
  }

  async updateRateLimitConfig(
    tenantId: string,
    id: string,
    dto: UpdateRateLimitConfigDto,
  ) {
    const cfg = await prisma.extRateLimitConfig.findFirst({
      where: { id, tenantId },
    });
    if (!cfg) throw new NotFoundException("Rate limit config not found");
    return prisma.extRateLimitConfig.update({ where: { id }, data: dto });
  }

  async deleteRateLimitConfig(tenantId: string, id: string) {
    const cfg = await prisma.extRateLimitConfig.findFirst({
      where: { id, tenantId },
    });
    if (!cfg) throw new NotFoundException("Rate limit config not found");
    return prisma.extRateLimitConfig.delete({ where: { id } });
  }

  async checkRateLimit(tenantId: string, configId: string) {
    const cfg = await prisma.extRateLimitConfig.findFirst({
      where: { id: configId, tenantId },
    });
    if (!cfg || !cfg.isActive) return { allowed: true };
    const now = new Date();
    const windowStart = new Date(now.getTime() - cfg.windowMs);
    const usage = await prisma.extRateLimitUsage.findFirst({
      where: { rateLimitConfigId: configId, windowStart: { gte: windowStart } },
      orderBy: { windowStart: "desc" },
    });
    const currentCount = usage ? usage.requestCount : 0;
    const allowed = currentCount < cfg.maxRequests;
    if (!allowed) {
      await prisma.extRateLimitUsage.upsert({
        where: { id: usage?.id || "none" },
        create: {
          tenantId,
          rateLimitConfigId: configId,
          windowStart,
          windowEnd: new Date(now.getTime() + cfg.windowMs),
          requestCount: 0,
          blockedCount: 1,
          remaining: 0,
          resetAt: new Date(now.getTime() + cfg.windowMs),
        },
        update: { blockedCount: { increment: 1 } },
      });
    }
    return {
      allowed,
      remaining: Math.max(0, cfg.maxRequests - currentCount),
      resetAt: new Date(now.getTime() + cfg.windowMs),
    };
  }

  // Integration Templates
  async getIntegrationTemplates(
    tenantId: string,
    provider?: string,
    category?: string,
  ) {
    const where: any = { tenantId };
    if (provider) where.provider = provider;
    if (category) where.category = category;
    return prisma.extIntegrationTemplate.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async getBuiltInTemplates() {
    return [
      {
        name: "Stripe",
        slug: "stripe",
        provider: "STRIPE",
        category: "PAYMENT",
        authTypes: ["API_KEY"],
        webhookEvents: [
          "payment_intent.succeeded",
          "invoice.paid",
          "customer.subscription.updated",
        ],
      },
      {
        name: "Shopify",
        slug: "shopify",
        provider: "SHOPIFY",
        category: "ECOMMERCE",
        authTypes: ["API_KEY", "OAUTH2"],
        webhookEvents: ["orders/create", "orders/updated", "products/create"],
      },
      {
        name: "Salesforce",
        slug: "salesforce",
        provider: "SALESFORCE",
        category: "CRM",
        authTypes: ["OAUTH2"],
        webhookEvents: ["Account", "Contact", "Opportunity", "Lead"],
      },
      {
        name: "QuickBooks",
        slug: "quickbooks",
        provider: "QUICKBOOKS",
        category: "FINANCE",
        authTypes: ["OAUTH2"],
        webhookEvents: ["Invoice", "Payment", "Customer", "Vendor"],
      },
      {
        name: "Slack",
        slug: "slack",
        provider: "SLACK",
        category: "COMMUNICATION",
        authTypes: ["OAUTH2", "BEARER"],
        webhookEvents: ["message.channels", "message.groups", "message.im"],
      },
      {
        name: "HubSpot",
        slug: "hubspot",
        provider: "HUBSPOT",
        category: "CRM",
        authTypes: ["OAUTH2", "API_KEY"],
        webhookEvents: ["contact.creation", "deal.creation", "ticket.creation"],
      },
      {
        name: "Mailchimp",
        slug: "mailchimp",
        provider: "MAILCHIMP",
        category: "COMMUNICATION",
        authTypes: ["API_KEY", "OAUTH2"],
        webhookEvents: ["subscribe", "unsubscribe", "campaign"],
      },
      {
        name: "GitHub",
        slug: "github",
        provider: "GITHUB",
        category: "GENERAL",
        authTypes: ["BEARER", "OAUTH2"],
        webhookEvents: ["push", "pull_request", "issues", "release"],
      },
    ];
  }

  async createIntegrationTemplate(
    tenantId: string,
    dto: CreateIntegrationTemplateDto,
  ) {
    return prisma.extIntegrationTemplate.create({
      data: { ...dto, tenantId } as any,
    });
  }

  async updateIntegrationTemplate(
    tenantId: string,
    id: string,
    dto: UpdateIntegrationTemplateDto,
  ) {
    const tpl = await prisma.extIntegrationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Integration template not found");
    return prisma.extIntegrationTemplate.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteIntegrationTemplate(tenantId: string, id: string) {
    const tpl = await prisma.extIntegrationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!tpl) throw new NotFoundException("Integration template not found");
    return prisma.extIntegrationTemplate.delete({ where: { id } });
  }

  // Analytics
  async getAnalytics(tenantId: string) {
    const [
      totalConnections,
      activeConnections,
      totalWebhooks,
      totalDeliveries,
      successDeliveries,
      failedDeliveries,
      totalRateLimits,
      logsLast24h,
    ] = await Promise.all([
      prisma.extConnection.count({ where: { tenantId } }),
      prisma.extConnection.count({ where: { tenantId, status: "ACTIVE" } }),
      prisma.extWebhookConfig.count({ where: { tenantId } }),
      prisma.extWebhookDelivery.count({ where: { tenantId } }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: "SUCCESS" },
      }),
      prisma.extWebhookDelivery.count({
        where: { tenantId, status: { in: ["FAILED", "RETRYING"] } },
      }),
      prisma.extRateLimitConfig.count({ where: { tenantId } }),
      prisma.extConnectionLog.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 86400000) },
        },
      }),
    ]);
    return {
      totalConnections,
      activeConnections,
      totalWebhooks,
      totalDeliveries,
      successDeliveries,
      failedDeliveries,
      successRate:
        totalDeliveries > 0
          ? Math.round((successDeliveries / totalDeliveries) * 100)
          : 0,
      totalRateLimits,
      logsLast24h,
    };
  }
}
