import { Controller, Get, Patch, UseGuards, Req } from '@nestjs/common';
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
  };
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationsService) {}

  @ApiOperation({ summary: 'Get user preferences' })
  @Permissions('notifications.read')
  @Get('preferences')
  @Permissions('communication.notification.read')
  async getUserPreferences(@Req() req: AuthenticatedRequest) {
    return this.service.getUserNotificationPreferences(req.user.tenantId, req.user.userId);
  }

  @ApiOperation({ summary: 'Update user preferences' })
  @Permissions('notifications.update')
  @Patch('preferences')
  @Permissions('communication.notification.update')
  async updateUserPreferences(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.any()) dto: { category: string; inApp?: boolean; email?: boolean; sms?: boolean; push?: boolean },
  ) {
    return this.service.updateUserNotificationPreferences(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }
}
