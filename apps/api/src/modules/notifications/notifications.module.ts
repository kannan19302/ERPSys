import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationPreferencesController } from "./notification-preferences.controller";
import { NotificationsDeepController } from "./notifications-deep.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsDeepService } from "./notifications-deep.service";
import { NotificationDeliveryService } from "./notification-delivery.service";
import { NotificationsGateway } from "./notifications.gateway";
import { InvoiceOverdueNotificationService } from "./invoice-overdue-notification.service";
import { PipelineRiskNotificationService } from "./pipeline-risk-notification.service";

@Module({
  controllers: [
    NotificationsController,
    NotificationPreferencesController,
    NotificationsDeepController,
  ],
  providers: [
    NotificationsService,
    NotificationsDeepService,
    NotificationDeliveryService,
    NotificationsGateway,
    InvoiceOverdueNotificationService,
    PipelineRiskNotificationService,
  ],
  exports: [
    NotificationsService,
    NotificationsDeepService,
    NotificationDeliveryService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
