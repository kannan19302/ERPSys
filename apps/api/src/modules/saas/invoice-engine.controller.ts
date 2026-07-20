import {
  Controller,
  Get,
  Post,
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
import { InvoiceEngineService } from "./invoice-engine.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const generateInvoiceSchema = z.object({
  tenantId: z.string().optional(),
  planId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })).optional(),
});

@ApiTags("saas-invoices")
@ApiBearerAuth()
@Controller("saas/invoices")
@UseGuards(JwtAuthGuard, RbacGuard)
export class InvoiceEngineController {
  constructor(private readonly invoiceEngineService: InvoiceEngineService) {}

  @ApiOperation({ summary: "List invoices" })
  @Permissions("saas.invoice.read")
  @Get()
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
    );
  }

  @ApiOperation({ summary: "Get invoice stats" })
  @Permissions("saas.invoice.read")
  @Get("stats")
  async getInvoiceStats(@Req() req: AuthReq) {
    return this.invoiceEngineService.getInvoiceStats(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get upcoming invoices" })
  @Permissions("saas.invoice.read")
  @Get("upcoming")
  async getUpcomingInvoices(@Req() req: AuthReq) {
    return this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get invoice by id" })
  @Permissions("saas.invoice.read")
  @Get(":id")
  async getInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.getInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Generate invoice" })
  @Permissions("saas.invoice.create")
  @Post()
  async generateInvoice(@Req() req: AuthReq, @ZodBody(generateInvoiceSchema) body: z.infer<typeof generateInvoiceSchema>) {
    return this.invoiceEngineService.generateInvoice(req.user.tenantId, body);
  }

  @ApiOperation({ summary: "Pay invoice" })
  @Permissions("saas.invoice.pay")
  @Post(":id/pay")
  async payInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.payInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Refund invoice" })
  @Permissions("saas.invoice.pay")
  @Post(":id/refund")
  async refundInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.refundInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Cancel invoice" })
  @Permissions("saas.invoice.pay")
  @Post(":id/cancel")
  async cancelInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.cancelInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: "Download invoice PDF" })
  @Permissions("saas.invoice.download")
  @Get(":id/download")
  async downloadPdf(@Req() req: AuthReq, @Param("id") id: string) {
    return this.invoiceEngineService.downloadPdf(req.user.tenantId, id);
  }
}
