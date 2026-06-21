import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DataQualityService } from './data-quality.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';

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

@Controller('admin/data-quality')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DataQualityController {
  constructor(private readonly dataQualityService: DataQualityService) {}

  @Post('scan/:entityType')
  @Permissions('admin.data-quality.update')
  async scanForDuplicates(
    @Req() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
  ) {
    return this.dataQualityService.scanForDuplicates(req.user.tenantId, entityType);
  }

  @Get('duplicates')
  @Permissions('admin.data-quality.read')
  async getDuplicateSets(
    @Req() req: AuthenticatedRequest,
    @Query('entityType') entityType?: string,
    @Query('status') status?: string,
  ) {
    return this.dataQualityService.getDuplicateSets(
      req.user.tenantId,
      entityType,
      status || 'PENDING',
    );
  }

  @Post('merge')
  @Permissions('admin.data-quality.update')
  async mergeRecords(
    @Req() req: AuthenticatedRequest,
    @Body() body: { setId: string; masterId: string },
  ) {
    return this.dataQualityService.mergeRecords(req.user.tenantId, body.setId, body.masterId);
  }

  @Post(':id/dismiss')
  @Permissions('admin.data-quality.update')
  async dismissSet(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.dataQualityService.dismissSet(req.user.tenantId, id, req.user.userId);
  }
}
