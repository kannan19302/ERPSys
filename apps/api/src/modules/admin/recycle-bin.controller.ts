import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RecycleBinService } from './recycle-bin.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

@Controller('admin/recycle-bin')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  @Get()
  @Permissions('admin.recycle-bin.read')
  async getItems(
    @Req() req: AuthenticatedRequest,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recycleBinService.getItems(
      req.user.tenantId,
      entityType,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('stats')
  @Permissions('admin.recycle-bin.read')
  async getStats(@Req() req: AuthenticatedRequest) {
    return this.recycleBinService.getStats(req.user.tenantId);
  }

  @Post(':id/restore')
  @Permissions('admin.recycle-bin.update')
  async restoreItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.recycleBinService.restoreItem(req.user.tenantId, id, req.user.userId);
  }

  @Delete(':id')
  @Permissions('admin.recycle-bin.delete')
  async permanentDelete(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.recycleBinService.permanentDelete(req.user.tenantId, id);
  }

  @Post('purge')
  @Permissions('admin.recycle-bin.delete')
  async purgeAll(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { entityType?: string },
  ) {
    return this.recycleBinService.purgeAll(req.user.tenantId, dto.entityType);
  }
}
