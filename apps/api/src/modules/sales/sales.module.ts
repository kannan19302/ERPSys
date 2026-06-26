import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  controllers: [SalesController, PricingController],
  providers: [SalesService, PricingService],
  exports: [SalesService, PricingService],
})
export class SalesModule {}
