import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OperationsService } from '../operations.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      $executeRawUnsafe: vi.fn(),
      $queryRaw: vi.fn(),
      setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      backgroundJob: {
        groupBy: vi.fn(() => Promise.resolve([{ queueName: 'default', status: 'COMPLETED', _count: 5 }])),
        updateMany: vi.fn(() => Promise.resolve({ count: 1 })),
        create: vi.fn(() => Promise.resolve({})),
        findMany: vi.fn(() => Promise.resolve([])),
        findFirst: vi.fn(() => Promise.resolve(null)),
        update: vi.fn(() => Promise.resolve({})),
      },
      scheduledTask: {
        findMany: vi.fn(() => Promise.resolve([{ id: 'cron-1', name: 'Backup Task' }])),
        findFirst: vi.fn(() => Promise.resolve({ id: 'cron-1', name: 'Backup Task' })),
        update: vi.fn(() => Promise.resolve({})),
      },
      errorLog: {
        findMany: vi.fn(() => Promise.resolve([{ id: 'log-1', message: 'Test error', level: 'ERROR', source: 'Test', createdAt: new Date() }])),
        count: vi.fn(() => Promise.resolve(1)),
      },
    },
  };
});

describe('OperationsService', () => {
  let operationsService: OperationsService;
  let fakeEmailQueue: { add: ReturnType<typeof vi.fn>; name: string };
  let fakeExportQueue: { add: ReturnType<typeof vi.fn>; name: string };

  beforeEach(() => {
    fakeEmailQueue = { add: vi.fn().mockResolvedValue({ id: 'bull-email-1' }), name: 'email' };
    fakeExportQueue = { add: vi.fn().mockResolvedValue({ id: 'bull-export-1' }), name: 'export' };
    operationsService = new OperationsService(fakeEmailQueue as any, fakeExportQueue as any);
    vi.clearAllMocks();
  });

  it('should return system health metrics', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(1);

    const result = await operationsService.getSystemHealth();
    expect(result.status).toBe('OK');
    expect(result.metrics.cpuUsage).toBeDefined();
    expect(result.metrics.memoryUsage).toBeDefined();
  });

  it('should list background jobs', async () => {
    const result = await operationsService.getBackgroundJobs('tenant-123');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBeDefined();
  });

  it('should trigger failed job retry (no failed jobs)', async () => {
    const result = await operationsService.retryJobs('tenant-123');
    expect(result.success).toBe(true);
    expect(result.retriedCount).toBe(0);
  });

  it('should re-enqueue a failed job into the real BullMQ queue by queueName, not just flip a DB flag', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.backgroundJob.findMany).mockResolvedValue([
      {
        id: 'job-1',
        tenantId: 'tenant-123',
        queueName: 'email',
        jobType: 'send-invoice-email',
        payload: { to: 'a@b.com' },
        priority: 5,
        status: 'FAILED',
      } as any,
    ]);

    const result = await operationsService.retryJobs('tenant-123');

    expect(fakeEmailQueue.add).toHaveBeenCalledWith('send-invoice-email', { to: 'a@b.com' }, { priority: 5 });
    expect(prisma.backgroundJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'PENDING', bullJobId: 'bull-email-1' }),
      }),
    );
    expect(result.retriedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it('skips (does not fake-retry) a failed job whose queueName has no live Queue instance', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.backgroundJob.findMany).mockResolvedValue([
      {
        id: 'job-2',
        tenantId: 'tenant-123',
        queueName: 'scheduled-legacy-handler',
        jobType: 'legacy',
        payload: {},
        priority: 0,
        status: 'FAILED',
      } as any,
    ]);

    const result = await operationsService.retryJobs('tenant-123');

    expect(result.retriedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(prisma.backgroundJob.update).not.toHaveBeenCalled();
  });

  it('should list scheduled cron tasks', async () => {
    const result = await operationsService.getScheduledTasks('tenant-123');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should trigger a specific task', async () => {
    const result = await operationsService.triggerTask('tenant-123', 'cron-1');
    expect(result.success).toBe(true);
  });

  it('should return system log lines', async () => {
    const result = await operationsService.getErrorLogs('tenant-123');
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should return database schema table arrays', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ table_name: 'users' }] as any);

    const result = await operationsService.getDbSchema();
    expect(result[0].tableName).toBe('users');
  });

  it('should create a backup setting entry', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.setting.upsert).mockResolvedValue({} as any);

    const result = await operationsService.createBackup('tenant-123', 'admin');
    expect(result.filename).toBeDefined();
    expect(prisma.setting.upsert).toHaveBeenCalled();
  });

  it('flags created backups as source: SIMULATED (no real pg_dump backs this pass — P1-1)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.setting.upsert).mockResolvedValue({} as any);

    const result = await operationsService.createBackup('tenant-123', 'admin');
    expect(result.source).toBe('SIMULATED');
  });

  it('flags backups returned from getBackups as source: SIMULATED, including the seeded fallback rows', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);

    const result = await operationsService.getBackups('tenant-123') as any[];
    expect(result.length).toBeGreaterThan(0);
    for (const backup of result) {
      expect(backup.source).toBe('SIMULATED');
    }
  });

  it('backfills source: SIMULATED onto pre-existing persisted backup records that predate the field', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue({
      value: [{ id: 'old-bak', filename: 'old.sql', sizeBytes: 100, createdBy: 'x', createdAt: 'now' }],
    } as any);

    const result = await operationsService.getBackups('tenant-123') as any[];
    expect(result[0].source).toBe('SIMULATED');
  });
});
