import { Controller, Get, Post, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { SaasPortalSecurityService } from '../services/security.service';
import { SaasPortalAuditLogService } from '../services/audit-log.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
  ip: string;
}

const passwordPolicySchema = z.object({
  minLength: z.number().int().min(4).max(128),
  requireUppercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecial: z.boolean(),
  maxAge: z.number().int().min(0),
});

const ssoConfigSchema = z.object({
  providerType: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  issuerUrl: z.string().optional(),
  authorizationUrl: z.string().optional(),
  tokenUrl: z.string().optional(),
  userInfoUrl: z.string().optional(),
  samlMetadataUrl: z.string().optional(),
  samlMetadataXml: z.string().optional(),
  samlEntryPoint: z.string().optional(),
  samlIssuer: z.string().optional(),
  samlCert: z.string().optional(),
  isActive: z.boolean().optional(),
});

const mfaSettingsSchema = z.object({
  enabled: z.boolean(),
  mfaType: z.string().min(1).max(50),
  enforced: z.boolean(),
});

const ipRestrictionSchema = z.object({
  ipRange: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ruleType: z.enum(['ALLOW', 'DENY']),
});

const dataRetentionPolicySchema = z.object({
  entityType: z.string().min(1).max(100),
  retentionDays: z.number().int().min(1),
  action: z.enum(['DELETE', 'ANONYMIZE', 'ARCHIVE']),
  isActive: z.boolean().optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).default([]),
  allowedIps: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * SaaS Portal home for security + API keys. Consolidates `/admin/security`
 * (audit logs, sessions, password policy, SSO, MFA, IP restrictions,
 * impersonation, data retention, compliance reports) and the API-key concern
 * of `/saas/security` into `/saas-portal/security`. Independent
 * implementation, not a cross-module delegate — see security.service.ts
 * header for the delegate-vs-duplicate decision. Reuses the existing
 * `admin.security.*` and `admin.api-keys.*` permission codes already
 * registered in packages/shared/src/permissions/registry.ts (the latter were
 * registered but had no controller consuming them — this fills that gap
 * rather than minting a new permission namespace).
 *
 * Every mutating endpoint below writes an explicit audit-log entry via
 * `SaasPortalAuditLogService.logAction` (the `@TrackChanges` +
 * `ChangeHistoryInterceptor` convention used by sibling controllers assumes a
 * single Prisma entity is returned for before/after diffing; several
 * mutations here — impersonation, session revocation, key issuance — don't
 * fit that shape, so the explicit audit-log call is used uniformly across
 * this controller instead).
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/security')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalSecurityController {
  constructor(
    private readonly securityService: SaasPortalSecurityService,
    private readonly auditLogService: SaasPortalAuditLogService,
  ) {}

  @ApiOperation({ summary: 'Get audit logs' })
  @Get('audit-logs')
  @Permissions('admin.security.read')
  async getAuditLogs(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('severity') severity?: string,
    @Query('action') action?: string,
  ) {
    return this.securityService.getAuditLogs(req.user.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      severity,
      action,
    });
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @Get('sessions')
  @Permissions('admin.security.read')
  async getActiveSessions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getActiveSessions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Revoke session' })
  @Delete('sessions/:id')
  @Permissions('admin.security.update')
  async revokeSession(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.securityService.revokeSession(req.user.tenantId, id);
    await this.auditLogService.logAction(req.user.tenantId, 'SESSION_REVOKE', 'Session', id, { revokedBy: req.user.userId }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Get password policy' })
  @Get('password-policy')
  @Permissions('admin.security.read')
  async getPasswordPolicy(@Req() req: AuthenticatedRequest) {
    return this.securityService.getPasswordPolicy(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save password policy' })
  @Post('password-policy')
  @Permissions('admin.security.update')
  async savePasswordPolicy(@Req() req: AuthenticatedRequest, @ZodBody(passwordPolicySchema) body: z.infer<typeof passwordPolicySchema>) {
    const result = await this.securityService.savePasswordPolicy(req.user.tenantId, body);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'PasswordPolicy', req.user.tenantId, { updatedBy: req.user.userId, ...body }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Get sso configs' })
  @Get('sso')
  @Permissions('admin.security.read')
  async getSsoConfigs(@Req() req: AuthenticatedRequest) {
    return this.securityService.getSsoConfigs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save sso config' })
  @Post('sso')
  @Permissions('admin.security.update')
  async saveSsoConfig(@Req() req: AuthenticatedRequest, @ZodBody(ssoConfigSchema) body: z.infer<typeof ssoConfigSchema>) {
    const result = await this.securityService.saveSsoConfig(req.user.tenantId, body);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'SsoConfig', body.providerType, { updatedBy: req.user.userId, providerType: body.providerType, name: body.name }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Get mfa settings' })
  @Get('mfa')
  @Permissions('admin.security.read')
  async getMfaSettings(@Req() req: AuthenticatedRequest) {
    return this.securityService.getMfaSettings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save mfa settings' })
  @Post('mfa')
  @Permissions('admin.security.update')
  async saveMfaSettings(@Req() req: AuthenticatedRequest, @ZodBody(mfaSettingsSchema) body: z.infer<typeof mfaSettingsSchema>) {
    const result = await this.securityService.saveMfaSettings(req.user.tenantId, body);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'MfaSettings', req.user.tenantId, { updatedBy: req.user.userId, ...body }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Get ip restrictions' })
  @Get('ip-restrictions')
  @Permissions('admin.security.read')
  async getIpRestrictions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getIpRestrictions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create ip restriction' })
  @Post('ip-restrictions')
  @Permissions('admin.security.update')
  async createIpRestriction(@Req() req: AuthenticatedRequest, @ZodBody(ipRestrictionSchema) body: z.infer<typeof ipRestrictionSchema>) {
    const result = await this.securityService.createIpRestriction(req.user.tenantId, body);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'IpRestriction', result.id, { createdBy: req.user.userId, ...body }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Delete ip restriction' })
  @Delete('ip-restrictions/:id')
  @Permissions('admin.security.update')
  async deleteIpRestriction(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.securityService.deleteIpRestriction(req.user.tenantId, id);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'IpRestriction', id, { deletedBy: req.user.userId }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Impersonate user' })
  @Post('impersonate/:userId')
  @Permissions('admin.security.update')
  async impersonateUser(@Req() req: AuthenticatedRequest, @Param('userId') targetUserId: string) {
    const result = await this.securityService.impersonateUser(req.user.tenantId, targetUserId);
    await this.auditLogService.logAction(
      req.user.tenantId,
      'USER_IMPERSONATE',
      'User',
      targetUserId,
      { impersonatedBy: req.user.userId, impersonatedByEmail: req.user.email, targetUserId },
      req.ip,
    );
    return result;
  }

  @ApiOperation({ summary: 'Get data retention policies' })
  @Get('data-retention')
  @Permissions('admin.security.read')
  async getDataRetentionPolicies(@Req() req: AuthenticatedRequest) {
    return this.securityService.getDataRetentionPolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save data retention policy' })
  @Post('data-retention')
  @Permissions('admin.security.update')
  async saveDataRetentionPolicy(@Req() req: AuthenticatedRequest, @ZodBody(dataRetentionPolicySchema) body: z.infer<typeof dataRetentionPolicySchema>) {
    const result = await this.securityService.saveDataRetentionPolicy(req.user.tenantId, body);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'DataRetentionPolicy', body.entityType, { updatedBy: req.user.userId, ...body }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Delete data retention policy' })
  @Delete('data-retention/:id')
  @Permissions('admin.security.update')
  async deleteDataRetentionPolicy(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.securityService.deleteDataRetentionPolicy(req.user.tenantId, id);
    await this.auditLogService.logAction(req.user.tenantId, 'SECURITY_UPDATE', 'DataRetentionPolicy', id, { deletedBy: req.user.userId }, req.ip);
    return result;
  }

  @ApiOperation({ summary: 'Get compliance reports' })
  @Get('compliance/reports')
  @Permissions('admin.security.read')
  async getComplianceReports(@Req() req: AuthenticatedRequest) {
    return this.securityService.getComplianceReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Generate compliance report' })
  @Post('compliance/generate')
  @Permissions('admin.security.update')
  async generateComplianceReport(@Req() req: AuthenticatedRequest) {
    return this.securityService.generateComplianceReport(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get security score' })
  @Get('score')
  @Permissions('admin.security.read')
  async getSecurityScore(@Req() req: AuthenticatedRequest) {
    return this.securityService.getSecurityScore(req.user.tenantId);
  }

  // ── API Keys ──

  @ApiOperation({ summary: 'List API keys' })
  @Get('api-keys')
  @Permissions('admin.api-keys.read')
  async listApiKeys(@Req() req: AuthenticatedRequest) {
    return this.securityService.listApiKeys(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create API key' })
  @Post('api-keys')
  @Permissions('admin.api-keys.create')
  async createApiKey(@Req() req: AuthenticatedRequest, @ZodBody(createApiKeySchema) body: z.infer<typeof createApiKeySchema>) {
    const result = await this.securityService.createApiKey(req.user.tenantId, req.user.userId, body);
    await this.auditLogService.logAction(
      req.user.tenantId,
      'API_KEY_CREATE',
      'TenantApiKey',
      result.id,
      { createdBy: req.user.userId, name: body.name, permissions: body.permissions },
      req.ip,
    );
    return result;
  }

  @ApiOperation({ summary: 'Revoke API key' })
  @Delete('api-keys/:id')
  @Permissions('admin.api-keys.delete')
  async revokeApiKey(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.securityService.revokeApiKey(req.user.tenantId, id);
    await this.auditLogService.logAction(req.user.tenantId, 'API_KEY_REVOKE', 'TenantApiKey', id, { revokedBy: req.user.userId }, req.ip);
    return result;
  }
}
