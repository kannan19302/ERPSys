import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { TrackChanges } from '../../common/decorators/track-changes.decorator';
import { ChangeHistoryInterceptor } from '../../common/interceptors/change-history.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput,
  createAccessPackageSchema, updateAccessPackageSchema,
  CreateAccessPackageInput, UpdateAccessPackageInput,
} from '@unerp/shared';

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

@Controller('admin')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Permissions('admin.user.read')
  async getUsers(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getUsers(req.user.tenantId);
  }

  @Post('users')
  @Permissions('admin.user.create')
  async createUser(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserInput,
  ): Promise<unknown> {
    return this.adminService.createUser(req.user.tenantId, dto);
  }

  @Patch('users/:id')
  @Permissions('admin.user.update')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserInput,
  ): Promise<unknown> {
    return this.adminService.updateUser(req.user.tenantId, userId, dto);
  }

  @Get('roles')
  @Permissions('admin.role.read')
  async getRoles(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getRoles(req.user.tenantId);
  }

  @Get('settings')
  @Permissions('admin.setting.read')
  async getSettings(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getSettings(req.user.tenantId);
  }

  @Patch('settings')
  @Permissions('admin.setting.update')
  async updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: Record<string, unknown>
  ): Promise<unknown> {
    const validationPipe = new ZodValidationPipe(
      require('@unerp/shared').updateAdminSettingsSchema,
    );
    const dto = validationPipe.transform(body, { type: 'body', metatype: Object });
    return this.adminService.updateSettings(req.user.tenantId, dto);
  }

  // ── Demo Data ──

  @Get('demo/status')
  @Permissions('admin.setting.read')
  async getDemoStatus(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getDemoStatus(req.user.tenantId);
  }

  @Post('demo/load')
  @Permissions('admin.demo.manage')
  async loadDemoData(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.loadDemoData(req.user.tenantId);
  }

  @Delete('demo/remove')
  @Permissions('admin.demo.manage')
  async removeDemoData(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.removeDemoData(req.user.tenantId);
  }

  @Delete('demo/remove/:module')
  @Permissions('admin.demo.manage')
  async removeDemoDataForModule(
    @Req() req: AuthenticatedRequest,
    @Param('module') module: string,
  ): Promise<unknown> {
    return this.adminService.removeDemoData(req.user.tenantId, module);
  }

  // ── Access Packages ──

  @Get('access-packages')
  @Permissions('admin.access-package.read')
  async getAccessPackages(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getAccessPackages(req.user.tenantId);
  }

  @Post('access-packages')
  @Permissions('admin.access-package.create')
  async createAccessPackage(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createAccessPackageSchema)) dto: CreateAccessPackageInput,
  ): Promise<unknown> {
    return this.adminService.createAccessPackage(req.user.tenantId, dto);
  }

  @Patch('access-packages/:id')
  @Permissions('admin.access-package.update')
  @UseInterceptors(ChangeHistoryInterceptor)
  @TrackChanges('AccessPackage')
  async updateAccessPackage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAccessPackageSchema)) dto: UpdateAccessPackageInput,
  ): Promise<unknown> {
    return this.adminService.updateAccessPackage(req.user.tenantId, id, dto);
  }

  @Delete('access-packages/:id')
  @Permissions('admin.access-package.delete')
  async deleteAccessPackage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.adminService.deleteAccessPackage(req.user.tenantId, id);
  }

  @Post('access-packages/:id/assign-role')
  @Permissions('admin.access-package.update')
  async assignAccessPackageToRole(
    @Param('id') accessPackageId: string,
    @Body('roleId') roleId: string,
  ): Promise<unknown> {
    return this.adminService.assignAccessPackageToRole(accessPackageId, roleId);
  }

  @Delete('access-packages/:id/unassign-role/:roleId')
  @Permissions('admin.access-package.update')
  async unassignAccessPackageFromRole(
    @Param('id') accessPackageId: string,
    @Param('roleId') roleId: string,
  ): Promise<unknown> {
    return this.adminService.unassignAccessPackageFromRole(accessPackageId, roleId);
  }

  // ── User Groups ──

  @Get('groups')
  @Permissions('admin.user-group.read')
  async getGroups(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.adminService.getGroups(req.user.tenantId);
  }

  @Post('groups')
  @Permissions('admin.user-group.create')
  async createGroup(
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; description?: string; isActive?: boolean },
  ): Promise<unknown> {
    return this.adminService.createGroup(req.user.tenantId, body);
  }

  @Patch('groups/:id')
  @Permissions('admin.user-group.update')
  async updateGroup(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isActive?: boolean },
  ): Promise<unknown> {
    return this.adminService.updateGroup(req.user.tenantId, id, body);
  }

  @Delete('groups/:id')
  @Permissions('admin.user-group.delete')
  async deleteGroup(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.adminService.deleteGroup(req.user.tenantId, id);
  }

  @Get('groups/:id/members')
  @Permissions('admin.user-group.read')
  async getGroupMembers(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<unknown> {
    return this.adminService.getGroupMembers(req.user.tenantId, id);
  }

  @Post('groups/:id/members')
  @Permissions('admin.user-group.update')
  async addGroupMembers(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('userIds') userIds: string[],
  ): Promise<unknown> {
    return this.adminService.addGroupMembers(req.user.tenantId, id, userIds);
  }

  @Delete('groups/:id/members/:userId')
  @Permissions('admin.user-group.update')
  async removeGroupMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<unknown> {
    return this.adminService.removeGroupMember(req.user.tenantId, id, userId);
  }
}
