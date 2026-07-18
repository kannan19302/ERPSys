import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OutboxController } from './outbox.controller';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxProcessorService } from './outbox-processor.service';
import { OutboxMetricsService } from './outbox-metrics.service';
import { OutboxHandlerRegistry } from './outbox-handler.registry';
import { OutboxService } from '@unerp/shared';

/**
 * OutboxService must be a singleton shared by every module that writes or
 * registers outbox destinations.  We provide it here as a plain-constructor
 * provider so NestJS manages its lifecycle and every injector gets the same
 * instance.
 */
function outboxServiceFactory(): OutboxService {
  const svc = new OutboxService();
  return svc;
}

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'outbox',
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
  ],
  controllers: [OutboxController],
  providers: [
    OutboxDispatcherService,
    OutboxProcessorService,
    OutboxMetricsService,
    OutboxHandlerRegistry,
    { provide: OutboxService, useFactory: outboxServiceFactory },
  ],
  exports: [
    BullModule,
    OutboxHandlerRegistry,
    OutboxMetricsService,
    OutboxService,
  ],
})
export class OutboxModule {}
