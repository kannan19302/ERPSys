import { Module } from "@nestjs/common";
import { SupplyChainController } from "./supply-chain.controller";
import { SupplyChainService } from "./supply-chain.service";
import { DemandPlanningService } from "./services/demand-planning.service";
import { LogisticsTrackingService } from "./services/logistics-tracking.service";
import { RouteOptimizationService } from "./services/route-optimization.service";
import { VendorReturnsService } from "./services/vendor-returns.service";
import { CrossDockService } from "./services/cross-dock.service";
import { SupplyChainAnalyticsService } from "./services/analytics.service";
import { FreightManagementService } from "./services/freight-management.service";
import { SupplierCollaborationService } from "./services/supplier-collaboration.service";
import { SupplyNetworkRiskService } from "./services/supply-network-risk.service";
import { ScmControlTowerService } from "./services/scm-control-tower.service";
import { SupplierContractService } from "./services/supplier-contract.service";
import { SupplierPerformanceService } from "./services/supplier-performance.service";
import { SupplierAssessmentService } from "./services/supplier-assessment.service";
import { SupplyChainBudgetService } from "./services/supply-chain-budget.service";
import { ContainerTrackingService } from "./services/container-tracking.service";
import { CustomsDocumentService } from "./services/customs-document.service";
import { SupplierQualityService } from "./services/supplier-quality.service";
import { LaneRateService } from "./services/lane-rate.service";
import { SupplierCertificationService } from "./services/supplier-certification.service";
import { GlobalTradeService } from "./services/global-trade.service";
import { SupplyPlanningService } from "./services/supply-planning.service";
import { LogisticsExecutionService } from "./services/logistics-execution.service";
import { SupplierRiskService } from "./services/supplier-risk.service";
import { ControlTowerAdvancedService } from "./services/control-tower-advanced.service";
import { VendorReturnsController } from "./controllers/vendor-returns.controller";
import {
  CrossDockStationController,
  CrossDockOrderController,
} from "./controllers/cross-dock.controller";
import { SupplyChainAnalyticsController } from "./controllers/analytics.controller";
import { RouteOptimizationController } from "./controllers/route-optimization.controller";
import {
  FreightManagementController,
  SupplierCollaborationController,
  SupplyNetworkRiskController,
} from "./controllers/supply-chain-expansion.controller";
import { ScmControlTowerController } from "./controllers/scm-control-tower.controller";
import { DemandPlanningController } from "./controllers/demand-planning.controller";
import { SupplierContractController } from "./controllers/supplier-contract.controller";
import { SupplierPerformanceController } from "./controllers/supplier-performance.controller";
import { SupplierAssessmentController } from "./controllers/supplier-assessment.controller";
import { SupplyChainBudgetController } from "./controllers/supply-chain-budget.controller";
import { ContainerTrackingController } from "./controllers/container-tracking.controller";
import { CustomsDocumentController } from "./controllers/customs-document.controller";
import { SupplierQualityController } from "./controllers/supplier-quality.controller";
import { LaneRateController } from "./controllers/lane-rate.controller";
import { SupplierCertificationController } from "./controllers/supplier-certification.controller";
import { GlobalTradeController } from "./controllers/global-trade.controller";
import { SupplyPlanningController } from "./controllers/supply-planning.controller";
import { LogisticsExecutionController } from "./controllers/logistics-execution.controller";
import { SupplierRiskController } from "./controllers/supplier-risk.controller";
import { ControlTowerAdvancedController } from "./controllers/control-tower-advanced.controller";
import { SupplyChainEventsService } from "./events/supply-chain-events.service";

@Module({
  controllers: [
    SupplyChainController,
    VendorReturnsController,
    CrossDockStationController,
    CrossDockOrderController,
    SupplyChainAnalyticsController,
    RouteOptimizationController,
    FreightManagementController,
    SupplierCollaborationController,
    SupplyNetworkRiskController,
    ScmControlTowerController,
    DemandPlanningController,
    SupplierContractController,
    SupplierPerformanceController,
    SupplierAssessmentController,
    SupplyChainBudgetController,
    ContainerTrackingController,
    CustomsDocumentController,
    SupplierQualityController,
    LaneRateController,
    SupplierCertificationController,
    GlobalTradeController,
    SupplyPlanningController,
    LogisticsExecutionController,
    SupplierRiskController,
    ControlTowerAdvancedController,
  ],
  providers: [
    SupplyChainService,
    DemandPlanningService,
    LogisticsTrackingService,
    RouteOptimizationService,
    VendorReturnsService,
    CrossDockService,
    SupplyChainAnalyticsService,
    FreightManagementService,
    SupplierCollaborationService,
    SupplyNetworkRiskService,
    ScmControlTowerService,
    SupplyChainEventsService,
    SupplierContractService,
    SupplierPerformanceService,
    SupplierAssessmentService,
    SupplyChainBudgetService,
    ContainerTrackingService,
    CustomsDocumentService,
    SupplierQualityService,
    LaneRateService,
    SupplierCertificationService,
    GlobalTradeService,
    SupplyPlanningService,
    LogisticsExecutionService,
    SupplierRiskService,
    ControlTowerAdvancedService,
  ],
  exports: [
    SupplyChainService,
    DemandPlanningService,
    LogisticsTrackingService,
    RouteOptimizationService,
    VendorReturnsService,
    CrossDockService,
    SupplyChainAnalyticsService,
    FreightManagementService,
    SupplierCollaborationService,
    SupplyNetworkRiskService,
    ScmControlTowerService,
    SupplierContractService,
    SupplierPerformanceService,
    SupplierAssessmentService,
    SupplyChainBudgetService,
    ContainerTrackingService,
    CustomsDocumentService,
    SupplierQualityService,
    LaneRateService,
    SupplierCertificationService,
    GlobalTradeService,
    SupplyPlanningService,
    LogisticsExecutionService,
    SupplierRiskService,
    ControlTowerAdvancedService,
  ],
})
export class SupplyChainModule {}
