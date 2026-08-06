import { BuilderApiService } from "../services/builder-api.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    apiEndpoint: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ep-1" }),
      update: vi.fn().mockResolvedValue({ id: "ep-1" }),
      delete: vi.fn().mockResolvedValue({ id: "ep-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    apiEndpointMapping: {
      create: vi.fn().mockResolvedValue({ id: "mapping-1" }),
    },
    apiTestRun: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "test-run-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    apiTestResult: {
      create: vi.fn().mockResolvedValue({ id: "test-res-1" }),
    },
  },
}));

describe("BuilderApiService", () => {
  let service: BuilderApiService;

  beforeEach(() => {
    service = new BuilderApiService();
    vi.clearAllMocks();
  });

  it("getApiEndpoints returns paginated", async () => {
    const result = await service.getApiEndpoints("t1");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
  });

  it("getApiEndpointById throws on missing", async () => {
    await expect(service.getApiEndpointById("t1", "none")).rejects.toThrow();
  });

  it("getApiEndpointById returns found", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({
      id: "ep-1",
      path: "/test",
      method: "GET",
    });
    const result = await service.getApiEndpointById("t1", "ep-1");
    expect(result.id).toBe("ep-1");
  });

  it("createApiEndpoint succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue(null);
    const result = await service.createApiEndpoint("t1", {
      name: "Test",
      path: "/test",
      method: "GET",
    });
    expect(result).toBeDefined();
  });

  it("createApiEndpoint rejects duplicate path+method", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({ id: "ep-1" });
    await expect(
      service.createApiEndpoint("t1", { path: "/dup", method: "GET" }),
    ).rejects.toThrow();
  });

  it("updateApiEndpoint updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({ id: "ep-1" });
    const result = await service.updateApiEndpoint("t1", "ep-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteApiEndpoint deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({ id: "ep-1" });
    const result = await service.deleteApiEndpoint("t1", "ep-1");
    expect(result).toBeDefined();
  });

  it("addEndpointMapping adds mapping", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({
      id: "ep-1",
      mappings: [],
    });
    const result = await service.addEndpointMapping("t1", "ep-1", {
      sourceField: "a",
      targetField: "b",
    });
    expect(result).toBeDefined();
  });

  it("testApiEndpoint creates test run", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({
      id: "ep-1",
      method: "GET",
      path: "/test",
    });
    const result = await service.testApiEndpoint("t1", "ep-1", {});
    expect(result).toHaveProperty("run");
    expect(result).toHaveProperty("result");
  });

  it("generateApiDocs returns OpenAPI spec", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.apiEndpoint.findFirst as any).mockResolvedValue({
      id: "ep-1",
      name: "Test",
      description: "Desc",
      path: "/test",
      method: "GET",
      version: 1,
      requestSchema: { body: { type: "object" } },
      responseSchema: { body: { type: "object" } },
    });
    const docs = await service.generateApiDocs("t1", "ep-1");
    expect(docs.openapi).toBe("3.0.0");
    expect(docs.paths["/test"]).toBeDefined();
  });

  it("getApiDashboard returns counts", async () => {
    const result = await service.getApiDashboard("t1");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("draft");
  });
});
