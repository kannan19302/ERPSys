import { Injectable } from '@nestjs/common';
import {
  GlAccountingService,
  BudgetingService,
  BankingService,
  ExpenseManagementService,
  RevenueRecognitionService,
  TaxEngineService,
  TreasuryService,
  ConsolidationService,
  FinancialReportingService,
  PeriodManagementService,
} from './services';

@Injectable()
export class AdvancedFinanceService {
  constructor(
    private readonly glService: GlAccountingService,
    private readonly budgetingService: BudgetingService,
    private readonly bankingService: BankingService,
    private readonly expenseService: ExpenseManagementService,
    private readonly revenueService: RevenueRecognitionService,
    private readonly taxService: TaxEngineService,
    private readonly treasuryService: TreasuryService,
    private readonly consolidationService: ConsolidationService,
    private readonly reportingService: FinancialReportingService,
    private readonly periodService: PeriodManagementService,
  ) {}

  // exchange rates
  async getExchangeRates(tenantId: string) { return this.treasuryService.getExchangeRates(tenantId); }
  async updateExchangeRate(tenantId: string, dto: any) { return this.treasuryService.updateExchangeRate(tenantId, dto); }
  async convertCurrency(tenantId: string, from: string, to: string, amount: number, date?: string) { return this.treasuryService.convertCurrency(tenantId, from, to, amount, date); }
  async getCurrencyRevaluations(tenantId: string) { return this.treasuryService.getCurrencyRevaluations(tenantId); }
  async runCurrencyRevaluation(tenantId: string, orgId: string, asOfDate: string, baseCurrency: string) { return this.treasuryService.runCurrencyRevaluation(tenantId, orgId, asOfDate, baseCurrency); }

  // accounts
  async getAccounts(tenantId: string) { return this.glService.getAccounts(tenantId); }
  async getAccountById(tenantId: string, id: string) { return this.glService.getAccountById(tenantId, id); }
  async createAccount(tenantId: string, orgId: string, dto: any) { return this.glService.createAccount(tenantId, orgId, dto); }
  async updateAccount(tenantId: string, id: string, dto: any) { return this.glService.updateAccount(tenantId, id, dto); }
  async deleteAccount(tenantId: string, id: string) { return this.glService.deleteAccount(tenantId, id); }
  async getAccountLedger(tenantId: string, orgId: string, id: string, startDate?: string, endDate?: string) { return this.glService.getAccountLedger(tenantId, orgId, id, startDate, endDate); }

  // cost centers
  async getCostCenters(tenantId: string) { return this.glService.getCostCenters(tenantId); }
  async createCostCenter(tenantId: string, orgId: string, dto: any) { return this.glService.createCostCenter(tenantId, orgId, dto); }
  async updateCostCenter(tenantId: string, id: string, dto: any) { return this.glService.updateCostCenter(tenantId, id, dto); }
  async deleteCostCenter(tenantId: string, id: string) { return this.glService.deleteCostCenter(tenantId, id); }

  // journals
  async getJournals(tenantId: string, status?: string) { return this.glService.getJournals(tenantId, status); }
  async getJournalById(tenantId: string, id: string) { return this.glService.getJournalById(tenantId, id); }
  async createJournal(tenantId: string, orgId: string, dto: any) { return this.glService.createJournal(tenantId, orgId, dto); }
  async submitJournal(tenantId: string, id: string) { return this.glService.submitJournal(tenantId, id); }
  async approveJournal(tenantId: string, id: string, userId: string) { return this.glService.approveJournal(tenantId, id, userId); }
  async postJournal(tenantId: string, id: string) { return this.glService.postJournal(tenantId, id); }
  async rejectJournal(tenantId: string, id: string, reason: string, userId: string) { return this.glService.rejectJournal(tenantId, id, reason, userId); }
  async reverseJournal(tenantId: string, id: string, reversalDate?: string) { return this.glService.reverseJournal(tenantId, id, reversalDate); }

