import { Controller, Get, Post, Patch, Delete, UseGuards, Req, Param, Query, UseInterceptors, BadRequestException } from '@nestjs/common';
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
  PaymentTermsService,
  BankFeedsService,
  CashFlowForecastService,
  InterCompanyService,
  FxRevaluationService,
  PayablesService,
  FpaService,
  InvoiceCaptureService,
  CardSpendLimitService,
  AllocationService,
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

const addExpenseItemSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  merchant: z.string().optional(),
  amount: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string().min(1),
  billable: z.boolean().optional(),
  isMileage: z.boolean().optional(),
  mileageDistance: z.number().min(0).optional(),
  isPerDiem: z.boolean().optional(),
  perDiemDays: z.number().min(0).optional(),
  perDiemLocation: z.string().optional(),
});

const updateExpenseItemSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  merchant: z.string().optional(),
  amount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string().min(1).optional(),
  billable: z.boolean().optional(),
});

const scanReceiptSchema = z.object({
  fileName: z.string().min(1),
  rawText: z.string().optional(),
});

const upsertExpensePolicySchema = z.object({
  category: z.string().min(1),
  maxAmountPerItem: z.number().min(0).nullable().optional(),
  receiptRequiredAbove: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

const createMileageRateSchema = z.object({
  ratePerMile: z.number().positive(),
  effectiveDate: z.string().min(1),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

const upsertPerDiemRateSchema = z.object({
  location: z.string().min(1),
  dailyRate: z.number().positive(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createCorporateCardSchema = z.object({
  employeeId: z.string().min(1),
  provider: z.string().min(1),
  last4: z.string().min(4).max(4),
  nickname: z.string().optional(),
});

const importCardTransactionsSchema = z.object({
  transactions: z.array(z.object({
    transactionDate: z.string().min(1),
    merchant: z.string().min(1),
    amount: z.number().positive(),
  })).min(1),
});

const matchCardTransactionSchema = z.object({
  itemId: z.string().min(1),
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

const createAccountingBookRuleSchema = z.object({
  sourceBookId: z.string().min(1),
  destinationBookId: z.string().min(1),
  sourceAccountId: z.string().optional().nullable(),
  destinationAccountId: z.string().optional().nullable(),
  ruleType: z.string().min(1), // POST_DIRECTLY, MAP_ACCOUNT, EXCLUDE_ACCOUNT, REVAL_MULTIPLIER
  multiplier: z.number().optional().nullable(),
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

const writeOffInvoiceSchema = z.object({
  reason: z.string().min(1),
});

const createPaymentTermSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  dueDays: z.number().int().nonnegative(),
  discountDays: z.number().int().nonnegative().optional(),
  discountPct: z.number().nonnegative().max(100).optional(),
});

const updatePaymentTermSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  dueDays: z.number().int().nonnegative().optional(),
  discountDays: z.number().int().nonnegative().optional(),
  discountPct: z.number().nonnegative().max(100).optional(),
  isActive: z.boolean().optional(),
});


const createBankConnectionSchema = z.object({
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountType: z.string().min(1),
  bankAccountId: z.string().min(1),
  credentialsHash: z.string().optional(),
});

const manualMatchTransactionSchema = z.object({
  matchedEntityId: z.string().min(1),
  matchedEntityType: z.enum(['PAYMENT', 'JOURNAL_ENTRY']),
});

const saveForecastAdjustmentSchema = z.object({
  weekStart: z.string(),
  adjustments: z.number(),
  comments: z.string().optional(),
});

const createCashFlowScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  inflowFactor: z.number().nonnegative().optional(),
  outflowFactor: z.number().nonnegative().optional(),
  status: z.string().optional(),
});

const updateCashFlowScenarioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  inflowFactor: z.number().nonnegative().optional(),
  outflowFactor: z.number().nonnegative().optional(),
  status: z.string().optional(),
});

const manualMatchIntercompanySchema = z.object({
  fromInvoiceId: z.string().min(1),
  toInvoiceId: z.string().min(1),
  description: z.string().optional(),
});

const createEliminationRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sourceOrgId: z.string().optional(),
  destinationOrgId: z.string().optional(),
  matchingCriteria: z.enum(['AMOUNT_CURRENCY_DATE', 'AMOUNT_ONLY']),
  toleranceDays: z.number().int().nonnegative().optional(),
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
});

const updateEliminationRuleSchema = createEliminationRuleSchema.partial();

const executeEliminationRunSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
});


const createFxRevaluationSchema = z.object({
  runDate: z.string(),
  targetCurrency: z.string().min(3).max(3),
  notes: z.string().optional(),
});

const createCardSpendLimitSchema = z.object({
  scopeType: z.enum(['CARD', 'EMPLOYEE', 'DEPARTMENT']),
  scopeId: z.string().optional(),
  period: z.enum(['WEEKLY', 'MONTHLY']),
  amountCap: z.number().positive(),
});

