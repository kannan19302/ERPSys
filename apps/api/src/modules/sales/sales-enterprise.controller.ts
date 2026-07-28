import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SalesEnterpriseService } from './sales-enterprise.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('sales-enterprise')
@ApiBearerAuth()
@Controller('sales/enterprise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesEnterpriseController {
  constructor(private readonly service: SalesEnterpriseService) {}

  @Get('revenue-analytics')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Revenue analytics by product/region/channel with growth rates' })
  async getRevenueAnalytics(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string, @Query('groupBy') groupBy?: string) {
    return this.service.getRevenueAnalytics(req.user.tenantId, periodStart, periodEnd, groupBy);
  }

  @Get('order-fulfillment')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Order fulfillment analysis - on-time, perfect order, fill rate' })
  async getOrderFulfillment(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getOrderFulfillment(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('customer-profitability/:customerId')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Customer profitability analysis - revenue vs cost-to-serve' })
  async getCustomerProfitability(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string, @Query('period') period?: string) {
    return this.service.getCustomerProfitability(req.user.tenantId, customerId, period);
  }

  @Get('pricing-analysis/:productId')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Pricing analysis - price realization, discount depth, discount impact' })
  async getPricingAnalysis(@Req() req: AuthenticatedRequest, @Param('productId') productId: string, @Query('period') period?: string) {
    return this.service.getPricingAnalysis(req.user.tenantId, productId, period);
  }

  @Get('channel-performance')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Sales channel performance comparison' })
  async getChannelPerformance(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getSalesChannelPerformance(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('product-mix')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Product mix analysis with cross-sell and bundle performance' })
  async getProductMix(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getProductMixAnalysis(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('geographic-analysis')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Geographic sales analysis - regional performance' })
  async getGeographicAnalysis(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getGeographicSalesAnalysis(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('sales-forecast/:productId')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Sales trend forecast with time-series predictions' })
  async getSalesForecast(@Req() req: AuthenticatedRequest, @Param('productId') productId: string, @Query('horizon') horizon?: string) {
    return this.service.getSalesTrendForecast(req.user.tenantId, productId, horizon);
  }

  @Get('customer-segmentation')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Customer segmentation - RFM analysis and segment profiling' })
  async getCustomerSegmentation(@Req() req: AuthenticatedRequest, @Query('criteria') criteria?: string) {
    return this.service.getCustomerSegmentation(req.user.tenantId, criteria);
  }

  @Get('rep-performance/:repId')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Sales rep performance - quota, win rate, pipeline coverage' })
  async getRepPerformance(@Req() req: AuthenticatedRequest, @Param('repId') repId: string, @Query('period') period?: string) {
    return this.service.getSalesRepPerformance(req.user.tenantId, repId, period);
  }

  @Get('churn-analysis')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Customer churn analysis with predictors' })
  async getChurnAnalysis(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getChurnAnalysis(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('dashboard-kpis')
  @Permissions('sales.enterprise.read')
  @ApiOperation({ summary: 'Sales executive dashboard KPIs' })
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getSalesExecutiveDashboard(req.user.tenantId);
  }

  @Get('export/:reportType')
  @Permissions('sales.enterprise.export')
  @ApiOperation({ summary: 'Export sales report in specified format' })
  async exportReport(@Req() req: AuthenticatedRequest, @Param('reportType') reportType: string, @Query('format') format?: string, @Query() params?: any) {
    return this.service.exportSalesReport(req.user.tenantId, reportType, format || 'json', params);
  }
}
