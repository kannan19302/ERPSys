import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AutomationRulesService } from './automation-rules.service';

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

@Controller('admin/automation-rules')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AutomationRulesController {
  constructor(private readonly automationRulesService: AutomationRulesService) {}

  @Get()
  @Permissions('admin.automation.read')
  async getRules(@Req() req: AuthenticatedRequest) {
    return this.automationRulesService.getRules(req.user.tenantId);
  }

  @Get('executions')
  @Permissions('admin.automation.read')
  async getExecutionHistory(
    @Req() req: AuthenticatedRequest,
    @Query('ruleId') ruleId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.automationRulesService.getExecutionHistory(
      req.user.tenantId,
      ruleId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  @Permissions('admin.automation.read')
  async getRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.automationRulesService.getRule(req.user.tenantId, id);
  }

  @Post()
  @Permissions('admin.automation.create')
  async createRule(
    @Req() req: AuthenticatedRequest,
    @Body() dto: {
      name: string;
      description?: string;
      trigger: string;
      triggerConfig?: any;
      conditions?: any;
      actions?: any;
      status?: string;
      settings?: any;
    },
  ) {
    return this.automationRulesService.createRule(req.user.tenantId, dto, req.user.userId);
  }

  @Patch(':id')
  @Permissions('admin.automation.update')
  async updateRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      trigger?: string;
      triggerConfig?: any;
      conditions?: any;
      actions?: any;
      status?: string;
      settings?: any;
    },
  ) {
    return this.automationRulesService.updateRule(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('admin.automation.delete')
  async deleteRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.automationRulesService.deleteRule(req.user.tenantId, id);
  }

  @Post(':id/test')
  @Permissions('admin.automation.update')
  async testRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { sampleData: any },
  ) {
    return this.automationRulesService.testRule(req.user.tenantId, id, dto.sampleData);
  }
}
