import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  UseGuards, UseInterceptors, Request,
} from '@nestjs/common';
import { StockTakeService } from './stock-take.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';

interface AuthRequest {
  user: { tenantId: string; orgId: string; userId: string };
}

@Controller('inventory/stock-takes')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class StockTakeController {
  constructor(private readonly svc: StockTakeService) {}

  @Permissions('inventory.stock_take.read')
  @Get('dashboard')
  getDashboard(@Request() req: AuthRequest) {
    return this.svc.getDashboard(req.user.tenantId);
  }

  @Permissions('inventory.stock_take.read')
  @Get('accuracy-report')
  getAccuracyReport(@Request() req: AuthRequest, @Query('warehouseId') warehouseId?: string) {
    return this.svc.getAccuracyReport(req.user.tenantId, warehouseId);
  }

  @Permissions('inventory.stock_take.read')
  @Get()
  listStockTakes(
    @Request() req: AuthRequest,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listStockTakes(req.user.tenantId, warehouseId, status);
  }

  @Permissions('inventory.stock_take.manage')
  @Post()
  createStockTake(
    @Request() req: AuthRequest,
    @Body() dto: { warehouseId: string; countDate: string; countType?: string; notes?: string },
  ) {
    return this.svc.createStockTake(req.user.tenantId, req.user.userId, dto);
  }

  @Permissions('inventory.stock_take.read')
  @Get(':id')
  getStockTake(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getStockTake(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Put(':id')
  updateStockTake(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { notes?: string; countDate?: string },
  ) {
    return this.svc.updateStockTake(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/start')
  startStockTake(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.startStockTake(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/cancel')
  cancelStockTake(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.cancelStockTake(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/generate-variances')
  generateVariances(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.generateVariances(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/approve')
  approveStockTake(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.approveStockTake(req.user.tenantId, id, req.user.userId);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/post')
  postStockTake(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.postStockTake(req.user.tenantId, id, req.user.userId);
  }

  // Count Sheets
  @Permissions('inventory.stock_take.read')
  @Get(':id/sheets')
  listCountSheets(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listCountSheets(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Post(':id/sheets')
  createCountSheet(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: { zone?: string; assignedTo?: string; notes?: string },
  ) {
    return this.svc.createCountSheet(req.user.tenantId, id, dto);
  }

  @Permissions('inventory.stock_take.manage')
  @Post(':id/sheets/:sheetId/items')
  addItemsToSheet(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('sheetId') sheetId: string,
    @Body() dto: { items: { productId: string; systemQty: number; uom?: string; binLocationId?: string; lotNumber?: string; unitCost?: number }[] },
  ) {
    return this.svc.addItemsToSheet(req.user.tenantId, id, sheetId, dto.items);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/sheets/:sheetId/count')
  recordCount(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('sheetId') sheetId: string,
    @Body() dto: { counts: { itemId: string; countedQty: number }[] },
  ) {
    return this.svc.recordCount(req.user.tenantId, id, sheetId, dto.counts);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch(':id/sheets/:sheetId/recount')
  recordRecount(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Param('sheetId') sheetId: string,
    @Body() dto: { counts: { itemId: string; recountedQty: number }[] },
  ) {
    return this.svc.recordRecount(req.user.tenantId, id, sheetId, dto.counts);
  }

  // Variances
  @Permissions('inventory.stock_take.read')
  @Get(':id/variances')
  listVariances(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.listVariances(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.read')
  @Get(':id/variance-report')
  getVarianceReport(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.svc.getVarianceReport(req.user.tenantId, id);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch('variances/:varianceId/approve')
  approveVariance(@Request() req: AuthRequest, @Param('varianceId') varianceId: string) {
    return this.svc.approveVariance(req.user.tenantId, varianceId, req.user.userId);
  }

  @Permissions('inventory.stock_take.manage')
  @Patch('variances/:varianceId/reject')
  rejectVariance(
    @Request() req: AuthRequest,
    @Param('varianceId') varianceId: string,
    @Body() dto: { rejectionReason: string },
  ) {
    return this.svc.rejectVariance(req.user.tenantId, varianceId, dto.rejectionReason);
  }
}
