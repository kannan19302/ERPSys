import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SalesAnalyticsService } from "./sales-analytics.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("sales-analytics")
@ApiBearerAuth()
@Controller("sales/analytics")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesAnalyticsController {
  constructor(private readonly analyticsService: SalesAnalyticsService) {}

  @Get("revenue")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Revenue analytics by channel and period" })
  async getRevenueAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.analyticsService.getRevenueAnalytics(req.user.tenantId, query);
  }

  @Get("win-loss")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Win/loss analysis from quotations" })
  async getWinLossAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.analyticsService.getWinLossAnalytics(req.user.tenantId, query);
  }

  @Get("funnel")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Sales pipeline funnel (leads to delivered)" })
  async getSalesFunnel(@Req() req: AuthenticatedRequest, @Query() query: any) {
    return this.analyticsService.getSalesFunnel(req.user.tenantId, query);
  }

  @Get("cycle-time")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Average order cycle time" })
  async getOrderCycleTime(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.analyticsService.getOrderCycleTime(req.user.tenantId, query);
  }

  @Get("top-customers")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Top customers by revenue" })
  async getTopCustomers(
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit?: string,
    @Query() query?: any,
  ) {
    const { limit: _l, ...filters } = query || {};
    return this.analyticsService.getTopCustomers(
      req.user.tenantId,
      limit ? parseInt(limit, 10) : 10,
      filters,
    );
  }

  @Get("top-products")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Top products by sales volume" })
  async getTopProducts(
    @Req() req: AuthenticatedRequest,
    @Query("limit") limit?: string,
    @Query() query?: any,
  ) {
    const { limit: _l, ...filters } = query || {};
    return this.analyticsService.getTopProducts(
      req.user.tenantId,
      limit ? parseInt(limit, 10) : 10,
      filters,
    );
  }

  @Get("kpi")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Executive KPI summary" })
  async getKpiSummary(@Req() req: AuthenticatedRequest) {
    return this.analyticsService.getKpiSummary(req.user.tenantId);
  }

  @Get("dashboard")
  @Permissions("sales.analytics.read")
  @ApiOperation({ summary: "Combined analytics dashboard" })
  async getSalesAnalyticsDashboard(
    @Req() req: AuthenticatedRequest,
    @Query() query: any,
  ) {
    return this.analyticsService.getSalesAnalyticsDashboard(
      req.user.tenantId,
      query,
    );
  }
}
