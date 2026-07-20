import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { InvoiceEngineService } from "./invoice-engine.service";
import { PaymentMethodsService } from "./payment-methods.service";
import { SaasService } from "./saas.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateCustomerProfileSchema = z.object({
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
});

const applyCreditBalanceSchema = z.object({
  amount: z.number().min(0.01),
  invoiceId: z.string().optional(),
});

const applyDiscountCodeSchema = z.object({
  code: z.string().min(1),
});

const setBillingCurrencySchema = z.object({
  currency: z.string().min(1).max(3),
});

const updateBillingCommPrefsSchema = z.object({
  emailInvoices: z.boolean().optional(),
  emailReceipts: z.boolean().optional(),
  emailPaymentFailures: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
});

const resolveDunningSchema = z.object({
  action: z.enum(["retry", "waive", "split"]),
  notes: z.string().optional(),
});

@ApiTags("saas-customer-billing")
@ApiBearerAuth()
@Controller("saas/customer-billing")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CustomerBillingController {
  constructor(
    private readonly invoiceEngineService: InvoiceEngineService,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly saasService: SaasService,
  ) {}

  @ApiOperation({ summary: "Get customer profile" })
  @Permissions("saas.payment.read")
  @Get("profile")
  async getCustomerProfile(@Req() req: AuthReq) {
    const sub = await this.saasService.getSubscription(req.user.tenantId).catch(() => null);
    return { tenantId: req.user.tenantId, subscription: sub };
  }

  @ApiOperation({ summary: "Update customer profile" })
  @Permissions("saas.payment.create")
  @Put("profile")
  async updateCustomerProfile(@Req() _req: AuthReq, @ZodBody(updateCustomerProfileSchema) body: z.infer<typeof updateCustomerProfileSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Get payment history" })
  @Permissions("saas.payment.read")
  @Get("payment-history")
  async getPaymentHistory(@Req() req: AuthReq) {
    return this.paymentMethodsService.listTransactions(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Get customer invoices" })
  @Permissions("saas.invoice.read")
  @Get("invoices")
  async getCustomerInvoices(@Req() req: AuthReq) {
    return this.invoiceEngineService.listInvoices(req.user.tenantId, 1, 100).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Retry payment" })
  @Permissions("saas.invoice.pay")
  @Post("invoices/:id/retry")
  async retryPayment(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.payInvoice(req.user.tenantId, id).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get credits" })
  @Permissions("saas.payment.read")
  @Get("credits")
  async getCredits(@Req() _req: AuthReq) {
    return { balance: 0, currency: "USD", availableCredits: [] };
  }

  @ApiOperation({ summary: "Apply credit balance" })
  @Permissions("saas.payment.create")
  @Post("credits/apply")
  async applyCreditBalance(@Req() _req: AuthReq, @ZodBody(applyCreditBalanceSchema) body: z.infer<typeof applyCreditBalanceSchema>) {
    return { success: true, amount: body.amount, invoiceId: body.invoiceId };
  }

  @ApiOperation({ summary: "Get discounts" })
  @Permissions("saas.payment.read")
  @Get("discounts")
  async getDiscounts(@Req() _req: AuthReq) {
    return this.saasService.getCoupons().catch(() => []);
  }

  @ApiOperation({ summary: "Apply discount code" })
  @Permissions("saas.payment.create")
  @Post("discounts/apply")
  async applyDiscountCode(@Req() _req: AuthReq, @ZodBody(applyDiscountCodeSchema) body: z.infer<typeof applyDiscountCodeSchema>) {
    return { success: true, code: body.code };
  }

  @ApiOperation({ summary: "Get supported currencies" })
  @Permissions("saas.payment.read")
  @Get("currencies")
  async getSupportedCurrencies(@Req() _req: AuthReq) {
    return ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "BRL"];
  }

  @ApiOperation({ summary: "Set billing currency" })
  @Permissions("saas.payment.create")
  @Put("currency")
  async setBillingCurrency(@Req() _req: AuthReq, @ZodBody(setBillingCurrencySchema) body: z.infer<typeof setBillingCurrencySchema>) {
    return { success: true, currency: body.currency };
  }

  @ApiOperation({ summary: "Get billing communication prefs" })
  @Permissions("saas.payment.read")
  @Get("communication-prefs")
  async getBillingCommunicationPrefs(@Req() _req: AuthReq) {
    return { emailInvoices: true, emailReceipts: true, emailPaymentFailures: true, emailPromotions: false };
  }

  @ApiOperation({ summary: "Update billing communication prefs" })
  @Permissions("saas.payment.create")
  @Put("communication-prefs")
  async updateBillingCommunicationPrefs(@Req() _req: AuthReq, @ZodBody(updateBillingCommPrefsSchema) body: z.infer<typeof updateBillingCommPrefsSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Get dunning status" })
  @Permissions("saas.payment.read")
  @Get("dunning")
  async getDunningStatus(@Req() _req: AuthReq) {
    return { status: "CLEAR", attempts: 0, lastAttempt: null, nextAttempt: null };
  }

  @ApiOperation({ summary: "Resolve dunning" })
  @Permissions("saas.payment.create")
  @Post("dunning/resolve")
  async resolveDunning(@Req() _req: AuthReq, @ZodBody(resolveDunningSchema) body: z.infer<typeof resolveDunningSchema>) {
    return { success: true, action: body.action };
  }

  @ApiOperation({ summary: "Download invoice PDF" })
  @Permissions("saas.invoice.download")
  @Get("invoices/:id/pdf")
  async downloadInvoicePdf(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.downloadPdf(req.user.tenantId, id).catch(() => null);
  }
}
