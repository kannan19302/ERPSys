import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { FinanceService } from './finance.service';
import { CreateInvoiceInput, CreatePaymentInput } from '@unerp/shared';

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
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  @Permissions('finance.invoice.read')
  async getInvoices(@Req() req: AuthenticatedRequest): Promise<unknown> {
    const tenantId = req.user.tenantId;
    return this.financeService.getInvoices(tenantId);
  }

  @Post('invoices')
  @Permissions('finance.invoice.create')
  async createInvoice(@Req() req: AuthenticatedRequest, @Body() dto: CreateInvoiceInput): Promise<unknown> {
    const tenantId = req.user.tenantId;
    const orgId = req.user.orgId || 'org-system-default'; 
    return this.financeService.createInvoice(tenantId, orgId, dto, req.user.userId || 'system');
  }

  @Post('payments')
  @Permissions('finance.payment.create')
  async createPayment(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentInput): Promise<unknown> {
    const tenantId = req.user.tenantId;
    return this.financeService.createPayment(tenantId, dto, req.user.userId || 'system');
  }
}
