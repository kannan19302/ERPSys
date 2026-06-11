import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdvancedFinanceService } from '../advanced-finance.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      exchangeRate: {
        findMany: vi.fn(),
      },
      account: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      journal: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      journalEntry: {
        create: vi.fn(),
      },
      budget: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      bankReconciliation: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb(require('@unerp/database').prisma)),
    },
  };
});

describe('AdvancedFinanceService', () => {
  let service: AdvancedFinanceService;

  beforeEach(() => {
    service = new AdvancedFinanceService();
    vi.clearAllMocks();
  });

  it('should get accounts', async () => {
    const { prisma } = await import('@unerp/database');
    const mockAccounts = [{ id: 'acc-1', code: '1000', name: 'Cash', balance: 500 }];
    vi.mocked(prisma.account.findMany).mockResolvedValue(mockAccounts as any);

    const res = await service.getAccounts('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.code).toBe('1000');
  });

  it('should get budgets', async () => {
    const { prisma } = await import('@unerp/database');
    const mockBudgets = [{ id: 'bud-1', amount: 5000 }];
    vi.mocked(prisma.budget.findMany).mockResolvedValue(mockBudgets as any);

    const res = await service.getBudgets('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.amount).toBe(5000);
  });
});
