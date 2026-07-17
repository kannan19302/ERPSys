import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DevopsService } from '../devops.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ count: 5 }]),
    setting: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('DevopsService', () => {
  let service: DevopsService;

  beforeEach(() => {
    service = new DevopsService();
    vi.clearAllMocks();
  });

  it('should return system metrics', async () => {
    const metrics = await service.getSystemMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(metrics.memory).toBeDefined();
    expect(metrics.memory.rss).toBeGreaterThan(0);
    expect(metrics.memory.heapTotal).toBeGreaterThan(0);
    expect(metrics.memory.heapUsed).toBeGreaterThan(0);
    expect(typeof metrics.dbConnections).toBe('number');
    expect(typeof metrics.latencyMs).toBe('number');
  });

  it('should return recent errors', async () => {
    const errors = await service.getRecentErrors('t1');
    expect(errors).toEqual([]);
  });

  it('should return integration links', async () => {
    const links = await service.getIntegrationLinks();
    expect(links).toBeDefined();
    expect(links.prometheus).toContain('localhost');
    expect(links.grafana).toContain('localhost');
    expect(links.jaeger).toContain('localhost');
    expect(links.sentry).toContain('sentry.io');
  });
});
