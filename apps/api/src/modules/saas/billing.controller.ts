import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantInterceptor } from "../../common/guards/tenant.interceptor";
import { BillingService } from "./billing.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("saas")
@ApiBearerAuth()
@Controller("billing")
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiOperation({ summary: "Get current subscription" })
  @Permissions("saas.read")
  @Get("subscription")
  async getCurrentSubscription(@Req() req: AuthReq) {
    return this.billingService.getCurrentSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: "Create checkout" })
  @Permissions("saas.create")
  @Post("checkout")
  async createCheckout(
    @Req() req: AuthReq,
    @ZodBody(z.any())
    body: { planId: string; successUrl: string; couponCode?: string },
  ) {
    return this.billingService.createCheckoutSession(
      req.user.tenantId,
      body.planId,
      body.successUrl,
      body.couponCode,
    );
  }

  @ApiOperation({ summary: "Change plan" })
  @Permissions("saas.create")
  @Post("change-plan")
  async changePlan(
    @Req() req: AuthReq,
    @ZodBody(z.any()) body: { planId: string },
  ) {
    return this.billingService.changePlan(req.user.tenantId, body.planId);
  }

  @ApiOperation({ summary: "Cancel subscription" })
  @Permissions("saas.create")
  @Post("cancel")
  async cancelSubscription(@Req() req: AuthReq) {
    return this.billingService.cancelSubscription(req.user.tenantId);
  }

  @ApiOperation({ summary: "Get usage" })
  @Permissions("saas.read")
  @Get("usage")
  async getUsage(@Req() req: AuthReq) {
    return this.billingService.getUsageSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: "Run billing CRON (admin/system)" })
  @Permissions("saas.create")
  @Post("cron-run")
  async triggerBillingCron() {
    await this.billingService.runDailyRenewal();
    return { success: true, message: "Billing cron executed successfully" };
  }
}
