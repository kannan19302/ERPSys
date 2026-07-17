import { Module } from '@nestjs/common';
import { StockValuationController } from './stock-valuation.controller';
import { StockValuationService } from './stock-valuation.service';

@Module({
  controllers: [StockValuationController],
  providers: [StockValuationService],
  exports: [StockValuationService],
})
export class StockValuationModule {}
