// @ts-nocheck
import { Module } from '@nestjs/common';
import { InventoryEnterpriseService } from './inventory-enterprise.service';
import { InventoryEnterpriseController } from './inventory-enterprise.controller';

@Module({
  controllers: [InventoryEnterpriseController],
  providers: [InventoryEnterpriseService],
  exports: [InventoryEnterpriseService],
})
export class InventoryEnterpriseModule {}
