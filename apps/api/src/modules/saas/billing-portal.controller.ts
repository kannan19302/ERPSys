import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { BillingService } from "./billing.service";
import { InvoiceEngineService } from "./invoice-engine.service";
import { PaymentMethodsService } from "./payment-methods.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const updateTaxDetailsSchema = z.object({
  taxId: z.string().optional(),
  taxName: z.string().optional(),
  taxAddress: z.string().optional(),
  taxCountry: z.string().optional(),
});

const updateBillingAddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  zip: z.string().min(1),
  country: z.string().min(1),
});

@ApiTags("saas-billing")
@ApiBearerAuth()
@Controller("saas/billing")
@UseGuards(JwtAuthGuard, RbacGuard)
export class BillingPortalController {
  constructor(
    private readonly billingService: BillingService,
    private readonly invoiceEngineService: InvoiceEngineService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  @ApiOperation({ summary: "Get billing overview" })
  @Permissions("saas.payment.read")
  @Get("overview")
  async getBillingOverview(@Req() req: AuthReq) {
    const usage = await this.billingService.getUsageSummary(req.user.tenantId).catch(() => null);
    const upcoming = await this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId).catch(() => null);
    return { usage, upcomingInvoice: upcoming };
  }

  @ApiOperation({ summary: "Get upcoming charges" })
  @Permissions("saas.payment.read")
  @Get("upcoming")
  async getUpcomingCharges(@Req() req: AuthReq) {
    return this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Get tax details" })
  @Permissions("saas.payment.read")
  @Get("tax-details")
  async getTaxDetails(@Req() _req: AuthReq) {
    return { taxId: null, taxName: null, taxAddress: null, taxCountry: null };
  }

  @ApiOperation({ summary: "Update tax details" })
  @Permissions("saas.payment.create")
  @Put("tax-details")
  async updateTaxDetails(@Req() _req: AuthReq, @ZodBody(updateTaxDetailsSchema) body: z.infer<typeof updateTaxDetailsSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "Get billing address" })
  @Permissions("saas.payment.read")
  @Get("address")
  async getBillingAddress(@Req() _req: AuthReq) {
    return { line1: null, line2: null, city: null, state: null, zip: null, country: null };
  }

  @ApiOperation({ summary: "Update billing address" })
  @Permissions("saas.payment.create")
  @Put("address")
  async updateBillingAddress(@Req() _req: AuthReq, @ZodBody(updateBillingAddressSchema) body: z.infer<typeof updateBillingAddressSchema>) {
    return { success: true, ...body };
  }

  @ApiOperation({ summary: "List invoices" })
  @Permissions("saas.invoice.read")
  @Get("invoices")
  async listInvoices(
    @Req() req: AuthReq,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.invoiceEngineService.listInvoices(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    ).catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get invoice detail" })
  @Permissions("saas.invoice.read")
  @Get("invoices/:id")
  async getInvoiceDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.getInvoice(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Pay invoice" })
  @Permissions("saas.invoice.pay")
  @Post("invoices/:id/pay")
  async payInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.payInvoice(req.user.tenantId, id).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "List transactions" })
  @Permissions("saas.payment.read")
  @Get("transactions")
  async listTransactions(@Req() req: AuthReq) {
    return this.paymentMethodsService.listTransactions(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Get transaction detail" })
  @Permissions("saas.payment.read")
  @Get("transactions/:id")
  async getTransactionDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.paymentMethodsService.getTransaction(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "List receipts" })
  @Permissions("saas.invoice.read")
  @Get("receipts")
  async listReceipts(@Req() req: AuthReq) {
    return this.invoiceEngineService.listInvoices(req.user.tenantId, 1, 50, "PAID").catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get receipt detail" })
  @Permissions("saas.invoice.read")
  @Get("receipts/:id")
  async getReceiptDetail(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.getInvoice(req.user.tenantId, id).catch(() => null);
  }

  @ApiOperation({ summary: "Export billing data" })
  @Permissions("saas.invoice.read")
  @Get("export")
  async exportBillingData(@Req() req: AuthReq) {
    const invoices = await this.invoiceEngineService.getBillingHistory(req.user.tenantId).catch(() => []);
    return { format: "json", data: JSON.stringify(invoices), filename: `billing-export-${req.user.tenantId}.json` };
  }

  @ApiOperation({ summary: "Get billing summary" })
  @Permissions("saas.payment.read")
  @Get("summary")
  async getBillingSummary(@Req() req: AuthReq) {
    const stats = await this.invoiceEngineService.getInvoiceStats(req.user.tenantId).catch(() => null);
    const upcoming = await this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId).catch(() => null);
    return { stats, upcomingInvoice: upcoming };
  }
}
