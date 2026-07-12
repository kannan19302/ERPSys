import { Module } from '@nestjs/common';
import { WarehouseOpsController } from './warehouse-ops.controller';
import { WarehouseOpsService } from './warehouse-ops.service';

@Module({
  controllers: [WarehouseOpsController],
  providers: [WarehouseOpsService],
  exports: [WarehouseOpsService],
})
export class WarehouseOpsModule {}
