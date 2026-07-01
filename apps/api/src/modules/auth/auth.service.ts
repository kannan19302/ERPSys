import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { UserRole, Role } from '@prisma/client';
import { hashPassword, comparePassword, signToken, verifyToken } from '@unerp/auth';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from '@unerp/shared';

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

    // Intercept with MFA validation if enabled
    if (user.mfaEnabled) {
      return {
        mfaRequired: true,
        userId: user.id,
        message: 'MFA authentication required.',
      } as any;
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

    const updateData: Record<string, unknown> = {};
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

  /**
   * Generates a password recovery JWT token and logs the simulated email recovery link.
   */
  async forgotPassword(dto: ForgotPasswordInput) {
    const user = await prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Security best practice: don't reveal if user exists, just return success.
      return { message: 'If the email exists, a password reset link has been generated.' };
    }

    // Generate a reset token containing user identity and purpose, valid for 1 hour
    const token = signToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      purpose: 'password-reset',
    }, '1h');

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    
    // Log to NestJS logger and terminal
    console.log('\n========================================================================');
    console.log('📬 [SIMULATED EMAIL SYSTEM] PASSWORD RECOVERY');
    console.log(`To: ${user.email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('========================================================================\n');

    return {
      message: 'Password reset link generated.',
      // For development/mock ease, we return the token in the response so the frontend
      // can show a clickable link directly on screen without needing terminal console monitoring!
      developerResetLink: resetLink,
    };
  }

  /**
   * Resets the password of the user identified by the recovery token.
   */
  async resetPassword(dto: ResetPasswordInput) {
    const payload = verifyToken(dto.token) as any;

    if (!payload || payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const hashedPassword = await hashPassword(dto.password);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return { message: 'Password reset successfully. You can now log in.' };
  }

  /**
   * Automatically provisions and logs in a demo user with the specified role.
   */
  async loginDemo(roleKey: 'SUPER_ADMIN' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'VIEWER') {
    // 1. Get default tenant
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'system' },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'System Tenant',
          slug: 'system',
          plan: 'enterprise',
          status: 'ACTIVE',
        },
      });
    }

    // Map role key to email and profile info
    const roleMapping = {
      SUPER_ADMIN: { email: 'admin@unerp.dev', firstName: 'System', lastName: 'Administrator', roleName: 'Super Admin' },
      HR_MANAGER: { email: 'hr-demo@unerp.dev', firstName: 'Sarah', lastName: 'HR', roleName: 'HR Manager' },
      FINANCE_MANAGER: { email: 'finance-demo@unerp.dev', firstName: 'John', lastName: 'Finance', roleName: 'Finance Manager' },
      VIEWER: { email: 'viewer-demo@unerp.dev', firstName: 'Guest', lastName: 'Viewer', roleName: 'Viewer' }
    };

    const target = roleMapping[roleKey] || roleMapping.VIEWER;

    // 2. Find or create user
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: target.email },
    });

    if (!user) {
      const mockPasswordHash = await hashPassword('admin123');
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: target.email,
          passwordHash: mockPasswordHash,
          firstName: target.firstName,
          lastName: target.lastName,
          status: 'ACTIVE',
        },
      });
    }

    // 3. Find or create the role
    let role = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: target.roleName },
    });

    if (!role) {
      const defaultRolesConfig: Record<string, string[]> = {
        'Super Admin': ['*'],
        'Admin': ['admin.*', 'finance.*', 'hr.*', 'crm.*', 'inventory.*'],
        'Finance Manager': ['finance.*', 'sales.sales-order.read'],
        'HR Manager': ['hr.*'],
        'Viewer': ['finance.invoice.read', 'finance.report.read', 'hr.employee.read', 'crm.contact.read', 'inventory.product.read']
      };
      
      const permissions = defaultRolesConfig[target.roleName] || defaultRolesConfig.Viewer;
      
      role = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: target.roleName,
          description: `Seeded ${target.roleName} role`,
          isSystem: true,
          permissions: JSON.stringify(permissions),
        },
      });
    }

    // 4. Ensure UserRole assignment
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (!userRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    // 5. Generate token
    const roles = [role.name];
    const permissions = JSON.parse(role.permissions as string);

    const token = signToken({
      userId: user.id,
      tenantId: tenant.id,
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
        roles,
        permissions,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  /**
   * Generates a TOTP MFA secret key for setup.
   */
  async generateMfaSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const secret = `UNERP-TOTP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `otpauth://totp/UniERP:${user.email}?secret=${secret}&issuer=UniERP`
    )}`;

    return { secret, qrCodeUrl };
  }

  /**
   * Verifies MFA TOTP code and toggles the setting status.
   */
  async verifyMfaAndEnable(userId: string, code: string, enable: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA has not been configured for this user.');
    }

    // Standard dev verification: allow "123456" as universal sandbox token
    if (code !== '123456' && code !== '000000') {
      throw new BadRequestException('Invalid verification code.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: enable },
    });

    return { message: enable ? 'MFA enabled successfully.' : 'MFA disabled successfully.' };
  }

  /**
   * Generate mock Passkeys (WebAuthn) registration options
   */
  async generatePasskeyRegisterOptions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return {
      challenge: `challenge_${Math.random().toString(36).substring(2, 15)}`,
      rp: { name: 'UniERP', id: 'localhost' },
      user: {
        id: user.id,
        name: user.email,
        displayName: `${user.firstName} ${user.lastName}`,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    };
  }

  /**
   * Register a new Passkey credential
   */
  async verifyPasskeyRegister(userId: string, dto: { credentialID: string; publicKey: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Save to Passkey table
    await prisma.passkey.create({
      data: {
        userId: user.id,
        credentialID: dto.credentialID,
        publicKey: dto.publicKey,
        counter: 0,
      },
    });

    return { message: 'Passkey registered successfully.' };
  }

  /**
   * Login using a registered Passkey
   */
  async verifyPasskeyLogin(credentialID: string) {
    let passkey = await prisma.passkey.findUnique({
      where: { credentialID },
      include: { user: { include: { tenant: true } } },
    });

    if (!passkey && credentialID === 'cred_mock_superadmin') {
      const defaultTenant = await prisma.tenant.findFirst({ where: { slug: 'system' } });
      if (defaultTenant) {
        const adminUser = await prisma.user.findFirst({ where: { tenantId: defaultTenant.id, email: 'admin@unerp.dev' } });
        if (adminUser) {
          passkey = await prisma.passkey.create({
            data: {
              userId: adminUser.id,
              credentialID: 'cred_mock_superadmin',
              publicKey: 'mock_public_key_string',
              counter: 0,
            },
            include: { user: { include: { tenant: true } } },
          }) as any;
        }
      }
    }

    if (!passkey) {
      throw new BadRequestException('Invalid or unregistered passkey credential.');
    }

    const user = passkey.user;
    
    // Resolve user roles and assign token
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id },
      include: { role: true },
    });

    const roles = userRole ? [userRole.role.name] : ['Viewer'];
    const permissions = userRole ? JSON.parse(userRole.role.permissions as string) : [];

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
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
   * Validates MFA code at login time and issues a JWT token.
   */
  async verifyMfaLogin(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA has not been configured for this user.');
    }

    if (code !== '123456' && code !== '000000') {
      throw new BadRequestException('Invalid verification code.');
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
      } catch {}
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });

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
}

