import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryEventHandler } from './inventory.event-handler';
import { CostingService } from './costing.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryEventHandler, CostingService],
  exports: [InventoryService, CostingService],
})
export class InventoryModule {}

