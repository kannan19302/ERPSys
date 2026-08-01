import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { z } from "zod";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApDeepService } from "./ap-deep.service";

const batchSchema = z.object({
  batchNumber: z.string().min(1),
  createdBy: z.string().min(1),
  lines: z
    .array(
      z.object({
        invoiceId: z.string(),
        amount: z.number().positive(),
        scheduledPaymentDate: z.string(),
      }),
    )
    .optional(),
});

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@ApiTags("finance/ap-deep")
@ApiBearerAuth()
@Controller("finance/ap-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class ApDeepController {
  constructor(private readonly apDeepService: ApDeepService) {}

  @Get("invoice-matching")
  @Permissions("finance.payables.read")
  async getInvoiceMatching(@Req() req: AuthReq, @Query() query: any) {
    return this.apDeepService.getInvoiceMatching(req.user.tenantId, query);
  }

  @Get("invoice-matching/stats")
  @Permissions("finance.payables.read")
  async getMatchingStats(@Req() req: AuthReq) {
    return this.apDeepService.getMatchingStats(req.user.tenantId);
  }

  @Get("vendor-bills")
  @Permissions("finance.payables.read")
  async getVendorBills(@Req() req: AuthReq, @Query() query: any) {
    return this.apDeepService.getVendorBills(req.user.tenantId, query);
  }

  @Get("approval-queue")
  @Permissions("finance.payables.read")
  async getApprovalQueue(@Req() req: AuthReq, @Query() query: any) {
    return this.apDeepService.getApApprovalQueue(req.user.tenantId, query);
  }

  @Post("approval-queue/:id/approve")
  @Permissions("finance.payables.manage")
  async approveVendorBill(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apDeepService.approveVendorBill(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("approval-queue/:id/reject")
  @Permissions("finance.payables.manage")
  async rejectVendorBill(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.apDeepService.rejectVendorBill(
      req.user.tenantId,
      id,
      body?.reason || "",
    );
  }

  @Get("payment-schedule")
  @Permissions("finance.payables.read")
  async getPaymentSchedule(@Req() req: AuthReq, @Query() query: any) {
    return this.apDeepService.getPaymentSchedule(req.user.tenantId, query);
  }

  @Get("payment-batches")
  @Permissions("finance.payables.read")
  async getPaymentBatches(@Req() req: AuthReq, @Query() query: any) {
    return this.apDeepService.getPaymentBatches(req.user.tenantId, query);
  }

  @Post("payment-batches")
  @Permissions("finance.payables.create")
  async createPaymentBatch(@Req() req: AuthReq, @Body() body: any) {
    const parsed = batchSchema.parse(body);
    return this.apDeepService.createPaymentBatch(req.user.tenantId, parsed);
  }

  @Post("payment-batches/:id/submit")
  @Permissions("finance.payables.manage")
  async submitPaymentBatch(@Req() req: AuthReq, @Param("id") id: string) {
    return this.apDeepService.submitPaymentBatch(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Get("vendor-statement/:vendorId")
  @Permissions("finance.payables.read")
  async getVendorStatement(
    @Req() req: AuthReq,
    @Param("vendorId") vendorId: string,
  ) {
    return this.apDeepService.getVendorStatementReconciliation(
      req.user.tenantId,
      vendorId,
    );
  }

  @Get("analytics")
  @Permissions("finance.payables.read")
  async getAnalytics(@Req() req: AuthReq) {
    return this.apDeepService.getApAnalytics(req.user.tenantId);
  }
}
