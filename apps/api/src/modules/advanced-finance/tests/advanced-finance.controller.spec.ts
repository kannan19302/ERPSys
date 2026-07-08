import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedFinanceController } from '../advanced-finance.controller';

function createMockService() {
  const mocks: Record<string, any> = {};
  return new Proxy({}, {
    get: (_target, prop: string) => {
      if (!mocks[prop]) {
        mocks[prop] = vi.fn().mockResolvedValue({});
      }
      return mocks[prop];
    }
  });
}

describe('AdvancedFinanceController', () => {
  let controller: AdvancedFinanceController;
  let glService: any;
  let budgetingService: any;
  let bankingService: any;
  let expenseService: any;
  let revenueService: any;
  let taxService: any;
  let treasuryService: any;
  let consolidationService: any;
  let reportingService: any;
  let periodService: any;
  let paymentTermsService: any;
  let bankFeedsService: any;
  let cashFlowForecastService: any;

  let serviceMap: Record<string, any>;

  beforeEach(() => {
    glService = createMockService();
    budgetingService = createMockService();
    bankingService = createMockService();
    expenseService = createMockService();
    revenueService = createMockService();
    taxService = createMockService();
    treasuryService = createMockService();
    consolidationService = createMockService();
    reportingService = createMockService();
    periodService = createMockService();
    paymentTermsService = createMockService();
    bankFeedsService = createMockService();
    cashFlowForecastService = createMockService();

    serviceMap = {
      glService,
      budgetingService,
      bankingService,
      expenseService,
      revenueService,
      taxService,
      treasuryService,
      consolidationService,
      reportingService,
      periodService,
      paymentTermsService,
      bankFeedsService,
      cashFlowForecastService,
    };

    controller = new AdvancedFinanceController(
      glService,
      budgetingService,
      bankingService,
      expenseService,
      revenueService,
      taxService,
      treasuryService,
      consolidationService,
      reportingService,
      periodService,
      paymentTermsService,
      bankFeedsService,
      cashFlowForecastService,
    );
  });

  const mockReq = { user: { tenantId: 'tenant-1', orgId: 'org-1', userId: 'user-1' } } as unknown as any;

  const getEndpoints = [
    { method: 'getExchangeRates', serviceName: 'treasuryService' },
    { method: 'getAccounts', serviceName: 'glService' },
    { method: 'getCostCenters', serviceName: 'glService' },
    { method: 'getJournals', serviceName: 'glService' },
    { method: 'getBudgets', serviceName: 'budgetingService' },
    { method: 'getBankReconciliations', serviceName: 'bankingService' },
    { method: 'getFinancialPeriods', serviceName: 'periodService' },
    { method: 'getBankAccounts', serviceName: 'bankingService' },
    { method: 'getCreditNotes', serviceName: 'taxService' },
    { method: 'getDebitNotes', serviceName: 'taxService' },
    { method: 'getDunningLevels', serviceName: 'taxService' },
    { method: 'getDunningRuns', serviceName: 'taxService' },
    { method: 'getPaymentSchedules', serviceName: 'treasuryService' },
    { method: 'getPaymentRuns', serviceName: 'treasuryService' },
    { method: 'getForecastScenarios', serviceName: 'treasuryService' },
    { method: 'getTaxRules', serviceName: 'taxService' },
    { method: 'getWithholdingTaxes', serviceName: 'taxService' },
    { method: 'getTaxFilings', serviceName: 'taxService' },
    { method: 'getInvestmentPortfolios', serviceName: 'treasuryService' },
    { method: 'getTreasuryTransactions', serviceName: 'treasuryService' },
    { method: 'getInterCompanyTransfers', serviceName: 'treasuryService' },
    { method: 'getPaymentTerms', serviceName: 'paymentTermsService' },
    { method: 'exportForecastCsv', serviceName: 'cashFlowForecastService' },
  ];

  getEndpoints.forEach(({ method, serviceName }) => {
    it(`should call ${serviceName}.${method} successfully`, async () => {
      const targetService = serviceMap[serviceName];
      await (controller as any)[method]!(mockReq);
       expect(targetService[method].mock.calls[0][0]).toBe('tenant-1');
    });
  });

  it('should call getProfitAndLoss', async () => {
    await controller.getProfitAndLoss(mockReq, "start", "end");
    expect(reportingService.getProfitAndLoss).toHaveBeenCalledWith('tenant-1', 'org-1', 'start', 'end');
  });

  it('should call getBalanceSheet', async () => {
    await controller.getBalanceSheet(mockReq, "date");
    expect(reportingService.getBalanceSheet).toHaveBeenCalledWith('tenant-1', 'org-1', 'date');
  });

  it('should call getCashFlow', async () => {
    await controller.getCashFlow(mockReq, "start", "end");
    expect(reportingService.getCashFlowStatement).toHaveBeenCalledWith('tenant-1', 'org-1', 'start', 'end');
  });

  it('should call getCashFlowProjections via cashFlowForecastService.get13WeekForecast', async () => {
    await controller.getCashFlowProjections(mockReq, 'scen-1');
    expect(cashFlowForecastService.get13WeekForecast).toHaveBeenCalledWith('tenant-1', 'scen-1');
  });

  it('should call getCashFlowScenarios via cashFlowForecastService.getScenarios', async () => {
    await controller.getCashFlowScenarios(mockReq);
    expect(cashFlowForecastService.getScenarios).toHaveBeenCalledWith('tenant-1');
  });

  it('should call getBankConnections via bankFeedsService.getConnections', async () => {
    await controller.getBankConnections(mockReq);
    expect(bankFeedsService.getConnections).toHaveBeenCalledWith('tenant-1');
  });

  it('should call createBankConnection via bankFeedsService.createConnection', async () => {
    const dto = { bankName: 'Chase', accountNumber: '123', accountType: 'SAVINGS', bankAccountId: 'ba-1' };
    await controller.createBankConnection(mockReq, dto);
    expect(bankFeedsService.createConnection).toHaveBeenCalledWith('tenant-1', 'org-1', dto);
  });

  it('should call saveForecastWeekOverride via cashFlowForecastService.saveForecastWeekOverride', async () => {
    const dto = { weekStart: '2026-07-08T00:00:00Z', adjustments: 1000, comments: 'test' };
    await controller.saveForecastWeekOverride(mockReq, dto);
    expect(cashFlowForecastService.saveForecastWeekOverride).toHaveBeenCalledWith('tenant-1', expect.any(Date), dto);
  });

  it('should call createCashFlowScenario via cashFlowForecastService.createScenario', async () => {
    const dto = { name: 'Optimistic' };
    await controller.createCashFlowScenario(mockReq, dto);
    expect(cashFlowForecastService.createScenario).toHaveBeenCalledWith('tenant-1', 'org-1', dto);
  });

  it('should call updateCashFlowScenario via cashFlowForecastService.updateScenario', async () => {
    const dto = { name: 'Optimistic v2' };
    await controller.updateCashFlowScenario(mockReq, 'scen-1', dto);
    expect(cashFlowForecastService.updateScenario).toHaveBeenCalledWith('tenant-1', 'scen-1', dto);
  });

  it('should call deleteCashFlowScenario via cashFlowForecastService.deleteScenario', async () => {
    await controller.deleteCashFlowScenario(mockReq, 'scen-1');
    expect(cashFlowForecastService.deleteScenario).toHaveBeenCalledWith('tenant-1', 'scen-1');
  });

  it('should call compareForecastScenarios via cashFlowForecastService.compareForecastScenarios', async () => {
    await controller.compareForecastScenarios(mockReq, 'scen-1');
    expect(cashFlowForecastService.compareForecastScenarios).toHaveBeenCalledWith('tenant-1', 'scen-1');
  });

  const postEndpoints = [
    { method: 'createAccount', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'glService' },
    { method: 'createCostCenter', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'glService' },
    { method: 'createJournal', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'glService' },
    { method: 'createBudget', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'budgetingService' },
    { method: 'createBankReconciliation', args: [mockReq, {}], expectedArgs: ['tenant-1', {}], serviceName: 'bankingService' },
    { method: 'createFinancialPeriod', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'periodService' },
    { method: 'createBankAccount', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'bankingService' },
    { method: 'createCreditNote', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createDebitNote', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createDunningLevel', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createPaymentSchedule', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'treasuryService' },
    { method: 'createPaymentRun', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'treasuryService' },
    { method: 'createForecastScenario', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'treasuryService' },
    { method: 'createTaxRule', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createWithholdingTax', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createTaxFiling', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'taxService' },
    { method: 'createInvestmentPortfolio', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'treasuryService' },
    { method: 'createTreasuryTransaction', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}], serviceName: 'treasuryService' },
    { method: 'createPaymentTerm', args: [mockReq, {}], expectedArgs: ['tenant-1', {}], serviceName: 'paymentTermsService' },
  ];

  postEndpoints.forEach(({ method, args, expectedArgs, serviceName }) => {
    it(`should call ${serviceName}.${method} successfully`, async () => {
      const targetService = serviceMap[serviceName];
      await (controller as any)[method]!(...args);
      expect(targetService[method]).toHaveBeenCalledWith(...expectedArgs);
    });
  });
});
