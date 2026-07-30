// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { ProcurementApprovalsService } from "../procurement-approvals.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@unerp/database", () => ({
  prisma: {
    purchaseRequisition: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrder: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { prisma } from "@unerp/database";

describe("ProcurementApprovalsService", () => {
  let service: ProcurementApprovalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcurementApprovalsService],
    }).compile();
    service = module.get<ProcurementApprovalsService>(
      ProcurementApprovalsService,
    );
    vi.clearAllMocks();
  });

  it("should get pending approvals", async () => {
    (prisma.purchaseRequisition.findMany as any).mockResolvedValue([
      {
        id: "req-1",
        status: "PENDING_APPROVAL",
        department: { name: "Engineering" },
        _count: { lineItems: 3 },
      },
    ]);
    (prisma.purchaseOrder.findMany as any).mockResolvedValue([
      { id: "po-1", status: "SUBMITTED", vendor: { name: "Vendor A" } },
    ]);

    const result = await service.getPendingApprovals("tenant-1");
    expect(result.total).toBe(2);
    expect(result.requisitions).toHaveLength(1);
    expect(result.purchaseOrders).toHaveLength(1);
  });

  it("should approve a requisition", async () => {
    (prisma.purchaseRequisition.findFirst as any).mockResolvedValue({
      id: "req-1",
      status: "PENDING_APPROVAL",
    });
    (prisma.purchaseRequisition.update as any).mockResolvedValue({
      id: "req-1",
      status: "APPROVED",
    });

    const result = await service.approveRequisition("tenant-1", "req-1");
    expect(result.status).toBe("APPROVED");
  });

  it("should reject a requisition when not pending", async () => {
    (prisma.purchaseRequisition.findFirst as any).mockResolvedValue({
      id: "req-1",
      status: "APPROVED",
    });
    await expect(
      service.rejectRequisition("tenant-1", "req-1"),
    ).rejects.toThrow(BadRequestException);
  });

  it("should approve a purchase order", async () => {
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue({
      id: "po-1",
      status: "SUBMITTED",
    });
    (prisma.purchaseOrder.update as any).mockResolvedValue({
      id: "po-1",
      status: "APPROVED",
    });

    const result = await service.approvePurchaseOrder("tenant-1", "po-1");
    expect(result.status).toBe("APPROVED");
  });

  it("should throw NotFoundException for missing purchase order", async () => {
    (prisma.purchaseOrder.findFirst as any).mockResolvedValue(null);
    await expect(
      service.approvePurchaseOrder("tenant-1", "nonexistent"),
    ).rejects.toThrow(NotFoundException);
  });
});
