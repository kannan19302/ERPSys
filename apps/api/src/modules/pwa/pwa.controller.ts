import { Controller, Get, Post, Param, Put, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PwaService } from './pwa.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('pwa')
@ApiBearerAuth()
@Controller('admin/pwa-sync')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PwaController {
  constructor(private readonly pwaService: PwaService) {}

  @ApiOperation({ summary: 'Get sync queue' })
  @Get('queue')
  @Permissions('admin.sync.read')
  async getSyncQueue(@Req() req: AuthenticatedRequest) {
    return this.pwaService.getSyncQueue(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Push offline operations' })
  @Post('push')
  @Permissions('admin.sync.create')
  async pushOfflineOperations(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { clientId: string; operations: Array<{ operation: string; entityType: string; payload: unknown }> }
  ) {
    return this.pwaService.pushOfflineOperations(req.user.tenantId, dto.clientId, dto.operations);
  }

  @ApiOperation({ summary: 'Reconcile operation' })
  @Put('reconcile/:id')
  @Permissions('admin.sync.create')
  async reconcileOperation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { status: 'RECONCILED' | 'CONFLICT'; errorMessage?: string }
  ) {
    return this.pwaService.reconcileOperation(req.user.tenantId, id, dto.status, dto.errorMessage);
  }
}
