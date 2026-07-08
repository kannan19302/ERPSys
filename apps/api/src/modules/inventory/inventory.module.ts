import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryWarehousesService } from './inventory-warehouses.service';
import { InventoryEventHandler } from './inventory.event-handler';
import { CostingService } from './costing.service';
import { CostingController } from './costing.controller';

@Module({
  controllers: [InventoryController, CostingController],
  providers: [InventoryService, InventoryWarehousesService, InventoryEventHandler, CostingService],
  exports: [InventoryService, InventoryWarehousesService, CostingService],
})
export class InventoryModule {}

