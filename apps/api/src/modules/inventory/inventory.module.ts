import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryEventHandler } from './inventory.event-handler';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryEventHandler],
  exports: [InventoryService],
})
export class InventoryModule {}

