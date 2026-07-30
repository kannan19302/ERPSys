// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { SubscriptionCouponService } from "./subscription-coupon.service";
import { SubscriptionPlanGroupService } from "./subscription-plan-group.service";
import { SubscriptionMigrationService } from "./subscription-migration.service";
import { SubscriptionDunningService } from "./subscription-dunning.service";
import { SubscriptionCreditNoteService } from "./subscription-credit-note.service";
import { SubscriptionAutoScaleService } from "./subscription-auto-scale.service";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string; roles?: string[] };
}

const couponSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_MONTHS"]),
  discountValue: z.number().nonnegative(),
  maxRedemptions: z.number().int().optional(),
  appliesTo: z.string().optional(),
  planId: z.string().optional(),
  validFrom: z.string().min(1),
  validUntil: z.string().optional(),
});
const redeemSchema = z.object({ couponCode: z.string().min(1) });
const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const migrateSchema = z.object({
  toPlanTierId: z.string().min(1),
  effectiveDate: z.string().min(1),
  reason: z.string().optional(),
});
const dunningSchema = z.object({
  name: z.string().min(1),
  invoiceStatus: z.string().min(1),
  daysOverdue: z.number().int(),
  action: z.string().min(1),
  lateFeeType: z.string().optional(),
  lateFeeValue: z.number().optional(),
  sendEmail: z.boolean().optional(),
  emailTemplateId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
const creditNoteSchema = z.object({
  creditNoteNo: z.string().min(1),
  amount: z.number().nonnegative(),
  reason: z.string().min(1),
  reasonCategory: z.string().min(1),
  invoiceId: z.string().optional(),
});
const autoScaleSchema = z.object({
  name: z.string().min(1),
  subscriptionId: z.string().optional(),
  metricName: z.string().min(1),
  thresholdType: z.enum(["ABOVE", "BELOW"]),
  thresholdValue: z.number(),
  scaleAction: z.string().min(1),
  scaleAmount: z.number().int().optional(),
  coolDownMinutes: z.number().int().optional(),
});

@ApiTags("subscriptions-deep")
@ApiBearerAuth()
@Controller("subscriptions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SubscriptionsDeepController {
  constructor(
    private readonly couponService: SubscriptionCouponService,
    private readonly planGroupService: SubscriptionPlanGroupService,
    private readonly migrationService: SubscriptionMigrationService,
    private readonly dunningService: SubscriptionDunningService,
    private readonly creditNoteService: SubscriptionCreditNoteService,
    private readonly autoScaleService: SubscriptionAutoScaleService,
  ) {}

  // Coupons
  @Get("coupons")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List subscription coupons" })
  async getCoupons(@Req() req: AuthReq) {
    return this.couponService.getCoupons(req.user.tenantId);
  }

  @Post("coupons")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Create coupon" })
  async createCoupon(@Req() req: AuthReq, @ZodBody(couponSchema) body: any) {
    return this.couponService.createCoupon(req.user.tenantId, body);
  }

  @Put("coupons/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Update coupon" })
  async updateCoupon(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(couponSchema.partial()) body: any,
  ) {
    return this.couponService.updateCoupon(req.user.tenantId, id, body);
  }

  @Delete("coupons/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Delete coupon" })
  async deleteCoupon(@Req() req: AuthReq, @Param("id") id: string) {
    return this.couponService.deleteCoupon(req.user.tenantId, id);
  }

  @Post(":id/redeem")
  @Permissions("finance.subscription.update")
  @ApiOperation({ summary: "Redeem coupon on subscription" })
  async redeemCoupon(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(redeemSchema) body: any,
  ) {
    return this.couponService.redeemCoupon(
      req.user.tenantId,
      body.couponCode,
      id,
    );
  }

  @Get("coupons/redemptions")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List coupon redemptions" })
  async getRedemptions(
    @Req() req: AuthReq,
    @Query("couponId") couponId?: string,
  ) {
    return this.couponService.getRedemptions(req.user.tenantId, couponId);
  }

  // Plan Groups
  @Get("plan-groups")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List plan groups" })
  async getPlanGroups(@Req() req: AuthReq) {
    return this.planGroupService.getGroups(req.user.tenantId);
  }

  @Post("plan-groups")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Create plan group" })
  async createPlanGroup(@Req() req: AuthReq, @ZodBody(groupSchema) body: any) {
    return this.planGroupService.createGroup(req.user.tenantId, body);
  }

  @Put("plan-groups/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Update plan group" })
  async updatePlanGroup(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(groupSchema.partial()) body: any,
  ) {
    return this.planGroupService.updateGroup(req.user.tenantId, id, body);
  }

  @Delete("plan-groups/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Delete plan group" })
  async deletePlanGroup(@Req() req: AuthReq, @Param("id") id: string) {
    return this.planGroupService.deleteGroup(req.user.tenantId, id);
  }

  // Migrations
  @Get(":id/migrations")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "Get migration history for subscription" })
  async getMigrations(@Req() req: AuthReq, @Param("id") id: string) {
    return this.migrationService.getMigrations(req.user.tenantId, id);
  }

  @Post(":id/migrate")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Migrate subscription to another plan" })
  async migrate(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(migrateSchema) body: any,
  ) {
    return this.migrationService.migrate(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  @Get("migrations/stats")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "Get migration statistics" })
  async getMigrationStats(@Req() req: AuthReq) {
    return this.migrationService.getMigrationStats(req.user.tenantId);
  }

  // Dunning Rules
  @Get("dunning-rules")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List dunning rules" })
  async getDunningRules(@Req() req: AuthReq) {
    return this.dunningService.getRules(req.user.tenantId);
  }

  @Post("dunning-rules")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Create dunning rule" })
  async createDunningRule(
    @Req() req: AuthReq,
    @ZodBody(dunningSchema) body: any,
  ) {
    return this.dunningService.createRule(req.user.tenantId, body);
  }

  @Put("dunning-rules/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Update dunning rule" })
  async updateDunningRule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(dunningSchema.partial()) body: any,
  ) {
    return this.dunningService.updateRule(req.user.tenantId, id, body);
  }

  @Delete("dunning-rules/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Delete dunning rule" })
  async deleteDunningRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.dunningService.deleteRule(req.user.tenantId, id);
  }

  @Get("overdue-invoices")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List overdue subscription invoices" })
  async getOverdueInvoices(@Req() req: AuthReq) {
    return this.dunningService.getOverdueInvoices(req.user.tenantId);
  }

  // Credit Notes
  @Get(":id/credit-notes")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List credit notes for subscription" })
  async getCreditNotes(@Req() req: AuthReq, @Param("id") id: string) {
    return this.creditNoteService.getCreditNotes(req.user.tenantId, id);
  }

  @Post(":id/credit-notes")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Create credit note" })
  async createCreditNote(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(creditNoteSchema) body: any,
  ) {
    return this.creditNoteService.createCreditNote(
      req.user.tenantId,
      id,
      req.user.userId,
      body,
    );
  }

  @Post("credit-notes/:cnId/apply")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Apply credit note" })
  async applyCreditNote(@Req() req: AuthReq, @Param("cnId") cnId: string) {
    return this.creditNoteService.applyCreditNote(req.user.tenantId, cnId);
  }

  @Post("credit-notes/:cnId/void")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Void credit note" })
  async voidCreditNote(@Req() req: AuthReq, @Param("cnId") cnId: string) {
    return this.creditNoteService.voidCreditNote(req.user.tenantId, cnId);
  }

  @Get("credit-notes/summary")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "Get credit note summary" })
  async getCreditNoteSummary(@Req() req: AuthReq) {
    return this.creditNoteService.getCreditNoteSummary(req.user.tenantId);
  }

  // Auto-Scale Rules
  @Get("auto-scale-rules")
  @Permissions("finance.subscription.read")
  @ApiOperation({ summary: "List auto-scale rules" })
  async getAutoScaleRules(
    @Req() req: AuthReq,
    @Query("subscriptionId") subscriptionId?: string,
  ) {
    return this.autoScaleService.getRules(req.user.tenantId, subscriptionId);
  }

  @Post("auto-scale-rules")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Create auto-scale rule" })
  async createAutoScaleRule(
    @Req() req: AuthReq,
    @ZodBody(autoScaleSchema) body: any,
  ) {
    return this.autoScaleService.createRule(req.user.tenantId, body);
  }

  @Put("auto-scale-rules/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Update auto-scale rule" })
  async updateAutoScaleRule(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(autoScaleSchema.partial()) body: any,
  ) {
    return this.autoScaleService.updateRule(req.user.tenantId, id, body);
  }

  @Delete("auto-scale-rules/:id")
  @Permissions("finance.subscription.manage")
  @ApiOperation({ summary: "Delete auto-scale rule" })
  async deleteAutoScaleRule(@Req() req: AuthReq, @Param("id") id: string) {
    return this.autoScaleService.deleteRule(req.user.tenantId, id);
  }
}
