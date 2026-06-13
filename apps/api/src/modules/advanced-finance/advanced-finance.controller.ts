import { Controller, Get, Post, Body, UseGuards, Req, Param, Query } from '@nestjs/common';
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
  async getExchangeRates(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getExchangeRates(req.user.tenantId);
  }

  @Get('accounts')
  @Permissions('finance.invoice.read')
  async getAccounts(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getAccounts(req.user.tenantId);
  }

  @Post('accounts')
  @Permissions('finance.invoice.create')
  async createAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { code: string; name: string; type: string; parentId?: string }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createAccount(req.user.tenantId, orgId, dto);
  }

  @Get('cost-centers')
  @Permissions('finance.report.read')
  async getCostCenters(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getCostCenters(req.user.tenantId);
  }

  @Post('cost-centers')
  @Permissions('finance.invoice.create')
  async createCostCenter(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { code: string; name: string; parentId?: string }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createCostCenter(req.user.tenantId, orgId, dto);
  }

  @Get('journals')
  @Permissions('finance.invoice.read')
  async getJournals(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getJournals(req.user.tenantId);
  }

  @Post('journals')
  @Permissions('finance.invoice.create')
  async createJournal(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { entryNumber: string; notes?: string; entries: { accountId: string; debit: number; credit: number; description?: string; departmentId?: string; costCenterId?: string; projectId?: string }[] }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createJournal(req.user.tenantId, orgId, dto);
  }

  @Get('budgets')
  @Permissions('finance.report.read')
  async getBudgets(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getBudgets(req.user.tenantId);
  }

  @Post('budgets')
  @Permissions('finance.invoice.create')
  async createBudget(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { accountId: string; amount: number; startDate: string; endDate: string }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createBudget(req.user.tenantId, orgId, dto);
  }

  @Get('reconciliations')
  @Permissions('finance.report.read')
  async getBankReconciliations(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getBankReconciliations(req.user.tenantId);
  }

  @Post('reconciliations')
  @Permissions('finance.invoice.create')
  async createBankReconciliation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { accountId: string; statementDate: string; statementBalance: number }
  ): Promise<unknown> {
    return this.financeService.createBankReconciliation(req.user.tenantId, dto);
  }

  // --- STAGE 1 ENDPIONTS ---

  @Get('financial-periods')
  @Permissions('finance.report.read')
  async getFinancialPeriods(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getFinancialPeriods(req.user.tenantId);
  }

  @Post('financial-periods')
  @Permissions('finance.invoice.create')
  async createFinancialPeriod(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { name: string; startDate: string; endDate: string; status: string }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createFinancialPeriod(req.user.tenantId, orgId, dto);
  }

  @Post('financial-periods/:id/status')
  @Permissions('finance.invoice.create')
  async updateFinancialPeriodStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: string }
  ) {
    return this.financeService.updateFinancialPeriodStatus(req.user.tenantId, id, dto.status);
  }

  @Get('fixed-assets')
  @Permissions('finance.report.read')
  async getFixedAssets(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getFixedAssets(req.user.tenantId);
  }

  @Post('fixed-assets')
  @Permissions('finance.invoice.create')
  async createFixedAsset(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { assetCode: string; name: string; purchaseDate: string; purchaseValue: number; salvageValue: number; usefulLifeYears: number; depreciationMethod: string; accountId: string; accumDepAccountId: string }
  ): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createFixedAsset(req.user.tenantId, orgId, dto);
  }

  @Get('bank-accounts')
  @Permissions('finance.report.read')
  async getBankAccounts(@Req() req: AuthenticatedRequest) {
    return this.financeService.getBankAccounts(req.user.tenantId);
  }

  @Post('bank-accounts')
  @Permissions('finance.invoice.create')
  async createBankAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { accountId: string; bankName: string; accountNumber: string; currency: string }
  ) {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createBankAccount(req.user.tenantId, orgId, dto);
  }

  // AP/AR Automation: Credit & Debit Notes
  @Get('credit-notes')
  async getCreditNotes(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getCreditNotes(req.user.tenantId);
  }

  @Post('credit-notes')
  async createCreditNote(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createCreditNote(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('debit-notes')
  async getDebitNotes(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getDebitNotes(req.user.tenantId);
  }

  @Post('debit-notes')
  async createDebitNote(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createDebitNote(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  // AP/AR Automation: Dunning (Reminders)
  @Get('dunning-levels')
  async getDunningLevels(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getDunningLevels(req.user.tenantId);
  }

  @Post('dunning-levels')
  async createDunningLevel(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createDunningLevel(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('dunning-runs')
  async getDunningRuns(@Req() req: AuthenticatedRequest) {
    return this.financeService.getDunningRuns(req.user.tenantId);
  }

  @Post('dunning-runs')
  async createDunningRun(@Req() req: AuthenticatedRequest): Promise<unknown> {
    const orgId = ((req.user.orgId || 'org-system-default')) || 'org-system-default';
    return this.financeService.createDunningRun(req.user.tenantId, orgId);
  }

  // AP/AR Automation: Payments
  @Get('payment-schedules')
  async getPaymentSchedules(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getPaymentSchedules(req.user.tenantId);
  }

  @Post('payment-schedules')
  async createPaymentSchedule(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createPaymentSchedule(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('payment-runs')
  async getPaymentRuns(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getPaymentRuns(req.user.tenantId);
  }

  @Post('payment-runs')
  async createPaymentRun(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createPaymentRun(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }


  // Budgeting & Planning




  @Get('forecast-scenarios')
  async getForecastScenarios(@Req() req: AuthenticatedRequest) {
    return this.financeService.getForecastScenarios(req.user.tenantId);
  }

  @Post('forecast-scenarios')
  async createForecastScenario(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createForecastScenario(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  // Financial Reporting Engine
  @Get('reports/pnl')
  async getProfitAndLoss(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getProfitAndLoss(req.user.tenantId, ((req.user.orgId || 'org-system-default')), startDate, endDate);
  }

  @Get('reports/balance-sheet')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.financeService.getBalanceSheet(req.user.tenantId, ((req.user.orgId || 'org-system-default')), asOfDate);
  }

  @Get('reports/cash-flow')
  async getCashFlow(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getCashFlow(req.user.tenantId, ((req.user.orgId || 'org-system-default')), startDate, endDate);
  }


  // Tax Engine & Statutory Compliance
  @Get('tax-rules')
  async getTaxRules(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getTaxRules(req.user.tenantId);
  }

  @Post('tax-rules')
  async createTaxRule(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createTaxRule(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('withholding-taxes')
  async getWithholdingTaxes(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getWithholdingTaxes(req.user.tenantId);
  }

  @Post('withholding-taxes')
  async createWithholdingTax(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createWithholdingTax(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('tax-filings')
  async getTaxFilings(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getTaxFilings(req.user.tenantId);
  }

  @Post('tax-filings')
  async createTaxFiling(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createTaxFiling(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }


  // Treasury & Investments
  @Get('investment-portfolios')
  async getInvestmentPortfolios(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getInvestmentPortfolios(req.user.tenantId);
  }

  @Post('investment-portfolios')
  async createInvestmentPortfolio(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createInvestmentPortfolio(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('treasury-transactions')
  async getTreasuryTransactions(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getTreasuryTransactions(req.user.tenantId);
  }

  @Post('treasury-transactions')
  async createTreasuryTransaction(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.financeService.createTreasuryTransaction(req.user.tenantId, ((req.user.orgId || 'org-system-default')), body);
  }

  @Get('inter-company-transfers')
  async getInterCompanyTransfers(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.financeService.getInterCompanyTransfers(req.user.tenantId);
  }

}
