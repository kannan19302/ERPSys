import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BulkOperationsService } from './bulk-operations.service';
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

@Controller('admin/bulk-operations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class BulkOperationsController {
  constructor(private readonly bulkOperationsService: BulkOperationsService) {}

  @Post()
  @Permissions('admin.bulk-ops.create')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
      operationType: 'MASS_UPDATE' | 'MASS_DELETE' | 'MASS_TRANSFER';
      entityType: string;
      criteria: Record<string, any>;
      changes: Record<string, any>;
    },
  ) {
    return this.bulkOperationsService.create(req.user.tenantId, body, req.user.userId);
  }

  @Get()
  @Permissions('admin.bulk-ops.read')
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bulkOperationsService.list(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('entity-counts')
  @Permissions('admin.bulk-ops.read')
  async getEntityCounts(@Req() req: AuthenticatedRequest) {
    return this.bulkOperationsService.getEntityCounts(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('admin.bulk-ops.read')
  async getById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.bulkOperationsService.getById(req.user.tenantId, id);
  }
}
