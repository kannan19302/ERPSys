import { Controller, Get, Post, UseGuards, Param, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { TenantAnalyticsService } from "./tenant-analytics.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("saas-admin")
@ApiBearerAuth()
@Controller("saas/admin")
@UseGuards(JwtAuthGuard, RbacGuard)
export class TenantAdminController {
  constructor(private readonly analytics: TenantAnalyticsService) {}

  @ApiOperation({ summary: "Get platform overview" })
  @Permissions("saas.analytics.read")
  @Get("overview")
  async getPlatformOverview() {
    return this.analytics.getPlatformOverview();
  }

  @ApiOperation({ summary: "List all tenants" })
  @Permissions("saas.tenant.read")
  @Get("tenants")
  async getTenantsList(@Query("page") page?: string, @Query("limit") limit?: string, @Query("status") status?: string, @Query("search") search?: string) {
    return this.analytics.getTenantsList({ page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20, status, search });
  }

  @ApiOperation({ summary: "Get tenant detail" })
  @Permissions("saas.tenant.read")
  @Get("tenants/:tenantId")
  async getTenantDetail(@Param("tenantId") tenantId: string) {
    return this.analytics.getTenantDetail(tenantId);
  }

  @ApiOperation({ summary: "Suspend tenant" })
  @Permissions("saas.tenant.update")
  @Post("tenants/:tenantId/suspend")
  async suspendTenant(@Param("tenantId") tenantId: string) {
    return this.analytics.suspendTenant(tenantId);
  }

  @ApiOperation({ summary: "Activate tenant" })
  @Permissions("saas.tenant.update")
  @Post("tenants/:tenantId/activate")
  async activateTenant(@Param("tenantId") tenantId: string) {
    return this.analytics.activateTenant(tenantId);
  }

  @ApiOperation({ summary: "Get revenue analytics" })
  @Permissions("saas.analytics.read")
  @Get("analytics/revenue")
  async getRevenueAnalytics(@Query("period") period?: string) {
    return this.analytics.getRevenueAnalytics((period || "30d") as "7d" | "30d" | "90d" | "1y");
  }

  @ApiOperation({ summary: "Get churn analytics" })
  @Permissions("saas.analytics.read")
  @Get("analytics/churn")
  async getChurnAnalytics(@Query("period") period?: string) {
    return this.analytics.getChurnAnalytics((period || "30d") as "7d" | "30d" | "90d" | "1y");
  }

  @ApiOperation({ summary: "Get plan distribution" })
  @Permissions("saas.analytics.read")
  @Get("analytics/plans")
  async getPlanDistribution() {
    return this.analytics.getPlanDistribution();
  }

  @ApiOperation({ summary: "Get tenant growth" })
  @Permissions("saas.analytics.read")
  @Get("analytics/growth")
  async getTenantGrowth(@Query("period") period?: string) {
    return this.analytics.getTenantGrowth((period || "30d") as "7d" | "30d" | "90d" | "1y");
  }

  @ApiOperation({ summary: "Get geographic distribution" })
  @Permissions("saas.analytics.read")
  @Get("analytics/geography")
  async getGeographicDistribution() {
    return this.analytics.getGeographicDistribution();
  }

  @ApiOperation({ summary: "Get feature adoption" })
  @Permissions("saas.analytics.read")
  @Get("analytics/features")
  async getFeatureAdoption() {
    return this.analytics.getFeatureAdoption();
  }

  @ApiOperation({ summary: "Get health metrics" })
  @Permissions("saas.analytics.read")
  @Get("health")
  async getHealthMetrics() {
    return this.analytics.getHealthMetrics();
  }
}
