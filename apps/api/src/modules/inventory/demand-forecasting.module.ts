import { Module } from '@nestjs/common';
import { DemandForecastingController } from './demand-forecasting.controller';
import { DemandForecastingService } from './demand-forecasting.service';

@Module({
  controllers: [DemandForecastingController],
  providers: [DemandForecastingService],
})
export class DemandForecastingModule {}
