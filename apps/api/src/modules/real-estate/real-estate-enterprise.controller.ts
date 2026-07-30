// @ts-nocheck
import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { RealEstateEnterpriseService } from "./real-estate-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("real-estate/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealEstateEnterpriseController {
  constructor(private readonly service: RealEstateEnterpriseService) {}

  @Get("portfolio-performance")
  @Permissions("real-estate.enterprise.read")
  async getPortfolioPerformance(@Req() req: AuthenticatedRequest, @Query("portfolioId") portfolioId?: string) {
    return this.service.getPortfolioPerformance(req.user.tenantId, portfolioId);
  }

  @Get("market-analysis")
  @Permissions("real-estate.enterprise.read")
  async getMarketAnalysis(@Req() req: AuthenticatedRequest, @Query("marketId") marketId?: string) {
    return this.service.getMarketAnalysis(req.user.tenantId, marketId);
  }

  @Get("tenant-health")
  @Permissions("real-estate.enterprise.read")
  async getTenantHealth(@Req() req: AuthenticatedRequest, @Query("tenantId") tenantIdParam?: string) {
    return this.service.getTenantHealthScore(req.user.tenantId, tenantIdParam);
  }

  @Get("property-valuation")
  @Permissions("real-estate.enterprise.read")
  async getPropertyValuation(@Req() req: AuthenticatedRequest, @Query("propertyId") propertyId?: string) {
    return this.service.getPropertyValuation(req.user.tenantId, propertyId);
  }

  @Get("lease-expiration")
  @Permissions("real-estate.enterprise.read")
  async getLeaseExpiration(@Req() req: AuthenticatedRequest, @Query("asOf") asOf?: string, @Query("horizon") horizon?: string) {
    return this.service.getLeaseExpirationSchedule(req.user.tenantId, asOf, horizon);
  }

  @Get("maintenance-analytics")
  @Permissions("real-estate.enterprise.read")
  async getMaintenanceAnalytics(@Req() req: AuthenticatedRequest, @Query("dateRange") dateRange?: string) {
    return this.service.getMaintenanceAnalytics(req.user.tenantId, dateRange);
  }

  @Get("capital-planning")
  @Permissions("real-estate.enterprise.read")
  async getCapitalPlanning(@Req() req: AuthenticatedRequest, @Query("portfolioId") portfolioId?: string) {
    return this.service.getCapitalPlanning(req.user.tenantId, portfolioId);
  }

  @Get("sustainability")
  @Permissions("real-estate.enterprise.read")
  async getSustainability(@Req() req: AuthenticatedRequest, @Query("propertyId") propertyId?: string) {
    return this.service.getSustainabilityMetrics(req.user.tenantId, propertyId);
  }

  @Get("dashboard-kpis")
  @Permissions("real-estate.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getRealEstateDashboardKpis(req.user.tenantId);
  }
}
