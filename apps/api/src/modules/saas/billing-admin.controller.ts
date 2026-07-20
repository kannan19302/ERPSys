import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { PaymentMethodsService } from "./payment-methods.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const adjustInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
  adjustmentAmount: z.number(),
  reason: z.string().min(1),
});

const processRefundSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().min(0).optional(),
  reason: z.string().optional(),
});

@ApiTags("saas-billing-admin")
@ApiBearerAuth()
@Controller("saas/admin/billing")
@UseGuards(JwtAuthGuard, RbacGuard)
export class BillingAdminController {
  constructor(
    private readonly tenantAnalyticsService: TenantAnalyticsService,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  @ApiOperation({ summary: "Admin billing overview [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("overview")
  async adminBillingOverview(@Req() _req: AuthReq) {
    return this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
  }

  @ApiOperation({ summary: "Get revenue data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("revenue")
  async getRevenueData(@Req() _req: AuthReq, @Query("period") period?: string) {
    return this.tenantAnalyticsService.getRevenueAnalytics((period as any) || "30d");
  }

  @ApiOperation({ summary: "Get MRR data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("revenue/mrr")
  async getMrrData(@Req() _req: AuthReq) {
    const overview = await this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
    return { mrr: (overview as any)?.mrr || 0, currency: "USD", trend: [] };
  }

  @ApiOperation({ summary: "Get ARR data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("revenue/arr")
  async getArrData(@Req() _req: AuthReq) {
    const overview = await this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
    return { arr: (overview as any)?.arr || 0, currency: "USD", trend: [] };
  }

  @ApiOperation({ summary: "Get ARPU data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("revenue/arpu")
  async getArpuData(@Req() _req: AuthReq) {
    const overview = await this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
    const active = (overview as any)?.activeTenants || 1;
    const mrr = (overview as any)?.mrr || 0;
    return { arpu: Math.round(mrr / active * 100) / 100, currency: "USD" };
  }

  @ApiOperation({ summary: "Get LTV data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("revenue/ltv")
  async getLtvData(@Req() _req: AuthReq) {
    const overview = await this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
    const arpu = ((overview as any)?.mrr || 0) / Math.max((overview as any)?.activeTenants || 1, 1);
    return { ltv: Math.round(arpu * 24 * 100) / 100, currency: "USD", averageLifetimeMonths: 24 };
  }

  @ApiOperation({ summary: "Get churn data [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("churn")
  async getChurnData(@Req() _req: AuthReq, @Query("period") period?: string) {
    return this.tenantAnalyticsService.getChurnAnalytics((period as any) || "30d");
  }

  @ApiOperation({ summary: "Get cohort analysis [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("churn/cohort")
  async getCohortAnalysis(@Req() _req: AuthReq) {
    return { cohorts: [], periods: [] };
  }

  @ApiOperation({ summary: "List all subscriptions [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("subscriptions")
  async listAllSubscriptions(@Req() _req: AuthReq) {
    return prisma.tenantSubscription.findMany({
      include: { plan: { select: { name: true } }, tenant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []);
  }

  @ApiOperation({ summary: "Get active subscriptions [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("subscriptions/active")
  async getActiveSubscriptions(@Req() _req: AuthReq) {
    return prisma.tenantSubscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: { select: { name: true } }, tenant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);
  }

  @ApiOperation({ summary: "Get expiring subscriptions [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("subscriptions/expiring")
  async getExpiringSubscriptions(@Req() _req: AuthReq) {
    const weekFromNow = new Date(Date.now() + 7 * 86400000);
    return prisma.tenantSubscription.findMany({
      where: { endDate: { lte: weekFromNow, gte: new Date() }, status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: { select: { name: true } }, tenant: { select: { name: true } } },
    }).catch(() => []);
  }

  @ApiOperation({ summary: "List all invoices [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("invoices")
  async listAllInvoices(@Req() _req: AuthReq) {
    return prisma.saaSInvoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []);
  }

  @ApiOperation({ summary: "Adjust invoice [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("invoices/adjust")
  async adjustInvoice(@Req() _req: AuthReq, @ZodBody(adjustInvoiceSchema) body: z.infer<typeof adjustInvoiceSchema>) {
    return prisma.saaSInvoice.update({
      where: { id: body.invoiceId },
      data: { totalAmount: { increment: body.adjustmentAmount } },
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "List all payments [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("payments")
  async listAllPayments(@Req() _req: AuthReq) {
    return prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []);
  }

  @ApiOperation({ summary: "Process refund [Admin]" })
  @Permissions("saas.analytics.create")
  @Post("payments/refund")
  async processRefund(@Req() req: AuthReq, @ZodBody(processRefundSchema) body: z.infer<typeof processRefundSchema>) {
    return this.paymentMethodsService.requestRefund(req.user.tenantId, body.transactionId, {
      amount: body.amount,
      reason: body.reason,
    }).catch(() => ({ success: false }));
  }

  @ApiOperation({ summary: "Get financial reports [Admin]" })
  @Permissions("saas.analytics.read")
  @Get("financial-reports")
  async getFinancialReports(@Req() _req: AuthReq) {
    const overview = await this.tenantAnalyticsService.getPlatformOverview().catch(() => null);
    return { overview, reports: [] };
  }
}
