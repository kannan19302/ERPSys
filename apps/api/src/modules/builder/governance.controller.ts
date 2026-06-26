import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { BuilderGovernanceService } from './builder-governance.service';
import { BuilderScriptingService } from './builder-scripting.service';

interface AuthReq extends Request { user: { tenantId: string; userId: string } }

@Controller('builder/governance')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class GovernanceController {
  constructor(
    private readonly governance: BuilderGovernanceService,
    private readonly scripting: BuilderScriptingService,
  ) {}

  @Get('modules/:moduleId/environments')
  async getEnvironments(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.getModuleEnvironments(req.user.tenantId, moduleId);
  }

  @Post('modules/:moduleId/promote-staging')
  async promoteToStaging(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.promoteToStaging(req.user.tenantId, moduleId, req.user.userId);
  }

  @Post('modules/:moduleId/promote-production')
  async promoteToProduction(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.promoteToProduction(req.user.tenantId, moduleId, req.user.userId);
  }

  @Get('modules/:moduleId/permissions')
  async getPermissions(@Req() req: AuthReq, @Param('moduleId') moduleId: string) {
    return this.governance.getModulePermissions(req.user.tenantId, moduleId);
  }

  @Patch('modules/:moduleId/permissions')
  async updatePermissions(@Req() req: AuthReq, @Param('moduleId') moduleId: string, @Body() body: any) {
    return this.governance.updateModulePermissions(req.user.tenantId, moduleId, body);
  }

  @Get('modules/:moduleId/compare')
  async compareVersions(@Req() req: AuthReq, @Param('moduleId') moduleId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.governance.compareVersions(req.user.tenantId, moduleId, from, to);
  }

  @Post('scripts/execute')
  async executeScript(@Req() req: AuthReq, @Body() body: { script: string; context?: Record<string, unknown> }) {
    return this.scripting.executeScript(req.user.tenantId, body.script, body.context);
  }

  @Post('scripts/validate')
  async validateScript(@Body() body: { script: string }) {
    return this.scripting.validateScript(body.script);
  }

  @Post('forms/:formId/hook')
  async executeFormHook(@Req() req: AuthReq, @Param('formId') formId: string, @Body() body: { hookType: 'BEFORE_SAVE' | 'AFTER_SAVE' | 'ON_VALIDATE' | 'ON_LOAD'; record: Record<string, unknown> }) {
    return this.scripting.executeFormHook(req.user.tenantId, formId, body.hookType, body.record);
  }

  @Get('hooks')
  async getAvailableHooks() {
    return this.scripting.getAvailableHooks();
  }
}
