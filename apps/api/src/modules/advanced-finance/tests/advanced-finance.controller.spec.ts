import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedFinanceController } from '../advanced-finance.controller';

describe('AdvancedFinanceController', () => {
  let controller: AdvancedFinanceController;
  let service: unknown;

  beforeEach(() => {
    const mocks: unknown = {};
    service = new Proxy({}, {
      get: (_target, prop: string) => {
        if (!(mocks as Record<string, unknown>)[prop]) {
          (mocks as Record<string, unknown>)[prop] = vi.fn().mockResolvedValue({});
        }
        return (mocks as Record<string, unknown>)[prop];
      }
    });
    
    controller = new AdvancedFinanceController(service as never);
  });

  const mockReq = { user: { tenantId: 'tenant-1', orgId: 'org-1', userId: 'user-1' } } as unknown as Record<string, import("vitest").Mock>;

  const getEndpoints = [
    'getExchangeRates',
    'getAccounts',
    'getCostCenters',
    'getJournals',
    'getBudgets',
    'getBankReconciliations',
    'getFinancialPeriods',
    'getFixedAssets',
    'getBankAccounts',
    'getCreditNotes',
    'getDebitNotes',
    'getDunningLevels',
    'getDunningRuns',
    'getPaymentSchedules',
    'getPaymentRuns',
    'getForecastScenarios',
    'getTaxRules',
    'getWithholdingTaxes',
    'getTaxFilings',
    'getInvestmentPortfolios',
    'getTreasuryTransactions',
    'getInterCompanyTransfers',
  ];

  getEndpoints.forEach((method) => {
    it(`should call service.${method} successfully`, async () => {
      await (controller as unknown as Record<string, Function>)[method]!(mockReq);
      expect((service as unknown as Record<string, import("vitest").Mock>)[method]).toHaveBeenCalledWith('tenant-1');
    });
  });

  it('should call getProfitAndLoss', async () => {
    await controller.getProfitAndLoss(mockReq as never, "start", "end");
    expect((service as unknown as Record<string, Function>).getProfitAndLoss).toHaveBeenCalledWith('tenant-1', 'org-1', 'start', 'end');
  });

  it('should call getBalanceSheet', async () => {
    await controller.getBalanceSheet(mockReq as never, "date");
    expect((service as unknown as Record<string, Function>).getBalanceSheet).toHaveBeenCalledWith('tenant-1', 'org-1', 'date');
  });

  it('should call getCashFlow', async () => {
    await controller.getCashFlow(mockReq as never, "start", "end");
    expect((service as unknown as Record<string, Function>).getCashFlow).toHaveBeenCalledWith('tenant-1', 'org-1', 'start', 'end');
  });

  const postEndpoints = [
    { method: 'createAccount', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createCostCenter', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createJournal', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createBudget', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createBankReconciliation', args: [mockReq, {}], expectedArgs: ['tenant-1', {}] },
    { method: 'createFinancialPeriod', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'updateFinancialPeriodStatus', args: [mockReq, 'id-1', { status: 'OPEN' }], expectedArgs: ['tenant-1', 'id-1', 'OPEN'] },
    { method: 'createFixedAsset', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createBankAccount', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createCreditNote', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createDebitNote', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createDunningLevel', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createPaymentSchedule', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createPaymentRun', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createForecastScenario', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createTaxRule', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createWithholdingTax', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createTaxFiling', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createInvestmentPortfolio', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
    { method: 'createTreasuryTransaction', args: [mockReq, {}], expectedArgs: ['tenant-1', 'org-1', {}] },
  ];

  postEndpoints.forEach(({ method, args, expectedArgs }) => {
    it(`should call service.${method} successfully`, async () => {
      await (controller as unknown as Record<string, Function>)[method]!(...args);
      expect((service as unknown as Record<string, import("vitest").Mock>)[method]).toHaveBeenCalledWith(...expectedArgs);
    });
  });

});
