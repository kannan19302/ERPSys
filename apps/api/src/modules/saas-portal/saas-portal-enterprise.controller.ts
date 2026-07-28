import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SaasPortalEnterpriseService } from "./saas-portal-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("saas/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SaasPortalEnterpriseController {
  constructor(private readonly service: SaasPortalEnterpriseService) {}

  @Get("tenant-analytics")
  @Permissions("saas.enterprise.read")
  async getTenantAnalytics(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getTenantAnalytics(req.user.tenantId, dateRange);
  }

  @Get("subscription-metrics")
  @Permissions("saas.enterprise.read")
  async getSubscriptionMetrics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getSubscriptionMetrics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("usage-metering")
  @Permissions("saas.enterprise.read")
  async getUsageMetering(@Req() req: AuthenticatedRequest, @Query("period") period?: string) {
    return this.service.getUsageMetering(req.user.tenantId, period);
  }

  @Get("billing-analytics")
  @Permissions("saas.enterprise.read")
  async getBillingAnalytics(@Req() req: AuthenticatedRequest, @Query("periodStart") periodStart?: string, @Query("periodEnd") periodEnd?: string) {
    return this.service.getBillingAnalytics(req.user.tenantId, periodStart, periodEnd);
  }

  @Get("dashboard-kpis")
  @Permissions("saas.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getSaasDashboardKpis(req.user.tenantId);
  }
}
