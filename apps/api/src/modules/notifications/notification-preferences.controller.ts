import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
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
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RbacGuard)
export class NotificationPreferencesController {
  constructor(private readonly service: NotificationsService) {}

  @Get('preferences')
  @Permissions('communication.notification.read')
  async getUserPreferences(@Req() req: AuthenticatedRequest) {
    return this.service.getUserNotificationPreferences(req.user.tenantId, req.user.userId);
  }

  @Patch('preferences')
  @Permissions('communication.notification.update')
  async updateUserPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { category: string; inApp?: boolean; email?: boolean; sms?: boolean; push?: boolean },
  ) {
    return this.service.updateUserNotificationPreferences(
      req.user.tenantId,
      req.user.userId,
      dto,
    );
  }
}
