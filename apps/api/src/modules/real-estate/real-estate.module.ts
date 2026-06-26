import { Module } from '@nestjs/common';
import { RealEstateController } from './real-estate.controller';
import { RealEstateService } from './real-estate.service';
import { LeaseAccountingService } from './lease-accounting.service';
import { LeaseAccountingController } from './lease-accounting.controller';

@Module({
  controllers: [RealEstateController, LeaseAccountingController],
  providers: [RealEstateService, LeaseAccountingService],
  exports: [RealEstateService, LeaseAccountingService],
})
export class RealEstateModule {}
