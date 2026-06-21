import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SecurityService } from './security.service';

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
  async getActiveSessions(@Req() req: AuthenticatedRequest) {
    return this.securityService.getActiveSessions(req.user.tenantId);
  }

  @Get('password-policy')
  async getPasswordPolicy(@Req() req: AuthenticatedRequest) {
    return this.securityService.getPasswordPolicy(req.user.tenantId);
  }

  @Post('password-policy')
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
}
