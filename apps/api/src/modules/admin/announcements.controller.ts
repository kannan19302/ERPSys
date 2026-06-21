import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { TenantInterceptor } from '../../common/guards/tenant.interceptor';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnnouncementsService } from './announcements.service';

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

@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RbacGuard)
@UseInterceptors(TenantInterceptor)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @Permissions('admin.setting.read')
  async getAnnouncements(@Req() req: AuthenticatedRequest) {
    return this.announcementsService.getActiveAnnouncements(req.user.tenantId);
  }

  @Post()
  @Permissions('admin.setting.update')
  async createAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { title: string; message: string; type?: string; priority?: string; expiresAt?: string },
  ) {
    return this.announcementsService.createAnnouncement(req.user.tenantId, req.user.userId, dto);
  }

  @Patch(':id')
  @Permissions('admin.setting.update')
  async updateAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { title?: string; message?: string; type?: string; priority?: string; isActive?: boolean; expiresAt?: string | null },
  ) {
    return this.announcementsService.updateAnnouncement(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('admin.setting.update')
  async deleteAnnouncement(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.announcementsService.deleteAnnouncement(req.user.tenantId, id);
  }
}
