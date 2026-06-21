import { Controller, Get, Post, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { OperationsService } from './operations.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('health')
  @Permissions('admin.operations.read')
  async getSystemHealth() {
    return this.operationsService.getSystemHealth();
  }

  @Get('jobs')
  @Permissions('admin.operations.read')
  async getBackgroundJobs() {
    return this.operationsService.getBackgroundJobs();
  }

  @Post('jobs/retry')
  @Permissions('admin.operations.update')
  async retryJobs() {
    return this.operationsService.retryJobs();
  }

  @Get('tasks')
  @Permissions('admin.operations.read')
  async getScheduledTasks() {
    return this.operationsService.getScheduledTasks();
  }

  @Post('tasks/:id/trigger')
  @Permissions('admin.operations.update')
  async triggerTask(@Param('id') id: string) {
    return this.operationsService.triggerTask(id);
  }

  @Get('logs')
  @Permissions('admin.operations.read')
  async getErrorLogs() {
    return this.operationsService.getErrorLogs();
  }

  @Get('backups')
  @Permissions('admin.operations.read')
  async getBackups(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getBackups(req.user.tenantId);
  }

  @Post('backups/create')
  @Permissions('admin.operations.update')
  async createBackup(@Req() req: AuthenticatedRequest) {
    return this.operationsService.createBackup(req.user.tenantId, req.user.email);
  }

  @Get('db-schema')
  @Permissions('admin.operations.read')
  async getDbSchema() {
    return this.operationsService.getDbSchema();
  }
}
