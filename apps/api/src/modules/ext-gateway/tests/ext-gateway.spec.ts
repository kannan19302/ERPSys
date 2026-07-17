import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signTenantToken, verifyTenantToken } from '@unerp/service-kit';
import { validateManifest } from '../../marketplace/manifest';
import { ExtProxyService } from '../ext-proxy.service';
import { CircuitBreakerService } from '../circuit-breaker.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    installedApp: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@unerp/database';
import { ServiceRegistryService } from '../service-registry.service';

const SECRET = 'test-secret';

describe('tenant-context token', () => {
  it('signs and verifies a round trip', () => {
    const token = signTenantToken(
      { tenantId: 't1', userId: 'u1', roles: ['admin'], appSlug: 'field-service', scopes: ['tickets:rw'] },
      SECRET,
    );
    const claims = verifyTenantToken(token, SECRET, { expectedAppSlug: 'field-service' });
    expect(claims.tenantId).toBe('t1');
    expect(claims.scopes).toEqual(['tickets:rw']);
  });

  it('rejects a tampered token', () => {
    const token = signTenantToken({ tenantId: 't1', userId: 'u1', roles: [], appSlug: 'a', scopes: [] }, SECRET);
    expect(() => verifyTenantToken(token + 'x', SECRET)).toThrow();
    expect(() => verifyTenantToken(token, 'other-secret')).toThrow();
  });

  it('rejects a token for a different app', () => {
    const token = signTenantToken({ tenantId: 't1', userId: 'u1', roles: [], appSlug: 'education', scopes: [] }, SECRET);
    expect(() => verifyTenantToken(token, SECRET, { expectedAppSlug: 'healthcare' })).toThrow(/issued for app/);
  });
});

describe('manifest service section', () => {
  const base = {
    name: 'Field Service', slug: 'field-service', version: '1.0.0',
    category: 'Operations', vendor: 'unierp',
    pages: [{ slug: 'home', title: 'Home', type: 'custom' }],
  };

  it('accepts declarative+service with a valid service section', () => {
    const m = validateManifest({
      ...base,
      runtime: 'declarative+service',
      apiVersion: 1,
      service: { healthcheck: '/svc/health', defaultBaseUrl: 'http://localhost:4103' },
    });
    expect(m.runtime).toBe('declarative+service');
    expect(m.service?.healthcheck).toBe('/svc/health');
  });

  it('allows zero pages for service-backed bundles only', () => {
    expect(() => validateManifest({ ...base, pages: [] })).toThrow(/at least one page/);
    const m = validateManifest({
      ...base, pages: [], runtime: 'declarative+service',
      service: { healthcheck: '/svc/health' },
    });
    expect(m.pages).toEqual([]);
  });

  it('rejects a service section without declarative+service runtime', () => {
    expect(() => validateManifest({ ...base, service: { healthcheck: '/svc/health' } })).toThrow(/runtime/);
  });

  it('rejects missing/relative healthcheck and future apiVersion', () => {
    expect(() => validateManifest({ ...base, runtime: 'declarative+service', service: {} })).toThrow(/healthcheck/);
    expect(() => validateManifest({ ...base, apiVersion: 99 })).toThrow(/apiVersion/);
    expect(() => validateManifest({ ...base, apiVersion: 0 })).toThrow(/apiVersion/);
    expect(() => validateManifest({ ...base, apiVersion: 1.5 })).toThrow(/apiVersion/);
  });

  it('normalizes omitted apiVersion to the current supported contract', () => {
    const manifest = validateManifest(base);
    expect(manifest.apiVersion).toBe(1);
  });
});

describe('ServiceRegistryService gating', () => {
  let registry: ServiceRegistryService;

  beforeEach(() => {
    registry = new ServiceRegistryService();
    vi.clearAllMocks();
  });
  afterEach(() => {
    delete process.env.FIELD_SERVICE_SERVICE_URL;
  });

  it('404s when the app is not installed', async () => {
    (prisma.installedApp.findFirst as any).mockResolvedValue(null);
    await expect(registry.resolve('t1', 'field-service')).rejects.toThrow(/not installed/);
  });

  it('resolves an installed service app and caches it', async () => {
    (prisma.installedApp.findFirst as any).mockResolvedValue({
      appSlug: 'field-service',
      serviceConfig: { healthcheck: '/svc/health', defaultBaseUrl: 'http://svc:4103/', timeoutMs: 5000 },
    });
    const r = await registry.resolve('t1', 'field-service');
    expect(r.baseUrl).toBe('http://svc:4103');
    expect(r.timeoutMs).toBe(5000);
    await registry.resolve('t1', 'field-service');
    expect(prisma.installedApp.findFirst).toHaveBeenCalledTimes(1); // cache hit
  });

  it('prefers env override for the base URL', async () => {
    process.env.FIELD_SERVICE_SERVICE_URL = 'http://localhost:9999';
    (prisma.installedApp.findFirst as any).mockResolvedValue({
      appSlug: 'field-service',
      serviceConfig: { healthcheck: '/svc/health', defaultBaseUrl: 'http://svc:4103' },
    });
    const r = await registry.resolve('t1', 'field-service');
    expect(r.baseUrl).toBe('http://localhost:9999');
  });

  it('404s immediately after invalidate when the app was uninstalled', async () => {
    (prisma.installedApp.findFirst as any).mockResolvedValue({
      appSlug: 'field-service',
      serviceConfig: { healthcheck: '/svc/health', defaultBaseUrl: 'http://svc:4103' },
    });
    await registry.resolve('t1', 'field-service');
    registry.invalidate('t1', 'field-service');
    (prisma.installedApp.findFirst as any).mockResolvedValue(null); // uninstalled
    await expect(registry.resolve('t1', 'field-service')).rejects.toThrow(/not installed/);
  });
});

describe('ExtProxyService', () => {
  it('maps connection failure to a 503 envelope', async () => {
    const proxy = new ExtProxyService(new CircuitBreakerService());
    const req: any = {
      method: 'GET', path: '/api/v1/ext/field-service/tickets',
      originalUrl: '/api/v1/ext/field-service/tickets', headers: {},
    };
    const res: any = { status: vi.fn(), setHeader: vi.fn(), send: vi.fn() };
    await expect(
      proxy.forward({
        req, res,
        service: { appSlug: 'field-service', baseUrl: 'http://127.0.0.1:1', scopes: [], timeoutMs: 2000, healthcheck: '/svc/health' },
        path: '/tickets', tenantToken: 'tok',
      }),
    ).rejects.toMatchObject({ response: expect.objectContaining({ statusCode: 503, app: 'field-service' }) });
  });
});
