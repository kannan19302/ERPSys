import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantLifecycleService } from '../tenant-lifecycle/tenant-lifecycle.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

vi.mock('@unerp/database', () => {
  const mockTx = {
    tenant: {
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    userSession: {
      deleteMany: vi.fn(),
    },
    tenantLifecycleEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    role: {
      findMany: vi.fn(),
    },
    organization: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  return {
    prisma: {
      tenant: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      organization: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      role: {
        findMany: vi.fn(),
      },
      userSession: {
        deleteMany: vi.fn(),
      },
      tenantLifecycleEvent: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
      _dmmf: {
        datamodel: {
          models: [
            { name: 'Tenant', fields: [{ name: 'id' }] },
            { name: 'User', fields: [{ name: 'tenantId' }] },
            { name: 'Organization', fields: [{ name: 'tenantId' }] },
            { name: 'Role', fields: [{ name: 'tenantId' }] },
            { name: 'UserSession', fields: [{ name: 'tenantId' }] },
          ],
        },
      },
    },
  };
});

describe('TenantLifecycleService', () => {
  let service: TenantLifecycleService;

  beforeEach(() => {
    service = new TenantLifecycleService();
    vi.clearAllMocks();
  });

  const mockTenant = {
    id: 'tenant-1',
    name: 'Test Corp',
    slug: 'test-corp',
    plan: 'enterprise',
    status: 'ACTIVE',
    settings: { theme: 'dark' },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-01'),
    demoDataLoaded: false,
    demoLoadedAt: null,
  };

  describe('getLifecycleStatus', () => {
    it('should return lifecycle status and history', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.tenantLifecycleEvent.findMany.mockResolvedValue([
        { id: 'evt-1', eventType: 'EXPORT', status: 'COMPLETED', createdAt: new Date() },
      ]);
      prisma.user.count.mockResolvedValue(5);
      prisma.organization.count.mockResolvedValue(1);

      const result = await service.getLifecycleStatus('tenant-1');

      expect(result.tenant.id).toBe('tenant-1');
      expect(result.tenant.status).toBe('ACTIVE');
      expect(result.stats.users).toBe(5);
      expect(result.recentEvents).toHaveLength(1);
    });

    it('should throw NotFoundException for nonexistent tenant', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getLifecycleStatus('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportTenant', () => {
    it('should generate correct export manifest with data counts', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);
      prisma.user.findMany.mockResolvedValue([
        { id: 'u-1', email: 'a@b.com', firstName: 'A', lastName: 'B', status: 'ACTIVE' },
      ]);
      prisma.organization.findMany.mockResolvedValue([{ id: 'org-1', name: 'Test Org', tenantId: 'tenant-1' }]);
      prisma.role.findMany.mockResolvedValue([]);

      const result = await service.exportTenant('tenant-1');

      expect(result.tenant.id).toBe('tenant-1');
      expect(result.data.users).toHaveLength(1);
      expect(result.data.organizations).toHaveLength(1);
      expect(result.exportedAt).toBeDefined();
    });

    it('should throw NotFoundException for nonexistent tenant', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.exportTenant('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspendTenant', () => {
    it('should set tenant status to SUSPENDED and revoke sessions', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.suspendTenant('tenant-1');

      expect(result.status).toBe('SUSPENDED');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if already suspended', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'SUSPENDED' });

      await expect(service.suspendTenant('tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if purged', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'PURGED' });

      await expect(service.suspendTenant('tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('unsuspendTenant', () => {
    it('should set tenant status back to ACTIVE', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'SUSPENDED' });

      const result = await service.unsuspendTenant('tenant-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw ConflictException if not suspended', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.unsuspendTenant('tenant-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('offboardTenant', () => {
    it('should mark tenant as OFFBOARDING with retention window', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.offboardTenant('tenant-1', 90);

      expect(result.status).toBe('OFFBOARDING');
      expect(result.retentionDays).toBe(90);
      expect(result.autoPurgeDate).toBeDefined();
    });

    it('should default to 90 day retention', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.offboardTenant('tenant-1');

      expect(result.retentionDays).toBe(90);
    });

    it('should throw if tenant is already offboarding', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'OFFBOARDING' });

      await expect(service.offboardTenant('tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should throw if tenant was purged', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'PURGED' });

      await expect(service.offboardTenant('tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOffboarding', () => {
    it('should restore tenant to ACTIVE', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'OFFBOARDING' });

      const result = await service.cancelOffboarding('tenant-1');

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw if tenant is not offboarding', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.cancelOffboarding('tenant-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('purgeTenant', () => {
    it('should delete all tenant data and the tenant record', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.purgeTenant('tenant-1');

      expect(result.message).toBe('Tenant permanently purged');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw if tenant was already purged', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenant.findUnique.mockResolvedValue({ ...mockTenant, status: 'PURGED' });

      await expect(service.purgeTenant('tenant-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('getExportHistory', () => {
    it('should return export events', async () => {
      const { prisma } = await import('@unerp/database');
      prisma.tenantLifecycleEvent.findMany.mockResolvedValue([
        { id: 'evt-1', eventType: 'EXPORT', status: 'COMPLETED' },
      ]);

      const result = await service.getExportHistory('tenant-1');

      expect(result).toHaveLength(1);
      expect(prisma.tenantLifecycleEvent.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', eventType: 'EXPORT' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
