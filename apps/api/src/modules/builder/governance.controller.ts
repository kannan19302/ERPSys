import { Controller, Get, Post, Patch, Param, Query, UseGuards, UseInterceptors, Req, Delete } from '@nestjs/common';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { BuilderGovernanceService } from './builder-governance.service';
import { BuilderScriptingService } from './builder-scripting.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@ApiTags('builder')
@ApiBearerAuth()
@Controller('builder/governance')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class GovernanceController {
  constructor(
    private readonly governance: BuilderGovernanceService,
    private readonly scripting: BuilderScriptingService,
  ) {}

  @ApiOperation({ summary: 'Get environments' })
  @Permissions('builder.read')
  @Get('modules/:moduleId/environments')
  async getEnvironments(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.getModuleEnvironments(req.user.tenantId, moduleId);
  }

  @ApiOperation({ summary: 'Promote to staging' })
  @Permissions('builder.create')
  @Post('modules/:moduleId/promote-staging')
  async promoteToStaging(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.promoteToStaging(req.user.tenantId, moduleId, req.user.userId);
  }

  @ApiOperation({ summary: 'Promote to production' })
  @Permissions('builder.create')
  @Post('modules/:moduleId/promote-production')
  async promoteToProduction(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.promoteToProduction(req.user.tenantId, moduleId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get permissions' })
  @Permissions('builder.read')
  @Get('modules/:moduleId/permissions')
  async getPermissions(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.getModulePermissions(req.user.tenantId, moduleId);
  }

  @ApiOperation({ summary: 'Update permissions' })
  @Permissions('builder.update')
  @Patch('modules/:moduleId/permissions')
  async updatePermissions(@Req() req: AuthReq, @Param('moduleId') moduleId: string, @ZodBody(z.any()) body: any) {
    return this.governance.updateModulePermissions(req.user.tenantId, moduleId, body);
  }

  @ApiOperation({ summary: 'Compare versions' })
  @Permissions('builder.read')
  @Get('modules/:moduleId/compare')
  async compareVersions(@Req() req: AuthReq, @Param('moduleId') moduleId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.governance.compareVersions(req.user.tenantId, moduleId, from, to);
  }

  @ApiOperation({ summary: 'Execute script' })
  @Permissions('builder.create')
  @Post('scripts/execute')
  async executeScript(@Req() req: AuthReq, @ZodBody(z.any()) body: { script: string; context?: Record<string, unknown> }) {
    return this.scripting.executeScript(req.user.tenantId, body.script, body.context);
  }

  @ApiOperation({ summary: 'Validate script' })
  @Permissions('builder.create')
  @Post('scripts/validate')
  async validateScript(@ZodBody(z.any()) body: { script: string }) {
    return this.scripting.validateScript(body.script);
  }

  @ApiOperation({ summary: 'Execute form hook' })
  @Permissions('builder.create')
  @Post('forms/:formId/hook')
  async executeFormHook(@Req() req: AuthReq, @Param('formId') formId: string, @ZodBody(z.any()) body: { hookType: 'BEFORE_SAVE' | 'AFTER_SAVE' | 'ON_VALIDATE' | 'ON_LOAD'; record: Record<string, unknown> }) {
    return this.scripting.executeFormHook(req.user.tenantId, formId, body.hookType, body.record);
  }

  @ApiOperation({ summary: 'Get available hooks' })
  @Permissions('builder.read')
  @Get('hooks')
  async getAvailableHooks() {
    return this.scripting.getAvailableHooks();
  }

  @ApiOperation({ summary: 'Dry-run SQL / custom query builder check' })
  @Permissions('builder.read')
  @Post('query/run')
  async runQueryDryRun(@Req() _req: AuthReq, @ZodBody(z.object({ query: z.string(), limit: z.number().optional() })) body: { query: string; limit?: number }) {
    const sql = body.query.trim();
    if (!sql.toLowerCase().startsWith('select')) {
      return { success: false, error: 'Only SELECT queries are allowed for security dry-runs.' };
    }
    const tableMatch = sql.match(/from\s+([a-z0-9_"]+)/i);
    const tableName = tableMatch ? tableMatch[1] : 'unknown';
    return {
      success: true,
      query: sql,
      explain: {
        strategy: 'Seq Scan',
        targetTable: tableName,
        costEstimate: '0.00..15.50 rows=100 width=356'
      },
      rows: [
        { id: '1', name: 'Sample Record A', status: 'ACTIVE', created_at: new Date() },
        { id: '2', name: 'Sample Record B', status: 'ACTIVE', created_at: new Date() }
      ]
    };
  }

  @ApiOperation({ summary: 'Get governance dashboard summary statistics' })
  @Permissions('builder.read')
  @Get('summary')
  async getSummary(@Req() req: AuthReq) {
    return this.governance.getGovernanceSummary(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get system execution run logs' })
  @Permissions('builder.read')
  @Get('logs')
  async getLogs(@Req() req: AuthReq, @Query('level') level?: string, @Query('search') search?: string) {
    return this.governance.getRunLogs(req.user.tenantId, level, search);
  }

  @ApiOperation({ summary: 'Get registered third-party connectors' })
  @Permissions('builder.read')
  @Get('connectors')
  async getConnectors(@Req() req: AuthReq) {
    return this.governance.getConnectors(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Register third-party API connector' })
  @Permissions('builder.create')
  @Post('connectors')
  async createConnector(
    @Req() req: AuthReq,
    @ZodBody(z.object({ name: z.string(), type: z.string(), config: z.any() }))
    body: { name: string; type: string; config: any }
  ) {
    return this.governance.saveConnector(req.user.tenantId, body.name, body.type, body.config);
  }

  @ApiOperation({ summary: 'Delete API connector' })
  @Permissions('builder.delete')
  @Delete('connectors/:id')
  async deleteConnector(@Req() req: AuthReq, @Param('id') id: string) {
    return this.governance.deleteConnector(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'List marketplace extensions' })
  @Permissions('builder.read')
  @Get('marketplace')
  async getMarketplace() {
    return this.governance.getMarketplaceList();
  }

  @ApiOperation({ summary: 'Get global studio permissions list' })
  @Permissions('builder.read')
  @Get('permissions')
  async getAllStudioPermissions(@Req() req: AuthReq) {
    return this.governance.getAllPermissions(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Save studio permission mapping' })
  @Permissions('builder.create')
  @Post('permissions')
  async saveStudioPermission(
    @Req() req: AuthReq,
    @ZodBody(z.object({ roleId: z.string(), moduleSlug: z.string(), canRead: z.boolean(), canWrite: z.boolean() }))
    body: { roleId: string; moduleSlug: string; canRead: boolean; canWrite: boolean }
  ) {
    return this.governance.saveStudioPermission(req.user.tenantId, body.roleId, body.moduleSlug, body.canRead, body.canWrite);
  }

  @ApiOperation({ summary: 'Delete studio permission entry' })
  @Permissions('builder.delete')
  @Delete('permissions/:id')
  async deleteStudioPermission(@Req() req: AuthReq, @Param('id') id: string) {
    return this.governance.deleteStudioPermission(req.user.tenantId, id);
  }
}
