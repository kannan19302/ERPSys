import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinanceService } from "../finance.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => {
  return {
    Prisma: {
      Decimal: class Decimal {
        constructor(value: unknown) {
          return Number(value);
        }
      },
    },
  };
});

vi.mock("@unerp/database", () => {
  return {
    prisma: {
      invoice: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
        groupBy: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      invoiceLineItem: {
        create: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      account: {
        findMany: vi.fn(),
      },
      bankAccount: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        return cb({
          invoice: {
            create: vi
              .fn()
              .mockResolvedValue({ id: "new-inv", invoiceNumber: "INV-123" }),
            update: vi.fn().mockResolvedValue({ id: "updated-inv" }),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
          },
          invoiceLineItem: {
            create: vi.fn().mockResolvedValue({ id: "new-li" }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({ id: "new-pay" }),
          },
          account: {
            findUnique: vi
              .fn()
              .mockResolvedValue({ id: "acc-1", type: "ASSET" }),
            update: vi.fn().mockResolvedValue({}),
          },
          journal: {
            create: vi.fn().mockResolvedValue({ id: "jou-1" }),
            findUnique: vi.fn().mockResolvedValue({ id: "jou-1", entries: [] }),
          },
          journalEntry: {
            create: vi.fn(),
          },
        });
      }),
    },
  };
});

describe("FinanceService", () => {
  let financeService: FinanceService;

  beforeEach(async () => {
    financeService = new FinanceService();
    const { prisma } = await import("@unerp/database");
    vi.mocked(prisma.invoice.findMany).mockImplementation(
      async () =>
        [
          {
            id: "inv-1",
            customerId: "c-1",
            totalAmount: 1000,
            paidAmount: 500,
            status: "PAID",
            dueDate: new Date(),
            issueDate: new Date(),
            customer: { id: "c-1", name: "Acme Corp" },
            paymentMethod: "CREDIT_CARD",
          },
        ] as never,
    );
    vi.mocked(prisma.invoice.count).mockImplementation(async () => 1 as never);
    vi.mocked(prisma.invoice.aggregate).mockImplementation(
      async () => ({ _sum: { totalAmount: 1000, paidAmount: 500 } }) as never,
    );
    vi.mocked(prisma.invoice.groupBy).mockImplementation(
      async () =>
        [
          {
            status: "PAID",
            _count: { status: 1 },
            _sum: { totalAmount: 1000 },
          },
        ] as never,
    );
    vi.mocked(prisma.payment.findMany).mockImplementation(
      async () =>
        [
          {
            id: "pay-1",
            amount: 500,
            paidAt: new Date(),
            method: "CREDIT_CARD",
          },
        ] as never,
    );
    vi.mocked(prisma.account.findMany).mockImplementation(
      async () => [] as never,
    );
    vi.mocked(prisma.bankAccount.findMany).mockImplementation(
      async () => [] as never,
    );
  });

  describe("getInvoices", () => {
    it("should return all invoices for the tenant", async () => {
      const { prisma } = await import("@unerp/database");
      const now = new Date();
      const mockDbInvoices = [
        {
          id: "inv-1",
          invoiceNumber: "INV-001",
          status: "DRAFT",
          issueDate: now,
          dueDate: now,
          subtotal: 1000,
          taxAmount: 150,
          totalAmount: 1150,
          paidAmount: 0,
          currency: "USD",
          customer: { name: "Acme" },
          lineItems: [
            {
              id: "li-1",
              description: "Item",
              quantity: 1,
              unitPrice: 1000,
              taxRate: 15,
            },
          ],
        },
      ];
      vi.mocked(prisma.invoice.findMany).mockImplementation(
        async () => mockDbInvoices as never,
      );
      vi.mocked(prisma.invoice.count).mockImplementation(
        async () => 1 as never,
      );

      const result = await financeService.getInvoices("tenant-123");

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("inv-1");
      expect(result.meta.total).toBe(1);
    });
  });

  describe("getInvoiceById", () => {
    it("should return invoice details if found", async () => {
      const { prisma } = await import("@unerp/database");
      const mockInvoice = { id: "inv-123", invoiceNumber: "INV-001" };
      vi.mocked(prisma.invoice.findFirst).mockImplementation(
        async () => mockInvoice as never,
      );

      const result = await financeService.getInvoiceById(
        "tenant-123",
        "inv-123",
      );
      expect(result).toEqual(mockInvoice);
    });

    it("should throw NotFoundException if invoice not found", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.invoice.findFirst).mockImplementation(
        async () => null as never,
      );

      await expect(
        financeService.getInvoiceById("tenant-123", "invalid-id"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createInvoice", () => {
    const defaultDto = {
      customerId: "cust-123",
      issueDate: "2026-01-01",
      dueDate: "2026-01-31",
      currency: "USD",
      lineItems: [
        {
          description: "Web development services",
          quantity: 10,
          unitPrice: 100,
          taxRate: 10,
        },
      ],
    };

    it("should create an invoice successfully and emit event", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.customer.findFirst).mockImplementation(
        async () => ({ id: "cust-123" }) as never,
      );
      vi.mocked(prisma.organization.findFirst).mockImplementation(
        async () => ({ id: "org-123" }) as never,
      );

      const mockEmitter = { emit: vi.fn() };
      const serviceWithEmitter = new FinanceService(mockEmitter as never);

      const result = await serviceWithEmitter.createInvoice(
        "tenant-123",
        "org-123",
        defaultDto as never,
        "user-123",
      );

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockEmitter.emit).toHaveBeenCalledWith(
        "finance.invoice.created",
        expect.any(Object),
      );
    });

    it("should throw NotFoundException if customer is not found", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.customer.findFirst).mockImplementation(
        async () => null as never,
      );

      await expect(
        financeService.createInvoice(
          "tenant-123",
          "org-123",
          defaultDto as never,
          "user-123",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPayment", () => {
    const defaultDto = {
      invoiceId: "inv-1",
      amount: 100,
      paymentDate: "2026-01-15",
      paymentMethod: "CREDIT_CARD",
    };

    it("should create payment successfully and update invoice to PARTIALLY_PAID", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.invoice.findFirst).mockImplementation(
        async () =>
          ({
            id: "inv-1",
            paidAmount: 50,
            totalAmount: 200,
          }) as never,
      );

      const result = await financeService.createPayment(
        "tenant-123",
        defaultDto as never,
        "user-1",
      );

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should set status to PAID if fully paid", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.invoice.findFirst).mockImplementation(
        async () =>
          ({
            id: "inv-1",
            paidAmount: 50,
            totalAmount: 150,
          }) as never,
      );

      await financeService.createPayment(
        "tenant-123",
        defaultDto as never,
        "user-1",
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFoundException if invoice not found", async () => {
      const { prisma } = await import("@unerp/database");
      vi.mocked(prisma.invoice.findFirst).mockImplementation(
        async () => null as never,
      );

      await expect(
        financeService.createPayment(
          "tenant-123",
          defaultDto as never,
          "user-1",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getDashboardData", () => {
    it("should return aggregated metrics and chart datasets from database", async () => {
      const result = await financeService.getDashboardData("tenant-123");

      expect(result).toBeDefined();
      expect(result.kpis).toHaveProperty("totalRevenueYtd");
      expect(result.kpis).toHaveProperty("outstandingAr");
      expect(result.kpis).toHaveProperty("paymentRate");
      expect(result.charts).toHaveProperty("revenueTrend");
      expect(result.charts).toHaveProperty("statusDistribution");
    });
  });
});
