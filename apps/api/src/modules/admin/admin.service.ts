import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { User, UserRole, Role } from '@prisma/client';
import { CreateUserInput, UpdateUserInput, CreateAccessPackageInput, UpdateAccessPackageInput } from '@unerp/shared';

@Injectable()
export class AdminService {
  /**
   * Returns all users in the tenant.
   */
  async getUsers(tenantId: string) {
    const users = (await prisma.user.findMany({
      where: { tenantId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })) as unknown as Array<User & { roles: Array<UserRole & { role: Role }> }>;

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.roles.map((r: UserRole & { role: Role }) => ({
        id: r.role.id,
        name: r.role.name,
      })),
    }));
  }

  /**
   * Invites/creates a new user in the tenant.
   */
  async createUser(tenantId: string, dto: CreateUserInput) {
    // Check if email already exists in tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId,
        email: dto.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email address already exists in your organization.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create User (set passwordHash as null, status as INVITED)
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'INVITED',
        },
      });

      // 2. Assign Roles
      for (const roleId of dto.roleIds) {
        // Confirm role belongs to the tenant
        const role = await tx.role.findFirst({
          where: { id: roleId, tenantId },
        });

        if (!role) {
          throw new NotFoundException(`Role with ID ${roleId} not found in this tenant`);
        }

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      }

      return user;
    });
  }

  /**
   * Updates an existing user's details and role assignments.
   */
  async updateUser(tenantId: string, userId: string, dto: UpdateUserInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: dto.status,
        },
      });

      // 2. Update role assignments if provided
      if (dto.roleIds) {
        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // Add new roles
        for (const roleId of dto.roleIds) {
          const role = await tx.role.findFirst({
            where: { id: roleId, tenantId },
          });

          if (!role) {
            throw new NotFoundException(`Role with ID ${roleId} not found`);
          }

          await tx.userRole.create({
            data: {
              userId,
              roleId,
            },
          });
        }
      }

      return updatedUser;
    });
  }

  /**
   * Returns all roles in the tenant.
   */
  async getRoles(tenantId: string): Promise<unknown> {
    return prisma.role.findMany({
      where: { tenantId },
    });
  }

  /**
   * Returns the tenant configurations and settings.
   */
  async getSettings(tenantId: string): Promise<unknown> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get organization details
    const org = await prisma.organization.findFirst({
      where: { tenantId },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        settings: tenant.settings,
      },
      organization: org,
    };
  }

  /**
   * Updates the tenant's configuration settings.
   */
  async updateSettings(tenantId: string, dto: import('@unerp/shared').UpdateAdminSettingsInput): Promise<unknown> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Organization Profile if any fields match
      if (dto.companyName || dto.taxId || dto.currency || dto.timezone || dto.address) {
        const orgs = await tx.organization.findMany({ where: { tenantId } });
        const org = orgs[0];
        if (org) {
          const updateData: Record<string, unknown> = {};
          if (dto.companyName) updateData.name = dto.companyName;
          if (dto.taxId) updateData.taxId = dto.taxId;
          if (dto.currency) updateData.currency = dto.currency;
          if (dto.timezone) updateData.timezone = dto.timezone;
          if (dto.address) updateData.address = dto.address;
          
          await tx.organization.update({
            where: { id: org.id },
            data: updateData,
          });
        }
      }

      // 2. Update Tenant Settings (branding, modules)
      const currentSettings = tenant.settings as Record<string, unknown>;
      const newSettingsData: Record<string, unknown> = {};
      
      if (dto.primaryColor) newSettingsData.primaryColor = dto.primaryColor;
      if (dto.modules) newSettingsData.modules = dto.modules;

      const updatedSettings = {
        ...currentSettings,
        ...newSettingsData,
      };

      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          settings: updatedSettings,
        },
      });

      return {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          settings: updatedTenant.settings,
        },
        message: 'Settings updated successfully',
      };
    });
  }

  // ── Demo Data ──

  async getDemoStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const records = await prisma.demoDataRecord.groupBy({
      by: ['module'],
      where: { tenantId },
      _count: { id: true },
    });

    const modules: Record<string, { count: number; loaded: boolean }> = {};
    for (const r of records) {
      modules[r.module] = { count: r._count.id, loaded: r._count.id > 0 };
    }

    return {
      loaded: tenant.demoDataLoaded,
      loadedAt: tenant.demoLoadedAt,
      modules,
    };
  }

  async loadDemoData(tenantId: string) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { demoDataLoaded: true, demoLoadedAt: new Date() },
    });

    return { message: 'Demo data loaded successfully' };
  }

  async removeDemoData(tenantId: string, module?: string) {
    const where = module
      ? { tenantId, module }
      : { tenantId };

    const records = await prisma.demoDataRecord.findMany({ where });

    for (const record of records) {
      const modelName = record.entityType.charAt(0).toLowerCase() + record.entityType.slice(1);
      const model = (prisma as Record<string, unknown>)[modelName];
      if (model && typeof (model as Record<string, unknown>).delete === 'function') {
        try {
          await (model as { delete: (args: { where: { id: string } }) => Promise<unknown> }).delete({
            where: { id: record.entityId },
          });
        } catch {
          // Record may already be deleted
        }
      }
    }

    await prisma.demoDataRecord.deleteMany({ where });

    if (!module) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { demoDataLoaded: false, demoLoadedAt: null },
      });
    }

    return { message: `Demo data removed${module ? ` for ${module}` : ''}` };
  }

  // ── Access Packages ──

  async getAccessPackages(tenantId: string) {
    return prisma.accessPackage.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAccessPackage(tenantId: string, dto: CreateAccessPackageInput) {
    return prisma.accessPackage.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        permissions: JSON.stringify(dto.permissions),
        fieldAccess: JSON.stringify(dto.fieldAccess),
        recordFilter: JSON.stringify(dto.recordFilter),
      },
    });
  }

  async updateAccessPackage(tenantId: string, id: string, dto: UpdateAccessPackageInput) {
    const pkg = await prisma.accessPackage.findFirst({ where: { id, tenantId } });
    if (!pkg) throw new NotFoundException('Access package not found');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.permissions !== undefined) data.permissions = JSON.stringify(dto.permissions);
    if (dto.fieldAccess !== undefined) data.fieldAccess = JSON.stringify(dto.fieldAccess);
    if (dto.recordFilter !== undefined) data.recordFilter = JSON.stringify(dto.recordFilter);

    return prisma.accessPackage.update({ where: { id }, data });
  }

  async deleteAccessPackage(tenantId: string, id: string) {
    const pkg = await prisma.accessPackage.findFirst({ where: { id, tenantId } });
    if (!pkg) throw new NotFoundException('Access package not found');
    if (pkg.isSystem) throw new BadRequestException('Cannot delete system access package');

    await prisma.accessPackage.delete({ where: { id } });
    return { message: 'Access package deleted' };
  }

  async assignAccessPackageToRole(accessPackageId: string, roleId: string) {
    return prisma.roleAccessPackage.create({
      data: { roleId, accessPackageId },
    });
  }

  async unassignAccessPackageFromRole(accessPackageId: string, roleId: string) {
    return prisma.roleAccessPackage.delete({
      where: { roleId_accessPackageId: { roleId, accessPackageId } },
    });
  }
}
