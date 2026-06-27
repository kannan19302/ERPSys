import { Controller, Get, Post, Patch, Delete, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { OrgHierarchyService } from './org-hierarchy.service';
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
@Controller('admin/org-hierarchy')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OrgHierarchyController {
  constructor(private readonly orgHierarchyService: OrgHierarchyService) {}

  // ── Tree ─────────────────────────────────────────────────

  @ApiOperation({ summary: 'Get org tree' })
  @Permissions('admin.read')
  @Get('tree')
  @Permissions('admin.org-hierarchy.read')
  async getOrgTree(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getOrgTree(req.user.tenantId);
  }

  // ── Departments ──────────────────────────────────────────

  @ApiOperation({ summary: 'Get departments' })
  @Permissions('admin.read')
  @Get('departments')
  @Permissions('admin.org-hierarchy.read')
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getDepartments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create department' })
  @Permissions('admin.create')
  @Post('departments')
  @Permissions('admin.org-hierarchy.create')
  async createDepartment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { orgId: string; name: string; code: string; parentId?: string; managerId?: string },
  ) {
    return this.orgHierarchyService.createDepartment(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update department' })
  @Permissions('admin.update')
  @Patch('departments/:id')
  @Permissions('admin.org-hierarchy.update')
  async updateDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { name?: string; code?: string; parentId?: string | null; managerId?: string | null },
  ) {
    return this.orgHierarchyService.updateDepartment(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete department' })
  @Permissions('admin.delete')
  @Delete('departments/:id')
  @Permissions('admin.org-hierarchy.delete')
  async deleteDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.orgHierarchyService.deleteDepartment(req.user.tenantId, id);
  }

  // ── Cost Centers ─────────────────────────────────────────

  @ApiOperation({ summary: 'Get cost centers' })
  @Permissions('admin.read')
  @Get('cost-centers/:orgId')
  @Permissions('admin.org-hierarchy.read')
  async getCostCenters(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ) {
    return this.orgHierarchyService.getCostCenters(req.user.tenantId, orgId);
  }

  @ApiOperation({ summary: 'Create cost center' })
  @Permissions('admin.create')
  @Post('cost-centers')
  @Permissions('admin.org-hierarchy.create')
  async createCostCenter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { orgId: string; code: string; name: string; parentId?: string; budget?: number },
  ) {
    return this.orgHierarchyService.createCostCenter(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update cost center' })
  @Permissions('admin.update')
  @Patch('cost-centers/:id')
  @Permissions('admin.org-hierarchy.update')
  async updateCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { name?: string; code?: string; parentId?: string | null; budget?: number | null; isActive?: boolean },
  ) {
    return this.orgHierarchyService.updateCostCenter(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete cost center' })
  @Permissions('admin.delete')
  @Delete('cost-centers/:id')
  @Permissions('admin.org-hierarchy.delete')
  async deleteCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.orgHierarchyService.deleteCostCenter(req.user.tenantId, id);
  }
}
