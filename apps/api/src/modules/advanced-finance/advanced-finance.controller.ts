import { Controller, Get, Post, UseGuards, Req, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdvancedFinanceService } from './advanced-finance.service';
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

@ApiTags('advanced-finance')
@ApiBearerAuth()
@Controller('advanced-finance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedFinanceController {
  constructor(private readonly financeService: AdvancedFinanceService) {}

  @ApiOperation({ summary: 'Get exchange rates' })
  @Permissions('advanced_finance.read')
  @Get('exchange-rates') @Permissions('finance.report.read')
  async getExchangeRates(@Req() req: AuthenticatedRequest) { return this.financeService.getExchangeRates(req.user.tenantId); }

  @ApiOperation({ summary: 'Get accounts' })
  @Permissions('advanced_finance.read')
  @Get('accounts') @Permissions('finance.invoice.read')
  async getAccounts(@Req() req: AuthenticatedRequest) { return this.financeService.getAccounts(req.user.tenantId); }

  @ApiOperation({ summary: 'Create account' })
  @Permissions('advanced_finance.create')
  @Post('accounts') @Permissions('finance.invoice.create')
  async createAccount(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { code: string; name: string; type: string; parentId?: string }) {
    return this.financeService.createAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Get cost centers' })
  @Permissions('advanced_finance.read')
  @Get('cost-centers') @Permissions('finance.report.read')
  async getCostCenters(@Req() req: AuthenticatedRequest) { return this.financeService.getCostCenters(req.user.tenantId); }

  @ApiOperation({ summary: 'Create cost center' })
  @Permissions('advanced_finance.create')
  @Post('cost-centers') @Permissions('finance.invoice.create')
  async createCostCenter(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { code: string; name: string; parentId?: string }) {
    return this.financeService.createCostCenter(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Get journals' })
  @Permissions('advanced_finance.read')
  @Get('journals') @Permissions('finance.invoice.read')
  async getJournals(@Req() req: AuthenticatedRequest) { return this.financeService.getJournals(req.user.tenantId); }

  @ApiOperation({ summary: 'Create journal' })
  @Permissions('advanced_finance.create')
  @Post('journals') @Permissions('finance.invoice.create')
  async createJournal(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: {
    entryNumber: string; notes?: string;
    entries: { accountId: string; debit: number; credit: number; description?: string; departmentId?: string; costCenterId?: string; projectId?: string }[]
  }) {
    return this.financeService.createJournal(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Get budgets' })
  @Permissions('advanced_finance.read')
  @Get('budgets') @Permissions('finance.report.read')
  async getBudgets(@Req() req: AuthenticatedRequest) { return this.financeService.getBudgets(req.user.tenantId); }

  @ApiOperation({ summary: 'Create budget' })
  @Permissions('advanced_finance.create')
  @Post('budgets') @Permissions('finance.invoice.create')
  async createBudget(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { accountId: string; amount: number; startDate: string; endDate: string }) {
    return this.financeService.createBudget(req.user.tenantId, req.user.orgId || 'org-system-default', { ...dto });
  }

  @ApiOperation({ summary: 'Get bank reconciliations' })
  @Permissions('advanced_finance.read')
  @Get('bank-reconciliations') @Permissions('finance.report.read')
  async getBankReconciliations(@Req() req: AuthenticatedRequest) { return this.financeService.getBankReconciliations(req.user.tenantId); }

  @ApiOperation({ summary: 'Create bank reconciliation' })
  @Permissions('advanced_finance.create')
  @Post('bank-reconciliations') @Permissions('finance.invoice.create')
  async createBankReconciliation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { accountId: string; statementDate: string; statementBalance: number }) {
    return this.financeService.createBankReconciliation(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get financial periods' })
  @Permissions('advanced_finance.read')
  @Get('financial-periods') @Permissions('finance.report.read')
  async getFinancialPeriods(@Req() req: AuthenticatedRequest) { return this.financeService.getFinancialPeriods(req.user.tenantId); }

  @ApiOperation({ summary: 'Create financial period' })
  @Permissions('advanced_finance.create')
  @Post('financial-periods') @Permissions('finance.invoice.create')
  async createFinancialPeriod(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; startDate: string; endDate: string; status: string }) {
    return this.financeService.createFinancialPeriod(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update financial period status' })
  @Permissions('advanced_finance.create')
  @Post('financial-periods/:id/status') @Permissions('finance.invoice.create')
  async updateFinancialPeriodStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { status: string }) {
    return this.financeService.updateFinancialPeriodStatus(req.user.tenantId, id, dto.status);
  }

  @ApiOperation({ summary: 'Get fixed assets' })
  @Permissions('advanced_finance.read')
  @Get('fixed-assets') @Permissions('finance.report.read')
  async getFixedAssets(@Req() req: AuthenticatedRequest) { return this.financeService.getFixedAssets(req.user.tenantId); }

  @ApiOperation({ summary: 'Create fixed asset' })
  @Permissions('advanced_finance.create')
  @Post('fixed-assets') @Permissions('finance.invoice.create')
  async createFixedAsset(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: {
    assetCode: string; name: string; purchaseDate: string; purchaseValue: number;
    salvageValue: number; usefulLifeYears: number; depreciationMethod: string;
    accountId: string; accumDepAccountId: string
  }) {
    return this.financeService.createFixedAsset(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Get bank accounts' })
  @Permissions('advanced_finance.read')
  @Get('bank-accounts') @Permissions('finance.report.read')
  async getBankAccounts(@Req() req: AuthenticatedRequest) { return this.financeService.getBankAccounts(req.user.tenantId); }

  @ApiOperation({ summary: 'Create bank account' })
  @Permissions('advanced_finance.create')
  @Post('bank-accounts') @Permissions('finance.invoice.create')
  async createBankAccount(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { accountId: string; bankName: string; accountNumber: string; currency: string }) {
    return this.financeService.createBankAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Create credit note' })
  @Permissions('advanced_finance.read')
  @Get('credit-notes') async getCreditNotes(@Req() req: AuthenticatedRequest) { return this.financeService.getCreditNotes(req.user.tenantId); }
  @ApiOperation({ summary: 'Get debit notes' })
  @Post('credit-notes') async createCreditNote(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createCreditNote(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create debit note' })
  @Permissions('advanced_finance.read')
  @Get('debit-notes') async getDebitNotes(@Req() req: AuthenticatedRequest) { return this.financeService.getDebitNotes(req.user.tenantId); }
  @ApiOperation({ summary: 'Get dunning levels' })
  @Post('debit-notes') async createDebitNote(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createDebitNote(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Create dunning level' })
  @Permissions('advanced_finance.read')
  @Get('dunning-levels') async getDunningLevels(@Req() req: AuthenticatedRequest) { return this.financeService.getDunningLevels(req.user.tenantId); }
  @ApiOperation({ summary: 'Get dunning runs' })
  @Post('dunning-levels') async createDunningLevel(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createDunningLevel(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create dunning run' })
  @Permissions('advanced_finance.read')
  @Get('dunning-runs') async getDunningRuns(@Req() req: AuthenticatedRequest) { return this.financeService.getDunningRuns(req.user.tenantId); }
  @ApiOperation({ summary: 'Get payment schedules' })
  @Post('dunning-runs') async createDunningRun(@Req() req: AuthenticatedRequest) {
    return this.financeService.createDunningRun(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Create payment schedule' })
  @Permissions('advanced_finance.read')
  @Get('payment-schedules') async getPaymentSchedules(@Req() req: AuthenticatedRequest) { return this.financeService.getPaymentSchedules(req.user.tenantId); }
  @ApiOperation({ summary: 'Get payment runs' })
  @Post('payment-schedules') async createPaymentSchedule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createPaymentSchedule(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create payment run' })
  @Permissions('advanced_finance.read')
  @Get('payment-runs') async getPaymentRuns(@Req() req: AuthenticatedRequest) { return this.financeService.getPaymentRuns(req.user.tenantId); }
  @ApiOperation({ summary: 'Approve payment run' })
  @Post('payment-runs') async createPaymentRun(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { bankAccountId: string; runDate: string; totalAmount?: number }) {
    return this.financeService.createPaymentRun(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Get forecast scenarios' })
  @Permissions('advanced_finance.create')
  @Post('payment-runs/:id/approve') async approvePaymentRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approvePaymentRun(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create forecast scenario' })
  @Permissions('advanced_finance.read')
  @Get('forecast-scenarios') async getForecastScenarios(@Req() req: AuthenticatedRequest) { return this.financeService.getForecastScenarios(req.user.tenantId); }
  @ApiOperation({ summary: 'Handle request' })
  @Post('forecast-scenarios') async createForecastScenario(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createForecastScenario(req.user.tenantId, req.user.orgId || '', body);
  }

  // ── TIER 1: REPORTS ──

  @ApiOperation({ summary: 'Get profit and loss' })
  @Permissions('advanced_finance.read')
  @Get('reports/pnl') @Permissions('finance.report.read')
  async getProfitAndLoss(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getProfitAndLoss(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }
  @ApiOperation({ summary: 'Get balance sheet' })
  @Permissions('advanced_finance.read')
  @Get('reports/balance-sheet') @Permissions('finance.report.read')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.financeService.getBalanceSheet(req.user.tenantId, req.user.orgId || '', asOfDate);
  }
  @ApiOperation({ summary: 'Get cash flow' })
  @Permissions('advanced_finance.read')
  @Get('reports/cash-flow') @Permissions('finance.report.read')
  async getCashFlow(@Req() req: AuthenticatedRequest, @Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.financeService.getCashFlow(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }
  @ApiOperation({ summary: 'Get trial balance' })
  @Permissions('advanced_finance.read')
  @Get('reports/trial-balance') @Permissions('finance.report.read')
  async getTrialBalance(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.financeService.getTrialBalance(req.user.tenantId, req.user.orgId || '', asOfDate || new Date().toISOString());
  }
  @ApiOperation({ summary: 'Get aging report' })
  @Permissions('advanced_finance.read')
  @Get('reports/aging') @Permissions('finance.report.read')
  async getAgingReport(@Req() req: AuthenticatedRequest, @Query('type') type: 'AR' | 'AP', @Query('asOfDate') asOfDate: string) {
    return this.financeService.getAgingReport(req.user.tenantId, req.user.orgId || '', type || 'AR', asOfDate || new Date().toISOString());
  }

  // ── TIER 2: Budget vs Actuals ──
  @ApiOperation({ summary: 'Get budget vs actuals' })
  @Permissions('advanced_finance.read')
  @Get('budget-vs-actuals')
  async getBudgetVsActuals(@Req() req: AuthenticatedRequest, @Query('fiscalYear') fiscalYear: string) {
    return this.financeService.getBudgetVsActuals(req.user.tenantId, req.user.orgId || '', fiscalYear || '2026');
  }

  // ── TIER 2: Multi-Currency ──
  @ApiOperation({ summary: 'Update exchange rate' })
  @Permissions('advanced_finance.create')
  @Post('exchange-rates')
  async updateExchangeRate(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { fromCurrency: string; toCurrency: string; rate: number; date?: string }) {
    return this.financeService.updateExchangeRate(req.user.tenantId, dto);
  }
  @ApiOperation({ summary: 'Convert currency' })
  @Permissions('advanced_finance.read')
  @Get('currency-convert')
  async convertCurrency(@Req() req: AuthenticatedRequest, @Query('from') from: string, @Query('to') to: string, @Query('amount') amount: string, @Query('date') date?: string) {
    return this.financeService.convertCurrency(req.user.tenantId, from || 'USD', to || 'EUR', parseFloat(amount || '1'), date);
  }

  // ── TIER 2: Tax Computation ──
  @ApiOperation({ summary: 'Compute tax' })
  @Permissions('advanced_finance.read')
  @Get('compute-tax')
  async computeTax(@Req() req: AuthenticatedRequest, @Query('amount') amount: string, @Query('taxRuleId') taxRuleId?: string) {
    return this.financeService.computeTax(req.user.tenantId, req.user.orgId || '', parseFloat(amount || '0'), taxRuleId);
  }

  // ── TIER 2: Recurring Invoices ──
  @ApiOperation({ summary: 'List recurring invoice schedules' })
  @Permissions('advanced_finance.read')
  @Get('recurring-schedules')
  async getRecurringSchedules(@Req() req: AuthenticatedRequest) {
    return this.financeService.getRecurringSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create recurring invoice schedule' })
  @Permissions('advanced_finance.create')
  @Post('recurring-schedules')
  async createRecurringSchedule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { entryTemplate: any; frequency: string; nextRunDate: string }) {
    return this.financeService.createRecurringSchedule(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Generate recurring invoices' })
  @Permissions('advanced_finance.create')
  @Post('recurring/generate')
  async generateRecurringInvoices(@Req() req: AuthenticatedRequest) {
    return this.financeService.generateRecurringInvoices(req.user.tenantId);
  }

  // ── TIER 2: Bank Reconciliation Full Flow ──
  @ApiOperation({ summary: 'Auto match reconciliation' })
  @Permissions('advanced_finance.create')
  @Post('bank-reconciliations/:id/auto-match')
  async autoMatchReconciliation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.autoMatchBankReconciliation(req.user.tenantId, id);
  }
  @ApiOperation({ summary: 'Import bank statement' })
  @Permissions('advanced_finance.create')
  @Post('bank-reconciliations/import')
  async importBankStatement(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { accountId: string; statementDate: string; statementBalance: number; transactions: Array<{ date: string; description: string; amount: number }> }) {
    return this.financeService.importBankStatement(req.user.tenantId, dto);
  }

  // ── TIER 3: Expense Management ──
  @ApiOperation({ summary: 'Get expense reports' })
  @Permissions('advanced_finance.read')
  @Get('expense-reports')
  async getExpenseReports(@Req() req: AuthenticatedRequest) { return this.financeService.getExpenseReports(req.user.tenantId); }
  @ApiOperation({ summary: 'Create expense report' })
  @Permissions('advanced_finance.create')
  @Post('expense-reports')
  async createExpenseReport(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { employeeId: string; reportNumber: string; title: string; description?: string; items: Array<{ category: string; description: string; amount: number; expenseDate: string; billable?: boolean }> }) {
    return this.financeService.createExpenseReport(req.user.tenantId, req.user.orgId || '', dto);
  }
  @ApiOperation({ summary: 'Approve expense report' })
  @Permissions('advanced_finance.create')
  @Post('expense-reports/:id/approve')
  async approveExpenseReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approveExpenseReport(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── TIER 3: Revenue Recognition ──
  @ApiOperation({ summary: 'Get revenue schedules' })
  @Permissions('advanced_finance.read')
  @Get('revenue-schedules')
  async getRevenueSchedules(@Req() req: AuthenticatedRequest) { return this.financeService.getRevenueSchedules(req.user.tenantId); }
  @ApiOperation({ summary: 'Create revenue schedule' })
  @Permissions('advanced_finance.create')
  @Post('revenue-schedules')
  async createRevenueSchedule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { description: string; totalAmount: number; startDate: string; endDate: string; recognitionType: string; invoiceId?: string }) {
    return this.financeService.createRevenueSchedule(req.user.tenantId, req.user.orgId || '', dto);
  }
  @ApiOperation({ summary: 'Recognize revenue' })
  @Permissions('advanced_finance.create')
  @Post('revenue-schedules/:id/recognize')
  async recognizeRevenue(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: { amount: number }) {
    return this.financeService.recognizeRevenue(req.user.tenantId, id, dto.amount);
  }

  // ── TIER 3: Depreciation Run ──
  @ApiOperation({ summary: 'Run depreciation' })
  @Permissions('advanced_finance.create')
  @Post('fixed-assets/depreciation-run')
  async runDepreciation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { asOfDate: string }) {
    return this.financeService.runDepreciation(req.user.tenantId, dto.asOfDate || new Date().toISOString());
  }

  // ── TIER 3: Period Close ──
  @ApiOperation({ summary: 'Get period close checklist' })
  @Permissions('advanced_finance.read')
  @Get('financial-periods/:id/close-checklist')
  async getPeriodCloseChecklist(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getPeriodCloseChecklist(req.user.tenantId, req.user.orgId || '', id);
  }

  // ── TIER 4: Cash Position ──
  @ApiOperation({ summary: 'Get cash position' })
  @Permissions('advanced_finance.read')
  @Get('cash-position')
  async getCashPosition(@Req() req: AuthenticatedRequest) {
    return this.financeService.getCashPosition(req.user.tenantId, req.user.orgId || '');
  }

  // ── TIER 4: Financial Ratios ──
  @ApiOperation({ summary: 'Get financial ratios' })
  @Permissions('advanced_finance.read')
  @Get('financial-ratios')
  async getFinancialRatios(@Req() req: AuthenticatedRequest) {
    return this.financeService.getFinancialRatios(req.user.tenantId, req.user.orgId || '');
  }

  // ── TIER 4: Cash Flow Forecast ──
  @ApiOperation({ summary: 'Get cash flow forecast' })
  @Permissions('advanced_finance.read')
  @Get('cash-flow-forecast')
  async getCashFlowForecast(@Req() req: AuthenticatedRequest, @Query('months') months: string) {
    return this.financeService.getCashFlowForecast(req.user.tenantId, req.user.orgId || '', parseInt(months || '3'));
  }

  // ── TIER 4: Finance Audit Trail ──
  @ApiOperation({ summary: 'Get finance audit logs' })
  @Permissions('advanced_finance.read')
  @Get('audit-logs')
  async getFinanceAuditLogs(@Req() req: AuthenticatedRequest, @Query('entityType') entityType?: string, @Query('entityId') entityId?: string) {
    return this.financeService.getFinanceAuditLogs(req.user.tenantId, entityType, entityId);
  }

  // ── TIER 5: Tax Return Computation ──
  @ApiOperation({ summary: 'Compute tax return' })
  @Permissions('advanced_finance.read')
  @Get('tax-returns/compute')
  async computeTaxReturn(@Req() req: AuthenticatedRequest, @Query('filingType') filingType: string, @Query('periodStart') periodStart: string, @Query('periodEnd') periodEnd: string) {
    return this.financeService.computeTaxReturn(req.user.tenantId, req.user.orgId || '', filingType || 'GSTR-1', periodStart, periodEnd);
  }

  // ── TIER 5: Account Reconciliation ──
  @ApiOperation({ summary: 'Reconcile account' })
  @Permissions('advanced_finance.read')
  @Get('accounts/:id/reconcile')
  async reconcileAccount(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Query('asOfDate') asOfDate: string) {
    return this.financeService.reconcileAccount(req.user.tenantId, req.user.orgId || '', id, asOfDate || new Date().toISOString());
  }

  // ── TIER 5: Consolidation ──
  @ApiOperation({ summary: 'Run consolidation' })
  @Permissions('advanced_finance.create')
  @Post('consolidation/run')
  async runConsolidation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { periodStart: string; periodEnd: string; eliminateIntercompany?: boolean }) {
    return this.financeService.runConsolidation(req.user.tenantId, dto.periodStart, dto.periodEnd, dto.eliminateIntercompany !== false);
  }

  // ── TIER 5: Intercompany Transfers ──
  @ApiOperation({ summary: 'Create inter company transfer' })
  @Permissions('advanced_finance.create')
  @Post('inter-company-transfers')
  async createInterCompanyTransfer(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { fromOrgId: string; toOrgId: string; amount: number; currency?: string; date?: string }) {
    return this.financeService.createInterCompanyTransfer(req.user.tenantId, dto);
  }
  @ApiOperation({ summary: 'Approve inter company transfer' })
  @Permissions('advanced_finance.create')
  @Post('inter-company-transfers/:id/approve')
  async approveInterCompanyTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.approveInterCompanyTransfer(req.user.tenantId, id);
  }

  // Tax & Treasury (existing)
  @ApiOperation({ summary: 'Create tax rule' })
  @Permissions('advanced_finance.read')
  @Get('tax-rules') async getTaxRules(@Req() req: AuthenticatedRequest) { return this.financeService.getTaxRules(req.user.tenantId); }
  @ApiOperation({ summary: 'Get withholding taxes' })
  @Post('tax-rules') async createTaxRule(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createTaxRule(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create withholding tax' })
  @Permissions('advanced_finance.read')
  @Get('withholding-taxes') async getWithholdingTaxes(@Req() req: AuthenticatedRequest) { return this.financeService.getWithholdingTaxes(req.user.tenantId); }
  @ApiOperation({ summary: 'Get tax filings' })
  @Post('withholding-taxes') async createWithholdingTax(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createWithholdingTax(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create tax filing' })
  @Permissions('advanced_finance.read')
  @Get('tax-filings') async getTaxFilings(@Req() req: AuthenticatedRequest) { return this.financeService.getTaxFilings(req.user.tenantId); }
  @ApiOperation({ summary: 'Get investment portfolios' })
  @Post('tax-filings') async createTaxFiling(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createTaxFiling(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create investment portfolio' })
  @Permissions('advanced_finance.read')
  @Get('investment-portfolios') async getInvestmentPortfolios(@Req() req: AuthenticatedRequest) { return this.financeService.getInvestmentPortfolios(req.user.tenantId); }
  @ApiOperation({ summary: 'Get treasury transactions' })
  @Post('investment-portfolios') async createInvestmentPortfolio(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createInvestmentPortfolio(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Create treasury transaction' })
  @Permissions('advanced_finance.read')
  @Get('treasury-transactions') async getTreasuryTransactions(@Req() req: AuthenticatedRequest) { return this.financeService.getTreasuryTransactions(req.user.tenantId); }
  @ApiOperation({ summary: 'Get inter company transfers' })
  @Post('treasury-transactions') async createTreasuryTransaction(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: unknown) {
    return this.financeService.createTreasuryTransaction(req.user.tenantId, req.user.orgId || '', body);
  }
  @ApiOperation({ summary: 'Get currency revaluations' })
  @Permissions('advanced_finance.read')
  @Get('inter-company-transfers') async getInterCompanyTransfers(@Req() req: AuthenticatedRequest) { return this.financeService.getInterCompanyTransfers(req.user.tenantId); }

  @ApiOperation({ summary: 'Get currency revaluations' })
  @Permissions('advanced_finance.read')
  @Get('currency-revaluations') @Permissions('finance.report.read')
  async getCurrencyRevaluations(@Req() req: AuthenticatedRequest) { return this.financeService.getCurrencyRevaluations(req.user.tenantId); }

  @ApiOperation({ summary: 'Run currency revaluation' })
  @Permissions('advanced_finance.create')
  @Post('currency-revaluations/run') @Permissions('finance.invoice.create')
  async runCurrencyRevaluation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { asOfDate?: string; baseCurrency?: string }) {
    return this.financeService.runCurrencyRevaluation(req.user.tenantId, req.user.orgId || 'org-system-default', body.asOfDate || new Date().toISOString(), body.baseCurrency || 'USD');
  }

  @ApiOperation({ summary: 'Get e invoices' })
  @Permissions('advanced_finance.read')
  @Get('e-invoices') @Permissions('finance.invoice.read')
  async getEInvoices(@Req() req: AuthenticatedRequest, @Query('invoiceId') invoiceId?: string) {
    return this.financeService.getEInvoices(req.user.tenantId, invoiceId);
  }

  @ApiOperation({ summary: 'Get e invoice by id' })
  @Permissions('advanced_finance.read')
  @Get('e-invoices/:id') @Permissions('finance.invoice.read')
  async getEInvoiceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.financeService.getEInvoiceById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Generate e invoice' })
  @Permissions('advanced_finance.create')
  @Post('e-invoices/generate') @Permissions('finance.invoice.create')
  async generateEInvoice(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { invoiceId: string; format?: string }) {
    return this.financeService.generateEInvoice(req.user.tenantId, req.user.orgId || 'org-system-default', body.invoiceId, body.format || 'UBL');
  }
}