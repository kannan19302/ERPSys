// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DevopsService } from "../devops.service";
import { NotFoundException } from "@nestjs/common";

const mockDeployment = {
  id: "d1",
  tenantId: "t1",
  name: "Deploy v1",
  application: "web",
  version: "1.0.0",
  environmentId: "e1",
  status: "SUCCESS",
  strategy: "ROLLING",
  deployedBy: "user@test.com",
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockEnvironment = {
  id: "e1",
  tenantId: "t1",
  name: "Production",
  slug: "production",
  type: "PRODUCTION",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockRelease = {
  id: "r1",
  tenantId: "t1",
  name: "v1.0.0",
  version: "1.0.0",
  application: "web",
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockConfig = {
  id: "c1",
  tenantId: "t1",
  environmentId: "e1",
  key: "DB_URL",
  value: "postgres://...",
  valueType: "STRING",
  isSecret: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("@unerp/database", () => ({
  prisma: {
    deployment: {
      findMany: vi.fn().mockResolvedValue([mockDeployment]),
      findFirst: vi.fn().mockResolvedValue(mockDeployment),
      create: vi.fn().mockResolvedValue(mockDeployment),
      update: vi
        .fn()
        .mockResolvedValue({ ...mockDeployment, status: "ROLLED_BACK" }),
      delete: vi.fn().mockResolvedValue(mockDeployment),
      count: vi.fn().mockResolvedValue(1),
    },
    deploymentStage: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi
        .fn()
        .mockResolvedValue({ id: "s1", deployment: mockDeployment }),
      update: vi.fn().mockResolvedValue({}),
    },
    environment: {
      findMany: vi.fn().mockResolvedValue([mockEnvironment]),
      findFirst: vi.fn().mockResolvedValue(mockEnvironment),
      create: vi.fn().mockResolvedValue(mockEnvironment),
      update: vi.fn().mockResolvedValue(mockEnvironment),
      delete: vi.fn().mockResolvedValue(mockEnvironment),
    },
    environmentConfig: {
      findMany: vi.fn().mockResolvedValue([mockConfig]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockConfig),
      update: vi.fn().mockResolvedValue(mockConfig),
      delete: vi.fn().mockResolvedValue(mockConfig),
    },
    release: {
      findMany: vi.fn().mockResolvedValue([mockRelease]),
      findFirst: vi.fn().mockResolvedValue(mockRelease),
      create: vi.fn().mockResolvedValue(mockRelease),
      update: vi.fn().mockResolvedValue({ ...mockRelease, status: "APPROVED" }),
      delete: vi.fn().mockResolvedValue(mockRelease),
      count: vi.fn().mockResolvedValue(1),
    },
    buildLog: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    deploymentAnalytics: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe("DevopsService", () => {
  let service: DevopsService;

  beforeEach(() => {
    service = new DevopsService();
    vi.clearAllMocks();
  });

  it("should get deployments with pagination", async () => {
    const result = await service.getDeployments("t1");
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("should get deployment by id", async () => {
    const result = await service.getDeployment("t1", "d1");
    expect(result.id).toBe("d1");
  });

  it("should throw on missing deployment", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.deployment.findFirst as any).mockResolvedValueOnce(null);
    await expect(service.getDeployment("t1", "bad")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should create deployment", async () => {
    const result = await service.createDeployment("t1", {
      name: "Deploy",
      application: "web",
      version: "1.0",
      environmentId: "e1",
      deployedBy: "user",
    });
    expect(result.id).toBe("d1");
  });

  it("should rollback deployment", async () => {
    const result = await service.rollbackDeployment("t1", "d1", "user");
    expect(result.status).toBe("ROLLED_BACK");
  });

  it("should list environments", async () => {
    const result = await service.getEnvironments("t1");
    expect(result).toHaveLength(1);
  });

  it("should create environment", async () => {
    const result = await service.createEnvironment("t1", {
      name: "Staging",
      slug: "staging",
    });
    expect(result.id).toBe("e1");
  });

  it("should get environment configs", async () => {
    const result = await service.getEnvironmentConfigs("t1", "e1");
    expect(result).toHaveLength(1);
  });

  it("should upsert config", async () => {
    const result = await service.upsertConfig("t1", {
      environmentId: "e1",
      key: "NEW_KEY",
      value: "val",
    });
    expect(result).toBeDefined();
  });

  it("should get releases with pagination", async () => {
    const result = await service.getReleases("t1");
    expect(result.items).toHaveLength(1);
  });

  it("should approve release", async () => {
    const result = await service.approveRelease("t1", "r1", "admin");
    expect(result.status).toBe("APPROVED");
  });

  it("should compute analytics", async () => {
    const result = await service.computeAnalytics("t1");
    expect(result).toBeDefined();
  });

  it("should get build logs", async () => {
    const result = await service.getBuildLogs("t1", "d1");
    expect(result.items).toHaveLength(0);
  });

  it("should get deployment stages", async () => {
    const result = await service.getDeploymentStages("t1", "d1");
    expect(result).toHaveLength(0);
  });

  it("should update stage status", async () => {
    const result = await service.updateStageStatus("t1", "s1", "RUNNING");
    expect(result).toBeDefined();
  });

  it("should get analytics", async () => {
    const result = await service.getAnalytics("t1");
    expect(result).toHaveLength(0);
  });
});
