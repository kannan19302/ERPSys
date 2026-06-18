import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FinanceService } from './finance.service';
import { CreateInvoiceInput, UpdateInvoiceInput, CreatePaymentInput, BulkActionInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('finance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) { }

  // ─── Invoice Endpoints ──────────────────────────────

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
      customerId,
    });
  }

  @Get('invoices/stats')
  @Permissions('finance.invoice.read')
  async getInvoiceStats(@Req() req: AuthenticatedRequest) {
    return this.financeService.getInvoiceStats(req.user.tenantId);
  }

  @Get('invoices/:id')
  @Permissions('finance.invoice.read')
  async getInvoiceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getInvoiceById(req.user.tenantId, id);
  }

  @Post('invoices')
  @Permissions('finance.invoice.create')
  async createInvoice(@Req() req: AuthenticatedRequest, @Body() dto: CreateInvoiceInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.financeService.createInvoice(req.user.tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Patch('invoices/:id')
  @Permissions('finance.invoice.update')
  async updateInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateInvoiceInput) {
    return this.financeService.updateInvoice(req.user.tenantId, id, dto);
  }

  @Delete('invoices/:id')
  @Permissions('finance.invoice.delete')
  async deleteInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.deleteInvoice(req.user.tenantId, id);
  }

  @Post('invoices/:id/send')
  @Permissions('finance.invoice.update')
  async sendInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.sendInvoice(req.user.tenantId, id);
  }

  @Post('invoices/:id/void')
  @Permissions('finance.invoice.update')
  async voidInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.voidInvoice(req.user.tenantId, id);
  }

  @Post('invoices/bulk')
  @Permissions('finance.invoice.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @Body() dto: BulkActionInput) {
    return this.financeService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  // ─── Payment Endpoints ──────────────────────────────

  @Post('payments')
  @Permissions('finance.payment.create')
  async createPayment(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentInput) {
    return this.financeService.createPayment(req.user.tenantId, dto, req.user.userId || 'system');
  }

  @Get('invoices/:id/payments')
  @Permissions('finance.payment.read')
  async getPayments(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getPayments(req.user.tenantId, id);
  }
}