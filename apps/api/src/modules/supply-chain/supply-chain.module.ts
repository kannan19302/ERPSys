import { Module } from '@nestjs/common';
import { SupplyChainController } from './supply-chain.controller';
import { SupplyChainService } from './supply-chain.service';
import { DemandPlanningService } from './services/demand-planning.service';
import { LogisticsTrackingService } from './services/logistics-tracking.service';
import { RouteOptimizationService } from './services/route-optimization.service';

@Module({
  controllers: [SupplyChainController],
  providers: [SupplyChainService, DemandPlanningService, LogisticsTrackingService, RouteOptimizationService],
  exports: [SupplyChainService, DemandPlanningService, LogisticsTrackingService, RouteOptimizationService],
})
export class SupplyChainModule {}
