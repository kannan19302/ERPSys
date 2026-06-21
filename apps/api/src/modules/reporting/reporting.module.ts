import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ScheduledReportsController } from './scheduled-reports.controller';
import { ScheduledReportsService } from './scheduled-reports.service';

@Module({
  controllers: [ReportingController, ScheduledReportsController],
  providers: [ReportingService, ScheduledReportsService],
  exports: [ReportingService, ScheduledReportsService],
})
export class ReportingModule {}
