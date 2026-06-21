import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementPublicController } from './procurement.public.controller';
import { ProcurementService } from './procurement.service';

@Module({
  controllers: [ProcurementController, ProcurementPublicController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
