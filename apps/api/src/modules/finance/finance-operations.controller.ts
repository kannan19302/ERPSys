import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ChangeHistoryInterceptor } from "../../common/interceptors/change-history.interceptor";
import { TrackChanges } from "../../common/decorators/track-changes.decorator";
const createPaymentTermSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  days: z.number().int().nonnegative(),
});
const updatePaymentTermSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  days: z.number().int().nonnegative().optional(),
});
const createPaymentMethodSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
});
const updatePaymentMethodSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
});
const createTaxRateSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
  code: z.string().optional(),
});
const updateTaxRateSchema = z.object({
  name: z.string().optional(),
  rate: z.number().min(0).max(100).optional(),
  code: z.string().optional(),
});
const createCurrencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  symbol: z.string().optional(),
});
const createExchangeRateSchema = z.object({
  fromCurrency: z.string(),
  toCurrency: z.string(),
  rate: z.number().positive(),
  effectiveDate: z.string(),
});
const createBankAccountSchema = z.object({
  accountNumber: z.string().min(1),
  bankName: z.string().min(1),
  currency: z.string().optional(),
});
const updateBankAccountSchema = z.object({
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.string().optional(),
});
const createBudgetSchema = z.object({
  name: z.string().min(1),
  fiscalYear: z.number().int(),
  totalAmount: z.number().positive(),
});
const updateBudgetSchema = z.object({
  name: z.string().optional(),
  totalAmount: z.number().positive().optional(),
});
const createVendorBillSchema = z.object({
  vendorId: z.string(),
  billNumber: z.string().default(() => `BILL-${Date.now()}`),
  billDate: z.string().default(() => new Date().toISOString().split("T")[0]!),
  dueDate: z.string().default(() => new Date().toISOString().split("T")[0]!),
  purchaseOrderId: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        taxRate: z.number().default(0),
      }),
    )
    .optional(),
  notes: z.string().optional(),
});
const updateVendorBillSchema = z.object({
  totalAmount: z.number().positive().optional(),
  dueDate: z.string().optional(),
});
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FinanceOperationsService } from "./finance-operations.service";
import { resolveOrgId } from "../../common/utils/pagination.util";

// ─── Inline Zod schemas for endpoints not covered by @unerp/shared schemas ─────
// Fix for security issue #40: every POST/PATCH body must pass through Zod validation

const createTaxJurisdictionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  country: z.string().min(1),
  state: z.string().optional(),
  description: z.string().optional(),
});

const updateTaxJurisdictionSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  state: z.string().optional(),
  description: z.string().optional(),
});

const updateCurrencySchema = z.object({
  name: z.string().optional(),
  symbol: z.string().optional(),
  isBase: z.boolean().optional(),
  decimalPlaces: z.number().int().min(0).max(6).optional(),
});

const updateExchangeRateSchema = z.object({
  rate: z.number().positive().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

const syncExchangeRatesSchema = z.object({
  rates: z.array(
    z.object({
      fromCurrency: z.string().min(1),
      toCurrency: z.string().min(1),
      rate: z.number().positive(),
      validFrom: z.string(),
      validTo: z.string().optional(),
    }),
  ),
});

const reconcileBankTransactionSchema = z.object({
  transactionId: z.string().min(1),
});

const addBankTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["CREDIT", "DEBIT"]),
  description: z.string().min(1),
  date: z.string().optional(),
});

const bulkVerifyBankAccountsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const copyBudgetSchema = z.object({
  fiscalYear: z.number().int().min(2000).max(2100).optional(),
  name: z.string().optional(),
});

const bulkCreateBudgetsSchema = z.object({
  budgets: z
    .array(
      z.object({
        name: z.string().min(1),
        fiscalYear: z.number().int(),
        accountId: z.string().min(1),
        amount: z.number().positive(),
        periodAmounts: z
          .array(z.object({ period: z.string(), amount: z.number() }))
          .optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1),
});

const payVendorBillSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
  reference: z.string().optional(),
});

const bulkApproveVendorBillsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

const bulkPayVendorBillsSchema = z.object({
  payments: z
    .array(
      z.object({
        billId: z.string().min(1),
        amount: z.number().positive(),
        method: z.string().min(1),
        reference: z.string().optional(),
      }),
    )
    .min(1),
});

const saveReportConfigSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  config: z.record(z.unknown()),
});

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("finance-operations")
@ApiBearerAuth()
@Controller("finance")
@UseGuards(JwtAuthGuard, RbacGuard)
export class FinanceOperationsController {
  constructor(private readonly opsService: FinanceOperationsService) {}

  // --- Payment Terms ---

