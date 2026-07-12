import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryWarehousesService } from './inventory-warehouses.service';
import { InventoryEventHandler } from './inventory.event-handler';
import { CostingService } from './costing.service';
import { CostingController } from './costing.controller';
import { DemandForecastingService } from './demand-forecasting.service';
import { DemandForecastingController } from './demand-forecasting.controller';

@Module({
  controllers: [InventoryController, CostingController, DemandForecastingController],
  providers: [InventoryService, InventoryWarehousesService, InventoryEventHandler, CostingService, DemandForecastingService],
  exports: [InventoryService, InventoryWarehousesService, CostingService, DemandForecastingService],
})
export class InventoryModule {}

