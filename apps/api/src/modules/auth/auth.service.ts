import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { UserRole, Role } from '@prisma/client';
import { hashPassword, comparePassword, signToken } from '@unerp/auth';
import { RegisterInput, LoginInput } from '@unerp/shared';

@Injectable()
export class AuthService {
  /**
   * Registers a new tenant along with its organization, default roles, and super admin user.
   */
  async register(dto: RegisterInput) {
    const slug = dto.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      throw new BadRequestException('An organization with a similar name already exists. Choose a different name.');
    }

    // Hash the administrator's password
    const hashedPassword = await hashPassword(dto.password);

    // Run creation in a transaction
    return prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.organizationName,
          slug,
          plan: 'free',
          status: 'ACTIVE',
        },
      });

      // 2. Create default roles for the tenant
      const defaultRolesConfig = {
        SUPER_ADMIN: {
          name: 'Super Admin',
          description: 'Full access to all features',
          permissions: ['*'],
        },
        ADMIN: {
          name: 'Admin',
          description: 'Administrative access with user management',
          permissions: ['admin.*', 'finance.*', 'hr.*', 'crm.*', 'inventory.*'],
        },
        VIEWER: {
          name: 'Viewer',
          description: 'Read-only access to all modules',
          permissions: [
            'finance.invoice.read',
            'finance.report.read',
            'hr.employee.read',
            'crm.contact.read',
            'inventory.product.read',
          ],
        },
      };

      const rolesMap: Record<string, string> = {};
      for (const [key, role] of Object.entries(defaultRolesConfig)) {
        const dbRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: role.name,
            description: role.description,
            isSystem: true,
            permissions: JSON.stringify(role.permissions),
          },
        });
        rolesMap[key] = dbRole.id;
      }

      // 3. Create User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'ACTIVE',
        },
      });

      // 4. Assign SUPER_ADMIN role to user
      const superAdminRoleId = rolesMap['SUPER_ADMIN'];
      if (superAdminRoleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRoleId,
          },
        });
      }

      // 5. Create Organization
      const org = await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: dto.organizationName,
          currency: 'USD',
          timezone: 'UTC',
        },
      });

      // 6. Create Default Departments
      const depts = ['Finance', 'Human Resources', 'Sales', 'Operations'];
      for (const deptName of depts) {
        await tx.department.create({
          data: {
            tenantId: tenant.id,
            orgId: org.id,
            name: deptName,
            code: deptName.toUpperCase(),
          },
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    });
  }

  /**
   * Authenticates a user and issues a JWT token.
   */
  async login(dto: LoginInput & { tenantSlug?: string }) {
    let tenantId = '';
    
    if (dto.tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: dto.tenantSlug },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
      tenantId = tenant.id;
    } else {
      // Look up user email across all tenants
      const users = await prisma.user.findMany({
        where: { email: dto.email.toLowerCase() },
        include: { tenant: true },
      });

      if (users.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (users.length > 1) {
        throw new BadRequestException('Multiple accounts found. Please provide your Organization Slug.');
      }
      
      const targetUser = users[0];
      if (targetUser) {
        tenantId = targetUser.tenantId;
      }
    }

    // Find user within the specified tenant scope
    const user = await prisma.user.findFirst({
      where: {
        tenantId,
        email: dto.email.toLowerCase(),
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    // Get user roles
    const userRoles = (await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    })) as unknown as Array<UserRole & { role: Role }>;

    const roles = userRoles.map((ur) => ur.role.name);
    const permissions: string[] = [];
    for (const ur of userRoles) {
      try {
        const perms = JSON.parse(ur.role.permissions as string);
        if (Array.isArray(perms)) {
          permissions.push(...perms);
        }
      } catch {
        // Skip malformed permissions
      }
    }

    // Generate token
    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    };
  }

  /**
   * Returns profile data of the currently authenticated user.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const userRoles = (await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    })) as unknown as Array<UserRole & { role: Role }>;

    const roles = userRoles.map((ur) => ur.role.name);
    const permissions: string[] = [];
    for (const ur of userRoles) {
      try {
        const perms = JSON.parse(ur.role.permissions as string);
        if (Array.isArray(perms)) {
          permissions.push(...perms);
        }
      } catch {
        // Skip
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      roles,
      permissions,
      preferences: user.preferences,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    };
  }

  /**
   * Updates profile data of the currently authenticated user.
   */
  async updateProfile(userId: string, dto: import('@unerp/shared').UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.currentPassword && dto.newPassword) {
      if (!user.passwordHash) throw new BadRequestException('Account does not have a password.');
      const isPasswordValid = await comparePassword(dto.currentPassword, user.passwordHash);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid current password');
    }

    const updateData: any = {};
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.newPassword) updateData.passwordHash = await hashPassword(dto.newPassword);
    
    if (dto.preferences) {
      const currentPrefs = user.preferences as Record<string, unknown>;
      updateData.preferences = { ...currentPrefs, ...dto.preferences };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      preferences: updatedUser.preferences,
    };
  }
}
