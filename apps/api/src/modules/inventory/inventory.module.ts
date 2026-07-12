import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryWarehousesService } from './inventory-warehouses.service';
import { InventoryEventHandler } from './inventory.event-handler';
import { CostingService } from './costing.service';
import { CostingController } from './costing.controller';
import { DemandForecastingService } from './demand-forecasting.service';
import { DemandForecastingController } from './demand-forecasting.controller';
import { RtvService } from './rtv.service';
import { RtvController } from './rtv.controller';

@Module({
  controllers: [InventoryController, CostingController, DemandForecastingController, RtvController],
  providers: [InventoryService, InventoryWarehousesService, InventoryEventHandler, CostingService, DemandForecastingService, RtvService],
  exports: [InventoryService, InventoryWarehousesService, CostingService, DemandForecastingService, RtvService],
})
export class InventoryModule {}

