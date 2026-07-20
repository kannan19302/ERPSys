import {
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
  Req,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasService } from "./saas.service";
import { BillingService } from "./billing.service";
import { InvoiceEngineService } from "./invoice-engine.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const changePlanSchema = z.object({
  planId: z.string().min(1),
  couponCode: z.string().optional(),
});

const changeBillingPeriodSchema = z.object({
  period: z.enum(["monthly", "yearly"]),
});

const extendTrialSchema = z.object({
  days: z.number().int().min(1).max(90),
});

const addCreditsSchema = z.object({
  amount: z.number().min(0.01),
  description: z.string().optional(),
});

const redeemCouponSchema = z.object({
  code: z.string().min(1),
});

@ApiTags("saas-subscription")
@ApiBearerAuth()
@Controller("saas/subscription")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SubscriptionLifecycleController {
  constructor(
    private readonly saasService: SaasService,
    private readonly billingService: BillingService,
    private readonly invoiceEngineService: InvoiceEngineService,
  ) {}

  @ApiOperation({ summary: "Get current subscription" })
  @Permissions("saas.subscription.read")
  @Get()
  async getCurrentSubscription(@Req() req: AuthReq) {
    return this.saasService.getSubscription(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get subscription history" })
  @Permissions("saas.subscription.read")
  @Get("history")
  async getSubscriptionHistory(@Req() req: AuthReq) {
    return this.invoiceEngineService.getBillingHistory(req.user.tenantId).catch(() => []);
  }

  @ApiOperation({ summary: "Change plan" })
  @Permissions("saas.subscription.change")
  @Post("change-plan")
  async changePlan(@Req() req: AuthReq, @ZodBody(changePlanSchema) body: z.infer<typeof changePlanSchema>) {
    return this.billingService.changePlan(req.user.tenantId, body.planId, body.couponCode);
  }

  @ApiOperation({ summary: "Cancel subscription" })
  @Permissions("saas.subscription.cancel")
  @Post("cancel")
  async cancelSubscription(@Req() req: AuthReq) {
    return this.billingService.cancelSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: "Reactivate subscription" })
  @Permissions("saas.subscription.change")
  @Post("reactivate")
  async reactivateSubscription(@Req() _req: AuthReq) {
    return { success: true };
  }

  @ApiOperation({ summary: "Pause subscription" })
  @Permissions("saas.subscription.pause")
  @Post("pause")
  async pauseSubscription(@Req() _req: AuthReq) {
    return { success: true };
  }

  @ApiOperation({ summary: "Resume subscription" })
  @Permissions("saas.subscription.pause")
  @Post("resume")
  async resumeSubscription(@Req() _req: AuthReq) {
    return { success: true };
  }

  @ApiOperation({ summary: "Change billing period" })
  @Permissions("saas.subscription.change")
  @Patch("billing-period")
  async changeBillingPeriod(@Req() req: AuthReq, @ZodBody(changeBillingPeriodSchema) body: z.infer<typeof changeBillingPeriodSchema>) {
    return this.invoiceEngineService.scheduleRecurringInvoice(req.user.tenantId, {
      interval: body.period === "yearly" ? "YEARLY" : "MONTHLY",
    });
  }

  @ApiOperation({ summary: "Toggle auto renew" })
  @Permissions("saas.subscription.change")
  @Patch("auto-renew")
  async toggleAutoRenew(@Req() _req: AuthReq, @ZodBody(z.object({ enabled: z.boolean() })) body: { enabled: boolean }) {
    return { success: true, autoRenew: body.enabled };
  }

  @ApiOperation({ summary: "List receipts" })
  @Permissions("saas.invoice.read")
  @Get("receipts")
  async listReceipts(@Req() req: AuthReq) {
    return this.invoiceEngineService.listInvoices(req.user.tenantId, 1, 50, "PAID").catch(() => ({ items: [], total: 0 }));
  }

  @ApiOperation({ summary: "Get next bill preview" })
  @Permissions("saas.subscription.read")
  @Get("next-bill")
  async getNextBillPreview(@Req() req: AuthReq) {
    return this.invoiceEngineService.getUpcomingInvoices(req.user.tenantId).catch(() => null);
  }

  @ApiOperation({ summary: "Get trial info" })
  @Permissions("saas.subscription.read")
  @Get("trial")
  async getTrialInfo(@Req() req: AuthReq) {
    const sub = await this.saasService.getSubscription(req.user.tenantId).catch(() => null);
    return {
      isTrial: sub?.status === "TRIAL",
      trialEndsAt: sub?.trialEndsAt ?? null,
      daysRemaining: sub?.trialEndsAt ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0,
    };
  }

  @ApiOperation({ summary: "Extend trial [Admin]" })
  @Permissions("saas.subscription.manage")
  @Post("trial/extend")
  async extendTrial(@Req() _req: AuthReq, @ZodBody(extendTrialSchema) body: z.infer<typeof extendTrialSchema>) {
    return { success: true, extendedByDays: body.days };
  }

  @ApiOperation({ summary: "Get credits balance" })
  @Permissions("saas.subscription.read")
  @Get("credits")
  async getCreditsBalance(@Req() _req: AuthReq) {
    return { balance: 0, currency: "USD", lastUpdated: new Date() };
  }

  @ApiOperation({ summary: "Add credits [Admin]" })
  @Permissions("saas.subscription.manage")
  @Post("credits/add")
  async addCredits(@Req() _req: AuthReq, @ZodBody(addCreditsSchema) body: z.infer<typeof addCreditsSchema>) {
    return { success: true, amount: body.amount, description: body.description };
  }

  @ApiOperation({ summary: "Redeem coupon" })
  @Permissions("saas.subscription.change")
  @Post("coupon/redeem")
  async redeemCoupon(@Req() _req: AuthReq, @ZodBody(redeemCouponSchema) _body: z.infer<typeof redeemCouponSchema>) {
    return { success: true };
  }

  @ApiOperation({ summary: "Get savings report" })
  @Permissions("saas.subscription.read")
  @Get("savings")
  async getSavingsReport(@Req() _req: AuthReq) {
    return { totalSaved: 0, currency: "USD", breakdown: [] };
  }

  @ApiOperation({ summary: "Validate subscription access" })
  @Permissions("saas.subscription.read")
  @Post("validate")
  async validateSubscriptionAccess(@Req() req: AuthReq) {
    const sub = await this.saasService.getSubscription(req.user.tenantId).catch(() => null);
    return { valid: sub?.status === "ACTIVE" || sub?.status === "TRIAL", subscription: sub };
  }
}
