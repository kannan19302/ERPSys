import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinanceOperationsService } from "../finance-operations.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

vi.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
  },
}));

const mockPrisma = vi.hoisted(() => ({
  paymentTermTemplate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
  },
  paymentMethod: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  taxRate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
  },
  taxJurisdiction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  currency: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  exchangeRate: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  bankAccount: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  bankConnection: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  bankTransaction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  budget: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  budgetPeriodAmount: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  vendorBill: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  vendorBillLineItem: {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  invoice: {
    findMany: vi.fn(),
  },
  customer: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  paymentTransaction: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  savedReport: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  account: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  journalEntry: {
    findMany: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  },
  journal: {
    findMany: vi.fn(),
  },
  payment: {
    findMany: vi.fn(),
  },
}));

vi.mock("@unerp/database", () => ({ prisma: mockPrisma }));

function mockPaymentTerm(overrides = {}) {
  return {
    id: "pt-1",
    tenantId: "t-1",
    name: "Net 30",
    dueDays: 30,
    discountDays: 0,
    discountPct: 0,
    description: null,
    isActive: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockPaymentMethod(overrides = {}) {
  return {
    id: "pm-1",
    tenantId: "t-1",
    provider: "Credit Card",
    providerPaymentMethodId: "CC",
    isDefault: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockTaxRate(overrides = {}) {
  return {
    id: "tr-1",
    tenantId: "t-1",
    name: "VAT 20%",
    rate: 20,
    isSystem: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockCurrency(overrides = {}) {
  return {
    id: "cur-1",
    tenantId: "t-1",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    isBase: true,
    decimalPlaces: 2,
    createdAt: new Date(),
    ...overrides,
  };
}

function mockExchangeRate(overrides = {}) {
  return {
    id: "er-1",
    tenantId: "t-1",
    fromCurrency: "USD",
    toCurrency: "EUR",
    rate: 0.85,
    date: new Date(),
    ...overrides,
  };
}

function mockBankAccount(overrides = {}) {
  return {
    id: "ba-1",
    tenantId: "t-1",
    orgId: "o-1",
    accountId: "acc-1",
    bankName: "Test Bank",
    accountNumber: "12345",
    currency: "USD",
    status: "ACTIVE",
    createdAt: new Date(),
    ...overrides,
  };
}

function mockBudget(overrides = {}) {
  return {
    id: "bg-1",
    tenantId: "t-1",
    orgId: "o-1",
    accountId: "acc-1",
    amount: 10000,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    periodAmounts: [],
    createdAt: new Date(),
    ...overrides,
  };
}

function mockVendorBill(overrides = {}) {
  return {
    id: "vb-1",
    tenantId: "t-1",
    orgId: "o-1",
    vendorId: "v-1",
    billNumber: "BILL-001",
    billDate: new Date(),
    dueDate: new Date(),
    purchaseOrderId: null,
    subtotal: 100,
    taxAmount: 10,
    totalAmount: 110,
    status: "DRAFT",
    notes: null,
    createdBy: "u-1",
    createdAt: new Date(),
    ...overrides,
  };
}

function mockSavedReport(overrides = {}) {
  return {
    id: "sr-1",
    tenantId: "t-1",
    name: "Q1 Report",
    type: "profit-loss",
    filters: {},
    columns: [],
    createdBy: "u-1",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("FinanceOperationsService", () => {
  let service: FinanceOperationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FinanceOperationsService();
    // Default GL-linkage plumbing used by bank-account balance derivation.
    mockPrisma.account.findFirst.mockResolvedValue({
      id: "gl-cash-1",
      type: "ASSET",
    });
    mockPrisma.account.create.mockResolvedValue({
      id: "gl-cash-1",
      type: "ASSET",
    });
    mockPrisma.account.findMany.mockResolvedValue([
      { id: "gl-cash-1", type: "ASSET" },
    ]);
    mockPrisma.journalEntry.groupBy.mockResolvedValue([]);
  });

  // ── Payment Terms ──

  describe("createPaymentTerm", () => {
    it("should create a payment term", async () => {
      mockPrisma.paymentTermTemplate.create.mockResolvedValue(
        mockPaymentTerm(),
      );
      mockPrisma.paymentTermTemplate.updateMany.mockResolvedValue({ count: 0 });
      const result = await service.createPaymentTerm("t-1", {
        name: "Net 30",
        dueDays: 30,
      });
      expect(result).toBeDefined();
      expect(result.name).toBe("Net 30");
    });

    it("should unset other defaults when isDefault is true", async () => {
      mockPrisma.paymentTermTemplate.create.mockResolvedValue(
        mockPaymentTerm({ isActive: true }),
      );
      mockPrisma.paymentTermTemplate.updateMany.mockResolvedValue({ count: 1 });
      await service.createPaymentTerm("t-1", {
        name: "Net 60",
        dueDays: 60,
        isDefault: true,
      });
      expect(mockPrisma.paymentTermTemplate.updateMany).toHaveBeenCalled();
    });
  });

  describe("listPaymentTerms", () => {
    it("should return paginated payment terms", async () => {
      mockPrisma.paymentTermTemplate.findMany.mockResolvedValue([
        mockPaymentTerm(),
      ]);
      const result = await service.listPaymentTerms("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getPaymentTerm", () => {
    it("should return a payment term by id", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(
        mockPaymentTerm(),
      );
      const result = await service.getPaymentTerm("t-1", "pt-1");
      expect(result.id).toBe("pt-1");
    });

    it("should throw on not found", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(null);
      await expect(service.getPaymentTerm("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updatePaymentTerm", () => {
    it("should update a payment term", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(
        mockPaymentTerm(),
      );
      mockPrisma.paymentTermTemplate.update.mockResolvedValue(
        mockPaymentTerm({ name: "Net 60" }),
      );
      const result = await service.updatePaymentTerm("t-1", "pt-1", {
        name: "Net 60",
      });
      expect(result).toBeDefined();
    });
  });

  describe("deletePaymentTerm", () => {
    it("should delete a payment term", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(
        mockPaymentTerm(),
      );
      mockPrisma.paymentTermTemplate.delete.mockResolvedValue({});
      const result = await service.deletePaymentTerm("t-1", "pt-1");
      expect(result.success).toBe(true);
    });
  });

  describe("getDefaultPaymentTerm", () => {
    it("should return default term", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(
        mockPaymentTerm(),
      );
      const result = await service.getDefaultPaymentTerm("t-1");
      expect(result).toBeDefined();
    });

    it("should return null if none set", async () => {
      mockPrisma.paymentTermTemplate.findFirst.mockResolvedValue(null);
      const result = await service.getDefaultPaymentTerm("t-1");
      expect(result).toBeNull();
    });
  });

  // ── Payment Methods ──

  describe("createPaymentMethod", () => {
    it("should create a payment method", async () => {
      mockPrisma.paymentMethod.create.mockResolvedValue(mockPaymentMethod());
      const result = await service.createPaymentMethod("t-1", {
        name: "Credit Card",
        code: "CC",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listPaymentMethods", () => {
    it("should return paginated payment methods", async () => {
      mockPrisma.paymentMethod.findMany.mockResolvedValue([
        mockPaymentMethod(),
      ]);
      const result = await service.listPaymentMethods("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getPaymentMethod", () => {
    it("should throw on not found", async () => {
      mockPrisma.paymentMethod.findFirst.mockResolvedValue(null);
      await expect(service.getPaymentMethod("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── Tax Rates ──

  describe("createTaxRate", () => {
    it("should create a tax rate", async () => {
      mockPrisma.taxRate.create.mockResolvedValue(mockTaxRate());
      const result = await service.createTaxRate("t-1", {
        name: "VAT 20%",
        rate: 20,
        type: "VAT",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listTaxRates", () => {
    it("should return paginated tax rates", async () => {
      mockPrisma.taxRate.findMany.mockResolvedValue([mockTaxRate()]);
      const result = await service.listTaxRates("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getTaxRate", () => {
    it("should throw on not found", async () => {
      mockPrisma.taxRate.findFirst.mockResolvedValue(null);
      await expect(service.getTaxRate("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("computeTax", () => {
    it("should compute tax amount", async () => {
      mockPrisma.taxRate.findFirst.mockResolvedValue(mockTaxRate());
      const result = await service.computeTax(100, "tr-1", "t-1");
      expect(result.taxAmount).toBe(20);
      expect(result.rate).toBe(20);
    });
  });

  // ── Tax Jurisdictions ──

  describe("createTaxJurisdiction", () => {
    it("should create a tax jurisdiction", async () => {
      mockPrisma.taxJurisdiction.create.mockResolvedValue({
        id: "tj-1",
        tenantId: "t-1",
        name: "California",
        code: "CA",
        country: "US",
        state: "CA",
        description: null,
      });
      const result = await service.createTaxJurisdiction("t-1", {
        name: "California",
        code: "CA",
        country: "US",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listTaxJurisdictions", () => {
    it("should return paginated jurisdictions", async () => {
      mockPrisma.taxJurisdiction.findMany.mockResolvedValue([
        {
          id: "tj-1",
          tenantId: "t-1",
          name: "CA",
          code: "CA",
          country: "US",
          state: null,
          description: null,
        },
      ]);
      const result = await service.listTaxJurisdictions("t-1");
      expect(result).toHaveLength(1);
    });
  });

  // ── Currencies ──

  describe("createCurrency", () => {
    it("should create a currency", async () => {
      mockPrisma.currency.findFirst.mockResolvedValue(null);
      mockPrisma.currency.create.mockResolvedValue(mockCurrency());
      const result = await service.createCurrency("t-1", {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listCurrencies", () => {
    it("should return paginated currencies", async () => {
      mockPrisma.currency.findMany.mockResolvedValue([mockCurrency()]);
      const result = await service.listCurrencies("t-1");
      expect(result).toHaveLength(1);
    });
  });

  // ── Exchange Rates ──

  describe("createExchangeRate", () => {
    it("should create an exchange rate", async () => {
      mockPrisma.exchangeRate.create.mockResolvedValue(mockExchangeRate());
      const result = await service.createExchangeRate("t-1", {
        fromCurrency: "USD",
        toCurrency: "EUR",
        rate: 0.85,
        validFrom: "2026-01-01",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listExchangeRates", () => {
    it("should return paginated exchange rates", async () => {
      mockPrisma.exchangeRate.findMany.mockResolvedValue([mockExchangeRate()]);
      const result = await service.listExchangeRates("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getLatestExchangeRate", () => {
    it("should return the latest rate", async () => {
      mockPrisma.exchangeRate.findFirst.mockResolvedValue(mockExchangeRate());
      const result = await service.getLatestExchangeRate("t-1", "USD", "EUR");
      expect(result).toBeDefined();
    });
  });

  describe("syncRates", () => {
    it("should import multiple rates", async () => {
      mockPrisma.exchangeRate.create.mockResolvedValue(mockExchangeRate());
      const result = await service.syncRates("t-1", [
        {
          fromCurrency: "USD",
          toCurrency: "EUR",
          rate: 0.85,
          validFrom: "2026-01-01",
        },
      ]);
      expect(result.imported).toBe(1);
    });
  });

  // ── Bank Accounts ──

  describe("createBankAccount", () => {
    it("should create a bank account", async () => {
      mockPrisma.bankAccount.create.mockResolvedValue(mockBankAccount());
      const result = await service.createBankAccount("t-1", "o-1", {
        accountName: "Main Checking",
        bankName: "Chase",
        accountNumber: "12345",
      });
      expect(result).toBeDefined();
    });
  });

  describe("listBankAccounts", () => {
    it("should return paginated bank accounts", async () => {
      mockPrisma.bankAccount.findMany.mockResolvedValue([mockBankAccount()]);
      const result = await service.listBankAccounts("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getBankAccountStats", () => {
    it("should return account stats", async () => {
      mockPrisma.bankAccount.findMany.mockResolvedValue([mockBankAccount()]);
      const result = await service.getBankAccountStats("t-1");
      expect(result.totalAccounts).toBe(1);
    });
  });

  // ── Budgets ──

  describe("createBudget", () => {
    it("should create a budget", async () => {
      mockPrisma.budget.create.mockResolvedValue(mockBudget());
      const result = await service.createBudget("t-1", "o-1", {
        name: "OpEx 2026",
        fiscalYear: 2026,
        accountId: "acc-1",
        amount: 10000,
      });
      expect(result).toBeDefined();
    });
  });

  describe("listBudgets", () => {
    it("should return paginated budgets", async () => {
      mockPrisma.budget.findMany.mockResolvedValue([
        { ...mockBudget(), periodAmounts: [] },
      ]);
      const result = await service.listBudgets("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("getBudget", () => {
    it("should throw on not found", async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);
      await expect(service.getBudget("t-1", "bad")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("deleteBudget", () => {
    it("should delete a budget", async () => {
      mockPrisma.budget.findFirst.mockResolvedValue({
        ...mockBudget(),
        periodAmounts: [],
      });
      mockPrisma.budgetPeriodAmount.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.budget.delete.mockResolvedValue({});
      const result = await service.deleteBudget("t-1", "bg-1");
      expect(result.success).toBe(true);
    });
  });

  // ── Vendor Bills ──

  describe("createVendorBill", () => {
    it("should create a vendor bill", async () => {
      mockPrisma.vendorBill.findFirst.mockResolvedValue(null);
      mockPrisma.vendorBill.create.mockResolvedValue(mockVendorBill());
      mockPrisma.vendorBillLineItem.findMany.mockResolvedValue([]);
      mockPrisma.vendorBillLineItem.create.mockResolvedValue({});
      const result = await service.createVendorBill("t-1", "o-1", "u-1", {
        vendorId: "v-1",
        billNumber: "BILL-001",
        billDate: "2026-01-15",
        dueDate: "2026-02-15",
        lineItems: [
          { description: "Item", quantity: 1, unitPrice: 100, taxRate: 10 },
        ],
      });
      expect(result).toBeDefined();
    });

    it("should throw on duplicate bill number", async () => {
      mockPrisma.vendorBill.findFirst.mockResolvedValue(mockVendorBill());
      await expect(
        service.createVendorBill("t-1", "o-1", "u-1", {
          vendorId: "v-1",
          billNumber: "BILL-001",
          billDate: "2026-01-15",
          dueDate: "2026-02-15",
          lineItems: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("listVendorBills", () => {
    it("should return paginated vendor bills", async () => {
      mockPrisma.vendorBill.findMany.mockResolvedValue([mockVendorBill()]);
      mockPrisma.vendorBillLineItem.findMany.mockResolvedValue([]);
      const result = await service.listVendorBills("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("approveVendorBill", () => {
    it("should approve a draft bill", async () => {
      mockPrisma.vendorBill.findFirst.mockResolvedValue(
        mockVendorBill({ status: "DRAFT" }),
      );
      mockPrisma.vendorBillLineItem.findMany.mockResolvedValue([]);
      mockPrisma.vendorBill.update.mockResolvedValue(
        mockVendorBill({ status: "APPROVED" }),
      );
      const result = await service.approveVendorBill("t-1", "vb-1");
      expect(result).toBeDefined();
    });
  });

  describe("getVendorBillAging", () => {
    it("should return aging buckets", async () => {
      mockPrisma.vendorBill.findMany.mockResolvedValue([
        mockVendorBill({
          status: "APPROVED",
          dueDate: new Date(Date.now() - 45 * 86400000),
        }),
      ]);
      const result = await service.getVendorBillAging("t-1");
      expect(result).toHaveLength(5);
    });
  });

  describe("getPendingApprovalVendorBills", () => {
    it("should return paginated pending bills", async () => {
      mockPrisma.vendorBill.findMany.mockResolvedValue([
        mockVendorBill({ status: "DRAFT" }),
      ]);
      mockPrisma.vendorBillLineItem.findMany.mockResolvedValue([]);
      const result = await service.getPendingApprovalVendorBills("t-1");
      expect(result).toHaveLength(1);
    });
  });

  // ── Saved Reports ──

  describe("saveReportConfig", () => {
    it("should save a report config", async () => {
      mockPrisma.savedReport.create.mockResolvedValue(mockSavedReport());
      const result = await service.saveReportConfig("t-1", "u-1", {
        name: "Q1 Report",
        type: "profit-loss",
        config: {},
      });
      expect(result).toBeDefined();
    });
  });

  describe("listSavedReportConfigs", () => {
    it("should return paginated saved reports", async () => {
      mockPrisma.savedReport.findMany.mockResolvedValue([mockSavedReport()]);
      const result = await service.listSavedReportConfigs("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("deleteSavedReportConfig", () => {
    it("should soft-delete a saved report", async () => {
      mockPrisma.savedReport.findFirst.mockResolvedValue(mockSavedReport());
      mockPrisma.savedReport.update.mockResolvedValue({
        ...mockSavedReport(),
        deletedAt: new Date(),
      });
      const result = await service.deleteSavedReportConfig("t-1", "sr-1");
      expect(result.success).toBe(true);
    });
  });

  // ── Financial Reports ──

  describe("getProfitLoss", () => {
    it("should return profit and loss data", async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        {
          id: "acc-1",
          code: "4000",
          name: "Revenue",
          type: "REVENUE",
          isActive: true,
        },
      ]);
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);
      const result = await service.getProfitLoss(
        "t-1",
        "2026-01-01",
        "2026-12-31",
      );
      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("totalExpenses");
      expect(result).toHaveProperty("netIncome");
    });
  });

  describe("getBalanceSheet", () => {
    it("should return balance sheet data", async () => {
      mockPrisma.account.findMany.mockResolvedValue([]);
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);
      const result = await service.getBalanceSheet("t-1", "2026-12-31");
      expect(result).toHaveProperty("assets");
      expect(result).toHaveProperty("liabilities");
      expect(result).toHaveProperty("equity");
    });
  });

  describe("getCashFlow", () => {
    it("should return cash flow data", async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);
      const result = await service.getCashFlow(
        "t-1",
        "2026-01-01",
        "2026-12-31",
      );
      expect(result).toHaveProperty("operating");
      expect(result).toHaveProperty("investing");
      expect(result).toHaveProperty("financing");
    });
  });

  describe("getTrialBalance", () => {
    it("should return trial balance data", async () => {
      mockPrisma.account.findMany.mockResolvedValue([
        {
          id: "acc-1",
          code: "1000",
          name: "Cash",
          type: "ASSET",
          isActive: true,
        },
      ]);
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);
      const result = await service.getTrialBalance("t-1", "2026-12-31");
      expect(result).toHaveProperty("accounts");
      expect(result).toHaveProperty("totals");
    });
  });

  describe("getArAging", () => {
    it("should return AR aging", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      const result = await service.getArAging("t-1", "2026-12-31");
      expect(result).toHaveLength(5);
    });
  });

  describe("getGeneralLedger", () => {
    it("should return ledger entries", async () => {
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);
      const result = await service.getGeneralLedger(
        "t-1",
        "2026-01-01",
        "2026-12-31",
      );
      expect(result).toEqual([]);
    });
  });

  describe("getTaxSummary", () => {
    it("should return tax summary", async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      const result = await service.getTaxSummary("t-1", 2026);
      expect(result).toHaveProperty("totalTaxCollected");
    });
  });
});
