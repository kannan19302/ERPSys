import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
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

// ── Zod Schemas ─────────────────────────────────────────
const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const createJournalSchema = z.object({
  entryNumber: z.string().min(1),
  notes: z.string().optional(),
  entries: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().min(0),
    credit: z.number().min(0),
    description: z.string().optional(),
    departmentId: z.string().optional(),
    costCenterId: z.string().optional(),
    projectId: z.string().optional(),
  })).min(2),
});

const createCostCenterSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  parentId: z.string().optional(),
});

const createBudgetSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  costCenterId: z.string().optional(),
  projectId: z.string().optional(),
});

const updateBudgetSchema = z.object({
  accountId: z.string().optional(),
  amount: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  costCenterId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
});

const createFinancialPeriodSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const createBankAccountSchema = z.object({
  accountId: z.string().min(1),
  bankName: z.string().min(1).max(200),
  accountNumber: z.string().min(1).max(50),
  currency: z.string().min(3).max(3).default('USD'),
});

const updateBankAccountSchema = z.object({
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  status: z.string().optional(),
});

const createBankReconciliationSchema = z.object({
  accountId: z.string().min(1),
  statementDate: z.string().min(1),
  statementBalance: z.number(),
});

const importBankStatementSchema = z.object({
  accountId: z.string().min(1),
  statementDate: z.string().min(1),
  statementBalance: z.number(),
  transactions: z.array(z.object({
    date: z.string().min(1),
    description: z.string().min(1),
    amount: z.number(),
  })),
});

const createCreditNoteSchema = z.object({
  customerId: z.string().min(1),
  noteNumber: z.string().min(1),
  amount: z.number().positive(),
  invoiceId: z.string().optional(),
  reason: z.string().optional(),
});

const createDebitNoteSchema = z.object({
  vendorId: z.string().min(1),
  noteNumber: z.string().min(1),
  amount: z.number().positive(),
  purchaseOrderId: z.string().optional(),
  reason: z.string().optional(),
});

const createDunningLevelSchema = z.object({
  levelName: z.string().min(1),
  daysOverdue: z.number().int().nonnegative(),
  feeAmount: z.number().nonnegative(),
  emailTemplateId: z.string().optional(),
});

const updateDunningLevelSchema = z.object({
  levelName: z.string().min(1).optional(),
  daysOverdue: z.number().int().nonnegative().optional(),
  feeAmount: z.number().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const applyCashSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE', 'CASH', 'OTHER']),
  reference: z.string().optional(),
});

const updateCustomerCreditSchema = z.object({
  creditLimit: z.number().nonnegative().optional(),
  paymentTerms: z.number().int().positive().optional(),
  creditHold: z.boolean().optional(),
  creditHoldReason: z.string().optional(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

const createPaymentScheduleSchema = z.object({
  vendorId: z.string().min(1),
  purchaseOrderId: z.string().optional(),
  dueDate: z.string().min(1),
  amount: z.number().positive(),
});

const createPaymentRunSchema = z.object({
  bankAccountId: z.string().min(1),
  runDate: z.string().min(1),
  totalAmount: z.number().nonnegative().optional(),
});

const createForecastScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  parameters: z.any().optional(),
});

const updateExchangeRateSchema = z.object({
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3),
  rate: z.number().positive(),
  date: z.string().optional(),
});

const createRecurringScheduleSchema = z.object({
  entryTemplate: z.any(),
  frequency: z.string().min(1),
  nextRunDate: z.string().min(1),
});

const createExpenseReportSchema = z.object({
  employeeId: z.string().min(1),
  reportNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  items: z.array(z.object({
    category: z.string().min(1),
    description: z.string().min(1),
    amount: z.number().positive(),
    expenseDate: z.string().min(1),
    billable: z.boolean().optional(),
  })).min(1),
});

const createRevenueScheduleSchema = z.object({
  description: z.string().min(1),
  totalAmount: z.number().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  recognitionType: z.string().min(1),
  invoiceId: z.string().optional(),
});

const createAccountingBookSchema = z.object({
  name: z.string().min(1),
  standard: z.string().min(1),
  isPrimary: z.boolean().optional(),
});

const postJournalToBookSchema = z.object({
  entryNumber: z.string().min(1),
  date: z.string().min(1),
  entries: z.array(z.object({
    accountId: z.string().min(1),
    debit: z.number().min(0),
    credit: z.number().min(0),
    description: z.string().optional(),
  })).min(2),
  notes: z.string().optional(),
});

const createInterCompanyTransferSchema = z.object({
  fromOrgId: z.string().min(1),
  toOrgId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().optional(),
  date: z.string().optional(),
});

const createInvestmentPortfolioSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  accountId: z.string().min(1),
});

const createTreasuryTransactionSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive(),
  bankAccountId: z.string().min(1),
  date: z.string().optional(),
});

const createTaxRuleSchema = z.any();
const createWithholdingTaxSchema = z.any();
const createTaxFilingSchema = z.any();

