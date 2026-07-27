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
import { SalesCustomerSuccessService } from "./sales-customer-success.service";
import { SalesCustomerSuccessController } from "./sales-customer-success.controller";
import { SalesPlaybooksDeepService } from "./sales-playbooks-deep.service";
import { SalesPlaybooksDeepController } from "./sales-playbooks-deep.controller";
import { SalesIntelligenceSignalsService } from "./sales-intelligence-signals.service";
import { SalesIntelligenceSignalsController } from "./sales-intelligence-signals.controller";
import { SalesDocumentsDeepService } from "./sales-documents-deep.service";
import { SalesDocumentsDeepController } from "./sales-documents-deep.controller";
import { SalesReturnsDeepService } from "./sales-returns-deep.service";
import { SalesReturnsDeepController } from "./sales-returns-deep.controller";
import { SalesGamificationDeepService } from "./sales-gamification-deep.service";
import { SalesGamificationDeepController } from "./sales-gamification-deep.controller";
import { SalesAdvancedPricingDeepService } from "./sales-advanced-pricing-deep.service";
import { SalesAdvancedPricingDeepController } from "./sales-advanced-pricing-deep.controller";
import { SalesEnterpriseExecutionDeepService } from "./sales-enterprise-execution-deep.service";
import { SalesEnterpriseExecutionDeepController } from "./sales-enterprise-execution-deep.controller";
import { SalesQuoteCpqMasterDeepService } from "./sales-quote-cpq-master-deep.service";
import { SalesQuoteCpqMasterDeepController } from "./sales-quote-cpq-master-deep.controller";
import { SalesOmnichannelDealsDeepService } from "./sales-omnichannel-deals-deep.service";
import { SalesOmnichannelDealsDeepController } from "./sales-omnichannel-deals-deep.controller";
import { SalesGlobalRevenueOpsDeepService } from "./sales-global-revenue-ops-deep.service";
import { SalesGlobalRevenueOpsDeepController } from "./sales-global-revenue-ops-deep.controller";
import { SalesAdvancedEnterpriseCoreDeepService } from "./sales-advanced-enterprise-core-deep.service";
import { SalesAdvancedEnterpriseCoreDeepController } from "./sales-advanced-enterprise-core-deep.controller";
import { SalesDeepeningMasterSuiteService } from "./sales-deepening-master-suite.service";
import { SalesDeepeningMasterSuiteController } from "./sales-deepening-master-suite.controller";
import { SalesDeepeningUltraPackService } from "./sales-deepening-ultra-pack.service";
import { SalesDeepeningUltraPackController } from "./sales-deepening-ultra-pack.controller";
import { SalesDeepeningApexSuiteService } from "./sales-deepening-apex-suite.service";
import { SalesDeepeningApexSuiteController } from "./sales-deepening-apex-suite.controller";
import { SalesDeepeningPinnacleSuiteService } from "./sales-deepening-pinnacle-suite.service";
import { SalesDeepeningPinnacleSuiteController } from "./sales-deepening-pinnacle-suite.controller";
import { SalesDeepeningInfinityPackService } from "./sales-deepening-infinity-pack.service";
import { SalesDeepeningInfinityPackController } from "./sales-deepening-infinity-pack.controller";
import { SalesDeepeningQuantumSuiteService } from "./sales-deepening-quantum-suite.service";
import { SalesDeepeningQuantumSuiteController } from "./sales-deepening-quantum-suite.controller";
import { SalesDeepeningSuperApexService } from "./sales-deepening-super-apex.service";
import { SalesDeepeningSuperApexController } from "./sales-deepening-super-apex.controller";
import { SalesDeepeningCrownSuiteService } from "./sales-deepening-crown-suite.service";
import { SalesDeepeningCrownSuiteController } from "./sales-deepening-crown-suite.controller";
import { SalesDeepeningMilestoneGateService } from "./sales-deepening-milestone-gate.service";
import { SalesDeepeningMilestoneGateController } from "./sales-deepening-milestone-gate.controller";
import { SalesDeepeningApexFinalService } from "./sales-deepening-apex-final.service";
import { SalesDeepeningApexFinalController } from "./sales-deepening-apex-final.controller";

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
    SalesCustomerSuccessController,
    SalesPlaybooksDeepController,
    SalesIntelligenceSignalsController,
    SalesDocumentsDeepController,
    SalesReturnsDeepController,
    SalesGamificationDeepController,
    SalesAdvancedPricingDeepController,
    SalesEnterpriseExecutionDeepController,
    SalesQuoteCpqMasterDeepController,
    SalesOmnichannelDealsDeepController,
    SalesGlobalRevenueOpsDeepController,
    SalesAdvancedEnterpriseCoreDeepController,
    SalesDeepeningMasterSuiteController,
    SalesDeepeningUltraPackController,
    SalesDeepeningApexSuiteController,
    SalesDeepeningPinnacleSuiteController,
    SalesDeepeningInfinityPackController,
    SalesDeepeningQuantumSuiteController,
    SalesDeepeningSuperApexController,
    SalesDeepeningCrownSuiteController,
    SalesDeepeningMilestoneGateController,
    SalesDeepeningApexFinalController,
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
    SalesCustomerSuccessService,
    SalesPlaybooksDeepService,
    SalesIntelligenceSignalsService,
    SalesDocumentsDeepService,
    SalesReturnsDeepService,
    SalesGamificationDeepService,
    SalesAdvancedPricingDeepService,
    SalesEnterpriseExecutionDeepService,
    SalesQuoteCpqMasterDeepService,
    SalesOmnichannelDealsDeepService,
    SalesGlobalRevenueOpsDeepService,
    SalesAdvancedEnterpriseCoreDeepService,
    SalesDeepeningMasterSuiteService,
    SalesDeepeningUltraPackService,
    SalesDeepeningApexSuiteService,
    SalesDeepeningPinnacleSuiteService,
    SalesDeepeningInfinityPackService,
    SalesDeepeningQuantumSuiteService,
    SalesDeepeningSuperApexService,
    SalesDeepeningCrownSuiteService,
    SalesDeepeningMilestoneGateService,
    SalesDeepeningApexFinalService,
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
    SalesCustomerSuccessService,
    SalesPlaybooksDeepService,
    SalesIntelligenceSignalsService,
    SalesDocumentsDeepService,
    SalesReturnsDeepService,
    SalesGamificationDeepService,
    SalesAdvancedPricingDeepService,
    SalesEnterpriseExecutionDeepService,
    SalesQuoteCpqMasterDeepService,
    SalesOmnichannelDealsDeepService,
    SalesGlobalRevenueOpsDeepService,
    SalesAdvancedEnterpriseCoreDeepService,
    SalesDeepeningMasterSuiteService,
    SalesDeepeningUltraPackService,
    SalesDeepeningApexSuiteService,
    SalesDeepeningPinnacleSuiteService,
    SalesDeepeningInfinityPackService,
    SalesDeepeningQuantumSuiteService,
    SalesDeepeningSuperApexService,
    SalesDeepeningCrownSuiteService,
    SalesDeepeningMilestoneGateService,
    SalesDeepeningApexFinalService,
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
