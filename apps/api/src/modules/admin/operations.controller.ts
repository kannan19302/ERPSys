import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { OperationsService } from './operations.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
  };
}

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/operations')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @ApiOperation({ summary: 'Get system health' })
  @Permissions('admin.read')
  @Get('health')
  @Permissions('admin.operations.read')
  async getSystemHealth() {
    return this.operationsService.getSystemHealth();
  }

  @ApiOperation({ summary: 'Get background jobs' })
  @Permissions('admin.read')
  @Get('jobs')
  @Permissions('admin.operations.read')
  async getBackgroundJobs(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getBackgroundJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Retry jobs' })
  @Permissions('admin.create')
  @Post('jobs/retry')
  @Permissions('admin.operations.update')
  async retryJobs(@Req() req: AuthenticatedRequest) {
    return this.operationsService.retryJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get scheduled tasks' })
  @Permissions('admin.read')
  @Get('tasks')
  @Permissions('admin.operations.read')
  async getScheduledTasks(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getScheduledTasks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Trigger task' })
  @Permissions('admin.create')
  @Post('tasks/:id/trigger')
  @Permissions('admin.operations.update')
  async triggerTask(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.operationsService.triggerTask(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get error logs' })
  @Permissions('admin.read')
  @Get('logs')
  @Permissions('admin.operations.read')
  async getErrorLogs(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.operationsService.getErrorLogs(
      req.user.tenantId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50,
    );
  }

  @ApiOperation({ summary: 'Resolve error log' })
  @Permissions('admin.create')
  @Post('logs/:id/resolve')
  @Permissions('admin.operations.update')
  async resolveErrorLog(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.operationsService.resolveErrorLog(id, req.user.email);
  }

  @ApiOperation({ summary: 'Get backups' })
  @Permissions('admin.read')
  @Get('backups')
  @Permissions('admin.operations.read')
  async getBackups(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getBackups(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create backup' })
  @Permissions('admin.create')
  @Post('backups/create')
  @Permissions('admin.operations.update')
  async createBackup(@Req() req: AuthenticatedRequest) {
    return this.operationsService.createBackup(req.user.tenantId, req.user.email);
  }

  @ApiOperation({ summary: 'Get db schema' })
  @Permissions('admin.read')
  @Get('db-schema')
  @Permissions('admin.operations.read')
  async getDbSchema() {
    return this.operationsService.getDbSchema();
  }
}
