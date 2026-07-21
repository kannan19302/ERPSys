import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { EventEmitter2 } from "@nestjs/event-emitter";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface PaymentTerm {
  id: string;
  tenantId: string;
  name: string;
  dueDays: number;
  discountDays?: number;
  discountPercentage?: number;
  description?: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isActive: boolean;
  description?: string;
  processingFee: number;
}

export interface TaxRate {
  id: string;
  tenantId: string;
  name: string;
  rate: number;
  type: "SALES" | "PURCHASE" | "WITHHOLDING" | "VAT" | "GST";
  jurisdiction?: string;
  isDefault: boolean;
  isCompound: boolean;
  description?: string;
}

export interface TaxJurisdiction {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  country: string;
  state?: string;
  description?: string;
}

export interface Currency {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
  decimalPlaces: number;
}

export interface ExchangeRate {
  id: string;
  tenantId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  validFrom: string;
  validTo?: string;
}

export interface BankAccount {
  id: string;
  tenantId: string;
  orgId: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountType: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "CASH";
  currency: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  tenantId: string;
  bankAccountId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  date: string;
  reconciled: boolean;
}

export interface Budget {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  fiscalYear: number;
  accountId: string;
  amount: number;
  spentAmount: number;
  notes?: string;
  status: "ACTIVE" | "CLOSED";
  periodAmounts: Array<{ period: string; amount: number }>;
  createdAt: string;
}

export interface VendorBillLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export interface VendorBill {
  id: string;
  tenantId: string;
  orgId: string;
  vendorId: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  purchaseOrderId?: string;
  status: "DRAFT" | "APPROVED" | "PAID" | "VOID";
  lineItems: VendorBillLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  paidAt?: string;
}

export interface VendorBillPayment {
  id: string;
  tenantId: string;
  billId: string;
  amount: number;
  method: string;
  reference?: string;
  paidAt: string;
  createdBy: string;
}

export interface SavedReportConfig {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────

@Injectable()
export class FinanceOperationsService {
  constructor(private readonly eventEmitter?: EventEmitter2) {}

  // ── Mapping helpers ──

  private toPaymentTerm(db: {
    id: string;
    tenantId: string;
    name: string;
    dueDays: number;
    discountDays: number;
    discountPct: { toNumber(): number } | number;
    description: string | null;
    isActive: boolean;
  }): PaymentTerm {
    return {
      id: db.id,
      tenantId: db.tenantId,
      name: db.name,
      dueDays: db.dueDays,
      discountDays: db.discountDays || undefined,
      discountPercentage:
        typeof db.discountPct === "number"
          ? db.discountPct
          : Number(db.discountPct) || undefined,
      description: db.description || undefined,
      isDefault: db.isActive,
    };
  }

  private toPaymentMethod(db: {
    id: string;
    tenantId: string;
    provider: string;
    providerPaymentMethodId: string;
    isDefault: boolean;
  }): PaymentMethod {
    return {
      id: db.id,
      tenantId: db.tenantId,
      name: db.provider,
      code: db.providerPaymentMethodId,
      isActive: db.isDefault,
      description: undefined,
      processingFee: 0,
    };
  }

  private toTaxRate(db: {
    id: string;
    tenantId: string;
    name: string;
    rate: { toNumber(): number } | number;
    isSystem: boolean;
  }): TaxRate {
    return {
      id: db.id,
      tenantId: db.tenantId,
      name: db.name,
      rate: typeof db.rate === "number" ? db.rate : Number(db.rate),
      type: "SALES",
      jurisdiction: undefined,
      isDefault: db.isSystem,
      isCompound: false,
      description: undefined,
    };
  }

  private toTaxJurisdiction(db: {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    country: string;
    state: string | null;
    description: string | null;
  }): TaxJurisdiction {
    return {
      id: db.id,
      tenantId: db.tenantId,
      name: db.name,
      code: db.code,
      country: db.country,
      state: db.state || undefined,
      description: db.description || undefined,
    };
  }

  private toCurrency(db: {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    symbol: string;
    isBase: boolean;
    decimalPlaces: number;
  }): Currency {
    return {
      id: db.id,
      tenantId: db.tenantId,
      code: db.code,
      name: db.name,
      symbol: db.symbol,
      isBase: db.isBase,
      decimalPlaces: db.decimalPlaces,
    };
  }

  private toExchangeRate(db: {
    id: string;
    tenantId: string;
    fromCurrency: string;
    toCurrency: string;
    rate: { toNumber(): number } | number;
    date: Date;
  }): ExchangeRate {
    return {
      id: db.id,
      tenantId: db.tenantId,
      fromCurrency: db.fromCurrency,
      toCurrency: db.toCurrency,
      rate: typeof db.rate === "number" ? db.rate : Number(db.rate),
      validFrom: db.date.toISOString(),
      validTo: undefined,
    };
  }

  private toBankAccount(db: {
    id: string;
    tenantId: string;
    orgId: string;
    accountId: string;
    bankName: string;
    accountNumber: string;
    currency: string;
    status: string;
    createdAt: Date;
  }): BankAccount {
    return {
      id: db.id,
      tenantId: db.tenantId,
      orgId: db.orgId,
      accountName: db.bankName,
      bankName: db.bankName,
      accountNumber: db.accountNumber,
      accountType: "CHECKING",
      currency: db.currency,
      openingBalance: 0,
      currentBalance: 0,
      isActive: db.status === "ACTIVE",
      notes: undefined,
      verifiedAt: undefined,
      createdAt: db.createdAt.toISOString(),
    };
  }

  private toBankTransaction(db: {
    id: string;
    tenantId: string;
    connectionId: string;
    amount: { toNumber(): number } | number;
    date: Date;
    description: string;
    status: string;
  }): BankTransaction {
    return {
      id: db.id,
      tenantId: db.tenantId,
      bankAccountId: db.connectionId,
      amount: typeof db.amount === "number" ? db.amount : Number(db.amount),
      type:
        (typeof db.amount === "number" ? db.amount : Number(db.amount)) >= 0
          ? "CREDIT"
          : "DEBIT",
      description: db.description,
      date: db.date.toISOString(),
      reconciled: db.status === "MATCHED",
    };
  }

  private toBudget(db: {
    id: string;
    tenantId: string;
    orgId: string;
    accountId: string;
    amount: { toNumber(): number } | number;
    startDate: Date;
    endDate: Date;
    periodAmounts?: Array<{
      period: string;
      amount: { toNumber(): number } | number;
    }>;
  }): Budget {
    return {
      id: db.id,
      tenantId: db.tenantId,
      orgId: db.orgId,
      name: `Budget ${db.startDate.getFullYear()}`,
      fiscalYear: db.startDate.getFullYear(),
      accountId: db.accountId,
      amount: typeof db.amount === "number" ? db.amount : Number(db.amount),
      spentAmount: 0,
      status: "ACTIVE",
      periodAmounts: (db.periodAmounts || []).map((pa) => ({
        period: pa.period,
        amount: typeof pa.amount === "number" ? pa.amount : Number(pa.amount),
      })),
      createdAt: db.startDate.toISOString(),
    };
  }

