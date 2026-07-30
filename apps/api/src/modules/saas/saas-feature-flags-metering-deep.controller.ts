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
import { SaasFeatureFlagsMeteringDeepService } from "./saas-feature-flags-metering-deep.service";

@ApiTags("SaaS Feature Flags & Metering")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller("saas/flags-metering")
export class SaasFeatureFlagsMeteringDeepController {
  constructor(private readonly service: SaasFeatureFlagsMeteringDeepService) {}

  // 1. Feature Flag Rules
  @Post("feature-flags/rules")
  @ApiOperation({ summary: "Create feature flag rule" })
  @Permissions("saas.flags.admin")
  async createFeatureFlagRule(@CurrentUser() user: any, @Body() ruleData: any) {
    return this.service.createFeatureFlagRule(user.tenantId, ruleData);
  }

  @Get("feature-flags/rules")
  @ApiOperation({ summary: "List feature flag rules" })
  @Permissions("saas.flags.read")
  async getFeatureFlagRules(
    @CurrentUser() user: any,
    @Query("flagKey") flagKey?: string,
  ) {
    return this.service.getFeatureFlagRules(user.tenantId, flagKey);
  }

  @Get("feature-flags/rules/:id")
  @ApiOperation({ summary: "Get feature flag rule by ID" })
  @Permissions("saas.flags.read")
  async getFeatureFlagRuleById(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.getFeatureFlagRuleById(user.tenantId, id);
  }

  @Patch("feature-flags/rules/:id")
  @ApiOperation({ summary: "Update feature flag rule" })
  @Permissions("saas.flags.admin")
  async updateFeatureFlagRule(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() ruleData: any,
  ) {
    return this.service.updateFeatureFlagRule(user.tenantId, id, ruleData);
  }

  @Delete("feature-flags/rules/:id")
  @ApiOperation({ summary: "Delete feature flag rule" })
  @Permissions("saas.flags.admin")
  async deleteFeatureFlagRule(
    @CurrentUser() user: any,
    @Param("id") id: string,
  ) {
    return this.service.deleteFeatureFlagRule(user.tenantId, id);
  }

  @Post("feature-flags/evaluate/:flagKey")
  @ApiOperation({ summary: "Evaluate feature flag for tenant" })
  @Permissions("saas.flags.read")
  async evaluateFeatureFlagForTenant(
    @CurrentUser() user: any,
    @Param("flagKey") flagKey: string,
    @Body() context?: any,
  ) {
    return this.service.evaluateFeatureFlagForTenant(
      user.tenantId,
      flagKey,
      context,
    );
  }

  @Post("feature-flags/bulk-evaluate")
  @ApiOperation({ summary: "Bulk evaluate feature flags" })
  @Permissions("saas.flags.read")
  async bulkEvaluateFeatureFlags(@CurrentUser() user: any, @Body() body: any) {
    return this.service.bulkEvaluateFeatureFlags(
      user.tenantId,
      body?.flagKeys || [],
    );
  }

  @Get("feature-flags/audit-logs/:flagKey")
  @ApiOperation({ summary: "Get feature flag audit logs" })
  @Permissions("saas.flags.read")
  async getFeatureFlagAuditLogs(
    @CurrentUser() user: any,
    @Param("flagKey") flagKey: string,
  ) {
    return this.service.getFeatureFlagAuditLogs(user.tenantId, flagKey);
  }

  @Post("feature-flags/overrides")
  @ApiOperation({ summary: "Set feature flag override" })
  @Permissions("saas.flags.admin")
  async setFeatureFlagOverride(@CurrentUser() user: any, @Body() body: any) {
    return this.service.setFeatureFlagOverride(
      user.tenantId,
      body?.flagKey,
      body?.targetTenantId,
      body?.isEnabled,
    );
  }

  @Delete("feature-flags/overrides/:flagKey/:targetTenantId")
  @ApiOperation({ summary: "Remove feature flag override" })
  @Permissions("saas.flags.admin")
  async removeFeatureFlagOverride(
    @CurrentUser() user: any,
    @Param("flagKey") flagKey: string,
    @Param("targetTenantId") targetTenantId: string,
  ) {
    return this.service.removeFeatureFlagOverride(
      user.tenantId,
      flagKey,
      targetTenantId,
    );
  }

