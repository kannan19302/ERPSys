import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from '@unerp/shared';

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
}
