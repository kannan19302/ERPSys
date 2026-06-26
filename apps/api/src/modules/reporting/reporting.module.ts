import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { ScheduledReportsController } from './scheduled-reports.controller';
import { ScheduledReportsService } from './scheduled-reports.service';
import { ReportingEngineService } from './reporting-engine.service';
import { ReportingEngineController } from './reporting-engine.controller';

@Module({
  controllers: [ReportingController, ScheduledReportsController, ReportingEngineController],
  providers: [ReportingService, ScheduledReportsService, ReportingEngineService],
  exports: [ReportingService, ScheduledReportsService, ReportingEngineService],
})
export class ReportingModule {}
