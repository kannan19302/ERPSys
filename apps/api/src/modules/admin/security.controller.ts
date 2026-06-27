import { Controller, Get, Post, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SecurityService } from './security.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/security')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @ApiOperation({ summary: 'Get audit logs' })
  @Permissions('admin.read')
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
      action });
  }

  @ApiOperation({ summary: 'Get active sessions' })
  @Permissions('admin.read')
  @Get('sessions')
  @Permissions('admin.security.read')
  async getActiveSessions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getActiveSessions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Revoke session' })
  @Permissions('admin.delete')
  @Delete('sessions/:id')
  @Permissions('admin.security.update')
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.revokeSession(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get password policy' })
  @Permissions('admin.read')
  @Get('password-policy')
  @Permissions('admin.security.read')
  async getPasswordPolicy(@Req() req: AuthenticatedRequest) {
    return this.securityService.getPasswordPolicy(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save password policy' })
  @Permissions('admin.create')
  @Post('password-policy')
  @Permissions('admin.security.update')
  async savePasswordPolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSpecial: boolean;
      maxAge: number;
    },
  ) {
    return this.securityService.savePasswordPolicy(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get sso configs' })
  @Permissions('admin.read')
  @Get('sso')
  @Permissions('admin.security.read')
  async getSsoConfigs(@Req() req: AuthenticatedRequest) {
    return this.securityService.getSsoConfigs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save sso config' })
  @Permissions('admin.create')
  @Post('sso')
  @Permissions('admin.security.update')
  async saveSsoConfig(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: {
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
    return this.securityService.saveSsoConfig(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get mfa settings' })
  @Permissions('admin.read')
  @Get('mfa')
  @Permissions('admin.security.read')
  async getMfaSettings(@Req() req: AuthenticatedRequest) {
    return this.securityService.getMfaSettings(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save mfa settings' })
  @Permissions('admin.create')
  @Post('mfa')
  @Permissions('admin.security.update')
  async saveMfaSettings(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { enabled: boolean; mfaType: string; enforced: boolean },
  ) {
    return this.securityService.saveMfaSettings(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Get ip restrictions' })
  @Permissions('admin.read')
  @Get('ip-restrictions')
  @Permissions('admin.security.read')
  async getIpRestrictions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getIpRestrictions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create ip restriction' })
  @Permissions('admin.create')
  @Post('ip-restrictions')
  @Permissions('admin.security.update')
  async createIpRestriction(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { ipRange: string; description?: string; ruleType: string },
  ) {
    return this.securityService.createIpRestriction(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Delete ip restriction' })
  @Permissions('admin.delete')
  @Delete('ip-restrictions/:id')
  @Permissions('admin.security.update')
  async deleteIpRestriction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.deleteIpRestriction(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Impersonate user' })
  @Permissions('admin.create')
  @Post('impersonate/:userId')
  @Permissions('admin.security.update')
  async impersonateUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
  ) {
    return this.securityService.impersonateUser(req.user.tenantId, targetUserId);
  }

  // ── Data Retention Policies ──

  @ApiOperation({ summary: 'Get data retention policies' })
  @Permissions('admin.read')
  @Get('data-retention')
  @Permissions('admin.security.read')
  async getDataRetentionPolicies(@Req() req: AuthenticatedRequest) {
    return this.securityService.getDataRetentionPolicies(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save data retention policy' })
  @Permissions('admin.create')
  @Post('data-retention')
  @Permissions('admin.security.update')
  async saveDataRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { entityType: string; retentionDays: number; action: string; isActive?: boolean },
  ) {
    return this.securityService.saveDataRetentionPolicy(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Delete data retention policy' })
  @Permissions('admin.delete')
  @Delete('data-retention/:id')
  @Permissions('admin.security.update')
  async deleteDataRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.deleteDataRetentionPolicy(req.user.tenantId, id);
  }

  // ── Compliance Reports ──

  @ApiOperation({ summary: 'Get compliance reports' })
  @Permissions('admin.read')
  @Get('compliance/reports')
  @Permissions('admin.security.read')
  async getComplianceReports(@Req() req: AuthenticatedRequest) {
    return this.securityService.getComplianceReports(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Generate compliance report' })
  @Permissions('admin.create')
  @Post('compliance/generate')
  @Permissions('admin.security.update')
  async generateComplianceReport(@Req() req: AuthenticatedRequest) {
    return this.securityService.generateComplianceReport(req.user.tenantId, req.user.userId);
  }
}
