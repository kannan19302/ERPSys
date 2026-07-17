import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { signSessionToken } from '@unerp/auth';

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
   * Get active user sessions for the tenant.
   */
  async getActiveSessions(tenantId: string) {
    return prisma.userSession.findMany({
      where: { tenantId },
      include: {
        user: true,
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  /**
   * Revoke an active session.
   */
  async revokeSession(tenantId: string, sessionId: string) {
    const session = await prisma.userSession.findFirst({
      where: { id: sessionId, tenantId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await prisma.userSession.delete({
      where: { id: sessionId },
    });
    return { success: true, message: 'Session revoked' };
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

  /**
   * Get SSO Configurations
   */
  async getSsoConfigs(tenantId: string) {
    return prisma.ssoConfig.findMany({
      where: { tenantId },
    });
  }

  /**
   * Save or Update SSO Configuration
   */
  async saveSsoConfig(
    tenantId: string,
    data: {
      providerType: string;
      name: string;
      clientId?: string;
      clientSecret?: string;
      issuerUrl?: string;
      authorizationUrl?: string;
      tokenUrl?: string;
      userInfoUrl?: string;
      samlMetadataUrl?: string;
      samlMetadataXml?: string;
      samlEntryPoint?: string;
      samlIssuer?: string;
      samlCert?: string;
      isActive?: boolean;
    },
  ) {
    return prisma.ssoConfig.upsert({
      where: {
        tenantId_providerType: {
          tenantId,
          providerType: data.providerType,
        },
      },
      update: {
        name: data.name,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        issuerUrl: data.issuerUrl,
        authorizationUrl: data.authorizationUrl,
        tokenUrl: data.tokenUrl,
        userInfoUrl: data.userInfoUrl,
        samlMetadataUrl: data.samlMetadataUrl,
        samlMetadataXml: data.samlMetadataXml,
        samlEntryPoint: data.samlEntryPoint,
        samlIssuer: data.samlIssuer,
        samlCert: data.samlCert,
        isActive: data.isActive ?? true,
      },
      create: {
        tenantId,
        providerType: data.providerType,
        name: data.name,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        issuerUrl: data.issuerUrl,
        authorizationUrl: data.authorizationUrl,
        tokenUrl: data.tokenUrl,
        userInfoUrl: data.userInfoUrl,
        samlMetadataUrl: data.samlMetadataUrl,
        samlMetadataXml: data.samlMetadataXml,
        samlEntryPoint: data.samlEntryPoint,
        samlIssuer: data.samlIssuer,
        samlCert: data.samlCert,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Get MFA settings
   */
  async getMfaSettings(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'security.mfa-settings' } },
    });
    if (!setting) {
      return {
        enabled: false,
        mfaType: 'TOTP', // TOTP, EMAIL, SMS
        enforced: false,
      };
    }
    return setting.value;
  }

  /**
   * Save MFA settings
   */
  async saveMfaSettings(tenantId: string, mfa: { enabled: boolean; mfaType: string; enforced: boolean }) {
    return prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.mfa-settings' } },
      update: { value: mfa as any, category: 'security' },
      create: {
        tenantId,
        key: 'security.mfa-settings',
        value: mfa as any,
        category: 'security',
      },
    });
  }

  /**
   * Get IP Restrictions rules
   */
  async getIpRestrictions(tenantId: string) {
    return prisma.ipRestriction.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create IP restriction rule
   */
  async createIpRestriction(tenantId: string, data: { ipRange: string; description?: string; ruleType: string }) {
    const existing = await prisma.ipRestriction.findUnique({
      where: {
        tenantId_ipRange: {
          tenantId,
          ipRange: data.ipRange,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('IP range rule already exists');
    }
    return prisma.ipRestriction.create({
      data: {
        tenantId,
        ipRange: data.ipRange,
        description: data.description,
        ruleType: data.ruleType,
        isActive: true,
      },
    });
  }

  /**
   * Delete IP restriction rule
   */
  async deleteIpRestriction(tenantId: string, id: string) {
    const rule = await prisma.ipRestriction.findFirst({
      where: { id, tenantId },
    });
    if (!rule) {
      throw new NotFoundException('IP Restriction rule not found');
    }
    await prisma.ipRestriction.delete({
      where: { id },
    });
    return { success: true, message: 'IP restriction deleted' };
  }

  /**
   * Login-as / Impersonation token generation
   */
  async impersonateUser(tenantId: string, targetUserId: string) {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new NotFoundException('User to impersonate not found in this tenant');
    }

    const roles = user.roles.map((r: any) => r.role.name);
    const token = signSessionToken({
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
        avatar: user.avatar,
        roles,
      },
    };
  }

  // ── Data Retention Policies ──

  async getDataRetentionPolicies(tenantId: string) {
    return prisma.dataRetentionPolicy.findMany({
      where: { tenantId },
      orderBy: { entityType: 'asc' },
    });
  }

  async saveDataRetentionPolicy(
    tenantId: string,
    data: { entityType: string; retentionDays: number; action: string; isActive?: boolean },
  ) {
    const isActive = data.isActive ?? true;
    return prisma.dataRetentionPolicy.upsert({
      where: {
        tenantId_entityType: {
          tenantId,
          entityType: data.entityType,
        },
      },
      update: {
        retentionDays: data.retentionDays,
        action: data.action,
        isActive,
      },
      create: {
        tenantId,
        entityType: data.entityType,
        retentionDays: data.retentionDays,
        action: data.action,
        isActive,
      },
    });
  }

  async deleteDataRetentionPolicy(tenantId: string, id: string) {
    const policy = await prisma.dataRetentionPolicy.findFirst({
      where: { id, tenantId },
    });
    if (!policy) {
      throw new NotFoundException('Data retention policy not found');
    }
    await prisma.dataRetentionPolicy.delete({
      where: { id },
    });
    return { success: true, message: 'Policy deleted' };
  }

  // ── Compliance Report Generator ──

  async getComplianceReports(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'security.compliance-reports' } },
    });
    if (!setting) {
      return [];
    }
    return setting.value;
  }

  async generateComplianceReport(tenantId: string, userId: string) {
    // 1. Gather stats & configure checks
    const passwordPolicy = (await this.getPasswordPolicy(tenantId)) as any;
    const mfaSettings = (await this.getMfaSettings(tenantId)) as any;
    const ipRestrictions = await this.getIpRestrictions(tenantId);
    const activeSessions = await this.getActiveSessions(tenantId);

    // Evaluate scoring
    const checks = [
      {
        name: 'MFA Enforcement',
        passed: mfaSettings.enabled && mfaSettings.enforced,
        score: mfaSettings.enabled && mfaSettings.enforced ? 25 : mfaSettings.enabled ? 15 : 0,
        maxScore: 25,
        details: mfaSettings.enforced
          ? 'MFA is enabled and strictly enforced for all tenant accounts.'
          : mfaSettings.enabled
          ? 'MFA is enabled but not enforced for all accounts.'
          : 'MFA is completely disabled.',
      },
      {
        name: 'Password Complexity',
        passed: passwordPolicy.minLength >= 8 && passwordPolicy.requireUppercase && passwordPolicy.requireNumbers,
        score: (passwordPolicy.minLength >= 10 ? 10 : 5) + (passwordPolicy.requireUppercase ? 5 : 0) + (passwordPolicy.requireNumbers ? 5 : 0) + (passwordPolicy.requireSpecial ? 5 : 0),
        maxScore: 25,
        details: `Password policy: minimum length is ${passwordPolicy.minLength}. Complexity requirements (Uppercase: ${passwordPolicy.requireUppercase}, Numbers: ${passwordPolicy.requireNumbers}, Special Characters: ${passwordPolicy.requireSpecial}).`,
      },
      {
        name: 'Network Location Restrictions',
        passed: ipRestrictions.length > 0,
        score: ipRestrictions.length > 0 ? 25 : 10,
        maxScore: 25,
        details: ipRestrictions.length > 0
          ? `IP Restrictions active with ${ipRestrictions.length} rules.`
          : 'No IP restriction rules defined. System is open to any network location.',
      },
      {
        name: 'Session Lifespan & Active Tracking',
        passed: activeSessions.length > 0,
        score: 25,
        maxScore: 25,
        details: `Currently monitoring ${activeSessions.length} active sessions with revocation support.`,
      },
    ];

    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const report = {
      id: `rep-${Date.now()}`,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
      score: percentage,
      status: percentage >= 80 ? 'COMPLIANT' : percentage >= 50 ? 'WARNING' : 'NON_COMPLIANT',
      checks,
    };

    // Store in historical reports setting
    const currentReports = (await this.getComplianceReports(tenantId)) as any[];
    const updatedReports = [report, ...currentReports].slice(0, 50);

    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.compliance-reports' } },
      update: { value: updatedReports as any, category: 'security' },
      create: {
        tenantId,
        key: 'security.compliance-reports',
        value: updatedReports as any,
        category: 'security',
      },
    });

    return report;
  }
}
