import { Module } from '@nestjs/common';
import { InventoryLogisticsController } from './inventory-logistics.controller';
import { InventoryLogisticsService } from './inventory-logistics.service';

@Module({
  controllers: [InventoryLogisticsController],
  providers: [InventoryLogisticsService],
  exports: [InventoryLogisticsService],
})
export class InventoryLogisticsModule {}
