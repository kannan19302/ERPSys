import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HrService } from './hr.service';
import { CreateEmployeeInput, UpdateEmployeeInput, BulkActionInput } from '@unerp/shared';

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
  constructor(private readonly hrService: HrService) { }

  @Get('employees')
  @Permissions('hr.employee.read')
  async getEmployees(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.hrService.getEmployees(req.user.tenantId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      search,
      status,
      departmentId,
    });
  }

  @Get('employees/stats')
  @Permissions('hr.employee.read')
  async getEmployeeStats(@Req() req: AuthenticatedRequest) {
    return this.hrService.getEmployeeStats(req.user.tenantId);
  }

  @Get('employees/:id')
  @Permissions('hr.employee.read')
  async getEmployeeById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getEmployeeById(req.user.tenantId, id);
  }

  @Post('employees')
  @Permissions('hr.employee.create')
  async createEmployee(@Req() req: AuthenticatedRequest, @Body() dto: CreateEmployeeInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.hrService.createEmployee(req.user.tenantId, orgId, dto);
  }

  @Patch('employees/:id')
  @Permissions('hr.employee.update')
  async updateEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateEmployeeInput) {
    return this.hrService.updateEmployee(req.user.tenantId, id, dto);
  }

  @Delete('employees/:id')
  @Permissions('hr.employee.delete')
  async deleteEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteEmployee(req.user.tenantId, id);
  }

  @Post('employees/bulk')
  @Permissions('hr.employee.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @Body() dto: BulkActionInput) {
    return this.hrService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  @Get('departments')
  @Permissions('hr.employee.read')
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.hrService.getDepartments(req.user.tenantId);
  }
}