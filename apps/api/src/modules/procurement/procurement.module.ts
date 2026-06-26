import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementPublicController } from './procurement.public.controller';
import { ProcurementService } from './procurement.service';
import { ContractsService } from './contracts.service';

@Module({
  controllers: [ProcurementController, ProcurementPublicController],
  providers: [ProcurementService, ContractsService],
  exports: [ProcurementService, ContractsService],
})
export class ProcurementModule {}
