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
import { SalesSubscriptionService } from "./sales-subscription.service";
import { SalesSubscriptionController } from "./sales-subscription.controller";
import { SalesSpiffService } from "./sales-spiff.service";
import { SalesSpiffController } from "./sales-spiff.controller";
import { SalesAdvancedPricingService } from "./sales-advanced-pricing.service";
import { SalesAdvancedPricingController } from "./sales-advanced-pricing.controller";
import { SalesCpqController } from "./sales-cpq.controller";
import { SalesCpqExtensionService } from "./sales-cpq-extension.service";
import { SalesTerritoryService } from "./sales-territory.service";
import { SalesTerritoryController } from "./sales-territory.controller";

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
    SalesSubscriptionController,
    SalesSpiffController,
    SalesAdvancedPricingController,
    SalesCpqController,
    SalesTerritoryController,
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
    SalesSubscriptionService,
    SalesSpiffService,
    SalesAdvancedPricingService,
    SalesCpqExtensionService,
    SalesTerritoryService,
  ],
  exports: [
    SalesService,
    PricingService,
    SalesCpqService,
    SalesFulfillmentService,
    SalesSubscriptionService,
    SalesSpiffService,
    SalesAdvancedPricingService,
    SalesCpqExtensionService,
    SalesTerritoryService,
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