  @Get("feature-flags/export")
  @ApiOperation({ summary: "Export feature flag config" })
  @Permissions("saas.flags.read")
  async exportFeatureFlagConfig(@CurrentUser() user: any) {
    return this.service.exportFeatureFlagConfig(user.tenantId);
  }

  @Post("feature-flags/import")
  @ApiOperation({ summary: "Import feature flag config" })
  @Permissions("saas.flags.admin")
  async importFeatureFlagConfig(
    @CurrentUser() user: any,
    @Body() configData: any,
  ) {
    return this.service.importFeatureFlagConfig(user.tenantId, configData);
  }

  // 2. Metering & Quotas
  @Post("metering/record")
  @ApiOperation({ summary: "Record usage event" })
  @Permissions("saas.metering.update")
  async recordUsageEvent(@CurrentUser() user: any, @Body() body: any) {
    return this.service.recordUsageEvent(
      user.tenantId,
      body?.meterKey,
      body?.quantity || 1,
      body?.metadata,
    );
  }

  @Post("metering/batch-record")
  @ApiOperation({ summary: "Batch record usage events" })
  @Permissions("saas.metering.update")
  async batchRecordUsageEvents(@CurrentUser() user: any, @Body() body: any) {
    return this.service.batchRecordUsageEvents(
      user.tenantId,
      body?.events || [],
    );
  }

  @Get("metering/usage-summary")
  @ApiOperation({ summary: "Get tenant usage summary" })
  @Permissions("saas.metering.read")
  async getTenantUsageSummary(
    @CurrentUser() user: any,
    @Query("period") period: string,
  ) {
    return this.service.getTenantUsageSummary(user.tenantId, period);
  }

  @Get("metering/quota-breach/:meterKey")
  @ApiOperation({ summary: "Check usage quota breach" })
  @Permissions("saas.metering.read")
  async checkUsageQuotaBreach(
    @CurrentUser() user: any,
    @Param("meterKey") meterKey: string,
  ) {
    return this.service.checkUsageQuotaBreach(user.tenantId, meterKey);
  }

  @Post("metering/quota-limits")
  @ApiOperation({ summary: "Set usage quota limit" })
  @Permissions("saas.metering.admin")
  async setUsageQuotaLimit(@CurrentUser() user: any, @Body() body: any) {
    return this.service.setUsageQuotaLimit(
      user.tenantId,
      body?.meterKey,
      body?.limit,
      body?.alertThresholdPct || 80,
    );
  }

  @Get("metering/quota-limits")
  @ApiOperation({ summary: "Get usage quota limits" })
  @Permissions("saas.metering.read")
  async getUsageQuotaLimits(@CurrentUser() user: any) {
    return this.service.getUsageQuotaLimits(user.tenantId);
  }

  @Post("metering/reset/:meterKey")
  @ApiOperation({ summary: "Reset tenant usage meter" })
  @Permissions("saas.metering.admin")
  async resetTenantUsageMeter(
    @CurrentUser() user: any,
    @Param("meterKey") meterKey: string,
  ) {
    return this.service.resetTenantUsageMeter(user.tenantId, meterKey);
  }

  @Get("metering/billing-breakdown/:billingCycleId")
  @ApiOperation({ summary: "Get metered billing breakdown" })
  @Permissions("saas.metering.read")
  async getMeteredBillingBreakdown(
    @CurrentUser() user: any,
    @Param("billingCycleId") billingCycleId: string,
  ) {
    return this.service.getMeteredBillingBreakdown(
      user.tenantId,
      billingCycleId,
    );
  }

  @Get("metering/export-report")
  @ApiOperation({ summary: "Export usage report" })
  @Permissions("saas.metering.read")
  async exportUsageReport(
    @CurrentUser() user: any,
    @Query("format") format: string,
  ) {
    return this.service.exportUsageReport(user.tenantId, format);
  }
}
