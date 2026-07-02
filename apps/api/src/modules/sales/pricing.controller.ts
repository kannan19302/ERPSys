import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { PricingService } from './pricing.service';
import { calculatePriceSchema, CalculatePriceDto } from './dto/sales-extra.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales/pricing')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  @Permissions('sales.quotation.create')
  @ApiOperation({ summary: 'Calculate price for a product/quantity/customer' })
  async calculatePrice(@Req() req: AuthReq, @ZodBody(calculatePriceSchema) body: CalculatePriceDto) {
    return this.pricingService.calculatePrice(req.user.tenantId, body.productId, body.quantity, body.customerId);
  }

  @Get('availability/:productId')
  @Permissions('inventory.stock.read')
  @ApiOperation({ summary: 'Check stock availability for a product' })
  async checkAvailability(@Req() req: AuthReq, @Param('productId') productId: string, @Query('qty') qty: string, @Query('warehouseId') warehouseId?: string) {
    return this.pricingService.checkAvailability(req.user.tenantId, productId, Number(qty) || 1, warehouseId);
  }
}
