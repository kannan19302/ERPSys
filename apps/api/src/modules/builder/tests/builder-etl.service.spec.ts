// @ts-nocheck
import { BuilderEtlService } from "../services/builder-etl.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    etlDataSource: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ds-1" }),
      update: vi.fn().mockResolvedValue({ id: "ds-1" }),
      delete: vi.fn().mockResolvedValue({ id: "ds-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    etlPipeline: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "pipe-1" }),
      update: vi.fn().mockResolvedValue({ id: "pipe-1" }),
      delete: vi.fn().mockResolvedValue({ id: "pipe-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    etlJobRun: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ id: "job-1" }),
      create: vi.fn().mockResolvedValue({ id: "job-1" }),
      update: vi.fn().mockResolvedValue({ id: "job-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe("BuilderEtlService", () => {
  let service: BuilderEtlService;

  beforeEach(() => {
    service = new BuilderEtlService();
    vi.clearAllMocks();
  });

  it("getDataSources returns list", async () => {
    const result = await service.getDataSources("t1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("createDataSource succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlDataSource.findFirst as any).mockResolvedValue(null);
    const result = await service.createDataSource("t1", { name: "DS" });
    expect(result).toBeDefined();
  });

  it("createDataSource rejects duplicate name", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlDataSource.findFirst as any).mockResolvedValue({ id: "ds-1" });
    await expect(
      service.createDataSource("t1", { name: "dup" }),
    ).rejects.toThrow();
  });

  it("updateDataSource updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlDataSource.findFirst as any).mockResolvedValue({ id: "ds-1" });
    const result = await service.updateDataSource("t1", "ds-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteDataSource deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlDataSource.findFirst as any).mockResolvedValue({ id: "ds-1" });
    const result = await service.deleteDataSource("t1", "ds-1");
    expect(result).toBeDefined();
  });

  it("getPipelines returns paginated", async () => {
    const result = await service.getPipelines("t1");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
  });

  it("getPipelineById throws on missing", async () => {
    await expect(service.getPipelineById("t1", "none")).rejects.toThrow();
  });

  it("buildTransformationPipeline creates pipeline", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlDataSource.findFirst as any).mockResolvedValue({ id: "ds-1" });
    const result = await service.buildTransformationPipeline("t1", {
      name: "Pipe",
      sourceId: "ds-1",
    });
    expect(result).toBeDefined();
  });

  it("executeETLJob runs job", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlPipeline.findFirst as any).mockResolvedValue({ id: "pipe-1" });
    const result = await service.executeETLJob("t1", "pipe-1", {
      triggeredBy: "user1",
    });
    expect(result).toBeDefined();
  });

  it("previewTransformation returns sample output", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.etlPipeline.findFirst as any).mockResolvedValue({
      id: "pipe-1",
      mappings: [
        { sourceField: "a", targetField: "b", transform: "uppercase" },
      ],
    });
    const result = await service.previewTransformation("t1", "pipe-1", {
      sampleData: [{ a: "hello" }],
    });
    expect(result).toHaveProperty("output");
    expect(result.output[0].b).toBe("HELLO");
  });

  it("getETLDashboard returns metrics", async () => {
    const result = await service.getETLDashboard("t1");
    expect(result).toHaveProperty("totalSources");
    expect(result).toHaveProperty("totalPipelines");
  });
});
