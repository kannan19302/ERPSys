import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { SkipTenantScope } from '../../common/decorators/skip-tenant-scope.decorator';
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
  @Get('health')
  @Permissions('admin.operations.read')
  async getSystemHealth() {
    return this.operationsService.getSystemHealth();
  }

  @ApiOperation({ summary: 'Get background jobs' })
  @Get('jobs')
  @Permissions('admin.operations.read')
  async getBackgroundJobs(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getBackgroundJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Retry jobs' })
  @Post('jobs/retry')
  @Permissions('admin.operations.update')
  async retryJobs(@Req() req: AuthenticatedRequest) {
    return this.operationsService.retryJobs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get scheduled tasks' })
  @Get('tasks')
  @Permissions('admin.operations.read')
  async getScheduledTasks(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getScheduledTasks(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Trigger task' })
  @Post('tasks/:id/trigger')
  @Permissions('admin.operations.update')
  async triggerTask(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.operationsService.triggerTask(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get error logs' })
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
  @Post('logs/:id/resolve')
  @Permissions('admin.operations.update')
  async resolveErrorLog(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.operationsService.resolveErrorLog(id, req.user.email);
  }

  // A full Postgres backup is instance-wide, not per-tenant (row-level multi-tenancy means
  // there is no way to pg_dump "just this tenant's rows" — see
  // .ai/ADMIN_SECURITY_AUDIT.md Section 3). Gating these two endpoints behind the coarse
  // tenant-scoped `admin.operations.*` would let any Tenant Admin trigger/read what is
  // effectively a platform-wide operation. They require the new `system.operations.backup`
  // permission (Super Admin / Platform Operator only, never seeded to a tenant role) and
  // `@SkipTenantScope()`, following the same precedent as `SuperAdminController`'s
  // `system.tenant.*` permissions. Every other endpoint in this controller remains
  // tenant-scoped under `admin.operations.*` as before.
  @ApiOperation({ summary: 'Get backups (platform-wide, Super Admin only)' })
  @Get('backups')
  @Permissions('system.operations.backup')
  @SkipTenantScope()
  async getBackups(@Req() req: AuthenticatedRequest) {
    return this.operationsService.getBackups(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create backup (platform-wide, Super Admin only)' })
  @Post('backups/create')
  @Permissions('system.operations.backup')
  @SkipTenantScope()
  async createBackup(@Req() req: AuthenticatedRequest) {
    return this.operationsService.createBackup(req.user.tenantId, req.user.email);
  }

  @ApiOperation({ summary: 'Get db schema' })
  @Get('db-schema')
  @Permissions('admin.operations.read')
  async getDbSchema() {
    return this.operationsService.getDbSchema();
  }

  // Ollama (AI engine) process control moved to AiAdminController
  // (`admin/ai/engine/*`) — see that controller. This keeps AI-specific
  // control on the dedicated AI admin surface, gated by `ai.admin.manage`,
  // instead of the coarser `admin.operations.*` permissions.
}
