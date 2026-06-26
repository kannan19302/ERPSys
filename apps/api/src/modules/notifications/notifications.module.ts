import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [NotificationsService, NotificationDeliveryService, NotificationsGateway],
  exports: [NotificationsService, NotificationDeliveryService, NotificationsGateway],
})
export class NotificationsModule {}
