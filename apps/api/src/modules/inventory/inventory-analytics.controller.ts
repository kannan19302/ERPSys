import { Controller, Get, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { InventoryAnalyticsService } from './inventory-analytics.service';

interface AuthReq extends Request {
  user: { tenantId: string; orgId: string; userId: string };
}

@ApiTags('inventory-analytics')
@Controller('inventory/analytics')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class InventoryAnalyticsController {
  constructor(private readonly service: InventoryAnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Aggregate inventory analytics dashboard' })
  getDashboard(@Req() req: AuthReq) {
    return this.service.getAnalyticsDashboard(req.user.tenantId);
  }

  @Get('health-score')
  @ApiOperation({ summary: 'Inventory health score with component breakdown' })
  getHealthScore(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.getInventoryHealthScore(req.user.tenantId, warehouseId);
  }

  @Get('slow-moving')
  @ApiOperation({ summary: 'Slow-moving inventory items (no outbound in N days)' })
  getSlowMoving(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string, @Query('days') days?: string) {
    return this.service.getSlowMovingInventory(req.user.tenantId, warehouseId, days ? parseInt(days) : 90);
  }

  @Get('dio')
  @ApiOperation({ summary: 'Days Inventory Outstanding (DIO) per product' })
  getDio(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.getDaysInventoryOutstanding(req.user.tenantId, warehouseId);
  }

  @Get('fill-rate')
  @ApiOperation({ summary: 'Pick-wave fill rate report' })
  getFillRate(@Req() req: AuthReq, @Query('days') days?: string) {
    return this.service.getFillRateReport(req.user.tenantId, days ? parseInt(days) : 30);
  }

  @Get('volume-trends')
  @ApiOperation({ summary: 'Daily inbound/outbound volume trend data' })
  getVolumeTrends(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string, @Query('days') days?: string) {
    return this.service.getVolumeTrends(req.user.tenantId, warehouseId, days ? parseInt(days) : 30);
  }

  @Get('shrinkage')
  @ApiOperation({ summary: 'Shrinkage and loss analysis from negative adjustments' })
  getShrinkage(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string, @Query('days') days?: string) {
    return this.service.getShrinkageReport(req.user.tenantId, warehouseId, days ? parseInt(days) : 90);
  }

  @Get('capacity-utilization')
  @ApiOperation({ summary: 'Bin and quantity utilization per warehouse' })
  getCapacityUtilization(@Req() req: AuthReq, @Query('warehouseId') warehouseId?: string) {
    return this.service.getCapacityUtilization(req.user.tenantId, warehouseId);
  }

  @Get('multi-warehouse')
  @ApiOperation({ summary: 'Side-by-side comparison of all warehouses' })
  getMultiWarehouseComparison(@Req() req: AuthReq) {
    return this.service.getMultiWarehouseComparison(req.user.tenantId);
  }
}
