import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { MarketplaceEnterpriseService } from "./marketplace-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("marketplace/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class MarketplaceEnterpriseController {
  constructor(private readonly service: MarketplaceEnterpriseService) {}

  @Get("marketplace-analytics")
  @Permissions("marketplace.enterprise.read")
  async getMarketplaceAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("dateRange") dateRange?: string,
  ) {
    return this.service.getMarketplaceAnalytics(req.user.tenantId, dateRange);
  }

  @Get("developer-performance")
  @Permissions("marketplace.enterprise.read")
  async getDeveloperPerformance(
    @Req() req: AuthenticatedRequest,
    @Query("developerId") developerId?: string,
  ) {
    return this.service.getDeveloperPerformance(req.user.tenantId, developerId);
  }

  @Get("app-quality")
  @Permissions("marketplace.enterprise.read")
  async getAppQuality(
    @Req() req: AuthenticatedRequest,
    @Query("appId") appId?: string,
  ) {
    return this.service.getAppQuality(req.user.tenantId, appId);
  }

  @Get("revenue-analytics")
  @Permissions("marketplace.enterprise.read")
  async getRevenueAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getRevenueAnalytics(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("dashboard-kpis")
  @Permissions("marketplace.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getMarketplaceDashboardKpis(req.user.tenantId);
  }
}
