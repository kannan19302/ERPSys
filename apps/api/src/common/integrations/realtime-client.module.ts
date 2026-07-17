import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import { NotificationsGateway } from '../../modules/notifications/notifications.gateway';
import { RealtimeClient } from './realtime-client';

/** Composition-layer adapter for the platform WebSocket publisher. */
@Module({
  imports: [NotificationsModule],
  providers: [{ provide: RealtimeClient, useExisting: NotificationsGateway }],
  exports: [RealtimeClient],
})
export class RealtimeClientModule {}
