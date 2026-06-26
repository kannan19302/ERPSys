import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PricingService } from './pricing.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService, PricingService],
  exports: [SalesService, PricingService],
})
export class SalesModule {}
