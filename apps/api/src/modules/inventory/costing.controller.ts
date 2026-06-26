import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CostingService } from './costing.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('inventory/costing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  @Get('valuation/:productId')
  @Permissions('inventory.stock.read')
  async getProductValuation(@Req() req: AuthReq, @Param('productId') productId: string, @Query('method') method?: string) {
    return this.costingService.calculateInventoryValue(req.user.tenantId, productId, (method as any) || 'WEIGHTED_AVERAGE');
  }

  @Get('valuation-report')
  @Permissions('inventory.stock.read')
  async getValuationReport(@Req() req: AuthReq, @Query('method') method?: string) {
    return this.costingService.getValuationReport(req.user.tenantId, (method as any) || 'WEIGHTED_AVERAGE');
  }

  @Post('landed-cost')
  @Permissions('inventory.stock.adjust')
  async calculateLandedCost(@Req() req: AuthReq, @Body() body: { receiptId: string; additionalCosts: Array<{ description: string; amount: number; allocateBy: 'QUANTITY' | 'VALUE' | 'WEIGHT' }> }) {
    return this.costingService.calculateLandedCost(req.user.tenantId, body.receiptId, body.additionalCosts);
  }

  @Get('barcode/:barcode')
  @Permissions('inventory.product.read')
  async lookupBarcode(@Req() req: AuthReq, @Param('barcode') barcode: string) {
    return this.costingService.getBarcodeProduct(req.user.tenantId, barcode);
  }
}
