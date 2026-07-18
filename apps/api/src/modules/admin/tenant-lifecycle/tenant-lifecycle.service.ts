import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@unerp/database';

export interface ExportManifest {
  tenant: Record<string, unknown>;
  exportedAt: string;
  format: string;
  data: {
    users: Array<Record<string, unknown>>;
    organizations: Array<Record<string, unknown>>;
    roles: Array<Record<string, unknown>>;
    settings: Record<string, unknown>;
    moduleData: Record<string, { model: string; count: number }>;
  };
}

@Injectable()
export class TenantLifecycleService {
  async getLifecycleStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const events = await prisma.tenantLifecycleEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const userCount = await prisma.user.count({ where: { tenantId } });
    const orgCount = await prisma.organization.count({ where: { tenantId } });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        plan: tenant.plan,
      },
      stats: {
        users: userCount,
        organizations: orgCount,
      },
      currentStatus: tenant.status,
      recentEvents: events,
    };
  }

  async exportTenant(tenantId: string, options: { format?: string; includeFiles?: boolean } = {}) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const format = options.format ?? 'json';

    const [users, organizations, roles] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, firstName: true, lastName: true, status: true, createdAt: true },
      }),
      prisma.organization.findMany({ where: { tenantId } }),
      prisma.role.findMany({ where: { tenantId } }),
    ]);

    const moduleModels = await this.getTenantModelCounts(tenantId);

    const manifest: ExportManifest = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
      },
      exportedAt: new Date().toISOString(),
      format,
      data: {
        users: users as Array<Record<string, unknown>>,
        organizations: organizations as Array<Record<string, unknown>>,
        roles: roles as Array<Record<string, unknown>>,
        settings: (tenant.settings as Record<string, unknown>) || {},
        moduleData: moduleModels,
      },
    };

    await prisma.tenantLifecycleEvent.create({
      data: {
        tenantId,
        eventType: 'EXPORT',
        status: 'COMPLETED',
        completedAt: new Date(),
        payload: {
          format,
          recordCounts: moduleModels,
          userCount: users.length,
        },
      },
    });

    return manifest;
  }

  async suspendTenant(tenantId: string, initiatedBy?: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status === 'SUSPENDED') throw new ConflictException('Tenant is already suspended');
    if (tenant.status === 'PURGED') throw new BadRequestException('Cannot suspend a purged tenant');

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'SUSPENDED' },
      });

      await tx.userSession.deleteMany({
        where: { user: { tenantId } },
      });

      await tx.tenantLifecycleEvent.create({
        data: {
          tenantId,
          eventType: 'SUSPEND',
          status: 'COMPLETED',
          initiatedBy,
          completedAt: new Date(),
        },
      });
    });

    return { message: 'Tenant suspended successfully', tenantId, status: 'SUSPENDED' };
  }

  async unsuspendTenant(tenantId: string, initiatedBy?: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status !== 'SUSPENDED') throw new ConflictException('Tenant is not currently suspended');

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });

      await tx.tenantLifecycleEvent.create({
        data: {
          tenantId,
          eventType: 'UNSUSPEND',
          status: 'COMPLETED',
          initiatedBy,
          completedAt: new Date(),
        },
      });
    });

    return { message: 'Tenant unsuspended successfully', tenantId, status: 'ACTIVE' };
  }

  async offboardTenant(tenantId: string, retentionDays: number = 90, initiatedBy?: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status === 'PURGED') throw new BadRequestException('Tenant has already been purged');
    if (tenant.status === 'OFFBOARDING') throw new ConflictException('Tenant is already being offboarded');

    const offboardDate = new Date();
    offboardDate.setDate(offboardDate.getDate() + retentionDays);

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'OFFBOARDING' },
      });

      await tx.tenantLifecycleEvent.create({
        data: {
          tenantId,
          eventType: 'OFFBOARD',
          status: 'COMPLETED',
          initiatedBy,
          retentionDays,
          completedAt: new Date(),
          payload: { offboardDate: offboardDate.toISOString(), retentionDays },
        },
      });
    });

    return {
      message: 'Tenant offboarding initiated',
      tenantId,
      status: 'OFFBOARDING',
      retentionDays,
      autoPurgeDate: offboardDate.toISOString(),
    };
  }

  async cancelOffboarding(tenantId: string, initiatedBy?: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status !== 'OFFBOARDING') throw new ConflictException('Tenant is not currently in offboarding state');

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });

      await tx.tenantLifecycleEvent.create({
        data: {
          tenantId,
          eventType: 'CANCEL_OFFBOARD',
          status: 'COMPLETED',
          initiatedBy,
          completedAt: new Date(),
        },
      });
    });

    return { message: 'Offboarding cancelled, tenant restored to active', tenantId, status: 'ACTIVE' };
  }

  async purgeTenant(tenantId: string, initiatedBy?: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status === 'PURGED') throw new ConflictException('Tenant has already been purged');

    const models = await this.getAllTenantScopedModels();
    let totalDeleted = 0;

    await prisma.$transaction(async (tx) => {
      for (const modelName of models) {
        try {
          const model = (tx as any)[modelName] as
            { deleteMany: (args: { where: { tenantId: string } }) => Promise<{ count: number }> } | undefined;
          if (model?.deleteMany) {
            const result = await model.deleteMany({ where: { tenantId } });
            totalDeleted += result.count;
          }
        } catch {
          // skip models that don't have tenantId or aren't supported in this tx
        }
      }

      await tx.tenantLifecycleEvent.create({
        data: {
          tenantId,
          eventType: 'PURGE',
          status: 'COMPLETED',
          initiatedBy,
          completedAt: new Date(),
          payload: { recordsDeleted: totalDeleted },
        },
      });

      await tx.tenant.delete({ where: { id: tenantId } });
    });

    return { message: 'Tenant permanently purged', recordsDeleted: totalDeleted };
  }

  async getExportHistory(tenantId: string) {
    return prisma.tenantLifecycleEvent.findMany({
      where: { tenantId, eventType: 'EXPORT' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async getTenantModelCounts(tenantId: string): Promise<Record<string, { model: string; count: number }>> {
    const models = await this.getAllTenantScopedModels();
    const counts: Record<string, { model: string; count: number }> = {};

    for (const modelName of models) {
      try {
        const model = (prisma as any)[modelName] as
          { count: (args: { where: { tenantId: string } }) => Promise<number> } | undefined;
        if (model?.count) {
          const count = await model.count({ where: { tenantId } });
          if (count > 0) {
            counts[modelName] = { model: modelName, count };
          }
        }
      } catch {
        // skip
      }
    }

    return counts;
  }

  private async getAllTenantScopedModels(): Promise<string[]> {
    const dmmf = (prisma as any)._dmmf as { datamodel?: { models?: Array<{ name: string; fields: Array<{ name: string }> }> } } | undefined;
    if (dmmf?.datamodel?.models) {
      return dmmf.datamodel.models
        .filter((m) => m.fields.some((f) => f.name === 'tenantId'))
        .map((m) => m.name.charAt(0).toLowerCase() + m.name.slice(1));
    }

    return this.getDefaultModelNames();
  }

  private getDefaultModelNames(): string[] {
    return [
      'user', 'organization', 'role', 'userRole', 'userSession', 'userGroup',
      'userGroupMember', 'accessPackage', 'ssoConfig', 'ipRestriction',
      'savedView', 'installedApp', 'demoDataRecord', 'passwordResetToken',
      'dataRetentionPolicy', 'dataErasureRequest',
    ];
  }
}
