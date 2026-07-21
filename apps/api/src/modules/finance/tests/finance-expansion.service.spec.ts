import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinanceExpansionService } from "../finance-expansion.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      toNumber() {
        return 100;
      }
    },
  },
}));

const mockPrisma = vi.hoisted(() => ({
  creditNote: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  debitNote: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  recurringInvoiceTemplate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  generatedInvoice: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  invoice: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  invoiceLineItem: {
    create: vi.fn(),
  },
  expenseReport: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  expenseCategoryPolicy: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dunningLevel: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dunningRun: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  customerStatement: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  statementTemplate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  customer: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

function makeCreditNoteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cn-1",
    tenantId: "t-1",
    orgId: "o-1",
    customerId: "c-1",
    invoiceId: null,
    noteNumber: "CN-001",
    reason: "Defective goods",
    status: "DRAFT",
    lineItems: [],
    amount: 100,
    issueDate: new Date(),
    createdAt: new Date(),
    createdBy: "user-1",
    ...overrides,
  };
}

function makeDebitNoteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "dn-1",
    tenantId: "t-1",
    orgId: "o-1",
    vendorId: "v-1",
    purchaseOrderId: null,
    billId: null,
    noteNumber: "DN-001",
    reason: "Returned items",
    status: "DRAFT",
    lineItems: [],
    amount: 200,
    issueDate: new Date(),
    createdAt: new Date(),
    createdBy: "user-1",
    ...overrides,
  };
}

