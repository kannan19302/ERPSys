import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma, runWithTenantSession } from "@unerp/database";
import { idpClient as idpPrisma } from "../../common/idp-client";

@Injectable()
export class SuperAdminService {
  async getTenants() {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { organizations: true } },
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      status: t.status,
      demoDataLoaded: t.demoDataLoaded,
      userCount: 0,
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
        organizations: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async provisionTenant(data: {
    name: string;
    slug: string;
    plan: string;
    adminEmail: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          plan: data.plan,
          status: "ACTIVE",
        },
      });

      await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          currency: "USD",
          timezone: "UTC",
          fiscalYearStart: 1,
        },
      });

      const adminRole = await idpPrisma.role.create({
        data: {
          tenantId: tenant.id,
          name: "SUPER_ADMIN",
          isSystem: true,
          permissions: JSON.stringify(["*"]),
        },
      });

      const user = await idpPrisma.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail.toLowerCase(),
          firstName: "Admin",
          lastName: "",
          status: "INVITED",
        },
      });

      await idpPrisma.userRole.create({
        data: { userId: user.id, roleId: adminRole.id },
      });

      return { tenant, user };
    });
  }

  async updateTenant(id: string, data: Record<string, unknown>) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const updateData: Record<string, unknown> = {};
    if (data.plan) updateData.plan = data.plan;
    if (data.status) updateData.status = data.status;
    if (data.name) updateData.name = data.name;

    return prisma.tenant.update({ where: { id }, data: updateData });
  }

  async getAllAdmins() {
    return idpPrisma.user.findMany({
      where: { roles: { some: { role: { name: "SUPER_ADMIN" } } } },
    });
  }

  async getAnalytics() {
    const [tenantCount, activeCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
    ]);
    return { tenantCount, activeCount };
  }

  async getSystemHealth() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }
}
