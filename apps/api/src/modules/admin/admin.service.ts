import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import { User, UserRole, Role } from "@prisma/client";
import {
  CreateUserInput,
  UpdateUserInput,
  PERMISSION_REGISTRY,
} from "@unerp/shared";
import {
  CreateAccessPackageInput,
  UpdateAccessPackageInput,
} from "./admin.schemas";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private transporter: Transporter | null = null;

  constructor() {
    // Initialize SMTP if configured
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
      this.logger.log(
        `SMTP configured for ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`,
      );
    } else {
      this.logger.warn(
        "SMTP not configured. Real invitation emails will not be sent.",
      );
    }
  }
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
      throw new BadRequestException(
        "A user with this email address already exists in your organization.",
      );
    }

    const invitedUser = await prisma.$transaction(async (tx) => {
      // 1. Create User (set passwordHash as null, status as INVITED)
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: "INVITED",
        },
      });

      // 2. Assign Roles
      for (const roleId of dto.roleIds) {
        // Confirm role belongs to the tenant
        const role = await tx.role.findFirst({
          where: { id: roleId, tenantId },
        });

        if (!role) {
          throw new NotFoundException(
            `Role with ID ${roleId} not found in this tenant`,
          );
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

    // Send the real email invite via SMTP
    await this.sendInviteEmail(invitedUser.email, tenantId, invitedUser.id);
    return invitedUser;
  }

  /**
   * Helper: Sends an invite email using SMTP
   */
  private async sendInviteEmail(
    email: string,
    tenantId: string,
    userId: string,
  ) {
    if (!this.transporter) {
      this.logger.debug(
        `[Mock Email] Would send invite to ${email} for tenant ${tenantId}`,
      );
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Generate a secure invite token in a real app, here we use a mock token just for the link
    const inviteLink = `${appUrl}/register?invite=${userId}`;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"UniERP" <noreply@unerp.dev>',
        to: email,
        subject: "You have been invited to join a UniERP workspace",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You're invited!</h2>
            <p>You have been invited to collaborate in a workspace on UniERP.</p>
            <p>Click the link below to set up your account and get started:</p>
            <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
            <p style="color: #666; font-size: 12px;">If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Invite email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${email}`, error);
    }
  }

  /**
   * Updates an existing user's details and role assignments.
   */
  async updateUser(tenantId: string, userId: string, dto: UpdateUserInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
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
   * Resends an invitation email to a pending user.
   */
  async resendInvitation(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== "INVITED") {
      throw new BadRequestException("User is already active");
    }

    await this.sendInviteEmail(user.email, tenantId, user.id);
    return { success: true };
  }

  /**
   * Deletes a user (or revokes their invitation).
   */
  async deleteUser(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // In a real ERP, we might soft-delete if they have related records.
    // Here we'll hard delete for invitations, or soft-delete for active users.
    if (user.status === "INVITED") {
      await prisma.user.delete({
        where: { id: userId },
      });
      return { success: true, message: "Invitation revoked" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });
    return { success: true, message: "User deactivated" };
  }

  /**
   * Returns a high-level overview of team capacity for the SaaS portal.
   */
  async getTeamOverview(tenantId: string) {
    const users = await prisma.user.findMany({
      where: { tenantId, status: { in: ["ACTIVE", "INVITED"] } },
    });

    const sub = await prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
    });

    return {
      activeCount: users.filter((u) => u.status === "ACTIVE").length,
      invitedCount: users.filter((u) => u.status === "INVITED").length,
      maxSeats: sub?.plan?.maxUsers || 5,
    };
  }

  /**
   * Generates a generic invite link for the tenant.
   */
  async generateInviteLink(_tenantId: string) {
    // In production, this would be a secure token mapped to the tenant in the DB
    const token =
      Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return {
      link: `${appUrl}/register?invite=${token}`,
    };
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
      throw new NotFoundException("Tenant not found");
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
  async updateSettings(
    tenantId: string,
    dto: import("@unerp/shared").UpdateAdminSettingsInput,
  ): Promise<unknown> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update Organization Profile if any fields match
      if (
        dto.companyName ||
        dto.taxId ||
        dto.currency ||
        dto.timezone ||
        dto.address
      ) {
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
      if (dto.logoUrl !== undefined) newSettingsData.logoUrl = dto.logoUrl;

      const updatedSettings = {
        ...currentSettings,
        ...newSettingsData,
      };

      if (dto.logoUrl) {
        const checklist = (updatedSettings.onboardingChecklist as any) || {
          profile: false,
          logo: false,
          invite: false,
          app: false,
          plan: false,
          dashboard: false,
        };
        checklist.logo = true;
        updatedSettings.onboardingChecklist = checklist;
      }

      const updatedTenant = await tx.tenant.update({
        where: { id: tenantId },
        data: {
          // Tenant.name is what the header/sidebar/tenant-switcher actually
          // display (via /auth/me), separate from Organization.name above —
          // keep them in sync so renaming the company here actually shows
          // up anywhere the app renders the tenant.
          ...(dto.companyName ? { name: dto.companyName } : {}),
          settings: updatedSettings as any,
        },
      });

      return {
        tenant: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          settings: updatedTenant.settings,
        },
        message: "Settings updated successfully",
      };
    });
  }

  // ── Demo Data ──

  async getDemoStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const records = await prisma.demoDataRecord.groupBy({
      by: ["module"],
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

    return { message: "Demo data loaded successfully" };
  }

  async removeDemoData(tenantId: string, module?: string) {
    const where = module ? { tenantId, module } : { tenantId };

    const records = await prisma.demoDataRecord.findMany({ where });

    for (const record of records) {
      const modelName =
        record.entityType.charAt(0).toLowerCase() + record.entityType.slice(1);
      const model = (prisma as any)[modelName];
      if (model && typeof (model as any).delete === "function") {
        try {
          await (
            model as {
              delete: (args: { where: { id: string } }) => Promise<unknown>;
            }
          ).delete({
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

    return { message: `Demo data removed${module ? ` for ${module}` : ""}` };
  }

  // ── Access Packages ──

  /**
   * Tenant-created access packages/custom roles must never grant a
   * platform-operator-only permission (e.g. `saas.analytics.read`,
   * `platform.overview.read` — see PermissionDefinition.platformOnly).
   * Reject the whole request rather than silently stripping, so callers get
   * an explicit error instead of a confusing partial grant.
   */
  private assertNoPlatformOnlyPermissions(permissions: string[] | undefined) {
    if (!permissions || permissions.length === 0) return;
    const platformOnlyCodes = new Set(
      PERMISSION_REGISTRY.filter((p) => p.platformOnly).map((p) => p.code),
    );
    const rejected = permissions.filter((code) => platformOnlyCodes.has(code));
    if (rejected.length > 0) {
      throw new BadRequestException(
        `Permission(s) not assignable to tenant access packages: ${rejected.join(", ")}`,
      );
    }
  }

  async getAccessPackages(tenantId: string) {
    return prisma.accessPackage.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAccessPackage(tenantId: string, dto: CreateAccessPackageInput) {
    this.assertNoPlatformOnlyPermissions(dto.permissions);
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

  async updateAccessPackage(
    tenantId: string,
    id: string,
    dto: UpdateAccessPackageInput,
  ) {
    const pkg = await prisma.accessPackage.findFirst({
      where: { id, tenantId },
    });
    if (!pkg) throw new NotFoundException("Access package not found");
    this.assertNoPlatformOnlyPermissions(dto.permissions);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.permissions !== undefined)
      data.permissions = JSON.stringify(dto.permissions);
    if (dto.fieldAccess !== undefined)
      data.fieldAccess = JSON.stringify(dto.fieldAccess);
    if (dto.recordFilter !== undefined)
      data.recordFilter = JSON.stringify(dto.recordFilter);

    return prisma.accessPackage.update({ where: { id }, data });
  }

  async deleteAccessPackage(tenantId: string, id: string) {
    const pkg = await prisma.accessPackage.findFirst({
      where: { id, tenantId },
    });
    if (!pkg) throw new NotFoundException("Access package not found");
    if (pkg.isSystem)
      throw new BadRequestException("Cannot delete system access package");

    await prisma.accessPackage.delete({ where: { id } });
    return { message: "Access package deleted" };
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
      orderBy: { name: "asc" },
    });
  }

  async createGroup(
    tenantId: string,
    dto: { name: string; description?: string; isActive?: boolean },
  ) {
    const existing = await prisma.userGroup.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        "A user group with this name already exists.",
      );
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

  async updateGroup(
    tenantId: string,
    id: string,
    dto: { name?: string; description?: string; isActive?: boolean },
  ) {
    const group = await prisma.userGroup.findFirst({
      where: { id, tenantId },
    });
    if (!group) {
      throw new NotFoundException("User group not found");
    }

    if (dto.name && dto.name !== group.name) {
      const existing = await prisma.userGroup.findFirst({
        where: { tenantId, name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(
          "A user group with this name already exists.",
        );
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
      throw new NotFoundException("User group not found");
    }

    await prisma.userGroup.delete({
      where: { id },
    });
    return { success: true, message: "User group deleted" };
  }

  async getGroupMembers(tenantId: string, groupId: string) {
    const group = await prisma.userGroup.findFirst({
      where: { id: groupId, tenantId },
    });
    if (!group) {
      throw new NotFoundException("User group not found");
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
      throw new NotFoundException("User group not found");
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
      throw new NotFoundException("User group not found");
    }

    const member = await prisma.userGroupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId },
      },
    });
    if (!member) {
      throw new NotFoundException("User is not a member of this group");
    }

    await prisma.userGroupMember.delete({
      where: {
        groupId_userId: { groupId, userId },
      },
    });

    return { success: true, message: "Member removed from group" };
  }
}