  // budgets
  async getBudgets(tenantId: string) { return this.budgetingService.getBudgets(tenantId); }
  async getBudgetById(tenantId: string, id: string) { return this.budgetingService.getBudgetById(tenantId, id); }
  async createBudget(tenantId: string, orgId: string, dto: any) { return this.budgetingService.createBudget(tenantId, orgId, dto); }
  async updateBudget(tenantId: string, id: string, dto: any) { return this.budgetingService.updateBudget(tenantId, id, dto); }
  async deleteBudget(tenantId: string, id: string) { return this.budgetingService.deleteBudget(tenantId, id); }
  async getBudgetVsActuals(tenantId: string, orgId: string, id: string) { return this.budgetingService.getBudgetVsActuals(tenantId, orgId, id); }

  // banking recon
  async getBankReconciliations(tenantId: string) { return this.bankingService.getBankReconciliations(tenantId); }
  async createBankReconciliation(tenantId: string, dto: any) { return this.bankingService.createBankReconciliation(tenantId, dto); }
  async autoMatchBankReconciliation(tenantId: string, id: string) { return this.bankingService.autoMatchBankReconciliation(tenantId, id); }
  async importBankStatement(tenantId: string, dto: any) { return this.bankingService.importBankStatement(tenantId, dto); }
  async reconcileAccount(tenantId: string, orgId: string, id: string, asOfDate: string) { return this.bankingService.reconcileAccount(tenantId, orgId, id, asOfDate); }
  async getBankAccounts(tenantId: string) { return this.bankingService.getBankAccounts(tenantId); }
  async createBankAccount(tenantId: string, orgId: string, dto: any) { return this.bankingService.createBankAccount(tenantId, orgId, dto); }
  async updateBankAccount(tenantId: string, id: string, dto: any) { return this.bankingService.updateBankAccount(tenantId, id, dto); }

  // periods
  async getFinancialPeriods(tenantId: string) { return this.periodService.getFinancialPeriods(tenantId); }
  async createFinancialPeriod(tenantId: string, orgId: string, dto: any) { return this.periodService.createFinancialPeriod(tenantId, orgId, dto); }
  async closePeriod(tenantId: string, id: string) { return this.periodService.closePeriod(tenantId, id); }
  async reopenPeriod(tenantId: string, id: string, reason: string) { return this.periodService.reopenPeriod(tenantId, id, reason); }
  async getPeriodCloseChecklist(tenantId: string, id: string) { return this.periodService.getPeriodCloseChecklist(tenantId, id); }

  // credit & debit notes, dunning
  async getCreditNotes(tenantId: string) { return this.taxService.getCreditNotes(tenantId); }
  async createCreditNote(tenantId: string, orgId: string, dto: any) { return this.taxService.createCreditNote(tenantId, orgId, dto); }
  async getDebitNotes(tenantId: string) { return this.taxService.getDebitNotes(tenantId); }
  async createDebitNote(tenantId: string, orgId: string, dto: any) { return this.taxService.createDebitNote(tenantId, orgId, dto); }
  async getDunningLevels(tenantId: string) { return this.taxService.getDunningLevels(tenantId); }
  async createDunningLevel(tenantId: string, orgId: string, dto: any) { return this.taxService.createDunningLevel(tenantId, orgId, dto); }
  async getDunningRuns(tenantId: string) { return this.taxService.getDunningRuns(tenantId); }
  async createDunningRun(tenantId: string, orgId: string) { return this.taxService.createDunningRun(tenantId, orgId); }

  // payment schedules & runs
  async getPaymentSchedules(tenantId: string) { return this.treasuryService.getPaymentSchedules(tenantId); }
  async createPaymentSchedule(tenantId: string, orgId: string, dto: any) { return this.treasuryService.createPaymentSchedule(tenantId, orgId, dto); }
  async getPaymentRuns(tenantId: string) { return this.treasuryService.getPaymentRuns(tenantId); }
  async createPaymentRun(tenantId: string, orgId: string, dto: any) { return this.treasuryService.createPaymentRun(tenantId, orgId, dto); }
  async approvePaymentRun(tenantId: string, id: string) { return this.treasuryService.approvePaymentRun(tenantId, id); }

