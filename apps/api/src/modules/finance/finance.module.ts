import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FinanceEventHandler } from './finance.event-handler';
import { LeaseAccountingService } from './lease-accounting.service';
import { LeasesController } from './leases.controller';
import { AdvancedFinanceModule } from '../advanced-finance/advanced-finance.module';

@Module({
  imports: [AdvancedFinanceModule],
  controllers: [FinanceController, LeasesController],
  providers: [FinanceService, FinanceEventHandler, LeaseAccountingService],
  exports: [FinanceService, LeaseAccountingService],
})
export class FinanceModule {}

