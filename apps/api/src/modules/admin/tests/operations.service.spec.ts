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
    },
  };
});

describe('OperationsService', () => {
  let operationsService: OperationsService;

  beforeEach(() => {
    operationsService = new OperationsService();
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
    const result = await operationsService.getBackgroundJobs();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBeDefined();
  });

  it('should trigger failed job retry', async () => {
    const result = await operationsService.retryJobs();
    expect(result.success).toBe(true);
  });

  it('should list scheduled cron tasks', async () => {
    const result = await operationsService.getScheduledTasks();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should trigger a specific task', async () => {
    const result = await operationsService.triggerTask('cron-1');
    expect(result.success).toBe(true);
  });

  it('should return system log lines', async () => {
    const result = await operationsService.getErrorLogs();
    expect(result.length).toBeGreaterThan(0);
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
});
