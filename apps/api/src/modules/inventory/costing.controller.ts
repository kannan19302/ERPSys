import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CostingService } from './costing.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory/costing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  @ApiOperation({ summary: 'Get product valuation' })
  @Permissions('inventory.read')
  @Get('valuation/:productId')
  @Permissions('inventory.stock.read')
  async getProductValuation(@Req() req: AuthReq, @Param('productId') productId: string, @Query('method') method?: string) {
    return this.costingService.calculateInventoryValue(req.user.tenantId, productId, (method as any) || 'WEIGHTED_AVERAGE');
  }

  @ApiOperation({ summary: 'Get valuation report' })
  @Permissions('inventory.read')
  @Get('valuation-report')
  @Permissions('inventory.stock.read')
  async getValuationReport(@Req() req: AuthReq, @Query('method') method?: string) {
    return this.costingService.getValuationReport(req.user.tenantId, (method as any) || 'WEIGHTED_AVERAGE');
  }

  @ApiOperation({ summary: 'Calculate landed cost' })
  @Permissions('inventory.create')
  @Post('landed-cost')
  @Permissions('inventory.stock.adjust')
  async calculateLandedCost(@Req() req: AuthReq, @ZodBody(z.any()) body: { receiptId: string; additionalCosts: Array<{ description: string; amount: number; allocateBy: 'QUANTITY' | 'VALUE' | 'WEIGHT' }> }) {
    return this.costingService.calculateLandedCost(req.user.tenantId, body.receiptId, body.additionalCosts);
  }

  @ApiOperation({ summary: 'Lookup barcode' })
  @Permissions('inventory.read')
  @Get('barcode/:barcode')
  @Permissions('inventory.product.read')
  async lookupBarcode(@Req() req: AuthReq, @Param('barcode') barcode: string) {
    return this.costingService.getBarcodeProduct(req.user.tenantId, barcode);
  }
}
