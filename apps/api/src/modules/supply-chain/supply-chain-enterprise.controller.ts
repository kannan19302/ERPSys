import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SupplyChainEnterpriseService } from './supply-chain-enterprise.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('supply-chain-enterprise')
@ApiBearerAuth()
@Controller('supply-chain/enterprise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SupplyChainEnterpriseController {
  constructor(private readonly service: SupplyChainEnterpriseService) {}

  @Get('visibility')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'End-to-end supply chain visibility - inventory, orders in flight, capacity' })
  async getVisibility(@Req() req: AuthenticatedRequest, @Query('asOf') asOf?: string) {
    return this.service.getSupplyChainVisibility(req.user.tenantId, asOf);
  }

  @Get('demand-forecast-accuracy')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Demand forecast accuracy - MAPE, MAE, bias analysis' })
  async getDemandForecastAccuracy(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getDemandForecastAccuracy(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('network-optimization')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Network optimization recommendations - DC location, sourcing' })
  async getNetworkOptimization(@Req() req: AuthenticatedRequest, @Query('scenario') scenario?: string) {
    return this.service.getNetworkOptimization(req.user.tenantId, scenario);
  }

  @Get('logistics-cost-analysis')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Logistics cost analysis - freight cost by mode/lane/carrier' })
  async getLogisticsCostAnalysis(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getLogisticsCostAnalysis(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('carrier-performance/:carrierId')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Carrier performance - on-time pickup/delivery, damage rate' })
  async getCarrierPerformance(@Req() req: AuthenticatedRequest, @Param('carrierId') carrierId: string, @Query('period') period?: string) {
    return this.service.getCarrierPerformance(req.user.tenantId, carrierId, period);
  }

  @Get('inventory-days-of-supply/:productId')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Inventory days of supply calculation' })
  async getInventoryDaysOfSupply(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.service.getInventoryDaysOfSupply(req.user.tenantId, productId);
  }

  @Get('risk-heatmap')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Supply chain risk heatmap - geopolitical, supplier, logistics, inventory' })
  async getRiskHeatmap(@Req() req: AuthenticatedRequest) {
    return this.service.getSupplyChainRiskHeatmap(req.user.tenantId);
  }

  @Get('sustainability')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Sustainability reporting - carbon footprint by transport mode' })
  async getSustainability(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getSustainabilityReporting(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('trade-compliance/:shipmentId')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Trade compliance - customs docs, restricted party screening, tariff classification' })
  async getTradeCompliance(@Req() req: AuthenticatedRequest, @Param('shipmentId') shipmentId: string) {
    return this.service.getTradeCompliance(req.user.tenantId, shipmentId);
  }

  @Get('end-to-end-cycle-time')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'End-to-end order-to-delivery cycle time breakdown' })
  async getEndToEndCycleTime(@Req() req: AuthenticatedRequest, @Query('periodStart') periodStart?: string, @Query('periodEnd') periodEnd?: string) {
    return this.service.getEndToEndCycleTime(req.user.tenantId, periodStart, periodEnd);
  }

  @Get('dashboard-kpis')
  @Permissions('supply-chain.enterprise.read')
  @ApiOperation({ summary: 'Supply chain executive dashboard KPIs' })
  async getDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getSupplyChainDashboardKpis(req.user.tenantId);
  }

  @Get('export/:reportType')
  @Permissions('supply-chain.enterprise.export')
  @ApiOperation({ summary: 'Export supply chain report in specified format' })
  async exportReport(@Req() req: AuthenticatedRequest, @Param('reportType') reportType: string, @Query('format') format?: string, @Query() params?: any) {
    return this.service.exportSupplyChainReport(req.user.tenantId, reportType, format || 'json', params);
  }
}
