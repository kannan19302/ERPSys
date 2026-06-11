import { Controller, Get, Post, Body, Put, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@Controller('notifications-config')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('channels')
  @Permissions('communication.notification.read')
  async getChannels(@Req() req: AuthenticatedRequest) {
    return this.service.getChannels(req.user.tenantId);
  }

  @Put('channels')
  @Permissions('communication.notification.update')
  async updateChannel(@Req() req: AuthenticatedRequest, @Body() dto: { name: string; isEnabled: boolean }) {
    return this.service.updateChannelStatus(req.user.tenantId, dto.name, dto.isEnabled);
  }

  @Get('preferences')
  @Permissions('communication.notification.read')
  async getPreferences(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId || 'system';
    return this.service.getPreferences(req.user.tenantId, userId);
  }

  @Post('preferences')
  @Permissions('communication.notification.update')
  async savePreference(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { channelName: string; eventType: string; isEnabled: boolean }
  ) {
    const userId = req.user.userId || 'system';
    return this.service.savePreference(req.user.tenantId, userId, dto);
  }
}
