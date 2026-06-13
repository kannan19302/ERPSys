import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SalesService } from './sales.service';
import {
  CreateQuotationInput,
  CreateSalesOrderInput,
  CreateDeliveryNoteInput,
  UpdateSalesOrderStatusInput,
} from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('sales')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ─── Quotations ────────────────────────────────────

  @Get('quotations')
  @Permissions('sales.quotation.read')
  async getQuotations(@Req() req: AuthenticatedRequest) {
    return this.salesService.getQuotations(req.user.tenantId);
  }

  @Post('quotations')
  @Permissions('sales.quotation.create')
  async createQuotation(@Req() req: AuthenticatedRequest, @Body() dto: CreateQuotationInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.salesService.createQuotation(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ─── Sales Orders ──────────────────────────────────

  @Get('orders')
  @Permissions('sales.order.read')
  async getSalesOrders(
    @Req() req: AuthenticatedRequest,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
  ) {
    return this.salesService.getSalesOrders(req.user.tenantId, channel, status);
  }

  @Get('orders/:id')
  @Permissions('sales.order.read')
  async getSalesOrderById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.salesService.getSalesOrderById(req.user.tenantId, id);
  }

  @Post('orders')
  @Permissions('sales.order.create')
  async createSalesOrder(@Req() req: AuthenticatedRequest, @Body() dto: CreateSalesOrderInput): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.salesService.createSalesOrder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('orders/:id/status')
  @Permissions('sales.order.update')
  async updateSalesOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderStatusInput,
  ): Promise<unknown> {
    return this.salesService.updateSalesOrderStatus(req.user.tenantId, id, dto.status);
  }

  @Post('orders/:id/convert')
  @Permissions('sales.order.create')
  async convertQuotation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.salesService.convertQuotationToOrder(req.user.tenantId, id, req.user.userId || 'system');
  }

  @Patch('orders/:id/approve-credit')
  @Permissions('sales.order.update')
  async approveCreditHold(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.salesService.approveCreditHold(req.user.tenantId, id, req.user.userId || 'system');
  }

  @Post('orders/:id/payment')
  @Permissions('sales.order.update')
  async recordOrderPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { amount: number; method: string },
  ): Promise<unknown> {
    return this.salesService.recordOrderPayment(
      req.user.tenantId,
      id,
      dto.amount,
      dto.method,
      req.user.userId || 'system',
    );
  }

  // ─── Delivery Notes ────────────────────────────────

  @Post('delivery-notes')
  @Permissions('sales.delivery-note.create')
  async createDeliveryNote(@Req() req: AuthenticatedRequest, @Body() dto: CreateDeliveryNoteInput) {
    return this.salesService.createDeliveryNote(req.user.tenantId, dto, req.user.userId || 'system');
  }
}
