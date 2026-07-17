import {
  Controller, Get, Post, Param, Query,
  UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { DataQualityService } from './data-quality.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { z } from 'zod';

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

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/data-quality')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DataQualityController {
  constructor(private readonly dataQualityService: DataQualityService) {}

  @ApiOperation({ summary: 'Scan for duplicates' })
  @Post('scan/:entityType')
  @Permissions('admin.data-quality.update')
  async scanForDuplicates(
    @Req() req: AuthenticatedRequest,
    @Param('entityType') entityType: string,
  ) {
    return this.dataQualityService.scanForDuplicates(req.user.tenantId, entityType);
  }

  @ApiOperation({ summary: 'Get duplicate sets' })
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

  @ApiOperation({ summary: 'Merge records' })
  @Post('merge')
  @Permissions('admin.data-quality.update')
  async mergeRecords(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: { setId: string; masterId: string },
  ) {
    return this.dataQualityService.mergeRecords(req.user.tenantId, body.setId, body.masterId);
  }

  @ApiOperation({ summary: 'Dismiss set' })
  @Post(':id/dismiss')
  @Permissions('admin.data-quality.update')
  async dismissSet(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.dataQualityService.dismissSet(req.user.tenantId, id, req.user.userId);
  }
}
