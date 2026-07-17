import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PosService } from '../pos.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      pOSTerminal: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      pOSRegister: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      pOSShift: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      cashEntry: {
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

describe('PosService', () => {
  let posService: PosService;

  beforeEach(() => {
    posService = new PosService();
    vi.clearAllMocks();
  });

  it('should fetch terminals', async () => {
    const { prisma } = await import('@unerp/database');
    const mockTerminals = [{ id: 't-1', name: 'Main Terminal', code: 'TERM-01' }];
    vi.mocked(prisma.pOSTerminal.findMany).mockResolvedValue(mockTerminals as never);

    const res = await posService.getTerminals('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Main Terminal');
  });

  it('should fetch register sessions', async () => {
    const { prisma } = await import('@unerp/database');
    const mockRegisters = [{ id: 'reg-1', status: 'OPEN', startingCash: 250 }];
    vi.mocked(prisma.pOSRegister.findMany).mockResolvedValue(mockRegisters as never);

    const res = await posService.getRegisters('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.startingCash).toBe(250);
  });
});
