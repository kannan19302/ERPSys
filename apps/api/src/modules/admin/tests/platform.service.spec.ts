import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlatformService } from '../platform.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      tenant: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      emailTemplate: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        count: vi.fn(),
      },
      invoice: {
        count: vi.fn(),
      },
      product: {
        count: vi.fn(),
      },
    },
  };
});

describe('PlatformService', () => {
  let platformService: PlatformService;

  beforeEach(() => {
    platformService = new PlatformService();
    vi.clearAllMocks();
  });

  it('should list ERP modules and their active status', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      id: 'tenant-123',
      settings: { modules: ['finance', 'hr'] },
    } as any);

    const result = await platformService.getModules('tenant-123');
    expect(result.length).toBeGreaterThan(0);
    expect(result.find(m => m.name === 'finance')?.isActive).toBe(true);
    expect(result.find(m => m.name === 'pos')?.isActive).toBe(false);
  });

  it('should toggle module settings on tenant', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      id: 'tenant-123',
      settings: { modules: ['finance'] },
    } as any);
    vi.mocked(prisma.tenant.update).mockResolvedValue({} as any);

    const result = await platformService.toggleModule('tenant-123', 'hr', true);
    expect(result.isActive).toBe(true);
    expect(prisma.tenant.update).toHaveBeenCalled();
  });

  it('should load custom domains lists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);

    const result = await platformService.getCustomDomains('tenant-123');
    expect(result).toEqual([]);
  });

  it('should get SMTP parameters', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);

    const result = await platformService.getSmtpConfig('tenant-123');
    expect(result.host).toBeDefined();
  });

  it('should save SMTP parameters', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.setting.upsert).mockResolvedValue({} as any);

    const result = await platformService.saveSmtpConfig('tenant-123', { host: 'smtp.mail.com' });
    expect(result.host).toBe('smtp.mail.com');
  });

  it('should handle email template database CRUD operations', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.emailTemplate.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.emailTemplate.create).mockResolvedValue({ id: 'temp-1' } as any);

    const list = await platformService.getEmailTemplates('tenant-123');
    expect(list).toBeDefined();

    const created = await platformService.saveEmailTemplate('tenant-123', {
      name: 'Welcome Template',
      category: 'GENERAL',
      subject: 'Welcome',
      body: 'Welcome to UniERP',
    });
    expect(created).toBeDefined();
    expect(prisma.emailTemplate.create).toHaveBeenCalled();
  });
});
