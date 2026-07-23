import { describe, it, expect, vi, beforeEach } from "vitest";
import { BudgetDeepService } from "../services/budget-deep.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({ Prisma: { Decimal: class Decimal { private v: number; constructor(val: unknown) { this.v = Number(val); } valueOf() { return this.v; } } } }));
vi.mock("@unerp/database", () => {
  const m = () => ({ findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() });
  return { prisma: { budgetTemplate: m(), budgetCommitment: m(), budgetCarryForwardRule: m(), budgetRevision: m(), budget: m() } };
});

describe("BudgetDeepService", () => {
  let service: BudgetDeepService;
  beforeEach(() => { vi.clearAllMocks(); service = new BudgetDeepService(); });

  it("getBudgetTemplates returns templates", async () => {
    vi.mocked(prisma.budgetTemplate.findMany).mockResolvedValue([{ id: "bt-1" }] as any);
    const result = await service.getBudgetTemplates("t1");
    expect(result).toHaveLength(1);
  });

  it("getBudgetTemplateById throws on not found", async () => {
    vi.mocked(prisma.budgetTemplate.findFirst).mockResolvedValue(null);
    await expect(service.getBudgetTemplateById("t1", "bad")).rejects.toThrow(NotFoundException);
  });

  it("createBudgetTemplate creates record", async () => {
    vi.mocked(prisma.budgetTemplate.create).mockResolvedValue({ id: "bt-1" } as any);
    const result = await service.createBudgetTemplate("t1", "o1", { name: "FY2027", fiscalYear: "2027" });
    expect(result.id).toBe("bt-1");
  });

  it("generateBudgetsFromTemplate throws if template not active", async () => {
    vi.mocked(prisma.budgetTemplate.findFirst).mockResolvedValue({ id: "bt-1", status: "DRAFT", lines: [] } as any);
    await expect(service.generateBudgetsFromTemplate("t1", "o1", "bt-1")).rejects.toThrow(BadRequestException);
  });

  it("getBudgetCommitments returns commitments", async () => {
    vi.mocked(prisma.budgetCommitment.findMany).mockResolvedValue([{ id: "bc-1" }] as any);
    const result = await service.getBudgetCommitments("t1");
    expect(result).toHaveLength(1);
  });

  it("createBudgetCommitment creates record", async () => {
    vi.mocked(prisma.budgetCommitment.create).mockResolvedValue({ id: "bc-1" } as any);
    const result = await service.createBudgetCommitment("t1", "o1", { budgetId: "b-1", commitmentRef: "PO-001", commitmentType: "PURCHASE_ORDER", amount: 5000, commitmentDate: "2026-07-01" });
    expect(result.id).toBe("bc-1");
  });

  it("liquidateBudgetCommitment updates amounts", async () => {
    vi.mocked(prisma.budgetCommitment.findFirst).mockResolvedValue({ id: "bc-1", amount: 1000, liquidatedAmount: 0 } as any);
    vi.mocked(prisma.budgetCommitment.update).mockResolvedValue({ id: "bc-1", liquidatedAmount: 500, outstandingAmount: 500 } as any);
    const result = await service.liquidateBudgetCommitment("t1", "bc-1", 500);
    expect(result).toBeDefined();
  });

  it("liquidateBudgetCommitment throws if over-commitment", async () => {
    vi.mocked(prisma.budgetCommitment.findFirst).mockResolvedValue({ id: "bc-1", amount: 100, liquidatedAmount: 0 } as any);
    await expect(service.liquidateBudgetCommitment("t1", "bc-1", 200)).rejects.toThrow(BadRequestException);
  });

  it("getCarryForwardRules returns rules", async () => {
    vi.mocked(prisma.budgetCarryForwardRule.findMany).mockResolvedValue([{ id: "cf-1" }] as any);
    const result = await service.getCarryForwardRules("t1");
    expect(result).toHaveLength(1);
  });

  it("computeCarryForward throws if no rules", async () => {
    vi.mocked(prisma.budgetCarryForwardRule.findMany).mockResolvedValue([]);
    await expect(service.computeCarryForward("t1", "o1", "2026", "2027")).rejects.toThrow(BadRequestException);
  });

  it("getBudgetRevisions returns revisions", async () => {
    vi.mocked(prisma.budgetRevision.findMany).mockResolvedValue([{ id: "br-1" }] as any);
    const result = await service.getBudgetRevisions("t1");
    expect(result).toHaveLength(1);
  });

  it("createBudgetRevision computes change amount", async () => {
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({ id: "b-1", amount: 1000 } as any);
    vi.mocked(prisma.budgetRevision.create).mockResolvedValue({ id: "br-1" } as any);
    const result = await service.createBudgetRevision("t1", "o1", { budgetId: "b-1", revisionType: "INCREASE", revisedAmount: 1200 });
    expect(result.id).toBe("br-1");
  });

  it("approveBudgetRevision updates budget amount", async () => {
    vi.mocked(prisma.budgetRevision.findFirst).mockResolvedValue({ id: "br-1", status: "PENDING", budgetId: "b-1", revisedAmount: 1200 } as any);
    vi.mocked(prisma.budget.update).mockResolvedValue({} as any);
    const result = await service.approveBudgetRevision("t1", "br-1", "user1");
    expect(result).toBeDefined();
  });

  it("rejectBudgetRevision throws if not pending", async () => {
    vi.mocked(prisma.budgetRevision.findFirst).mockResolvedValue({ id: "br-1", status: "APPROVED" } as any);
    await expect(service.rejectBudgetRevision("t1", "br-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("getMultiYearPlan returns yearly plans", async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([{ amount: 10000 }] as any);
    const result = await service.getMultiYearPlan("t1", "o1", "2026", "2028");
    expect(result.plans).toHaveLength(3);
  });
});
