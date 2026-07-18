import { Module, OnModuleInit } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { SalesCpqService } from './sales-cpq.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { SalesExpansionController } from './sales-expansion.controller';
import { SalesOutboxHandler } from './sales-outbox.handler';
import { OutboxHandlerRegistry } from '../outbox/outbox-handler.registry';
import { OutboxService } from '@unerp/shared';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [SalesController, PricingController, SalesExpansionController],
  providers: [SalesService, PricingService, SalesCpqService, SalesFulfillmentService, SalesOutboxHandler],
  exports: [SalesService, PricingService, SalesCpqService, SalesFulfillmentService],
})
export class SalesModule implements OnModuleInit {
  constructor(
    private readonly outboxHandlerRegistry: OutboxHandlerRegistry,
    private readonly outboxService: OutboxService,
    private readonly salesOutboxHandler: SalesOutboxHandler,
  ) {}

  onModuleInit(): void {
    this.outboxService.registerDestination('ecommerce.checkout.completed', this.salesOutboxHandler.destination);
    this.outboxHandlerRegistry.register(this.salesOutboxHandler.destination, (event) =>
      this.salesOutboxHandler.handle(event),
    );
  }
}

