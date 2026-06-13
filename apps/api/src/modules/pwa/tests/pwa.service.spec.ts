import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PwaService } from '../pwa.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    offlineSyncQueue: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('PwaService', () => {
  let service: PwaService;

  beforeEach(() => {
    service = new PwaService();
    vi.clearAllMocks();
  });

  it('should list sync queue for a tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.offlineSyncQueue.findMany).mockResolvedValue([
      { id: 'sync-1', tenantId: 't1', clientId: 'device-1', operation: 'CREATE', entityType: 'ServiceTicket', status: 'PENDING' },
    ] as never);

    const queue = await service.getSyncQueue('t1');
    expect(queue).toHaveLength(1);
    expect(queue[0]?.status).toBe('PENDING');
  });

  it('should push offline operations', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.offlineSyncQueue.create).mockImplementation((args: unknown) =>
      Promise.resolve({ id: 'sync-new', ...(args as Record<string, unknown>).data as Record<string, unknown> }) as never,
    );

    const records = await service.pushOfflineOperations('t1', 'device-1', [
      { operation: 'CREATE', entityType: 'StockEntry', payload: { qty: 10 } },
    ]);
    expect(records).toHaveLength(1);
  });

  it('should reconcile an operation', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.offlineSyncQueue.findFirst).mockResolvedValue({ id: 'sync-1', tenantId: 't1', status: 'PENDING' } as never);
    vi.mocked(prisma.offlineSyncQueue.update).mockResolvedValue({ id: 'sync-1', status: 'RECONCILED', reconciledAt: new Date() } as never);

    const result = await service.reconcileOperation('t1', 'sync-1', 'RECONCILED');
    expect(result.status).toBe('RECONCILED');
  });
});
