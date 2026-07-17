import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../admin.service';

// Mock database package
vi.mock('@unerp/database', () => {
  return {
    prisma: {
      user: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      tenant: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        user: {
          create: vi.fn().mockResolvedValue({ id: 'new-user', email: 'test@company.com' }),
        },
        role: {
          findFirst: vi.fn().mockResolvedValue({ id: 'role-id', tenantId: 'tenant-123' }),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ id: 'ur-1' }),
        },
      })),
    },
  };
});

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return mapped list of users in the tenant', async () => {
      const { prisma } = await import('@unerp/database');
      
      const mockUsers = [
        {
          id: 'user-1',
          email: 'admin@uni-erp.com',
          firstName: 'Super',
          lastName: 'Admin',
          avatar: null,
          status: 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date(),
          roles: [
            {
              role: {
                id: 'role-1',
                name: 'Super Admin',
              },
            },
          ],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as unknown as Awaited<ReturnType<typeof prisma.user.findMany>>);

      const result = await adminService.getUsers('tenant-123');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0]?.email).toBe('admin@uni-erp.com');
      expect(result[0]?.roles[0]?.name).toBe('Super Admin');
    });
  });
});
