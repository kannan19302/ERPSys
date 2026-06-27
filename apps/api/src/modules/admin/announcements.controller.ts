import { Controller, Get, Post, Patch, Delete, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnnouncementsService } from './announcements.service';
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
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'Get announcements' })
  @Permissions('admin.read')
  @Get()
  @Permissions('admin.setting.read')
  async getAnnouncements(@Req() req: AuthenticatedRequest) {
    return this.announcementsService.getActiveAnnouncements(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Create announcement' })
  @Permissions('admin.create')
  @Post()
  @Permissions('admin.setting.update')
  async createAnnouncement(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { title: string; message: string; type?: string; priority?: string; expiresAt?: string },
  ) {
    return this.announcementsService.createAnnouncement(req.user.tenantId, req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Update announcement' })
  @Permissions('admin.update')
  @Patch(':id')
  @Permissions('admin.setting.update')
  async updateAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @ZodBody(z.any()) dto: { title?: string; message?: string; type?: string; priority?: string; isActive?: boolean; expiresAt?: string | null },
  ) {
    return this.announcementsService.updateAnnouncement(req.user.tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete announcement' })
  @Permissions('admin.delete')
  @Delete(':id')
  @Permissions('admin.setting.update')
  async deleteAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.announcementsService.deleteAnnouncement(req.user.tenantId, id);
  }
}
