import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedFinanceService } from '../advanced-finance.service';
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
} from '../services';

vi.mock('@prisma/client', () => ({
  Prisma: {
    Decimal: class Decimal {
      constructor(value: unknown) {
        return Number(value);
      }
    },
  },
}));

vi.mock('@unerp/database', () => ({
  prisma: {
    organization: { findMany: vi.fn(), findFirst: vi.fn() },
    account: { findMany: vi.fn() },
    journal: { findMany: vi.fn() },
    journalEntry: { findMany: vi.fn() },
    interCompanyTransfer: { findMany: vi.fn() },
    consolidationRun: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';

function account(overrides: Partial<{ id: string; orgId: string; type: string; balance: number; code: string }>) {
  return { id: 'acc-1', orgId: 'org-1', type: 'ASSET', balance: 0, code: '1000', ...overrides };
}

describe('AdvancedFinanceService — consolidation', () => {
  let service: AdvancedFinanceService;

  beforeEach(() => {
    Object.keys(prisma).forEach((key) => {
      const model = (prisma as any)[key];
      if (model && typeof model === 'object') {
        Object.keys(model).forEach((m) => {
          if (typeof model[m] === 'function' && vi.isMockFunction(model[m])) {
            vi.mocked(model[m]).mockReset();
            // Restore default mocked values
            if (m === 'findMany') vi.mocked(model[m]).mockResolvedValue([]);
            if (m === 'findFirst') vi.mocked(model[m]).mockResolvedValue(null);
            if (m === 'create') vi.mocked(model[m]).mockResolvedValue({ id: 'new-id' });
            if (m === 'update') vi.mocked(model[m]).mockResolvedValue({ id: 'updated-id' });
            if (m === 'findUnique') vi.mocked(model[m]).mockResolvedValue(null);
            if (m === 'count') vi.mocked(model[m]).mockResolvedValue(0);
          }
        });
      }
    });

    const glService = new GlAccountingService();
    const budgetingService = new BudgetingService(glService);
    const bankingService = new BankingService(glService);
    const expenseService = new ExpenseManagementService(glService);
    const revenueService = new RevenueRecognitionService(glService);
    const taxService = new TaxEngineService(glService);
    const treasuryService = new TreasuryService(glService);
    const consolidationService = new ConsolidationService();
    const reportingService = new FinancialReportingService(glService);
    const periodService = new PeriodManagementService(glService);

    service = new AdvancedFinanceService(
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
    );
  });

  describe('getConsolidation', () => {
    it('aggregates revenue/expenses/assets per entity and nets out eliminations from the consolidated totals', async () => {
      (prisma.organization.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'org-1', name: 'Parent Co', currency: 'USD', createdAt: new Date() },
        { id: 'org-2', name: 'Subsidiary Co', currency: 'EUR', createdAt: new Date() },
      ]);

      // getProfitAndLoss / getBalanceSheet both read prisma.account.findMany
      // filtered by orgId + type — mirror real Prisma's where-filtering so the
      // service's own type-based branching (revenueAccounts/expenseAccounts/
      // assetAccounts) behaves exactly as it would against a real database.
      (prisma.account.findMany as ReturnType<typeof vi.fn>).mockImplementation(({ where }: { where: { orgId: string; type?: string } }) => {
        const all = [
          account({ id: `${where.orgId}-rev`, orgId: where.orgId, type: 'REVENUE', balance: 1000, code: '4000' }),
          account({ id: `${where.orgId}-exp`, orgId: where.orgId, type: 'EXPENSE', balance: 400, code: '5000' }),
          account({ id: `${where.orgId}-asset`, orgId: where.orgId, type: 'ASSET', balance: 5000, code: '1000' }),
        ];
        return Promise.resolve(where.type ? all.filter((a) => a.type === where.type) : all);
      });
      // journalEntry.findMany is filtered by accountId — return one posted
      // entry per account matching its balance, mirroring the account fixture.
      (prisma.journalEntry.findMany as ReturnType<typeof vi.fn>).mockImplementation(({ where }: { where: { accountId: { in: string[] } } }) => {
        return Promise.resolve(
          where.accountId.in.map((accountId: string) => {
            if (accountId.endsWith('-rev')) return { accountId, credit: 1000, debit: 0 };
            if (accountId.endsWith('-exp')) return { accountId, credit: 0, debit: 400 };
            return { accountId, credit: 0, debit: 0 };
          }),
        );
      });
      (prisma.interCompanyTransfer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'xfer-1', fromOrgId: 'org-1', toOrgId: 'org-2', amount: 200, currency: 'USD', date: new Date(), status: 'APPROVED' },
      ]);

      const result = await service.getConsolidation(TENANT);

      expect(result.entities).toHaveLength(2);
      expect(result.entities[0]).toMatchObject({ id: 'org-1', name: 'Parent Co', revenue: 1000, expenses: 400, assets: 5000 });

      // Gross revenue/expenses/assets across both orgs = 2000/800/10000.
      // Elimination total = 200, netted from revenue/expenses/assets (but not net income).
      expect(result.eliminations.total).toBe(200);
      expect(result.consolidated.revenue).toBe(1800);
      expect(result.consolidated.expenses).toBe(600);
      expect(result.consolidated.assets).toBe(9800);
      expect(result.consolidated.netIncome).toBe(2000 - 800);
      expect(result.consolidated.entityCount).toBe(2);
    });

    it('only nets eliminations between organizations that actually belong to the tenant', async () => {
      (prisma.organization.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'org-1', name: 'Only Org', currency: 'USD', createdAt: new Date() },
      ]);
      (prisma.account.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.journalEntry.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.interCompanyTransfer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.getConsolidation(TENANT);

      // The eliminations query must scope both fromOrgId and toOrgId to this
      // tenant's own organizations — never an unbounded cross-tenant lookup.
      const call = (prisma.interCompanyTransfer.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.tenantId).toBe(TENANT);
      expect(call.where.fromOrgId.in).toEqual(['org-1']);
      expect(call.where.toOrgId.in).toEqual(['org-1']);
    });
  });

  describe('runConsolidation', () => {
    it('persists real revenue and expense totals, not the hardcoded zero from the original bug', async () => {
      (prisma.organization.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'org-1' }]);
      (prisma.account.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        account({ type: 'ASSET', balance: 5000 }),
        account({ type: 'LIABILITY', balance: 1000 }),
        account({ type: 'EQUITY', balance: 4000 }),
        account({ type: 'REVENUE', balance: 2000 }),
        account({ type: 'EXPENSE', balance: 700 }),
      ]);
      (prisma.interCompanyTransfer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.consolidationRun.create as ReturnType<typeof vi.fn>).mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'run-1', ...data }),
      );

      const result = await service.runConsolidation(TENANT, '2026-01-01', '2026-12-31');

      expect(result.consolidatedRevenue).toBe(2000);
      expect(result.consolidatedExpenses).toBe(700);
      expect(result.consolidatedNetIncome).toBe(1300);
    });
  });

  describe('getConsolidationRuns', () => {
    it('scopes run history to the tenant', async () => {
      (prisma.consolidationRun.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      await service.getConsolidationRuns(TENANT);
      expect(prisma.consolidationRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT } }),
      );
    });
  });
});
