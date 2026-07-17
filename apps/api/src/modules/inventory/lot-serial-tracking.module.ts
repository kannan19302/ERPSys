import { Module } from '@nestjs/common';
import { LotSerialTrackingController } from './lot-serial-tracking.controller';
import { LotSerialTrackingService } from './lot-serial-tracking.service';

@Module({
  controllers: [LotSerialTrackingController],
  providers: [LotSerialTrackingService],
  exports: [LotSerialTrackingService],
})
export class LotSerialTrackingModule {}
