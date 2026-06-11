import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdvancedFinanceService } from './advanced-finance.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('advanced-finance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedFinanceController {
  constructor(private readonly financeService: AdvancedFinanceService) {}

  @Get('exchange-rates')
  @Permissions('finance.report.read')
  async getExchangeRates(@Req() req: AuthenticatedRequest) {
    return this.financeService.getExchangeRates(req.user.tenantId);
  }

  @Get('accounts')
  @Permissions('finance.invoice.read')
  async getAccounts(@Req() req: AuthenticatedRequest) {
    return this.financeService.getAccounts(req.user.tenantId);
  }

  @Post('accounts')
  @Permissions('finance.invoice.create')
  async createAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { code: string; name: string; type: string; parentId?: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.financeService.createAccount(req.user.tenantId, orgId, dto);
  }

  @Get('journals')
  @Permissions('finance.invoice.read')
  async getJournals(@Req() req: AuthenticatedRequest) {
    return this.financeService.getJournals(req.user.tenantId);
  }

  @Post('journals')
  @Permissions('finance.invoice.create')
  async createJournal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { entryNumber: string; notes?: string; entries: { accountId: string; debit: number; credit: number; description?: string }[] }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.financeService.createJournal(req.user.tenantId, orgId, dto);
  }

  @Get('budgets')
  @Permissions('finance.report.read')
  async getBudgets(@Req() req: AuthenticatedRequest) {
    return this.financeService.getBudgets(req.user.tenantId);
  }

  @Post('budgets')
  @Permissions('finance.invoice.create')
  async createBudget(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { accountId: string; amount: number; startDate: string; endDate: string }
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.financeService.createBudget(req.user.tenantId, orgId, dto);
  }

  @Get('reconciliations')
  @Permissions('finance.report.read')
  async getBankReconciliations(@Req() req: AuthenticatedRequest) {
    return this.financeService.getBankReconciliations(req.user.tenantId);
  }

  @Post('reconciliations')
  @Permissions('finance.invoice.create')
  async createBankReconciliation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { accountId: string; statementDate: string; statementBalance: number }
  ) {
    return this.financeService.createBankReconciliation(req.user.tenantId, dto);
  }
}
