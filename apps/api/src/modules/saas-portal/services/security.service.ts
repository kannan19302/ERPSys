import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { signSessionToken } from '@unerp/auth';
import { hasPermission } from '@unerp/shared';
import * as crypto from 'node:crypto';

/**
 * Security + API-key management as consumed from the SaaS Portal home.
 * Consolidates `/admin/security` (audit logs, sessions, password policy, SSO,
 * MFA, IP restrictions, impersonation, data retention, compliance reports —
 * `modules/admin/security.service.ts`) and the API-key half of
 * `/saas/security` (`modules/saas/api-keys.service.ts` + the parts of
 * `modules/saas/security.controller.ts` backed by real Prisma data) into one
 * `/saas-portal/security` surface.
 *
 * DELEGATE-VS-DUPLICATE: independent implementation against the same Prisma
 * models, not a cross-module delegate — `scripts/check-module-boundaries.mjs`
 * / `.dependency-cruiser.cjs` hard-block importing `modules/admin` or
 * `modules/saas` services from here, and there is no event/port abstraction
 * for this read-heavy admin data yet (same rationale as
 * org-hierarchy/gdpr-compliance/audit-log). `saas/security.controller.ts`
 * itself is mostly a thin, partly-hardcoded wrapper (hardcoded session list,
 * MFA placeholders) around `saas/api-keys.service.ts` +
 * `saas/audit-log.service.ts` — the real logic worth consolidating from that
 * side is the `TenantApiKey`-backed API key CRUD, which is reproduced here
 * directly against `prisma.tenantApiKey`. The comprehensive, Prisma-backed
 * session/SSO/MFA/IP-restriction/compliance logic already lives in
 * `modules/admin/security.service.ts`; that is the implementation mirrored
 * here (webhook signature verification in `saas/billing-webhook.controller.ts`
 * is untouched and out of scope).
 */
@Injectable()
export class SaasPortalSecurityService {
  private readonly KEY_PREFIX = 'uerp_';

  /* ── Audit Logs ─────────────────────────────────── */

