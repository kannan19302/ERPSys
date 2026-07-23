import { Controller, Get, Post, Patch, Param, UseGuards, Req, Query } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { SalesSubscriptionService } from "./sales-subscription.service";
import { createSubscriptionSchema, updateSubscriptionSchema, recordSubscriptionUsageSchema, sendDunningSchema, CreateSubscriptionDto, UpdateSubscriptionDto, RecordSubscriptionUsageDto, SendDunningDto } from "./dto/sales-extra.dto";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request { user: { tenantId: string; userId: string; orgId?: string } }

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales/subscriptions")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesSubscriptionController {
  constructor(private readonly service: SalesSubscriptionService) {}

  @Get()
  @Permissions("sales.subscription.read")
  @ApiOperation({ summary: "List subscriptions" })
  async getAll(@Req() req: AuthReq, @Query("status") status?: string) {
    return this.service.getSubscriptions(req.user.tenantId, status);
  }

  @Get("analytics")
  @Permissions("sales.subscription.read")
  @ApiOperation({ summary: "Subscription analytics" })
  async analytics(@Req() req: AuthReq) {
    return this.service.getSubscriptionAnalytics(req.user.tenantId);
  }

  @Get(":id")
  @Permissions("sales.subscription.read")
  @ApiOperation({ summary: "Get subscription by id" })
  async getById(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.getSubscriptionById(req.user.tenantId, id);
  }

  @Post()
  @Permissions("sales.subscription.create")
  @ApiOperation({ summary: "Create subscription" })
  async create(@Req() req: AuthReq, @ZodBody(createSubscriptionSchema) dto: CreateSubscriptionDto) {
    const orgId = req.user.orgId || "org-system-default";
    return this.service.createSubscription(req.user.tenantId, orgId, dto);
  }

  @Patch(":id")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Update subscription" })
  async update(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(updateSubscriptionSchema) dto: UpdateSubscriptionDto) {
    return this.service.updateSubscription(req.user.tenantId, id, dto);
  }

  @Post(":id/cancel")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Cancel subscription" })
  async cancel(@Req() req: AuthReq, @Param("id") id: string, @Query("atPeriodEnd") atPeriodEnd?: string) {
    return this.service.cancelSubscription(req.user.tenantId, id, atPeriodEnd !== "false");
  }

  @Post(":id/pause")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Pause subscription" })
  async pause(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.pauseSubscription(req.user.tenantId, id);
  }

  @Post(":id/resume")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Resume subscription" })
  async resume(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.resumeSubscription(req.user.tenantId, id);
  }

  @Post(":id/usage")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Record usage metering" })
  async recordUsage(@Req() req: AuthReq, @Param("id") id: string, @ZodBody(recordSubscriptionUsageSchema) dto: RecordSubscriptionUsageDto) {
    return this.service.recordUsage(req.user.tenantId, id, dto);
  }

  @Get(":id/usage")
  @Permissions("sales.subscription.read")
  @ApiOperation({ summary: "Get usage metrics" })
  async getUsage(@Req() req: AuthReq, @Param("id") id: string, @Query("period") period?: string) {
    return this.service.getUsageMetrics(req.user.tenantId, id, period);
  }

  @Post(":id/generate-invoice")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Generate recurring invoice" })
  async generateInvoice(@Req() req: AuthReq, @Param("id") id: string) {
    return this.service.generateRecurringInvoice(req.user.tenantId, id);
  }

  @Post("dunning")
  @Permissions("sales.subscription.update")
  @ApiOperation({ summary: "Run dunning process" })
  async dunning(@Req() req: AuthReq, @ZodBody(sendDunningSchema) dto: SendDunningDto) {
    return this.service.dunningProcess(req.user.tenantId, dto.invoiceIds);
  }
}
