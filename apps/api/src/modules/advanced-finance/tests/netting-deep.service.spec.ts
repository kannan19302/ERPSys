import { describe, it, expect, vi, beforeEach } from "vitest";
import { NettingDeepService } from "../services/netting-deep.service";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({ Prisma: { Decimal: class Decimal { private v: number; constructor(val: unknown) { this.v = Number(val); } valueOf() { return this.v; } } } }));
vi.mock("@unerp/database", () => {
  const m = () => ({ findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn() });
  return { prisma: { nettingGroup: m(), nettingGroupMember: m(), nettingRun: m(), nettingRunDetail: m(), settlementInstruction: m(), interCompanyTransaction: m() } };
});

describe("NettingDeepService", () => {
  let service: NettingDeepService;
  beforeEach(() => { vi.clearAllMocks(); service = new NettingDeepService(); });

  it("getNettingGroups returns groups", async () => {
    vi.mocked(prisma.nettingGroup.findMany).mockResolvedValue([{ id: "ng-1" }] as any);
    const result = await service.getNettingGroups("t1");
    expect(result).toHaveLength(1);
  });

  it("getNettingGroupById throws on not found", async () => {
    vi.mocked(prisma.nettingGroup.findFirst).mockResolvedValue(null);
    await expect(service.getNettingGroupById("t1", "bad")).rejects.toThrow(NotFoundException);
  });

  it("createNettingGroup creates record", async () => {
    vi.mocked(prisma.nettingGroup.create).mockResolvedValue({ id: "ng-1" } as any);
    const result = await service.createNettingGroup("t1", "o1", { name: "EU Netting", nettingMethod: "MULTILATERAL" });
    expect(result.id).toBe("ng-1");
  });

  it("addNettingGroupMember adds member", async () => {
    vi.mocked(prisma.nettingGroup.findFirst).mockResolvedValue({ id: "ng-1", status: "ACTIVE", members: [], runs: [] } as any);
    vi.mocked(prisma.nettingGroupMember.create).mockResolvedValue({ id: "m-1" } as any);
    const result = await service.addNettingGroupMember("t1", "ng-1", { orgId: "org-2", participantType: "SUBSIDIARY" });
    expect(result.id).toBe("m-1");
  });

  it("getNettingRuns returns runs", async () => {
    vi.mocked(prisma.nettingRun.findMany).mockResolvedValue([{ id: "nr-1" }] as any);
    const result = await service.getNettingRuns("t1");
    expect(result).toHaveLength(1);
  });

  it("createNettingRun throws if group not active", async () => {
    vi.mocked(prisma.nettingGroup.findFirst).mockResolvedValue({ id: "ng-1", status: "INACTIVE" } as any);
    await expect(service.createNettingRun("t1", "ng-1", { nettingDate: "2026-07-01", totalReceivables: 1000, totalPayables: 500 })).rejects.toThrow(BadRequestException);
  });

  it("deleteNettingRun throws if not draft", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", status: "APPROVED", details: [], settlements: [] } as any);
    await expect(service.deleteNettingRun("t1", "nr-1")).rejects.toThrow(BadRequestException);
  });

  it("submitNettingRunForApproval throws if not draft", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", status: "APPROVED", details: [], settlements: [] } as any);
    await expect(service.submitNettingRunForApproval("t1", "nr-1")).rejects.toThrow(BadRequestException);
  });

  it("approveNettingRun throws if not pending approval", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", status: "DRAFT", details: [], settlements: [] } as any);
    await expect(service.approveNettingRun("t1", "nr-1", "user1")).rejects.toThrow(BadRequestException);
  });

  it("cancelNettingRun throws if settled", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", status: "SETTLED", details: [], settlements: [] } as any);
    await expect(service.cancelNettingRun("t1", "nr-1")).rejects.toThrow(BadRequestException);
  });

  it("computeNettingRun processes transactions", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", groupId: "ng-1", status: "DRAFT", details: [], settlements: [], totalReceivables: 0, totalPayables: 0 } as any);
    vi.mocked(prisma.nettingGroup.findFirst).mockResolvedValue({ id: "ng-1", nettingMethod: "BILATERAL", members: [{ orgId: "org-1" }, { orgId: "org-2" }] } as any);
    vi.mocked(prisma.interCompanyTransaction.findMany).mockResolvedValue([{ id: "tx-1", fromOrgId: "org-1", toOrgId: "org-2", amount: 500, currency: "USD" }] as any);
    vi.mocked(prisma.nettingRun.update).mockResolvedValue({ id: "nr-1" } as any);
    const result = await service.computeNettingRun("t1", "nr-1");
    expect(result).toBeDefined();
  });

  it("getSettlementInstructions returns instructions", async () => {
    vi.mocked(prisma.settlementInstruction.findMany).mockResolvedValue([{ id: "si-1" }] as any);
    const result = await service.getSettlementInstructions("t1");
    expect(result).toHaveLength(1);
  });

  it("createSettlementInstruction creates record", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", details: [], settlements: [] } as any);
    vi.mocked(prisma.settlementInstruction.create).mockResolvedValue({ id: "si-1" } as any);
    const result = await service.createSettlementInstruction("t1", "nr-1", { fromOrgId: "org-1", toOrgId: "org-2", settlementAmount: 500, settlementMethod: "BANK_TRANSFER" });
    expect(result.id).toBe("si-1");
  });

  it("executeSettlementInstruction throws if not pending", async () => {
    vi.mocked(prisma.settlementInstruction.findFirst).mockResolvedValue({ id: "si-1", status: "EXECUTED" } as any);
    await expect(service.executeSettlementInstruction("t1", "si-1")).rejects.toThrow(BadRequestException);
  });

  it("confirmSettlementInstruction throws if not executed", async () => {
    vi.mocked(prisma.settlementInstruction.findFirst).mockResolvedValue({ id: "si-1", status: "PENDING" } as any);
    await expect(service.confirmSettlementInstruction("t1", "si-1")).rejects.toThrow(BadRequestException);
  });

  it("settleNettingRun throws if not approved", async () => {
    vi.mocked(prisma.nettingRun.findFirst).mockResolvedValue({ id: "nr-1", status: "DRAFT", details: [], settlements: [] } as any);
    await expect(service.settleNettingRun("t1", "nr-1")).rejects.toThrow(BadRequestException);
  });

  it("getNettingDashboard returns dashboard", async () => {
    vi.mocked(prisma.nettingGroup.findMany).mockResolvedValue([{ id: "ng-1", status: "ACTIVE" }] as any);
    vi.mocked(prisma.nettingRun.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.settlementInstruction.findMany).mockResolvedValue([] as any);
    const result = await service.getNettingDashboard("t1", "o1");
    expect(result.totalGroups).toBe(1);
  });
});
