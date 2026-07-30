// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { SubscriptionsService } from "./subscriptions.service";
import { SubscriptionUsageService } from "./subscription-usage.service";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { SubscriptionDunningService } from "./subscription-dunning.service";
import { SubscriptionCouponService } from "./subscription-coupon.service";
import { SubscriptionCreditNoteService } from "./subscription-credit-note.service";
import { SubscriptionMigrationService } from "./subscription-migration.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

const bulkCreateSchema = z.object({
  subscriptions: z.array(
    z.object({
      name: z.string().min(1),
      customerId: z.string().optional(),
      productId: z.string().optional(),
      currency: z.string().default("USD"),
      unitAmount: z.number().nonnegative(),
      quantity: z.number().int().positive().default(1),
      billingPeriod: z.enum([
        "WEEKLY",
        "MONTHLY",
        "QUARTERLY",
        "SEMI_ANNUAL",
        "ANNUAL",
      ]),
      startDate: z.string().min(1),
    }),
  ),
});

const bulkUpdateStatusSchema = z.object({
  subscriptionIds: z.array(z.string().min(1)),
  action: z.enum(["activate", "pause", "cancel", "resume"]),
});

@ApiTags("subscriptions-bulk")
@ApiBearerAuth()
@Controller("subscriptions-bulk")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SubscriptionsBulkController {
  constructor(
    private readonly service: SubscriptionsService,
    private readonly usageService: SubscriptionUsageService,
    private readonly plansService: SubscriptionPlansService,
    private readonly dunningService: SubscriptionDunningService,
    private readonly couponService: SubscriptionCouponService,
    private readonly creditNoteService: SubscriptionCreditNoteService,
    private readonly migrationService: SubscriptionMigrationService,
  ) {}

  @Post("bulk-create")
  @Permissions("subscriptions.manage")
  @ApiOperation({ summary: "Bulk create subscriptions" })
  async bulkCreate(
    @Req() req: AuthReq,
    @ZodBody(bulkCreateSchema) body: z.infer<typeof bulkCreateSchema>,
  ) {
    const results: any[] = [];
    for (const sub of body.subscriptions) {
      try {
        const created = await this.service.create(
          req.user.tenantId,
          req.user.orgId || "default",
          { ...sub },
        );
        results.push({ name: sub.name, status: "created", id: created.id });
      } catch (e: any) {
        results.push({ name: sub.name, status: "error", message: e.message });
      }
    }
    return {
      results,
      succeeded: results.filter((r) => r.status === "created").length,
    };
  }

  @Post("bulk-status")
  @Permissions("subscriptions.manage")
  @ApiOperation({ summary: "Bulk update subscription status" })
  async bulkUpdateStatus(
    @Req() req: AuthReq,
    @ZodBody(bulkUpdateStatusSchema)
    body: z.infer<typeof bulkUpdateStatusSchema>,
  ) {
    const results: any[] = [];
    for (const id of body.subscriptionIds) {
      try {
        if (body.action === "pause")
          await this.service.pause(req.user.tenantId, id);
        else if (body.action === "resume")
          await this.service.resume(req.user.tenantId, id);
        else if (body.action === "cancel")
          await this.service.cancel(req.user.tenantId, id, true);
        else if (body.action === "activate")
          await this.service.activate(req.user.tenantId, id);
        results.push({ id, status: body.action + "d" });
      } catch (e: any) {
        results.push({ id, status: "error", message: e.message });
      }
    }
    return {
      results,
      succeeded: results.filter((r) => r.status.endsWith("d")).length,
    };
  }

  @Get("metrics/mrr")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "MRR breakdown" })
  async getMrrBreakdown(@Req() req: AuthReq) {
    return this.service.getMrrBreakdown(req.user.tenantId);
  }

  @Get("metrics/churn")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "Churn metrics" })
  async getChurnMetrics(@Req() req: AuthReq) {
    return this.service.getChurnCount(req.user.tenantId);
  }

  @Get("metrics/overview")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "Subscription overview metrics" })
  async getOverviewMetrics(@Req() req: AuthReq) {
    return this.service.getOverviewMetrics(req.user.tenantId);
  }

  @Get("coupons")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List coupons" })
  async getCoupons(@Req() req: AuthReq) {
    return this.couponService.getCoupons(req.user.tenantId);
  }

  @Post("coupons")
  @Permissions("subscriptions.manage")
  @ApiOperation({ summary: "Create coupon" })
  async createCoupon(@Req() req: AuthReq, @Body() body: any) {
    return this.couponService.createCouponSimple(req.user.tenantId, body);
  }

  @Get("dunning")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List dunning processes" })
  async getDunning(@Req() req: AuthReq) {
    return this.dunningService.getRules(req.user.tenantId);
  }

  @Get("credit-notes")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List credit notes" })
  async getCreditNotes(@Req() req: AuthReq) {
    return this.creditNoteService.getCreditNotes(req.user.tenantId);
  }

  @Post("credit-notes")
  @Permissions("subscriptions.manage")
  @ApiOperation({ summary: "Issue credit note" })
  async createCreditNote(@Req() req: AuthReq, @Body() body: any) {
    return this.creditNoteService.createCreditNoteSimple(
      req.user.tenantId,
      body,
    );
  }

  @Get("migrations")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List plan migrations" })
  async getMigrations(@Req() req: AuthReq) {
    return this.migrationService.getMigrations(req.user.tenantId);
  }

  @Get("plans/groups")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List plan groups" })
  async getPlanGroups(@Req() req: AuthReq) {
    return this.plansService.getPlanGroups(req.user.tenantId);
  }

  @Get("usage/summary")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "Usage summary" })
  async getUsageSummary(@Req() req: AuthReq) {
    return this.usageService.getUsageGroupByMetric(req.user.tenantId);
  }

  @Get("plans")
  @Permissions("subscriptions.read")
  @ApiOperation({ summary: "List all plans" })
  async getPlans(@Req() req: AuthReq) {
    return this.plansService.getPlanTiers(req.user.tenantId);
  }

  @Post("plans")
  @Permissions("subscriptions.manage")
  @ApiOperation({ summary: "Create plan" })
  async createPlan(@Req() req: AuthReq, @Body() body: any) {
    return this.plansService.createPlan(req.user.tenantId, body);
  }
}