  // forecasts
  async getForecastScenarios(tenantId: string) { return this.treasuryService.getForecastScenarios(tenantId); }
  async createForecastScenario(tenantId: string, orgId: string, dto: any) { return this.treasuryService.createForecastScenario(tenantId, orgId, dto); }

  // reports
  async getProfitAndLoss(tenantId: string, orgId: string, startDate: string, endDate: string) { return this.reportingService.getProfitAndLoss(tenantId, orgId, startDate, endDate); }
  async getBalanceSheet(tenantId: string, orgId: string, asOfDate: string) { return this.reportingService.getBalanceSheet(tenantId, orgId, asOfDate); }
  async getCashFlow(tenantId: string, orgId: string, startDate: string, endDate: string) { return this.reportingService.getCashFlowStatement(tenantId, orgId, startDate, endDate); }
  async getTrialBalance(tenantId: string, orgId: string, asOfDate: string) { return this.reportingService.getTrialBalance(tenantId, orgId, asOfDate); }
  async getAgingReport(tenantId: string, orgId: string, type: 'AR' | 'AP', asOfDate: string) { return this.reportingService.getAgingReport(tenantId, orgId, type, asOfDate); }
  async getCashPosition(tenantId: string, orgId: string) { return this.reportingService.getCashPosition(tenantId, orgId); }
  async getFinancialRatios(tenantId: string, orgId: string) { return this.reportingService.getFinancialRatios(tenantId, orgId); }
  async getCashFlowForecast(tenantId: string, orgId: string, months?: number) { return this.reportingService.getCashFlowForecast(tenantId, orgId, months); }

  // recurring schedules
  async getRecurringSchedules(tenantId: string) { return this.glService.getRecurringSchedules(tenantId); }
  async createRecurringSchedule(tenantId: string, orgId: string, dto: any) { return this.glService.createRecurringSchedule(tenantId, orgId, dto); }
  async generateRecurringInvoices(tenantId: string) { return this.glService.generateRecurringInvoices(tenantId); }

  // expense management
  async getExpenseReports(tenantId: string) { return this.expenseService.getExpenseReports(tenantId); }
  async createExpenseReport(tenantId: string, orgId: string, dto: any) { return this.expenseService.createExpenseReport(tenantId, orgId, dto); }
  async approveExpenseReport(tenantId: string, id: string, userId: string) { return this.expenseService.approveExpenseReport(tenantId, id, userId); }
  async getExpenseReportById(tenantId: string, id: string) { return this.expenseService.getExpenseReportById(tenantId, id); }
  async submitExpenseReport(tenantId: string, id: string) { return this.expenseService.submitExpenseReport(tenantId, id); }
  async rejectExpenseReport(tenantId: string, id: string, reason: string, userId: string) { return this.expenseService.rejectExpenseReport(tenantId, id, reason, userId); }
  async markExpenseReportPaid(tenantId: string, id: string) { return this.expenseService.markExpenseReportPaid(tenantId, id); }

  // revenue recognition
  async getRevenueSchedules(tenantId: string) { return this.revenueService.getRevenueSchedules(tenantId); }
  async createRevenueSchedule(tenantId: string, orgId: string, dto: any) { return this.revenueService.createRevenueSchedule(tenantId, orgId, dto); }
  async getRevenueScheduleById(tenantId: string, id: string) { return this.revenueService.getRevenueScheduleById(tenantId, id); }
  async recognizeRevenue(tenantId: string, id: string, amount: number) { return this.revenueService.recognizeRevenue(tenantId, id, amount); }
  async runAsc606Recognition(tenantId: string, asOfDate: string) { return this.revenueService.runAsc606Recognition(tenantId, asOfDate); }

