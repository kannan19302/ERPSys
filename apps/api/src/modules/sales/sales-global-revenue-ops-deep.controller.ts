// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SalesGlobalRevenueOpsDeepService } from "./sales-global-revenue-ops-deep.service";

@ApiTags("Sales Global Revenue Ops")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("sales/global-revenue-ops")
export class SalesGlobalRevenueOpsDeepController {
  constructor(
    private readonly revOpsService: SalesGlobalRevenueOpsDeepService,
  ) {}

  // 1. Global Revenue & Multi-Currency
  @Get("forecast/global")
  @ApiOperation({ summary: "Get global revenue forecast" })
  @Permissions("sales.revops.read")
  async getGlobalRevenueForecast(
    @CurrentUser() user: any,
    @Query("currency") currency?: string,
  ) {
    return this.revOpsService.getGlobalRevenueForecast(user.tenantId, currency);
  }

  @Post("fx-overrides")
  @ApiOperation({ summary: "Set exchange rate override" })
  @Permissions("sales.revops.admin")
  async setExchangeRateOverride(@CurrentUser() user: any, @Body() body: any) {
    return this.revOpsService.setExchangeRateOverride(
      user.tenantId,
      body?.fromCurrency,
      body?.toCurrency,
      body?.rate,
    );
  }

  @Get("fx-overrides")
  @ApiOperation({ summary: "Get exchange rate overrides" })
  @Permissions("sales.revops.read")
  async getExchangeRateOverrides(@CurrentUser() user: any) {
    return this.revOpsService.getExchangeRateOverrides(user.tenantId);
  }

  @Delete("fx-overrides/:from/:to")
  @ApiOperation({ summary: "Delete exchange rate override" })
  @Permissions("sales.revops.admin")
  async deleteExchangeRateOverride(
    @CurrentUser() user: any,
    @Param("from") from: string,
    @Param("to") to: string,
  ) {
    return this.revOpsService.deleteExchangeRateOverride(
      user.tenantId,
      from,
      to,
    );
  }

  @Post("tax/calculate")
  @ApiOperation({ summary: "Calculate tax for sales order" })
  @Permissions("sales.tax.read")
  async calculateTaxForSalesOrder(
    @CurrentUser() user: any,
    @Body() orderData: any,
  ) {
    return this.revOpsService.calculateTaxForSalesOrder(
      user.tenantId,
      orderData,
    );
  }

  @Get("tax/exemption-certificates/:customerId")
  @ApiOperation({ summary: "Get tax exemption certificates" })
  @Permissions("sales.tax.read")
  async getTaxExemptionCertificates(
    @CurrentUser() user: any,
    @Param("customerId") customerId: string,
  ) {
    return this.revOpsService.getTaxExemptionCertificates(
      user.tenantId,
      customerId,
    );
  }

  @Post("tax/exemption-certificates/:customerId")
  @ApiOperation({ summary: "Upload tax exemption certificate" })
  @Permissions("sales.tax.update")
  async uploadTaxExemptionCertificate(
    @CurrentUser() user: any,
    @Param("customerId") customerId: string,
    @Body() certData: any,
  ) {
    return this.revOpsService.uploadTaxExemptionCertificate(
      user.tenantId,
      customerId,
      certData,
    );
  }

  @Post("tax/exemption-certificates/:id/verify")
  @ApiOperation({ summary: "Verify tax exemption certificate" })
  @Permissions("sales.tax.admin")
  async verifyTaxExemptionCertificate(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.revOpsService.verifyTaxExemptionCertificate(
      user.tenantId,
      id,
      body?.status,
    );
  }

  @Delete("tax/exemption-certificates/:id")
  @ApiOperation({ summary: "Delete tax exemption certificate" })
  @Permissions("sales.tax.admin")
  async deleteTaxExemptionCertificate(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.revOpsService.deleteTaxExemptionCertificate(user.tenantId, id);
  }

  @Get("compliance/cross-border")
  @ApiOperation({ summary: "Get cross border sales compliance" })
  @Permissions("sales.revops.read")
  async getCrossBorderSalesCompliance(
    @CurrentUser() user: any,
    @Query("country") country: string,
  ) {
    return this.revOpsService.getCrossBorderSalesCompliance(
      user.tenantId,
      country,
    );
  }

  @Post("compensation-plans")
  @ApiOperation({ summary: "Set RevOps compensation plan" })
  @Permissions("sales.comp.admin")
  async setRevOpsCompensationPlan(
    @CurrentUser() user: any,
    @Body() planData: any,
  ) {
    return this.revOpsService.setRevOpsCompensationPlan(
      user.tenantId,
      planData,
    );
  }

