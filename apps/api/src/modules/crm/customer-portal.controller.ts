import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CustomerPortalAuthGuard } from "./customer-portal-auth.guard";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import {
  CustomerPortalService,
  portalLoginSchema,
  PortalLoginInput,
  portalCreateCaseSchema,
  PortalCreateCaseInput,
  portalCaseCommentSchema,
  PortalCaseCommentInput,
  portalQuotationDecisionSchema,
  PortalQuotationDecisionInput,
  portalInitiatePaymentSchema,
  PortalInitiatePaymentInput,
  portalConfirmPaymentSchema,
  PortalConfirmPaymentInput,
} from "./customer-portal.service";
import { CrmPortalDocumentsService } from "./crm-portal-documents.service";
import { Permissions } from "../../common/decorators/permissions.decorator";

interface PortalRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    customerId: string;
    portal: true;
    email: string;
  };
}

/**
 * Customer-facing self-service portal endpoints. Unlike the rest of the API,
 * these are guarded by `CustomerPortalAuthGuard` (a portal-scoped JWT check),
 * NOT `RbacGuard` — portal users are external customer contacts, not tenant
 * staff, so they carry no Role/Permission records. Every query below is
 * scoped to `req.user.customerId`, never just tenantId, so one customer can
 * never see another customer's quotations/orders/invoices/cases.
 */
@ApiTags("crm-customer-portal")
@Controller("portal")
export class CustomerPortalController {
  constructor(
    private readonly svc: CustomerPortalService,
    private readonly documents: CrmPortalDocumentsService,
  ) {}

  @ApiOperation({ summary: "Customer portal login" })
  @Permissions("crm.crm.login")
  @Post("auth/login")
  async login(@ZodBody(portalLoginSchema) dto: PortalLoginInput) {
    return this.svc.login(dto);
  }

