import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityService } from '../security.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      auditLog: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      setting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      userSession: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      ssoConfig: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
      ipRestriction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      dataRetentionPolicy: {
        findMany: vi.fn(),
        upsert: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock('@unerp/auth', () => {
  return {
    signToken: vi.fn(() => 'mock-jwt-token'),
  };
});

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    securityService = new SecurityService();
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const { prisma } = await import('@unerp/database');

      const mockLogs = [
        {
          id: 'log-1',
          tenantId: 'tenant-123',
          userId: 'user-1',
          action: 'LOGIN',
          entityType: 'Session',
          entityId: 'sess-1',
          changes: { severity: 'INFO', details: 'Success login' },
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const result = await securityService.getAuditLogs('tenant-123', { page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe('getActiveSessions', () => {
    it('should query active sessions', async () => {
      const { prisma } = await import('@unerp/database');
      const mockSessions = [
        { id: 'sess-1', device: 'Chrome', user: { email: 'admin@unerp.dev' } },
      ];
      vi.mocked(prisma.userSession.findMany).mockResolvedValue(mockSessions as any);

      const result = await securityService.getActiveSessions('tenant-123');
      expect(result).toEqual(mockSessions);
      expect(prisma.userSession.findMany).toHaveBeenCalled();
    });
  });

  describe('revokeSession', () => {
    it('should delete specified session', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.userSession.findFirst).mockResolvedValue({ id: 'sess-1' } as any);
      vi.mocked(prisma.userSession.delete).mockResolvedValue({} as any);

      const result = await securityService.revokeSession('tenant-123', 'sess-1');
      expect(result).toEqual({ success: true, message: 'Session revoked' });
      expect(prisma.userSession.delete).toHaveBeenCalled();
    });
  });

  describe('getPasswordPolicy', () => {
    it('should return default policy if setting not found', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);

      const result = await securityService.getPasswordPolicy('tenant-123');

      expect(result).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecial: false,
        maxAge: 90,
      });
    });
  });

  describe('savePasswordPolicy', () => {
    it('should upsert password policy setting', async () => {
      const { prisma } = await import('@unerp/database');
      const policy = {
        minLength: 10,
        requireUppercase: true,
        requireNumbers: false,
        requireSpecial: true,
        maxAge: 60,
      };

      vi.mocked(prisma.setting.upsert).mockResolvedValue({
        id: 'setting-1',
        value: policy,
      } as any);

      const result = await securityService.savePasswordPolicy('tenant-123', policy);
      expect(result).toBeDefined();
      expect(prisma.setting.upsert).toHaveBeenCalled();
    });
  });

  describe('getSsoConfigs', () => {
    it('should retrieve configs', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.ssoConfig.findMany).mockResolvedValue([] as any);

      const result = await securityService.getSsoConfigs('tenant-123');
      expect(result).toBeDefined();
    });
  });

  describe('saveSsoConfig', () => {
    it('should upsert config', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.ssoConfig.upsert).mockResolvedValue({} as any);

      const config = { providerType: 'oidc', name: 'Google Workspace' };
      const result = await securityService.saveSsoConfig('tenant-123', config);
      expect(result).toBeDefined();
      expect(prisma.ssoConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('getIpRestrictions', () => {
    it('should retrieve list', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.ipRestriction.findMany).mockResolvedValue([] as any);

      const result = await securityService.getIpRestrictions('tenant-123');
      expect(result).toBeDefined();
    });
  });

  describe('impersonateUser', () => {
    it('should sign impersonation token', async () => {
      const { prisma } = await import('@unerp/database');
      const mockUser = {
        id: 'user-impersonated',
        tenantId: 'tenant-123',
        email: 'impersonate@unerp.dev',
        firstName: 'Impersonated',
        lastName: 'User',
        avatar: null,
        roles: [{ role: { name: 'Admin' } }],
      };
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await securityService.impersonateUser('tenant-123', 'user-impersonated');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('impersonate@unerp.dev');
    });
  });

  describe('dataRetentionPolicies', () => {
    it('should retrieve retention policies list', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dataRetentionPolicy.findMany).mockResolvedValue([] as any);

      const result = await securityService.getDataRetentionPolicies('tenant-123');
      expect(result).toBeDefined();
    });

    it('should upsert retention policies', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dataRetentionPolicy.upsert).mockResolvedValue({} as any);

      const result = await securityService.saveDataRetentionPolicy('tenant-123', {
        entityType: 'AuditLog',
        retentionDays: 90,
        action: 'delete',
      });
      expect(result).toBeDefined();
      expect(prisma.dataRetentionPolicy.upsert).toHaveBeenCalled();
    });

    it('should delete retention policy', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.dataRetentionPolicy.findFirst).mockResolvedValue({ id: 'pol-1' } as any);
      vi.mocked(prisma.dataRetentionPolicy.delete).mockResolvedValue({} as any);

      const result = await securityService.deleteDataRetentionPolicy('tenant-123', 'pol-1');
      expect(result).toEqual({ success: true, message: 'Policy deleted' });
      expect(prisma.dataRetentionPolicy.delete).toHaveBeenCalled();
    });
  });

  describe('complianceReports', () => {
    it('should retrieve reports', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);

      const result = await securityService.getComplianceReports('tenant-123');
      expect(result).toEqual([]);
    });

    it('should generate report', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.setting.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.userSession.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.ipRestriction.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.setting.upsert).mockResolvedValue({} as any);

      const result = await securityService.generateComplianceReport('tenant-123', 'admin-id');
      expect(result.score).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
    });
  });
});