describe("FinanceExpansionService", () => {
  let service: FinanceExpansionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FinanceExpansionService();
  });

  // ── Credit Notes ──

  describe("createCreditNote", () => {
    const dto = {
      customerId: "c-1",
      creditNoteNumber: "CN-001",
      reason: "Defective goods",
      issueDate: "2026-01-15",
      lineItems: [
        { description: "Item A", quantity: 2, unitPrice: 50, taxRate: 10 },
      ],
    };

    it("should create a credit note successfully", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(null);
      mockPrisma.creditNote.create.mockResolvedValue(makeCreditNoteRow());
      const result = await service.createCreditNote(
        "t-1",
        "o-1",
        dto,
        "user-1",
      );
      expect(result.creditNoteNumber).toBe("CN-001");
      expect(mockPrisma.creditNote.create).toHaveBeenCalled();
    });

    it("should throw on duplicate note number", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(makeCreditNoteRow());
      await expect(
        service.createCreditNote("t-1", "o-1", dto, "user-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw on invalid invoice", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      await expect(
        service.createCreditNote(
          "t-1",
          "o-1",
          { ...dto, invoiceId: "inv-bad" },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getCreditNotes", () => {
    it("should return paginated credit notes", async () => {
      mockPrisma.creditNote.findMany.mockResolvedValue([makeCreditNoteRow()]);
      const result = await service.getCreditNotes("t-1", 1, 10);
      expect(result).toHaveLength(1);
      expect(mockPrisma.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it("should default page=1 and limit=50", async () => {
      mockPrisma.creditNote.findMany.mockResolvedValue([]);
      await service.getCreditNotes("t-1");
      expect(mockPrisma.creditNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 }),
      );
    });
  });

  describe("getCreditNoteById", () => {
    it("should return a credit note", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(makeCreditNoteRow());
      const result = await service.getCreditNoteById("t-1", "cn-1");
      expect(result.id).toBe("cn-1");
    });

    it("should throw on not found", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(null);
      await expect(service.getCreditNoteById("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteCreditNote", () => {
    it("should delete a draft credit note", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(makeCreditNoteRow());
      mockPrisma.creditNote.delete.mockResolvedValue(makeCreditNoteRow());
      const result = await service.deleteCreditNote("t-1", "cn-1");
      expect(result.success).toBe(true);
    });

    it("should throw on not found", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(null);
      await expect(service.deleteCreditNote("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw if applied", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(
        makeCreditNoteRow({ status: "APPLIED" }),
      );
      await expect(service.deleteCreditNote("t-1", "cn-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("applyCreditNote", () => {
    it("should apply credit note to invoice", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(
        makeCreditNoteRow({ invoiceId: "inv-1", amount: 50 }),
      );
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: "inv-1",
        paidAmount: 100,
        tenantId: "t-1",
        deletedAt: null,
      });
      mockPrisma.invoice.update.mockResolvedValue({});
      mockPrisma.creditNote.update.mockResolvedValue(
        makeCreditNoteRow({ status: "APPLIED" }),
      );
      const result = await service.applyCreditNote("t-1", "cn-1");
      expect(result.status).toBe("APPLIED");
    });
  });

  describe("voidCreditNote", () => {
    it("should void a credit note", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(makeCreditNoteRow());
      mockPrisma.creditNote.update.mockResolvedValue(
        makeCreditNoteRow({ status: "VOID" }),
      );
      const result = await service.voidCreditNote("t-1", "cn-1");
      expect(result.status).toBe("VOID");
    });

    it("should throw if already void", async () => {
      mockPrisma.creditNote.findFirst.mockResolvedValue(
        makeCreditNoteRow({ status: "VOID" }),
      );
      await expect(service.voidCreditNote("t-1", "cn-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Debit Notes ──

  describe("createDebitNote", () => {
    const dto = {
      vendorId: "v-1",
      debitNoteNumber: "DN-001",
      reason: "Return",
      issueDate: "2026-01-15",
      lineItems: [
        { description: "Item", quantity: 1, unitPrice: 200, taxRate: 10 },
      ],
    };

    it("should create a debit note", async () => {
      mockPrisma.debitNote.findFirst.mockResolvedValue(null);
      mockPrisma.debitNote.create.mockResolvedValue(makeDebitNoteRow());
      const result = await service.createDebitNote("t-1", "o-1", dto, "user-1");
      expect(result.debitNoteNumber).toBe("DN-001");
    });

    it("should throw on duplicate note number", async () => {
      mockPrisma.debitNote.findFirst.mockResolvedValue(makeDebitNoteRow());
      await expect(
        service.createDebitNote("t-1", "o-1", dto, "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getDebitNotes", () => {
    it("should return paginated debit notes", async () => {
      mockPrisma.debitNote.findMany.mockResolvedValue([makeDebitNoteRow()]);
      const result = await service.getDebitNotes("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getDebitNoteById", () => {
    it("should return debit note", async () => {
      mockPrisma.debitNote.findFirst.mockResolvedValue(makeDebitNoteRow());
      const result = await service.getDebitNoteById("t-1", "dn-1");
      expect(result.id).toBe("dn-1");
    });

    it("should throw on not found", async () => {
      mockPrisma.debitNote.findFirst.mockResolvedValue(null);
      await expect(service.getDebitNoteById("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── Recurring Invoices ──

  describe("createRecurringInvoice", () => {
    const dto = {
      customerId: "c-1",
      templateName: "Monthly Retainer",
      frequency: "MONTHLY" as const,
      interval: 1,
      startDate: "2026-01-01",
      lineItems: [
        { description: "Service", quantity: 1, unitPrice: 1000, taxRate: 10 },
      ],
    };

    it("should create a recurring invoice template", async () => {
      mockPrisma.recurringInvoiceTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findFirst.mockResolvedValue({ id: "c-1" });
      mockPrisma.recurringInvoiceTemplate.create.mockResolvedValue({
        id: "rec-1",
        ...dto,
        lineItems: [],
        status: "ACTIVE",
      });
      const result = await service.createRecurringInvoice("t-1", "o-1", dto);
      expect(result).toBeDefined();
    });

    it("should throw on duplicate template name", async () => {
      mockPrisma.recurringInvoiceTemplate.findFirst.mockResolvedValue({
        id: "existing",
      });
      await expect(
        service.createRecurringInvoice("t-1", "o-1", dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if customer not found", async () => {
      mockPrisma.recurringInvoiceTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.createRecurringInvoice("t-1", "o-1", dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getRecurringInvoices", () => {
    it("should return paginated templates", async () => {
      mockPrisma.recurringInvoiceTemplate.findMany.mockResolvedValue([
        { id: "rec-1", tenantId: "t-1", lineItems: [], status: "ACTIVE" },
      ]);
      const result = await service.getRecurringInvoices("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("generateNextInvoice", () => {
    it("should throw if template not active", async () => {
      mockPrisma.recurringInvoiceTemplate.findFirst.mockResolvedValue({
        id: "rec-1",
        status: "PAUSED",
      });
      await expect(service.generateNextInvoice("t-1", "rec-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("activateRecurringInvoice", () => {
    it("should activate a paused template", async () => {
      mockPrisma.recurringInvoiceTemplate.findFirst.mockResolvedValue({
        id: "rec-1",
        tenantId: "t-1",
        status: "PAUSED",
        templateName: "Test",
      });
      mockPrisma.recurringInvoiceTemplate.update.mockResolvedValue({
        id: "rec-1",
        status: "ACTIVE",
        lineItems: [],
      });
      const result = await service.activateRecurringInvoice("t-1", "rec-1");
      expect(result).toBeDefined();
    });
  });

  // ── Expenses ──

  describe("createExpenseReport", () => {
    it("should create an expense report", async () => {
      mockPrisma.expenseCategoryPolicy.findFirst.mockResolvedValue(null);
      mockPrisma.expenseReport.create.mockResolvedValue({
        id: "exp-1",
        tenantId: "t-1",
        orgId: "o-1",
        employeeId: "e-1",
        title: "Travel",
        totalAmount: 100,
        expenseDate: new Date(),
        currency: "USD",
        status: "DRAFT",
        createdBy: "user-1",
      });
      const result = await service.createExpenseReport(
        "t-1",
        "o-1",
        {
          title: "Travel",
          employeeId: "e-1",
          expenseDate: "2026-01-15",
          amount: 100,
        },
        "user-1",
      );
      expect(result).toBeDefined();
    });

    it("should throw if category not found", async () => {
      mockPrisma.expenseCategoryPolicy.findFirst.mockResolvedValue(null);
      await expect(
        service.createExpenseReport(
          "t-1",
          "o-1",
          {
            title: "Travel",
            employeeId: "e-1",
            expenseDate: "2026-01-15",
            amount: 100,
            categoryId: "cat-1",
          },
          "user-1",
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw if amount exceeds category max", async () => {
      mockPrisma.expenseCategoryPolicy.findFirst.mockResolvedValue({
        id: "cat-1",
        tenantId: "t-1",
        maxAmountPerItem: 50,
      });
      await expect(
        service.createExpenseReport(
          "t-1",
          "o-1",
          {
            title: "Travel",
            employeeId: "e-1",
            expenseDate: "2026-01-15",
            amount: 100,
            categoryId: "cat-1",
          },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getExpenseReports", () => {
    it("should return paginated expense reports", async () => {
      mockPrisma.expenseReport.findMany.mockResolvedValue([
        {
          id: "exp-1",
          tenantId: "t-1",
          orgId: "o-1",
          title: "Test",
          totalAmount: 100,
          employeeId: "e-1",
          expenseDate: new Date(),
          currency: "USD",
          status: "DRAFT",
          createdBy: "u-1",
        },
      ]);
      const result = await service.getExpenseReports("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("submitExpenseReport", () => {
    it("should submit a draft expense report", async () => {
      mockPrisma.expenseReport.findFirst.mockResolvedValue({
        id: "exp-1",
        tenantId: "t-1",
        status: "DRAFT",
        employeeId: "e-1",
        totalAmount: 100,
      });
      mockPrisma.expenseReport.update.mockResolvedValue({
        id: "exp-1",
        status: "SUBMITTED",
      });
      const result = await service.submitExpenseReport("t-1", "exp-1");
      expect(result).toBeDefined();
    });
  });

  describe("approveExpenseReport", () => {
    it("should approve a submitted expense report", async () => {
      mockPrisma.expenseReport.findFirst.mockResolvedValue({
        id: "exp-1",
        tenantId: "t-1",
        status: "SUBMITTED",
        employeeId: "e-1",
        totalAmount: 100,
      });
      mockPrisma.expenseReport.update.mockResolvedValue({
        id: "exp-1",
        status: "APPROVED",
      });
      const result = await service.approveExpenseReport("t-1", "exp-1");
      expect(result).toBeDefined();
    });
  });

  // ── Dunning ──

  describe("createDunningLevel", () => {
    it("should create a dunning level", async () => {
      mockPrisma.dunningLevel.findFirst.mockResolvedValue(null);
      mockPrisma.dunningLevel.create.mockResolvedValue({
        id: "dl-1",
        tenantId: "t-1",
        orgId: null,
        levelName: "Level 1",
        levelNumber: 1,
        daysOverdue: 30,
        maxOverdueDays: null,
        feeAmount: 10,
        feePercentage: 5,
        emailTemplate: null,
        interestRate: 2,
        status: "ACTIVE",
      });
      const result = await service.createDunningLevel("t-1", {
        name: "Level 1",
        levelNumber: 1,
        minOverdueDays: 30,
      });
      expect(result).toBeDefined();
    });

    it("should throw on duplicate level number", async () => {
      mockPrisma.dunningLevel.findFirst.mockResolvedValue({ id: "existing" });
      await expect(
        service.createDunningLevel("t-1", {
          name: "Level 1",
          levelNumber: 1,
          minOverdueDays: 30,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getDunningLevels", () => {
    it("should return paginated dunning levels", async () => {
      mockPrisma.dunningLevel.findMany.mockResolvedValue([
        {
          id: "dl-1",
          tenantId: "t-1",
          levelName: "L1",
          levelNumber: 1,
          daysOverdue: 30,
        },
      ]);
      const result = await service.getDunningLevels("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getDunningRuns", () => {
    it("should return paginated dunning runs", async () => {
      mockPrisma.dunningRun.findMany.mockResolvedValue([
        {
          id: "dr-1",
          tenantId: "t-1",
          title: "Run 1",
          runDate: new Date(),
          status: "DRAFT",
          levelIds: [],
          customerIds: [],
          minOverdueDays: 1,
          results: [],
          totalLetters: 0,
          totalAmount: 0,
        },
      ]);
      const result = await service.getDunningRuns("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getOverdueSummary", () => {
    it("should return overdue summary with aging buckets", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: "inv-1",
          totalAmount: 100,
          paidAmount: 0,
          dueDate: new Date(Date.now() - 15 * 86400000),
          status: "SENT",
        },
      ]);
      const result = await service.getOverdueSummary("t-1");
      expect(result.totalOverdue).toBe(1);
      expect(result.agingBuckets).toHaveLength(4);
    });
  });

  // ── Statements ──

  describe("generateStatement", () => {
    it("should generate a customer statement", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: "c-1" });
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: "inv-1",
          invoiceNumber: "INV-001",
          issueDate: new Date(),
          dueDate: new Date(),
          totalAmount: 500,
          paidAmount: 100,
          status: "SENT",
        },
      ]);
      mockPrisma.customerStatement.create.mockResolvedValue({});
      const result = await service.generateStatement("t-1", {
        customerId: "c-1",
        asOfDate: "2026-06-01",
      });
      expect(result).toBeDefined();
    });

    it("should throw if customer not found", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      await expect(
        service.generateStatement("t-1", {
          customerId: "bad",
          asOfDate: "2026-06-01",
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getStatements", () => {
    it("should return paginated statements", async () => {
      mockPrisma.customerStatement.findMany.mockResolvedValue([
        {
          id: "st-1",
          tenantId: "t-1",
          customerId: "c-1",
          periodEnd: new Date(),
          status: "DRAFT",
          includePaidInvoices: false,
          lineItems: [],
          notes: null,
          generatedAt: new Date(),
          sentAt: null,
        },
      ]);
      const result = await service.getStatements("t-1");
      expect(result).toHaveLength(1);
    });

    it("should filter by customerId", async () => {
      mockPrisma.customerStatement.findMany.mockResolvedValue([]);
      await service.getStatements("t-1", "c-1");
      expect(mockPrisma.customerStatement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: "c-1" }),
        }),
      );
    });
  });

  describe("getStatementTemplates", () => {
    it("should return paginated templates", async () => {
      mockPrisma.statementTemplate.findMany.mockResolvedValue([
        { id: "st-1", tenantId: "t-1", templateName: "Standard" },
      ]);
      const result = await service.getStatementTemplates("t-1");
      expect(result).toHaveLength(1);
    });
  });
});
