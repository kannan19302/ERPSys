import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SecurityService } from './security.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/security')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

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

  @Get('sessions')
  @Permissions('admin.security.read')
  async getActiveSessions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getActiveSessions(req.user.tenantId);
  }

  @Delete('sessions/:id')
  @Permissions('admin.security.update')
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.revokeSession(req.user.tenantId, id);
  }

  @Get('password-policy')
  @Permissions('admin.security.read')
  async getPasswordPolicy(@Req() req: AuthenticatedRequest) {
    return this.securityService.getPasswordPolicy(req.user.tenantId);
  }

  @Post('password-policy')
  @Permissions('admin.security.update')
  async savePasswordPolicy(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSpecial: boolean;
      maxAge: number;
    },
  ) {
    return this.securityService.savePasswordPolicy(req.user.tenantId, body);
  }

  @Get('sso')
  @Permissions('admin.security.read')
  async getSsoConfigs(@Req() req: AuthenticatedRequest) {
    return this.securityService.getSsoConfigs(req.user.tenantId);
  }

  @Post('sso')
  @Permissions('admin.security.update')
  async saveSsoConfig(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
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

  @Get('mfa')
  @Permissions('admin.security.read')
  async getMfaSettings(@Req() req: AuthenticatedRequest) {
    return this.securityService.getMfaSettings(req.user.tenantId);
  }

  @Post('mfa')
  @Permissions('admin.security.update')
  async saveMfaSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: { enabled: boolean; mfaType: string; enforced: boolean },
  ) {
    return this.securityService.saveMfaSettings(req.user.tenantId, body);
  }

  @Get('ip-restrictions')
  @Permissions('admin.security.read')
  async getIpRestrictions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getIpRestrictions(req.user.tenantId);
  }

  @Post('ip-restrictions')
  @Permissions('admin.security.update')
  async createIpRestriction(
    @Req() req: AuthenticatedRequest,
    @Body() body: { ipRange: string; description?: string; ruleType: string },
  ) {
    return this.securityService.createIpRestriction(req.user.tenantId, body);
  }

  @Delete('ip-restrictions/:id')
  @Permissions('admin.security.update')
  async deleteIpRestriction(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.deleteIpRestriction(req.user.tenantId, id);
  }

  @Post('impersonate/:userId')
  @Permissions('admin.security.update')
  async impersonateUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
  ) {
    return this.securityService.impersonateUser(req.user.tenantId, targetUserId);
  }

  // ── Data Retention Policies ──

  @Get('data-retention')
  @Permissions('admin.security.read')
  async getDataRetentionPolicies(@Req() req: AuthenticatedRequest) {
    return this.securityService.getDataRetentionPolicies(req.user.tenantId);
  }

  @Post('data-retention')
  @Permissions('admin.security.update')
  async saveDataRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @Body() body: { entityType: string; retentionDays: number; action: string; isActive?: boolean },
  ) {
    return this.securityService.saveDataRetentionPolicy(req.user.tenantId, body);
  }

  @Delete('data-retention/:id')
  @Permissions('admin.security.update')
  async deleteDataRetentionPolicy(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.securityService.deleteDataRetentionPolicy(req.user.tenantId, id);
  }

  // ── Compliance Reports ──

  @Get('compliance/reports')
  @Permissions('admin.security.read')
  async getComplianceReports(@Req() req: AuthenticatedRequest) {
    return this.securityService.getComplianceReports(req.user.tenantId);
  }

  @Post('compliance/generate')
  @Permissions('admin.security.update')
  async generateComplianceReport(@Req() req: AuthenticatedRequest) {
    return this.securityService.generateComplianceReport(req.user.tenantId, req.user.userId);
  }
}
