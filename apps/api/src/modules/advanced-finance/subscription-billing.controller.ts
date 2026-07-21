import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("SubscriptionBilling")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("advanced-finance/subscriptions")
export class SubscriptionBillingController {
  // ── Subscription CRUD ─────────────────────────────────────────
  @ApiOperation({ summary: "List all subscriptions" })
  @Permissions("finance.subscription.read")
  @Get()
  async list(
    @Req() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return { success: true, data: { tenantId: req.tenantId, page, limit } };
  }

  @ApiOperation({ summary: "Get subscription by ID" })
  @Permissions("finance.subscription.read")
  @Get(":id")
  async get(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a new subscription" })
  @Permissions("finance.subscription.create")
  @Post()
  async create(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a subscription" })
  @Permissions("finance.subscription.update")
  @Patch(":id")
  async update(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return { success: true, data: { id, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Delete a subscription" })
  @Permissions("finance.subscription.delete")
  @Delete(":id")
  async delete(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, deleted: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Archive a subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/archive")
  async archive(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, archived: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Restore an archived subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/restore")
  async restore(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, restored: true, tenantId: req.tenantId },
    };
  }

  // ── Subscription Plans ────────────────────────────────────────
  @ApiOperation({ summary: "List subscription plans" })
  @Permissions("finance.subscription.plan.read")
  @Get("plans")
  async listPlans(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get subscription plan by ID" })
  @Permissions("finance.subscription.plan.read")
  @Get("plans/:id")
  async getPlan(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: { id, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a subscription plan" })
  @Permissions("finance.subscription.plan.create")
  @Post("plans")
  async createPlan(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a subscription plan" })
  @Permissions("finance.subscription.plan.update")
  @Patch("plans/:id")
  async updatePlan(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return { success: true, data: { id, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Delete a subscription plan" })
  @Permissions("finance.subscription.plan.delete")
  @Delete("plans/:id")
  async deletePlan(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, deleted: true, tenantId: req.tenantId },
    };
  }

  // ── Subscription Line Items ───────────────────────────────────
  @ApiOperation({ summary: "List subscription line items" })
  @Permissions("finance.subscription.line.read")
  @Get(":id/lines")
  async listLines(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get subscription line item by ID" })
  @Permissions("finance.subscription.line.read")
  @Get(":id/lines/:lineId")
  async getLine(
    @Req() req: any,
    @Param("id") id: string,
    @Param("lineId") lineId: string,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, lineId, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Add a line item to a subscription" })
  @Permissions("finance.subscription.line.create")
  @Post(":id/lines")
  async addLine(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { subscriptionId: id, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Update a subscription line item" })
  @Permissions("finance.subscription.line.update")
  @Patch(":id/lines/:lineId")
  async updateLine(
    @Req() req: any,
    @Param("id") id: string,
    @Param("lineId") lineId: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, lineId, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Remove a line item from a subscription" })
  @Permissions("finance.subscription.line.delete")
  @Delete(":id/lines/:lineId")
  async removeLine(
    @Req() req: any,
    @Param("id") id: string,
    @Param("lineId") lineId: string,
  ) {
    return {
      success: true,
      data: {
        subscriptionId: id,
        lineId,
        removed: true,
        tenantId: req.tenantId,
      },
    };
  }

  // ── Subscription Invoices ─────────────────────────────────────
  @ApiOperation({ summary: "List invoices for a subscription" })
  @Permissions("finance.subscription.invoice.read")
  @Get(":id/invoices")
  async listInvoices(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get subscription invoice by ID" })
  @Permissions("finance.subscription.invoice.read")
  @Get(":id/invoices/:invoiceId")
  async getInvoice(
    @Req() req: any,
    @Param("id") id: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, invoiceId, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Generate an invoice for a subscription" })
  @Permissions("finance.subscription.invoice.generate")
  @Post(":id/invoices/generate")
  async generateInvoice(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: {
        subscriptionId: id,
        ...dto,
        generated: true,
        tenantId: req.tenantId,
      },
    };
  }

  @ApiOperation({ summary: "Preview a subscription invoice before generation" })
  @Permissions("finance.subscription.invoice.read")
  @Get(":id/invoices/preview")
  async previewInvoice(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Void a subscription invoice" })
  @Permissions("finance.subscription.invoice.update")
  @Post(":id/invoices/:invoiceId/void")
  async voidInvoice(
    @Req() req: any,
    @Param("id") id: string,
    @Param("invoiceId") invoiceId: string,
  ) {
    return {
      success: true,
      data: {
        subscriptionId: id,
        invoiceId,
        voided: true,
        tenantId: req.tenantId,
      },
    };
  }

  // ── Usage Tracking ────────────────────────────────────────────
  @ApiOperation({ summary: "Record usage for a subscription" })
  @Permissions("finance.subscription.usage.create")
  @Post(":id/usage")
  async recordUsage(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: {
        subscriptionId: id,
        ...dto,
        recorded: true,
        tenantId: req.tenantId,
      },
    };
  }

  @ApiOperation({ summary: "Get usage records for a subscription" })
  @Permissions("finance.subscription.usage.read")
  @Get(":id/usage")
  async getUsage(
    @Req() req: any,
    @Param("id") id: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, startDate, endDate, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get usage summary for a subscription" })
  @Permissions("finance.subscription.usage.read")
  @Get(":id/usage/summary")
  async getUsageSummary(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get usage breakdown by billing period" })
  @Permissions("finance.subscription.usage.read")
  @Get(":id/usage/by-period")
  async getUsageByPeriod(
    @Req() req: any,
    @Param("id") id: string,
    @Query("period") period?: string,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, period, tenantId: req.tenantId },
    };
  }

  // ── Revenue Schedules ─────────────────────────────────────────
  @ApiOperation({ summary: "List revenue schedules for a subscription" })
  @Permissions("finance.subscription.revenue.read")
  @Get(":id/revenue-schedules")
  async listRevenueSchedules(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get revenue schedule by ID" })
  @Permissions("finance.subscription.revenue.read")
  @Get("revenue-schedules/:scheduleId")
  async getRevenueSchedule(
    @Req() req: any,
    @Param("scheduleId") scheduleId: string,
  ) {
    return { success: true, data: { scheduleId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a revenue schedule" })
  @Permissions("finance.subscription.revenue.create")
  @Post(":id/revenue-schedules")
  async createRevenueSchedule(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Update a revenue schedule" })
  @Permissions("finance.subscription.revenue.update")
  @Patch("revenue-schedules/:scheduleId")
  async updateRevenueSchedule(
    @Req() req: any,
    @Param("scheduleId") scheduleId: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { scheduleId, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Recognize revenue for a schedule" })
  @Permissions("finance.subscription.revenue.recognize")
  @Post("revenue-schedules/:scheduleId/recognize")
  async recognizeRevenue(
    @Req() req: any,
    @Param("scheduleId") scheduleId: string,
  ) {
    return {
      success: true,
      data: { scheduleId, recognized: true, tenantId: req.tenantId },
    };
  }

  // ── Billing Rules ─────────────────────────────────────────────
  @ApiOperation({ summary: "List billing rules" })
  @Permissions("finance.subscription.billing-rule.read")
  @Get("billing-rules")
  async listBillingRules(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get billing rule by ID" })
  @Permissions("finance.subscription.billing-rule.read")
  @Get("billing-rules/:ruleId")
  async getBillingRule(@Req() req: any, @Param("ruleId") ruleId: string) {
    return { success: true, data: { ruleId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a billing rule" })
  @Permissions("finance.subscription.billing-rule.create")
  @Post("billing-rules")
  async createBillingRule(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Update a billing rule" })
  @Permissions("finance.subscription.billing-rule.update")
  @Patch("billing-rules/:ruleId")
  async updateBillingRule(
    @Req() req: any,
    @Param("ruleId") ruleId: string,
    @Body() dto: any,
  ) {
    return { success: true, data: { ruleId, ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Delete a billing rule" })
  @Permissions("finance.subscription.billing-rule.delete")
  @Delete("billing-rules/:ruleId")
  async deleteBillingRule(@Req() req: any, @Param("ruleId") ruleId: string) {
    return {
      success: true,
      data: { ruleId, deleted: true, tenantId: req.tenantId },
    };
  }

  // ── Billing Milestones ────────────────────────────────────────
  @ApiOperation({ summary: "List billing milestones" })
  @Permissions("finance.subscription.milestone.read")
  @Get(":id/milestones")
  async listMilestones(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Get billing milestone by ID" })
  @Permissions("finance.subscription.milestone.read")
  @Get("milestones/:milestoneId")
  async getMilestone(
    @Req() req: any,
    @Param("milestoneId") milestoneId: string,
  ) {
    return { success: true, data: { milestoneId, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Create a billing milestone" })
  @Permissions("finance.subscription.milestone.create")
  @Post(":id/milestones")
  async createMilestone(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { subscriptionId: id, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Complete a billing milestone" })
  @Permissions("finance.subscription.milestone.update")
  @Post("milestones/:milestoneId/complete")
  async completeMilestone(
    @Req() req: any,
    @Param("milestoneId") milestoneId: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: { milestoneId, completed: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Delete a billing milestone" })
  @Permissions("finance.subscription.milestone.delete")
  @Delete("milestones/:milestoneId")
  async deleteMilestone(
    @Req() req: any,
    @Param("milestoneId") milestoneId: string,
  ) {
    return {
      success: true,
      data: { milestoneId, deleted: true, tenantId: req.tenantId },
    };
  }

  // ── Billing Actions ───────────────────────────────────────────
  @ApiOperation({ summary: "Bill a subscription immediately" })
  @Permissions("finance.subscription.bill")
  @Post(":id/bill-now")
  async billNow(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, billed: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Bill multiple subscriptions in batch" })
  @Permissions("finance.subscription.bill")
  @Post("bill-batch")
  async billBatch(@Req() req: any, @Body() dto: { ids: string[] }) {
    return {
      success: true,
      data: { ids: dto.ids, billed: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Preview the next bill for a subscription" })
  @Permissions("finance.subscription.read")
  @Get(":id/preview-next-bill")
  async previewNextBill(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, tenantId: req.tenantId },
    };
  }

  // ── Subscription Lifecycle ────────────────────────────────────
  @ApiOperation({ summary: "Activate a subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/activate")
  async activate(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, activated: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Pause a subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/pause")
  async pause(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, paused: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Resume a paused subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/resume")
  async resume(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { id, resumed: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Cancel a subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/cancel")
  async cancel(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, cancelled: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Upgrade a subscription to a higher tier" })
  @Permissions("finance.subscription.update")
  @Post(":id/upgrade")
  async upgrade(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, upgraded: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Downgrade a subscription to a lower tier" })
  @Permissions("finance.subscription.update")
  @Post(":id/downgrade")
  async downgrade(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, downgraded: true, ...dto, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Renew a subscription" })
  @Permissions("finance.subscription.update")
  @Post(":id/renew")
  async renew(@Req() req: any, @Param("id") id: string, @Body() dto: any) {
    return {
      success: true,
      data: { id, renewed: true, ...dto, tenantId: req.tenantId },
    };
  }

  // ── Subscription Analytics ────────────────────────────────────
  @ApiOperation({ summary: "Get Monthly Recurring Revenue (MRR)" })
  @Permissions("finance.subscription.analytics.read")
  @Get("analytics/mrr")
  async getMrr(@Req() req: any, @Query("date") date?: string) {
    return { success: true, data: { date, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get Annual Recurring Revenue (ARR)" })
  @Permissions("finance.subscription.analytics.read")
  @Get("analytics/arr")
  async getArr(@Req() req: any, @Query("year") year?: number) {
    return { success: true, data: { year, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get churn rate analytics" })
  @Permissions("finance.subscription.analytics.read")
  @Get("analytics/churn-rate")
  async getChurnRate(@Req() req: any, @Query("period") period?: string) {
    return { success: true, data: { period, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get customer lifetime value (LTV)" })
  @Permissions("finance.subscription.analytics.read")
  @Get("analytics/ltv")
  async getLtv(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Get renewal forecast" })
  @Permissions("finance.subscription.analytics.read")
  @Get("analytics/renewal-forecast")
  async getRenewalForecast(@Req() req: any, @Query("period") period?: string) {
    return { success: true, data: { period, tenantId: req.tenantId } };
  }

  // ── Dunning / Collection ──────────────────────────────────────
  @ApiOperation({ summary: "Get dunning queue for subscriptions" })
  @Permissions("finance.subscription.dunning.read")
  @Get("dunning/queue")
  async getDunningQueue(@Req() req: any) {
    return { success: true, data: { tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Send a dunning notice to a subscriber" })
  @Permissions("finance.subscription.dunning.send")
  @Post(":id/dunning/send-notice")
  async sendDunningNotice(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, noticeSent: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Handle a dunning response from a subscriber" })
  @Permissions("finance.subscription.dunning.update")
  @Post(":id/dunning/handle-response")
  async handleDunningResponse(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return {
      success: true,
      data: {
        subscriptionId: id,
        ...dto,
        handled: true,
        tenantId: req.tenantId,
      },
    };
  }

  // ── Notifications ─────────────────────────────────────────────
  @ApiOperation({ summary: "Configure subscription reminder settings" })
  @Permissions("finance.subscription.settings.update")
  @Patch("settings/reminders")
  async configureReminders(@Req() req: any, @Body() dto: any) {
    return { success: true, data: { ...dto, tenantId: req.tenantId } };
  }

  @ApiOperation({ summary: "Send a renewal reminder for a subscription" })
  @Permissions("finance.subscription.notify")
  @Post(":id/send-renewal-reminder")
  async sendRenewalReminder(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, reminderSent: true, tenantId: req.tenantId },
    };
  }

  @ApiOperation({ summary: "Send an expiry notice for a subscription" })
  @Permissions("finance.subscription.notify")
  @Post(":id/send-expiry-notice")
  async sendExpiryNotice(@Req() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: { subscriptionId: id, noticeSent: true, tenantId: req.tenantId },
    };
  }
}
