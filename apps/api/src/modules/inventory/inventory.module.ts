import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryWarehousesService } from './inventory-warehouses.service';
import { InventoryProductsService } from './inventory-products.service';
import { InventoryQaService } from './inventory-qa.service';
import { InventoryEventHandler } from './inventory.event-handler';
import { CostingService } from './costing.service';
import { CostingController } from './costing.controller';
import { DemandForecastingService } from './demand-forecasting.service';
import { DemandForecastingController } from './demand-forecasting.controller';
import { RtvService } from './rtv.service';
import { RtvController } from './rtv.controller';
import { InventoryLaborService } from './inventory-labor.service';
import { InventoryLaborController } from './inventory-labor.controller';
import { SupplierQualityService } from './supplier-quality.service';
import { SupplierQualityController } from './supplier-quality.controller';
import { InventoryAutomationService } from './inventory-automation.service';
import { InventoryAutomationController } from './inventory-automation.controller';
import { InventoryAnalyticsService } from './inventory-analytics.service';
import { InventoryAnalyticsController } from './inventory-analytics.controller';
import { InventoryRmaService } from './inventory-rma.service';
import { InventoryRmaController } from './inventory-rma.controller';
import { InventoryWavePlanningService } from './inventory-wave-planning.service';
import { InventoryWavePlanningController } from './inventory-wave-planning.controller';

@Module({
  controllers: [
    InventoryController,
    CostingController,
    DemandForecastingController,
    RtvController,
    InventoryLaborController,
    SupplierQualityController,
    InventoryAutomationController,
    InventoryAnalyticsController,
    InventoryRmaController,
    InventoryWavePlanningController,
  ],
  providers: [
    InventoryService,
    InventoryWarehousesService,
    InventoryProductsService,
    InventoryQaService,
    InventoryEventHandler,
    CostingService,
    DemandForecastingService,
    RtvService,
    InventoryLaborService,
    SupplierQualityService,
    InventoryAutomationService,
    InventoryAnalyticsService,
    InventoryRmaService,
    InventoryWavePlanningService,
  ],
  exports: [
    InventoryService,
    InventoryWarehousesService,
    InventoryProductsService,
    InventoryQaService,
    CostingService,
    DemandForecastingService,
    RtvService,
    InventoryLaborService,
    SupplierQualityService,
    InventoryAutomationService,
    InventoryAnalyticsService,
    InventoryRmaService,
    InventoryWavePlanningService,
  ],
})
export class InventoryModule {}