  private async getLineItemsForBill(
    billId: string,
  ): Promise<VendorBillLineItem[]> {
    const items = await prisma.vendorBillLineItem.findMany({
      where: { vendorBillId: billId },
    });
    return items.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      taxRate: Number(li.taxRate),
      totalAmount: Number(li.totalAmount),
    }));
  }

  private async toVendorBillFull(db: {
    id: string;
    tenantId: string;
    orgId: string;
    vendorId: string;
    billNumber: string;
    billDate: Date;
    dueDate: Date;
    purchaseOrderId: string | null;
    subtotal: { toNumber(): number } | number;
    taxAmount: { toNumber(): number } | number;
    totalAmount: { toNumber(): number } | number;
    status: string;
    notes: string | null;
    createdBy: string | null;
    createdAt: Date;
  }): Promise<VendorBill> {
    const lineItems = await this.getLineItemsForBill(db.id);
    return {
      id: db.id,
      tenantId: db.tenantId,
      orgId: db.orgId,
      vendorId: db.vendorId,
      billNumber: db.billNumber,
      billDate: db.billDate.toISOString(),
      dueDate: db.dueDate.toISOString(),
      purchaseOrderId: db.purchaseOrderId || undefined,
      status: db.status as "DRAFT" | "APPROVED" | "PAID" | "VOID",
      lineItems,
      subtotal:
        typeof db.subtotal === "number" ? db.subtotal : Number(db.subtotal),
      taxAmount:
        typeof db.taxAmount === "number" ? db.taxAmount : Number(db.taxAmount),
      totalAmount:
        typeof db.totalAmount === "number"
          ? db.totalAmount
          : Number(db.totalAmount),
      paidAmount: 0,
      notes: db.notes || undefined,
      createdAt: db.createdAt.toISOString(),
      createdBy: db.createdBy || "",
    };
  }

  private toVendorBillPayment(db: {
    id: string;
    tenantId: string;
    description: string | null;
    amount: { toNumber(): number } | number;
    createdAt: Date;
    metadata: unknown;
  }): VendorBillPayment {
    const meta = (db.metadata || {}) as Record<string, unknown>;
    return {
      id: db.id,
      tenantId: db.tenantId,
      billId: (meta.billId as string) || "",
      amount: typeof db.amount === "number" ? db.amount : Number(db.amount),
      method: (meta.method as string) || "BANK_TRANSFER",
      reference: (meta.reference as string) || undefined,
      paidAt: db.createdAt.toISOString(),
      createdBy: (meta.createdBy as string) || "",
    };
  }

  private toSavedReportConfig(db: {
    id: string;
    tenantId: string;
    name: string;
    type: string;
    filters: unknown;
    columns: unknown;
    createdBy: string;
    createdAt: Date;
  }): SavedReportConfig {
    return {
      id: db.id,
      tenantId: db.tenantId,
      name: db.name,
      type: db.type,
      config: { filters: db.filters, columns: db.columns } as Record<
        string,
        unknown
      >,
      createdBy: db.createdBy,
      createdAt: db.createdAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────
  // 1. PAYMENT TERMS
  // ─────────────────────────────────────────────────

  async createPaymentTerm(
    tenantId: string,
    data: {
      name: string;
      dueDays: number;
      discountDays?: number;
      discountPercentage?: number;
      description?: string;
      isDefault?: boolean;
    },
  ): Promise<PaymentTerm> {
    const isDefault = data.isDefault ?? false;
    if (isDefault) {
      await prisma.paymentTermTemplate.updateMany({
        where: { tenantId, isActive: true },
        data: { isActive: false },
      });
    }
    const term = await prisma.paymentTermTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        dueDays: data.dueDays,
        discountDays: data.discountDays || 0,
        discountPct: data.discountPercentage || 0,
        isActive: isDefault,
      },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.payment-term.created", {
        tenantId,
        paymentTermId: term.id,
        name: term.name,
      });
    }
    return this.toPaymentTerm(term);
  }

  async listPaymentTerms(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<PaymentTerm[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const terms = await prisma.paymentTermTemplate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return terms.map((t) => this.toPaymentTerm(t));
  }

  async getPaymentTerm(tenantId: string, id: string): Promise<PaymentTerm> {
    const term = await prisma.paymentTermTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!term) throw new NotFoundException("Payment term not found");
    return this.toPaymentTerm(term);
  }

  async updatePaymentTerm(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      dueDays: number;
      discountDays?: number;
      discountPercentage?: number;
      description?: string;
      isDefault?: boolean;
    }>,
  ): Promise<PaymentTerm> {
    await this.getPaymentTerm(tenantId, id);
    if (data.isDefault) {
      await prisma.paymentTermTemplate.updateMany({
        where: { tenantId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.dueDays !== undefined) updateData.dueDays = data.dueDays;
    if (data.discountDays !== undefined)
      updateData.discountDays = data.discountDays;
    if (data.discountPercentage !== undefined)
      updateData.discountPct = data.discountPercentage;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isActive = data.isDefault;
    const term = await prisma.paymentTermTemplate.update({
      where: { id },
      data: updateData,
    });
    return this.toPaymentTerm(term);
  }

  async deletePaymentTerm(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getPaymentTerm(tenantId, id);
    await prisma.paymentTermTemplate.delete({ where: { id } });
    return { success: true };
  }

  async getDefaultPaymentTerm(tenantId: string): Promise<PaymentTerm | null> {
    const term = await prisma.paymentTermTemplate.findFirst({
      where: { tenantId, isActive: true },
    });
    return term ? this.toPaymentTerm(term) : null;
  }

  async setDefaultPaymentTerm(
    tenantId: string,
    id: string,
  ): Promise<PaymentTerm> {
    await this.getPaymentTerm(tenantId, id);
    await prisma.paymentTermTemplate.updateMany({
      where: { tenantId, isActive: true },
      data: { isActive: false },
    });
    const term = await prisma.paymentTermTemplate.update({
      where: { id },
      data: { isActive: true },
    });
    return this.toPaymentTerm(term);
  }

  // ─────────────────────────────────────────────────
  // 2. PAYMENT METHODS
  // ─────────────────────────────────────────────────

  async createPaymentMethod(
    tenantId: string,
    data: {
      name: string;
      code: string;
      isActive?: boolean;
      description?: string;
      processingFee?: number;
    },
  ): Promise<PaymentMethod> {
    const method = await prisma.paymentMethod.create({
      data: {
        tenantId,
        provider: data.name,
        providerPaymentMethodId: data.code,
        isDefault: data.isActive ?? true,
      },
    });
    return this.toPaymentMethod(method);
  }

  async listPaymentMethods(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<PaymentMethod[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const methods = await prisma.paymentMethod.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return methods.map((m) => this.toPaymentMethod(m));
  }

  async getPaymentMethod(tenantId: string, id: string): Promise<PaymentMethod> {
    const method = await prisma.paymentMethod.findFirst({
      where: { id, tenantId },
    });
    if (!method) throw new NotFoundException("Payment method not found");
    return this.toPaymentMethod(method);
  }

  async updatePaymentMethod(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      isActive: boolean;
      description?: string;
      processingFee: number;
    }>,
  ): Promise<PaymentMethod> {
    await this.getPaymentMethod(tenantId, id);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.provider = data.name;
    if (data.isActive !== undefined) updateData.isDefault = data.isActive;
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: updateData,
    });
    return this.toPaymentMethod(method);
  }

  async deletePaymentMethod(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getPaymentMethod(tenantId, id);
    await prisma.paymentMethod.delete({ where: { id } });
    return { success: true };
  }

  // ─────────────────────────────────────────────────
  // 3. TAX RATES & JURISDICTIONS
  // ─────────────────────────────────────────────────

  async createTaxRate(
    tenantId: string,
    data: {
      name: string;
      rate: number;
      type: "SALES" | "PURCHASE" | "WITHHOLDING" | "VAT" | "GST";
      jurisdiction?: string;
      isDefault?: boolean;
      isCompound?: boolean;
      description?: string;
    },
  ): Promise<TaxRate> {
    const isDefault = data.isDefault ?? false;
    if (isDefault) {
      await prisma.taxRate.updateMany({
        where: { tenantId, isSystem: true },
        data: { isSystem: false },
      });
    }
    const tax = await prisma.taxRate.create({
      data: {
        tenantId,
        name: data.name,
        rate: data.rate,
        isSystem: isDefault,
      },
    });
    return this.toTaxRate(tax);
  }

  async listTaxRates(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<TaxRate[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const rates = await prisma.taxRate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rates.map((t) => this.toTaxRate(t));
  }

  async getTaxRate(tenantId: string, id: string): Promise<TaxRate> {
    const tax = await prisma.taxRate.findFirst({
      where: { id, tenantId },
    });
    if (!tax) throw new NotFoundException("Tax rate not found");
    return this.toTaxRate(tax);
  }

  async updateTaxRate(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      rate: number;
      type: "SALES" | "PURCHASE" | "WITHHOLDING" | "VAT" | "GST";
      isDefault: boolean;
      isCompound: boolean;
      description?: string;
    }>,
  ): Promise<TaxRate> {
    await this.getTaxRate(tenantId, id);
    if (data.isDefault) {
      await prisma.taxRate.updateMany({
        where: { tenantId, isSystem: true, id: { not: id } },
        data: { isSystem: false },
      });
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.isDefault !== undefined) updateData.isSystem = data.isDefault;
    const tax = await prisma.taxRate.update({
      where: { id },
      data: updateData,
    });
    return this.toTaxRate(tax);
  }

  async deleteTaxRate(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getTaxRate(tenantId, id);
    await prisma.taxRate.delete({ where: { id } });
    return { success: true };
  }

  async getDefaultTaxRate(tenantId: string): Promise<TaxRate | null> {
    const tax = await prisma.taxRate.findFirst({
      where: { tenantId, isSystem: true },
    });
    return tax ? this.toTaxRate(tax) : null;
  }

  async setDefaultTaxRate(tenantId: string, id: string): Promise<TaxRate> {
    await this.getTaxRate(tenantId, id);
    await prisma.taxRate.updateMany({
      where: { tenantId, isSystem: true },
      data: { isSystem: false },
    });
    const tax = await prisma.taxRate.update({
      where: { id },
      data: { isSystem: true },
    });
    return this.toTaxRate(tax);
  }

  async computeTax(
    subtotal: number,
    taxRateId: string,
    tenantId: string,
  ): Promise<{ taxAmount: number; rate: number; type: string }> {
    const tax = await prisma.taxRate.findFirst({
      where: { id: taxRateId, tenantId },
    });
    if (!tax) throw new NotFoundException("Tax rate not found");
    const rate = Number(tax.rate);
    const taxAmount = subtotal * (rate / 100);
    return { taxAmount, rate, type: "SALES" };
  }

  async createTaxJurisdiction(
    tenantId: string,
    data: {
      name: string;
      code: string;
      country: string;
      state?: string;
      description?: string;
    },
  ): Promise<TaxJurisdiction> {
    const j = await prisma.taxJurisdiction.create({
      data: {
        tenantId,
        name: data.name,
        code: data.code,
        country: data.country,
        state: data.state,
        description: data.description,
        taxType: "VAT",
        rate: 0,
        effectiveFrom: new Date(),
      },
    });
    return this.toTaxJurisdiction(j);
  }

  async listTaxJurisdictions(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<TaxJurisdiction[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const list = await prisma.taxJurisdiction.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return list.map((j) => this.toTaxJurisdiction(j));
  }

  async getTaxJurisdiction(
    tenantId: string,
    id: string,
  ): Promise<TaxJurisdiction> {
    const j = await prisma.taxJurisdiction.findFirst({
      where: { id, tenantId },
    });
    if (!j) throw new NotFoundException("Tax jurisdiction not found");
    return this.toTaxJurisdiction(j);
  }

  async updateTaxJurisdiction(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      code: string;
      country: string;
      state?: string;
      description?: string;
    }>,
  ): Promise<TaxJurisdiction> {
    await this.getTaxJurisdiction(tenantId, id);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.description !== undefined)
      updateData.description = data.description;
    const j = await prisma.taxJurisdiction.update({
      where: { id },
      data: updateData,
    });
    return this.toTaxJurisdiction(j);
  }

  async deleteTaxJurisdiction(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getTaxJurisdiction(tenantId, id);
    await prisma.taxJurisdiction.delete({ where: { id } });
    return { success: true };
  }

  // ─────────────────────────────────────────────────
  // 4. CURRENCIES & EXCHANGE RATES
  // ─────────────────────────────────────────────────

  async createCurrency(
    tenantId: string,
    data: {
      code: string;
      name: string;
      symbol: string;
      isBase?: boolean;
      decimalPlaces?: number;
    },
  ): Promise<Currency> {
    if (data.isBase) {
      const existingBase = await prisma.currency.findFirst({
        where: { tenantId, isBase: true },
      });
      if (existingBase)
        throw new BadRequestException(
          "A base currency already exists for this tenant",
        );
    }
    const currency = await prisma.currency.create({
      data: {
        tenantId,
        code: data.code.toUpperCase(),
        name: data.name,
        symbol: data.symbol,
        isBase: data.isBase ?? false,
        decimalPlaces: data.decimalPlaces ?? 2,
      },
    });
    return this.toCurrency(currency);
  }

  async listCurrencies(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<Currency[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const list = await prisma.currency.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return list.map((c) => this.toCurrency(c));
  }

  async getCurrency(tenantId: string, id: string): Promise<Currency> {
    const currency = await prisma.currency.findFirst({
      where: { id, tenantId },
    });
    if (!currency) throw new NotFoundException("Currency not found");
    return this.toCurrency(currency);
  }

  async updateCurrency(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      symbol: string;
      isBase: boolean;
      decimalPlaces: number;
    }>,
  ): Promise<Currency> {
    const currency = await this.getCurrency(tenantId, id);
    if (data.isBase && !currency.isBase) {
      const existingBase = await prisma.currency.findFirst({
        where: { tenantId, isBase: true, id: { not: id } },
      });
      if (existingBase)
        throw new BadRequestException(
          "A base currency already exists for this tenant",
        );
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.isBase !== undefined) updateData.isBase = data.isBase;
    if (data.decimalPlaces !== undefined)
      updateData.decimalPlaces = data.decimalPlaces;
    const updated = await prisma.currency.update({
      where: { id },
      data: updateData,
    });
    return this.toCurrency(updated);
  }

  async deleteCurrency(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const currency = await this.getCurrency(tenantId, id);
    if (currency.isBase)
      throw new BadRequestException("Cannot delete the base currency");
    await prisma.currency.delete({ where: { id } });
    return { success: true };
  }

  async createExchangeRate(
    tenantId: string,
    data: {
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      validFrom: string;
      validTo?: string;
    },
  ): Promise<ExchangeRate> {
    const rate = await prisma.exchangeRate.create({
      data: {
        tenantId,
        fromCurrency: data.fromCurrency.toUpperCase(),
        toCurrency: data.toCurrency.toUpperCase(),
        rate: data.rate,
        date: new Date(data.validFrom),
      },
    });
    return this.toExchangeRate(rate);
  }

  async listExchangeRates(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<ExchangeRate[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { date: "desc" as const };
    const rates = await prisma.exchangeRate.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return rates.map((r) => this.toExchangeRate(r));
  }

  async updateExchangeRate(
    tenantId: string,
    id: string,
    data: Partial<{
      rate: number;
      validFrom: string;
      validTo?: string;
    }>,
  ): Promise<ExchangeRate> {
    const existing = await prisma.exchangeRate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Exchange rate not found");
    const updateData: Record<string, unknown> = {};
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.validFrom !== undefined)
      updateData.date = new Date(data.validFrom);
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data: updateData,
    });
    return this.toExchangeRate(rate);
  }

  async deleteExchangeRate(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const existing = await prisma.exchangeRate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException("Exchange rate not found");
    await prisma.exchangeRate.delete({ where: { id } });
    return { success: true };
  }

  async getLatestExchangeRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRate | null> {
    const rate = await prisma.exchangeRate.findFirst({
      where: { tenantId, fromCurrency, toCurrency },
      orderBy: { date: "desc" },
    });
    return rate ? this.toExchangeRate(rate) : null;
  }

  async syncRates(
    tenantId: string,
    rates: Array<{
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      validFrom: string;
      validTo?: string;
    }>,
  ): Promise<{ imported: number }> {
    let imported = 0;
    for (const r of rates) {
      await this.createExchangeRate(tenantId, r);
      imported++;
    }
    return { imported };
  }

  // ─────────────────────────────────────────────────
  // 5. BANK ACCOUNTS
  // ─────────────────────────────────────────────────

  async createBankAccount(
    tenantId: string,
    orgId: string,
    data: {
      accountName: string;
      bankName: string;
      accountNumber: string;
      accountType?: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "CASH";
      currency?: string;
      openingBalance?: number;
      isActive?: boolean;
      notes?: string;
    },
  ): Promise<BankAccount> {
    const account = await prisma.bankAccount.create({
      data: {
        tenantId,
        orgId,
        accountId: "",
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        currency: data.currency ?? "USD",
        status: (data.isActive ?? true) ? "ACTIVE" : "INACTIVE",
      },
    });
    return this.toBankAccount(account);
  }

  async listBankAccounts(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<BankAccount[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const accounts = await prisma.bankAccount.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return accounts.map((a) => this.toBankAccount(a));
  }

  async getBankAccount(tenantId: string, id: string): Promise<BankAccount> {
    const account = await prisma.bankAccount.findFirst({
      where: { id, tenantId },
    });
    if (!account) throw new NotFoundException("Bank account not found");
    return this.toBankAccount(account);
  }

  async updateBankAccount(
    tenantId: string,
    id: string,
    data: Partial<{
      accountName: string;
      bankName: string;
      accountType: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "CASH";
      isActive: boolean;
      notes?: string;
    }>,
  ): Promise<BankAccount> {
    await this.getBankAccount(tenantId, id);
    const updateData: Record<string, unknown> = {};
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.isActive !== undefined)
      updateData.status = data.isActive ? "ACTIVE" : "INACTIVE";
    const account = await prisma.bankAccount.update({
      where: { id },
      data: updateData,
    });
    return this.toBankAccount(account);
  }

  async deleteBankAccount(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getBankAccount(tenantId, id);
    await prisma.bankAccount.delete({ where: { id } });
    return { success: true };
  }

  async verifyBankAccount(tenantId: string, id: string): Promise<BankAccount> {
    return this.getBankAccount(tenantId, id);
  }

  async getBankAccountTransactions(
    tenantId: string,
    bankAccountId: string,
  ): Promise<BankTransaction[]> {
    await this.getBankAccount(tenantId, bankAccountId);
    const connection = await prisma.bankConnection.findFirst({
      where: { tenantId, bankAccountId },
    });
    if (!connection) return [];
    const transactions = await prisma.bankTransaction.findMany({
      where: { tenantId, connectionId: connection.id },
      orderBy: { date: "desc" },
    });
    return transactions.map((t) => this.toBankTransaction(t));
  }

  async addBankTransaction(
    tenantId: string,
    bankAccountId: string,
    data: {
      amount: number;
      type: "CREDIT" | "DEBIT";
      description: string;
      date?: string;
    },
  ): Promise<BankTransaction> {
    const account = await this.getBankAccount(tenantId, bankAccountId);
    let connection = await prisma.bankConnection.findFirst({
      where: { tenantId, bankAccountId },
    });
    if (!connection) {
      connection = await prisma.bankConnection.create({
        data: {
          tenantId,
          bankAccountId,
          orgId: account.orgId,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: "CHECKING",
          credentialsHash: "",
          status: "ACTIVE",
        },
      });
    }
    const signedAmount = data.type === "CREDIT" ? data.amount : -data.amount;
    const tx = await prisma.bankTransaction.create({
      data: {
        tenantId,
        connectionId: connection.id,
        date: data.date ? new Date(data.date) : new Date(),
        description: data.description,
        amount: signedAmount,
      },
    });
    return this.toBankTransaction(tx);
  }

  async reconcileBankTransaction(
    tenantId: string,
    transactionId: string,
  ): Promise<BankTransaction> {
    const existing = await prisma.bankTransaction.findFirst({
      where: { id: transactionId, tenantId },
    });
    if (!existing) throw new NotFoundException("Transaction not found");
    const tx = await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: { status: "MATCHED" },
    });
    return this.toBankTransaction(tx);
  }

  async getReconciliationHistory(
    tenantId: string,
    bankAccountId: string,
  ): Promise<BankTransaction[]> {
    await this.getBankAccount(tenantId, bankAccountId);
    const connection = await prisma.bankConnection.findFirst({
      where: { tenantId, bankAccountId },
    });
    if (!connection) return [];
    const transactions = await prisma.bankTransaction.findMany({
      where: { tenantId, connectionId: connection.id, status: "MATCHED" },
      orderBy: { date: "desc" },
    });
    return transactions.map((t) => this.toBankTransaction(t));
  }

  async bulkVerifyBankAccounts(
    tenantId: string,
    ids: string[],
  ): Promise<BankAccount[]> {
    const results: BankAccount[] = [];
    for (const id of ids) {
      const verified = await this.verifyBankAccount(tenantId, id);
      results.push(verified);
    }
    return results;
  }

  async getBankAccountStats(tenantId: string) {
    const accounts = await this.listBankAccounts(tenantId);
    const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const activeCount = accounts.filter((a) => a.isActive).length;
    const byCurrency: Record<string, number> = {};
    for (const a of accounts) {
      byCurrency[a.currency] = (byCurrency[a.currency] || 0) + a.currentBalance;
    }
    return {
      totalAccounts: accounts.length,
      activeAccounts: activeCount,
      totalBalance,
      byCurrency,
    };
  }

  // ─────────────────────────────────────────────────
  // 6. BUDGETS
  // ─────────────────────────────────────────────────

  async createBudget(
    tenantId: string,
    orgId: string,
    data: {
      name: string;
      fiscalYear: number;
      accountId: string;
      amount: number;
      periodAmounts?: Array<{ period: string; amount: number }>;
      notes?: string;
    },
  ): Promise<Budget> {
    const budget = await prisma.budget.create({
      data: {
        tenantId,
        orgId,
        accountId: data.accountId,
        amount: data.amount,
        startDate: new Date(`${data.fiscalYear}-01-01`),
        endDate: new Date(`${data.fiscalYear}-12-31`),
        periodAmounts: {
          create: (data.periodAmounts || []).map((pa) => ({
            tenantId,
            period: pa.period,
            amount: pa.amount,
          })),
        },
      },
      include: { periodAmounts: true },
    });
    return this.toBudget(budget);
  }

  async listBudgets(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<Budget[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const budgets = await prisma.budget.findMany({
      where: { tenantId },
      include: { periodAmounts: true },
      skip,
      take,
      orderBy,
    });
    return budgets.map((b) => this.toBudget(b));
  }

  async getBudget(tenantId: string, id: string): Promise<Budget> {
    const budget = await prisma.budget.findFirst({
      where: { id, tenantId },
      include: { periodAmounts: true },
    });
    if (!budget) throw new NotFoundException("Budget not found");
    return this.toBudget(budget);
  }

  async updateBudget(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      amount: number;
      notes?: string;
    }>,
  ): Promise<Budget> {
    await this.getBudget(tenantId, id);
    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: { periodAmounts: true },
    });
    return this.toBudget(budget);
  }

  async deleteBudget(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getBudget(tenantId, id);
    await prisma.budgetPeriodAmount.deleteMany({ where: { budgetId: id } });
    await prisma.budget.delete({ where: { id } });
    return { success: true };
  }

  async getBudgetVsActual(tenantId: string, fiscalYear: number) {
    const startDate = new Date(`${fiscalYear}-01-01`);
    const endDate = new Date(`${fiscalYear}-12-31`);
    const budgets = await prisma.budget.findMany({
      where: {
        tenantId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
    });
    const results: Array<{
      id: string;
      name: string;
      accountId: string;
      budgeted: number;
      spent: number;
      remaining: number;
      utilizationPct: number;
    }> = [];

    for (const b of budgets) {
      const spent = Number(
        (
          await prisma.journalEntry.aggregate({
            where: {
              tenantId,
              accountId: b.accountId,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { debit: true },
          })
        )._sum.debit || 0,
      );
      const amount = Number(b.amount);
      results.push({
        id: b.id,
        name: `Budget ${fiscalYear}`,
        accountId: b.accountId,
        budgeted: amount,
        spent,
        remaining: amount - spent,
        utilizationPct: amount > 0 ? Math.round((spent / amount) * 100) : 0,
      });
    }
    return results;
  }

  async copyBudget(
    tenantId: string,
    id: string,
    overrides?: { fiscalYear?: number; name?: string },
  ): Promise<Budget> {
    const source = await this.getBudget(tenantId, id);
    const target = await prisma.budget.create({
      data: {
        tenantId: source.tenantId,
        orgId: source.orgId,
        accountId: source.accountId,
        amount: source.amount,
        startDate: new Date(
          `${overrides?.fiscalYear ?? source.fiscalYear + 1}-01-01`,
        ),
        endDate: new Date(
          `${overrides?.fiscalYear ?? source.fiscalYear + 1}-12-31`,
        ),
        periodAmounts: {
          create: source.periodAmounts.map((pa) => ({
            tenantId: source.tenantId,
            period: pa.period,
            amount: pa.amount,
          })),
        },
      },
      include: { periodAmounts: true },
    });
    return this.toBudget(target);
  }

  async bulkCreateBudgets(
    tenantId: string,
    orgId: string,
    data: Array<{
      name: string;
      fiscalYear: number;
      accountId: string;
      amount: number;
      periodAmounts?: Array<{ period: string; amount: number }>;
      notes?: string;
    }>,
  ): Promise<Budget[]> {
    const created: Budget[] = [];
    for (const d of data) {
      created.push(await this.createBudget(tenantId, orgId, d));
    }
    return created;
  }

  async getPeriodSummary(tenantId: string, fiscalYear: number) {
    const startDate = new Date(`${fiscalYear}-01-01`);
    const endDate = new Date(`${fiscalYear}-12-31`);
    const budgets = await prisma.budget.findMany({
      where: {
        tenantId,
        startDate: { gte: startDate },
        endDate: { lte: endDate },
      },
      include: { periodAmounts: true },
    });
    const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent = 0;
    const periodMap: Record<string, { budgeted: number; spent: number }> = {};
    for (const b of budgets) {
      for (const pa of b.periodAmounts) {
        if (!periodMap[pa.period])
          periodMap[pa.period] = { budgeted: 0, spent: 0 };
        periodMap[pa.period]!.budgeted += Number(pa.amount);
      }
    }
    return {
      fiscalYear,
      totalBudgets: budgets.length,
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
      utilizationPct:
        totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
      periodSummary: periodMap,
    };
  }

  // ─────────────────────────────────────────────────
  // 7. VENDOR BILLS
  // ─────────────────────────────────────────────────

  async createVendorBill(
    tenantId: string,
    orgId: string,
    createdBy: string,
    data: {
      vendorId: string;
      billNumber: string;
      billDate: string;
      dueDate: string;
      purchaseOrderId?: string;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
      notes?: string;
    },
  ): Promise<VendorBill> {
    const duplicate = await prisma.vendorBill.findFirst({
      where: { tenantId, orgId, billNumber: data.billNumber },
    });
    if (duplicate)
      throw new BadRequestException(
        `Bill number ${data.billNumber} already exists`,
      );

    let subtotal = 0;
    let totalTax = 0;
    const lineItemsData = data.lineItems.map((li) => {
      const lineSubtotal = li.quantity * li.unitPrice;
      const lineTax = lineSubtotal * (li.taxRate / 100);
      subtotal += lineSubtotal;
      totalTax += lineTax;
      return {
        tenantId,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        subtotal: lineSubtotal,
        taxRate: li.taxRate,
        taxAmount: lineTax,
        totalAmount: lineSubtotal + lineTax,
      };
    });

    const bill = await prisma.vendorBill.create({
      data: {
        tenantId,
        orgId,
        vendorId: data.vendorId,
        billNumber: data.billNumber,
        billDate: new Date(data.billDate),
        dueDate: new Date(data.dueDate),
        purchaseOrderId: data.purchaseOrderId,
        subtotal,
        taxAmount: totalTax,
        totalAmount: subtotal + totalTax,
        notes: data.notes,
        createdBy,
      },
    });
    for (const li of lineItemsData) {
      await prisma.vendorBillLineItem.create({
        data: { ...li, vendorBillId: bill.id },
      });
    }
    return this.toVendorBillFull(bill);
  }

  async listVendorBills(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<VendorBill[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const bills = await prisma.vendorBill.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy,
    });
    return Promise.all(bills.map((b) => this.toVendorBillFull(b)));
  }

  async getVendorBill(tenantId: string, id: string): Promise<VendorBill> {
    const bill = await prisma.vendorBill.findFirst({
      where: { id, tenantId },
    });
    if (!bill) throw new NotFoundException("Vendor bill not found");
    return this.toVendorBillFull(bill);
  }

  async updateVendorBill(
    tenantId: string,
    id: string,
    data: Partial<{
      dueDate: string;
      notes?: string;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }>;
    }>,
  ): Promise<VendorBill> {
    const bill = await this.getVendorBill(tenantId, id);
    if (bill.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT bills can be edited");

    const updateData: Record<string, unknown> = {};
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.lineItems) {
      let subtotal = 0;
      let totalTax = 0;
      const lineItemsData = data.lineItems.map((li) => {
        const lineSubtotal = li.quantity * li.unitPrice;
        const lineTax = lineSubtotal * (li.taxRate / 100);
        subtotal += lineSubtotal;
        totalTax += lineTax;
        return {
          tenantId,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          subtotal: lineSubtotal,
          taxRate: li.taxRate,
          taxAmount: lineTax,
          totalAmount: lineSubtotal + lineTax,
        };
      });
      updateData.subtotal = subtotal;
      updateData.taxAmount = totalTax;
      updateData.totalAmount = subtotal + totalTax;

      await prisma.vendorBillLineItem.deleteMany({
        where: { vendorBillId: id },
      });
      for (const liData of lineItemsData) {
        await prisma.vendorBillLineItem.create({
          data: { ...liData, vendorBillId: id },
        });
      }
    }

    const updated = await prisma.vendorBill.update({
      where: { id },
      data: updateData,
    });
    return this.toVendorBillFull(updated);
  }

  async deleteVendorBill(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    const bill = await this.getVendorBill(tenantId, id);
    if (bill.status !== "DRAFT")
      throw new BadRequestException("Cannot delete a non-DRAFT bill");
    await prisma.vendorBillLineItem.deleteMany({ where: { vendorBillId: id } });
    await prisma.vendorBill.delete({ where: { id } });
    return { success: true };
  }

  async approveVendorBill(tenantId: string, id: string): Promise<VendorBill> {
    const bill = await this.getVendorBill(tenantId, id);
    if (bill.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT bills can be approved");
    const updated = await prisma.vendorBill.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    if (this.eventEmitter) {
      this.eventEmitter.emit("finance.vendor-bill.approved", {
        tenantId,
        billId: id,
        vendorId: bill.vendorId,
        totalAmount: bill.totalAmount,
      });
    }
    return this.toVendorBillFull(updated);
  }

  async payVendorBill(
    tenantId: string,
    id: string,
    paymentData: {
      amount: number;
      method: string;
      reference?: string;
      createdBy: string;
    },
  ): Promise<VendorBill> {
    const bill = await this.getVendorBill(tenantId, id);
    if (bill.status === "PAID" || bill.status === "VOID") {
      throw new BadRequestException(
        "Cannot pay a bill that is already paid or voided",
      );
    }
    const newPaid = bill.paidAmount + paymentData.amount;
    if (newPaid > bill.totalAmount)
      throw new BadRequestException("Payment amount exceeds bill total");
    const isFullyPaid = newPaid >= bill.totalAmount;

    await prisma.paymentTransaction.create({
      data: {
        tenantId,
        amount: paymentData.amount,
        provider: "MANUAL",
        type: "ONE_TIME",
        status: "SUCCEEDED",
        description: `Vendor bill ${bill.billNumber} - ${paymentData.method}`,
        metadata: {
          billId: id,
          method: paymentData.method,
          reference: paymentData.reference,
          createdBy: paymentData.createdBy,
        },
      },
    });

    const updated = await prisma.vendorBill.update({
      where: { id },
      data: {
        status: isFullyPaid ? "PAID" : undefined,
      },
    });
    return this.toVendorBillFull(updated);
  }

  async voidVendorBill(tenantId: string, id: string): Promise<VendorBill> {
    const bill = await this.getVendorBill(tenantId, id);
    if (bill.status === "PAID" || bill.status === "VOID") {
      throw new BadRequestException(
        "Cannot void a paid or already voided bill",
      );
    }
    const updated = await prisma.vendorBill.update({
      where: { id },
      data: { status: "VOID" },
    });
    return this.toVendorBillFull(updated);
  }

  async getVendorBillPaymentHistory(
    tenantId: string,
    billId: string,
  ): Promise<VendorBillPayment[]> {
    await this.getVendorBill(tenantId, billId);
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        tenantId,
        type: "ONE_TIME",
        metadata: { path: ["billId"], equals: billId },
      } as any,
      orderBy: { createdAt: "desc" },
    });
    return payments.map((p) => this.toVendorBillPayment(p));
  }

  async bulkApproveVendorBills(
    tenantId: string,
    ids: string[],
  ): Promise<VendorBill[]> {
    const results: VendorBill[] = [];
    for (const id of ids) {
      results.push(await this.approveVendorBill(tenantId, id));
    }
    return results;
  }

  async bulkPayVendorBills(
    tenantId: string,
    payments: Array<{
      billId: string;
      amount: number;
      method: string;
      reference?: string;
      createdBy: string;
    }>,
  ): Promise<VendorBill[]> {
    const results: VendorBill[] = [];
    for (const p of payments) {
      results.push(await this.payVendorBill(tenantId, p.billId, p));
    }
    return results;
  }

  async getPendingApprovalVendorBills(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<VendorBill[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const bills = await prisma.vendorBill.findMany({
      where: { tenantId, status: "DRAFT" },
      skip,
      take,
      orderBy,
    });
    return Promise.all(bills.map((b) => this.toVendorBillFull(b)));
  }

  async getVendorBillAging(
    tenantId: string,
  ): Promise<Array<{ bucket: string; total: number; count: number }>> {
    const bills = await prisma.vendorBill.findMany({
      where: { tenantId, status: { notIn: ["PAID", "VOID"] } },
    });
    const now = new Date();
    const bkts: Record<string, { total: number; count: number }> = {
      current: { total: 0, count: 0 },
      days30: { total: 0, count: 0 },
      days60: { total: 0, count: 0 },
      days90: { total: 0, count: 0 },
      over90: { total: 0, count: 0 },
    };

    for (const bill of bills) {
      const dueDate = new Date(bill.dueDate);
      const overdueDays = Math.floor(
        (now.getTime() - dueDate.getTime()) / 86400000,
      );
      const outstanding = Number(bill.totalAmount) - 0;
      const bucket =
        overdueDays <= 0
          ? "current"
          : overdueDays <= 30
            ? "days30"
            : overdueDays <= 60
              ? "days60"
              : overdueDays <= 90
                ? "days90"
                : "over90";
      bkts[bucket]!.total += outstanding;
      bkts[bucket]!.count += 1;
    }

    return Object.entries(bkts).map(([bkt, data]) => ({
      bucket: bkt,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));
  }

  // ─────────────────────────────────────────────────
  // 8. FINANCIAL REPORTS
  // ─────────────────────────────────────────────────

  async getProfitLoss(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [revenueAccounts, expenseAccounts, revenueEntries, expenseEntries] =
      await Promise.all([
        prisma.account.findMany({
          where: { tenantId, type: "REVENUE", isActive: true },
        }),
        prisma.account.findMany({
          where: { tenantId, type: "EXPENSE", isActive: true },
        }),
        prisma.journalEntry.findMany({
          where: {
            tenantId,
            createdAt: { gte: start, lte: end },
            account: { type: "REVENUE" },
          },
        }),
        prisma.journalEntry.findMany({
          where: {
            tenantId,
            createdAt: { gte: start, lte: end },
            account: { type: "EXPENSE" },
          },
        }),
      ]);

    const totalRevenue = revenueEntries.reduce(
      (sum, e) => sum + Number(e.credit) - Number(e.debit),
      0,
    );
    const totalExpenses = expenseEntries.reduce(
      (sum, e) => sum + Number(e.debit) - Number(e.credit),
      0,
    );

    return {
      period: { startDate, endDate },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
      revenueByAccount: revenueAccounts.map((a) => {
        const total = revenueEntries
          .filter((e) => e.accountId === a.id)
          .reduce((s, e) => s + Number(e.credit) - Number(e.debit), 0);
        return {
          accountId: a.id,
          accountName: a.name,
          accountCode: a.code,
          total: Math.round(total * 100) / 100,
        };
      }),
      expenseByAccount: expenseAccounts.map((a) => {
        const total = expenseEntries
          .filter((e) => e.accountId === a.id)
          .reduce((s, e) => s + Number(e.debit) - Number(e.credit), 0);
        return {
          accountId: a.id,
          accountName: a.name,
          accountCode: a.code,
          total: Math.round(total * 100) / 100,
        };
      }),
    };
  }

  async getBalanceSheet(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);

    const assetAccounts = await prisma.account.findMany({
      where: { tenantId, type: "ASSET", isActive: true },
    });
    const liabilityAccounts = await prisma.account.findMany({
      where: { tenantId, type: "LIABILITY", isActive: true },
    });
    const equityAccounts = await prisma.account.findMany({
      where: { tenantId, type: "EQUITY", isActive: true },
    });
    const [assetEntries, liabilityEntries, equityEntries] = await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          tenantId,
          createdAt: { lte: asOf },
          account: { type: "ASSET" },
        },
      }),
      prisma.journalEntry.findMany({
        where: {
          tenantId,
          createdAt: { lte: asOf },
          account: { type: "LIABILITY" },
        },
      }),
      prisma.journalEntry.findMany({
        where: {
          tenantId,
          createdAt: { lte: asOf },
          account: { type: "EQUITY" },
        },
      }),
    ]);

    const computeBalance = (entries: typeof assetEntries) =>
      entries.reduce((sum, e) => sum + Number(e.debit) - Number(e.credit), 0);

    const totalAssets = Math.round(computeBalance(assetEntries) * 100) / 100;
    const totalLiabilities =
      Math.round(computeBalance(liabilityEntries) * 100) / 100;
    const totalEquity = Math.round(computeBalance(equityEntries) * 100) / 100;

    return {
      asOfDate,
      assets: {
        total: totalAssets,
        accounts: assetAccounts.map((a) => ({
          accountId: a.id,
          name: a.name,
          code: a.code,
          balance:
            Math.round(
              assetEntries
                .filter((e) => e.accountId === a.id)
                .reduce(
                  (sum, e) => sum + Number(e.debit) - Number(e.credit),
                  0,
                ) * 100,
            ) / 100,
        })),
      },
      liabilities: {
        total: totalLiabilities,
        accounts: liabilityAccounts.map((a) => ({
          accountId: a.id,
          name: a.name,
          code: a.code,
          balance:
            Math.round(
              liabilityEntries
                .filter((e) => e.accountId === a.id)
                .reduce(
                  (sum, e) => sum + Number(e.debit) - Number(e.credit),
                  0,
                ) * 100,
            ) / 100,
        })),
      },
      equity: {
        total: totalEquity,
        accounts: equityAccounts.map((a) => ({
          accountId: a.id,
          name: a.name,
          code: a.code,
          balance:
            Math.round(
              equityEntries
                .filter((e) => e.accountId === a.id)
                .reduce(
                  (sum, e) => sum + Number(e.debit) - Number(e.credit),
                  0,
                ) * 100,
            ) / 100,
        })),
      },
      totalLiabilitiesAndEquity:
        Math.round((totalLiabilities + totalEquity) * 100) / 100,
    };
  }

  async getCashFlow(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const payments = await prisma.payment.findMany({
      where: { tenantId, paidAt: { gte: start, lte: end } },
    });
    const journalEntries = await prisma.journalEntry.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: { account: true },
    });

    const operatingInflow = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const operatingOutflow = journalEntries
      .filter((e) => e.account?.type === "EXPENSE")
      .reduce((sum, e) => sum + Number(e.debit), 0);

    const investingEntries = journalEntries.filter(
      (e) => e.account?.type === "ASSET",
    );
    const investingInflow = investingEntries.reduce(
      (sum, e) => sum + Number(e.credit),
      0,
    );
    const investingOutflow = investingEntries.reduce(
      (sum, e) => sum + Number(e.debit),
      0,
    );

    const financingEntries = journalEntries.filter(
      (e) => e.account?.type === "LIABILITY" || e.account?.type === "EQUITY",
    );
    const financingInflow = financingEntries.reduce(
      (sum, e) => sum + Number(e.credit),
      0,
    );
    const financingOutflow = financingEntries.reduce(
      (sum, e) => sum + Number(e.debit),
      0,
    );

    return {
      period: { startDate, endDate },
      operating: {
        inflows: Math.round(operatingInflow * 100) / 100,
        outflows: Math.round(operatingOutflow * 100) / 100,
        net: Math.round((operatingInflow - operatingOutflow) * 100) / 100,
      },
      investing: {
        inflows: Math.round(investingInflow * 100) / 100,
        outflows: Math.round(investingOutflow * 100) / 100,
        net: Math.round((investingInflow - investingOutflow) * 100) / 100,
      },
      financing: {
        inflows: Math.round(financingInflow * 100) / 100,
        outflows: Math.round(financingOutflow * 100) / 100,
        net: Math.round((financingInflow - financingOutflow) * 100) / 100,
      },
      netCashFlow:
        Math.round(
          (operatingInflow -
            operatingOutflow +
            (investingInflow - investingOutflow) +
            (financingInflow - financingOutflow)) *
            100,
        ) / 100,
    };
  }

  async getTrialBalance(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);
    const accounts = await prisma.account.findMany({
      where: { tenantId, isActive: true },
    });
    const entries = await prisma.journalEntry.findMany({
      where: { tenantId, createdAt: { lte: asOf } },
    });

    const balances = accounts.map((a) => {
      const accountEntries = entries.filter((e) => e.accountId === a.id);
      const totalDebit = accountEntries.reduce(
        (s, e) => s + Number(e.debit),
        0,
      );
      const totalCredit = accountEntries.reduce(
        (s, e) => s + Number(e.credit),
        0,
      );
      const balance = totalDebit - totalCredit;
      return {
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        accountType: a.type,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      };
    });

    const totalDebits = balances.reduce((s, b) => s + b.totalDebit, 0);
    const totalCredits = balances.reduce((s, b) => s + b.totalCredit, 0);

    return {
      asOfDate,
      accounts: balances,
      totals: {
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        difference: Math.round((totalDebits - totalCredits) * 100) / 100,
      },
    };
  }

  async getArAging(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ["SENT", "OVERDUE", "PARTIALLY_PAID"] },
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    const buckets: Record<
      string,
      {
        total: number;
        invoices: Array<{
          id: string;
          number: string;
          customer: string;
          amount: number;
          daysOverdue: number;
        }>;
      }
    > = {
      current: { total: 0, invoices: [] },
      days30: { total: 0, invoices: [] },
      days60: { total: 0, invoices: [] },
      days90: { total: 0, invoices: [] },
      over90: { total: 0, invoices: [] },
    };

    for (const inv of invoices) {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.max(
        0,
        Math.floor((asOf.getTime() - dueDate.getTime()) / 86400000),
      );
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding <= 0) continue;

      const bucket =
        daysOverdue === 0
          ? "current"
          : daysOverdue <= 30
            ? "days30"
            : daysOverdue <= 60
              ? "days60"
              : daysOverdue <= 90
                ? "days90"
                : "over90";

      buckets[bucket]!.total += outstanding;
      buckets[bucket]!.invoices.push({
        id: inv.id,
        number: inv.invoiceNumber,
        customer: (inv.customer as any)?.name || "Unknown",
        amount: Math.round(outstanding * 100) / 100,
        daysOverdue,
      });
    }

    return Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      total: Math.round(data.total * 100) / 100,
      count: data.invoices.length,
      invoices: data.invoices,
    }));
  }

  async getApAging(tenantId: string, asOfDate: string) {
    const asOf = new Date(asOfDate);
    const bills = await prisma.vendorBill.findMany({
      where: { tenantId, status: { notIn: ["PAID", "VOID"] } },
    });

    const buckets: Record<string, { total: number; count: number }> = {
      current: { total: 0, count: 0 },
      days30: { total: 0, count: 0 },
      days60: { total: 0, count: 0 },
      days90: { total: 0, count: 0 },
      over90: { total: 0, count: 0 },
    };

    for (const bill of bills) {
      const dueDate = new Date(bill.dueDate);
      const daysOverdue = Math.max(
        0,
        Math.floor((asOf.getTime() - dueDate.getTime()) / 86400000),
      );
      const outstanding = Number(bill.totalAmount) - 0;
      if (outstanding <= 0) continue;

      const bucket =
        daysOverdue === 0
          ? "current"
          : daysOverdue <= 30
            ? "days30"
            : daysOverdue <= 60
              ? "days60"
              : daysOverdue <= 90
                ? "days90"
                : "over90";

      buckets[bucket]!.total += outstanding;
      buckets[bucket]!.count += 1;
    }

    return Object.entries(buckets).map(([bucket, data]) => ({
      bucket,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));
  }

  async getGeneralLedger(tenantId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const entries = await prisma.journalEntry.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        journal: {
          select: { id: true, entryNumber: true, date: true, notes: true },
        },
      },
      orderBy: [{ journalId: "asc" }, { createdAt: "asc" }],
    });

    return entries.map((e) => ({
      id: e.id,
      entryNumber: e.journal?.entryNumber || "",
      date: e.journal?.date.toISOString() || e.createdAt.toISOString(),
      accountId: e.accountId,
      accountCode: e.account?.code || "",
      accountName: e.account?.name || "",
      accountType: e.account?.type || "",
      debit: Number(e.debit),
      credit: Number(e.credit),
      description: e.description || e.journal?.notes || "",
    }));
  }

  async getTaxSummary(tenantId: string, fiscalYear: number) {
    const start = new Date(`${fiscalYear}-01-01`);
    const end = new Date(`${fiscalYear}-12-31`);

    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, issueDate: { gte: start, lte: end } },
    });

    const totalTaxCollected = invoices.reduce(
      (sum, inv) => sum + Number(inv.taxAmount),
      0,
    );
    const byStatus: Record<string, number> = {};
    for (const inv of invoices) {
      byStatus[inv.status] =
        (byStatus[inv.status] || 0) + Number(inv.taxAmount);
    }

    return {
      fiscalYear,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      totalInvoices: invoices.length,
      byStatus,
    };
  }

  async getRevenueByCustomer(
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const invoices = await prisma.invoice.findMany({
      where: { tenantId, deletedAt: null, issueDate: { gte: start, lte: end } },
      include: { customer: { select: { id: true, name: true } } },
    });

    const byCustomer: Record<
      string,
      {
        customerId: string;
        customerName: string;
        revenue: number;
        invoiceCount: number;
        paidAmount: number;
      }
    > = {};

    for (const inv of invoices) {
      const custId = inv.customerId;
      if (!byCustomer[custId]) {
        byCustomer[custId] = {
          customerId: custId,
          customerName: (inv.customer as any)?.name || "Unknown",
          revenue: 0,
          invoiceCount: 0,
          paidAmount: 0,
        };
      }
      byCustomer[custId].revenue += Number(inv.totalAmount);
      byCustomer[custId].paidAmount += Number(inv.paidAmount);
      byCustomer[custId].invoiceCount += 1;
    }

    return Object.values(byCustomer)
      .map((c) => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
        paidAmount: Math.round(c.paidAmount * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getExpenseByCategory(
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const entries = await prisma.journalEntry.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
      },
    });

    const expenseEntries = entries.filter((e) => e.account?.type === "EXPENSE");
    const byCategory: Record<
      string,
      {
        accountId: string;
        accountCode: string;
        accountName: string;
        total: number;
        count: number;
      }
    > = {};

    for (const e of expenseEntries) {
      const accId = e.accountId;
      if (!byCategory[accId]) {
        byCategory[accId] = {
          accountId: accId,
          accountCode: e.account?.code || "",
          accountName: e.account?.name || "",
          total: 0,
          count: 0,
        };
      }
      byCategory[accId].total += Number(e.debit) - Number(e.credit);
      byCategory[accId].count += 1;
    }

    return Object.values(byCategory)
      .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }

  async getBudgetVsActualReport(tenantId: string, fiscalYear: number) {
    return this.getBudgetVsActual(tenantId, fiscalYear);
  }

  // ── Saved Reports ──

  async saveReportConfig(
    tenantId: string,
    createdBy: string,
    data: {
      name: string;
      type: string;
      config: Record<string, unknown>;
    },
  ): Promise<SavedReportConfig> {
    const report = await prisma.savedReport.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        filters: (data.config as any)?.filters || {},
        columns: (data.config as any)?.columns || [],
        createdBy,
      },
    });
    return this.toSavedReportConfig(report);
  }

  async listSavedReportConfigs(
    tenantId: string,
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<SavedReportConfig[]> {
    const skip = (page - 1) * limit;
    const take = limit;
    const orderBy = sortBy
      ? { [sortBy]: sortOrder ?? "asc" }
      : { createdAt: "desc" as const };
    const reports = await prisma.savedReport.findMany({
      where: { tenantId, deletedAt: null },
      skip,
      take,
      orderBy,
    });
    return reports.map((r) => this.toSavedReportConfig(r));
  }

  async getSavedReportConfig(
    tenantId: string,
    id: string,
  ): Promise<SavedReportConfig> {
    const report = await prisma.savedReport.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!report) throw new NotFoundException("Saved report not found");
    return this.toSavedReportConfig(report);
  }

  async deleteSavedReportConfig(
    tenantId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getSavedReportConfig(tenantId, id);
    await prisma.savedReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
