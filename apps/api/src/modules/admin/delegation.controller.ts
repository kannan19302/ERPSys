import {
  Controller, Get, Post, Patch, Param,
  UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { DelegationService } from './delegation.service';
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
@Controller('admin/delegations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DelegationController {
  constructor(private readonly delegationService: DelegationService) {}

  @ApiOperation({ summary: 'List' })
  @Permissions('admin.read')
  @Get()
  @Permissions('admin.delegations.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.delegationService.list(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create' })
  @Permissions('admin.create')
  @Post()
  @Permissions('admin.delegations.create')
  async create(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) body: {
      delegatorId: string;
      delegateId: string;
      type: string;
      workflowId?: string;
      reason?: string;
      startDate: string;
      endDate?: string;
    },
  ) {
    return this.delegationService.create(req.user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update' })
  @Permissions('admin.update')
  @Patch(':id')
  @Permissions('admin.delegations.update')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) body: Record<string, any>,
  ) {
    return this.delegationService.update(req.user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Revoke' })
  @Permissions('admin.create')
  @Post(':id/revoke')
  @Permissions('admin.delegations.update')
  async revoke(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.delegationService.revoke(req.user.tenantId, id);
  }
}
