import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PwaService } from './pwa.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/pwa-sync')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PwaController {
  constructor(private readonly pwaService: PwaService) {}

  @Get('queue')
  @Permissions('admin.sync.read')
  async getSyncQueue(@Req() req: AuthenticatedRequest) {
    return this.pwaService.getSyncQueue(req.user.tenantId);
  }

  @Post('push')
  @Permissions('admin.sync.create')
  async pushOfflineOperations(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { clientId: string; operations: Array<{ operation: string; entityType: string; payload: unknown }> }
  ) {
    return this.pwaService.pushOfflineOperations(req.user.tenantId, dto.clientId, dto.operations);
  }

  @Put('reconcile/:id')
  @Permissions('admin.sync.create')
  async reconcileOperation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { status: 'RECONCILED' | 'CONFLICT'; errorMessage?: string }
  ) {
    return this.pwaService.reconcileOperation(req.user.tenantId, id, dto.status, dto.errorMessage);
  }
}
