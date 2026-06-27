import { Controller, Get, Post, Patch, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
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
}