  // consolidation
  async getConsolidation(tenantId: string) { return this.consolidationService.getConsolidation(tenantId); }
  async getConsolidationRuns(tenantId: string) { return this.consolidationService.getConsolidationRuns(tenantId); }
  async runConsolidation(tenantId: string, periodStart: string, periodEnd: string, eliminateIntercompany?: boolean) { return this.consolidationService.runConsolidation(tenantId, periodStart, periodEnd, eliminateIntercompany); }
  async runMultiCurrencyConsolidation(tenantId: string, periodStart: string, periodEnd: string, reportingCurrency: string, translationMethod?: 'CURRENT_RATE' | 'TEMPORAL') { return this.consolidationService.runMultiCurrencyConsolidation(tenantId, periodStart, periodEnd, reportingCurrency, translationMethod); }

  // audits
  async getFinanceAuditLogs(tenantId: string, entityType?: string, entityId?: string) { return this.glService.getFinanceAuditLogs(tenantId, entityType, entityId); }

  // tax rules
  async getTaxRules(tenantId: string) { return this.taxService.getTaxRules(tenantId); }
  async createTaxRule(tenantId: string, orgId: string, dto: any) { return this.taxService.createTaxRule(tenantId, orgId, dto); }
  async getWithholdingTaxes(tenantId: string) { return this.taxService.getWithholdingTaxes(tenantId); }
  async createWithholdingTax(tenantId: string, orgId: string, dto: any) { return this.taxService.createWithholdingTax(tenantId, orgId, dto); }
  async getTaxFilings(tenantId: string) { return this.taxService.getTaxFilings(tenantId); }
  async createTaxFiling(tenantId: string, orgId: string, dto: any) { return this.taxService.createTaxFiling(tenantId, orgId, dto); }
  async computeTaxReturn(tenantId: string, orgId: string, filingType: string, periodStart: string, periodEnd: string) { return this.taxService.computeTaxReturn(tenantId, orgId, filingType, periodStart, periodEnd); }

  // e-invoicing
  async getEInvoices(tenantId: string, invoiceId?: string) { return this.taxService.getEInvoices(tenantId, invoiceId); }
  async getEInvoiceById(tenantId: string, id: string) { return this.taxService.getEInvoiceById(tenantId, id); }
  async generateEInvoice(tenantId: string, orgId: string, invoiceId: string, format?: string) { return this.taxService.generateEInvoice(tenantId, orgId, invoiceId, format); }

  // intercompany transfers
  async getInterCompanyTransfers(tenantId: string) { return this.treasuryService.getInterCompanyTransfers(tenantId); }
  async createInterCompanyTransfer(tenantId: string, dto: any) { return this.treasuryService.createInterCompanyTransfer(tenantId, dto); }
  async approveInterCompanyTransfer(tenantId: string, id: string) { return this.treasuryService.approveInterCompanyTransfer(tenantId, id); }

  // investment portfolios
  async getInvestmentPortfolios(tenantId: string) { return this.treasuryService.getInvestmentPortfolios(tenantId); }
  async createInvestmentPortfolio(tenantId: string, orgId: string, dto: any) { return this.treasuryService.createInvestmentPortfolio(tenantId, orgId, dto); }
  async getTreasuryTransactions(tenantId: string) { return this.treasuryService.getTreasuryTransactions(tenantId); }
  async createTreasuryTransaction(tenantId: string, orgId: string, dto: any) { return this.treasuryService.createTreasuryTransaction(tenantId, orgId, dto); }

  // multi-book
  async getAccountingBooks(tenantId: string) { return this.glService.getAccountingBooks(tenantId); }
  async createAccountingBook(tenantId: string, orgId: string, dto: any) { return this.glService.createAccountingBook(tenantId, orgId, dto); }
  async postJournalToBook(tenantId: string, orgId: string, bookId: string, dto: any) { return this.glService.postJournalToBook(tenantId, orgId, bookId, dto); }
  async getBookTrialBalance(tenantId: string, bookId: string, asOf?: string) { return this.glService.getBookTrialBalance(tenantId, bookId, asOf); }
  async crossBookVarianceReport(tenantId: string, book1: string, book2: string, asOf?: string) { return this.glService.crossBookVarianceReport(tenantId, book1, book2, asOf); }
}