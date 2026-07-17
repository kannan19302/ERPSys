import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DevopsService } from './devops.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('devops')
@ApiBearerAuth()
@Controller('admin/devops')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DevopsController {
  constructor(private readonly devopsService: DevopsService) {}

  @ApiOperation({ summary: 'Get metrics' })
  @Get('metrics')
  @Permissions('admin.devops.read')
  async getMetrics() {
    return this.devopsService.getSystemMetrics();
  }

  @ApiOperation({ summary: 'Get recent errors' })
  @Get('errors')
  @Permissions('admin.devops.read')
  async getRecentErrors(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    return this.devopsService.getRecentErrors(tenantId);
  }

  @ApiOperation({ summary: 'Get integrations' })
  @Get('integrations')
  @Permissions('admin.devops.read')
  async getIntegrations() {
    return this.devopsService.getIntegrationLinks();
  }
}
