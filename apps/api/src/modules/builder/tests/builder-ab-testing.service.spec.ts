// @ts-nocheck
import { BuilderAbTestingService } from "../services/builder-ab-testing.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    abTest: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "test-1" }),
      update: vi.fn().mockResolvedValue({ id: "test-1" }),
      delete: vi.fn().mockResolvedValue({ id: "test-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    abTestVariant: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "var-1" }),
      update: vi.fn().mockResolvedValue({ id: "var-1" }),
      delete: vi.fn().mockResolvedValue({ id: "var-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    audienceSegment: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "seg-1" }),
      update: vi.fn().mockResolvedValue({ id: "seg-1" }),
      delete: vi.fn().mockResolvedValue({ id: "seg-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    personalizationRule: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe("BuilderAbTestingService", () => {
  let service: BuilderAbTestingService;

  beforeEach(() => {
    service = new BuilderAbTestingService();
    vi.clearAllMocks();
  });

  it("getABTests returns paginated", async () => {
    const result = await service.getABTests("t1");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
  });

  it("getABTestById throws on missing", async () => {
    await expect(service.getABTestById("t1", "none")).rejects.toThrow();
  });

  it("createABTest succeeds", async () => {
    const result = await service.createABTest("t1", { name: "Test" });
    expect(result).toBeDefined();
  });

  it("updateABTest updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    const result = await service.updateABTest("t1", "test-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteABTest deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    const result = await service.deleteABTest("t1", "test-1");
    expect(result).toBeDefined();
  });

  it("startABTest requires 2+ variants", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    (prisma.abTestVariant.findMany as any).mockResolvedValue([{ id: "v1" }]);
    await expect(service.startABTest("t1", "test-1")).rejects.toThrow();
  });

  it("startABTest starts with >=2 variants", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    (prisma.abTestVariant.findMany as any).mockResolvedValue([
      { id: "v1" },
      { id: "v2" },
    ]);
    const result = await service.startABTest("t1", "test-1");
    expect(result).toBeDefined();
  });

  it("getVariants returns list", async () => {
    const result = await service.getVariants("t1", "test-1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("addVariant adds variant", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    (prisma.abTestVariant.findFirst as any).mockResolvedValue(null);
    const result = await service.addVariant("t1", "test-1", { name: "V1" });
    expect(result).toBeDefined();
  });

  it("updateVariant updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTestVariant.findFirst as any).mockResolvedValue({ id: "var-1" });
    const result = await service.updateVariant("t1", "var-1", { weight: 60 });
    expect(result).toBeDefined();
  });

  it("deleteVariant deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTestVariant.findFirst as any).mockResolvedValue({ id: "var-1" });
    const result = await service.deleteVariant("t1", "var-1");
    expect(result).toBeDefined();
  });

  it("analyzeResults returns analysis", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.abTest.findFirst as any).mockResolvedValue({ id: "test-1" });
    (prisma.abTestVariant.findMany as any).mockResolvedValue([
      {
        id: "v1",
        name: "Control",
        type: "CONTROL",
        views: 100,
        conversions: 10,
      },
      {
        id: "v2",
        name: "Variant",
        type: "VARIANT",
        views: 100,
        conversions: 15,
      },
    ]);
    const result = await service.analyzeResults("t1", "test-1");
    expect(result).toHaveProperty("results");
    expect(result).toHaveProperty("lift");
    expect(result).toHaveProperty("significance");
  });

  it("defineSegment creates segment", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.audienceSegment.findFirst as any).mockResolvedValue(null);
    const result = await service.defineSegment("t1", { name: "Seg" });
    expect(result).toBeDefined();
  });

  it("getSegments returns list", async () => {
    const result = await service.getSegments("t1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("getSegmentById throws on missing", async () => {
    await expect(service.getSegmentById("t1", "none")).rejects.toThrow();
  });

  it("updateSegment updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.audienceSegment.findFirst as any).mockResolvedValue({
      id: "seg-1",
    });
    const result = await service.updateSegment("t1", "seg-1", { name: "U" });
    expect(result).toBeDefined();
  });

  it("deleteSegment deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.audienceSegment.findFirst as any).mockResolvedValue({
      id: "seg-1",
    });
    const result = await service.deleteSegment("t1", "seg-1");
    expect(result).toBeDefined();
  });

  it("getPersonalizationDashboard returns metrics", async () => {
    const result = await service.getPersonalizationDashboard("t1");
    expect(result).toHaveProperty("totalTests");
    expect(result).toHaveProperty("runningTests");
  });
});
