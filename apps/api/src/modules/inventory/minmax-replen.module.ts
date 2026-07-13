import { Module } from '@nestjs/common';
import { MinMaxReplenController } from './minmax-replen.controller';
import { MinMaxReplenService } from './minmax-replen.service';

@Module({
  controllers: [MinMaxReplenController],
  providers: [MinMaxReplenService],
  exports: [MinMaxReplenService],
})
export class MinMaxReplenModule {}
