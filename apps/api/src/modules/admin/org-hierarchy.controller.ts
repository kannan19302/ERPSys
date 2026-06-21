import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { OrgHierarchyService } from './org-hierarchy.service';

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

@Controller('admin/org-hierarchy')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class OrgHierarchyController {
  constructor(private readonly orgHierarchyService: OrgHierarchyService) {}

  // ── Tree ─────────────────────────────────────────────────

  @Get('tree')
  @Permissions('admin.org-hierarchy.read')
  async getOrgTree(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getOrgTree(req.user.tenantId);
  }

  // ── Departments ──────────────────────────────────────────

  @Get('departments')
  @Permissions('admin.org-hierarchy.read')
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getDepartments(req.user.tenantId);
  }

  @Post('departments')
  @Permissions('admin.org-hierarchy.create')
  async createDepartment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { orgId: string; name: string; code: string; parentId?: string; managerId?: string },
  ) {
    return this.orgHierarchyService.createDepartment(req.user.tenantId, dto);
  }

  @Patch('departments/:id')
  @Permissions('admin.org-hierarchy.update')
  async updateDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { name?: string; code?: string; parentId?: string | null; managerId?: string | null },
  ) {
    return this.orgHierarchyService.updateDepartment(req.user.tenantId, id, dto);
  }

  @Delete('departments/:id')
  @Permissions('admin.org-hierarchy.delete')
  async deleteDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.orgHierarchyService.deleteDepartment(req.user.tenantId, id);
  }

  // ── Cost Centers ─────────────────────────────────────────

  @Get('cost-centers/:orgId')
  @Permissions('admin.org-hierarchy.read')
  async getCostCenters(
    @Req() req: AuthenticatedRequest,
    @Param('orgId') orgId: string,
  ) {
    return this.orgHierarchyService.getCostCenters(req.user.tenantId, orgId);
  }

  @Post('cost-centers')
  @Permissions('admin.org-hierarchy.create')
  async createCostCenter(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { orgId: string; code: string; name: string; parentId?: string; budget?: number },
  ) {
    return this.orgHierarchyService.createCostCenter(req.user.tenantId, dto);
  }

  @Patch('cost-centers/:id')
  @Permissions('admin.org-hierarchy.update')
  async updateCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { name?: string; code?: string; parentId?: string | null; budget?: number | null; isActive?: boolean },
  ) {
    return this.orgHierarchyService.updateCostCenter(req.user.tenantId, id, dto);
  }

  @Delete('cost-centers/:id')
  @Permissions('admin.org-hierarchy.delete')
  async deleteCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.orgHierarchyService.deleteCostCenter(req.user.tenantId, id);
  }
}
