// @ts-nocheck
import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CrmRevenueOptimizationDeepService } from "./crm-revenue-optimization-deep.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("crm / revenue-optimization-deep")
@ApiBearerAuth()
@Controller("crm/revenue-optimization-deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class CrmRevenueOptimizationDeepController {
  constructor(private readonly svc: CrmRevenueOptimizationDeepService) {}

  @Get("pricing-optimization")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get pricing optimization analysis" })
  async getPricingOptimization(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getPricingOptimizationAnalysis(req.user.tenantId),
    };
  }

  @Get("discount-analysis")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get discount distribution analysis" })
  async getDiscountAnalysis(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getDiscountAnalysis(req.user.tenantId) };
  }

  @Get("upsell-downsell")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get upsell and downsell analysis" })
  async getUpsellDownsell(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getUpsellDownsellAnalysis(req.user.tenantId),
    };
  }

  @Get("contract-value")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get contract value optimization insights" })
  async getContractValue(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getContractValueOptimization(req.user.tenantId),
    };
  }

  @Get("revenue-leakage")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get revenue leakage by category" })
  async getRevenueLeakage(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRevenueLeakageByCategory(req.user.tenantId),
    };
  }

  @Get("price-elasticity")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get price elasticity analysis" })
  async getPriceElasticity(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getPriceElasticityAnalysis(req.user.tenantId),
    };
  }

  @Get("multi-product-revenue")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get multi-product revenue analysis" })
  async getMultiProductRevenue(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getMultiProductRevenueAnalysis(req.user.tenantId),
    };
  }

  @Get("concentration-risk")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get revenue concentration risk analysis" })
  async getConcentrationRisk(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRevenueConcentrationRisk(req.user.tenantId),
    };
  }

  @Get("revenue-quality")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get revenue quality score" })
  async getRevenueQuality(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getRevenueQualityScore(req.user.tenantId) };
  }

  @Get("arpu")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get ARPU analysis and trend" })
  async getArpu(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getArpuAnalysis(req.user.tenantId) };
  }

  @Get("renewal-risk-matrix")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get contract renewal risk matrix" })
  async getRenewalRiskMatrix(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getContractRenewalRiskMatrix(req.user.tenantId),
    };
  }

  @Get("net-dollar-retention")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get net dollar retention metrics" })
  async getNetDollarRetention(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getNetDollarRetention(req.user.tenantId) };
  }

  @Get("revenue-by-product-line")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get revenue breakdown by product line" })
  async getRevenueByProductLine(@Req() req: AuthenticatedRequest) {
    return { data: await this.svc.getRevenueByProductLine(req.user.tenantId) };
  }

  @Get("dashboard")
  @Permissions("crm.revenue.optimization.read")
  @ApiOperation({ summary: "Get revenue optimization dashboard" })
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return {
      data: await this.svc.getRevenueOptimizationDashboard(req.user.tenantId),
    };
  }
}