  @Get("compensation-plans")
  @ApiOperation({ summary: "Get RevOps compensation plans" })
  @Permissions("sales.comp.read")
  async getRevOpsCompensationPlans(@CurrentUser() user: any) {
    return this.revOpsService.getRevOpsCompensationPlans(user.tenantId);
  }

  @Get("compensation-plans/:id")
  @ApiOperation({ summary: "Get RevOps compensation plan by ID" })
  @Permissions("sales.comp.read")
  async getRevOpsCompensationPlanById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.revOpsService.getRevOpsCompensationPlanById(user.tenantId, id);
  }

  @Patch("compensation-plans/:id")
  @ApiOperation({ summary: "Update RevOps compensation plan" })
  @Permissions("sales.comp.admin")
  async updateRevOpsCompensationPlan(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() planData: any,
  ) {
    return this.revOpsService.updateRevOpsCompensationPlan(
      user.tenantId,
      id,
      planData,
    );
  }

  @Delete("compensation-plans/:id")
  @ApiOperation({ summary: "Delete RevOps compensation plan" })
  @Permissions("sales.comp.admin")
  async deleteRevOpsCompensationPlan(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.revOpsService.deleteRevOpsCompensationPlan(user.tenantId, id);
  }

  @Post("compensation-plans/:planId/assign/:repId")
  @ApiOperation({ summary: "Assign compensation plan to rep" })
  @Permissions("sales.comp.admin")
  async assignCompensationPlanToRep(
    @CurrentUser() user: any,
    @Param("planId") planId: string,
    @Param("repId") repId: string,
    @Body() body: any,
  ) {
    return this.revOpsService.assignCompensationPlanToRep(
      user.tenantId,
      planId,
      repId,
      body?.effectiveDate,
    );
  }

  @Get("commissions/payout/:repId")
  @ApiOperation({ summary: "Calculate rep commission payout" })
  @Permissions("sales.comp.read")
  async calculateRepCommissionPayout(
    @CurrentUser() user: any,
    @Param("repId") repId: string,
    @Query("period") period: string,
  ) {
    return this.revOpsService.calculateRepCommissionPayout(
      user.tenantId,
      repId,
      period,
    );
  }

  @Get("commissions/team-rollup/:teamId")
  @ApiOperation({ summary: "Get team commission rollup" })
  @Permissions("sales.comp.read")
  async getTeamCommissionRollup(
    @CurrentUser() user: any,
    @Param("teamId") teamId: string,
    @Query("period") period: string,
  ) {
    return this.revOpsService.getTeamCommissionRollup(
      user.tenantId,
      teamId,
      period,
    );
  }

  @Get("commissions/export")
  @ApiOperation({ summary: "Export commission payout report" })
  @Permissions("sales.comp.read")
  async exportCommissionPayoutReport(
    @CurrentUser() user: any,
    @Query("period") period: string,
  ) {
    return this.revOpsService.exportCommissionPayoutReport(
      user.tenantId,
      period,
    );
  }

  @Post("commissions/disputes")
  @ApiOperation({ summary: "Dispute commission payout" })
  @Permissions("sales.comp.update")
  async disputeCommissionPayout(@CurrentUser() user: any, @Body() body: any) {
    return this.revOpsService.disputeCommissionPayout(
      user.tenantId,
      user.userId,
      body?.payoutId,
      body?.reason,
    );
  }

  @Get("commissions/disputes")
  @ApiOperation({ summary: "Get commission disputes" })
  @Permissions("sales.comp.read")
  async getCommissionDisputes(@CurrentUser() user: any) {
    return this.revOpsService.getCommissionDisputes(user.tenantId);
  }

  @Post("commissions/disputes/:id/resolve")
  @ApiOperation({ summary: "Resolve commission dispute" })
  @Permissions("sales.comp.admin")
  async resolveCommissionDispute(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() resolution: any,
  ) {
    return this.revOpsService.resolveCommissionDispute(
      user.tenantId,
      id,
      resolution,
    );
  }

  @Get("revenue-leakage/audit")
  @ApiOperation({ summary: "Get revenue leakage audit" })
  @Permissions("sales.revops.read")
  async getRevenueLeakageAudit(@CurrentUser() user: any) {
    return this.revOpsService.getRevenueLeakageAudit(user.tenantId);
  }

  @Post("revenue-leakage/fix/:itemId")
  @ApiOperation({ summary: "Fix revenue leakage item" })
  @Permissions("sales.revops.admin")
  async fixRevenueLeakageItem(
    @CurrentUser() user: any,
    @Param("itemId") itemId: string,
  ) {
    return this.revOpsService.fixRevenueLeakageItem(user.tenantId, itemId);
  }

  @Get("capacity-planning")
  @ApiOperation({ summary: "Get RevOps capacity planning" })
  @Permissions("sales.revops.read")
  async getRevOpsCapacityPlanning(@CurrentUser() user: any) {
    return this.revOpsService.getRevOpsCapacityPlanning(user.tenantId);
  }

  // 2. Sales Audit & Order Splits
  @Get("audit-trail")
  @ApiOperation({ summary: "Get sales operations audit trail" })
  @Permissions("sales.audit.read")
  async getSalesOperationsAuditTrail(
    @CurrentUser() user: any,
    @Query() filter: any,
  ) {
    return this.revOpsService.getSalesOperationsAuditTrail(
      user.tenantId,
      filter,
    );
  }

  @Post("audit-log")
  @ApiOperation({ summary: "Log sales operation event" })
  @Permissions("sales.audit.update")
  async logSalesOperationEvent(@CurrentUser() user: any, @Body() event: any) {
    return this.revOpsService.logSalesOperationEvent(user.tenantId, event);
  }

  @Post("order-splits/config")
  @ApiOperation({ summary: "Configure order split rules" })
  @Permissions("sales.splits.admin")
  async configureOrderSplitRules(@CurrentUser() user: any, @Body() rules: any) {
    return this.revOpsService.configureOrderSplitRules(user.tenantId, rules);
  }

  @Get("order-splits/config")
  @ApiOperation({ summary: "Get order split rules" })
  @Permissions("sales.splits.read")
  async getOrderSplitRules(@CurrentUser() user: any) {
    return this.revOpsService.getOrderSplitRules(user.tenantId);
  }

  @Post("order-splits/calculate/:dealId")
  @ApiOperation({ summary: "Calculate order split for deal" })
  @Permissions("sales.splits.read")
  async calculateOrderSplitForDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.revOpsService.calculateOrderSplitForDeal(
      user.tenantId,
      dealId,
      body?.repIds || [],
    );
  }

  @Post("order-splits/save/:dealId")
  @ApiOperation({ summary: "Save order split for deal" })
  @Permissions("sales.splits.update")
  async saveOrderSplitForDeal(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.revOpsService.saveOrderSplitForDeal(
      user.tenantId,
      dealId,
      body?.splits || [],
    );
  }

  @Get("order-splits/history/:dealId")
  @ApiOperation({ summary: "Get order split history" })
  @Permissions("sales.splits.read")
  async getOrderSplitHistory(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.revOpsService.getOrderSplitHistory(user.tenantId, dealId);
  }

  @Post("territories/realignment-simulation")
  @ApiOperation({ summary: "Get territory realignment simulation" })
  @Permissions("sales.territory.admin")
  async getTerritoryRealignmentSimulation(
    @CurrentUser() user: any,
    @Body() params: any,
  ) {
    return this.revOpsService.getTerritoryRealignmentSimulation(
      user.tenantId,
      params,
    );
  }

  @Post("territories/realignment-simulation/:id/apply")
  @ApiOperation({ summary: "Apply territory realignment" })
  @Permissions("sales.territory.admin")
  async applyTerritoryRealignment(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.revOpsService.applyTerritoryRealignment(user.tenantId, id);
  }

  @Post("pricebooks/:id/overrides")
  @ApiOperation({ summary: "Set price book override" })
  @Permissions("sales.pricebook.admin")
  async setPriceBookOverride(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.revOpsService.setPriceBookOverride(
      user.tenantId,
      id,
      body?.itemOverrides || [],
    );
  }

  @Get("pricebooks/:id/overrides")
  @ApiOperation({ summary: "Get price book overrides" })
  @Permissions("sales.pricebook.read")
  async getPriceBookOverrides(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.revOpsService.getPriceBookOverrides(user.tenantId, id);
  }

  @Delete("pricebooks/:id/overrides/:itemId")
  @ApiOperation({ summary: "Delete price book override" })
  @Permissions("sales.pricebook.admin")
  async deletePriceBookOverride(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ) {
    return this.revOpsService.deletePriceBookOverride(
      user.tenantId,
      id,
      itemId,
    );
  }

  @Post("escalations/run/:dealId")
  @ApiOperation({ summary: "Run sales escalation workflow" })
  @Permissions("sales.escalation.update")
  async runSalesEscalationWorkflow(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
    @Body() body: any,
  ) {
    return this.revOpsService.runSalesEscalationWorkflow(
      user.tenantId,
      dealId,
      body?.level || 1,
    );
  }

  @Get("escalations/history/:dealId")
  @ApiOperation({ summary: "Get sales escalation history" })
  @Permissions("sales.escalation.read")
  async getSalesEscalationHistory(
    @CurrentUser() user: any,
    @Param("dealId") dealId: string,
  ) {
    return this.revOpsService.getSalesEscalationHistory(user.tenantId, dealId);
  }

  @Post("escalations/:id/resolve")
  @ApiOperation({ summary: "Resolve sales escalation" })
  @Permissions("sales.escalation.admin")
  async resolveSalesEscalation(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() resolution: any,
  ) {
    return this.revOpsService.resolveSalesEscalation(
      user.tenantId,
      id,
      resolution,
    );
  }

  @Post("health-scores/rules")
  @ApiOperation({ summary: "Set customer health score rules" })
  @Permissions("sales.health.admin")
  async setCustomerHealthScoreRules(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.revOpsService.setCustomerHealthScoreRules(
      user.tenantId,
      body?.rules || [],
    );
  }

  @Get("health-scores/rules")
  @ApiOperation({ summary: "Get customer health score rules" })
  @Permissions("sales.health.read")
  async getCustomerHealthScoreRules(@CurrentUser() user: any) {
    return this.revOpsService.getCustomerHealthScoreRules(user.tenantId);
  }

  @Post("health-scores/recalculate/:customerId")
  @ApiOperation({ summary: "Recalculate customer health score" })
  @Permissions("sales.health.update")
  async recalculateCustomerHealthScore(
    @CurrentUser() user: any,
    @Param("customerId") customerId: string,
  ) {
    return this.revOpsService.recalculateCustomerHealthScore(
      user.tenantId,
      customerId,
    );
  }

  @Get("health-scores/history/:customerId")
  @ApiOperation({ summary: "Get customer health score history" })
  @Permissions("sales.health.read")
  async getCustomerHealthScoreHistory(
    @CurrentUser() user: any,
    @Param("customerId") customerId: string,
  ) {
    return this.revOpsService.getCustomerHealthScoreHistory(
      user.tenantId,
      customerId,
    );
  }

  @Post("health-scores/batch-recalculate")
  @ApiOperation({ summary: "Batch recalculate customer health scores" })
  @Permissions("sales.health.admin")
  async batchRecalculateCustomerHealthScores(@CurrentUser() user: any) {
    return this.revOpsService.batchRecalculateCustomerHealthScores(
      user.tenantId,
    );
  }

  @Get("health-scores/export")
  @ApiOperation({ summary: "Export customer health score report" })
  @Permissions("sales.health.read")
  async exportCustomerHealthScoreReport(@CurrentUser() user: any) {
    return this.revOpsService.exportCustomerHealthScoreReport(user.tenantId);
  }

  @Get("quotas/attainment-dashboard")
  @ApiOperation({ summary: "Get sales quota attainment dashboard" })
  @Permissions("sales.quota.read")
  async getSalesQuotaAttainmentDashboard(
    @CurrentUser() user: any,
    @Query("period") period: string,
  ) {
    return this.revOpsService.getSalesQuotaAttainmentDashboard(
      user.tenantId,
      period,
    );
  }

  @Get("quotas/rep-history/:repId")
  @ApiOperation({ summary: "Get rep quota attainment history" })
  @Permissions("sales.quota.read")
  async getRepQuotaAttainmentHistory(
    @CurrentUser() user: any,
    @Param("repId") repId: string,
  ) {
    return this.revOpsService.getRepQuotaAttainmentHistory(
      user.tenantId,
      repId,
    );
  }

  @Patch("quotas/rep-target/:repId")
  @ApiOperation({ summary: "Update rep quota target" })
  @Permissions("sales.quota.admin")
  async updateRepQuotaTarget(
    @CurrentUser() user: any,
    @Param("repId") repId: string,
    @Body() body: any,
  ) {
    return this.revOpsService.updateRepQuotaTarget(
      user.tenantId,
      repId,
      body?.period,
      body?.newQuota,
    );
  }

  @Get("quotas/export")
  @ApiOperation({ summary: "Export quota attainment report" })
  @Permissions("sales.quota.read")
  async exportQuotaAttainmentReport(
    @CurrentUser() user: any,
    @Query("period") period: string,
  ) {
    return this.revOpsService.exportQuotaAttainmentReport(
      user.tenantId,
      period,
    );
  }
}
