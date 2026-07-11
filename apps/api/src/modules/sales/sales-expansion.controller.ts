import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { SalesCpqService } from './sales-cpq.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[]; orgId?: string };
}

@ApiTags('sales-expansion')
@ApiBearerAuth()
@Controller('sales/expansion')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesExpansionController {
  constructor(
    private readonly cpqService: SalesCpqService,
    private readonly fulfillmentService: SalesFulfillmentService,
  ) {}

  // ── GROUP 4: CPQ ────────────────────────────────────
  @ApiOperation({ summary: 'Get Product Configuration' })
  @Get('product-configuration/:productId')
  @Permissions('sales.quotation.read')
  async getProductConfiguration(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    return this.cpqService.getProductConfiguration(req.user.tenantId, productId);
  }

  @ApiOperation({ summary: 'Get Quote Margin Analysis' })
  @Get('quote-margin-analysis/:quotationId')
  @Permissions('sales.quotation.read')
  async getQuoteMarginAnalysis(@Req() req: AuthenticatedRequest, @Param('quotationId') quotationId: string) {
    return this.cpqService.getQuoteMarginAnalysis(req.user.tenantId, quotationId);
  }

  @ApiOperation({ summary: 'Get Quote Profitability' })
  @Get('quote-profitability')
  @Permissions('sales.quotation.read')
  async getQuoteProfitability(@Req() req: AuthenticatedRequest) {
    return this.cpqService.getQuoteProfitabilityDashboard(req.user.tenantId);
  }

  // ── GROUP 5: ORDER FULFILLMENT ──────────────────────
  @ApiOperation({ summary: 'Get Backorders' })
  @Get('backorders')
  @Permissions('sales.order.read')
  async getBackorders(@Req() req: AuthenticatedRequest) {
    return this.fulfillmentService.getBackorders(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Order Sla Status' })
  @Get('order-sla-status')
  @Permissions('sales.order.read')
  async getOrderSlaStatus(@Req() req: AuthenticatedRequest) {
    return this.fulfillmentService.getOrderSlaStatus(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get Order Profitability' })
  @Get('order-profitability')
  @Permissions('sales.order.read')
  async getOrderProfitability(@Req() req: AuthenticatedRequest) {
    return this.fulfillmentService.getOrderProfitabilityAnalysis(req.user.tenantId);
  }
}
