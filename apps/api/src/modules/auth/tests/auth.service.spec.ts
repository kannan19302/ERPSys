import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';

// Mock the database client
vi.mock('@unerp/database', () => {
  return {
    prisma: {
      tenant: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: {
        create: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      organization: {
        create: vi.fn(),
      },
      department: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        tenant: {
          create: vi.fn().mockResolvedValue({ id: 'tenant-123', name: 'Acme', slug: 'acme' }),
        },
        role: {
          create: vi.fn().mockResolvedValue({ id: 'role-123' }),
        },
        user: {
          create: vi.fn().mockResolvedValue({ id: 'user-123', email: 'admin@uni-erp.com', firstName: 'Super', lastName: 'Admin' }),
        },
        userRole: {
          create: vi.fn().mockResolvedValue({ id: 'ur-123' }),
        },
        organization: {
          create: vi.fn().mockResolvedValue({ id: 'org-123' }),
        },
        department: {
          create: vi.fn().mockResolvedValue({ id: 'dept-123' }),
        },
      })),
    },
  };
});

// Mock the auth utilities
vi.mock('@unerp/auth', () => {
  return {
    hashPassword: vi.fn().mockResolvedValue('hashed_pass_123'),
    comparePassword: vi.fn().mockResolvedValue(true),
    signToken: vi.fn().mockReturnValue('jwt_token_abc'),
    signSessionToken: vi.fn().mockReturnValue('jwt_session_abc'),
    signTypedToken: vi.fn().mockReturnValue('typed_token_abc'),
    verifyTypedToken: vi.fn().mockReturnValue({ userId: 'user-123' }),
    TOKEN_TYPE: { SESSION: 'session', PASSWORD_RESET: 'password-reset', MFA_CHALLENGE: 'mfa-challenge' },
  };
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a tenant and return registration credentials', async () => {
      const { prisma } = await import('@unerp/database');
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const result = await authService.register({
        email: 'admin@uni-erp.com',
        password: 'AdminPass123!',
        confirmPassword: 'AdminPass123!',
        firstName: 'Super',
        lastName: 'Admin',
        organizationName: 'Acme',
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe('admin@uni-erp.com');
      expect(result.tenant.name).toBe('Acme');
    });
  });
});
