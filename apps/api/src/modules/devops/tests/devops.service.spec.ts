import { describe, it, expect, beforeEach } from 'vitest';
import { DevopsService } from '../devops.service';

describe('DevopsService', () => {
  let service: DevopsService;

  beforeEach(() => {
    service = new DevopsService();
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

  it('should return integration links', async () => {
    const links = await service.getIntegrationLinks();
    expect(links).toBeDefined();
    expect(links.prometheus).toContain('localhost');
    expect(links.grafana).toContain('localhost');
    expect(links.jaeger).toContain('localhost');
    expect(links.sentry).toContain('sentry.io');
  });
});