const updateCardSpendLimitSchema = z.object({
  amountCap: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

const createCardCategoryLimitSchema = z.object({
  mccCategory: z.string().min(1),
  amountCap: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY']),
});

const updateCardCategoryLimitSchema = z.object({
  amountCap: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

const requestLimitIncreaseSchema = z.object({
  requestedCap: z.number().positive(),
  reason: z.string().optional(),
});

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
    private readonly paymentTermsService: PaymentTermsService,
    private readonly bankFeedsService: BankFeedsService,
    private readonly cashFlowForecastService: CashFlowForecastService,
    private readonly interCompanyService: InterCompanyService,
    private readonly fxRevaluationService: FxRevaluationService,
    private readonly payablesService: PayablesService,
    private readonly fpaService: FpaService,
    private readonly invoiceCaptureService: InvoiceCaptureService,
    private readonly cardSpendLimitService: CardSpendLimitService,
    private readonly allocationService: AllocationService,
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
    @Query('bookId') bookId?: string,
  ) {
    return this.reportingService.getProfitAndLoss(req.user.tenantId, req.user.orgId || '', startDate, endDate, bookId);
  }

  @ApiOperation({ summary: 'Get balance sheet' })
  @Get('reports/balance-sheet')
  @Permissions('finance.report.read')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate: string, @Query('bookId') bookId?: string) {
    return this.reportingService.getBalanceSheet(req.user.tenantId, req.user.orgId || '', asOfDate, bookId);
  }

  @ApiOperation({ summary: 'Get cash flow' })
  @Get('reports/cash-flow')
  @Permissions('finance.report.read')
  async getCashFlow(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('bookId') bookId?: string,
  ) {
    return this.reportingService.getCashFlowStatement(req.user.tenantId, req.user.orgId || '', startDate, endDate, bookId);
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

  @ApiOperation({ summary: 'Get invoice analytics' })
  @Get('analytics/invoices')
  @Permissions('finance.report.read')
  async getInvoiceAnalytics(
    @Req() req: AuthenticatedRequest,
    @Query('months') months?: string,
  ) {
    return this.reportingService.getInvoiceAnalytics(req.user.tenantId, months ? parseInt(months) : 12);
  }

  @ApiOperation({ summary: 'Get AP aging report' })
  @Get('reports/ap-aging')
  @Permissions('finance.report.read')
  async getApAgingReport(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getApAgingReport(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Write off invoice' })
  @Post('invoices/:id/write-off')
  @Permissions('finance.invoice.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Invoice')
  async writeOffInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(writeOffInvoiceSchema) dto: z.infer<typeof writeOffInvoiceSchema>,
  ) {
    return this.reportingService.writeOffInvoice(req.user.tenantId, req.user.orgId || '', id, dto.reason);
  }

  @ApiOperation({ summary: 'Create proforma invoice' })
  @Post('invoices/:id/proforma')
  @Permissions('finance.invoice.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('Invoice')
  async createProformaInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.reportingService.createProformaInvoice(req.user.tenantId, req.user.orgId || '', id);
  }

  @ApiOperation({ summary: 'Calculate late fees' })
  @Get('late-fees/calculate')
  @Permissions('finance.tax.compute')
  async calculateLateFees(@Req() req: AuthenticatedRequest) {
    return this.reportingService.calculateLateFees(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get finance dashboard KPIs' })
  @Get('dashboard/kpis')
  @Permissions('finance.report.read')
  async getFinanceDashboardKpis(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getFinanceDashboardKpis(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get 13-week cash forecast' })
  @Get('cash-flow/13-week')
  @Permissions('finance.report.read')
  async get13WeekCashForecast(@Req() req: AuthenticatedRequest) {
    return this.reportingService.get13WeekCashForecast(req.user.tenantId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Get budget monthly spread' })
  @Get('budgets/monthly-spread')
  @Permissions('finance.budget.read')
  async getBudgetMonthlySpread(
    @Req() req: AuthenticatedRequest,
    @Query('fiscalYear') fiscalYear: string,
  ) {
    return this.reportingService.getBudgetMonthlySpread(req.user.tenantId, fiscalYear || '2026');
  }

  @ApiOperation({ summary: 'Get GL account drill down' })
  @Get('accounts/:id/drilldown')
  @Permissions('finance.account.read')
  async getGlAccountDrillDown(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportingService.getGlAccountDrillDown(
      req.user.tenantId,
      id,
      startDate,
      endDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @ApiOperation({ summary: 'Get customer payment behavior' })
  @Get('analytics/customer-payment-behavior')
  @Permissions('finance.report.read')
  async getCustomerPaymentBehavior(
    @Req() req: AuthenticatedRequest,
    @Query('months') months?: string,
  ) {
    return this.reportingService.getCustomerPaymentBehavior(req.user.tenantId, months ? parseInt(months) : 12);
  }

  @ApiOperation({ summary: 'Get vendor payment analysis' })
  @Get('analytics/vendor-payment')
  @Permissions('finance.report.read')
  async getVendorPaymentAnalysis(@Req() req: AuthenticatedRequest) {
    return this.reportingService.getVendorPaymentAnalysis(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get tax filing summary' })
  @Get('tax-filings/summary')
  @Permissions('finance.tax.read')
  async getTaxFilingSummary(
    @Req() req: AuthenticatedRequest,
    @Query('year') year: string,
  ) {
    return this.reportingService.getTaxFilingSummary(req.user.tenantId, year || '2026');
  }

  @ApiOperation({ summary: 'Get payment terms templates' })
  @Get('payment-terms')
  @Permissions('finance.payment.read')
  async getPaymentTerms(@Req() req: AuthenticatedRequest) {
    return this.paymentTermsService.getPaymentTerms(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get payment term template by ID' })
  @Get('payment-terms/:id')
  @Permissions('finance.payment.read')
  async getPaymentTermById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.paymentTermsService.getPaymentTermById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create payment term template' })
  @Post('payment-terms')
  @Permissions('finance.payment.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentTermTemplate')
  async createPaymentTerm(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createPaymentTermSchema) dto: z.infer<typeof createPaymentTermSchema>,
  ) {
    return this.paymentTermsService.createPaymentTerm(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update payment term template' })
  @Patch('payment-terms/:id')
  @Permissions('finance.payment.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentTermTemplate')
  async updatePaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updatePaymentTermSchema) dto: z.infer<typeof updatePaymentTermSchema>,
  ) {
    return this.paymentTermsService.updatePaymentTerm(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete payment term template' })
  @Delete('payment-terms/:id')
  @Permissions('finance.payment.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentTermTemplate')
  async deletePaymentTerm(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.paymentTermsService.deletePaymentTerm(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get bank connections' })
  @Get('bank-feeds/connections')
  @Permissions('finance.bank-account.read')
  async getBankConnections(@Req() req: AuthenticatedRequest) {
    return this.bankFeedsService.getConnections(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create bank connection' })
  @Post('bank-feeds/connections')
  @Permissions('finance.bank-account.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankConnection')
  async createBankConnection(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createBankConnectionSchema) dto: z.infer<typeof createBankConnectionSchema>,
  ) {
    return this.bankFeedsService.createConnection(req.user.tenantId, req.user.orgId || '', dto);
  }

  @ApiOperation({ summary: 'Delete bank connection' })
  @Delete('bank-feeds/connections/:id')
  @Permissions('finance.bank-account.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankConnection')
  async deleteBankConnection(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bankFeedsService.deleteConnection(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Sync bank connection transactions' })
  @Post('bank-feeds/connections/:id/sync')
  @Permissions('finance.bank-account.update')
  async syncBankTransactions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bankFeedsService.syncTransactions(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get bank transactions' })
  @Get('bank-feeds/transactions')
  @Permissions('finance.bank-recon.read')
  async getBankTransactions(
    @Req() req: AuthenticatedRequest,
    @Query('connectionId') connectionId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bankFeedsService.getTransactions(req.user.tenantId, {
      connectionId,
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @ApiOperation({ summary: 'Auto-match bank transaction' })
  @Post('bank-feeds/transactions/:id/auto-match')
  @Permissions('finance.bank-recon.match')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankTransaction')
  async autoMatchBankTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bankFeedsService.autoMatchTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Manual match bank transaction' })
  @Post('bank-feeds/transactions/:id/manual-match')
  @Permissions('finance.bank-recon.match')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankTransaction')
  async manualMatchBankTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(manualMatchTransactionSchema) dto: z.infer<typeof manualMatchTransactionSchema>,
  ) {
    return this.bankFeedsService.manualMatchTransaction(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Ignore bank transaction' })
  @Post('bank-feeds/transactions/:id/ignore')
  @Permissions('finance.bank-recon.match')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BankTransaction')
  async ignoreBankTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bankFeedsService.ignoreTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get rolling 13-week cash flow forecast' })
  @Get('cash-flow/forecast')
  @Permissions('finance.report.read')
  async getCashFlowProjections(
    @Req() req: AuthenticatedRequest,
    @Query('scenarioId') scenarioId?: string,
  ) {
    return this.cashFlowForecastService.get13WeekForecast(req.user.tenantId, scenarioId);
  }

  @ApiOperation({ summary: 'Save weekly forecast manual adjustment' })
  @Post('cash-flow/forecast/adjust')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ForecastWeek')
  async saveForecastWeekOverride(
    @Req() req: AuthenticatedRequest,
    @ZodBody(saveForecastAdjustmentSchema) dto: z.infer<typeof saveForecastAdjustmentSchema>,
  ) {
    return this.cashFlowForecastService.saveForecastWeekOverride(
      req.user.tenantId,
      new Date(dto.weekStart),
      dto,
    );
  }

  @ApiOperation({ summary: 'Get custom forecast scenarios' })
  @Get('cash-flow/forecast/scenarios')
  @Permissions('finance.report.read')
  async getCashFlowScenarios(@Req() req: AuthenticatedRequest) {
    return this.cashFlowForecastService.getScenarios(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create custom forecast scenario' })
  @Post('cash-flow/forecast/scenarios')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ForecastScenario')
  async createCashFlowScenario(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCashFlowScenarioSchema) dto: z.infer<typeof createCashFlowScenarioSchema>,
  ) {
    return this.cashFlowForecastService.createScenario(req.user.tenantId, req.user.orgId || '', dto);
  }

  @ApiOperation({ summary: 'Update custom forecast scenario' })
  @Patch('cash-flow/forecast/scenarios/:id')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ForecastScenario')
  async updateCashFlowScenario(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateCashFlowScenarioSchema) dto: z.infer<typeof updateCashFlowScenarioSchema>,
  ) {
    return this.cashFlowForecastService.updateScenario(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete custom forecast scenario' })
  @Delete('cash-flow/forecast/scenarios/:id')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ForecastScenario')
  async deleteCashFlowScenario(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.cashFlowForecastService.deleteScenario(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Compare scenarios side-by-side' })
  @Get('cash-flow/forecast/compare')
  @Permissions('finance.report.read')
  async compareForecastScenarios(
    @Req() req: AuthenticatedRequest,
    @Query('scenarioId') scenarioId: string,
  ) {
    return this.cashFlowForecastService.compareForecastScenarios(req.user.tenantId, scenarioId);
  }

  @ApiOperation({ summary: 'Export forecast to CSV' })
  @Get('cash-flow/forecast/export')
  @Permissions('finance.report.read')
  async exportForecastCsv(@Req() req: AuthenticatedRequest) {
    return this.cashFlowForecastService.exportForecastCsv(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get intercompany transactions list' })
  @Get('intercompany/transactions')
  @Permissions('finance.report.read')
  async getIntercompanyTransactions(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('fromOrgId') fromOrgId?: string,
    @Query('toOrgId') toOrgId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.interCompanyService.getTransactions(req.user.tenantId, {
      status,
      fromOrgId,
      toOrgId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @ApiOperation({ summary: 'Run intercompany automatic transaction matching' })
  @Post('intercompany/auto-match')
  @Permissions('finance.report.create')
  async autoMatchIntercompanyTransactions(@Req() req: AuthenticatedRequest) {
    return this.interCompanyService.autoMatchTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Manually match intercompany transaction pair' })
  @Post('intercompany/manual-match')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('InterCompanyTransaction')
  async manualMatchIntercompanyTransactions(
    @Req() req: AuthenticatedRequest,
    @ZodBody(manualMatchIntercompanySchema) dto: z.infer<typeof manualMatchIntercompanySchema>,
  ) {
    return this.interCompanyService.manualMatchTransactions(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Run netting elimination entry for intercompany matched transaction' })
  @Post('intercompany/eliminate/:id')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('InterCompanyTransaction')
  async eliminateIntercompanyTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.interCompanyService.eliminateTransaction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get intercompany netting consolidated stats' })
  @Get('intercompany/stats')
  @Permissions('finance.report.read')
  async getIntercompanyStats(@Req() req: AuthenticatedRequest) {
    return this.interCompanyService.getConsolidatedStats(req.user.tenantId);
  }

  // ── Auto-Elimination Rules & Runs ──

  @ApiOperation({ summary: 'Get all intercompany elimination rules' })
  @Get('intercompany/elimination-rules')
  @Permissions('finance.eliminations.read')
  async getEliminationRules(@Req() req: AuthenticatedRequest) {
    return this.interCompanyService.getEliminationRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get intercompany elimination rule by ID' })
  @Get('intercompany/elimination-rules/:id')
  @Permissions('finance.eliminations.read')
  async getEliminationRuleById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.interCompanyService.getEliminationRuleById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create intercompany elimination rule' })
  @Post('intercompany/elimination-rules')
  @Permissions('finance.eliminations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EliminationRule')
  async createEliminationRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createEliminationRuleSchema) dto: z.infer<typeof createEliminationRuleSchema>,
  ) {
    return this.interCompanyService.createEliminationRule(req.user.tenantId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update intercompany elimination rule' })
  @Patch('intercompany/elimination-rules/:id')
  @Permissions('finance.eliminations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EliminationRule', 'id')
  async updateEliminationRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateEliminationRuleSchema) dto: z.infer<typeof updateEliminationRuleSchema>,
  ) {
    return this.interCompanyService.updateEliminationRule(req.user.tenantId, id, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete intercompany elimination rule' })
  @Delete('intercompany/elimination-rules/:id')
  @Permissions('finance.eliminations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EliminationRule', 'id')
  async deleteEliminationRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.interCompanyService.deleteEliminationRule(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Get intercompany elimination runs' })
  @Get('intercompany/elimination-runs')
  @Permissions('finance.eliminations.read')
  async getEliminationRuns(@Req() req: AuthenticatedRequest) {
    return this.interCompanyService.getEliminationRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Execute intercompany elimination run' })
  @Post('intercompany/elimination-runs')
  @Permissions('finance.eliminations.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EliminationRun')
  async executeEliminationRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(executeEliminationRunSchema) dto: z.infer<typeof executeEliminationRunSchema>,
  ) {
    return this.interCompanyService.executeEliminationRun(req.user.tenantId, dto.periodStart, dto.periodEnd, req.user.userId);
  }

  @ApiOperation({ summary: 'Post/approve intercompany elimination run' })
  @Post('intercompany/elimination-runs/:id/post')
  @Permissions('finance.eliminations.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('EliminationRun', 'id')
  async postEliminationRun(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.interCompanyService.postEliminationRun(req.user.tenantId, id, req.user.userId);
  }


  @ApiOperation({ summary: 'Get FX revaluation runs list' })
  @Get('fx-revaluation/runs')
  @Permissions('finance.report.read')
  async getFxRevaluationRuns(@Req() req: AuthenticatedRequest) {
    return this.fxRevaluationService.getRevaluationRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create draft FX revaluation run' })
  @Post('fx-revaluation/runs')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('FxRevaluationRun')
  async createFxRevaluationRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createFxRevaluationSchema) dto: z.infer<typeof createFxRevaluationSchema>,
  ) {
    return this.fxRevaluationService.createRevaluationRun(
      req.user.tenantId,
      req.user.orgId || '',
      dto,
    );
  }

  @ApiOperation({ summary: 'Post FX revaluation run adjustments to GL ledger' })
  @Post('fx-revaluation/runs/:id/post')
  @Permissions('finance.report.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('FxRevaluationRun')
  async postFxRevaluationRun(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.fxRevaluationService.postRevaluationRun(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get details of FX revaluation run' })
  @Get('fx-revaluation/runs/:id/details')
  @Permissions('finance.report.read')
  async getFxRevaluationRunDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.fxRevaluationService.getRevaluationRunDetails(req.user.tenantId, id);
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

  @ApiOperation({ summary: 'Second-level approve expense report (over threshold)' })
  @Permissions('finance.expense.approve')
  @Post('expense-reports/:id/second-approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReport', 'id')
  async secondApproveExpenseReport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.secondApproveExpenseReport(req.user.tenantId, id, req.user.userId || 'system');
  }

  // ── Expense Items ──
  @ApiOperation({ summary: 'Add expense line item to report' })
  @Permissions('finance.expense.create')
  @Post('expense-reports/:id/items')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReportItem')
  async addExpenseItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(addExpenseItemSchema) dto: z.infer<typeof addExpenseItemSchema>,
  ) {
    return this.expenseService.addExpenseItem(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Update expense line item' })
  @Permissions('finance.expense.create')
  @Patch('expense-items/:itemId')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseReportItem', 'itemId')
  async updateExpenseItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @ZodBody(updateExpenseItemSchema) dto: z.infer<typeof updateExpenseItemSchema>,
  ) {
    return this.expenseService.updateExpenseItem(req.user.tenantId, itemId, dto);
  }

  @ApiOperation({ summary: 'Delete expense line item' })
  @Permissions('finance.expense.create')
  @Delete('expense-items/:itemId')
  async deleteExpenseItem(@Req() req: AuthenticatedRequest, @Param('itemId') itemId: string) {
    return this.expenseService.deleteExpenseItem(req.user.tenantId, itemId);
  }

  // ── OCR Receipt Capture ──
  @ApiOperation({ summary: 'Scan a receipt (simulated OCR extraction of merchant/amount/date/category)' })
  @Permissions('finance.expense.create')
  @Post('expenses/ocr-scan')
  async scanReceipt(
    @Req() req: AuthenticatedRequest,
    @ZodBody(scanReceiptSchema) dto: z.infer<typeof scanReceiptSchema>,
  ) {
    return this.expenseService.scanReceipt(req.user.tenantId, dto);
  }

  // ── Expense Category Policies ──
  @ApiOperation({ summary: 'List expense category policies' })
  @Permissions('finance.expense.read')
  @Get('expense-policies')
  async getExpensePolicies(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getPolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create or update an expense category policy' })
  @Permissions('finance.expense.approve')
  @Post('expense-policies')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('ExpenseCategoryPolicy')
  async upsertExpensePolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(upsertExpensePolicySchema) dto: z.infer<typeof upsertExpensePolicySchema>,
  ) {
    return this.expenseService.upsertPolicy(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Delete an expense category policy' })
  @Permissions('finance.expense.approve')
  @Delete('expense-policies/:id')
  async deleteExpensePolicy(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.deletePolicy(req.user.tenantId, id);
  }

  // ── Mileage Rates ──
  @ApiOperation({ summary: 'List mileage rates' })
  @Permissions('finance.expense.read')
  @Get('mileage-rates')
  async getMileageRates(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getMileageRates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create a mileage rate' })
  @Permissions('finance.expense.approve')
  @Post('mileage-rates')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('MileageRate')
  async createMileageRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createMileageRateSchema) dto: z.infer<typeof createMileageRateSchema>,
  ) {
    return this.expenseService.createMileageRate(req.user.tenantId, dto);
  }

  // ── Per Diem Rates ──
  @ApiOperation({ summary: 'List per-diem rates' })
  @Permissions('finance.expense.read')
  @Get('per-diem-rates')
  async getPerDiemRates(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getPerDiemRates(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create or update a per-diem rate' })
  @Permissions('finance.expense.approve')
  @Post('per-diem-rates')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PerDiemRate')
  async upsertPerDiemRate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(upsertPerDiemRateSchema) dto: z.infer<typeof upsertPerDiemRateSchema>,
  ) {
    return this.expenseService.upsertPerDiemRate(req.user.tenantId, dto);
  }

  // ── Corporate Cards ──
  @ApiOperation({ summary: 'List corporate cards' })
  @Permissions('finance.expense.read')
  @Get('corporate-cards')
  async getCorporateCards(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getCorporateCards(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Register a corporate card' })
  @Permissions('finance.expense.approve')
  @Post('corporate-cards')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CorporateCard')
  async createCorporateCard(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCorporateCardSchema) dto: z.infer<typeof createCorporateCardSchema>,
  ) {
    return this.expenseService.createCorporateCard(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Import corporate card transactions (feed simulation)' })
  @Permissions('finance.expense.approve')
  @Post('corporate-cards/:id/transactions/import')
  async importCardTransactions(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(importCardTransactionsSchema) dto: z.infer<typeof importCardTransactionsSchema>,
  ) {
    return this.expenseService.importCardTransactions(req.user.tenantId, id, dto.transactions);
  }

  @ApiOperation({ summary: 'List unmatched corporate card transactions' })
  @Permissions('finance.expense.read')
  @Get('corporate-card-transactions/unmatched')
  async getUnmatchedCardTransactions(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getUnmatchedCardTransactions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Match a corporate card transaction to an expense item' })
  @Permissions('finance.expense.create')
  @Post('corporate-card-transactions/:id/match')
  async matchCardTransaction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(matchCardTransactionSchema) dto: z.infer<typeof matchCardTransactionSchema>,
  ) {
    return this.expenseService.matchCardTransactionToItem(req.user.tenantId, id, dto.itemId);
  }

  @ApiOperation({ summary: 'Ignore a corporate card transaction' })
  @Permissions('finance.expense.create')
  @Post('corporate-card-transactions/:id/ignore')
  async ignoreCardTransaction(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.expenseService.ignoreCardTransaction(req.user.tenantId, id);
  }

  // ── Expense Analytics ──
  @ApiOperation({ summary: 'Expense analytics: spend by category, status, policy violations' })
  @Permissions('finance.expense.read')
  @Get('expense-analytics')
  async getExpenseAnalytics(@Req() req: AuthenticatedRequest) {
    return this.expenseService.getExpenseAnalytics(req.user.tenantId);
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

  @ApiOperation({ summary: 'List accounting book rules' })
  @Permissions('finance.books.manage')
  @Get('accounting-books/rules')
  async getAccountingBookRules(@Req() req: AuthenticatedRequest) {
    return this.glService.getAccountingBookRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create an accounting book rule' })
  @Permissions('finance.books.manage')
  @Post('accounting-books/rules')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AccountingBookRule')
  async createAccountingBookRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAccountingBookRuleSchema) body: z.infer<typeof createAccountingBookRuleSchema>,
  ) {
    return this.glService.createAccountingBookRule(req.user.tenantId, req.user.orgId || 'org-system-default', body);
  }

  @ApiOperation({ summary: 'Delete an accounting book rule' })
  @Permissions('finance.books.manage')
  @Delete('accounting-books/rules/:id')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AccountingBookRule', 'id')
  async deleteAccountingBookRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.glService.deleteAccountingBookRule(req.user.tenantId, id);
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

  // ── Payables: AP Three-Way Matching ─────────────────────────────────────────

  @ApiOperation({ summary: 'Payables stats dashboard' })
  @Get('payables/stats')
  @Permissions('finance.payables.read')
  async getPayablesStats(@Req() req: AuthenticatedRequest) {
    return this.payablesService.getPayablesStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'List AP match rules' })
  @Get('payables/match-rules')
  @Permissions('finance.payables.read')
  async listMatchRules(@Req() req: AuthenticatedRequest) {
    return this.payablesService.listMatchRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create AP match rule' })
  @Post('payables/match-rules')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APMatchRule')
  async createMatchRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      vendorId: z.string().optional(),
      quantityTolerancePercent: z.number().min(0).max(100),
      priceTolerancePercent: z.number().min(0).max(100),
      effectiveDate: z.string(),
    })) body: { vendorId?: string; quantityTolerancePercent: number; priceTolerancePercent: number; effectiveDate: string },
  ) {
    return this.payablesService.createMatchRule(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update AP match rule' })
  @Patch('payables/match-rules/:id')
  @Permissions('finance.payables.manage')
  async updateMatchRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      quantityTolerancePercent: z.number().min(0).max(100).optional(),
      priceTolerancePercent: z.number().min(0).max(100).optional(),
      effectiveDate: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })) body: { quantityTolerancePercent?: number; priceTolerancePercent?: number; effectiveDate?: string; status?: string },
  ) {
    return this.payablesService.updateMatchRule(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete AP match rule (soft delete)' })
  @Delete('payables/match-rules/:id')
  @Permissions('finance.payables.manage')
  async deleteMatchRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payablesService.deleteMatchRule(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Run three-way match on a purchase order' })
  @Post('payables/invoices/:id/match')
  @Permissions('finance.payables.match')
  async runMatch(
    @Req() req: AuthenticatedRequest,
    @Param('id') purchaseOrderId: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.payablesService.runMatch(req.user.tenantId, req.user.userId, { purchaseOrderId, ...body });
  }

  @ApiOperation({ summary: 'List AP match exceptions (out-of-tolerance invoices)' })
  @Get('payables/exceptions')
  @Permissions('finance.payables.read')
  async listExceptions(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.payablesService.listExceptions(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Approve an AP match exception' })
  @Post('payables/exceptions/:id/approve')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APMatchException')
  async approveException(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.payablesService.approveException(req.user.tenantId, id, req.user.userId, body.notes);
  }

  @ApiOperation({ summary: 'Reject an AP match exception' })
  @Post('payables/exceptions/:id/reject')
  @Permissions('finance.payables.manage')
  async rejectException(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.payablesService.rejectException(req.user.tenantId, id, req.user.userId, body.notes);
  }

  // ── Payables: Payment Batches ────────────────────────────────────────────────

  @ApiOperation({ summary: 'List vendor payment batches' })
  @Get('payables/payment-batches')
  @Permissions('finance.payables.read')
  async listPaymentBatches(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.payablesService.listPaymentBatches(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Get a payment batch by ID' })
  @Get('payables/payment-batches/:id')
  @Permissions('finance.payables.read')
  async getPaymentBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payablesService.getPaymentBatch(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new vendor payment batch' })
  @Post('payables/payment-batches')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentBatch')
  async createPaymentBatch(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      paymentMethod: z.enum(['ACH', 'WIRE', 'CHECK', 'SEPA']),
      settlementDate: z.string().optional(),
      bankAccountId: z.string().optional(),
      currency: z.string().length(3).optional(),
      notes: z.string().optional(),
    })) body: { paymentMethod: string; settlementDate?: string; bankAccountId?: string; currency?: string; notes?: string },
  ) {
    return this.payablesService.createPaymentBatch(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Add an invoice/PO to a payment batch' })
  @Post('payables/payment-batches/:id/lines')
  @Permissions('finance.payables.manage')
  async addLineToBatch(
    @Req() req: AuthenticatedRequest,
    @Param('id') batchId: string,
    @ZodBody(z.object({
      referenceId: z.string().min(1),
      amount: z.number().positive(),
      scheduledPaymentDate: z.string(),
      notes: z.string().optional(),
    })) body: { referenceId: string; amount: number; scheduledPaymentDate: string; notes?: string },
  ) {
    return this.payablesService.addLineToBatch(req.user.tenantId, batchId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Remove a line from a payment batch' })
  @Delete('payables/payment-batches/:id/lines/:lineId')
  @Permissions('finance.payables.manage')
  async removeLineFromBatch(
    @Req() req: AuthenticatedRequest,
    @Param('id') batchId: string,
    @Param('lineId') lineId: string,
  ) {
    return this.payablesService.removeLineFromBatch(req.user.tenantId, batchId, lineId, req.user.userId);
  }

  @ApiOperation({ summary: 'Execute (run) a payment batch — settle lines and post GL journal' })
  @Post('payables/payment-batches/:id/run')
  @Permissions('finance.payables.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('PaymentBatch')
  async runPaymentBatch(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.payablesService.runPaymentBatch(req.user.tenantId, id, req.user.userId, req.user.orgId || '');
  }

  @ApiOperation({ summary: 'Export payment batch as NACHA / SEPA XML / CSV' })
  @Get('payables/payment-batches/:id/export')
  @Permissions('finance.payables.read')
  async exportPaymentBatch(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('format') format = 'NACHA',
  ) {
    return this.payablesService.exportPaymentBatch(req.user.tenantId, id, format);
  }

  // ── Financial Statement Drill-Through ────────────────────────────────────────

  @ApiOperation({ summary: 'Drill through a P&L or Balance Sheet line to underlying journal entries' })
  @Get('reports/:reportType/drilldown')
  @Permissions('finance.reports.read')
  async reportDrilldown(
    @Req() req: AuthenticatedRequest,
    @Param('reportType') reportType: string,
    @Query('accountId') accountId?: string,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payablesService.reportDrilldown(req.user.tenantId, reportType, { accountId, period, limit });
  }

  // ── FP&A: Close Tasks ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List close tasks for a financial period' })
  @Get('close-tasks')
  @Permissions('finance.fpa.read')
  async listCloseTasks(
    @Req() req: AuthenticatedRequest,
    @Query('periodId') periodId: string,
    @Query('status') status?: string,
  ) {
    if (!periodId) throw new BadRequestException('periodId query parameter is required');
    return this.fpaService.listCloseTasks(req.user.tenantId, periodId, status);
  }

  @ApiOperation({ summary: 'Get a close task by ID' })
  @Get('close-tasks/:id')
  @Permissions('finance.fpa.read')
  async getCloseTask(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.getCloseTask(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new close task' })
  @Post('close-tasks')
  @Permissions('finance.fpa.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CloseTask')
  async createCloseTask(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      financialPeriodId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      assigneeId: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
    })) body: any,
  ) {
    return this.fpaService.createCloseTask(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update close task status/assignee' })
  @Patch('close-tasks/:id')
  @Permissions('finance.fpa.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CloseTask')
  async updateCloseTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      status: z.string().optional(),
      assigneeId: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
    })) body: any,
  ) {
    return this.fpaService.updateCloseTask(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete a close task' })
  @Delete('close-tasks/:id')
  @Permissions('finance.fpa.manage')
  async deleteCloseTask(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.deleteCloseTask(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Generate standard close tasks from templates for a period' })
  @Post('close-tasks/generate')
  @Permissions('finance.fpa.run')
  async generateCloseTasksFromTemplate(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ financialPeriodId: z.string().min(1) })) body: { financialPeriodId: string },
  ) {
    return this.fpaService.generateCloseTasksFromTemplate(req.user.tenantId, req.user.userId, body.financialPeriodId);
  }

  @ApiOperation({ summary: 'Get continuous close dashboard summary' })
  @Get('close-tasks/dashboard')
  @Permissions('finance.fpa.read')
  async getCloseDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('periodId') periodId: string,
  ) {
    if (!periodId) throw new BadRequestException('periodId query parameter is required');
    return this.fpaService.getCloseDashboard(req.user.tenantId, periodId);
  }

  // ── FP&A: Variance Flags ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Run variance engine comparing current vs prior financial period' })
  @Post('variance-flags/run')
  @Permissions('finance.fpa.run')
  async runVarianceFlagEngine(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      financialPeriodId: z.string().min(1),
      thresholdPercent: z.number().min(1).max(100).optional(),
    })) body: { financialPeriodId: string; thresholdPercent?: number },
  ) {
    return this.fpaService.runVarianceFlagEngine(
      req.user.tenantId,
      body.financialPeriodId,
      body.thresholdPercent,
    );
  }

  @ApiOperation({ summary: 'List variance flags for a financial period' })
  @Get('variance-flags')
  @Permissions('finance.fpa.read')
  async listVarianceFlags(
    @Req() req: AuthenticatedRequest,
    @Query('periodId') periodId: string,
    @Query('status') status?: string,
  ) {
    if (!periodId) throw new BadRequestException('periodId query parameter is required');
    return this.fpaService.listVarianceFlags(req.user.tenantId, periodId, status);
  }

  @ApiOperation({ summary: 'Acknowledge an open variance flag' })
  @Post('variance-flags/:id/acknowledge')
  @Permissions('finance.fpa.manage')
  async acknowledgeVarianceFlag(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.fpaService.acknowledgeVarianceFlag(req.user.tenantId, id, req.user.userId, body.notes);
  }

  @ApiOperation({ summary: 'Resolve a variance flag' })
  @Post('variance-flags/:id/resolve')
  @Permissions('finance.fpa.manage')
  async resolveVarianceFlag(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.fpaService.resolveVarianceFlag(req.user.tenantId, id, req.user.userId, body.notes);
  }

  // ── FP&A: Budget Scenarios ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'List budget scenarios' })
  @Get('budget-scenarios')
  @Permissions('finance.fpa.read')
  async listScenarios(
    @Req() req: AuthenticatedRequest,
    @Query('fiscalYear') fiscalYear?: string,
  ) {
    const year = fiscalYear ? parseInt(fiscalYear, 10) : undefined;
    return this.fpaService.listScenarios(req.user.tenantId, year);
  }

  @ApiOperation({ summary: 'Compare scenarios or scenario vs actuals' })
  @Get('budget-scenarios/compare')
  @Permissions('finance.fpa.read')
  async compareScenarios(
    @Req() req: AuthenticatedRequest,
    @Query('scenarioAId') scenarioAId: string,
    @Query('scenarioBId') scenarioBId: string,
    @Query('fiscalYear') fiscalYear: string,
  ) {
    if (!scenarioAId || !scenarioBId || !fiscalYear) {
      throw new BadRequestException('scenarioAId, scenarioBId, and fiscalYear parameters are required');
    }
    return this.fpaService.compareScenarios(
      req.user.tenantId,
      scenarioAId,
      scenarioBId,
      parseInt(fiscalYear, 10),
    );
  }

  @ApiOperation({ summary: 'Get budget scenario details and monthly lines' })
  @Get('budget-scenarios/:id')
  @Permissions('finance.fpa.read')
  async getScenario(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.getScenario(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new budget scenario' })
  @Post('budget-scenarios')
  @Permissions('finance.fpa.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BudgetScenario')
  async createScenario(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(['BASE', 'UPSIDE', 'DOWNSIDE', 'ACTUALS', 'CUSTOM']).optional(),
      fiscalYear: z.number().int().positive(),
    })) body: { name: string; description?: string; type?: string; fiscalYear: number },
  ) {
    return this.fpaService.createScenario(req.user.tenantId, req.user.userId, {
      ...body,
      orgId: req.user.orgId || '',
    });
  }

  @ApiOperation({ summary: 'Update a budget scenario' })
  @Patch('budget-scenarios/:id')
  @Permissions('finance.fpa.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BudgetScenario')
  async updateScenario(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
    })) body: { name?: string; description?: string; status?: string },
  ) {
    return this.fpaService.updateScenario(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Lock a budget scenario (approves it)' })
  @Post('budget-scenarios/:id/lock')
  @Permissions('finance.fpa.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BudgetScenario')
  async lockScenario(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.lockScenario(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Unlock a budget scenario' })
  @Post('budget-scenarios/:id/unlock')
  @Permissions('finance.fpa.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BudgetScenario')
  async unlockScenario(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.unlockScenario(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Clone a budget scenario' })
  @Post('budget-scenarios/:id/clone')
  @Permissions('finance.fpa.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('BudgetScenario')
  async cloneScenario(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      name: z.string().min(1),
      type: z.string().optional(),
    })) body: { name: string; type?: string },
  ) {
    return this.fpaService.cloneScenario(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Apply driver calculations to generate budget lines in bulk' })
  @Post('budget-scenarios/:id/driver')
  @Permissions('finance.fpa.run')
  async applyDriver(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      accountId: z.string().min(1),
      driverType: z.enum(['HEADCOUNT', 'UNITS', 'PERCENTAGE']),
      driverValue: z.number().positive(),
      driverRate: z.number().positive(),
      months: z.array(z.number().int().min(1).max(12)).optional(),
      costCenterId: z.string().optional(),
    })) body: {
      accountId: string;
      driverType: 'HEADCOUNT' | 'UNITS' | 'PERCENTAGE';
      driverValue: number;
      driverRate: number;
      months?: number[];
      costCenterId?: string;
    },
  ) {
    return this.fpaService.applyDriver(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete a budget scenario (archives it)' })
  @Delete('budget-scenarios/:id')
  @Permissions('finance.fpa.manage')
  async deleteScenario(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.fpaService.deleteScenario(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Upsert a single budget scenario line' })
  @Post('budget-scenarios/:id/lines')
  @Permissions('finance.fpa.manage')
  async upsertScenarioLine(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      accountId: z.string().min(1),
      month: z.number().int().min(1).max(12),
      amount: z.number(),
      driverType: z.string().optional(),
      driverValue: z.number().optional(),
      driverRate: z.number().optional(),
      costCenterId: z.string().optional(),
      notes: z.string().optional(),
    })) body: any,
  ) {
    return this.fpaService.upsertScenarioLine(req.user.tenantId, id, body);
  }

  // ── FP&A / Payables: AI Invoice Capture ────────────────────────────────────

  @ApiOperation({ summary: 'List captured invoices' })
  @Get('payables/invoices/capture')
  @Permissions('finance.payables.read')
  async listCaptures(@Req() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.invoiceCaptureService.listCaptures(req.user.tenantId, status);
  }

  @ApiOperation({ summary: 'Get captured invoice details' })
  @Get('payables/invoices/capture/:id')
  @Permissions('finance.payables.read')
  async getCapture(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceCaptureService.getCapture(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create (upload) invoice capture record' })
  @Post('payables/invoices/capture')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APInvoiceCapture')
  async createCapture(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({
      fileName: z.string().min(1),
      rawText: z.string().optional(),
    })) body: { fileName: string; rawText?: string },
  ) {
    return this.invoiceCaptureService.createCapture(req.user.tenantId, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Update captured invoice metadata manually' })
  @Patch('payables/invoices/capture/:id')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APInvoiceCapture')
  async updateCapture(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({
      vendorName: z.string().optional(),
      invoiceNumber: z.string().optional(),
      invoiceDate: z.string().optional(),
      dueDate: z.string().optional(),
      totalAmount: z.number().optional(),
      currency: z.string().optional(),
      matchingPurchaseOrderId: z.string().optional(),
      notes: z.string().optional(),
      status: z.string().optional(),
    })) body: any,
  ) {
    return this.invoiceCaptureService.updateCapture(req.user.tenantId, id, req.user.userId, body);
  }

  @ApiOperation({ summary: 'Delete captured invoice record' })
  @Delete('payables/invoices/capture/:id')
  @Permissions('finance.payables.manage')
  async deleteCapture(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceCaptureService.deleteCapture(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Auto-code GL account suggestions based on vendor history' })
  @Post('payables/invoices/capture/:id/auto-code')
  @Permissions('finance.payables.manage')
  async autoCode(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceCaptureService.autoCode(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Approve and post captured invoice' })
  @Post('payables/invoices/capture/:id/approve')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APInvoiceCapture')
  async approveCapture(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceCaptureService.approveCapture(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'Reject captured invoice' })
  @Post('payables/invoices/capture/:id/reject')
  @Permissions('finance.payables.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('APInvoiceCapture')
  async rejectCapture(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.object({ notes: z.string().optional() })) body: { notes?: string },
  ) {
    return this.invoiceCaptureService.rejectCapture(req.user.tenantId, id, req.user.userId, body.notes);
  }

  // ── Captured Invoice Lines Operations ──────────────────────────────────────

  @ApiOperation({ summary: 'Add a line item manually to captured invoice' })
  @Post('payables/invoices/capture/:id/lines')
  @Permissions('finance.payables.manage')
  async createCaptureLine(
    @Req() req: AuthenticatedRequest,
    @Param('id') captureId: string,
    @ZodBody(z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      suggestedAccountId: z.string().optional(),
      suggestedCostCenterId: z.string().optional(),
    })) body: any,
  ) {
    return this.invoiceCaptureService.createLine(req.user.tenantId, captureId, body);
  }

  @ApiOperation({ summary: 'Update captured invoice line item' })
  @Patch('payables/invoices/capture/:id/lines/:lineId')
  @Permissions('finance.payables.manage')
  async updateCaptureLine(
    @Req() req: AuthenticatedRequest,
    @Param('id') captureId: string,
    @Param('lineId') lineId: string,
    @ZodBody(z.object({
      description: z.string().optional(),
      quantity: z.number().positive().optional(),
      unitPrice: z.number().positive().optional(),
      suggestedAccountId: z.string().optional(),
      suggestedCostCenterId: z.string().optional(),
    })) body: any,
  ) {
    return this.invoiceCaptureService.updateLine(req.user.tenantId, captureId, lineId, body);
  }

  @ApiOperation({ summary: 'Delete captured invoice line item' })
  @Delete('payables/invoices/capture/:id/lines/:lineId')
  @Permissions('finance.payables.manage')
  async deleteCaptureLine(
    @Req() req: AuthenticatedRequest,
    @Param('id') captureId: string,
    @Param('lineId') lineId: string,
  ) {
    return this.invoiceCaptureService.deleteLine(req.user.tenantId, captureId, lineId);
  }

  // ── Corporate Card Spend Management ──────────────────────────

  @ApiOperation({ summary: 'Create card spend limit' })
  @Post('corporate-cards/:id/limits')
  @Permissions('finance.corporate-card-limit.create')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardSpendLimit')
  async createCardSpendLimit(
    @Req() req: AuthenticatedRequest,
    @Param('id') cardId: string,
    @ZodBody(createCardSpendLimitSchema) dto: z.infer<typeof createCardSpendLimitSchema>,
  ) {
    return this.cardSpendLimitService.createSpendLimit(req.user.tenantId, cardId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'List card spend limits' })
  @Get('corporate-cards/:id/limits')
  @Permissions('finance.corporate-card-limit.read')
  async getCardSpendLimits(@Req() req: AuthenticatedRequest, @Param('id') cardId: string) {
    return this.cardSpendLimitService.getSpendLimits(req.user.tenantId, cardId);
  }

  @ApiOperation({ summary: 'Update card spend limit' })
  @Patch('corporate-cards/:id/limits/:limitId')
  @Permissions('finance.corporate-card-limit.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardSpendLimit', 'limitId')
  async updateCardSpendLimit(
    @Req() req: AuthenticatedRequest,
    @Param('limitId') limitId: string,
    @ZodBody(updateCardSpendLimitSchema) dto: z.infer<typeof updateCardSpendLimitSchema>,
  ) {
    return this.cardSpendLimitService.updateSpendLimit(req.user.tenantId, limitId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete card spend limit' })
  @Delete('corporate-cards/:id/limits/:limitId')
  @Permissions('finance.corporate-card-limit.delete')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardSpendLimit', 'limitId')
  async deleteCardSpendLimit(@Req() req: AuthenticatedRequest, @Param('limitId') limitId: string) {
    return this.cardSpendLimitService.deleteSpendLimit(req.user.tenantId, limitId, req.user.userId);
  }

  @ApiOperation({ summary: 'Create card category (MCC) spend limit' })
  @Post('corporate-cards/:id/category-limits')
  @Permissions('finance.corporate-card-limit.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardCategoryLimit')
  async createCardCategoryLimit(
    @Req() req: AuthenticatedRequest,
    @Param('id') cardId: string,
    @ZodBody(createCardCategoryLimitSchema) dto: z.infer<typeof createCardCategoryLimitSchema>,
  ) {
    return this.cardSpendLimitService.createCategoryLimit(req.user.tenantId, cardId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'List card category (MCC) spend limits' })
  @Get('corporate-cards/:id/category-limits')
  @Permissions('finance.corporate-card-limit.read')
  async getCardCategoryLimits(@Req() req: AuthenticatedRequest, @Param('id') cardId: string) {
    return this.cardSpendLimitService.getCategoryLimits(req.user.tenantId, cardId);
  }

  @ApiOperation({ summary: 'Update card category (MCC) spend limit' })
  @Patch('corporate-cards/:id/category-limits/:limitId')
  @Permissions('finance.corporate-card-limit.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardCategoryLimit', 'limitId')
  async updateCardCategoryLimit(
    @Req() req: AuthenticatedRequest,
    @Param('limitId') limitId: string,
    @ZodBody(updateCardCategoryLimitSchema) dto: z.infer<typeof updateCardCategoryLimitSchema>,
  ) {
    return this.cardSpendLimitService.updateCategoryLimit(req.user.tenantId, limitId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Delete card category (MCC) spend limit' })
  @Delete('corporate-cards/:id/category-limits/:limitId')
  @Permissions('finance.corporate-card-limit.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardCategoryLimit', 'limitId')
  async deleteCardCategoryLimit(@Req() req: AuthenticatedRequest, @Param('limitId') limitId: string) {
    return this.cardSpendLimitService.deleteCategoryLimit(req.user.tenantId, limitId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get card utilization (spend vs cap for all active limits)' })
  @Get('corporate-cards/:id/utilization')
  @Permissions('finance.corporate-card-limit.read')
  async getCardUtilization(@Req() req: AuthenticatedRequest, @Param('id') cardId: string) {
    return this.cardSpendLimitService.getUtilization(req.user.tenantId, cardId);
  }

  @ApiOperation({ summary: 'Freeze corporate card' })
  @Post('corporate-cards/:id/freeze')
  @Permissions('finance.corporate-card.freeze')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CorporateCard', 'id')
  async freezeCorporateCard(@Req() req: AuthenticatedRequest, @Param('id') cardId: string) {
    return this.cardSpendLimitService.freezeCard(req.user.tenantId, cardId);
  }

  @ApiOperation({ summary: 'Unfreeze corporate card' })
  @Post('corporate-cards/:id/unfreeze')
  @Permissions('finance.corporate-card.freeze')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CorporateCard', 'id')
  async unfreezeCorporateCard(@Req() req: AuthenticatedRequest, @Param('id') cardId: string) {
    return this.cardSpendLimitService.unfreezeCard(req.user.tenantId, cardId);
  }

  @ApiOperation({ summary: 'Request a card spend limit increase' })
  @Post('corporate-cards/:id/limits/:limitId/request-increase')
  @Permissions('finance.corporate-card-limit.request-increase')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardLimitIncreaseRequest')
  async requestCardLimitIncrease(
    @Req() req: AuthenticatedRequest,
    @Param('limitId') limitId: string,
    @ZodBody(requestLimitIncreaseSchema) dto: z.infer<typeof requestLimitIncreaseSchema>,
  ) {
    return this.cardSpendLimitService.requestLimitIncrease(req.user.tenantId, limitId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Approve a card spend limit increase request' })
  @Post('corporate-cards/:id/limits/:limitId/request-increase/:requestId/approve')
  @Permissions('finance.corporate-card-limit.approve')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('CardLimitIncreaseRequest', 'requestId')
  async approveCardLimitIncrease(@Req() req: AuthenticatedRequest, @Param('requestId') requestId: string) {
    return this.cardSpendLimitService.approveLimitIncrease(req.user.tenantId, requestId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get card spend limit audit trail' })
  @Get('corporate-cards/:id/limits/:limitId/audit')
  @Permissions('finance.corporate-card-limit.read')
  async getCardLimitAudit(@Req() req: AuthenticatedRequest, @Param('limitId') limitId: string) {
    return this.cardSpendLimitService.getAuditTrail(req.user.tenantId, limitId);
  }

  // ── Allocation Rules & Runs Operations ──────────────────────────────────────

  @ApiOperation({ summary: 'List all allocation rules' })
  @Get('allocations/rules')
  @Permissions('finance.allocations.read')
  async getRules(@Req() req: AuthenticatedRequest) {
    return this.allocationService.getRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get allocation rule by ID' })
  @Get('allocations/rules/:id')
  @Permissions('finance.allocations.read')
  async getRuleById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.allocationService.getRuleById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new allocation rule' })
  @Post('allocations/rules')
  @Permissions('finance.allocations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AllocationRule')
  async createRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        allocationType: z.string().min(1),
        basisType: z.string().optional(),
        sourceAccountId: z.string().min(1),
        targetAllocations: z.array(
          z.object({
            accountId: z.string().min(1),
            costCenterId: z.string().optional(),
            departmentId: z.string().optional(),
            percentage: z.number().optional(),
            ratioWeight: z.number().optional(),
          }),
        ),
      }),
    )
    dto: any,
  ) {
    return this.allocationService.createRule(req.user.tenantId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Update an allocation rule' })
  @Patch('allocations/rules/:id')
  @Permissions('finance.allocations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AllocationRule')
  async updateRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        allocationType: z.string().optional(),
        basisType: z.string().optional(),
        sourceAccountId: z.string().optional(),
        targetAllocations: z.array(
          z.object({
            accountId: z.string().min(1),
            costCenterId: z.string().optional(),
            departmentId: z.string().optional(),
            percentage: z.number().optional(),
            ratioWeight: z.number().optional(),
          }),
        ).optional(),
      }),
    )
    dto: any,
  ) {
    return this.allocationService.updateRule(req.user.tenantId, id, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete an allocation rule' })
  @Delete('allocations/rules/:id')
  @Permissions('finance.allocations.manage')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AllocationRule')
  async deleteRule(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.allocationService.deleteRule(req.user.tenantId, id, req.user.userId);
  }

  @ApiOperation({ summary: 'List all allocation runs' })
  @Get('allocations/runs')
  @Permissions('finance.allocations.read')
  async getRuns(@Req() req: AuthenticatedRequest) {
    return this.allocationService.getRuns(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Execute an allocation run (generate draft journal)' })
  @Post('allocations/rules/:id/run')
  @Permissions('finance.allocations.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AllocationRun')
  async executeRun(
    @Req() req: AuthenticatedRequest,
    @Param('id') ruleId: string,
    @ZodBody(
      z.object({
        periodStart: z.string().min(1),
        periodEnd: z.string().min(1),
      }),
    )
    dto: any,
  ) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.allocationService.executeAllocationRun(req.user.tenantId, orgId, ruleId, dto, req.user.userId);
  }

  @ApiOperation({ summary: 'Approve and post allocation run journal entries' })
  @Post('allocations/runs/:id/post')
  @Permissions('finance.allocations.run')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AllocationRun')
  async postRun(@Req() req: AuthenticatedRequest, @Param('id') runId: string) {
    return this.allocationService.postAllocationRun(req.user.tenantId, runId, req.user.userId);
  }
}