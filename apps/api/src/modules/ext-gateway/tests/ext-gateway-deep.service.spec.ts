import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExtGatewayDeepService } from "../ext-gateway-deep.service";
import { NotFoundException } from "@nestjs/common";

const mockConnection = {
  id: "c1",
  tenantId: "t1",
  name: "Stripe Prod",
  slug: "stripe-prod",
  provider: "STRIPE",
  type: "OUTBOUND",
  authType: "API_KEY",
  status: "ACTIVE",
  errorCount: 0,
  rateLimitPerMin: 60,
  timeout: 30000,
  retryCount: 3,
  retryBackoffMs: 1000,
  webhookEnabled: false,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockWebhook = {
  id: "w1",
  tenantId: "t1",
  connectionId: "c1",
  name: "Order Webhook",
  url: "https://example.com/hook",
  eventTypes: ["order.created"],
  format: "JSON",
  headers: {},
  retryPolicy: "EXPONENTIAL",
  maxRetries: 5,
  retryIntervalMs: 60000,
  timeout: 30000,
  active: true,
  circuitBreakerEnabled: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 300000,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockDelivery = {
  id: "d1",
  tenantId: "t1",
  webhookConfigId: "w1",
  eventType: "order.created",
  payload: {},
  headers: {},
  status: "SUCCESS",
  attemptCount: 1,
  maxAttempts: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockRateLimit = {
  id: "rl1",
  tenantId: "t1",
  connectionId: "c1",
  name: "Default",
  strategy: "TOKEN_BUCKET",
  maxRequests: 100,
  windowMs: 60000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockTemplate = {
  id: "t1",
  tenantId: "t1",
  name: "Stripe",
  slug: "stripe",
  provider: "STRIPE",
  category: "PAYMENT",
  configTemplate: {},
  authTypes: ["API_KEY"],
  webhookEvents: [],
  isBuiltIn: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockLog = {
  id: "l1",
  tenantId: "t1",
  connectionId: "c1",
  direction: "OUTBOUND",
  method: "POST",
  success: true,
  createdAt: new Date(),
};

vi.mock("@unerp/database", () => ({
  prisma: {
    extConnection: {
      findMany: vi.fn().mockResolvedValue([mockConnection]),
      findFirst: vi.fn().mockResolvedValue(mockConnection),
      create: vi.fn().mockResolvedValue(mockConnection),
      update: vi.fn().mockResolvedValue(mockConnection),
      delete: vi.fn().mockResolvedValue(mockConnection),
      count: vi.fn().mockResolvedValue(1),
    },
    extConnectionLog: {
      findMany: vi.fn().mockResolvedValue([mockLog]),
      count: vi.fn().mockResolvedValue(1),
    },
    extWebhookConfig: {
      findMany: vi.fn().mockResolvedValue([mockWebhook]),
      findFirst: vi.fn().mockResolvedValue(mockWebhook),
      create: vi.fn().mockResolvedValue(mockWebhook),
      update: vi.fn().mockResolvedValue(mockWebhook),
      delete: vi.fn().mockResolvedValue(mockWebhook),
      count: vi.fn().mockResolvedValue(1),
    },
    extWebhookDelivery: {
      findMany: vi.fn().mockResolvedValue([mockDelivery]),
      findFirst: vi.fn().mockResolvedValue(mockDelivery),
      update: vi.fn().mockResolvedValue(mockDelivery),
      count: vi.fn().mockResolvedValue(1),
    },
    extRateLimitConfig: {
      findMany: vi.fn().mockResolvedValue([mockRateLimit]),
      findFirst: vi.fn().mockResolvedValue(mockRateLimit),
      create: vi.fn().mockResolvedValue(mockRateLimit),
      update: vi.fn().mockResolvedValue(mockRateLimit),
      delete: vi.fn().mockResolvedValue(mockRateLimit),
    },
    extRateLimitUsage: {
      findFirst: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    extIntegrationTemplate: {
      findMany: vi.fn().mockResolvedValue([mockTemplate]),
      findFirst: vi.fn().mockResolvedValue(mockTemplate),
      create: vi.fn().mockResolvedValue(mockTemplate),
      update: vi.fn().mockResolvedValue(mockTemplate),
      delete: vi.fn().mockResolvedValue(mockTemplate),
    },
  },
}));

describe("ExtGatewayDeepService", () => {
  let service: ExtGatewayDeepService;

  beforeEach(() => {
    service = new ExtGatewayDeepService();
    vi.clearAllMocks();
  });

  it("should list connections with pagination", async () => {
    const result = await service.getConnections("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should get connection by id", async () => {
    const result = await service.getConnection("t1", "c1");
    expect(result.id).toBe("c1");
  });

  it("should throw on missing connection", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.extConnection.findFirst as any).mockResolvedValueOnce(null);
    await expect(service.getConnection("t1", "bad")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should create connection", async () => {
    const result = await service.createConnection("t1", {
      name: "Test",
      slug: "test",
      provider: "STRIPE",
    });
    expect(result.id).toBe("c1");
  });

  it("should update connection", async () => {
    const result = await service.updateConnection("t1", "c1", {
      name: "Updated",
    });
    expect(result).toBeDefined();
  });

  it("should delete connection", async () => {
    const result = await service.deleteConnection("t1", "c1");
    expect(result).toBeDefined();
  });

  it("should get connection status summary", async () => {
    const result = await service.getConnectionStatus("t1");
    expect(result.active).toBe(1);
  });

  it("should get connection logs", async () => {
    const result = await service.getConnectionLogs("t1", "c1");
    expect(result.items).toHaveLength(1);
  });

  it("should list webhook configs", async () => {
    const result = await service.getWebhookConfigs("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should get webhook config by id", async () => {
    const result = await service.getWebhookConfig("t1", "w1");
    expect(result.id).toBe("w1");
  });

  it("should create webhook config", async () => {
    const result = await service.createWebhookConfig("t1", {
      connectionId: "c1",
      name: "Hook",
      url: "https://example.com/hook",
      eventTypes: ["test"],
    });
    expect(result).toBeDefined();
  });

  it("should update webhook config", async () => {
    const result = await service.updateWebhookConfig("t1", "w1", {
      name: "Updated",
    });
    expect(result).toBeDefined();
  });

  it("should delete webhook config", async () => {
    const result = await service.deleteWebhookConfig("t1", "w1");
    expect(result).toBeDefined();
  });

  it("should get webhook deliveries", async () => {
    const result = await service.getWebhookDeliveries("t1", "w1");
    expect(result.items).toHaveLength(1);
  });

  it("should retry webhook delivery", async () => {
    const result = await service.retryWebhookDelivery("t1", "d1");
    expect(result).toBeDefined();
  });

  it("should get webhook stats", async () => {
    const result = await service.getWebhookStats("t1");
    expect(result.totalConfigs).toBe(1);
  });

  it("should list rate limit configs", async () => {
    const result = await service.getRateLimitConfigs("t1");
    expect(result).toHaveLength(1);
  });

  it("should create rate limit config", async () => {
    const result = await service.createRateLimitConfig("t1", {
      connectionId: "c1",
      name: "Default",
      maxRequests: 100,
      windowMs: 60000,
    });
    expect(result).toBeDefined();
  });

  it("should update rate limit config", async () => {
    const result = await service.updateRateLimitConfig("t1", "rl1", {
      maxRequests: 200,
    });
    expect(result).toBeDefined();
  });

  it("should delete rate limit config", async () => {
    const result = await service.deleteRateLimitConfig("t1", "rl1");
    expect(result).toBeDefined();
  });

  it("should check rate limit", async () => {
    const result = await service.checkRateLimit("t1", "rl1");
    expect(result.allowed).toBe(true);
  });

  it("should list integration templates", async () => {
    const result = await service.getIntegrationTemplates("t1");
    expect(result).toHaveLength(1);
  });

  it("should list built-in templates", async () => {
    const result = await service.getBuiltInTemplates();
    expect(result.length).toBeGreaterThanOrEqual(8);
    expect(result[0].name).toBe("Stripe");
  });

  it("should create integration template", async () => {
    const result = await service.createIntegrationTemplate("t1", {
      name: "Custom",
      slug: "custom",
      provider: "CUSTOM",
      configTemplate: {},
    });
    expect(result).toBeDefined();
  });

  it("should update integration template", async () => {
    const result = await service.updateIntegrationTemplate("t1", "t1", {
      name: "Updated",
    });
    expect(result).toBeDefined();
  });

  it("should delete integration template", async () => {
    const result = await service.deleteIntegrationTemplate("t1", "t1");
    expect(result).toBeDefined();
  });

  it("should get analytics", async () => {
    const result = await service.getAnalytics("t1");
    expect(result.totalConnections).toBe(1);
  });
});
