// @ts-nocheck
import { NotificationsGeneratedController } from "./notifications-generated.controller";
import { NotificationsGeneratedService } from "./notifications-generated.service";
import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationPreferencesController } from "./notification-preferences.controller";
import { NotificationsDeepController } from "./notifications-deep.controller";
import { DeviceTokensController } from "./device-tokens.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationsDeepService } from "./notifications-deep.service";
import { NotificationDeliveryService } from "./notification-delivery.service";
import { DeviceTokensService } from "./device-tokens.service";
import { NotificationsGateway } from "./notifications.gateway";
import { InvoiceOverdueNotificationService } from "./invoice-overdue-notification.service";
import { PipelineRiskNotificationService } from "./pipeline-risk-notification.service";

@Module({
  controllers: [
    NotificationsGeneratedController,
    NotificationsController,
    NotificationPreferencesController,
    NotificationsDeepController,
    DeviceTokensController,
  ],
  providers: [
    NotificationsGeneratedService,
    NotificationsService,
    NotificationsDeepService,
    NotificationDeliveryService,
    DeviceTokensService,
    NotificationsGateway,
    InvoiceOverdueNotificationService,
    PipelineRiskNotificationService,
  ],
  exports: [
    NotificationsGeneratedService,
    NotificationsService,
    NotificationsDeepService,
    NotificationDeliveryService,
    DeviceTokensService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
