import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { signSessionToken } from '@unerp/auth';

interface SsoProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  nameId?: string;
  groups?: string[];
  provider: 'SAML' | 'OIDC';
}

@Injectable()
export class SsoService {

  async processSsoLogin(tenantSlug: string, profile: SsoProfile) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // JIT user provisioning — find or create user from SSO attributes
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: profile.email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: profile.email.toLowerCase(),
          firstName: profile.firstName || profile.email.split('@')[0] || 'SSO',
          lastName: profile.lastName || 'User',
          status: 'ACTIVE',
          passwordHash: null,
        },
      });

      // Assign default role
      const viewerRole = await prisma.role.findFirst({
        where: { tenantId: tenant.id, name: 'Viewer' },
      });
      if (viewerRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: viewerRole.id },
        });
      }
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(`Account is ${user.status?.toLowerCase()}`);
    }

    // Get roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });
    const roles = userRoles.map((ur) => ur.role.name);

    // Generate token
    const token = signSessionToken({
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      ssoProvider: profile.provider,
    });

    // Update last login
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
      },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  async getSsoConfig(tenantId: string) {
    const setting = await prisma.setting.findFirst({
      where: { tenantId, key: 'sso_config' },
    });
    return setting ? JSON.parse(String(setting.value)) : null;
  }

  async saveSsoConfig(tenantId: string, config: Record<string, unknown>) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'sso_config' } },
      create: { tenantId, key: 'sso_config', value: JSON.stringify(config) },
      update: { value: JSON.stringify(config) },
    });
    return { saved: true };
  }

  async getSsoConfigByTenantSlug(tenantSlug: string) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return null;
    return this.getSsoConfig(tenant.id);
  }
}
