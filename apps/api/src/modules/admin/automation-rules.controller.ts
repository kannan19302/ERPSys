import { Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AutomationRulesService } from './automation-rules.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

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

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/automation-rules')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AutomationRulesController {
  constructor(private readonly automationRulesService: AutomationRulesService) {}

  @ApiOperation({ summary: 'Get rules' })
  @Get()
  @Permissions('admin.automation.read')
  async getRules(@Req() req: AuthenticatedRequest) {
    return this.automationRulesService.getRules(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get execution history' })
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

  @ApiOperation({ summary: 'Get rule' })
  @Get(':id')
  @Permissions('admin.automation.read')
  async getRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.automationRulesService.getRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create rule' })
  @Post()
  @Permissions('admin.automation.create')
  async createRule(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Update rule' })
  @Patch(':id')
  @Permissions('admin.automation.update')
  async updateRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: {
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

  @ApiOperation({ summary: 'Delete rule' })
  @Delete(':id')
  @Permissions('admin.automation.delete')
  async deleteRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.automationRulesService.deleteRule(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Test rule' })
  @Post(':id/test')
  @Permissions('admin.automation.update')
  async testRule(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { sampleData: any },
  ) {
    return this.automationRulesService.testRule(req.user.tenantId, id, dto.sampleData);
  }
}
