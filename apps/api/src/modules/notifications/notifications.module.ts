import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
