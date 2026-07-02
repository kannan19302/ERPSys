import { Controller, Get, Post, Patch, Delete, Param, UseGuards, Req, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { HrService } from './hr.service';
import { CreateEmployeeInput, UpdateEmployeeInput, BulkActionInput } from '@unerp/shared';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags('hr')
@ApiBearerAuth()
@Controller('hr')
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrController {
  constructor(private readonly hrService: HrService) { }

  @ApiOperation({ summary: 'Get employees' })
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
      departmentId });
  }

  @ApiOperation({ summary: 'Get employee stats' })
  @Get('employees/stats')
  @Permissions('hr.employee.read')
  async getEmployeeStats(@Req() req: AuthenticatedRequest) {
    return this.hrService.getEmployeeStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get employee by id' })
  @Get('employees/:id')
  @Permissions('hr.employee.read')
  async getEmployeeById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.getEmployeeById(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create employee' })
  @Post('employees')
  @Permissions('hr.employee.create')
  async createEmployee(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: CreateEmployeeInput) {
    const orgId = req.user.orgId || 'org-system-default';
    return this.hrService.createEmployee(req.user.tenantId, orgId, dto);
  }

  @ApiOperation({ summary: 'Update employee' })
  @Patch('employees/:id')
  @Permissions('hr.employee.update')
  async updateEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string, @ZodBody(z.any()) dto: UpdateEmployeeInput) {
    return this.hrService.updateEmployee(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete employee' })
  @Delete('employees/:id')
  @Permissions('hr.employee.delete')
  async deleteEmployee(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.hrService.deleteEmployee(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Bulk action' })
  @Post('employees/bulk')
  @Permissions('hr.employee.update')
  async bulkAction(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: BulkActionInput) {
    return this.hrService.bulkAction(req.user.tenantId, dto.action, dto.ids, dto.data);
  }

  @ApiOperation({ summary: 'Get departments' })
  @Get('departments')
  @Permissions('hr.employee.read')
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.hrService.getDepartments(req.user.tenantId);
  }
}