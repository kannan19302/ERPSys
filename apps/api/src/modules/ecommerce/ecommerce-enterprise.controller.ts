import { Controller, Get, Param, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { EcommerceEnterpriseService } from "./ecommerce-enterprise.service";

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

@Controller("ecommerce/enterprise")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EcommerceEnterpriseController {
  constructor(private readonly service: EcommerceEnterpriseService) {}

  @Get("sales-analytics")
  @Permissions("ecommerce.enterprise.read")
  async getSalesAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getSalesAnalytics(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("customer-behavior")
  @Permissions("ecommerce.enterprise.read")
  async getCustomerBehavior(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getCustomerBehavior(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("product-performance")
  @Permissions("ecommerce.enterprise.read")
  async getProductPerformance(
    @Req() req: AuthenticatedRequest,
    @Query("periodStart") periodStart?: string,
    @Query("periodEnd") periodEnd?: string,
  ) {
    return this.service.getProductPerformance(
      req.user.tenantId,
      periodStart,
      periodEnd,
    );
  }

  @Get("marketing-roi")
  @Permissions("ecommerce.enterprise.read")
  async getMarketingRoi(
    @Req() req: AuthenticatedRequest,
    @Query("campaignId") campaignId?: string,
    @Query("period") period?: string,
  ) {
    return this.service.getMarketingRoi(req.user.tenantId, campaignId, period);
  }

  @Get("inventory-merchandising")
  @Permissions("ecommerce.enterprise.read")
  async getInventoryMerchandising(@Req() req: AuthenticatedRequest) {
    return this.service.getInventoryMerchandising(req.user.tenantId);
  }

  @Get("fraud-detection")
  @Permissions("ecommerce.enterprise.read")
  async getFraudDetection(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.service.getFraudDetection(req.user.tenantId, period);
  }

  @Get("customer-loyalty")
  @Permissions("ecommerce.enterprise.read")
  async getCustomerLoyalty(
    @Req() req: AuthenticatedRequest,
    @Query("period") period?: string,
  ) {
    return this.service.getCustomerLoyalty(req.user.tenantId, period);
  }

  @Get("storefront-performance")
  @Permissions("ecommerce.enterprise.read")
  async getStorefrontPerformance(
    @Req() req: AuthenticatedRequest,
    @Query("storefrontId") storefrontId?: string,
  ) {
    return this.service.getStorefrontPerformance(
      req.user.tenantId,
      storefrontId,
    );
  }

  @Get("dashboard-kpis")
  @Permissions("ecommerce.enterprise.read")
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getEcommerceDashboardKpis(req.user.tenantId);
  }
}
