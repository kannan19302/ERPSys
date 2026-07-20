import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { SaasPortalService } from './saas-portal.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; tenantId: string; role: string; email: string };
}

@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal')
@UseGuards(JwtAuthGuard, RbacGuard)
export class SaasPortalController {
  constructor(private readonly saasPortalService: SaasPortalService) {}

  @ApiOperation({ summary: 'Get platform overview (tenants, users, apps, revenue) — platform operator only, cross-tenant data' })
  @Permissions('platform.overview.read')
  @Get('overview')
  async getPlatformOverview() {
    return this.saasPortalService.getPlatformOverview();
  }

  @ApiOperation({ summary: 'Get installed apps for the active tenant (read-only)' })
  @Permissions('saas.read')
  @Get('installed-apps')
  async getInstalledApps(@Req() req: AuthenticatedRequest) {
    return this.saasPortalService.getInstalledApps(req.user.tenantId);
  }
}