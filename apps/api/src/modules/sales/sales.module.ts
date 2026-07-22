import { Module, OnModuleInit } from "@nestjs/common";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { PricingService } from "./pricing.service";
import { PricingController } from "./pricing.controller";
import { SalesCpqService } from "./sales-cpq.service";
import { SalesFulfillmentService } from "./sales-fulfillment.service";
import { SalesExpansionController } from "./sales-expansion.controller";
import { SalesOutboxHandler } from "./sales-outbox.handler";
import { OutboxHandlerRegistry } from "../outbox/outbox-handler.registry";
import { OutboxService } from "@unerp/shared";
import { OutboxModule } from "../outbox/outbox.module";
import { SalesDeepController } from "./sales-deep.controller";
import { SalesPromotionsService } from "./sales-promotions.service";
import { SalesPromotionsController } from "./sales-promotions.controller";
import { SalesPartnersService } from "./sales-partners.service";
import { SalesPartnersController } from "./sales-partners.controller";
import { SalesContractsService } from "./sales-contracts.service";
import { SalesContractsController } from "./sales-contracts.controller";
import { SalesCommissionsService } from "./sales-commissions.service";
import { SalesCommissionsController } from "./sales-commissions.controller";
import { SalesAnalyticsService } from "./sales-analytics.service";
import { SalesAnalyticsController } from "./sales-analytics.controller";
import { SalesForecastingService } from "./sales-forecasting.service";
import { SalesForecastingController } from "./sales-forecasting.controller";

@Module({
  imports: [OutboxModule],
  controllers: [
    SalesController,
    PricingController,
    SalesExpansionController,
    SalesDeepController,
    SalesPromotionsController,
    SalesPartnersController,
    SalesContractsController,
    SalesCommissionsController,
    SalesAnalyticsController,
    SalesForecastingController,
  ],
  providers: [
    SalesService,
    PricingService,
    SalesCpqService,
    SalesFulfillmentService,
    SalesOutboxHandler,
    SalesPromotionsService,
    SalesPartnersService,
    SalesContractsService,
    SalesCommissionsService,
    SalesAnalyticsService,
    SalesForecastingService,
  ],
  exports: [
    SalesService,
    PricingService,
    SalesCpqService,
    SalesFulfillmentService,
  ],
})
export class SalesModule implements OnModuleInit {
  constructor(
    private readonly outboxHandlerRegistry: OutboxHandlerRegistry,
    private readonly outboxService: OutboxService,
    private readonly salesOutboxHandler: SalesOutboxHandler,
  ) {}

  onModuleInit(): void {
    this.outboxService.registerDestination(
      "ecommerce.checkout.completed",
      this.salesOutboxHandler.destination,
    );
    this.outboxHandlerRegistry.register(
      this.salesOutboxHandler.destination,
      (event) => this.salesOutboxHandler.handle(event),
    );
  }
}
