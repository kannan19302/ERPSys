import { Module } from '@nestjs/common';
import { ManufacturingController } from './manufacturing.controller';
import { ManufacturingService } from './manufacturing.service';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { ManufacturingExpansionController } from './manufacturing-expansion.controller';
import { ManufacturingExpansionService } from './manufacturing-expansion.service';

@Module({
  controllers: [ManufacturingController, SchedulingController, ManufacturingExpansionController],
  providers: [ManufacturingService, SchedulingService, ManufacturingExpansionService],
  exports: [ManufacturingService, SchedulingService, ManufacturingExpansionService],
})
export class ManufacturingModule {}