@ApiTags('advanced-finance')
@ApiBearerAuth()
@Controller('advanced-finance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AdvancedFinanceController {
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

  @ApiOperation({ summary: 'Get exchange rates' })
  @Get('exchange-rates')
  @Permissions('finance.treasury.read')
  async getExchangeRates(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getExchangeRates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get chart of accounts' })
  @Get('accounts')
  @Permissions('finance.account.read')
  async getAccounts(@Req() req: AuthenticatedRequest) {
    return this.glService.getAccounts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get account by ID' })
  @Get('accounts/:id')
  @Permissions('finance.account.read')
  async getAccountById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.getAccountById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create ledger account' })
  @Post('accounts')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Account')
  async createAccount(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAccountSchema) dto: z.infer<typeof createAccountSchema>,
  ) {
    return this.glService.createAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update ledger account' })
  @Patch('accounts/:id')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Account', 'id')
  async updateAccount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateAccountSchema) dto: z.infer<typeof updateAccountSchema>,
  ) {
    return this.glService.updateAccount(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete ledger account' })
  @Delete('accounts/:id')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Account', 'id')
  async deleteAccount(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.deleteAccount(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get GL ledger for a specific account' })
  @Get('accounts/:id/ledger')
  @Permissions('finance.account.read')
  async getAccountLedger(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.glService.getAccountLedger(req.user.tenantId, req.user.orgId || 'org-system-default', id, startDate, endDate);
  }

  @ApiOperation({ summary: 'Get cost centers' })
  @Get('cost-centers')
  @Permissions('finance.account.read')
  async getCostCenters(@Req() req: AuthenticatedRequest) {
    return this.glService.getCostCenters(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create cost center' })
  @Post('cost-centers')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CostCenter')
  async createCostCenter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCostCenterSchema) dto: z.infer<typeof createCostCenterSchema>,
  ) {
    return this.glService.createCostCenter(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update cost center' })
  @Patch('cost-centers/:id')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CostCenter', 'id')
  async updateCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ name: z.string().optional(), parentId: z.string().nullable().optional() }))
    dto: { name?: string; parentId?: string | null },
  ) {
    return this.glService.updateCostCenter(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete cost center' })
  @Delete('cost-centers/:id')
  @Permissions('finance.account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CostCenter', 'id')
  async deleteCostCenter(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.deleteCostCenter(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get journal entries' })
  @Get('journals')
  @Permissions('finance.journal.read')
  async getJournals(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.glService.getJournals(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Get journal entry by ID' })
  @Get('journals/:id')
  @Permissions('finance.journal.read')
  async getJournalById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.getJournalById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create journal entry' })
  @Post('journals')
  @Permissions('finance.journal.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal')
  async createJournal(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createJournalSchema) dto: z.infer<typeof createJournalSchema>,
  ) {
    return this.glService.createJournal(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Submit journal for approval' })
  @Post('journals/:id/submit')
  @Permissions('finance.journal.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal', 'id')
  async submitJournal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.submitJournal(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Approve journal entry' })
  @Post('journals/:id/approve')
  @Permissions('finance.journal.approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal', 'id')
  async approveJournal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.approveJournal(req.user.tenantId, id, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Post journal to general ledger' })
  @Post('journals/:id/post')
  @Permissions('finance.journal.approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal', 'id')
  async postJournal(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.postJournal(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Reject journal entry' })
  @Post('journals/:id/reject')
  @Permissions('finance.journal.approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal', 'id')
  async rejectJournal(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ reason: z.string().min(1) })) dto: { reason: string },
  ) {
    return this.glService.rejectJournal(req.user.tenantId, id, dto.reason, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Reverse a posted journal entry' })
  @Post('journals/:id/reverse')
  @Permissions('finance.journal.reverse')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal', 'id')
  async reverseJournal(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ reversalDate: z.string().optional() })) dto: { reversalDate?: string },
  ) {
    return this.glService.reverseJournal(req.user.tenantId, id, dto.reversalDate);
  }

  @ApiOperation({ summary: 'Get budgets' })
  @Get('budgets')
  @Permissions('finance.budget.read')
  async getBudgets(@Req() req: AuthenticatedRequest) {
    return this.budgetingService.getBudgets(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get budget by ID' })
  @Get('budgets/:id')
  @Permissions('finance.budget.read')
  async getBudgetById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.budgetingService.getBudgetById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create budget' })
  @Post('budgets')
  @Permissions('finance.budget.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Budget')
  async createBudget(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBudgetSchema) dto: z.infer<typeof createBudgetSchema>,
  ) {
    return this.budgetingService.createBudget(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Update budget' })
  @Patch('budgets/:id')
  @Permissions('finance.budget.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Budget', 'id')
  async updateBudget(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateBudgetSchema) dto: z.infer<typeof updateBudgetSchema>,
  ) {
    return this.budgetingService.updateBudget(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete budget' })
  @Delete('budgets/:id')
  @Permissions('finance.budget.delete')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Budget', 'id')
  async deleteBudget(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.budgetingService.deleteBudget(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Budget vs actuals comparison' })
  @Get('budgets/:id/vs-actuals')
  @Permissions('finance.budget.read')
  async getBudgetVsActualsById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.budgetingService.getBudgetVsActuals(req.user.tenantId, req.user.orgId || 'org-system-default', id);
  }

  @ApiOperation({ summary: 'Get bank reconciliations' })
  @Get('bank-reconciliations')
  @Permissions('finance.bank-recon.read')
  async getBankReconciliations(@Req() req: AuthenticatedRequest) {
    return this.bankingService.getBankReconciliations(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create bank reconciliation' })
  @Post('bank-reconciliations')
  @Permissions('finance.bank-recon.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankReconciliation')
  async createBankReconciliation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBankReconciliationSchema) dto: z.infer<typeof createBankReconciliationSchema>,
  ) {
    return this.bankingService.createBankReconciliation(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Get financial periods' })
  @Get('financial-periods')
  @Permissions('finance.period.read')
  async getFinancialPeriods(@Req() req: AuthenticatedRequest) {
    return this.periodService.getFinancialPeriods(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create financial period' })
  @Post('financial-periods')
  @Permissions('finance.period.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('FinancialPeriod')
  async createFinancialPeriod(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFinancialPeriodSchema) dto: z.infer<typeof createFinancialPeriodSchema>,
  ) {
    return this.periodService.createFinancialPeriod(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Close financial period' })
  @Post('financial-periods/:id/close')
  @Permissions('finance.period.close')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('FinancialPeriod', 'id')
  async closePeriod(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.periodService.closePeriod(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Reopen financial period' })
  @Post('financial-periods/:id/reopen')
  @Permissions('finance.period.close')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('FinancialPeriod', 'id')
  async reopenPeriod(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ reason: z.string().min(1) })) dto: { reason: string },
  ) {
    return this.periodService.reopenPeriod(req.user.tenantId, id, dto.reason);
  }

  @ApiOperation({ summary: 'Get period close checklist' })
  @Get('financial-periods/:id/close-checklist')
  @Permissions('finance.period.read')
  async getPeriodCloseChecklist(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.periodService.getPeriodCloseChecklist(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get bank accounts' })
  @Get('bank-accounts')
  @Permissions('finance.bank-account.read')
  async getBankAccounts(@Req() req: AuthenticatedRequest) {
    return this.bankingService.getBankAccounts(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create bank account' })
  @Post('bank-accounts')
  @Permissions('finance.bank-account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankAccount')
  async createBankAccount(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBankAccountSchema) dto: z.infer<typeof createBankAccountSchema>,
  ) {
    return this.bankingService.createBankAccount(req.user.tenantId, req.user.orgId || 'org-system-default', dto);
  }

  @ApiOperation({ summary: 'Get credit notes' })
  @Get('credit-notes')
  @Permissions('finance.tax.read')
  async getCreditNotes(@Req() req: AuthenticatedRequest) {
    return this.taxService.getCreditNotes(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create credit note' })
  @Post('credit-notes')
  @Permissions('finance.tax.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CreditNote')
  async createCreditNote(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCreditNoteSchema) body: z.infer<typeof createCreditNoteSchema>,
  ) {
    return this.taxService.createCreditNote(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get debit notes' })
  @Get('debit-notes')
  @Permissions('finance.tax.read')
  async getDebitNotes(@Req() req: AuthenticatedRequest) {
    return this.taxService.getDebitNotes(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create debit note' })
  @Post('debit-notes')
  @Permissions('finance.tax.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DebitNote')
  async createDebitNote(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDebitNoteSchema) body: z.infer<typeof createDebitNoteSchema>,
  ) {
    return this.taxService.createDebitNote(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get dunning levels' })
  @Get('dunning-levels')
  @Permissions('finance.tax.read')
  async getDunningLevels(@Req() req: AuthenticatedRequest) {
    return this.taxService.getDunningLevels(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create dunning level' })
  @Post('dunning-levels')
  @Permissions('finance.tax.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DunningLevel')
  async createDunningLevel(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDunningLevelSchema) body: z.infer<typeof createDunningLevelSchema>,
  ) {
    return this.taxService.createDunningLevel(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get dunning runs' })
  @Get('dunning-runs')
  @Permissions('finance.tax.read')
  async getDunningRuns(@Req() req: AuthenticatedRequest) {
    return this.taxService.getDunningRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create dunning run' })
  @Post('dunning-runs')
  @Permissions('finance.tax.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DunningRun')
  async createDunningRun(@Req() req: AuthenticatedRequest) {
    return this.taxService.createDunningRun(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get payment schedules' })
  @Get('payment-schedules')
  @Permissions('finance.treasury.read')
  async getPaymentSchedules(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getPaymentSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create payment schedule' })
  @Post('payment-schedules')
  @Permissions('finance.treasury.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentSchedule')
  async createPaymentSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPaymentScheduleSchema) body: z.infer<typeof createPaymentScheduleSchema>,
  ) {
    return this.treasuryService.createPaymentSchedule(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get payment runs' })
  @Get('payment-runs')
  @Permissions('finance.treasury.read')
  async getPaymentRuns(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getPaymentRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create payment run' })
  @Post('payment-runs')
  @Permissions('finance.treasury.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentRun')
  async createPaymentRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPaymentRunSchema) body: z.infer<typeof createPaymentRunSchema>,
  ) {
    return this.treasuryService.createPaymentRun(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Approve payment run' })
  @Post('payment-runs/:id/approve')
  @Permissions('finance.treasury.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentRun', 'id')
  async approvePaymentRun(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.treasuryService.approvePaymentRun(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get forecast scenarios' })
  @Get('forecast-scenarios')
  @Permissions('finance.treasury.read')
  async getForecastScenarios(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getForecastScenarios(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create forecast scenario' })
  @Post('forecast-scenarios')
  @Permissions('finance.treasury.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ForecastScenario')
  async createForecastScenario(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createForecastScenarioSchema) body: z.infer<typeof createForecastScenarioSchema>,
  ) {
    return this.treasuryService.createForecastScenario(req.user.tenantId, req.user.orgId || '', body);
  }

  // ── REPORTS ──

  @ApiOperation({ summary: 'Get profit and loss' })
  @Get('reports/pnl')
  @Permissions('finance.report.read')
  async getProfitAndLoss(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getProfitAndLoss(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }

  @ApiOperation({ summary: 'Get balance sheet' })
  @Get('reports/balance-sheet')
  @Permissions('finance.report.read')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.reportingService.getBalanceSheet(req.user.tenantId, req.user.orgId || '', asOfDate);
  }

  @ApiOperation({ summary: 'Get cash flow' })
  @Get('reports/cash-flow')
  @Permissions('finance.report.read')
  async getCashFlow(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportingService.getCashFlowStatement(req.user.tenantId, req.user.orgId || '', startDate, endDate);
  }

  @ApiOperation({ summary: 'Get trial balance' })
  @Get('reports/trial-balance')
  @Permissions('finance.report.read')
  async getTrialBalance(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string) {
    return this.reportingService.getTrialBalance(req.user.tenantId, req.user.orgId || '', asOfDate || new Date().toISOString());
  }

  @ApiOperation({ summary: 'Get aging report' })
  @Get('reports/aging')
  @Permissions('finance.report.read')
  async getAgingReport(
    @Req() req: AuthenticatedRequest,
    @Query('type') type: 'AR' | 'AP',
    @Query('asOfDate') asOfDate: string,
  ) {
    return this.reportingService.getAgingReport(req.user.tenantId, req.user.orgId || '', type || 'AR', asOfDate || new Date().toISOString());
  }

  @ApiOperation({ summary: 'Get budget vs actuals' })
  @Permissions('finance.budget.read')
  @Get('budget-vs-actuals')
  async getBudgetVsActuals(@Req() req: AuthenticatedRequest, @Query('fiscalYear') fiscalYear: string) {
    return this.budgetingService.getBudgetVsActuals(req.user.tenantId, req.user.orgId || '', fiscalYear || '2026');
  }

  @ApiOperation({ summary: 'Update exchange rate' })
  @Permissions('finance.treasury.create')
  @Post('exchange-rates')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExchangeRate')
  async updateExchangeRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(updateExchangeRateSchema) dto: z.infer<typeof updateExchangeRateSchema>,
  ) {
    return this.treasuryService.updateExchangeRate(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Convert currency' })
  @Permissions('finance.treasury.read')
  @Get('currency-convert')
  async convertCurrency(
    @Req() req: AuthenticatedRequest,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
    @Query('date') date?: string,
  ) {
    return this.treasuryService.convertCurrency(req.user.tenantId, from || 'USD', to || 'EUR', parseFloat(amount || '1'), date);
  }

  @ApiOperation({ summary: 'Compute tax' })
  @Permissions('finance.tax.compute')
  @Get('compute-tax')
  async computeTax(
    @Req() req: AuthenticatedRequest,
    @Query('amount') amount: string,
    @Query('taxRuleId') taxRuleId?: string,
  ) {
    return this.taxService.computeTax(req.user.tenantId, req.user.orgId || '', parseFloat(amount || '0'), taxRuleId);
  }

  @ApiOperation({ summary: 'List recurring invoice schedules' })
  @Permissions('finance.journal.read')
  @Get('recurring-schedules')
  async getRecurringSchedules(@Req() req: AuthenticatedRequest) {
    return this.glService.getRecurringSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create recurring invoice schedule' })
  @Permissions('finance.journal.create')
  @Post('recurring-schedules')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('RecurringJournal')
  async createRecurringSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRecurringScheduleSchema) dto: z.infer<typeof createRecurringScheduleSchema>,
  ) {
    return this.glService.createRecurringSchedule(req.user.tenantId, req.user.orgId || 'org-system-default', dto as any);
  }

  @ApiOperation({ summary: 'Generate recurring invoices' })
  @Permissions('finance.journal.create')
  @Post('recurring/generate')
  async generateRecurringInvoices(@Req() req: AuthenticatedRequest) {
    return this.glService.generateRecurringInvoices(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Auto match reconciliation' })
  @Permissions('finance.bank-recon.match')
  @Post('bank-reconciliations/:id/auto-match')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankReconciliation', 'id')
  async autoMatchReconciliation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bankingService.autoMatchBankReconciliation(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Import bank statement' })
  @Permissions('finance.bank-recon.create')
  @Post('bank-reconciliations/import')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankReconciliation')
  async importBankStatement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(importBankStatementSchema) dto: z.infer<typeof importBankStatementSchema>,
  ) {
    return this.bankingService.importBankStatement(req.user.tenantId, dto);
  }

  // ── Expense Management ──
  @ApiOperation({ summary: 'Get expense reports' })
  @Permissions('finance.expense.read')
  @Get('expense-reports')
  async getExpenseReports(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getExpenseReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get expense report by ID' })
  @Permissions('finance.expense.read')
  @Get('expense-reports/:id')
  async getExpenseReportById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.getExpenseReportById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create expense report' })
  @Permissions('finance.expense.create')
  @Post('expense-reports')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport')
  async createExpenseReport(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createExpenseReportSchema) dto: z.infer<typeof createExpenseReportSchema>,
  ) {
    return this.expenseService.createExpenseReport(req.user.tenantId, req.user.orgId || '', dto);
  }

  @ApiOperation({ summary: 'Submit expense report for approval' })
  @Permissions('finance.expense.create')
  @Post('expense-reports/:id/submit')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport', 'id')
  async submitExpenseReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.submitExpenseReport(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Approve expense report' })
  @Permissions('finance.expense.approve')
  @Post('expense-reports/:id/approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport', 'id')
  async approveExpenseReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.approveExpenseReport(req.user.tenantId, id, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Reject expense report' })
  @Permissions('finance.expense.reject')
  @Post('expense-reports/:id/reject')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport', 'id')
  async rejectExpenseReport(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ reason: z.string().min(1) })) dto: { reason: string },
  ) {
    return this.expenseService.rejectExpenseReport(req.user.tenantId, id, dto.reason, req.user.userId || 'system');
  }

  @ApiOperation({ summary: 'Mark expense report as paid' })
  @Permissions('finance.expense.approve')
  @Post('expense-reports/:id/pay')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport', 'id')
  async markExpenseReportPaid(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.markExpenseReportPaid(req.user.tenantId, id);
  }

  // ── Revenue Recognition ──
  @ApiOperation({ summary: 'Get revenue schedules' })
  @Permissions('finance.revenue.read')
  @Get('revenue-schedules')
  async getRevenueSchedules(@Req() req: AuthenticatedRequest) {
    return this.revenueService.getRevenueSchedules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get revenue schedule by ID' })
  @Permissions('finance.revenue.read')
  @Get('revenue-schedules/:id')
  async getRevenueScheduleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.revenueService.getRevenueScheduleById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create revenue schedule' })
  @Permissions('finance.revenue.create')
  @Post('revenue-schedules')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('RevenueSchedule')
  async createRevenueSchedule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createRevenueScheduleSchema) dto: z.infer<typeof createRevenueScheduleSchema>,
  ) {
    return this.revenueService.createRevenueSchedule(req.user.tenantId, req.user.orgId || '', dto);
  }

  @ApiOperation({ summary: 'Recognize revenue (manual)' })
  @Permissions('finance.revenue.recognize')
  @Post('revenue-schedules/:id/recognize')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('RevenueSchedule', 'id')
  async recognizeRevenue(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ amount: z.number().min(0) })) dto: { amount: number },
  ) {
    return this.revenueService.recognizeRevenue(req.user.tenantId, id, dto.amount);
  }

  @ApiOperation({ summary: 'Run ASC 606 automated revenue recognition' })
  @Permissions('finance.revenue.recognize')
  @Post('revenue-recognition/asc606')
  async runAsc606Recognition(@Req() req: AuthenticatedRequest, @ZodBody(z.object({ asOfDate: z.string().min(1) })) dto: { asOfDate: string }) {
    return this.revenueService.runAsc606Recognition(req.user.tenantId, dto.asOfDate);
  }

  // ── Cash Position & Forecasts ──
  @ApiOperation({ summary: 'Get cash position' })
  @Permissions('finance.report.read')
  @Get('cash-position')
  async getCashPosition(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getCashPosition(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get financial ratios' })
  @Permissions('finance.report.read')
  @Get('financial-ratios')
  async getFinancialRatios(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getFinancialRatios(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get cash flow forecast' })
  @Permissions('finance.report.read')
  @Get('cash-flow-forecast')
  async getCashFlowForecast(@Req() req: AuthenticatedRequest, @Query('months') months: string) {
    return this.reportingService.getCashFlowForecast(req.user.tenantId, req.user.orgId || '', parseInt(months || '3'));
  }

  @ApiOperation({ summary: 'Get finance audit logs' })
  @Permissions('finance.audit.read')
  @Get('audit-logs')
  async getFinanceAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.glService.getFinanceAuditLogs(req.user.tenantId, entityType, entityId);
  }

  @ApiOperation({ summary: 'Compute tax return' })
  @Permissions('finance.tax.compute')
  @Get('tax-returns/compute')
  async computeTaxReturn(
    @Req() req: AuthenticatedRequest,
    @Query('filingType') filingType: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.taxService.computeTaxReturn(req.user.tenantId, req.user.orgId || '', filingType || 'GSTR-1', periodStart, periodEnd);
  }

  @ApiOperation({ summary: 'Reconcile account' })
  @Permissions('finance.bank-recon.read')
  @Get('accounts/:id/reconcile')
  async reconcileAccount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('asOfDate') asOfDate: string,
  ) {
    return this.bankingService.reconcileAccount(req.user.tenantId, req.user.orgId || '', id, asOfDate || new Date().toISOString());
  }

  // ── Consolidation ──
  @ApiOperation({ summary: 'Get live consolidation overview' })
  @Permissions('finance.consolidation.read')
  @Get('consolidation/overview')
  async getConsolidation(@Req() req: AuthenticatedRequest) {
    return this.consolidationService.getConsolidation(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get consolidation run history' })
  @Permissions('finance.consolidation.read')
  @Get('consolidation/runs')
  async getConsolidationRuns(@Req() req: AuthenticatedRequest) {
    return this.consolidationService.getConsolidationRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Run consolidation' })
  @Permissions('finance.consolidation.run')
  @Post('consolidation/run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ConsolidationRun')
  async runConsolidation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ periodStart: z.string().min(1), periodEnd: z.string().min(1), eliminateIntercompany: z.boolean().optional() }))
    dto: { periodStart: string; periodEnd: string; eliminateIntercompany?: boolean },
  ) {
    return this.consolidationService.runConsolidation(req.user.tenantId, dto.periodStart, dto.periodEnd, dto.eliminateIntercompany !== false);
  }

  @ApiOperation({ summary: 'Run multi-currency consolidation with translation' })
  @Permissions('finance.consolidation.run')
  @Post('consolidation/multi-currency')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ConsolidationRun')
  async runMultiCurrencyConsolidation(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      periodStart: z.string().min(1),
      periodEnd: z.string().min(1),
      reportingCurrency: z.string().min(3).max(3),
      translationMethod: z.enum(['CURRENT_RATE', 'TEMPORAL']).optional(),
    }))
    dto: { periodStart: string; periodEnd: string; reportingCurrency: string; translationMethod?: 'CURRENT_RATE' | 'TEMPORAL' },
  ) {
    return this.consolidationService.runMultiCurrencyConsolidation(req.user.tenantId, dto.periodStart, dto.periodEnd, dto.reportingCurrency, dto.translationMethod);
  }

  @ApiOperation({ summary: 'Smart match bank transactions' })
  @Permissions('finance.bank-recon.match')
  @Post('bank-reconciliations/:id/smart-match')
  async smartMatchBankTransactions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ fuzzyThreshold: z.number().optional(), dateWindowDays: z.number().optional() }))
    options: { fuzzyThreshold?: number; dateWindowDays?: number },
  ) {
    return this.bankingService.smartMatchBankTransactions(req.user.tenantId, id, options);
  }

  @ApiOperation({ summary: 'Update bank account' })
  @Permissions('finance.bank-account.update')
  @Patch('bank-accounts/:id')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankAccount', 'id')
  async updateBankAccount(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateBankAccountSchema) dto: z.infer<typeof updateBankAccountSchema>,
  ) {
    return this.bankingService.updateBankAccount(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Create intercompany transfer' })
  @Permissions('finance.treasury.create')
  @Post('inter-company-transfers')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('InterCompanyTransfer')
  async createInterCompanyTransfer(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createInterCompanyTransferSchema)
    dto: z.infer<typeof createInterCompanyTransferSchema>,
  ) {
    return this.treasuryService.createInterCompanyTransfer(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Approve intercompany transfer' })
  @Permissions('finance.treasury.create')
  @Post('inter-company-transfers/:id/approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('InterCompanyTransfer', 'id')
  async approveInterCompanyTransfer(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.treasuryService.approveInterCompanyTransfer(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create tax rule' })
  @Permissions('finance.tax.create')
  @Post('tax-rules')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('TaxRule')
  async createTaxRule(@Req() req: AuthenticatedRequest, @ZodBody(createTaxRuleSchema) body: any) {
    return this.taxService.createTaxRule(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get tax rules' })
  @Get('tax-rules')
  @Permissions('finance.tax.read')
  async getTaxRules(@Req() req: AuthenticatedRequest) {
    return this.taxService.getTaxRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create withholding tax' })
  @Permissions('finance.tax.create')
  @Post('withholding-taxes')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('WithholdingTax')
  async createWithholdingTax(@Req() req: AuthenticatedRequest, @ZodBody(createWithholdingTaxSchema) body: any) {
    return this.taxService.createWithholdingTax(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get withholding taxes' })
  @Get('withholding-taxes')
  @Permissions('finance.tax.read')
  async getWithholdingTaxes(@Req() req: AuthenticatedRequest) {
    return this.taxService.getWithholdingTaxes(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create tax filing' })
  @Permissions('finance.tax.create')
  @Post('tax-filings')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('TaxFiling')
  async createTaxFiling(@Req() req: AuthenticatedRequest, @ZodBody(createTaxFilingSchema) body: any) {
    return this.taxService.createTaxFiling(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get tax filings' })
  @Get('tax-filings')
  @Permissions('finance.tax.read')
  async getTaxFilings(@Req() req: AuthenticatedRequest) {
    return this.taxService.getTaxFilings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create investment portfolio' })
  @Permissions('finance.treasury.create')
  @Post('investment-portfolios')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('InvestmentPortfolio')
  async createInvestmentPortfolio(@Req() req: AuthenticatedRequest, @ZodBody(createInvestmentPortfolioSchema) body: any) {
    return this.treasuryService.createInvestmentPortfolio(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get investment portfolios' })
  @Get('investment-portfolios')
  @Permissions('finance.treasury.read')
  async getInvestmentPortfolios(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getInvestmentPortfolios(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create treasury transaction' })
  @Permissions('finance.treasury.create')
  @Post('treasury-transactions')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('TreasuryTransaction')
  async createTreasuryTransaction(@Req() req: AuthenticatedRequest, @ZodBody(createTreasuryTransactionSchema) body: any) {
    return this.treasuryService.createTreasuryTransaction(req.user.tenantId, req.user.orgId || '', body);
  }

  @ApiOperation({ summary: 'Get treasury transactions' })
  @Get('treasury-transactions')
  @Permissions('finance.treasury.read')
  async getTreasuryTransactions(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getTreasuryTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get intercompany transfers list' })
  @Get('inter-company-transfers')
  @Permissions('finance.treasury.read')
  async getInterCompanyTransfers(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getInterCompanyTransfers(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get currency revaluations' })
  @Get('currency-revaluations')
  @Permissions('finance.treasury.read')
  async getCurrencyRevaluations(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.getCurrencyRevaluations(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Run currency revaluation' })
  @Post('currency-revaluations/run')
  @Permissions('finance.treasury.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CurrencyRevaluation')
  async runCurrencyRevaluation(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { asOfDate?: string; baseCurrency?: string }) {
    return this.treasuryService.runCurrencyRevaluation(req.user.tenantId, req.user.orgId || 'org-system-default', body.asOfDate || new Date().toISOString(), body.baseCurrency || 'USD');
  }

  @ApiOperation({ summary: 'Get e-invoices list' })
  @Get('e-invoices')
  @Permissions('finance.einvoice.read')
  async getEInvoices(@Req() req: AuthenticatedRequest, @Query('invoiceId') invoiceId?: string) {
    return this.taxService.getEInvoices(req.user.tenantId, invoiceId);
  }

  @ApiOperation({ summary: 'Get e-invoice by ID' })
  @Get('e-invoices/:id')
  @Permissions('finance.einvoice.read')
  async getEInvoiceById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.taxService.getEInvoiceById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Generate e-invoice' })
  @Post('e-invoices/generate')
  @Permissions('finance.einvoice.generate')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EInvoice')
  async generateEInvoice(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) body: { invoiceId: string; format?: string }) {
    return this.taxService.generateEInvoice(req.user.tenantId, req.user.orgId || 'org-system-default', body.invoiceId, body.format || 'UBL');
  }

  // ── MULTI-BOOK ACCOUNTING ──────────────────────────────────────

  @ApiOperation({ summary: 'List accounting books (parallel GAAP ledgers)' })
  @Permissions('finance.accounting-book.read')
  @Get('accounting-books')
  async getAccountingBooks(@Req() req: AuthenticatedRequest) {
    return this.glService.getAccountingBooks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create an accounting book' })
  @Permissions('finance.accounting-book.create')
  @Post('accounting-books')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AccountingBook')
  async createAccountingBook(@Req() req: AuthenticatedRequest, @ZodBody(createAccountingBookSchema) body: z.infer<typeof createAccountingBookSchema>) {
    return this.glService.createAccountingBook(req.user.tenantId, req.user.orgId || 'org-system-default', body);
  }

  @ApiOperation({ summary: 'Post a journal entry to a specific accounting book' })
  @Permissions('finance.accounting-book.create')
  @Post('accounting-books/:bookId/journals')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Journal')
  async postJournalToBook(
    @Req() req: AuthenticatedRequest,
    @Param('bookId') bookId: string,
    @ZodBody(postJournalToBookSchema) body: z.infer<typeof postJournalToBookSchema>,
  ) {
    return this.glService.postJournalToBook(req.user.tenantId, req.user.orgId || 'org-system-default', bookId, body);
  }

  @ApiOperation({ summary: 'Trial balance for an accounting book' })
  @Permissions('finance.accounting-book.read')
  @Get('accounting-books/:bookId/trial-balance')
  async getBookTrialBalance(@Req() req: AuthenticatedRequest, @Param('bookId') bookId: string, @Query('asOf') asOf?: string) {
    return this.glService.getBookTrialBalance(req.user.tenantId, bookId, asOf);
  }

  @ApiOperation({ summary: 'Cross-book variance report (e.g. LOCAL_GAAP vs IFRS)' })
  @Permissions('finance.accounting-book.read')
  @Get('accounting-books/variance')
  async crossBookVarianceReport(@Req() req: AuthenticatedRequest, @Query('book1') book1: string, @Query('book2') book2: string, @Query('asOf') asOf?: string) {
    return this.glService.crossBookVarianceReport(req.user.tenantId, book1, book2, asOf);
  }

  // ── DUNNING MANAGEMENT (extended) ──────────────────────────────────

  @ApiOperation({ summary: 'Get a single dunning level by ID' })
  @Get('dunning-levels/:id')
  @Permissions('finance.tax.read')
  async getDunningLevelById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.taxService.getDunningLevelById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Update a dunning level' })
  @Patch('dunning-levels/:id')
  @Permissions('finance.tax.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('DunningLevel')
  async updateDunningLevel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateDunningLevelSchema) body: z.infer<typeof updateDunningLevelSchema>,
  ) {
    return this.taxService.updateDunningLevel(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete a dunning level' })
  @Delete('dunning-levels/:id')
  @Permissions('finance.tax.delete')
  async deleteDunningLevel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.taxService.deleteDunningLevel(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get dunning logs for a specific level (paginated)' })
  @Get('dunning-levels/:id/logs')
  @Permissions('finance.tax.read')
  async getDunningLevelLogs(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.taxService.getDunningLevelLogs(req.user.tenantId, id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @ApiOperation({ summary: 'Get dunning campaign stats (success rate, fees, emails)' })
  @Get('dunning-stats')
  @Permissions('finance.tax.read')
  async getDunningStats(@Req() req: AuthenticatedRequest) {
    return this.taxService.getDunningStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Pause dunning for a specific invoice (dispute hold)' })
  @Post('dunning/invoices/:invoiceId/pause')
  @Permissions('finance.tax.update')
  async pauseDunningForInvoice(@Req() req: AuthenticatedRequest, @Param('invoiceId') invoiceId: string) {
    return this.taxService.pauseDunningForInvoice(req.user.tenantId, invoiceId);
  }

  @ApiOperation({ summary: 'Resume dunning for a specific invoice' })
  @Post('dunning/invoices/:invoiceId/resume')
  @Permissions('finance.tax.update')
  async resumeDunningForInvoice(@Req() req: AuthenticatedRequest, @Param('invoiceId') invoiceId: string) {
    return this.taxService.resumeDunningForInvoice(req.user.tenantId, invoiceId);
  }

  // ── AR AGING & CUSTOMER STATEMENTS ──────────────────────────────────

  @ApiOperation({ summary: 'AR Aging report — buckets: Current, 1-30, 31-60, 61-90, 90+ days' })
  @Get('ar-aging')
  @Permissions('finance.reports.read')
  async getArAgingReport(@Req() req: AuthenticatedRequest, @Query('orgId') orgId?: string) {
    return this.taxService.getArAgingReport(req.user.tenantId, orgId);
  }

  @ApiOperation({ summary: 'Customer statement — invoice/payment ledger for a specific customer' })
  @Get('customer-statement/:customerId')
  @Permissions('finance.reports.read')
  async getCustomerStatement(
    @Req() req: AuthenticatedRequest,
    @Param('customerId') customerId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.taxService.getCustomerStatement(req.user.tenantId, customerId, periodStart, periodEnd);
  }

  @ApiOperation({ summary: 'Overdue invoice summary KPIs and top debtors' })
  @Get('ar-overdue-summary')
  @Permissions('finance.reports.read')
  async getOverdueInvoiceSummary(@Req() req: AuthenticatedRequest) {
    return this.taxService.getOverdueInvoiceSummary(req.user.tenantId);
  }

  // ── CASH APPLICATION ──────────────────────────────────

  @ApiOperation({ summary: 'Apply a cash payment to a specific invoice (cash application)' })
  @Post('cash-application')
  @Permissions('finance.payment.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Payment')
  async applyCashToInvoice(
    @Req() req: AuthenticatedRequest,
    @ZodBody(applyCashSchema) body: z.infer<typeof applyCashSchema>,
  ) {
    return this.taxService.applyCashToInvoice(req.user.tenantId, req.user.orgId || '', body);
  }

  // ── CUSTOMER CREDIT MANAGEMENT ──────────────────────────────────

  @ApiOperation({ summary: 'Get credit summary for a customer (limit, usage, hold, risk rating)' })
  @Get('customers/:customerId/credit')
  @Permissions('finance.credit.read')
  async getCustomerCreditSummary(@Req() req: AuthenticatedRequest, @Param('customerId') customerId: string) {
    return this.taxService.getCustomerCreditSummary(req.user.tenantId, customerId);
  }

  @ApiOperation({ summary: 'Update customer credit terms (limit, payment terms, hold status, risk rating)' })
  @Patch('customers/:customerId/credit')
  @Permissions('finance.credit.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Customer')
  async updateCustomerCredit(
    @Req() req: AuthenticatedRequest,
    @Param('customerId') customerId: string,
    @ZodBody(updateCustomerCreditSchema) body: z.infer<typeof updateCustomerCreditSchema>,
  ) {
    return this.taxService.updateCustomerCredit(req.user.tenantId, customerId, body);
  }

  @ApiOperation({ summary: 'Credit risk list — all active customers with outstanding balances and utilization' })
  @Get('credit-risk')
  @Permissions('finance.credit.read')
  async getCustomersCreditRisk(@Req() req: AuthenticatedRequest) {
    return this.taxService.getCustomersCreditRisk(req.user.tenantId);
  }
}