import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SecurityService {
  /**
   * Paginated audit logs with optional search and severity filter.
   */
  async getAuditLogs(
    tenantId: string,
    opts: { page?: number; limit?: number; search?: string; severity?: string; action?: string },
  ) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (opts.severity && opts.severity !== 'ALL') {
      // AuditLog doesn't have a severity column — derive from action keywords
      // We store severity in the `changes` JSON field as `severity` if present
      where.changes = { path: ['severity'], equals: opts.severity };
    }

    if (opts.action) {
      where.action = opts.action;
    }

    if (opts.search) {
      where.OR = [
        { action: { contains: opts.search, mode: 'insensitive' } },
        { entityType: { contains: opts.search, mode: 'insensitive' } },
        { entityId: { contains: opts.search, mode: 'insensitive' } },
        { userId: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mock active sessions — no session model yet.
   */
  async getActiveSessions(_tenantId: string) {
    return [
      {
        id: 'ses-1',
        user: 'admin@unerp.dev',
        device: 'Windows 11',
        browser: 'Chrome 126',
        ip: '192.168.1.100',
        location: 'New York, US',
        startedAt: '2026-06-14 08:00',
        lastActivity: '2 min ago',
        current: true,
      },
      {
        id: 'ses-2',
        user: 'admin@unerp.dev',
        device: 'iPhone 16',
        browser: 'Safari Mobile',
        ip: '172.16.0.5',
        location: 'New York, US',
        startedAt: '2026-06-14 10:30',
        lastActivity: '45 min ago',
        current: false,
      },
      {
        id: 'ses-3',
        user: 'jane@acme.com',
        device: 'macOS 15',
        browser: 'Firefox 130',
        ip: '10.0.0.45',
        location: 'San Francisco, US',
        startedAt: '2026-06-14 09:15',
        lastActivity: '12 min ago',
        current: false,
      },
      {
        id: 'ses-4',
        user: 'mike@acme.com',
        device: 'Ubuntu 24',
        browser: 'Chrome 126',
        ip: '10.0.0.52',
        location: 'London, UK',
        startedAt: '2026-06-14 06:00',
        lastActivity: '3 hrs ago',
        current: false,
      },
    ];
  }

  /**
   * Get password policy from Setting model.
   */
  async getPasswordPolicy(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'security.password-policy' } },
    });

    if (!setting) {
      return {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecial: false,
        maxAge: 90,
      };
    }

    return setting.value;
  }

  /**
   * Save password policy to Setting model.
   */
  async savePasswordPolicy(
    tenantId: string,
    policy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSpecial: boolean;
      maxAge: number;
    },
  ) {
    const result = await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.password-policy' } },
      update: { value: policy as any, category: 'security' },
      create: {
        tenantId,
        key: 'security.password-policy',
        value: policy as any,
        category: 'security',
      },
    });

    return result;
  }
}
