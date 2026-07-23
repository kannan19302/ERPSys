import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SalesService } from "../sales.service";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value) as unknown as Decimal;
      }
    },
    JsonNull: "JsonNull",
  },
}));

const txClient = {
  deliveryNote: {
    create: vi
      .fn()
      .mockResolvedValue({
        id: "dn-1",
        deliveryNumber: "DN-001",
        status: "PENDING",
      }),
  },
  deliveryNoteItem: { create: vi.fn() },
  salesOrder: { update: vi.fn() },
};

vi.mock("@unerp/database", () => ({
  prisma: {
    salesOrder: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    quotation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    deliveryNote: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    salesReturn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn(txClient),
    ),
  },
}));

import { prisma } from "@unerp/database";

describe("SalesService — read/transition coverage", () => {
  let service: SalesService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    emitter = { emit: vi.fn() } as unknown as EventEmitter2;
    service = new SalesService(emitter);
    vi.clearAllMocks();
  });

  describe("getSalesOrderById", () => {
    it("returns the order when found", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
        id: "so-1",
      } as never);
      await expect(service.getSalesOrderById("t1", "so-1")).resolves.toEqual({
        id: "so-1",
      });
    });
    it("throws when missing", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);
      await expect(service.getSalesOrderById("t1", "x")).rejects.toThrow(
        "Sales order not found",
      );
    });
  });

  describe("approveCreditHold", () => {
    it("confirms an order on credit hold and emits", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
        id: "so-1",
        status: "CREDIT_HOLD",
        orderNumber: "SO-1",
      } as never);
      vi.mocked(prisma.salesOrder.update).mockResolvedValue({
        id: "so-1",
        status: "CONFIRMED",
      } as never);

      const result = await service.approveCreditHold("t1", "so-1", "u1");
      expect(result).toEqual({ id: "so-1", status: "CONFIRMED" });
      expect(emitter.emit).toHaveBeenCalledWith(
        "sales.order.confirmed",
        expect.objectContaining({ salesOrderId: "so-1" }),
      );
    });
    it("throws when not found", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);
      await expect(service.approveCreditHold("t1", "x", "u1")).rejects.toThrow(
        "Sales order not found",
      );
    });
    it("rejects when order is not on credit hold", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
        id: "so-1",
        status: "CONFIRMED",
      } as never);
      await expect(
        service.approveCreditHold("t1", "so-1", "u1"),
      ).rejects.toThrow("not on credit hold");
    });
  });

  describe("createDeliveryNote", () => {
    const dto = {
      salesOrderId: "so-1",
      deliveryNumber: "DN-001",
      lineItems: [{ productId: "p-1", description: "Item", deliveredQty: 5 }],
    } as never;

    it("creates a delivery note and marks the order delivered", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
        id: "so-1",
        lineItems: [{ quantity: 5, deliveredQty: 0 }],
      } as never);
      vi.mocked(prisma.deliveryNote.findFirst).mockResolvedValue(null);

      const result = await service.createDeliveryNote("t1", dto, "u1");
      expect(result).toMatchObject({ id: "dn-1" });
      expect(txClient.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "DELIVERED" } }),
      );
      expect(emitter.emit).toHaveBeenCalledWith(
        "sales.delivery.created",
        expect.any(Object),
      );
    });

    it("throws when the sales order is missing", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue(null);
      await expect(service.createDeliveryNote("t1", dto, "u1")).rejects.toThrow(
        "Sales order not found",
      );
    });

    it("rejects a duplicate delivery number", async () => {
      vi.mocked(prisma.salesOrder.findFirst).mockResolvedValue({
        id: "so-1",
        lineItems: [],
      } as never);
      vi.mocked(prisma.deliveryNote.findFirst).mockResolvedValue({
        id: "dn-existing",
      } as never);
      await expect(service.createDeliveryNote("t1", dto, "u1")).rejects.toThrow(
        "already exists",
      );
    });
  });

  describe("quotation read/status", () => {
    it("getQuotationById returns the quotation", async () => {
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue({
        id: "q-1",
      } as never);
      await expect(service.getQuotationById("t1", "q-1")).resolves.toEqual({
        id: "q-1",
      });
    });
    it("getQuotationById throws when missing", async () => {
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue(null);
      await expect(service.getQuotationById("t1", "x")).rejects.toThrow(
        "Quotation not found",
      );
    });
    it("updateQuotationStatus updates an existing quotation", async () => {
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue({
        id: "q-1",
      } as never);
      vi.mocked(prisma.quotation.update).mockResolvedValue({
        id: "q-1",
        status: "SENT",
      } as never);
      await expect(
        service.updateQuotationStatus("t1", "q-1", "SENT"),
      ).resolves.toMatchObject({ status: "SENT" });
    });
    it("updateQuotationStatus throws when missing", async () => {
      vi.mocked(prisma.quotation.findFirst).mockResolvedValue(null);
      await expect(
        service.updateQuotationStatus("t1", "x", "SENT"),
      ).rejects.toThrow("Quotation not found");
    });
  });

  describe("delivery notes read/ship", () => {
    it("getDeliveryNotes filters by orderId when provided", async () => {
      vi.mocked(prisma.deliveryNote.findMany).mockResolvedValue([
        { id: "dn-1" },
      ] as never);
      await service.getDeliveryNotes("t1", "so-1");
      expect(prisma.deliveryNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: "t1", salesOrderId: "so-1" },
        }),
      );
    });
    it("getDeliveryNotes works without an orderId", async () => {
      vi.mocked(prisma.deliveryNote.findMany).mockResolvedValue([] as never);
      await service.getDeliveryNotes("t1");
      expect(prisma.deliveryNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: "t1" } }),
      );
    });
    it("getDeliveryNoteById throws when missing", async () => {
      vi.mocked(prisma.deliveryNote.findFirst).mockResolvedValue(null);
      await expect(service.getDeliveryNoteById("t1", "x")).rejects.toThrow(
        "Delivery note not found",
      );
    });
    it("markDeliveryNoteShipped transitions to IN_TRANSIT", async () => {
      vi.mocked(prisma.deliveryNote.findFirst).mockResolvedValue({
        id: "dn-1",
      } as never);
      vi.mocked(prisma.deliveryNote.update).mockResolvedValue({
        id: "dn-1",
        status: "IN_TRANSIT",
      } as never);
      await service.markDeliveryNoteShipped("t1", "dn-1", "TRACK-9", "DHL");
      expect(prisma.deliveryNote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "IN_TRANSIT",
            trackingNumber: "TRACK-9",
            carrierName: "DHL",
          }),
        }),
      );
    });
    it("markDeliveryNoteShipped throws when missing", async () => {
      vi.mocked(prisma.deliveryNote.findFirst).mockResolvedValue(null);
      await expect(service.markDeliveryNoteShipped("t1", "x")).rejects.toThrow(
        "Delivery note not found",
      );
    });
  });

  describe("sales returns read/process", () => {
    it("getSalesReturnById throws when missing", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue(null);
      await expect(service.getSalesReturnById("t1", "x")).rejects.toThrow(
        "Sales return not found",
      );
    });

    it.each([
      ["APPROVE", "DRAFT", "APPROVED"],
      ["REJECT", "DRAFT", "REJECTED"],
      ["RECEIVE", "APPROVED", "RECEIVED"],
    ] as const)(
      "processReturn maps %s -> %s and emits",
      async (action, fromStatus, expected) => {
        vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
          id: "sr-1",
          status: fromStatus,
          reason: "orig",
        } as never);
        vi.mocked(prisma.salesReturn.update).mockResolvedValue({
          id: "sr-1",
          status: expected,
        } as never);

        const result = await service.processReturn(
          "t1",
          "sr-1",
          action,
          "note",
          "u1",
        );
        expect(result).toMatchObject({ status: expected });
        expect(prisma.salesReturn.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ status: expected }),
          }),
        );
        expect(emitter.emit).toHaveBeenCalledWith(
          "sales.return.processed",
          expect.objectContaining({ action }),
        );
      },
    );

    it("processReturn rejects an out-of-order transition", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "sr-1",
        status: "DRAFT",
        reason: "orig",
      } as never);
      await expect(
        service.processReturn("t1", "sr-1", "RECEIVE", "note", "u1"),
      ).rejects.toThrow("Cannot RECEIVE a return in status DRAFT");
    });

    it("processReturn REFUND applies credit note, reverses invoice payment, and emits", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue({
        id: "sr-1",
        status: "RECEIVED",
        salesOrderId: "so-1",
        creditNoteId: "cn-1",
        totalAmount: 100,
        returnNumber: "SR-1",
        reason: "orig",
      } as never);

      const tx = {
        creditNote: { update: vi.fn() },
        salesOrder: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "so-1", invoiceId: "inv-1" }),
        },
        invoice: {
          findFirst: vi
            .fn()
            .mockResolvedValue({
              id: "inv-1",
              paidAmount: 100,
              status: "PAID",
            }),
          update: vi.fn(),
        },
        payment: { create: vi.fn() },
        salesReturn: {
          update: vi.fn().mockResolvedValue({ id: "sr-1", status: "REFUNDED" }),
        },
      };
      vi.mocked(prisma.$transaction).mockImplementation((cb: never) =>
        (cb as (t: typeof tx) => unknown)(tx),
      );

      const result = await service.processReturn(
        "t1",
        "sr-1",
        "REFUND",
        "note",
        "u1",
        "ORIGINAL_PAYMENT",
      );
      expect(result).toMatchObject({ status: "REFUNDED" });
      expect(tx.creditNote.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "cn-1" } }),
      );
      expect(tx.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoiceId: "inv-1",
            method: "ORIGINAL_PAYMENT",
          }),
        }),
      );
      expect(tx.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "inv-1" } }),
      );
      expect(emitter.emit).toHaveBeenCalledWith(
        "sales.return.refunded",
        expect.objectContaining({ amount: 100 }),
      );
    });

    it("processReturn throws when missing", async () => {
      vi.mocked(prisma.salesReturn.findFirst).mockResolvedValue(null);
      await expect(service.processReturn("t1", "x", "APPROVE")).rejects.toThrow(
        "Sales return not found",
      );
    });
  });

  describe("getSalesStats", () => {
    it("aggregates order and return metrics", async () => {
      vi.mocked(prisma.salesOrder.count)
        .mockResolvedValueOnce(10 as never)
        .mockResolvedValueOnce(4 as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: 5000 },
      } as never);
      vi.mocked(prisma.salesReturn.count).mockResolvedValue(2 as never);

      const stats = await service.getSalesStats("t1");
      expect(stats).toEqual({
        totalOrders: 10,
        pendingOrders: 4,
        totalRevenue: 5000,
        returnsCount: 2,
      });
    });

    it("defaults revenue to 0 when no orders", async () => {
      vi.mocked(prisma.salesOrder.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.salesOrder.aggregate).mockResolvedValue({
        _sum: { totalAmount: null },
      } as never);
      vi.mocked(prisma.salesReturn.count).mockResolvedValue(0 as never);

      const stats = await service.getSalesStats("t1");
      expect(stats.totalRevenue).toBe(0);
    });
  });
});
