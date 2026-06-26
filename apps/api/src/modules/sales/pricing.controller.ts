import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PricingService } from './pricing.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('sales/pricing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @Permissions('sales.quotation.create')
  async calculatePrice(@Req() req: AuthReq, @Body() body: { productId: string; quantity: number; customerId?: string }) {
    return this.pricingService.calculatePrice(req.user.tenantId, body.productId, body.quantity, body.customerId);
  }

  @Get('availability/:productId')
  @Permissions('inventory.stock.read')
  async checkAvailability(@Req() req: AuthReq, @Param('productId') productId: string, @Query('qty') qty: string, @Query('warehouseId') warehouseId?: string) {
    return this.pricingService.checkAvailability(req.user.tenantId, productId, Number(qty) || 1, warehouseId);
  }
}
