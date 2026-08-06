import { BuilderRulesService } from "../services/builder-rules.service";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@unerp/database", () => ({
  prisma: {
    decisionTable: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "dt-1" }),
      update: vi.fn().mockResolvedValue({ id: "dt-1" }),
      delete: vi.fn().mockResolvedValue({ id: "dt-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    ruleSet: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "rs-1" }),
      update: vi.fn().mockResolvedValue({ id: "rs-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    ruleDefinition: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "rule-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
    ruleEvaluationLog: {
      create: vi.fn().mockResolvedValue({ id: "ev-1" }),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

describe("BuilderRulesService", () => {
  let service: BuilderRulesService;

  beforeEach(() => {
    service = new BuilderRulesService();
    vi.clearAllMocks();
  });

  it("getDecisionTables returns paginated", async () => {
    const result = await service.getDecisionTables("t1");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
  });

  it("getDecisionTableById throws on missing", async () => {
    await expect(service.getDecisionTableById("t1", "none")).rejects.toThrow();
  });

  it("createDecisionTable succeeds", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.decisionTable.findFirst as any).mockResolvedValue(null);
    const result = await service.createDecisionTable("t1", {
      name: "Test Table",
    });
    expect(result).toBeDefined();
  });

  it("createDecisionTable rejects duplicate", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.decisionTable.findFirst as any).mockResolvedValue({ id: "dt-1" });
    await expect(
      service.createDecisionTable("t1", { name: "dup" }),
    ).rejects.toThrow();
  });

  it("updateDecisionTable updates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.decisionTable.findFirst as any).mockResolvedValue({ id: "dt-1" });
    const result = await service.updateDecisionTable("t1", "dt-1", {
      name: "U",
    });
    expect(result).toBeDefined();
  });

  it("deleteDecisionTable deletes", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.decisionTable.findFirst as any).mockResolvedValue({ id: "dt-1" });
    const result = await service.deleteDecisionTable("t1", "dt-1");
    expect(result).toBeDefined();
  });

  it("createRuleSet creates", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.ruleSet.findFirst as any).mockResolvedValue(null);
    const result = await service.createRuleSet("t1", { name: "RS" });
    expect(result).toBeDefined();
  });

  it("getRuleSets returns list", async () => {
    const result = await service.getRuleSets("t1");
    expect(Array.isArray(result)).toBe(true);
  });

  it("evaluateRules evaluates simple condition", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.ruleSet.findFirst as any).mockResolvedValue({
      id: "rs-1",
      name: "RS",
    });
    (prisma.ruleDefinition.findMany as any).mockResolvedValue([
      {
        id: "r1",
        condition: "age > 18",
        actions: [{ action: "approve" }],
        priority: 0,
      },
    ]);
    (prisma.ruleEvaluationLog.create as any).mockResolvedValue({});
    const result = await service.evaluateRules("t1", "rs-1", {
      input: { age: 25 },
    });
    expect(result.matched).toBe(true);
  });

  it("getRuleAnalytics returns counts", async () => {
    const result = await service.getRuleAnalytics("t1");
    expect(result).toHaveProperty("totalTables");
    expect(result).toHaveProperty("totalRuleSets");
  });

  it("versionRule increments version", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.ruleSet.findFirst as any).mockResolvedValue({
      id: "rs-1",
      version: 1,
    });
    const result = await service.versionRule("t1", "rs-1");
    expect(result).toBeDefined();
  });

  it("addRuleToSet adds rule", async () => {
    const { prisma } = await import("@unerp/database");
    (prisma.ruleSet.findFirst as any).mockResolvedValue({ id: "rs-1" });
    const result = await service.addRuleToSet("t1", "rs-1", {
      name: "R1",
      condition: "true",
    });
    expect(result).toBeDefined();
  });
});
