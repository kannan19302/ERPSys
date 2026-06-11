import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceEventHandler } from './finance.event-handler';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, FinanceEventHandler],
  exports: [FinanceService],
})
export class FinanceModule {}