  @ApiOperation({ summary: "Portal dashboard summary" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.dashboard-summary.read")
  @Get("dashboard")
  async dashboard(@Req() req: PortalRequest) {
    return this.svc.getDashboardSummary(req.user.tenantId, req.user.customerId);
  }

  @ApiOperation({ summary: "List my quotations" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-quotation.read")
  @Get("quotations")
  async quotations(@Req() req: PortalRequest) {
    return this.svc.getMyQuotations(req.user.tenantId, req.user.customerId);
  }

  @ApiOperation({ summary: "Get one of my quotations" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-quotation-detail.read")
  @Get("quotations/:id")
  async quotationDetail(@Req() req: PortalRequest, @Param("id") id: string) {
    return this.svc.getMyQuotationDetail(
      req.user.tenantId,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({ summary: "Accept one of my quotations" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.quotation.accept")
  @Post("quotations/:id/accept")
  async acceptQuotation(@Req() req: PortalRequest, @Param("id") id: string) {
    return this.svc.acceptQuotation(req.user.tenantId, req.user.customerId, id);
  }

  @ApiOperation({ summary: "Reject one of my quotations" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.quotation.reject")
  @Post("quotations/:id/reject")
  async rejectQuotation(
    @Req() req: PortalRequest,
    @Param("id") id: string,
    @ZodBody(portalQuotationDecisionSchema) dto: PortalQuotationDecisionInput,
  ) {
    return this.svc.rejectQuotation(
      req.user.tenantId,
      req.user.customerId,
      id,
      dto,
    );
  }

  @ApiOperation({ summary: "List my sales orders" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-order.read")
  @Get("orders")
  async orders(@Req() req: PortalRequest) {
    return this.svc.getMyOrders(req.user.tenantId, req.user.customerId);
  }

  @ApiOperation({ summary: "Get one of my sales orders" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-order-detail.read")
  @Get("orders/:id")
  async orderDetail(@Req() req: PortalRequest, @Param("id") id: string) {
    return this.svc.getMyOrderDetail(
      req.user.tenantId,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({ summary: "List my invoices" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-invoice.read")
  @Get("invoices")
  async invoices(@Req() req: PortalRequest) {
    return this.svc.getMyInvoices(req.user.tenantId, req.user.customerId);
  }

  @ApiOperation({ summary: "Get one of my invoices" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-invoice-detail.read")
  @Get("invoices/:id")
  async invoiceDetail(@Req() req: PortalRequest, @Param("id") id: string) {
    return this.svc.getMyInvoiceDetail(
      req.user.tenantId,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({ summary: "Download a PDF of one of my quotations" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.pdf.quotation")
  @Get("quotations/:id/pdf")
  async quotationPdf(
    @Req() req: PortalRequest,
    @Res() res: Response,
    @Param("id") id: string,
  ) {
    return this.documents.streamQuotationPdf(
      res,
      req.user.tenantId,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({ summary: "Download a PDF of one of my invoices" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.pdf.invoice")
  @Get("invoices/:id/pdf")
  async invoicePdf(
    @Req() req: PortalRequest,
    @Res() res: Response,
    @Param("id") id: string,
  ) {
    return this.documents.streamInvoicePdf(
      res,
      req.user.tenantId,
      req.user.customerId,
      id,
    );
  }

  @ApiOperation({ summary: "List my invoice payment intents" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-payment-intent.read")
  @Get("payments")
  async myPayments(@Req() req: PortalRequest) {
    return this.svc.listMyPaymentIntents(
      req.user.tenantId,
      req.user.customerId,
    );
  }

  @ApiOperation({
    summary: "Initiate an online payment for one of my invoices",
  })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.invoice-payment.initiate")
  @Post("invoices/:id/pay")
  async initiatePayment(
    @Req() req: PortalRequest,
    @Param("id") id: string,
    @ZodBody(portalInitiatePaymentSchema) dto: PortalInitiatePaymentInput,
  ) {
    return this.svc.initiateInvoicePayment(
      req.user.tenantId,
      req.user.customerId,
      req.user.userId,
      id,
      dto,
    );
  }

  @ApiOperation({ summary: "Confirm an initiated invoice payment" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.invoice-payment.confirm")
  @Post("payments/:intentId/confirm")
  async confirmPayment(
    @Req() req: PortalRequest,
    @Param("intentId") intentId: string,
    @ZodBody(portalConfirmPaymentSchema) dto: PortalConfirmPaymentInput,
  ) {
    return this.svc.confirmInvoicePayment(
      req.user.tenantId,
      req.user.customerId,
      intentId,
      dto,
    );
  }

  @ApiOperation({ summary: "List my support cases" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-cas.read")
  @Get("cases")
  async cases(@Req() req: PortalRequest) {
    return this.svc.getMyCases(req.user.tenantId, req.user.customerId);
  }

  @ApiOperation({ summary: "Get one of my support cases with public comments" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.my-case-detail.read")
  @Get("cases/:id")
  async caseDetail(@Req() req: PortalRequest, @Param("id") id: string) {
    return this.svc.getMyCaseDetail(req.user.tenantId, req.user.customerId, id);
  }

  @ApiOperation({ summary: "Submit a new support case" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.case.create")
  @Post("cases")
  async createCase(
    @Req() req: PortalRequest,
    @ZodBody(portalCreateCaseSchema) dto: PortalCreateCaseInput,
  ) {
    return this.svc.createCase(
      req.user.tenantId,
      req.user.customerId,
      req.user.userId,
      dto,
    );
  }

  @ApiOperation({ summary: "Add a comment to one of my support cases" })
  @UseGuards(CustomerPortalAuthGuard)
  @Permissions("crm.case-comment.create")
  @Post("cases/:id/comments")
  async addComment(
    @Req() req: PortalRequest,
    @Param("id") id: string,
    @ZodBody(portalCaseCommentSchema) dto: PortalCaseCommentInput,
  ) {
    return this.svc.addCaseComment(
      req.user.tenantId,
      req.user.customerId,
      req.user.userId,
      id,
      dto,
    );
  }
}
