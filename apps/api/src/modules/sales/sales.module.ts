import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { SalesCpqService } from './sales-cpq.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { SalesExpansionController } from './sales-expansion.controller';

@Module({
  controllers: [SalesController, PricingController, SalesExpansionController],
  providers: [SalesService, PricingService, SalesCpqService, SalesFulfillmentService],
  exports: [SalesService, PricingService, SalesCpqService, SalesFulfillmentService],
})
export class SalesModule {}

