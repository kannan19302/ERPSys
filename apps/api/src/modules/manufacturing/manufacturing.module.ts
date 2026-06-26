import { Module } from '@nestjs/common';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [ManufacturingController],
  providers: [ManufacturingService, SchedulingService],
  exports: [ManufacturingService, SchedulingService],
})
export class ManufacturingModule {}
