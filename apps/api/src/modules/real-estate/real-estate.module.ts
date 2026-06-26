import { Module } from '@nestjs/common';
import { RealEstateController } from './real-estate.controller';
import { RealEstateService } from './real-estate.service';
import { LeaseAccountingService } from './lease-accounting.service';

@Module({
  controllers: [RealEstateController],
  providers: [RealEstateService, LeaseAccountingService],
  exports: [RealEstateService, LeaseAccountingService],
})
export class RealEstateModule {}
