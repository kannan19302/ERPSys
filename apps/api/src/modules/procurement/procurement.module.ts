import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementPublicController } from './procurement.public.controller';
import { ProcurementService } from './procurement.service';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { VendorPortalService } from './vendor-portal.service';

@Module({
  controllers: [ProcurementController, ProcurementPublicController, ContractsController],
  providers: [ProcurementService, ContractsService, VendorPortalService],
  exports: [ProcurementService, ContractsService, VendorPortalService],
})
export class ProcurementModule {}
