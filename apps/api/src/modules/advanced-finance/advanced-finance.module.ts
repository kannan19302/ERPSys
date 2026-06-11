import { Module } from '@nestjs/common';
import { AdvancedFinanceController } from './advanced-finance.controller';
import { AdvancedFinanceService } from './advanced-finance.service';

@Module({
  controllers: [AdvancedFinanceController],
  providers: [AdvancedFinanceService],
  exports: [AdvancedFinanceService],
})
export class AdvancedFinanceModule {}
