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

  @Get('exchange-rates') @Permissions('finance.report.read')
  async getExchangeRates(@Req() req: AuthenticatedRequest) { return this.financeService.getExchangeRates(req.user.tenantId); }

  @Get('accounts') @Permissions('finance.invoice.read')
  async getAccounts(@Req() req: AuthenticatedRequest) { return this.financeService.getAccounts(req.user.tenantId); }

  @Post('accounts') @Permissions('finance.invoice.create')
  async createAccount(@Req() req: AuthenticatedRequest, @Body() dto: { code: string; name: string; type: string; parentId?: string }) {
    return this.financeService.createAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Get('cost-centers') @Permissions('finance.report.read')
  async getCostCenters(@Req() req: AuthenticatedRequest) { return this.financeService.getCostCenters(req.user.tenantId); }

  @Post('cost-centers') @Permissions('finance.invoice.create')
  async createCostCenter(@Req() req: AuthenticatedRequest, @Body() dto: { code: string; name: string; parentId?: string }) {
    return this.financeService.createCostCenter(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Get('journals') @Permissions('finance.invoice.read')
  async getJournals(@Req() req: AuthenticatedRequest) { return this.financeService.getJournals(req.user.tenantId); }

  @Post('journals') @Permissions('finance.invoice.create')
  async createJournal(@Req() req: AuthenticatedRequest, @Body() dto: {
    entryNumber: string; notes?: string;
    entries: { accountId: string; debit: number; credit: number; description?: string; departmentId?: string; costCenterId?: string; projectId?: string }[]
  }) {
    return this.financeService.createJournal(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Get('budgets') @Permissions('finance.report.read')
  async getBudgets(@Req() req: AuthenticatedRequest) { return this.financeService.getBudgets(req.user.tenantId); }

  @Post('budgets') @Permissions('finance.invoice.create')
  async createBudget(@Req() req: AuthenticatedRequest, @Body() dto: { accountId: string; amount: number; startDate: string; endDate: string }) {
    return this.financeService.createBudget(req.user.tenantId, req.user.orgId || 'org-system-default', { ...dto });
  }

  @Get('bank-reconciliations') @Permissions('finance.report.read')
  async getBankReconciliations(@Req() req: AuthenticatedRequest) { return this.financeService.getBankReconciliations(req.user.tenantId); }

  @Post('bank-reconciliations') @Permissions('finance.invoice.create')
  async createBankReconciliation(@Req() req: AuthenticatedRequest, @Body() dto: { accountId: string; statementDate: string; statementBalance: number }) {
    return this.financeService.createBankReconciliation(req.user.tenantId, dto);
  }

  @Get('financial-periods') @Permissions('finance.report.read')
  async getFinancialPeriods(@Req() req: AuthenticatedRequest) { return this.financeService.getFinancialPeriods(req.user.tenantId); }

  @Post('financial-periods') @Permissions('finance.invoice.create')
  async createFinancialPeriod(@Req() req: AuthenticatedRequest, @Body() dto: { name: string; startDate: string; endDate: string; status: string }) {
    return this.financeService.createFinancialPeriod(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Post('financial-periods/:id/status') @Permissions('finance.invoice.create')
  async updateFinancialPeriodStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: { status: string }) {
    return this.financeService.updateFinancialPeriodStatus(req.user.tenantId, id, dto.status);
  }

  @Get('fixed-assets') @Permissions('finance.report.read')
  async getFixedAssets(@Req() req: AuthenticatedRequest) { return this.financeService.getFixedAssets(req.user.tenantId); }

  @Post('fixed-assets') @Permissions('finance.invoice.create')
  async createFixedAsset(@Req() req: AuthenticatedRequest, @Body() dto: {
    assetCode: string; name: string; purchaseDate: string; purchaseValue: number;
    salvageValue: number; usefulLifeYears: number; depreciationMethod: string;
    accountId: string; accumDepAccountId: string
  }) {
    return this.financeService.createFixedAsset(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Get('bank-accounts') @Permissions('finance.report.read')
  async getBankAccounts(@Req() req: AuthenticatedRequest) { return this.financeService.getBankAccounts(req.user.tenantId); }

  @Post('bank-accounts') @Permissions('finance.invoice.create')
  async createBankAccount(@Req() req: AuthenticatedRequest, @Body() dto: { accountId: string; bankName: string; accountNumber: string; currency: string }) {
    return this.financeService.createBankAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @Get('credit-notes') async getCreditNotes(@Req() req: AuthenticatedRequest) { return this.financeService.getCreditNotes(req.user.tenantId); }
  @Post('credit-notes') async createCreditNote(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createCreditNote(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('debit-notes') async getDebitNotes(@Req() req: AuthenticatedRequest) { return this.financeService.getDebitNotes(req.user.tenantId); }
  @Post('debit-notes') async createDebitNote(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createDebitNote(req.user.tenantId, req.user.orgId || '', body);
  }

  @Get('dunning-levels') async getDunningLevels(@Req() req: AuthenticatedRequest) { return this.financeService.getDunningLevels(req.user.tenantId); }
  @Post('dunning-levels') async createDunningLevel(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createDunningLevel(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('dunning-runs') async getDunningRuns(@Req() req: AuthenticatedRequest) { return this.financeService.getDunningRuns(req.user.tenantId); }
  @Post('dunning-runs') async createDunningRun(@Req() req: AuthenticatedRequest) {
    return this.financeService.createDunningRun(req.user.tenantId, req.user.orgId || '');
  }

  @Get('payment-schedules') async getPaymentSchedules(@Req() req: AuthenticatedRequest) { return this.financeService.getPaymentSchedules(req.user.tenantId); }
  @Post('payment-schedules') async createPaymentSchedule(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createPaymentSchedule(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('payment-runs') async getPaymentRuns(@Req() req: AuthenticatedRequest) { return this.financeService.getPaymentRuns(req.user.tenantId); }
  @Post('payment-runs') async createPaymentRun(@Req() req: AuthenticatedRequest, @Body() body: { bankAccountId: string; runDate: string; totalAmount?: number }) {
    return this.financeService.createPaymentRun(req.user.tenantId, req.user.orgId || '', body);
  }
  @Post('payment-runs/:id/approve') async approvePaymentRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approvePaymentRun(req.user.tenantId, id);
  }

  @Get('forecast-scenarios') async getForecastScenarios(@Req() req: AuthenticatedRequest) { return this.financeService.getForecastScenarios(req.user.tenantId); }
  @Post('forecast-scenarios') async createForecastScenario(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createForecastScenario(req.user.tenantId, req.user.orgId || '', body);
  }

  // ── TIER 1: REPORTS ──

  @Get('reports/pnl') @Permissions('finance.report.read')
  async getProfitAndLoss(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getProfitAndLoss(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }
  @Get('reports/balance-sheet') @Permissions('finance.report.read')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.financeService.getBalanceSheet(req.user.tenantId, req.user.orgId || '', asOfDate);
  }
  @Get('reports/cash-flow') @Permissions('finance.report.read')
  async getCashFlow(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getCashFlow(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }
  @Get('reports/trial-balance') @Permissions('finance.report.read')
  async getTrialBalance(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.financeService.getTrialBalance(req.user.tenantId, req.user.orgId || '', asOfDate || new Date().toISOString());
  }
  @Get('reports/aging') @Permissions('finance.report.read')
  async getAgingReport(@Req() req: AuthenticatedRequest, @Query('type') type: 'AR' | 'AP', @Query('asOfDate') asOfDate: string) {
    return this.financeService.getAgingReport(req.user.tenantId, req.user.orgId || '', type || 'AR', asOfDate || new Date().toISOString());
  }

  // ── TIER 2: Budget vs Actuals ──
  @Get('budget-vs-actuals')
  async getBudgetVsActuals(@Req() req: AuthenticatedRequest, @Query('fiscalYear') fiscalYear: string) {
    return this.financeService.getBudgetVsActuals(req.user.tenantId, req.user.orgId || '', fiscalYear || '2026');
  }

  // ── TIER 2: Multi-Currency ──
  @Post('exchange-rates')
  async updateExchangeRate(@Req() req: AuthenticatedRequest, @Body() dto: { fromCurrency: string; toCurrency: string; rate: number; date?: string }) {
    return this.financeService.updateExchangeRate(req.user.tenantId, dto);
  }
  @Get('currency-convert')
  async convertCurrency(@Req() req: AuthenticatedRequest, @Query('from') from: string, @Query('to') to: string, @Query('amount') amount: string, @Query('date') date?: string) {
    return this.financeService.convertCurrency(req.user.tenantId, from || 'USD', to || 'EUR', parseFloat(amount || '1'), date);
  }

  // ── TIER 2: Tax Computation ──
  @Get('compute-tax')
  async computeTax(@Req() req: AuthenticatedRequest, @Query('amount') amount: string, @Query('taxRuleId') taxRuleId?: string) {
    return this.financeService.computeTax(req.user.tenantId, req.user.orgId || '', parseFloat(amount || '0'), taxRuleId);
  }

  // ── TIER 2: Recurring Invoices ──
  @Post('recurring/generate')
  async generateRecurringInvoices(@Req() req: AuthenticatedRequest) {
    return this.financeService.generateRecurringInvoices(req.user.tenantId);
  }

  // ── TIER 2: Bank Reconciliation Full Flow ──
  @Post('bank-reconciliations/:id/auto-match')
  async autoMatchReconciliation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.autoMatchBankReconciliation(req.user.tenantId, id);
  }
  @Post('bank-reconciliations/import')
  async importBankStatement(@Req() req: AuthenticatedRequest, @Body() dto: { accountId: string; statementDate: string; statementBalance: number; transactions: Array<{ date: string; description: string; amount: number }> }) {
    return this.financeService.importBankStatement(req.user.tenantId, dto);
  }

  // ── TIER 3: Expense Management ──
  @Get('expense-reports')
  async getExpenseReports(@Req() req: AuthenticatedRequest) { return this.financeService.getExpenseReports(req.user.tenantId); }
  @Post('expense-reports')
  async createExpenseReport(@Req() req: AuthenticatedRequest, @Body() dto: { employeeId: string; reportNumber: string; title: string; description?: string; items: Array<{ category: string; description: string; amount: number; expenseDate: string; billable?: boolean }> }) {
    return this.financeService.createExpenseReport(req.user.tenantId, req.user.orgId || '', dto);
  }
  @Post('expense-reports/:id/approve')
  async approveExpenseReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approveExpenseReport(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── TIER 3: Revenue Recognition ──
  @Get('revenue-schedules')
  async getRevenueSchedules(@Req() req: AuthenticatedRequest) { return this.financeService.getRevenueSchedules(req.user.tenantId); }
  @Post('revenue-schedules')
  async createRevenueSchedule(@Req() req: AuthenticatedRequest, @Body() dto: { description: string; totalAmount: number; startDate: string; endDate: string; recognitionType: string; invoiceId?: string }) {
    return this.financeService.createRevenueSchedule(req.user.tenantId, req.user.orgId || '', dto);
  }
  @Post('revenue-schedules/:id/recognize')
  async recognizeRevenue(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: { amount: number }) {
    return this.financeService.recognizeRevenue(req.user.tenantId, id, dto.amount);
  }

  // ── TIER 3: Depreciation Run ──
  @Post('fixed-assets/depreciation-run')
  async runDepreciation(@Req() req: AuthenticatedRequest, @Body() dto: { asOfDate: string }) {
    return this.financeService.runDepreciation(req.user.tenantId, dto.asOfDate || new Date().toISOString());
  }

  // ── TIER 3: Period Close ──
  @Get('financial-periods/:id/close-checklist')
  async getPeriodCloseChecklist(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getPeriodCloseChecklist(req.user.tenantId, req.user.orgId || '', id);
  }

  // ── TIER 4: Cash Position ──
  @Get('cash-position')
  async getCashPosition(@Req() req: AuthenticatedRequest) {
    return this.financeService.getCashPosition(req.user.tenantId, req.user.orgId || '');
  }

  // ── TIER 4: Financial Ratios ──
  @Get('financial-ratios')
  async getFinancialRatios(@Req() req: AuthenticatedRequest) {
    return this.financeService.getFinancialRatios(req.user.tenantId, req.user.orgId || '');
  }

  // ── TIER 4: Cash Flow Forecast ──
  @Get('cash-flow-forecast')
  async getCashFlowForecast(@Req() req: AuthenticatedRequest, @Query('months') months: string) {
    return this.financeService.getCashFlowForecast(req.user.tenantId, req.user.orgId || '', parseInt(months || '3'));
  }

  // ── TIER 4: Finance Audit Trail ──
  @Get('audit-logs')
  async getFinanceAuditLogs(@Req() req: AuthenticatedRequest, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.financeService.getFinanceAuditLogs(req.user.tenantId, entityType, entityId);
  }

  // ── TIER 5: Tax Return Computation ──
  @Get('tax-returns/compute')
  async computeTaxReturn(@Req() req: AuthenticatedRequest, @Query('filingType') filingType: string, @Query('periodStart') periodStart: string, @Query('periodEnd') periodEnd: string) {
    return this.financeService.computeTaxReturn(req.user.tenantId, req.user.orgId || '', filingType || 'GSTR-1', periodStart, periodEnd);
  }

  // ── TIER 5: Account Reconciliation ──
  @Get('accounts/:id/reconcile')
  async reconcileAccount(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('asOfDate') asOfDate: string) {
    return this.financeService.reconcileAccount(req.user.tenantId, req.user.orgId || '', id, asOfDate || new Date().toISOString());
  }

  // ── TIER 5: Consolidation ──
  @Post('consolidation/run')
  async runConsolidation(@Req() req: AuthenticatedRequest, @Body() dto: { periodStart: string; periodEnd: string; eliminateIntercompany?: boolean }) {
    return this.financeService.runConsolidation(req.user.tenantId, dto.periodStart, dto.periodEnd, dto.eliminateIntercompany !== false);
  }

  // ── TIER 5: Intercompany Transfers ──
  @Post('inter-company-transfers')
  async createInterCompanyTransfer(@Req() req: AuthenticatedRequest, @Body() dto: { fromOrgId: string; toOrgId: string; amount: number; currency?: string; date?: string }) {
    return this.financeService.createInterCompanyTransfer(req.user.tenantId, dto);
  }
  @Post('inter-company-transfers/:id/approve')
  async approveInterCompanyTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approveInterCompanyTransfer(req.user.tenantId, id);
  }

  // Tax & Treasury (existing)
  @Get('tax-rules') async getTaxRules(@Req() req: AuthenticatedRequest) { return this.financeService.getTaxRules(req.user.tenantId); }
  @Post('tax-rules') async createTaxRule(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createTaxRule(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('withholding-taxes') async getWithholdingTaxes(@Req() req: AuthenticatedRequest) { return this.financeService.getWithholdingTaxes(req.user.tenantId); }
  @Post('withholding-taxes') async createWithholdingTax(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createWithholdingTax(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('tax-filings') async getTaxFilings(@Req() req: AuthenticatedRequest) { return this.financeService.getTaxFilings(req.user.tenantId); }
  @Post('tax-filings') async createTaxFiling(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createTaxFiling(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('investment-portfolios') async getInvestmentPortfolios(@Req() req: AuthenticatedRequest) { return this.financeService.getInvestmentPortfolios(req.user.tenantId); }
  @Post('investment-portfolios') async createInvestmentPortfolio(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createInvestmentPortfolio(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('treasury-transactions') async getTreasuryTransactions(@Req() req: AuthenticatedRequest) { return this.financeService.getTreasuryTransactions(req.user.tenantId); }
  @Post('treasury-transactions') async createTreasuryTransaction(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.financeService.createTreasuryTransaction(req.user.tenantId, req.user.orgId || '', body);
  }
  @Get('inter-company-transfers') async getInterCompanyTransfers(@Req() req: AuthenticatedRequest) { return this.financeService.getInterCompanyTransfers(req.user.tenantId); }
}