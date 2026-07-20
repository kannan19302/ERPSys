import { Module } from '@nestjs/common';
import { SupplyChainController } from './supply-chain.controller';
import { SupplyChainService } from './supply-chain.service';
import { DemandPlanningService } from './services/demand-planning.service';
import { LogisticsTrackingService } from './services/logistics-tracking.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { VendorReturnsService } from './services/vendor-returns.service';
import { CrossDockService } from './services/cross-dock.service';
import { SupplyChainAnalyticsService } from './services/analytics.service';
import { VendorReturnsController } from './controllers/vendor-returns.controller';
import { CrossDockStationController, CrossDockOrderController } from './controllers/cross-dock.controller';
import { SupplyChainAnalyticsController } from './controllers/analytics.controller';
import { RouteOptimizationController } from './controllers/route-optimization.controller';
import { SupplyChainEventsService } from './events/supply-chain-events.service';

@Module({
  controllers: [
    SupplyChainController,
    VendorReturnsController,
    CrossDockStationController,
    CrossDockOrderController,
    SupplyChainAnalyticsController,
    RouteOptimizationController,
  ],
  providers: [
    SupplyChainService,
    DemandPlanningService,
    LogisticsTrackingService,
    RouteOptimizationService,
    VendorReturnsService,
    CrossDockService,
    SupplyChainAnalyticsService,
    SupplyChainEventsService,
  ],
  exports: [
    SupplyChainService,
    DemandPlanningService,
    LogisticsTrackingService,
    RouteOptimizationService,
    VendorReturnsService,
    CrossDockService,
    SupplyChainAnalyticsService,
  ],
})
export class SupplyChainModule {}
