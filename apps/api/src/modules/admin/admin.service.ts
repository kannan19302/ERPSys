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

  // ── User Groups ──

  async getGroups(tenantId: string) {
    return prisma.userGroup.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(tenantId: string, dto: { name: string; description?: string; isActive?: boolean }) {
    const existing = await prisma.userGroup.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('A user group with this name already exists.');
    }
    return prisma.userGroup.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateGroup(tenantId: string, id: string, dto: { name?: string; description?: string; isActive?: boolean }) {
    const group = await prisma.userGroup.findFirst({
      where: { id, tenantId },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }

    if (dto.name && dto.name !== group.name) {
      const existing = await prisma.userGroup.findFirst({
        where: { tenantId, name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('A user group with this name already exists.');
      }
    }

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return prisma.userGroup.update({
      where: { id },
      data,
    });
  }

  async deleteGroup(tenantId: string, id: string) {
    const group = await prisma.userGroup.findFirst({
      where: { id, tenantId },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }

    await prisma.userGroup.delete({
      where: { id },
    });
    return { success: true, message: 'User group deleted' };
  }

  async getGroupMembers(tenantId: string, groupId: string) {
    const group = await prisma.userGroup.findFirst({
      where: { id: groupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }

    const memberships = await prisma.userGroupMember.findMany({
      where: { groupId },
      include: {
        user: true,
      },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatar: m.user.avatar,
      status: m.user.status,
      joinedAt: m.joinedAt,
    }));
  }

  async addGroupMembers(tenantId: string, groupId: string, userIds: string[]) {
    const group = await prisma.userGroup.findFirst({
      where: { id: groupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }

    const added = [];
    for (const userId of userIds) {
      // Check user exists in tenant
      const user = await prisma.user.findFirst({
        where: { id: userId, tenantId },
      });
      if (!user) continue;

      // Check if already member
      const existing = await prisma.userGroupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId },
        },
      });
      if (existing) continue;

      const member = await prisma.userGroupMember.create({
        data: { groupId, userId },
      });
      added.push(member);
    }

    return { success: true, count: added.length };
  }

  async removeGroupMember(tenantId: string, groupId: string, userId: string) {
    const group = await prisma.userGroup.findFirst({
      where: { id: groupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException('User group not found');
    }

    const member = await prisma.userGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });
    if (!member) {
      throw new NotFoundException('User is not a member of this group');
    }

    await prisma.userGroupMember.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    return { success: true, message: 'Member removed from group' };
  }
}
