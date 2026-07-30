import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
    JsonNull: "JsonNull",
  },
}));

vi.mock("@unerp/database", () => ({
  prisma: {
    salesReturn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    returnReasonCode: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    returnMerchandiseAuthorization: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    rMALine: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    rMAInspection: {
      upsert: vi.fn(),
    },
    creditNote: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@unerp/database";
import { SalesReturnsService } from "../sales-returns.service";

describe("SalesReturnsService", () => {
  let service: SalesReturnsService;

  beforeEach(() => {
    service = new SalesReturnsService();
    vi.clearAllMocks();
  });

  describe("listReturns", () => {
    it("should list all returns for a tenant", async () => {
      const mockReturns = [
        {
          id: "r1",
          returnNumber: "SR-2026-00001",
          status: "DRAFT",
          totalAmount: 500,
          lineItems: [],
          customer: { id: "c1", name: "Acme Corp" },
        },
      ];
      vi.mocked(prisma.salesReturn.findMany).mockResolvedValue(
        mockReturns as never,
      );

      const result = await service.listReturns("tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].returnNumber).toBe("SR-2026-00001");
      expect(prisma.salesReturn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1" },
        }),
      );
    });

    it("should filter by status", async () => {
      vi.mocked(prisma.salesReturn.findMany).mockResolvedValue([] as never);
      await service.listReturns("tenant-1", "APPROVED");
      expect(prisma.salesReturn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1", status: "APPROVED" },
        }),
      );
    });

    it("should filter by customerId", async () => {
      vi.mocked(prisma.salesReturn.findMany).mockResolvedValue([] as never);
      await service.listReturns("tenant-1", undefined, "cust-1");
      expect(prisma.salesReturn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1", customerId: "cust-1" },
        }),
      );
    });
  });

  describe("getReturn", () => {
    it("should return a sales return by id", async () => {
      const mockReturn = {
        id: "r1",
        returnNumber: "SR-2026-00001",
        status: "DRAFT",
        lineItems: [],
        customer: { id: "c1" },
        salesOrder: { id: "so1" },
      };
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue(
        mockReturn as never,
      );

      const result = await service.getReturn("tenant-1", "r1");
      expect(result.id).toBe("r1");
    });

    it("should throw NotFoundException when not found", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue(null as never);
      await expect(
        service.getReturn("tenant-1", "nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createReturn", () => {
    it("should create a sales return with auto-generated number", async () => {
      vi.mocked(prisma.salesReturn.count).mockResolvedValue(5 as never);
      vi.mocked(prisma.salesReturn.create).mockResolvedValue({
        id: "r-new",
        returnNumber: "SR-2026-00006",
        lineItems: [],
      } as never);

      const result = await service.createReturn(
        "tenant-1",
        {
          customerId: "cust-1",
          salesOrderId: "so-1",
          totalAmount: 1000,
          lineItems: [
            {
              productId: "p-1",
              description: "Widget",
              quantity: 2,
              unitPrice: 500,
              totalAmount: 1000,
            },
          ],
        },
        "user-1",
      );

      expect(result.returnNumber).toBe("SR-2026-00006");
      expect(prisma.salesReturn.create).toHaveBeenCalled();
      const createCall = vi.mocked(prisma.salesReturn.create).mock
        .calls[0][0] as any;
      expect(createCall.data.tenantId).toBe("tenant-1");
      expect(createCall.data.createdBy).toBe("user-1");
      expect(createCall.data.lineItems.create).toHaveLength(1);
    });

    it("should use provided returnNumber if given", async () => {
      vi.mocked(prisma.salesReturn.create).mockResolvedValue({
        id: "r-new",
        returnNumber: "CUSTOM-RET-001",
      } as never);

      await service.createReturn(
        "tenant-1",
        {
          customerId: "cust-1",
          salesOrderId: "so-1",
          returnNumber: "CUSTOM-RET-001",
        },
        "user-1",
      );

      const createCall = vi.mocked(prisma.salesReturn.create).mock
        .calls[0][0] as any;
      expect(createCall.data.returnNumber).toBe("CUSTOM-RET-001");
    });
  });

  describe("processReturn", () => {
    it("should transition status when valid", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "r1",
        status: "DRAFT",
      } as never);
      vi.mocked(prisma.salesReturn.update).mockResolvedValue({
        id: "r1",
        status: "SUBMITTED",
      } as never);

      const result = await service.processReturn(
        "tenant-1",
        "r1",
        "SUBMITTED",
        "user-1",
      );
      expect(result.status).toBe("SUBMITTED");
    });

    it("should throw BadRequestException for invalid transition", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "r1",
        status: "DRAFT",
      } as never);

      await expect(
        service.processReturn("tenant-1", "r1", "REFUNDED", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("approveReturn", () => {
    it("should approve a return", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "r1",
        status: "SUBMITTED",
      } as never);
      vi.mocked(prisma.salesReturn.update).mockResolvedValue({
        id: "r1",
        status: "APPROVED",
      } as never);

      const result = await service.approveReturn("tenant-1", "r1", "user-1");
      expect(result.status).toBe("APPROVED");
    });
  });

  describe("rejectReturn", () => {
    it("should cancel a return with reason", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "r1",
        status: "SUBMITTED",
        reason: null,
      } as never);
      vi.mocked(prisma.salesReturn.update).mockResolvedValue({
        id: "r1",
        status: "CANCELLED",
      } as never);

      const result = await service.rejectReturn(
        "tenant-1",
        "r1",
        "Customer changed mind",
        "user-1",
      );
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("listReturnReasons", () => {
    it("should list active return reasons", async () => {
      const mockReasons = [
        { id: "rr1", code: "DEFECTIVE", name: "Defective Product" },
      ];
      vi.mocked(prisma.returnReasonCode.findMany).mockResolvedValue(
        mockReasons as never,
      );

      const result = await service.listReturnReasons("tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("DEFECTIVE");
    });
  });

  describe("createReturnReason", () => {
    it("should create a return reason code", async () => {
      vi.mocked(prisma.returnReasonCode.create).mockResolvedValue({
        id: "rr-new",
        code: "DAMAGED",
        name: "Damaged in Transit",
      } as never);

      const result = await service.createReturnReason("tenant-1", {
        code: "DAMAGED",
        label: "Damaged in Transit",
        type: "QUALITY",
      });
      expect(result.code).toBe("DAMAGED");
    });
  });

  describe("listRMAs", () => {
    it("should list RMAs for a tenant", async () => {
      const mockRmas = [
        {
          id: "rma1",
          rmaNumber: "RMA-2026-00001",
          status: "REQUESTED",
          lines: [],
          inspection: null,
        },
      ];
      vi.mocked(prisma.returnMerchandiseAuthorization.findMany).mockResolvedValue(
        mockRmas as never,
      );

      const result = await service.listRMAs("tenant-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("createRMA", () => {
    it("should create an RMA with lines", async () => {
      vi.mocked(prisma.returnMerchandiseAuthorization.count).mockResolvedValue(
        3 as never,
      );
      vi.mocked(
        prisma.returnMerchandiseAuthorization.create,
      ).mockResolvedValue({
        id: "rma-new",
        rmaNumber: "RMA-2026-00004",
        lines: [{ id: "l1" }],
      } as never);

      const result = await service.createRMA(
        "tenant-1",
        {
          customerId: "cust-1",
          source: "CUSTOMER",
          lines: [{ productSku: "SKU-001", expectedQty: 5 }],
        },
        "user-1",
      );
      expect(result.rmaNumber).toBe("RMA-2026-00004");
    });
  });

  describe("rmaReceiveItem", () => {
    it("should receive an RMA line and create/update inspection", async () => {
      vi.mocked(
        prisma.returnMerchandiseAuthorization.findFirst,
      ).mockResolvedValue({ id: "rma1", status: "REQUESTED" } as never);
      vi.mocked(prisma.rMALine.findFirst).mockResolvedValue({
        id: "l1",
        rmaId: "rma1",
        expectedQty: 10,
        tenantId: "tenant-1",
      } as never);
      vi.mocked(prisma.rMALine.update).mockResolvedValue({
        id: "l1",
        receivedQty: 10,
        condition: "GOOD",
      } as never);
      vi.mocked(prisma.rMAInspection.upsert).mockResolvedValue(
        {} as never,
      );

      const result = await service.rmaReceiveItem(
        "tenant-1",
        "rma1",
        "l1",
        "GOOD",
        "user-1",
      );
      expect(result.condition).toBe("GOOD");
      expect(result.receivedQty).toBe(10);
    });

    it("should throw when RMA not found", async () => {
      vi.mocked(
        prisma.returnMerchandiseAuthorization.findFirst,
      ).mockResolvedValue(null as never);

      await expect(
        service.rmaReceiveItem("tenant-1", "bad-rma", "l1", "GOOD", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createCreditNote", () => {
    it("should create a credit note and update return status", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "r1",
        customerId: "cust-1",
        totalAmount: 500,
        reason: "Defective",
        status: "APPROVED",
        tenantId: "tenant-1",
      } as never);
      vi.mocked(prisma.creditNote.count).mockResolvedValue(10 as never);
      vi.mocked(prisma.creditNote.create).mockResolvedValue({
        id: "cn-new",
        noteNumber: "CN-2026-00011",
      } as never);
      vi.mocked(prisma.salesReturn.update).mockResolvedValue(
        {} as never,
      );

      const result = await service.createCreditNote(
        "tenant-1",
        "r1",
        { amount: 500 },
        "user-1",
      );
      expect(result.noteNumber).toBe("CN-2026-00011");
      expect(prisma.salesReturn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "r1" },
          data: expect.objectContaining({ status: "REFUNDED" }),
        }),
      );
    });
  });

  describe("listCreditNotes", () => {
    it("should list credit notes", async () => {
      vi.mocked(prisma.creditNote.findMany).mockResolvedValue([
        { id: "cn1", noteNumber: "CN-2026-00001", customer: {}, invoice: null },
      ] as never);

      const result = await service.listCreditNotes("tenant-1");
      expect(result).toHaveLength(1);
    });

    it("should filter by customerId", async () => {
      vi.mocked(prisma.creditNote.findMany).mockResolvedValue([] as never);
      await service.listCreditNotes("tenant-1", "cust-1");
      expect(prisma.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "tenant-1", customerId: "cust-1" },
        }),
      );
    });
  });

  describe("getReturnAnalytics", () => {
    it("should aggregate return analytics", async () => {
      vi.mocked(prisma.salesReturn.findMany).mockResolvedValue([
        { id: "r1", status: "REFUNDED", totalAmount: 500, reason: "DEFECTIVE" },
        { id: "r2", status: "APPROVED", totalAmount: 200, reason: "DEFECTIVE" },
        { id: "r3", status: "DRAFT", totalAmount: 100, reason: "BUYER_REMORSE" },
      ] as never);

      const result = await service.getReturnAnalytics("tenant-1");
      expect(result.totalReturns).toBe(3);
      expect(result.totalRefundAmount).toBe(800);
      expect(result.reasonBreakdown).toEqual({
        DEFECTIVE: 2,
        BUYER_REMORSE: 1,
      });
      expect(result.statusBreakdown).toEqual({
        REFUNDED: 1,
        APPROVED: 1,
        DRAFT: 1,
      });
    });

    it("should filter by period", async () => {
      vi.mocked(prisma.salesReturn.findMany).mockResolvedValue([] as never);
      await service.getReturnAnalytics("tenant-1", "30d");
      const callWhere = (vi.mocked(prisma.salesReturn.findMany).mock
        .calls[0][0] as any).where;
      expect(callWhere.createdAt).toBeDefined();
      expect(callWhere.createdAt.gte).toBeInstanceOf(Date);
    });
  });
});
