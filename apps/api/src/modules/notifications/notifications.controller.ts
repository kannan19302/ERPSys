import { Controller, Get, Post, Put, UseGuards, Req } from '@nestjs/common';
import { z } from 'zod';
import { ZodBody } from '../../common/decorators/zod-body.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { NotificationsService } from './notifications.service';
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

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications-config')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @ApiOperation({ summary: 'Get channels' })
  @Get('channels')
  @Permissions('communication.notification.read')
  async getChannels(@Req() req: AuthenticatedRequest) {
    return this.service.getChannels(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Update channel' })
  @Put('channels')
  @Permissions('communication.notification.update')
  async updateChannel(@Req() req: AuthenticatedRequest, @ZodBody(z.any()) dto: { name: string; isEnabled: boolean }) {
    return this.service.updateChannelStatus(req.user.tenantId, dto.name, dto.isEnabled);
  }

  @ApiOperation({ summary: 'Get preferences' })
  @Get('preferences')
  @Permissions('communication.notification.read')
  async getPreferences(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId || 'system';
    return this.service.getPreferences(req.user.tenantId, userId);
  }

  @ApiOperation({ summary: 'Save preference' })
  @Post('preferences')
  @Permissions('communication.notification.update')
  async savePreference(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { channelName: string; eventType: string; isEnabled: boolean }
  ) {
    const userId = req.user.userId || 'system';
    return this.service.savePreference(req.user.tenantId, userId, dto);
  }
}
