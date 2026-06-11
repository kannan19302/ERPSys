import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiPlatformService } from '../api-platform.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    webhookSubscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    webhookDeliveryLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('ApiPlatformService', () => {
  let service: ApiPlatformService;

  beforeEach(() => {
    service = new ApiPlatformService();
    vi.clearAllMocks();
  });

  it('should list API keys for a tenant', async () => {
    const { prisma } = await import('@unerp/database');
    const mockKeys = [
      { id: 'key-1', tenantId: 't1', name: 'Test Key', prefix: 'ue_live_', status: 'ACTIVE', rateLimit: 120 },
    ];
    vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockKeys as any);

    const keys = await service.getApiKeys('t1');
    expect(keys).toHaveLength(1);
    expect(keys[0]?.prefix).toBe('ue_live_');
  });

  it('should create an API key', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.apiKey.create).mockResolvedValue({ id: 'key-new', name: 'New Key', prefix: 'ue_live_', status: 'ACTIVE' } as any);

    const key = await service.createApiKey('t1', { name: 'New Key' });
    expect(key).toBeDefined();
    expect(key.status).toBe('ACTIVE');
  });

  it('should revoke an API key', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({ id: 'key-1', tenantId: 't1', status: 'ACTIVE' } as any);
    vi.mocked(prisma.apiKey.update).mockResolvedValue({ id: 'key-1', status: 'REVOKED' } as any);

    const revoked = await service.revokeApiKey('t1', 'key-1');
    expect(revoked.status).toBe('REVOKED');
  });

  it('should list webhook subscriptions', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.webhookSubscription.findMany).mockResolvedValue([
      { id: 'wh-1', tenantId: 't1', name: 'Invoice Hook', status: 'ACTIVE' },
    ] as any);

    const subs = await service.getWebhookSubscriptions('t1');
    expect(subs).toHaveLength(1);
  });

  it('should list webhook delivery logs', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.webhookDeliveryLog.findMany).mockResolvedValue([
      { id: 'log-1', event: 'invoice.paid', status: 'SUCCESS', responseStatus: 200 },
    ] as any);

    const logs = await service.getWebhookDeliveryLogs('t1');
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe('SUCCESS');
  });
});
