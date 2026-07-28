import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManufacturingEnterpriseService } from './manufacturing-enterprise.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('manufacturing-enterprise')
@ApiBearerAuth()
@Controller('manufacturing/enterprise')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ManufacturingEnterpriseController {
  constructor(private readonly service: ManufacturingEnterpriseService) {}

  @ApiOperation({ summary: 'Production performance with OEE, throughput, yield, cycle time' })
  @Get('production-performance')
  @Permissions('manufacturing.work-order.read')
  async getProductionPerformance(
    @Req() req: AuthenticatedRequest,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.service.getProductionPerformance(req.user.tenantId, periodStart, periodEnd);
  }

  @ApiOperation({ summary: 'Quality analysis with Pareto, CP/CPK, defect rates' })
  @Get('quality-analysis/:productId')
  @Permissions('manufacturing.quality.read')
  async getQualityAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getQualityAnalysis(req.user.tenantId, productId, period || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Capacity-constrained production plan with load vs capacity' })
  @Get('production-plan')
  @Permissions('manufacturing.work-order.read')
  async getProductionPlanning(
    @Req() req: AuthenticatedRequest,
    @Query('horizon') horizon?: string,
  ) {
    return this.service.getProductionPlanning(req.user.tenantId, horizon || 'MONTHLY');
  }

  @ApiOperation({ summary: 'MRP explosion with gross/net requirements and planned orders' })
  @Get('mrp/:productId')
  @Permissions('manufacturing.bom.read')
  async getMaterialRequirements(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('demand') demand?: string,
  ) {
    return this.service.getMaterialRequirements(req.user.tenantId, productId, Number(demand || 100));
  }

  @ApiOperation({ summary: 'Standard vs actual cost variance analysis' })
  @Get('cost-variance/:workOrderId')
  @Permissions('manufacturing.work-order.read')
  async getCostVariance(@Req() req: AuthenticatedRequest, @Param('workOrderId') workOrderId: string) {
    return this.service.getCostVariance(req.user.tenantId, workOrderId);
  }

  @ApiOperation({ summary: 'Manufacturing yield: first-pass yield, roll-through yield, defect density' })
  @Get('yield/:productId')
  @Permissions('manufacturing.quality.read')
  async getManufacturingYield(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getManufacturingYield(req.user.tenantId, productId, period || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Equipment effectiveness with OEE, MTBF, MTTR, downtime analysis' })
  @Get('equipment-effectiveness/:workCenterId')
  @Permissions('manufacturing.work-center.read')
  async getEquipmentEffectiveness(
    @Req() req: AuthenticatedRequest,
    @Param('workCenterId') workCenterId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getEquipmentEffectiveness(req.user.tenantId, workCenterId, period || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Shop floor real-time control with WIP tracking' })
  @Get('shop-floor/:workOrderId')
  @Permissions('manufacturing.work-order.read')
  async getShopFloorControl(@Req() req: AuthenticatedRequest, @Param('workOrderId') workOrderId: string) {
    return this.service.getShopFloorControl(req.user.tenantId, workOrderId);
  }

  @ApiOperation({ summary: 'Manufacturing executive dashboard KPIs' })
  @Get('dashboard-kpis')
  @Permissions('manufacturing.work-order.read')
  async getManufacturingDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.service.getManufacturingDashboardKpis(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Capacity forecast with bottleneck identification' })
  @Get('capacity-forecast')
  @Permissions('manufacturing.work-center.read')
  async getCapacityForecast(
    @Req() req: AuthenticatedRequest,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.service.getCapacityForecast(req.user.tenantId, periodStart, periodEnd);
  }

  @ApiOperation({ summary: 'Manufacturing unit cost breakdown (material + labor + overhead)' })
  @Get('manufacturing-cost/:productId')
  @Permissions('manufacturing.work-order.read')
  async getManufacturingCost(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Query('period') period?: string,
  ) {
    return this.service.getManufacturingCost(req.user.tenantId, productId, period || 'MONTHLY');
  }

  @ApiOperation({ summary: 'Sustainability metrics: energy, waste, recycling rate' })
  @Get('sustainability')
  @Permissions('manufacturing.work-order.read')
  async getSustainabilityMetrics(
    @Req() req: AuthenticatedRequest,
    @Query('period') period?: string,
  ) {
    return this.service.getSustainabilityMetrics(req.user.tenantId, period || 'MONTHLY');
  }
}
