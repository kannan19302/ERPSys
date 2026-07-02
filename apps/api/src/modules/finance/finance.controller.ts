import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query, UseInterceptors } from '@nestjs/common';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FinanceService } from './finance.service';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  BulkActionInput,
  createInvoiceSchema,
  updateInvoiceSchema,
  createPaymentSchema,
  bulkActionSchema,
} from '@unerp/shared';
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

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  // ─── Invoice Endpoints ──────────────────────────────

  @ApiOperation({ summary: 'Get invoices' })
  @Get('invoices')
  @Permissions('finance.invoice.read')
  async getInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.financeService.getInvoices(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      search,
      status,
      customerId });
  }

  @ApiOperation({ summary: 'Get invoice stats' })
  @Get('invoices/stats')
  @Permissions('finance.invoice.read')
  async getInvoiceStats(@Req() req: AuthenticatedRequest) {
    return this.financeService.getInvoiceStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get invoice by id' })
  @Get('invoices/:id')
  @Permissions('finance.invoice.read')
  async getInvoiceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getInvoiceById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create invoice' })
  @Post('invoices')
  @Permissions('finance.invoice.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Invoice')
  async createInvoice(@Req() req: AuthenticatedRequest, @ZodBody(createInvoiceSchema) dto: CreateInvoiceInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.financeService.createInvoice(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Update invoice' })
  @Patch('invoices/:id')
  @Permissions('finance.invoice.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Invoice', 'id')
  async updateInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(updateInvoiceSchema) dto: UpdateInvoiceInput) {
    return this.financeService.updateInvoice(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete invoice' })
  @Delete('invoices/:id')
  @Permissions('finance.invoice.delete')
  async deleteInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.deleteInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Send invoice' })
  @Post('invoices/:id/send')
  @Permissions('finance.invoice.update')
  async sendInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.sendInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Void invoice' })
  @Post('invoices/:id/void')
  @Permissions('finance.invoice.update')
  async voidInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.voidInvoice(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Bulk action' })
  @Post('invoices/bulk')
  @Permissions('finance.invoice.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @ZodBody(bulkActionSchema) dto: BulkActionInput) {
    return this.financeService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  // ─── Payment Endpoints ──────────────────────────────

  @ApiOperation({ summary: 'Create payment' })
  @Post('payments')
  @Permissions('finance.payment.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Payment')
  async createPayment(@Req() req: AuthenticatedRequest, @ZodBody(createPaymentSchema) dto: CreatePaymentInput) {
    return this.financeService.createPayment(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Get payments' })
  @Get('invoices/:id/payments')
  @Permissions('finance.payment.read')
  async getPayments(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getPayments(req.user.tenantId, id);
  }
}