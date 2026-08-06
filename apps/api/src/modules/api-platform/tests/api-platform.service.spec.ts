import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiPlatformService } from "../api-platform.service";
import { prisma } from "@unerp/database";
import { idpClient as idpPrisma } from "@/common/idp-client";

vi.mock("@unerp/database", () => {
  // Identity models (user, role, userSession, ...) are read through
  // `idpPrisma`, not `prisma` — this spec predates that split and stubs
  // them under `prisma`. Exporting the same stub object under both names
  // keeps every `vi.mocked(prisma.user.*)` setup pointing at exactly the
  // function the service calls.
  const mocked = {
    prisma: {
      apiKey: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      apiKeyScope: { create: vi.fn(), deleteMany: vi.fn() },
      webhookSubscription: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      webhookDeliveryLog: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      apiUsageMetric: { findMany: vi.fn(), create: vi.fn(), groupBy: vi.fn() },
      endpointRegistry: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
  return { ...mocked, idpPrisma: mocked.prisma };
});

describe("ApiPlatformService", () => {
  let service: ApiPlatformService;

  beforeEach(() => {
    service = new ApiPlatformService();
    vi.clearAllMocks();
  });

  it("should get API keys", async () => {
    const mockKeys = [
      {
        id: "1",
        name: "Test Key",
        _count: { apiUsageMetrics: 5 },
        tenantId: "t1",
      },
    ];
    (idpPrisma.apiKey.findMany as any).mockResolvedValue(mockKeys);
    // ApiKey has no `apiUsageMetrics` relation, so getApiKeys groups the usage
    // metrics separately and merges the count in by apiKeyId. Stubbing the
    // groupBy is what makes the merge actually exercised rather than skipped.
    (prisma.apiUsageMetric.groupBy as any).mockResolvedValue([
      { apiKeyId: "1", _count: 5 },
    ]);
    const result = await service.getApiKeys("t1");
    expect(result).toEqual(mockKeys);
  });

  it("should create API key", async () => {
    const mockKey = {
      id: "1",
      name: "Test",
      prefix: "un_abc",
      tenantId: "t1",
      status: "ACTIVE",
      rateLimit: 60,
    };
    (idpPrisma.apiKey.create as any).mockResolvedValue(mockKey);
    const result = await service.createApiKey("t1", { name: "Test" });
    expect(result.name).toBe("Test");
    expect(result.key).toBeDefined();
  });

  it("should revoke API key", async () => {
    (idpPrisma.apiKey.findFirst as any).mockResolvedValue({
      id: "1",
      tenantId: "t1",
    });
    const mockUpdated = { id: "1", status: "REVOKED" };
    (idpPrisma.apiKey.update as any).mockResolvedValue(mockUpdated);
    const result = await service.revokeApiKey("t1", "1");
    expect(result.status).toBe("REVOKED");
  });

  it("should get webhook subscriptions", async () => {
    const mockWebhooks = [{ id: "1", name: "Test Webhook", tenantId: "t1" }];
    (prisma.webhookSubscription.findMany as any).mockResolvedValue(
      mockWebhooks,
    );
    const result = await service.getWebhookSubscriptions("t1");
    expect(result).toEqual(mockWebhooks);
  });

  it("should get usage metrics", async () => {
    const mockMetrics = [
      {
        endpoint: "/api/test",
        method: "GET",
        statusCode: 200,
        responseMs: 150,
        tenantId: "t1",
      },
      {
        endpoint: "/api/test",
        method: "POST",
        statusCode: 201,
        responseMs: 200,
        tenantId: "t1",
      },
    ];
    (prisma.apiUsageMetric.findMany as any).mockResolvedValue(mockMetrics);
    const result = await service.getUsageMetrics("t1");
    expect(result.totalRequests).toBe(2);
    expect(result.avgResponseMs).toBe(175);
  });

  it("should get endpoints", async () => {
    const mockEndpoints = [
      { id: "1", path: "/api/test", method: "GET", tenantId: "t1" },
    ];
    (prisma.endpointRegistry.findMany as any).mockResolvedValue(mockEndpoints);
    const result = await service.getEndpoints("t1");
    expect(result).toEqual(mockEndpoints);
  });
});