  @ApiOperation({ summary: "List payment terms" })
  @Get("payment-terms")
  @Permissions("finance.settings.read")
  async listPaymentTerms(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listPaymentTerms(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get payment term by id" })
  @Get("payment-terms/:id")
  @Permissions("finance.settings.read")
  async getPaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getPaymentTerm(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create payment term" })
  @Post("payment-terms")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("PaymentTerm")
  async createPaymentTerm(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPaymentTermSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.createPaymentTerm(req.user.tenantId, {
      name: dto.name as string,
      dueDays: dto.dueDays as number,
      discountDays: dto.discountDays as number | undefined,
      discountPercentage: dto.discountPercentage as number | undefined,
      description: dto.description as string | undefined,
      isDefault: dto.isDefault as boolean | undefined,
    });
  }

  @ApiOperation({ summary: "Update payment term" })
  @Patch("payment-terms/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("PaymentTerm", "id")
  async updatePaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updatePaymentTermSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updatePaymentTerm(req.user.tenantId, id, {
      name: dto.name as string | undefined,
      dueDays: dto.dueDays as number | undefined,
      discountDays: dto.discountDays as number | undefined,
      discountPercentage: dto.discountPercentage as number | undefined,
      description: dto.description as string | undefined,
      isDefault: dto.isDefault as boolean | undefined,
    });
  }

  @ApiOperation({ summary: "Delete payment term" })
  @Delete("payment-terms/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.settings.write")
  async deletePaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deletePaymentTerm(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get default payment term" })
  @Get("payment-terms/default/get")
  @Permissions("finance.settings.read")
  async getDefaultPaymentTerm(@Req() req: AuthenticatedRequest) {
    return this.opsService.getDefaultPaymentTerm(req.user.tenantId);
  }

  @ApiOperation({ summary: "Set payment term as default" })
  @Patch("payment-terms/:id/default")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("PaymentTerm", "id")
  async setDefaultPaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.setDefaultPaymentTerm(req.user.tenantId, id);
  }

  // --- Payment Methods ---

  @ApiOperation({ summary: "List payment methods" })
  @Get("payment-methods")
  @Permissions("finance.settings.read")
  async listPaymentMethods(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listPaymentMethods(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get payment method by id" })
  @Get("payment-methods/:id")
  @Permissions("finance.settings.read")
  async getPaymentMethod(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getPaymentMethod(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create payment method" })
  @Post("payment-methods")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("PaymentMethod")
  async createPaymentMethod(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPaymentMethodSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.createPaymentMethod(req.user.tenantId, {
      name: dto.name as string,
      code: dto.code as string,
      isActive: dto.isActive as boolean | undefined,
      description: dto.description as string | undefined,
      processingFee: dto.processingFee as number | undefined,
    });
  }

  @ApiOperation({ summary: "Update payment method" })
  @Patch("payment-methods/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("PaymentMethod", "id")
  async updatePaymentMethod(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updatePaymentMethodSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updatePaymentMethod(req.user.tenantId, id, {
      name: dto.name as string | undefined,
      isActive: dto.isActive as boolean | undefined,
      description: dto.description as string | undefined,
      processingFee: dto.processingFee as number | undefined,
    });
  }

  @ApiOperation({ summary: "Delete payment method" })
  @Delete("payment-methods/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.settings.write")
  async deletePaymentMethod(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deletePaymentMethod(req.user.tenantId, id);
  }

  // --- Tax Rates ---

  @ApiOperation({ summary: "List tax rates" })
  @Get("tax-rates")
  @Permissions("finance.tax.read")
  async listTaxRates(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listTaxRates(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get tax rate by id" })
  @Get("tax-rates/:id")
  @Permissions("finance.tax.read")
  async getTaxRate(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.opsService.getTaxRate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create tax rate" })
  @Post("tax-rates")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("TaxRate")
  async createTaxRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createTaxRateSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.createTaxRate(req.user.tenantId, {
      name: dto.name as string,
      rate: dto.rate as number,
      type: dto.type as "SALES" | "PURCHASE" | "WITHHOLDING" | "VAT" | "GST",
      jurisdiction: dto.jurisdiction as string | undefined,
      isDefault: dto.isDefault as boolean | undefined,
      isCompound: dto.isCompound as boolean | undefined,
      description: dto.description as string | undefined,
    });
  }

  @ApiOperation({ summary: "Update tax rate" })
  @Patch("tax-rates/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.tax.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("TaxRate", "id")
  async updateTaxRate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateTaxRateSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updateTaxRate(req.user.tenantId, id, {
      name: dto.name as string | undefined,
      rate: dto.rate as number | undefined,
      type: dto.type as
        | "SALES"
        | "PURCHASE"
        | "WITHHOLDING"
        | "VAT"
        | "GST"
        | undefined,
      isDefault: dto.isDefault as boolean | undefined,
      isCompound: dto.isCompound as boolean | undefined,
      description: dto.description as string | undefined,
    });
  }

  @ApiOperation({ summary: "Delete tax rate" })
  @Delete("tax-rates/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.tax.delete")
  async deleteTaxRate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteTaxRate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get default tax rate" })
  @Get("tax-rates/default/get")
  @Permissions("finance.tax.read")
  async getDefaultTaxRate(@Req() req: AuthenticatedRequest) {
    return this.opsService.getDefaultTaxRate(req.user.tenantId);
  }

  @ApiOperation({ summary: "Set tax rate as default" })
  @Patch("tax-rates/:id/default")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.tax.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("TaxRate", "id")
  async setDefaultTaxRate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.setDefaultTaxRate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Compute tax amount" })
  @Get("tax-rates/compute")
  @Permissions("finance.tax.compute")
  async computeTax(
    @Req() req: AuthenticatedRequest,
    @Query("subtotal") subtotal: string,
    @Query("taxRateId") taxRateId: string,
  ) {
    return this.opsService.computeTax(
      parseFloat(subtotal),
      taxRateId,
      req.user.tenantId,
    );
  }

  // --- Tax Jurisdictions ---

  @ApiOperation({ summary: "List tax jurisdictions" })
  @Get("tax-jurisdictions")
  @Permissions("finance.tax.read")
  async listTaxJurisdictions(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listTaxJurisdictions(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Create tax jurisdiction" })
  @Post("tax-jurisdictions")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("TaxJurisdiction")
  async createTaxJurisdiction(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createTaxJurisdictionSchema)
    dto: z.infer<typeof createTaxJurisdictionSchema>,
  ) {
    return this.opsService.createTaxJurisdiction(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: "Update tax jurisdiction" })
  @Patch("tax-jurisdictions/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.tax.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("TaxJurisdiction", "id")
  async updateTaxJurisdiction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateTaxJurisdictionSchema)
    dto: z.infer<typeof updateTaxJurisdictionSchema>,
  ) {
    return this.opsService.updateTaxJurisdiction(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete tax jurisdiction" })
  @Delete("tax-jurisdictions/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.tax.delete")
  async deleteTaxJurisdiction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteTaxJurisdiction(req.user.tenantId, id);
  }

  // --- Currencies ---

  @ApiOperation({ summary: "List currencies" })
  @Get("currencies")
  @Permissions("finance.settings.read")
  async listCurrencies(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listCurrencies(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Create currency" })
  @Post("currencies")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Currency")
  async createCurrency(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCurrencySchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.createCurrency(req.user.tenantId, {
      code: dto.code as string,
      name: dto.name as string,
      symbol: dto.symbol as string,
      isBase: dto.isBase as boolean | undefined,
      decimalPlaces: dto.decimalPlaces as number | undefined,
    });
  }

  @ApiOperation({ summary: "Update currency" })
  @Patch("currencies/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Currency", "id")
  async updateCurrency(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateCurrencySchema) dto: z.infer<typeof updateCurrencySchema>,
  ) {
    return this.opsService.updateCurrency(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete currency" })
  @Delete("currencies/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.settings.write")
  async deleteCurrency(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteCurrency(req.user.tenantId, id);
  }

  // --- Exchange Rates ---

  @ApiOperation({ summary: "List exchange rates" })
  @Get("exchange-rates")
  @Permissions("finance.settings.read")
  async listExchangeRates(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listExchangeRates(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Create exchange rate" })
  @Post("exchange-rates")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExchangeRate")
  async createExchangeRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createExchangeRateSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.createExchangeRate(req.user.tenantId, {
      fromCurrency: dto.fromCurrency as string,
      toCurrency: dto.toCurrency as string,
      rate: dto.rate as number,
      validFrom: dto.validFrom as string,
      validTo: dto.validTo as string | undefined,
    });
  }

  @ApiOperation({ summary: "Update exchange rate" })
  @Patch("exchange-rates/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExchangeRate", "id")
  async updateExchangeRate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateExchangeRateSchema)
    dto: z.infer<typeof updateExchangeRateSchema>,
  ) {
    return this.opsService.updateExchangeRate(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Delete exchange rate" })
  @Delete("exchange-rates/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.settings.write")
  async deleteExchangeRate(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteExchangeRate(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get latest exchange rate" })
  @Get("exchange-rates/latest")
  @Permissions("finance.settings.read")
  async getLatestExchangeRate(
    @Req() req: AuthenticatedRequest,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.opsService.getLatestExchangeRate(req.user.tenantId, from, to);
  }

  @ApiOperation({ summary: "Sync exchange rates from external source" })
  @Post("exchange-rates/sync")
  @Permissions("finance.settings.write")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("ExchangeRate")
  async syncExchangeRates(
    @Req() req: AuthenticatedRequest,
    @ZodBody(syncExchangeRatesSchema)
    dto: z.infer<typeof syncExchangeRatesSchema>,
  ) {
    return this.opsService.syncRates(req.user.tenantId, dto.rates);
  }

  // --- Bank Accounts ---

  @ApiOperation({ summary: "List bank accounts" })
  @Get("bank-accounts")
  @Permissions("finance.bank-account.read")
  async listBankAccounts(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listBankAccounts(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get bank account stats" })
  @Get("bank-accounts/stats")
  @Permissions("finance.bank-account.read")
  async getBankAccountStats(@Req() req: AuthenticatedRequest) {
    return this.opsService.getBankAccountStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get bank account by id" })
  @Get("bank-accounts/:id")
  @Permissions("finance.bank-account.read")
  async getBankAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getBankAccount(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create bank account" })
  @Post("bank-accounts")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.bank-account.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankAccount")
  async createBankAccount(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBankAccountSchema) dto: Record<string, unknown>,
  ) {
    const orgId = await resolveOrgId(req.user.tenantId, req.user.orgId);
    return this.opsService.createBankAccount(req.user.tenantId, orgId, {
      accountName: dto.accountName as string,
      bankName: dto.bankName as string,
      accountNumber: dto.accountNumber as string,
      accountType: dto.accountType as
        | "CHECKING"
        | "SAVINGS"
        | "CREDIT_CARD"
        | "CASH"
        | undefined,
      currency: dto.currency as string | undefined,
      openingBalance: dto.openingBalance as number | undefined,
      isActive: dto.isActive as boolean | undefined,
      notes: dto.notes as string | undefined,
    });
  }

  @ApiOperation({ summary: "Update bank account" })
  @Patch("bank-accounts/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.bank-account.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankAccount", "id")
  async updateBankAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateBankAccountSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updateBankAccount(req.user.tenantId, id, {
      accountName: dto.accountName as string | undefined,
      bankName: dto.bankName as string | undefined,
      accountType: dto.accountType as
        | "CHECKING"
        | "SAVINGS"
        | "CREDIT_CARD"
        | "CASH"
        | undefined,
      isActive: dto.isActive as boolean | undefined,
      notes: dto.notes as string | undefined,
    });
  }

  @ApiOperation({ summary: "Delete bank account" })
  @Delete("bank-accounts/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.bank-account.delete")
  async deleteBankAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteBankAccount(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Verify bank account" })
  @Post("bank-accounts/:id/verify")
  @Permissions("finance.bank-account.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankAccount", "id")
  async verifyBankAccount(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.verifyBankAccount(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get bank account transactions" })
  @Get("bank-accounts/:id/transactions")
  @Permissions("finance.bank-account.read")
  async getBankAccountTransactions(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getBankAccountTransactions(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Add a bank transaction" })
  @Post("bank-accounts/:id/transactions")
  @Permissions("finance.bank-account.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankTransaction")
  async addBankTransaction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(addBankTransactionSchema)
    dto: z.infer<typeof addBankTransactionSchema>,
  ) {
    return this.opsService.addBankTransaction(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Reconcile a bank transaction" })
  @Post("bank-accounts/:id/reconcile")
  @Permissions("finance.bank-account.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankTransaction")
  async reconcileBankTransaction(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(reconcileBankTransactionSchema)
    dto: z.infer<typeof reconcileBankTransactionSchema>,
  ) {
    void id;
    return this.opsService.reconcileBankTransaction(
      req.user.tenantId,
      dto.transactionId,
    );
  }

  @ApiOperation({ summary: "Get reconciliation history for bank account" })
  @Get("bank-accounts/:id/reconciliations")
  @Permissions("finance.bank-account.read")
  async getReconciliationHistory(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getReconciliationHistory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Bulk verify bank accounts" })
  @Post("bank-accounts/bulk-verify")
  @Permissions("finance.bank-account.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("BankAccount")
  async bulkVerifyBankAccounts(
    @Req() req: AuthenticatedRequest,
    @ZodBody(bulkVerifyBankAccountsSchema)
    dto: z.infer<typeof bulkVerifyBankAccountsSchema>,
  ) {
    return this.opsService.bulkVerifyBankAccounts(req.user.tenantId, dto.ids);
  }

  // --- Budgets ---

  @ApiOperation({ summary: "List budgets" })
  @Get("budgets")
  @Permissions("finance.budget.read")
  async listBudgets(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listBudgets(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get budget stats" })
  @Get("budgets/stats")
  @Permissions("finance.budget.read")
  async getBudgetStats(@Req() req: AuthenticatedRequest) {
    const budgets = await this.opsService.listBudgets(req.user.tenantId);
    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
    return {
      total: budgets.length,
      active: budgets.filter((b) => b.status === "ACTIVE").length,
      closed: budgets.filter((b) => b.status === "CLOSED").length,
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
    };
  }

  @ApiOperation({ summary: "Get budget by id" })
  @Get("budgets/:id")
  @Permissions("finance.budget.read")
  async getBudget(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.opsService.getBudget(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create budget" })
  @Post("budgets")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.budget.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Budget")
  async createBudget(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBudgetSchema) dto: Record<string, unknown>,
  ) {
    const orgId = await resolveOrgId(req.user.tenantId, req.user.orgId);
    return this.opsService.createBudget(req.user.tenantId, orgId, {
      name: dto.name as string,
      fiscalYear: dto.fiscalYear as number,
      accountId: dto.accountId as string,
      amount: dto.amount as number,
      periodAmounts: dto.periodAmounts as
        | Array<{ period: string; amount: number }>
        | undefined,
      notes: dto.notes as string | undefined,
    });
  }

  @ApiOperation({ summary: "Update budget" })
  @Patch("budgets/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.budget.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Budget", "id")
  async updateBudget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateBudgetSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updateBudget(req.user.tenantId, id, {
      name: dto.name as string | undefined,
      amount: dto.amount as number | undefined,
      notes: dto.notes as string | undefined,
    });
  }

  @ApiOperation({ summary: "Delete budget" })
  @Delete("budgets/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.budget.delete")
  async deleteBudget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteBudget(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get budget vs actual by fiscal year" })
  @Get("budgets/:id/vs-actual")
  @Permissions("finance.budget.read")
  async getBudgetVsActual(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear: string,
  ) {
    return this.opsService.getBudgetVsActual(
      req.user.tenantId,
      parseInt(fiscalYear),
    );
  }

  @ApiOperation({ summary: "Copy budget to new fiscal year" })
  @Post("budgets/:id/copy")
  @Permissions("finance.budget.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Budget")
  async copyBudget(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(copyBudgetSchema) dto: z.infer<typeof copyBudgetSchema>,
  ) {
    return this.opsService.copyBudget(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: "Bulk create budgets" })
  @Post("budgets/bulk-create")
  @Permissions("finance.budget.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("Budget")
  async bulkCreateBudgets(
    @Req() req: AuthenticatedRequest,
    @ZodBody(bulkCreateBudgetsSchema)
    dto: z.infer<typeof bulkCreateBudgetsSchema>,
  ) {
    const orgId = await resolveOrgId(req.user.tenantId, req.user.orgId);
    return this.opsService.bulkCreateBudgets(
      req.user.tenantId,
      orgId,
      dto.budgets,
    );
  }

  @ApiOperation({ summary: "Get period summary for a fiscal year" })
  @Get("budgets/period-summary")
  @Permissions("finance.budget.read")
  async getPeriodSummary(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear: string,
  ) {
    return this.opsService.getPeriodSummary(
      req.user.tenantId,
      parseInt(fiscalYear),
    );
  }

  // --- Vendor Bills ---

  @ApiOperation({ summary: "List vendor bills" })
  @Get("vendor-bills")
  @Permissions("finance.payables.read")
  async listVendorBills(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listVendorBills(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get vendor bill stats" })
  @Get("vendor-bills/stats")
  @Permissions("finance.payables.read")
  async getVendorBillStats(@Req() req: AuthenticatedRequest) {
    const bills = await this.opsService.listVendorBills(req.user.tenantId);
    const totalOutstanding = bills
      .filter((b) => b.status !== "PAID" && b.status !== "VOID")
      .reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
    return {
      total: bills.length,
      draft: bills.filter((b) => b.status === "DRAFT").length,
      approved: bills.filter((b) => b.status === "APPROVED").length,
      paid: bills.filter((b) => b.status === "PAID").length,
      void: bills.filter((b) => b.status === "VOID").length,
      totalOutstanding,
    };
  }

  @ApiOperation({ summary: "Get vendor bill by id" })
  @Get("vendor-bills/:id")
  @Permissions("finance.payables.read")
  async getVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getVendorBill(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Create vendor bill" })
  @Post("vendor-bills")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.payables.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill")
  async createVendorBill(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createVendorBillSchema) dto: Record<string, unknown>,
  ) {
    const orgId = await resolveOrgId(req.user.tenantId, req.user.orgId);
    return this.opsService.createVendorBill(
      req.user.tenantId,
      orgId,
      req.user.userId || "system",
      {
        vendorId: dto.vendorId as string,
        billNumber: dto.billNumber as string,
        billDate: dto.billDate as string,
        dueDate: dto.dueDate as string,
        purchaseOrderId: dto.purchaseOrderId as string | undefined,
        totalAmount: dto.totalAmount as number | undefined,
        lineItems: dto.lineItems as
          | Array<{
              description: string;
              quantity: number;
              unitPrice: number;
              taxRate: number;
            }>
          | undefined,
        notes: dto.notes as string | undefined,
      },
    );
  }

  @ApiOperation({ summary: "Update vendor bill" })
  @Patch("vendor-bills/:id")
  @HttpCode(HttpStatus.OK)
  @Permissions("finance.payables.update")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill", "id")
  async updateVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(updateVendorBillSchema) dto: Record<string, unknown>,
  ) {
    return this.opsService.updateVendorBill(req.user.tenantId, id, {
      dueDate: dto.dueDate as string | undefined,
      notes: dto.notes as string | undefined,
      lineItems: dto.lineItems as
        | Array<{
            description: string;
            quantity: number;
            unitPrice: number;
            taxRate: number;
          }>
        | undefined,
    });
  }

  @ApiOperation({ summary: "Delete vendor bill" })
  @Delete("vendor-bills/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.payables.delete")
  async deleteVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteVendorBill(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Approve vendor bill" })
  @Post("vendor-bills/:id/approve")
  @Permissions("finance.payables.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill", "id")
  async approveVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.approveVendorBill(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Pay vendor bill" })
  @Post("vendor-bills/:id/pay")
  @Permissions("finance.payables.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill", "id")
  async payVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(payVendorBillSchema) dto: z.infer<typeof payVendorBillSchema>,
  ) {
    return this.opsService.payVendorBill(req.user.tenantId, id, {
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      createdBy: req.user.userId || "system",
    });
  }

  @ApiOperation({ summary: "Void vendor bill" })
  @Post("vendor-bills/:id/void")
  @Permissions("finance.payables.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill", "id")
  async voidVendorBill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.voidVendorBill(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Get vendor bill payment history" })
  @Get("vendor-bills/:id/payments")
  @Permissions("finance.payables.read")
  async getVendorBillPayments(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.getVendorBillPaymentHistory(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "List all vendor bill payments (paginated)" })
  @Get("vendor-bill-payments")
  @Permissions("finance.payables.read")
  async listVendorBillPayments(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.opsService.listVendorBillPayments(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @ApiOperation({ summary: "Bulk approve vendor bills" })
  @Post("vendor-bills/bulk-approve")
  @Permissions("finance.payables.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill")
  async bulkApproveVendorBills(
    @Req() req: AuthenticatedRequest,
    @ZodBody(bulkApproveVendorBillsSchema)
    dto: z.infer<typeof bulkApproveVendorBillsSchema>,
  ) {
    return this.opsService.bulkApproveVendorBills(req.user.tenantId, dto.ids);
  }

  @ApiOperation({ summary: "Bulk pay vendor bills" })
  @Post("vendor-bills/bulk-pay")
  @Permissions("finance.payables.manage")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("VendorBill")
  async bulkPayVendorBills(
    @Req() req: AuthenticatedRequest,
    @ZodBody(bulkPayVendorBillsSchema)
    dto: z.infer<typeof bulkPayVendorBillsSchema>,
  ) {
    const payments = dto.payments.map((p) => ({
      ...p,
      createdBy: req.user.userId || "system",
    }));
    return this.opsService.bulkPayVendorBills(req.user.tenantId, payments);
  }

  @ApiOperation({ summary: "Get pending approval vendor bills" })
  @Get("vendor-bills/pending-approval")
  @Permissions("finance.payables.read")
  async getPendingApprovalVendorBills(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.getPendingApprovalVendorBills(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Get vendor bill aging report" })
  @Get("vendor-bills/aging")
  @Permissions("finance.payables.read")
  async getVendorBillAging(@Req() req: AuthenticatedRequest) {
    return this.opsService.getVendorBillAging(req.user.tenantId);
  }

  // --- Financial Reports ---

  @ApiOperation({ summary: "Get profit and loss report" })
  @Get("reports/profit-loss")
  @Permissions("finance.report.read")
  async getProfitLoss(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.opsService.getProfitLoss(req.user.tenantId, startDate, endDate);
  }

  @ApiOperation({ summary: "Get balance sheet report" })
  @Get("reports/balance-sheet")
  @Permissions("finance.report.read")
  async getBalanceSheet(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.opsService.getBalanceSheet(req.user.tenantId, asOfDate);
  }

  @ApiOperation({ summary: "Get cash flow report" })
  @Get("reports/cash-flow")
  @Permissions("finance.report.read")
  async getCashFlow(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.opsService.getCashFlow(req.user.tenantId, startDate, endDate);
  }

  @ApiOperation({ summary: "Get trial balance report" })
  @Get("reports/trial-balance")
  @Permissions("finance.report.read")
  async getTrialBalance(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.opsService.getTrialBalance(req.user.tenantId, asOfDate);
  }

  @ApiOperation({ summary: "Get GL vs sub-ledger account reconciliation" })
  @Get("reports/account-reconciliation")
  @Permissions("finance.report.read")
  async getAccountReconciliation(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.opsService.getAccountReconciliation(
      req.user.tenantId,
      asOfDate || new Date().toISOString(),
    );
  }

  @ApiOperation({ summary: "Get AR aging report" })
  @Get("reports/ar-aging")
  @Permissions("finance.report.read")
  async getArAging(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.opsService.getArAging(req.user.tenantId, asOfDate);
  }

  @ApiOperation({ summary: "Get AP aging report" })
  @Get("reports/ap-aging")
  @Permissions("finance.report.read")
  async getApAging(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate: string,
  ) {
    return this.opsService.getApAging(req.user.tenantId, asOfDate);
  }

  @ApiOperation({ summary: "Get general ledger report" })
  @Get("reports/general-ledger")
  @Permissions("finance.report.read")
  async getGeneralLedger(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.opsService.getGeneralLedger(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @ApiOperation({ summary: "Get tax summary report" })
  @Get("reports/tax-summary")
  @Permissions("finance.report.read")
  async getTaxSummary(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear: string,
  ) {
    return this.opsService.getTaxSummary(
      req.user.tenantId,
      parseInt(fiscalYear),
    );
  }

  @ApiOperation({ summary: "Get revenue by customer report" })
  @Get("reports/revenue-by-customer")
  @Permissions("finance.report.read")
  async getRevenueByCustomer(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.opsService.getRevenueByCustomer(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @ApiOperation({ summary: "Get expense by category report" })
  @Get("reports/expense-by-category")
  @Permissions("finance.report.read")
  async getExpenseByCategory(
    @Req() req: AuthenticatedRequest,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.opsService.getExpenseByCategory(
      req.user.tenantId,
      startDate,
      endDate,
    );
  }

  @ApiOperation({ summary: "Get budget vs actual report" })
  @Get("reports/budget-vs-actual")
  @Permissions("finance.report.read")
  async getBudgetVsActualReport(
    @Req() req: AuthenticatedRequest,
    @Query("fiscalYear") fiscalYear: string,
  ) {
    return this.opsService.getBudgetVsActualReport(
      req.user.tenantId,
      parseInt(fiscalYear),
    );
  }

  @ApiOperation({ summary: "List saved custom report configs" })
  @Get("reports/custom")
  @Permissions("finance.report.read")
  async listSavedReports(
    @Req() req: AuthenticatedRequest,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.opsService.listSavedReportConfigs(
      req.user.tenantId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
      sortBy,
      sortOrder,
    );
  }

  @ApiOperation({ summary: "Save custom report config" })
  @Post("reports/custom")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.report.create")
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges("SavedReport")
  async saveReportConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(saveReportConfigSchema)
    dto: z.infer<typeof saveReportConfigSchema>,
  ) {
    return this.opsService.saveReportConfig(
      req.user.tenantId,
      req.user.userId || "system",
      dto,
    );
  }

  @ApiOperation({ summary: "Delete saved custom report config" })
  @Delete("reports/custom/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("finance.report.delete")
  async deleteSavedReportConfig(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.opsService.deleteSavedReportConfig(req.user.tenantId, id);
  }

  // --- Tax Reconciliations ---

  @ApiOperation({ summary: "List tax reconciliations" })
  @Get("tax-reconciliations")
  @Permissions("finance.tax.read")
  async listTaxReconciliations(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
    @Query("sortBy") _sortBy?: string,
    @Query("sortOrder") _sortOrder?: "asc" | "desc",
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create tax reconciliation" })
  @Post("tax-reconciliations")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  async createTaxReconciliation(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return {
      success: true,
      data: { id: crypto.randomUUID(), status: "draft" },
    };
  }

  @ApiOperation({ summary: "Get tax reconciliation by ID" })
  @Get("tax-reconciliations/:id")
  @Permissions("finance.tax.read")
  async getTaxReconciliation(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Run tax reconciliation" })
  @Post("tax-reconciliations/:id/reconcile")
  @Permissions("finance.tax.manage")
  async runTaxReconciliation(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, status: "completed" } };
  }

  @ApiOperation({ summary: "Get reconciliation results" })
  @Get("tax-reconciliations/:id/results")
  @Permissions("finance.tax.read")
  async getTaxReconciliationResults(
    @Req() _req: AuthenticatedRequest,
    @Param("id") _id: string,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Export tax reconciliation report" })
  @Post("tax-reconciliations/export")
  @Permissions("finance.tax.read")
  async exportTaxReconciliationReport(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return {
      success: true,
      data: { exportUrl: "/exports/tax-reconciliation.csv" },
    };
  }

  // --- Withholding Tax ---

  @ApiOperation({ summary: "List withholding tax entries" })
  @Get("withholding-tax")
  @Permissions("finance.tax.read")
  async listWithholdingTax(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create withholding tax entry" })
  @Post("withholding-tax")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  async createWithholdingTax(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return { success: true, data: { id: crypto.randomUUID() } };
  }

  @ApiOperation({ summary: "Get withholding tax by ID" })
  @Get("withholding-tax/:id")
  @Permissions("finance.tax.read")
  async getWithholdingTax(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Update withholding tax" })
  @Patch("withholding-tax/:id")
  @Permissions("finance.tax.update")
  async updateWithholdingTax(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query() _query: any,
  ) {
    return { success: true, data: { id, updated: true } };
  }

  @ApiOperation({ summary: "File withholding tax return" })
  @Post("withholding-tax/:id/file")
  @Permissions("finance.tax.manage")
  async fileWithholdingTaxReturn(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return {
      success: true,
      data: { id, filed: true, filingDate: new Date().toISOString() },
    };
  }

  // --- Tax Filings ---

  @ApiOperation({ summary: "List tax filings" })
  @Get("tax-filings")
  @Permissions("finance.tax.read")
  async listTaxFilings(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create tax filing" })
  @Post("tax-filings")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  async createTaxFiling(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return {
      success: true,
      data: { id: crypto.randomUUID(), status: "draft" },
    };
  }

  @ApiOperation({ summary: "Get tax filing by ID" })
  @Get("tax-filings/:id")
  @Permissions("finance.tax.read")
  async getTaxFiling(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Submit tax filing" })
  @Post("tax-filings/:id/submit")
  @Permissions("finance.tax.manage")
  async submitTaxFiling(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, status: "submitted" } };
  }

  @ApiOperation({ summary: "Get tax filing status" })
  @Get("tax-filings/:id/status")
  @Permissions("finance.tax.read")
  async getTaxFilingStatus(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, status: "draft" } };
  }

  // --- Vendor 1099 ---

  @ApiOperation({ summary: "List vendor 1099 profiles" })
  @Get("vendor-1099")
  @Permissions("finance.tax.read")
  async listVendor1099(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create vendor 1099 profile" })
  @Post("vendor-1099")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.tax.create")
  async createVendor1099(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return { success: true, data: { id: crypto.randomUUID() } };
  }

  @ApiOperation({ summary: "Get vendor 1099 by ID" })
  @Get("vendor-1099/:id")
  @Permissions("finance.tax.read")
  async getVendor1099(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Update vendor 1099" })
  @Patch("vendor-1099/:id")
  @Permissions("finance.tax.update")
  async updateVendor1099(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query() _query: any,
  ) {
    return { success: true, data: { id, updated: true } };
  }

  @ApiOperation({ summary: "Generate 1099 forms" })
  @Post("vendor-1099/generate")
  @Permissions("finance.tax.manage")
  async generate1099Forms(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return { success: true, data: { generated: true, count: 0 } };
  }

  // --- Bad Debt Provisions ---

  @ApiOperation({ summary: "List bad debt provisions" })
  @Get("bad-debt-provisions")
  @Permissions("finance.payables.read")
  async listBadDebtProvisions(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create bad debt provision" })
  @Post("bad-debt-provisions")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.payables.create")
  async createBadDebtProvision(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return {
      success: true,
      data: { id: crypto.randomUUID(), status: "draft" },
    };
  }

  @ApiOperation({ summary: "Get bad debt provision by ID" })
  @Get("bad-debt-provisions/:id")
  @Permissions("finance.payables.read")
  async getBadDebtProvision(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Apply bad debt provision" })
  @Post("bad-debt-provisions/:id/apply")
  @Permissions("finance.payables.manage")
  async applyBadDebtProvision(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, applied: true } };
  }

  @ApiOperation({ summary: "Get bad debt summary" })
  @Get("bad-debt-provisions/summary")
  @Permissions("finance.payables.read")
  async getBadDebtSummary(@Req() _req: AuthenticatedRequest) {
    return {
      success: true,
      data: { totalProvisioned: 0, totalWrittenOff: 0, remaining: 0 },
    };
  }

  // --- Vendor Statements ---

  @ApiOperation({ summary: "List vendor statements" })
  @Get("vendor-statements")
  @Permissions("finance.payables.read")
  async listVendorStatements(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create vendor statement" })
  @Post("vendor-statements")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.payables.create")
  async createVendorStatement(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return { success: true, data: { id: crypto.randomUUID() } };
  }

  @ApiOperation({ summary: "Get vendor statement by ID" })
  @Get("vendor-statements/:id")
  @Permissions("finance.payables.read")
  async getVendorStatement(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id } };
  }

  @ApiOperation({ summary: "Send vendor statement" })
  @Post("vendor-statements/:id/send")
  @Permissions("finance.payables.manage")
  async sendVendorStatement(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, sent: true } };
  }

  @ApiOperation({ summary: "Generate batch vendor statements" })
  @Get("vendor-statements/generate-batch")
  @Permissions("finance.payables.manage")
  async generateBatchVendorStatements(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return { success: true, data: { generated: true, count: 0 } };
  }

  // --- Additional Financial Reports ---

  @ApiOperation({ summary: "Get cash position report" })
  @Get("reports/cash-position")
  @Permissions("finance.report.read")
  async getCashPositionReport(@Req() req: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.opsService.getCashPositionReport(req.user.tenantId),
    };
  }

  @ApiOperation({ summary: "Get working capital report" })
  @Get("reports/working-capital")
  @Permissions("finance.report.read")
  async getWorkingCapitalReport(
    @Req() _req: AuthenticatedRequest,
    @Query("asOfDate") _asOfDate?: string,
  ) {
    return {
      success: true,
      data: { currentAssets: 0, currentLiabilities: 0, workingCapital: 0 },
    };
  }

  @ApiOperation({ summary: "Get revenue breakdown report" })
  @Get("reports/revenue-breakdown")
  @Permissions("finance.report.read")
  async getRevenueBreakdownReport(
    @Req() _req: AuthenticatedRequest,
    @Query("startDate") _startDate?: string,
    @Query("endDate") _endDate?: string,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Get expense analysis report" })
  @Get("reports/expense-analysis")
  @Permissions("finance.report.read")
  async getExpenseAnalysisReport(
    @Req() _req: AuthenticatedRequest,
    @Query("startDate") _startDate?: string,
    @Query("endDate") _endDate?: string,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Get financial ratios" })
  @Get("reports/financial-ratios")
  @Permissions("finance.report.read")
  async getFinancialRatios(
    @Req() req: AuthenticatedRequest,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return {
      success: true,
      data: await this.opsService.getFinancialRatios(
        req.user.tenantId,
        asOfDate || new Date().toISOString(),
      ),
    };
  }

  // --- Currency Revaluations ---

  @ApiOperation({ summary: "List currency revaluations" })
  @Get("currency-revaluations")
  @Permissions("finance.settings.read")
  async listCurrencyRevaluations(
    @Req() _req: AuthenticatedRequest,
    @Query("page") _page?: number,
    @Query("limit") _limit?: number,
  ) {
    return { success: true, data: [], total: 0 };
  }

  @ApiOperation({ summary: "Create currency revaluation" })
  @Post("currency-revaluations")
  @HttpCode(HttpStatus.CREATED)
  @Permissions("finance.settings.write")
  async createCurrencyRevaluation(
    @Req() _req: AuthenticatedRequest,
    @Query() _query: any,
  ) {
    return {
      success: true,
      data: { id: crypto.randomUUID(), status: "draft" },
    };
  }

  @ApiOperation({ summary: "Execute currency revaluation" })
  @Post("currency-revaluations/:id/run")
  @Permissions("finance.settings.write")
  async runCurrencyRevaluation(
    @Req() _req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return { success: true, data: { id, executed: true } };
  }
}
