import { Controller, Get, Post, Patch, Delete, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodBody } from '../../../common/decorators/zod-body.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../../common/guards/tenant.interceptor';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../../common/interceptors/change-history.interceptor';
import { SaasPortalOrgHierarchyService } from '../services/org-hierarchy.service';

interface AuthenticatedRequest extends Request {
  user: { tenantId: string; userId: string; email: string; firstName: string; lastName: string; roles: string[] };
}

const createDepartmentSchema = z.object({
  orgId: z.string().cuid(),
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  parentId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
});
const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  parentId: z.string().cuid().nullable().optional(),
  managerId: z.string().cuid().nullable().optional(),
});

const createCostCenterSchema = z.object({
  orgId: z.string().cuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  parentId: z.string().cuid().optional(),
  budget: z.number().min(0).optional(),
});
const updateCostCenterSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  parentId: z.string().cuid().nullable().optional(),
  budget: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * SaaS Portal home for org hierarchy (departments, cost centers, org tree).
 * Consolidates the concern previously only reachable at `/admin/org-hierarchy`
 * into the SaaS Portal surface. This is an independent implementation against
 * the same Prisma models, not a cross-module delegate — see
 * `saas-portal/services/org-hierarchy.service.ts` for why.
 */
@ApiTags('saas-portal')
@ApiBearerAuth()
@Controller('saas-portal/org-hierarchy')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class SaasPortalOrgHierarchyController {
  constructor(private readonly orgHierarchyService: SaasPortalOrgHierarchyService) {}

  @ApiOperation({ summary: 'Get org tree' })
  @Get('tree')
  @Permissions('admin.org-hierarchy.read')
  async getOrgTree(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getOrgTree(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Get departments' })
  @Get('departments')
  @Permissions('admin.org-hierarchy.read')
  async getDepartments(@Req() req: AuthenticatedRequest) {
    return this.orgHierarchyService.getDepartments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create department' })
  @Post('departments')
  @Permissions('admin.org-hierarchy.create')
  @TrackChanges('Department')
  @UseInterceptors(ChangeHistoryInterceptor)
  async createDepartment(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createDepartmentSchema) dto: z.infer<typeof createDepartmentSchema>,
  ) {
    return this.orgHierarchyService.createDepartment(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update department' })
  @Patch('departments/:id')
  @Permissions('admin.org-hierarchy.update')
  @TrackChanges('Department')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateDepartment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateDepartmentSchema) dto: z.infer<typeof updateDepartmentSchema>,
  ) {
    return this.orgHierarchyService.updateDepartment(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete department' })
  @Delete('departments/:id')
  @Permissions('admin.org-hierarchy.delete')
  @TrackChanges('Department')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deleteDepartment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orgHierarchyService.deleteDepartment(req.user.tenantId, id);
  }

  @ApiOperation({ summary: 'Get cost centers' })
  @Get('cost-centers/:orgId')
  @Permissions('admin.org-hierarchy.read')
  async getCostCenters(@Req() req: AuthenticatedRequest, @Param('orgId') orgId: string) {
    return this.orgHierarchyService.getCostCenters(req.user.tenantId, orgId);
  }

  @ApiOperation({ summary: 'Create cost center' })
  @Post('cost-centers')
  @Permissions('admin.org-hierarchy.create')
  @TrackChanges('CostCenter')
  @UseInterceptors(ChangeHistoryInterceptor)
  async createCostCenter(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createCostCenterSchema) dto: z.infer<typeof createCostCenterSchema>,
  ) {
    return this.orgHierarchyService.createCostCenter(req.user.tenantId, dto);
  }

  @ApiOperation({ summary: 'Update cost center' })
  @Patch('cost-centers/:id')
  @Permissions('admin.org-hierarchy.update')
  @TrackChanges('CostCenter')
  @UseInterceptors(ChangeHistoryInterceptor)
  async updateCostCenter(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(updateCostCenterSchema) dto: z.infer<typeof updateCostCenterSchema>,
  ) {
    return this.orgHierarchyService.updateCostCenter(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete cost center' })
  @Delete('cost-centers/:id')
  @Permissions('admin.org-hierarchy.delete')
  @TrackChanges('CostCenter')
  @UseInterceptors(ChangeHistoryInterceptor)
  async deleteCostCenter(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orgHierarchyService.deleteCostCenter(req.user.tenantId, id);
  }
}
