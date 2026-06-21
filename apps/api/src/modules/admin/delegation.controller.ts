import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DelegationService } from './delegation.service';
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

@Controller('admin/delegations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class DelegationController {
  constructor(private readonly delegationService: DelegationService) {}

  @Get()
  @Permissions('admin.delegations.read')
  async list(@Req() req: AuthenticatedRequest) {
    return this.delegationService.list(req.user.tenantId);
  }

  @Post()
  @Permissions('admin.delegations.create')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
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

  @Patch(':id')
  @Permissions('admin.delegations.update')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.delegationService.update(req.user.tenantId, id, body);
  }

  @Post(':id/revoke')
  @Permissions('admin.delegations.update')
  async revoke(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.delegationService.revoke(req.user.tenantId, id);
  }
}
