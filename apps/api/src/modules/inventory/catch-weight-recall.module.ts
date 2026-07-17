import { Module } from '@nestjs/common';
import { CatchWeightRecallController } from './catch-weight-recall.controller';
import { CatchWeightRecallService } from './catch-weight-recall.service';

@Module({
  controllers: [CatchWeightRecallController],
  providers: [CatchWeightRecallService],
  exports: [CatchWeightRecallService],
})
export class CatchWeightRecallModule {}
