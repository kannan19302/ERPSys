import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExpansionController } from './analytics-expansion.controller';
import { AnalyticsExpansionService } from './analytics-expansion.service';

@Module({
  controllers: [AnalyticsController, AnalyticsExpansionController],
  providers: [AnalyticsService, AnalyticsExpansionService],
  exports: [AnalyticsService, AnalyticsExpansionService],
})
export class AnalyticsModule {}
