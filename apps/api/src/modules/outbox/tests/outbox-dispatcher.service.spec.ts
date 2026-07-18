import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OutboxDispatcherService } from '../outbox-dispatcher.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => vi.fn(),
}));

describe('OutboxDispatcherService', () => {
  let service: OutboxDispatcherService;
  let mockQueue: { addBulk: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueue = { addBulk: vi.fn().mockResolvedValue(undefined) };
    service = new OutboxDispatcherService(mockQueue as never);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should claim and enqueue deliveries', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([
      { id: 'del-1', tenant_id: 't-1', outbox_event_id: 'evt-1', destination: 'inventory' },
      { id: 'del-2', tenant_id: 't-1', outbox_event_id: 'evt-2', destination: 'finance' },
    ]);

    await service.poll();

    expect(prisma.$queryRawUnsafe).toHaveBeenCalledOnce();
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE SKIP LOCKED'),
      expect.any(String),
      expect.any(Date),
      100,
    );
    expect(mockQueue.addBulk).toHaveBeenCalledOnce();
    expect(mockQueue.addBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'del-1',
          data: expect.objectContaining({ deliveryId: 'del-1' }),
          opts: expect.objectContaining({ jobId: 'del-1' }),
        }),
        expect.objectContaining({
          name: 'del-2',
          data: expect.objectContaining({ deliveryId: 'del-2' }),
          opts: expect.objectContaining({ jobId: 'del-2' }),
        }),
      ]),
    );
  });

  it('should not enqueue when no deliveries claimed', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);

    await service.poll();

    expect(mockQueue.addBulk).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('DB error'));

    await expect(service.poll()).resolves.not.toThrow();
  });
});
