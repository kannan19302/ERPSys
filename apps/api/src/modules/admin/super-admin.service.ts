import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class SuperAdminService {
  async getTenants() {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { users: true, organizations: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.status,
      demoDataLoaded: t.demoDataLoaded,
      userCount: t._count.users,
      orgCount: t._count.organizations,
      subscription: t.subscription
        ? { planName: t.subscription.plan.name, status: t.subscription.status }
        : null,
      createdAt: t.createdAt,
    }));
  }

  async getTenantDetail(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            status: true, lastLoginAt: true, createdAt: true,
            roles: { include: { role: { select: { name: true } } } },
          },
        },
        organizations: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    return tenant;
  }

  async provisionTenant(data: { name: string; slug: string; plan: string; adminEmail: string }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          plan: data.plan,
          status: 'ACTIVE',
        },
      });

      await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          currency: 'USD',
          timezone: 'UTC',
          fiscalYearStart: 1,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'SUPER_ADMIN',
          isSystem: true,
          permissions: JSON.stringify(['*']),
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail.toLowerCase(),
          firstName: 'Admin',
          lastName: '',
          status: 'INVITED',
        },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return { tenant, user };
    });
  }

  async updateTenant(id: string, data: Record<string, unknown>) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updateData: Record<string, unknown> = {};
    if (data.plan) updateData.plan = data.plan;
    if (data.status) updateData.status = data.status;
    if (data.name) updateData.name = data.name;

    return prisma.tenant.update({ where: { id }, data: updateData });
  }

  async getAllAdmins() {
    const adminRoles = await prisma.role.findMany({
      where: {
        name: { in: ['SUPER_ADMIN', 'ADMIN'] },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true, email: true, firstName: true, lastName: true,
                status: true, lastLoginAt: true, tenantId: true,
              },
            },
          },
        },
      },
    });

    const admins: Array<Record<string, unknown>> = [];
    for (const role of adminRoles) {
      for (const ur of role.users) {
        admins.push({
          ...ur.user,
          roleName: role.name,
          tenantId: role.tenantId,
        });
      }
    }

    return admins;
  }

  async getAnalytics() {
    const [totalTenants, totalUsers, activeTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalTenants,
      totalUsers,
      activeTenants,
      mrr: 0,
    };
  }

  async getSystemHealth() {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    const memUsage = process.memoryUsage();

    return {
      status: 'healthy',
      uptime: process.uptime(),
      dbLatencyMs: dbLatency,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    };
  }
}