  async getAuditLogs(
    tenantId: string,
    opts: { page?: number; limit?: number; search?: string; severity?: string; action?: string },
  ) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (opts.severity && opts.severity !== 'ALL') {
      where.changes = { path: ['severity'], equals: opts.severity };
    }
    if (opts.action) where.action = opts.action;
    if (opts.search) {
      where.OR = [
        { action: { contains: opts.search, mode: 'insensitive' } },
        { entityType: { contains: opts.search, mode: 'insensitive' } },
        { entityId: { contains: opts.search, mode: 'insensitive' } },
        { userId: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({ where: where as any, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.count({ where: where as any }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /* ── Sessions ───────────────────────────────────── */

  async getActiveSessions(tenantId: string) {
    return prisma.userSession.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async revokeSession(tenantId: string, sessionId: string) {
    const session = await prisma.userSession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Session not found');
    await prisma.userSession.delete({ where: { id: sessionId } });
    return { success: true, message: 'Session revoked' };
  }

  /* ── Password Policy ────────────────────────────── */

  async getPasswordPolicy(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'security.password-policy' } },
    });
    if (!setting) {
      return { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: false, maxAge: 90 };
    }
    return setting.value;
  }

  async savePasswordPolicy(
    tenantId: string,
    policy: { minLength: number; requireUppercase: boolean; requireNumbers: boolean; requireSpecial: boolean; maxAge: number },
  ) {
    return prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.password-policy' } },
      update: { value: policy as any, category: 'security' },
      create: { tenantId, key: 'security.password-policy', value: policy as any, category: 'security' },
    });
  }

  /* ── SSO ────────────────────────────────────────── */

  async getSsoConfigs(tenantId: string) {
    return prisma.ssoConfig.findMany({ where: { tenantId } });
  }

  async saveSsoConfig(
    tenantId: string,
    data: {
      providerType: string; name: string; clientId?: string; clientSecret?: string; issuerUrl?: string;
      authorizationUrl?: string; tokenUrl?: string; userInfoUrl?: string; samlMetadataUrl?: string;
      samlMetadataXml?: string; samlEntryPoint?: string; samlIssuer?: string; samlCert?: string; isActive?: boolean;
    },
  ) {
    return prisma.ssoConfig.upsert({
      where: { tenantId_providerType: { tenantId, providerType: data.providerType } },
      update: { ...data, isActive: data.isActive ?? true },
      create: { tenantId, ...data, isActive: data.isActive ?? true },
    });
  }

  /* ── MFA ────────────────────────────────────────── */

  async getMfaSettings(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'security.mfa-settings' } },
    });
    if (!setting) return { enabled: false, mfaType: 'TOTP', enforced: false };
    return setting.value;
  }

  async saveMfaSettings(tenantId: string, mfa: { enabled: boolean; mfaType: string; enforced: boolean }) {
    return prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.mfa-settings' } },
      update: { value: mfa as any, category: 'security' },
      create: { tenantId, key: 'security.mfa-settings', value: mfa as any, category: 'security' },
    });
  }

  /* ── IP Restrictions ────────────────────────────── */

  async getIpRestrictions(tenantId: string) {
    return prisma.ipRestriction.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createIpRestriction(tenantId: string, data: { ipRange: string; description?: string; ruleType: string }) {
    const existing = await prisma.ipRestriction.findUnique({
      where: { tenantId_ipRange: { tenantId, ipRange: data.ipRange } },
    });
    if (existing) throw new BadRequestException('IP range rule already exists');
    return prisma.ipRestriction.create({
      data: { tenantId, ipRange: data.ipRange, description: data.description, ruleType: data.ruleType, isActive: true },
    });
  }

  async deleteIpRestriction(tenantId: string, id: string) {
    const rule = await prisma.ipRestriction.findFirst({ where: { id, tenantId } });
    if (!rule) throw new NotFoundException('IP Restriction rule not found');
    await prisma.ipRestriction.delete({ where: { id } });
    return { success: true, message: 'IP restriction deleted' };
  }

  /* ── Impersonation ──────────────────────────────── */

  async impersonateUser(tenantId: string, targetUserId: string) {
    const user = await prisma.user.findFirst({
      where: { id: targetUserId, tenantId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User to impersonate not found in this tenant');

    const roles = user.roles.map((r: any) => r.role.name);
    const token = signSessionToken({ userId: user.id, tenantId: user.tenantId, email: user.email, firstName: user.firstName, lastName: user.lastName, roles });

    return {
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar, roles },
    };
  }

  /* ── Data Retention Policies ─────────────────────── */

  async getDataRetentionPolicies(tenantId: string) {
    return prisma.dataRetentionPolicy.findMany({ where: { tenantId }, orderBy: { entityType: 'asc' } });
  }

  async saveDataRetentionPolicy(tenantId: string, data: { entityType: string; retentionDays: number; action: string; isActive?: boolean }) {
    const isActive = data.isActive ?? true;
    return prisma.dataRetentionPolicy.upsert({
      where: { tenantId_entityType: { tenantId, entityType: data.entityType } },
      update: { retentionDays: data.retentionDays, action: data.action, isActive },
      create: { tenantId, entityType: data.entityType, retentionDays: data.retentionDays, action: data.action, isActive },
    });
  }

  async deleteDataRetentionPolicy(tenantId: string, id: string) {
    const policy = await prisma.dataRetentionPolicy.findFirst({ where: { id, tenantId } });
    if (!policy) throw new NotFoundException('Data retention policy not found');
    await prisma.dataRetentionPolicy.delete({ where: { id } });
    return { success: true, message: 'Policy deleted' };
  }

  /* ── Compliance Reports ─────────────────────────── */

  async getComplianceReports(tenantId: string) {
    const setting = await prisma.setting.findUnique({ where: { tenantId_key: { tenantId, key: 'security.compliance-reports' } } });
    if (!setting) return [];
    return setting.value;
  }

  async generateComplianceReport(tenantId: string, userId: string) {
    const passwordPolicy = (await this.getPasswordPolicy(tenantId)) as any;
    const mfaSettings = (await this.getMfaSettings(tenantId)) as any;
    const ipRestrictions = await this.getIpRestrictions(tenantId);
    const activeSessions = await this.getActiveSessions(tenantId);

    const checks = [
      {
        name: 'MFA Enforcement',
        passed: mfaSettings.enabled && mfaSettings.enforced,
        score: mfaSettings.enabled && mfaSettings.enforced ? 25 : mfaSettings.enabled ? 15 : 0,
        maxScore: 25,
        details: mfaSettings.enforced ? 'MFA is enabled and strictly enforced for all tenant accounts.' : mfaSettings.enabled ? 'MFA is enabled but not enforced for all accounts.' : 'MFA is completely disabled.',
      },
      {
        name: 'Password Complexity',
        passed: passwordPolicy.minLength >= 8 && passwordPolicy.requireUppercase && passwordPolicy.requireNumbers,
        score: (passwordPolicy.minLength >= 10 ? 10 : 5) + (passwordPolicy.requireUppercase ? 5 : 0) + (passwordPolicy.requireNumbers ? 5 : 0) + (passwordPolicy.requireSpecial ? 5 : 0),
        maxScore: 25,
        details: `Password policy: minimum length is ${passwordPolicy.minLength}.`,
      },
      {
        name: 'Network Location Restrictions',
        passed: ipRestrictions.length > 0,
        score: ipRestrictions.length > 0 ? 25 : 10,
        maxScore: 25,
        details: ipRestrictions.length > 0 ? `IP Restrictions active with ${ipRestrictions.length} rules.` : 'No IP restriction rules defined.',
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

    const currentReports = (await this.getComplianceReports(tenantId)) as any[];
    const updatedReports = [report, ...currentReports].slice(0, 50);
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'security.compliance-reports' } },
      update: { value: updatedReports as any, category: 'security' },
      create: { tenantId, key: 'security.compliance-reports', value: updatedReports as any, category: 'security' },
    });

    return report;
  }

  /* ── API Keys (TenantApiKey) ─────────────────────── */

  private generateApiKey(): { fullKey: string; prefix: string; hash: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    const fullKey = `${this.KEY_PREFIX}${raw}`;
    const prefix = fullKey.substring(0, 10);
    const hash = crypto.createHash('sha256').update(fullKey).digest('hex');
    return { fullKey, prefix, hash };
  }

  async listApiKeys(tenantId: string) {
    const keys = await prisma.tenantApiKey.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      permissions: key.permissions,
      isActive: key.isActive,
      createdAt: key.createdAt,
    }));
  }

  /**
   * Resolve the caller's own effective permission set from their assigned
   * roles (same query/parse pattern as RbacGuard). No API-key-auth guard in
   * the codebase currently consumes `TenantApiKey.permissions` for
   * authorization (checked: only `saas/tenant-analytics.service.ts` reads it,
   * for reporting, not auth) — this clamp is added defensively regardless, so
   * a caller can never mint a key with more reach than they themselves have.
   */
  private async resolveCallerPermissions(tenantId: string, userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
    const perms: string[] = [];
    for (const ur of userRoles) {
      if (ur.role.tenantId !== tenantId) continue;
      try {
        const parsed = JSON.parse(ur.role.permissions as string);
        if (Array.isArray(parsed)) perms.push(...parsed);
      } catch {
        // Skip malformed role permissions
      }
    }
    return perms;
  }

  async createApiKey(
    tenantId: string,
    userId: string,
    dto: { name: string; permissions?: string[]; allowedIps?: string[]; expiresAt?: string },
  ) {
    const existing = await prisma.tenantApiKey.findUnique({ where: { tenantId_name: { tenantId, name: dto.name } } });
    if (existing) throw new BadRequestException('API key with this name already exists');

    if (dto.permissions && dto.permissions.length > 0) {
      const callerPermissions = await this.resolveCallerPermissions(tenantId, userId);
      const excess = dto.permissions.filter((p) => !hasPermission(callerPermissions, p));
      if (excess.length > 0) {
        throw new ForbiddenException(`Cannot grant permission(s) you do not hold: ${excess.join(', ')}`);
      }
    }

    const { fullKey, prefix, hash } = this.generateApiKey();
    const key = await prisma.tenantApiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyPrefix: prefix,
        keyHash: hash,
        permissions: dto.permissions ?? [],
        ipWhitelist: dto.allowedIps ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return { id: key.id, name: key.name, fullKey, keyPrefix: prefix, permissions: key.permissions, expiresAt: key.expiresAt, createdAt: key.createdAt };
  }

  async revokeApiKey(tenantId: string, id: string) {
    const key = await prisma.tenantApiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundException('API key not found');
    return prisma.tenantApiKey.update({ where: { id, tenantId }, data: { isActive: false } });
  }

  async getSecurityScore(tenantId: string) {
    const keys = await this.listApiKeys(tenantId);
    const mfa = (await this.getMfaSettings(tenantId)) as any;
    const ipRestrictions = await this.getIpRestrictions(tenantId);
    const expiredKeys = keys.filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date()).length;
    const score = Math.max(
      0,
      (mfa.enabled ? 25 : 0) + (expiredKeys === 0 ? 20 : 0) + (keys.length <= 5 ? 15 : 0) + (ipRestrictions.length > 0 ? 20 : 0) + 20,
    );
    return {
      score,
      checks: {
        mfaEnabled: { pass: !!mfa.enabled, weight: 25 },
        noExpiredKeys: { pass: expiredKeys === 0, weight: 20 },
        apiKeyCount: { pass: keys.length <= 5, weight: 15 },
        ipRestrictions: { pass: ipRestrictions.length > 0, weight: 20 },
        strongPasswordPolicy: { pass: true, weight: 20 },
      },
    };
  }
}
