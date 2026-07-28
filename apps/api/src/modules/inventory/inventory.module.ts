import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { InventoryWarehousesService } from "./inventory-warehouses.service";
import { InventoryProductsService } from "./inventory-products.service";
import { InventoryQaService } from "./inventory-qa.service";
import { InventoryEventHandler } from "./inventory.event-handler";
import { CostingService } from "./costing.service";
import { CostingController } from "./costing.controller";
import { InventoryEnterpriseModule } from "./inventory-enterprise.module";

import { RtvService } from "./rtv.service";
import { RtvController } from "./rtv.controller";
import { InventoryLaborService } from "./inventory-labor.service";
import { InventoryLaborController } from "./inventory-labor.controller";
import { SupplierQualityService } from "./supplier-quality.service";
import { SupplierQualityController } from "./supplier-quality.controller";
import { InventoryAutomationService } from "./inventory-automation.service";
import { InventoryAutomationController } from "./inventory-automation.controller";
import { InventoryAnalyticsService } from "./inventory-analytics.service";
import { InventoryAnalyticsController } from "./inventory-analytics.controller";
import { InventoryRmaService } from "./inventory-rma.service";
import { InventoryRmaController } from "./inventory-rma.controller";
import { InventoryWavePlanningService } from "./inventory-wave-planning.service";
import { InventoryWavePlanningController } from "./inventory-wave-planning.controller";
import { InventoryWarehouseSlottingDeepService } from "./inventory-warehouse-slotting-deep.service";
import { InventoryWarehouseSlottingDeepController } from "./inventory-warehouse-slotting-deep.controller";
import { InventoryLpnTrackingDeepService } from "./inventory-lpn-tracking-deep.service";
import { InventoryLpnTrackingDeepController } from "./inventory-lpn-tracking-deep.controller";
import { InventorySerialBatchGenealogyDeepService } from "./inventory-serial-batch-genealogy-deep.service";
import { InventorySerialBatchGenealogyDeepController } from "./inventory-serial-batch-genealogy-deep.controller";
import { InventoryCycleCountingDeepService } from "./inventory-cycle-counting-deep.service";
import { InventoryCycleCountingDeepController } from "./inventory-cycle-counting-deep.controller";
// Phase 2 — Deep Feature Packs (Push Inventory to 1500+)
import { InventoryAdvancedWmsService } from "./inventory-advanced-wms.service";
import { InventoryAdvancedWmsController } from "./inventory-advanced-wms.controller";
import { InventorySupplyChainService } from "./inventory-supply-chain.service";
import { InventorySupplyChainController } from "./inventory-supply-chain.controller";
import { InventoryQualityComplianceService } from "./inventory-quality-compliance.service";
import { InventoryQualityComplianceController } from "./inventory-quality-compliance.controller";
import { InventoryIntelligenceService } from "./inventory-intelligence.service";
import { InventoryIntelligenceController } from "./inventory-intelligence.controller";
import { InventoryDeepExpansionBulkController } from "./inventory-deep-expansion-bulk.controller";

@Module({
  imports: [InventoryEnterpriseModule],
  controllers: [
    InventoryController,
    CostingController,
    RtvController,
    InventoryLaborController,
    SupplierQualityController,
    InventoryAutomationController,
    InventoryAnalyticsController,
    InventoryRmaController,
    InventoryWavePlanningController,
    InventoryWarehouseSlottingDeepController,
    InventoryLpnTrackingDeepController,
    InventorySerialBatchGenealogyDeepController,
    InventoryCycleCountingDeepController,
    InventoryAdvancedWmsController,
    InventorySupplyChainController,
    InventoryQualityComplianceController,
    InventoryIntelligenceController,
    InventoryDeepExpansionBulkController,
  ],
  providers: [
    InventoryService,
    InventoryWarehousesService,
    InventoryProductsService,
    InventoryQaService,
    InventoryEventHandler,
    CostingService,
    RtvService,
    InventoryLaborService,
    SupplierQualityService,
    InventoryAutomationService,
    InventoryAnalyticsService,
    InventoryRmaService,
    InventoryWavePlanningService,
    InventoryWarehouseSlottingDeepService,
    InventoryLpnTrackingDeepService,
    InventorySerialBatchGenealogyDeepService,
    InventoryCycleCountingDeepService,
    InventoryAdvancedWmsService,
    InventorySupplyChainService,
  ],
  exports: [
    InventoryService,
    InventoryWarehousesService,
    InventoryProductsService,
    InventoryQaService,
    CostingService,
    RtvService,
    InventoryLaborService,
    SupplierQualityService,
    InventoryAutomationService,
    InventoryAnalyticsService,
    InventoryRmaService,
    InventoryWavePlanningService,
    InventoryWarehouseSlottingDeepService,
    InventoryLpnTrackingDeepService,
    InventorySerialBatchGenealogyDeepService,
    InventoryCycleCountingDeepService,
    InventoryAdvancedWmsService,
    InventorySupplyChainService,
    InventoryQualityComplianceService,
    InventoryIntelligenceService,
  ],
})
export class InventoryModule {}
