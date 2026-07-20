import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceSettingsController } from './settings.controller';
import { FinanceService } from './finance.service';
import { FinanceEventHandler } from './finance.event-handler';
import { LeaseAccountingService } from './lease-accounting.service';
import { LeasesController } from './leases.controller';
import { AppSettingsService } from '../../common/settings/settings.service';

@Module({
  controllers: [FinanceController, LeasesController, FinanceSettingsController],
  providers: [FinanceService, FinanceEventHandler, LeaseAccountingService, AppSettingsService],
  exports: [FinanceService, LeaseAccountingService],
})
export class FinanceModule {}

