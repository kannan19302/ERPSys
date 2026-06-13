import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HrService } from './hr.service';
import { CreateEmployeeInput } from '@unerp/shared';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @Permissions('hr.employee.read')
  async getEmployees(@Req() req: AuthenticatedRequest): Promise<unknown> {
    const tenantId = req.user.tenantId;
    return this.hrService.getEmployees(tenantId);
  }

  @Post('employees')
  @Permissions('hr.employee.create')
  async createEmployee(@Req() req: AuthenticatedRequest, @Body() dto: CreateEmployeeInput): Promise<unknown> {
    const tenantId = req.user.tenantId;
    const orgId = req.user.orgId || 'org-system-default';
    return this.hrService.createEmployee(tenantId, orgId, dto);
  }

  @Patch('employees/:id')
  @Permissions('hr.employee.update')
  async updateEmployee(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmployeeInput>,
  ): Promise<unknown> {
    const tenantId = req.user.tenantId;
    return this.hrService.updateEmployee(tenantId, id, dto);
  }
}
