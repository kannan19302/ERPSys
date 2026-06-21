import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DevopsService } from './devops.service';

@Controller('admin/devops')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DevopsController {
  constructor(private readonly devopsService: DevopsService) {}

  @Get('metrics')
  @Permissions('admin.devops.read')
  async getMetrics() {
    return this.devopsService.getSystemMetrics();
  }

  @Get('errors')
  @Permissions('admin.devops.read')
  async getRecentErrors(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.devopsService.getRecentErrors(tenantId);
  }

  @Get('integrations')
  @Permissions('admin.devops.read')
  async getIntegrations() {
    return this.devopsService.getIntegrationLinks();
  }
}
