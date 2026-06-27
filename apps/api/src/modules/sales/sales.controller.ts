import { Controller, Get, Post, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { SalesService } from './sales.service';
import {
  CreateQuotationInput,
  CreateSalesOrderInput,
  CreateDeliveryNoteInput,
  UpdateSalesOrderStatusInput,
  CreateSalesReturnInput,
  createQuotationSchema,
  createSalesOrderSchema,
  updateSalesOrderStatusSchema,
  createDeliveryNoteSchema,
  createSalesReturnSchema } from '@unerp/shared';
import {
  recordOrderPaymentSchema,
  RecordOrderPaymentDto,
  updateQuotationStatusSchema,
  UpdateQuotationStatusDto,
  markDeliveryShippedSchema,
  MarkDeliveryShippedDto,
  processReturnSchema,
  ProcessReturnDto } from './dto/sales-extra.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ─── Quotations ────────────────────────────────────

  @Permissions('sales.read')
  @Get('quotations')
  @Permissions('sales.quotation.read')
  @ApiOperation({ summary: 'List quotations' })
  async getQuotations(@Req() req: AuthenticatedRequest) {
    return this.salesService.getQuotations(req.user.tenantId);
  }

  @Permissions('sales.create')
  @Post('quotations')
  @Permissions('sales.quotation.create')
  @ApiOperation({ summary: 'Create a quotation' })
  async createQuotation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createQuotationSchema) dto: CreateQuotationInput,
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.salesService.createQuotation(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  // ─── Sales Orders ──────────────────────────────────

  @Permissions('sales.read')
  @Get('orders')
  @Permissions('sales.order.read')
  @ApiOperation({ summary: 'List sales orders' })
  async getSalesOrders(
    @Req() req: AuthenticatedRequest,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
  ) {
    return this.salesService.getSalesOrders(req.user.tenantId, channel, status);
  }

  @Permissions('sales.read')
  @Get('orders/:id')
  @Permissions('sales.order.read')
  @ApiOperation({ summary: 'Get a sales order by id' })
  async getSalesOrderById(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<unknown> {
    return this.salesService.getSalesOrderById(req.user.tenantId, id);
  }

  @Permissions('sales.create')
  @Post('orders')
  @Permissions('sales.order.create')
  @ApiOperation({ summary: 'Create a sales order' })
  async createSalesOrder(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createSalesOrderSchema) dto: CreateSalesOrderInput,
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.salesService.createSalesOrder(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Permissions('sales.update')
  @Patch('orders/:id/status')
  @Permissions('sales.order.update')
  @ApiOperation({ summary: 'Update sales order status' })
  async updateSalesOrderStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateSalesOrderStatusSchema) dto: UpdateSalesOrderStatusInput,
  ): Promise<unknown> {
    return this.salesService.updateSalesOrderStatus(req.user.tenantId, id, dto.status);
  }

  @Permissions('sales.create')
  @Post('orders/:id/convert')
  @Permissions('sales.order.create')
  @ApiOperation({ summary: 'Convert a quotation to a sales order' })
  async convertQuotation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.salesService.convertQuotationToOrder(req.user.tenantId, id, req.user.userId || 'system');
  }

  @Permissions('sales.update')
  @Patch('orders/:id/approve-credit')
  @Permissions('sales.order.update')
  @ApiOperation({ summary: 'Approve a credit hold on a sales order' })
  async approveCreditHold(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.salesService.approveCreditHold(req.user.tenantId, id, req.user.userId || 'system');
  }

  @Permissions('sales.create')
  @Post('orders/:id/payment')
  @Permissions('sales.order.update')
  @ApiOperation({ summary: 'Record a payment against a sales order' })
  async recordOrderPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(recordOrderPaymentSchema) dto: RecordOrderPaymentDto,
  ): Promise<unknown> {
    return this.salesService.recordOrderPayment(
      req.user.tenantId,
      id,
      dto.amount,
      dto.method,
      req.user.userId || 'system',
    );
  }

  // ─── Quotation Detail ───────────────────────────────

  @Permissions('sales.read')
  @Get('quotations/:id')
  @Permissions('sales.quotation.read')
  @ApiOperation({ summary: 'Get a quotation by id' })
  async getQuotationById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.salesService.getQuotationById(req.user.tenantId, id);
  }

  @Permissions('sales.update')
  @Patch('quotations/:id/status')
  @Permissions('sales.quotation.update')
  @ApiOperation({ summary: 'Update quotation status' })
  async updateQuotationStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateQuotationStatusSchema) dto: UpdateQuotationStatusDto,
  ) {
    return this.salesService.updateQuotationStatus(req.user.tenantId, id, dto.status);
  }

  // ─── Delivery Notes ────────────────────────────────

  @Permissions('sales.read')
  @Get('delivery-notes')
  @Permissions('sales.delivery-note.read')
  @ApiOperation({ summary: 'List delivery notes' })
  async getDeliveryNotes(@Req() req: AuthenticatedRequest, @Query('orderId') orderId?: string) {
    return this.salesService.getDeliveryNotes(req.user.tenantId, orderId);
  }

  @Permissions('sales.read')
  @Get('delivery-notes/:id')
  @Permissions('sales.delivery-note.read')
  @ApiOperation({ summary: 'Get a delivery note by id' })
  async getDeliveryNoteById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.salesService.getDeliveryNoteById(req.user.tenantId, id);
  }

  @Permissions('sales.create')
  @Post('delivery-notes')
  @Permissions('sales.delivery-note.create')
  @ApiOperation({ summary: 'Create a delivery note' })
  async createDeliveryNote(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDeliveryNoteSchema) dto: CreateDeliveryNoteInput,
  ) {
    return this.salesService.createDeliveryNote(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Permissions('sales.update')
  @Patch('delivery-notes/:id/ship')
  @Permissions('sales.delivery-note.update')
  @ApiOperation({ summary: 'Mark a delivery note as shipped' })
  async markDeliveryNoteShipped(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(markDeliveryShippedSchema) dto: MarkDeliveryShippedDto,
  ) {
    return this.salesService.markDeliveryNoteShipped(req.user.tenantId, id, dto.trackingNumber, dto.carrier);
  }

  // ─── Sales Returns (RMA) ───────────────────────────

  @Permissions('sales.read')
  @Get('returns')
  @Permissions('sales.return.read')
  @ApiOperation({ summary: 'List sales returns' })
  async getSalesReturns(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.salesService.getSalesReturns(req.user.tenantId, status);
  }

  @Permissions('sales.read')
  @Get('returns/:id')
  @Permissions('sales.return.read')
  @ApiOperation({ summary: 'Get a sales return by id' })
  async getSalesReturnById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.salesService.getSalesReturnById(req.user.tenantId, id);
  }

  @Permissions('sales.create')
  @Post('returns')
  @Permissions('sales.return.create')
  @ApiOperation({ summary: 'Create a sales return (RMA)' })
  async createSalesReturn(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createSalesReturnSchema) dto: CreateSalesReturnInput,
  ): Promise<unknown> {
    const orgId = req.user.orgId || 'org-system-default';
    return this.salesService.createSalesReturn(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Permissions('sales.update')
  @Patch('returns/:id/process')
  @Permissions('sales.return.update')
  @ApiOperation({ summary: 'Process a sales return (approve/reject/receive/refund)' })
  async processReturn(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(processReturnSchema) dto: ProcessReturnDto,
  ) {
    return this.salesService.processReturn(req.user.tenantId, id, dto.action, dto.notes, req.user.userId || 'system');
  }

  // ─── Dashboard Stats ───────────────────────────────

  @Permissions('sales.read')
  @Get('stats')
  @Permissions('sales.order.read')
  @ApiOperation({ summary: 'Sales dashboard statistics' })
  async getSalesStats(@Req() req: AuthenticatedRequest) {
    return this.salesService.getSalesStats(req.user.tenantId);
  }
}
